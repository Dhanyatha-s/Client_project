/**
 * useSignalMetrics.js
 * ─────────────────────────────────────────────────────────────────────────────
 * FIX #1: HR was a manual slider — now computed from the actual signal.
 * FIX #2: QTc was derived from the slider HR — now derived from signal HR.
 *
 * HOW IT WORKS
 * ────────────
 * 1. Takes the Lead II buffer (Float32Array) from leadsMap.
 * 2. Runs a lightweight Pan-Tompkins-inspired R-peak detector:
 *      a. High-pass filter  (remove baseline wander)
 *      b. Differentiate + square (emphasise QRS slope)
 *      c. Moving-window integration (smooth energy envelope)
 *      d. Adaptive threshold (60% of local max, refractory 300 ms)
 * 3. Computes median RR → HR in bpm.
 * 4. Estimates QT from the T-wave offset on the same lead.
 * 5. Returns { hr, rr, qt, qtc, sdnn, rmssd } — all from real data.
 *    Falls back to formula-based values if buffer is too short.
 *
 * NOTE: This runs synchronously on the 10-second window (~2500 samples).
 * For a full 48-hour analysis, move this to a Web Worker (Phase 2).
 */

import { useMemo } from "react";

const SR_DEFAULT = 250;

// ── Step 1: Simple high-pass FIR (removes baseline wander < 0.5 Hz) ─────────
function highPass(buf) {
  // Moving-average subtraction, window = 0.6 s worth of samples
  const win = Math.round(0.6 * SR_DEFAULT);
  const out  = new Float32Array(buf.length);
  let   sum  = 0;
  for (let i = 0; i < win && i < buf.length; i++) sum += buf[i];
  for (let i = 0; i < buf.length; i++) {
    const add = i + Math.floor(win / 2) < buf.length ? buf[i + Math.floor(win / 2)] : 0;
    const rem = i - Math.ceil(win / 2) >= 0 ? buf[i - Math.ceil(win / 2)] : 0;
    sum = sum + add - rem;
    out[i] = buf[i] - sum / win;
  }
  return out;
}

// ── Step 2: Differentiate + square ──────────────────────────────────────────
function diffSquare(buf) {
  const out = new Float32Array(buf.length);
  for (let i = 2; i < buf.length - 2; i++) {
    const d = (-buf[i - 2] - 2 * buf[i - 1] + 2 * buf[i + 1] + buf[i + 2]) / 8;
    out[i]  = d * d;
  }
  return out;
}

// ── Step 3: Moving-window integration (~150 ms window) ──────────────────────
function mwi(buf) {
  const win = Math.round(0.15 * SR_DEFAULT);
  const out  = new Float32Array(buf.length);
  let   sum  = 0;
  for (let i = 0; i < buf.length; i++) {
    sum += buf[i];
    if (i >= win) sum -= buf[i - win];
    out[i] = sum / win;
  }
  return out;
}

// ── Step 4: R-peak detection on processed signal ─────────────────────────────
function detectPeaks(processed, sr) {
  const minDist  = Math.round(sr * 0.30);  // 300 ms refractory
  const lookback = Math.round(sr * 1.5);   // 1.5 s adaptive threshold window
  const peaks    = [];
  let lastPeak   = -minDist;

  for (let i = minDist; i < processed.length - minDist; i++) {
    // Adaptive threshold: 60% of max in lookback window
    let localMax = 0;
    const start = Math.max(0, i - lookback);
    for (let j = start; j < i; j++) {
      if (processed[j] > localMax) localMax = processed[j];
    }
    const thresh = localMax * 0.6;

    if (
      processed[i] > thresh &&
      processed[i] >= processed[i - 1] &&
      processed[i] >= processed[i + 1] &&
      i - lastPeak >= minDist
    ) {
      peaks.push(i);
      lastPeak = i;
    }
  }
  return peaks;
}

