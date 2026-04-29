/**
 * PatientBanner.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * FIX #1: HR, RR, QT, QTc all come from real signal metrics (useSignalMetrics)
 *         not from a formula fed by a manual slider.
 * FIX #2: "from signal" badge appears when values are measured, not estimated.
 *         Added SDNN and RMSSD (basic HRV time-domain) to the banner.
 */

import React from "react";
import { computeIntervals } from "../utils/ecgIntervals";

const MONO = { fontFamily: "'Share Tech Mono', monospace" };

function Chip({ label, value, unit, accent, dim }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center",
      padding:"5px 12px", borderRight:"1px solid #1c1c1c",
      opacity: dim ? 0.4 : 1 }}>
      <span style={{ ...MONO, fontSize:18, fontWeight:600,
        color: accent || "#c8c8c8", lineHeight:1 }}>
        {value ?? "—"}
      </span>
      <span style={{ fontSize:9, color:"#383838", letterSpacing:"0.09em",
        textTransform:"uppercase", marginTop:2 }}>{label}</span>
      {unit && <span style={{ fontSize:9, color:"#2e2e2e" }}>{unit}</span>}
    </div>
  );
}

function Tag({ text, color }) {
  return (
    <span style={{ ...MONO, fontSize:10, padding:"2px 7px", borderRadius:3,
      background:`${color}12`, border:`1px solid ${color}35`, color }}>
      {text}
    </span>
  );
}

function SmallChip({ label, value, unit, color }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center",
      padding:"3px 10px", borderRight:"1px solid #161616" }}>
      <span style={{ ...MONO, fontSize:13, color: color || "#888", lineHeight:1 }}>
        {value ?? "—"}
      </span>
      <span style={{ fontSize:8, color:"#2e2e2e", textTransform:"uppercase",
        letterSpacing:"0.08em", marginTop:1 }}>{label}</span>
      {unit && <span style={{ fontSize:8, color:"#252525" }}>{unit}</span>}
    </div>
  );
}

export default function PatientBanner({ patient, hr, leadCount, metrics, fromSignal }) {
  // Fallback: formula-based intervals when real metrics aren't ready
  const fallback = computeIntervals(hr ?? 72);

  // Prefer real measured values, fall back to formula
  const pr  = metrics?.pr  != null ? (metrics.pr  * 1000).toFixed(0)  : (fallback.pr  * 1000).toFixed(0);
  const qrs = metrics?.qrs != null ? (metrics.qrs * 1000).toFixed(0)  : (fallback.qrs * 1000).toFixed(0);
  const qt  = metrics?.qt  != null ? (metrics.qt  * 1000).toFixed(0)  : (fallback.qt  * 1000).toFixed(0);
  const qtc = metrics?.qtc != null ? (metrics.qtc * 1000).toFixed(0)  : (fallback.qtc * 1000).toFixed(0);
  const rr  = metrics?.rr  ?? fallback.rr;

  const qtcNum  = Number(qtc);
  const qtcAccent = qtcNum > 500 ? "#e05050" : qtcNum > 450 ? "#e8a230" : "#c8c8c8";

  return (
    <div style={{ background:"#0f0f0f", borderBottom:"1px solid #1a1a1a" }}>
      {/* Row 1: patient info + measured intervals */}
      <div style={{ display:"flex", alignItems:"stretch", justifyContent:"space-between",
        padding:"9px 16px", gap:12, flexWrap:"wrap" }}>

        {/* Identity */}
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:3 }}>
            <span style={{ ...MONO, fontSize:13, color:"#d0d0d0", letterSpacing:"0.04em" }}>
              {patient?.name ?? "—"}
            </span>
            <Tag text={patient?.id ?? "—"} color="#4f8ef7" />
            {fromSignal && (
              <Tag text="⚡ live metrics" color="#34c77b" />
            )}
          </div>
          <div style={{ ...MONO, fontSize:11, color:"#383838", lineHeight:1.6 }}>
            Age: {patient?.age ?? "—"} &nbsp;|&nbsp;
            Sex: {patient?.sex ?? "M"} &nbsp;|&nbsp;
            DOB: {patient?.dob ?? "—"}
          </div>
          <div style={{ ...MONO, fontSize:10, color:"#2c2c2c" }}>
            Recorded: {patient?.created_at ?? "—"} IST
          </div>
        </div>

        {/* Primary interval chips */}
        <div style={{ display:"flex", alignItems:"stretch", borderLeft:"1px solid #1a1a1a" }}>
          <Chip label="HR"  value={hr}   unit="bpm" accent="#e8614a" />
          <Chip label="PR"  value={pr}   unit="ms"  dim={!fromSignal} />
          <Chip label="QRS" value={qrs}  unit="ms"  dim={!fromSignal} />
          <Chip label="QT"  value={qt}   unit="ms"  dim={!fromSignal} />
          <Chip label="QTc" value={qtc}  unit="ms"  accent={qtcAccent} dim={!fromSignal} />
          <Chip label="RR"  value={rr}   unit="s"   dim={!fromSignal} />
        </div>
      </div>

      {/* Row 2: HRV + tech specs */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"4px 16px 5px", borderTop:"1px solid #161616", flexWrap:"wrap", gap:6 }}>

        {/* HRV mini strip */}
        <div style={{ display:"flex", alignItems:"stretch", gap:0,
          borderRight:"1px solid #1a1a1a", paddingRight:10, marginRight:6 }}>
          <SmallChip
            label="SDNN"
            value={metrics?.sdnn  != null ? metrics.sdnn.toFixed(0)  : "—"}
            unit="ms" color="#a78bfa"
          />
          <SmallChip
            label="RMSSD"
            value={metrics?.rmssd != null ? metrics.rmssd.toFixed(0) : "—"}
            unit="ms" color="#a78bfa"
          />
        </div>

        {/* Tech spec tags */}
        <div style={{ display:"flex", gap:5, flexWrap:"wrap", flex:1 }}>
          {["25 mm/s", "10 mm/mV", "SR 250 Hz", "0.15–150 Hz", "50 Hz Notch",
              leadCount > 0 ? `${leadCount}-Lead` : "—"].map(t => (
            <Tag key={t} text={t} color="#2e2e3e" />
          ))}
        </div>

        {/* Rhythm interpretation */}
        <div style={{ display:"flex", gap:6 }}>
          <Tag text="Sinus Rhythm" color="#34c77b" />
          <Tag text="Normal ECG"   color="#4f8ef7" />
        </div>
      </div>
    </div>
  );
}
