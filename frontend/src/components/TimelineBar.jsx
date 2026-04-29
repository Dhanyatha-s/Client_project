/**
 * TimelineBar.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * FIX #4 (partial): HR slider is now hidden when real signal HR is available.
 *                   It reappears as "override" when manually triggered.
 *
 * Also added: window size indicator showing how many seconds are currently
 * visible (changes with zoom).
 */

import React from "react";

const MONO = { fontFamily: "'Share Tech Mono', monospace" };

function fmtHMS(s) {
  const h   = Math.floor(s / 3600).toString().padStart(2, "0");
  const m   = Math.floor((s % 3600) / 60).toString().padStart(2, "0");
  const sec = Math.floor(s % 60).toString().padStart(2, "0");
  return `${h}:${m}:${sec}`;
}

function Btn({ children, onClick, active, disabled, title }) {
  return (
    <button onClick={onClick} title={title} disabled={disabled} style={{
      ...MONO, fontSize:11, padding:"4px 8px", cursor: disabled ? "default" : "pointer",
      background: active ? "rgba(79,142,247,0.12)" : "transparent",
      color: disabled ? "#222" : active ? "#4f8ef7" : "#3a3a3a",
      border: active ? "1px solid rgba(79,142,247,0.3)" : "1px solid #1e1e1e",
      borderRadius:4, transition:"all 0.1s", letterSpacing:"0.04em",
      opacity: disabled ? 0.4 : 1,
    }}>{children}</button>
  );
}

function Sep() {
  return <div style={{ width:1, height:20, background:"#181818", flexShrink:0 }} />;
}

export default function TimelineBar({
  timeOffset, setTimeOffset, totalDuration,
  hr, setHr, showManualHr,
  playing, setPlaying,
  windowSec = 10,
}) {
  const step = d => setTimeOffset(Math.max(0, Math.min(totalDuration - windowSec, timeOffset + d)));

  return (
    <div style={{ background:"#0a0a0a", borderTop:"1px solid #161616",
      padding:"7px 14px", display:"flex", alignItems:"center",
      gap:8, flexWrap:"wrap", flexShrink:0 }}>

      {/* Playback buttons */}
      <div style={{ display:"flex", gap:4, alignItems:"center" }}>
        <Btn onClick={() => step(-60)}  title="Back 1 min">← 1m</Btn>
        <Btn onClick={() => step(-10)}  title="Back 10s">← 10s</Btn>
        <Btn
          onClick={() => setPlaying(p => !p)}
          active={playing}
          title="Play / pause"
        >
          {playing ? "⏸ PAUSE" : "▶ PLAY"}
        </Btn>
        <Btn onClick={() => step(10)}   title="Forward 10s">10s →</Btn>
        <Btn onClick={() => step(60)}   title="Forward 1 min">1m →</Btn>
      </div>

      <Sep />

      {/* Time position */}
      <span style={{ ...MONO, fontSize:12, color:"#3a3a3a", minWidth:68, flexShrink:0 }}>
        {fmtHMS(timeOffset)}
      </span>

      {/* Scrubber */}
      <input type="range" min={0} max={totalDuration} step={0.5}
        value={timeOffset}
        onChange={e => setTimeOffset(+e.target.value)}
        style={{ flex:1, minWidth:80, accentColor:"#4f8ef7" }}
      />

      <span style={{ ...MONO, fontSize:11, color:"#282828", minWidth:68, flexShrink:0 }}>
        {fmtHMS(totalDuration)}
      </span>

      {/* Window size indicator */}
      <span style={{ ...MONO, fontSize:9,
        border:"1px solid #1a1a1a", color:"#2a2a2a",
        padding:"2px 6px", borderRadius:3, flexShrink:0 }}>
        {windowSec.toFixed(1)}s view
      </span>

      <Sep />

      {/* HR slider — only shown when in manual mode */}
      {showManualHr ? (
        <div style={{ display:"flex", alignItems:"center", gap:7 }}>
          <span style={{ ...MONO, fontSize:11, color:"#3a3a3a" }}>HR</span>
          <input type="range" min={30} max={200} step={1} value={hr}
            onChange={e => setHr(+e.target.value)}
            style={{ width:90, accentColor:"#e8614a" }}
          />
          <span style={{ ...MONO, fontSize:13, color:"#e8614a", minWidth:26 }}>{hr}</span>
          <span style={{ ...MONO, fontSize:10, color:"#2a2a2a" }}>bpm</span>
        </div>
      ) : (
        /* When signal HR is active, show a read-only badge instead */
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <span style={{ ...MONO, fontSize:9, color:"#2a2a2a" }}>HR</span>
          <span style={{ ...MONO, fontSize:14, color:"#e8614a" }}>{hr}</span>
          <span style={{ ...MONO, fontSize:9, color:"#2a2a2a" }}>bpm</span>
          <span style={{ ...MONO, fontSize:8,
            background:"rgba(52,199,123,0.08)",
            border:"1px solid rgba(52,199,123,0.2)",
            color:"#34c77b", padding:"1px 5px", borderRadius:2 }}>
            signal
          </span>
        </div>
      )}
    </div>
  );
}