// ── Step 5: Estimate T-wave end (crude but functional) ───────────────────────
// Looks for the point after the T-wave peak where signal returns to baseline.
function estimateQTend(buf, rPeakIdx, sr) {
  const searchStart = rPeakIdx + Math.round(sr * 0.08); // skip QRS
  const searchEnd   = Math.min(buf.length - 1, rPeakIdx + Math.round(sr * 0.60)); // max 600ms
  if (searchEnd <= searchStart) return null;

  // Find T-wave peak
  let tPeakIdx = searchStart, tPeakVal = buf[searchStart];
  for (let i = searchStart; i < searchEnd; i++) {
    if (Math.abs(buf[i]) > Math.abs(tPeakVal)) { tPeakVal = buf[i]; tPeakIdx = i; }
  }

  // Find return to baseline after T-peak (first crossing of 10% of T amplitude)
  const baseThresh = Math.abs(tPeakVal) * 0.10;
  for (let i = tPeakIdx; i < searchEnd; i++) {
    if (Math.abs(buf[i]) <= baseThresh) return i;
  }
  return searchEnd; // fallback
}

// ── Public: compute all metrics from a Lead II buffer ───────────────────────
export function computeSignalMetrics(buf, sr = SR_DEFAULT) {
  const fallback = { hr: null, rr: null, qt: null, qtc: null, sdnn: null, rmssd: null, peaks: [] };

  if (!buf || buf.length < sr * 2) return fallback;  // need at least 2 seconds

  // Pipeline
  const hp        = highPass(buf);
  const ds        = diffSquare(hp);
  const integrated = mwi(ds);
  const peakIdxs  = detectPeaks(integrated, sr);

  if (peakIdxs.length < 2) return fallback;

  // RR intervals in seconds
  const rrArr = [];
  for (let k = 1; k < peakIdxs.length; k++) {
    rrArr.push((peakIdxs[k] - peakIdxs[k - 1]) / sr);
  }

  // Median RR (robust to ectopics)
  const sorted = [...rrArr].sort((a, b) => a - b);
  const medRR  = sorted[Math.floor(sorted.length / 2)];
  const hr     = Math.round(60 / medRR);

  // Mean RR for HRV
  const meanRR = rrArr.reduce((s, v) => s + v, 0) / rrArr.length;

  // SDNN — standard deviation of NN intervals (time-domain HRV)
  const sdnn = Math.sqrt(
    rrArr.reduce((s, v) => s + Math.pow(v - meanRR, 2), 0) / rrArr.length
  ) * 1000;  // ms

  // RMSSD — root mean square of successive differences
  let sssd = 0;
  for (let k = 1; k < rrArr.length; k++) sssd += Math.pow(rrArr[k] - rrArr[k - 1], 2);
  const rmssd = Math.sqrt(sssd / (rrArr.length - 1)) * 1000;  // ms

  // QT interval from median beat
  const medPeakIdx = peakIdxs[Math.floor(peakIdxs.length / 2)];
  const qtEnd      = estimateQTend(buf, medPeakIdx, sr);
  const qt         = qtEnd ? (qtEnd - medPeakIdx) / sr : medRR * 0.40;

  // QTc — Bazett: QTc = QT / √RR
  const qtc = qt / Math.sqrt(medRR);

  return {
    hr:    isFinite(hr)    ? hr    : null,
    rr:    +medRR.toFixed(3),
    qt:    +qt.toFixed(3),
    qtc:   +qtc.toFixed(3),
    sdnn:  +sdnn.toFixed(1),
    rmssd: +rmssd.toFixed(1),
    peaks: peakIdxs,
  };
}

// ── React hook wrapper ────────────────────────────────────────────────────────
export default function useSignalMetrics(leadsMap, sr = SR_DEFAULT) {
  return useMemo(() => {
    // Prefer Lead II; fall back to I, then first available
    const buf = leadsMap?.get("II") ?? leadsMap?.get("I") ?? [...(leadsMap?.values() ?? [])][0];
    return computeSignalMetrics(buf, sr);
  }, [leadsMap, sr]);
}
