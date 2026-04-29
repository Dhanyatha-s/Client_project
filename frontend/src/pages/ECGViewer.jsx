/**
 * ECGViewer.jsx  —  Dynamic lead-driven ECG viewer
 * ─────────────────────────────────────────────────────────────────────────────
 * No `mode` state. No LeadToggle.
 * `leadNames` comes from the API via useEcgData.
 * ECGCanvas resolves its own layout from those names.
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import ECGCanvas        from "../components/ECGCanvas";
import PatientBanner    from "../components/PatientBanner";
import TimelineBar      from "../components/TimelineBar";
import LoadingOverlay   from "../components/LoadingOverlay";
import useEcgData       from "../hooks/useEcgData";
import useSignalMetrics from "../hooks/useSignalMetrics";
import { useApp }       from "../context/AppContext";

const MONO = { fontFamily: "'Share Tech Mono', monospace" };
const ZOOM_STEPS = [0.5, 0.75, 1, 1.5, 2, 3];

export default function ECGViewer({ patient, tabColor = "#4f8ef7" }) {
  const [timeOffset,  setTimeOffset]  = useState(0);
  const [playing,     setPlaying]     = useState(false);
  const [showMarkers, setShowMarkers] = useState(true);
  const [zoom,        setZoom]        = useState(1);
  const [manualHr,    setManualHr]    = useState(null);

  const { settings } = useApp();

  // ── Data — no mode, no nLeads ──────────────────────────────────────────────
  const { leadsMap, leadNames, loading, error, totalSec, windowSec } = useEcgData(
    patient?.id, timeOffset, zoom
  );

  // ── Signal metrics from real waveform ─────────────────────────────────────
  const metrics = useSignalMetrics(leadsMap, 250);
  const hr      = (metrics.hr && !manualHr) ? metrics.hr : (manualHr ?? 72);

  // ── Zoom ──────────────────────────────────────────────────────────────────
  const zoomIdx = ZOOM_STEPS.indexOf(zoom);
  const zoomIn    = () => setZoom(ZOOM_STEPS[Math.min(zoomIdx+1, ZOOM_STEPS.length-1)]);
  const zoomOut   = () => setZoom(ZOOM_STEPS[Math.max(zoomIdx-1, 0)]);
  const zoomReset = () => setZoom(1);

  // ── RAF playback ──────────────────────────────────────────────────────────
  const playStartWallRef = useRef(null);
  const playStartEcgRef  = useRef(0);
  const rafRef           = useRef(null);

  const stopPlay = useCallback(() => {
    setPlaying(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    playStartWallRef.current = null;
  }, []);

  useEffect(() => {
    if (!playing) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }
    playStartWallRef.current = performance.now();
    playStartEcgRef.current  = timeOffset;

    const step = (now) => {
      const elapsed    = (now - playStartWallRef.current) / 1000;
      const nextOffset = playStartEcgRef.current + elapsed;
      if (nextOffset >= totalSec - windowSec) { stopPlay(); return; }
      setTimeOffset(nextOffset);
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, totalSec]);

  if (!patient) return (
    <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <span style={{ ...MONO, fontSize:12, color:"#2a2a2a" }}>No patient selected</span>
    </div>
  );

  // Lead count description for the info badge
  const leadDesc = leadNames.length === 0
    ? "detecting…"
    : `${leadNames.length}-Lead  ·  ${leadNames.join(" · ")}`;

  return (
    <div style={{ display:"flex", flexDirection:"column", flex:1, overflow:"hidden", minHeight:0 }}>

      <PatientBanner
        patient={patient}
        hr={hr}
        leadCount={leadNames.length}
        metrics={metrics}
        fromSignal={!!metrics.hr && !manualHr}
      />

      {/* Toolbar */}
      <div style={{
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"6px 14px", background:"#0b0b0b", borderBottom:"1px solid #181818",
        flexShrink:0, flexWrap:"wrap", gap:6,
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>

          {/* ── Dynamic leads info badge — replaces LeadToggle ── */}
          <div style={{
            display:"flex", alignItems:"center", gap:6,
            background:"rgba(79,142,247,0.07)",
            border:"1px solid rgba(79,142,247,0.2)",
            borderRadius:5, padding:"3px 10px",
          }}>
            <span style={{ ...MONO, fontSize:9, color:"#4f8ef7", letterSpacing:"0.06em" }}>
              ECG
            </span>
            <span style={{ ...MONO, fontSize:10, color:"#6a9ff7" }}>
              {leadDesc}
            </span>
          </div>

          {/* Markers toggle */}
          <button onClick={() => setShowMarkers(v => !v)}
            style={{ ...MONO, fontSize:10, cursor:"pointer", borderRadius:4,
              padding:"3px 8px",
              background: showMarkers ? "rgba(79,142,247,0.1)" : "transparent",
              border: showMarkers ? "1px solid rgba(79,142,247,0.3)" : "1px solid #1e1e1e",
              color: showMarkers ? "#4f8ef7" : "#333" }}>
            ▲ Markers {showMarkers ? "ON" : "OFF"}
          </button>

          {/* Zoom */}
          <div style={{ display:"flex", alignItems:"center", gap:3,
            paddingLeft:8, borderLeft:"1px solid #1a1a1a" }}>
            <button onClick={zoomOut} disabled={zoom === ZOOM_STEPS[0]}
              style={{ ...MONO, fontSize:13, background:"transparent",
                border:"1px solid #1e1e1e",
                color: zoom===ZOOM_STEPS[0] ? "#222":"#666",
                borderRadius:4, padding:"1px 7px", cursor:"pointer" }}>−</button>

            <button onClick={zoomReset}
              style={{ ...MONO, fontSize:9, minWidth:40, textAlign:"center",
                background: zoom===1?"rgba(79,142,247,0.1)":"transparent",
                border: zoom===1?"1px solid rgba(79,142,247,0.3)":"1px solid #1e1e1e",
                color: zoom===1?"#4f8ef7":"#555",
                borderRadius:4, padding:"2px 6px", cursor:"pointer" }}>
              {zoom===1 ? "1×" : `${zoom}×`}
            </button>

            <button onClick={zoomIn} disabled={zoom===ZOOM_STEPS[ZOOM_STEPS.length-1]}
              style={{ ...MONO, fontSize:13, background:"transparent",
                border:"1px solid #1e1e1e",
                color: zoom===ZOOM_STEPS[ZOOM_STEPS.length-1]?"#222":"#666",
                borderRadius:4, padding:"1px 7px", cursor:"pointer" }}>+</button>

            <span style={{ ...MONO, fontSize:9, color:"#2a2a2a", marginLeft:2 }}>
              {(25*zoom).toFixed(0)} mm/s
            </span>
          </div>

          {/* HR source badge */}
          {metrics.hr && (
            <div style={{ paddingLeft:8, borderLeft:"1px solid #1a1a1a",
              display:"flex", alignItems:"center", gap:5 }}>
              <span style={{ ...MONO, fontSize:9,
                background:"rgba(52,199,123,0.08)",
                border:"1px solid rgba(52,199,123,0.25)",
                color:"#34c77b", padding:"2px 7px", borderRadius:3 }}>
                ⚡ HR from signal
              </span>
              <button onClick={() => setManualHr(manualHr ? null : hr)}
                style={{ ...MONO, fontSize:9, background:"transparent",
                  border:"1px solid #1e1e1e", color:"#333",
                  borderRadius:3, padding:"2px 6px", cursor:"pointer" }}>
                {manualHr ? "use signal" : "override"}
              </button>
            </div>
          )}
        </div>

        {/* Status */}
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {error && (
            <span style={{ ...MONO, fontSize:9, color:"#ff5040",
              background:"rgba(255,80,64,0.08)", border:"1px solid rgba(255,80,64,0.2)",
              padding:"2px 8px", borderRadius:3, maxWidth:260,
              overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              ⚠ {error.split("\n")[0]}
            </span>
          )}
          <span style={{ display:"inline-block", width:6, height:6, borderRadius:"50%",
            background: playing ? tabColor : "#222",
            animation: playing?"livePulse 1.1s ease-in-out infinite":"none" }} />
          <span style={{ ...MONO, fontSize:10, color: playing ? tabColor : "#2a2a2a" }}>
            {playing ? "PLAYING" : "PAUSED"}
          </span>
        </div>
      </div>

      {/* Canvas */}
      <div style={{ flex:1, overflow:"auto", position:"relative",
        background:"#0c0c0c", padding:"8px 8px 0" }}>
        <LoadingOverlay visible={loading && !leadsMap} />
        <ECGCanvas
          leadsMap={leadsMap}
          leadNames={leadNames}
          sr={250}
          zoom={zoom}
          traceThickness={settings?.traceThickness ?? 1.5}
          showMarkers={showMarkers}
          precomputedPeaks={metrics.peaks}
          signalMetrics={metrics}
          error={error}
        />
      </div>

      <TimelineBar
        timeOffset={timeOffset}
        setTimeOffset={t => { stopPlay(); setTimeOffset(t); }}
        totalDuration={totalSec}
        hr={hr}
        setHr={v => setManualHr(v)}
        showManualHr={!metrics.hr || !!manualHr}
        playing={playing}
        setPlaying={setPlaying}
        windowSec={windowSec}
      />

      <style>{`
        @keyframes livePulse{
          0%,100%{opacity:1;transform:scale(1);}
          50%{opacity:0.3;transform:scale(0.75);}
        }
      `}</style>
    </div>
  );
}
