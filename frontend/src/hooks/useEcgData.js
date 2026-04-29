/**
 * useEcgData.js  —  Dynamic lead-aware data hook
 * ─────────────────────────────────────────────────────────────────────────────
 * No longer accepts `mode` or a fixed lead count.
 * The API returns `lead_names` with every response.
 * The hook exposes `leadNames` so ECGViewer/ECGCanvas can drive layout from it.
 *
 * Chunking: 30-second blocks cached; visible window = BASE_WINDOW_SEC / zoom.
 * Pre-fetch: triggered when < 2 visible windows remain in cache.
 */

import { useState, useEffect, useRef, useCallback } from "react";

const BASE_WINDOW_SEC = 10;
const CHUNK_SEC       = 30;
const SR_DEFAULT      = 250;

async function fetchChunk(patientId, startSec, durationSec) {
  const dur = Math.min(durationSec, 30);
  const url = `/api/ecg/${patientId}?start=${startSec.toFixed(2)}&duration=${dur}`;
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      `${res.status} — ${body.error || res.statusText}` +
      (body.data_dir  ? `\ndata_dir: ${body.data_dir}`             : "") +
      (body.available ? `\navailable: ${body.available.join(", ")}` : "")
    );
  }
  return res.json();
}

/** Build Map<leadName, Float32Array> from API response */
function buildMap(data) {
  const map = new Map();
  for (const [name, raw] of Object.entries(data.leads ?? {})) {
    if (raw?.length > 0) map.set(name, new Float32Array(raw));
  }
  return map;
}

/** Slice winSec seconds from a cached chunk */
function sliceWindow(chunkMap, windowStart, chunkStart, sr, winSec) {
  const offset   = Math.max(0, Math.round((windowStart - chunkStart) * sr));
  const winSamps = Math.ceil(winSec * sr);
  const out      = new Map();
  for (const [name, buf] of chunkMap) {
    const end = Math.min(offset + winSamps, buf.length);
    out.set(name, buf.slice(offset, end));
  }
  return out;
}

export default function useEcgData(patientId, timeOffset, zoom = 1) {
  const [leadsMap,   setLeadsMap]   = useState(null);
  const [leadNames,  setLeadNames]  = useState([]);   // detected from API
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);
  const [totalSec,   setTotalSec]   = useState(172800);

  const cacheRef = useRef(null);  // { chunkStart, map, sr, patientId, leadNames }
  const abortRef = useRef(null);

  const windowSec = BASE_WINDOW_SEC / zoom;

  const loadChunk = useCallback(async (pid, chunkStart) => {
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const data = await fetchChunk(pid, chunkStart, CHUNK_SEC);
    if (ctrl.signal.aborted) return null;

    const sr    = data.sr ?? SR_DEFAULT;
    const names = data.lead_names ?? [];
    const map   = buildMap(data);

    if (map.size === 0) throw new Error("No lead data returned from API");

    cacheRef.current = { chunkStart, map, sr, patientId: pid, leadNames: names };
    setLeadNames(names);
    if (data.total_sec) setTotalSec(Math.floor(data.total_sec));
    return cacheRef.current;
  }, []);

  useEffect(() => {
    if (!patientId) return;

    const chunkStart = Math.floor(timeOffset / CHUNK_SEC) * CHUNK_SEC;
    const cache      = cacheRef.current;

    // Serve from cache if valid for this patient + chunk
    if (
      cache &&
      cache.patientId === patientId &&
      timeOffset >= cache.chunkStart &&
      timeOffset <  cache.chunkStart + CHUNK_SEC - windowSec
    ) {
      const win = sliceWindow(cache.map, timeOffset, cache.chunkStart, cache.sr, windowSec);
      setLeadsMap(win);
      setError(null);

      // Pre-fetch next chunk silently
      const remaining = (cache.chunkStart + CHUNK_SEC) - timeOffset;
      if (remaining < windowSec * 2) {
        loadChunk(patientId, cache.chunkStart + CHUNK_SEC).catch(() => {});
      }
      return;
    }

    setLoading(true);
    setError(null);

    loadChunk(patientId, chunkStart)
      .then(c => {
        if (!c) return;
        const win = sliceWindow(c.map, timeOffset, c.chunkStart, c.sr, windowSec);
        setLeadsMap(win);
        setLoading(false);
      })
      .catch(err => {
        if (err.name === "AbortError") return;
        console.error("[useEcgData]", err.message);
        setError(err.message);
        setLoading(false);
      });

    return () => { if (abortRef.current) abortRef.current.abort(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId, Math.floor(timeOffset), zoom]);

  // Reset cache on patient change
  useEffect(() => {
    cacheRef.current = null;
    setLeadsMap(null);
    setLeadNames([]);
  }, [patientId]);

  return { leadsMap, leadNames, loading, error, totalSec, windowSec };
}
