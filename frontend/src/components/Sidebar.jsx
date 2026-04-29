/**
 * Sidebar.jsx
 * Left panel: patient list from API, recording metadata, live interval bars.
 */

import React from "react";
import { computeIntervals } from "../utils/ecgIntervals";

const MONO = { fontFamily: "'Share Tech Mono', monospace" };

// ── Tiny sub-components ───────────────────────────────────────────────────────

function SectionLabel({ text }) {
  return (
    <div style={{
      ...MONO, fontSize: 9, color: "#333",
      letterSpacing: "0.15em", textTransform: "uppercase",
      padding: "10px 14px 5px",
    }}>
      {text}
    </div>
  );
}

function StatRow({ label, value, accent }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between",
      alignItems: "center",
      padding: "4px 14px",
      borderBottom: "1px solid #111",
    }}>
      <span style={{ fontSize: 11, color: "#444" }}>{label}</span>
      <span style={{ ...MONO, fontSize: 11, color: accent || "#666" }}>{value}</span>
    </div>
  );
}

function MiniBar({ value, max, color }) {
  const pct = Math.min(100, (value / max) * 100).toFixed(1);
  return (
    <div style={{
      height: 3, background: "#181818", borderRadius: 2, overflow: "hidden",
    }}>
      <div style={{
        width: `${pct}%`, height: "100%",
        background: color, borderRadius: 2,
        transition: "width 0.4s ease",
      }} />
    </div>
  );
}

function IntervalRow({ label, value, unit, barValue, barMax, color }) {
  return (
    <div style={{ padding: "5px 14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
        <span style={{ fontSize: 11, color: "#3a3a3a" }}>{label}</span>
        <span style={{ ...MONO, fontSize: 11, color }}>
          {value}<span style={{ color: "#2a2a2a", marginLeft: 2 }}>{unit}</span>
        </span>
      </div>
      <MiniBar value={barValue} max={barMax} color={color} />
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: "#111", margin: "6px 0" }} />;
}

// ── Main component ────────────────────────────────────────────────────────────

export default function Sidebar({
  patients,          // array from API
  activePatient,
  onSelectPatient,
  hr,
  timeOffset,
  totalDuration,
  loading,
  apiError,
}) {
  const iv = computeIntervals(hr);

  const fmtTime = (s) => {
    const h = Math.floor(s / 3600).toString().padStart(2, "0");
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, "0");
    return `${h}h ${m}m`;
  };

  return (
    <div style={{
      width: 200,
      flexShrink: 0,
      height: "100%",
      background: "#090909",
      borderRight: "1px solid #161616",
      display: "flex",
      flexDirection: "column",
      overflowY: "auto",
    }}>

      {/* ── Logo ─────────────────────────────────────────────────────────── */}
      <div style={{
        padding: "14px 14px 12px",
        borderBottom: "1px solid #141414",
      }}>
        <div style={{ ...MONO, fontSize: 13, color: "#00d68f", letterSpacing: "0.1em" }}>
          HOLTER ECG
        </div>
        <div style={{ fontSize: 10, color: "#282828", marginTop: 2 }}>
          48-hour Monitor System
        </div>
      </div>

      {/* ── Patients ─────────────────────────────────────────────────────── */}
      <SectionLabel text="Patients" />

      {apiError && (
        <div style={{
          margin: "0 10px 6px",
          padding: "6px 8px",
          background: "rgba(255,80,60,0.06)",
          border: "1px dashed rgba(255,80,60,0.2)",
          borderRadius: 4,
          fontSize: 10,
          color: "#ff5040",
          ...MONO,
        }}>
          API unavailable
        </div>
      )}

      {loading && (
        <div style={{ fontSize: 10, color: "#333", padding: "4px 14px", ...MONO }}>
          Loading…
        </div>
      )}

      <div style={{ padding: "0 8px" }}>
        {patients.map((p) => {
          const active = activePatient?.id === p.id;
          return (
            <button
              key={p.id}
              onClick={() => onSelectPatient(p)}
              style={{
                width: "100%", textAlign: "left",
                padding: "8px 8px",
                marginBottom: 2,
                background: active ? "rgba(0,214,143,0.07)" : "transparent",
                border: active ? "1px solid rgba(0,214,143,0.2)" : "1px solid transparent",
                borderRadius: 5,
                cursor: "pointer",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: active ? "#e0e0e0" : "#555", fontWeight: 500 }}>
                  {p.name}
                </span>
                <span style={{ ...MONO, fontSize: 9, color: "#2a2a2a" }}>{p.id}</span>
              </div>
              <div style={{
                ...MONO, fontSize: 10, marginTop: 2,
                color: active ? "#00d68f" : "#2e2e2e",
              }}>
                Age {p.age} · Sinus
              </div>
            </button>
          );
        })}
      </div>

      <Divider />

      {/* ── Recording stats ──────────────────────────────────────────────── */}
      <SectionLabel text="Recording" />
      <StatRow label="Duration"    value="48:00 hr" />
      <StatRow label="Elapsed"     value={fmtTime(timeOffset)} accent="#555" />
      <StatRow label="Sample rate" value="250 Hz" />
      <StatRow label="Leads"       value="3 / 12" />
      <StatRow label="Resolution"  value="16-bit" />
      <StatRow label="Progress"
        value={`${((timeOffset / totalDuration) * 100).toFixed(1)}%`}
        accent="#00d68f"
      />

      <Divider />

      {/* ── Interval bars ────────────────────────────────────────────────── */}
      <SectionLabel text="Intervals" />

      <IntervalRow
        label="Heart Rate"
        value={hr}       unit="bpm"
        barValue={hr}    barMax={200}
        color="#ff6040"
      />
      <IntervalRow
        label="PR"
        value={(iv.pr  * 1000).toFixed(0)} unit="ms"
        barValue={iv.pr  * 1000}           barMax={300}
        color="#38bdf8"
      />
      <IntervalRow
        label="QRS"
        value={(iv.qrs * 1000).toFixed(0)} unit="ms"
        barValue={iv.qrs * 1000}           barMax={150}
        color="#00d68f"
      />
      <IntervalRow
        label="QT"
        value={(iv.qt  * 1000).toFixed(0)} unit="ms"
        barValue={iv.qt  * 1000}           barMax={500}
        color="#a78bfa"
      />
      <IntervalRow
        label="QTc"
        value={(iv.qtc * 1000).toFixed(0)} unit="ms"
        barValue={iv.qtc * 1000}           barMax={500}
        color={iv.qtc * 1000 > 450 ? "#faad14" : "#a78bfa"}
      />

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <div style={{ marginTop: "auto", padding: "10px 14px", borderTop: "1px solid #111" }}>
        <div style={{ ...MONO, fontSize: 9, color: "#222" }}>LCC 00000-0000</div>
        <div style={{ fontSize: 9, color: "#1e1e1e", marginTop: 2 }}>v1.0 · 2026</div>
      </div>
    </div>
  );
}
