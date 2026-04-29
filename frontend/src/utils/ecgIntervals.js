/**
 * ecgIntervals.js
 * Compute clinical ECG intervals from heart rate.
 * Used in the header stats panel.
 */

export function computeIntervals(hr) {
  const rr  = 60 / hr;
  const pr  = Math.min(0.20, Math.max(0.12, 0.16 + (72 - hr) * 0.0005));
  const qrs = 0.08;
  const qt  = 0.39 * Math.sqrt(rr);
  const qtc = qt / Math.sqrt(rr);   // Bazett

  return {
    rr:  +rr.toFixed(3),
    pr:  +pr.toFixed(3),
    qrs: +qrs.toFixed(3),
    qt:  +qt.toFixed(3),
    qtc: +qtc.toFixed(3),
  };
}

/** Detect QTc prolongation risk */
export function qtcStatus(qtcSec) {
  const ms = qtcSec * 1000;
  if (ms > 500) return { label: "Prolonged", color: "#ff4d4f" };
  if (ms > 450) return { label: "Borderline", color: "#faad14" };
  return { label: "Normal", color: "#00d68f" };
}
