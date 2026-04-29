/**
 * PatientPicker.jsx
 * Modal to select a patient when adding a new tab.
 */

import React from "react";

const MONO = { fontFamily: "'Share Tech Mono', monospace" };

export default function PatientPicker({ patients, openIds, onSelect, onClose }) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9000,
        background: "rgba(0,0,0,0.75)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: "#111", border: "1px solid #222",
        borderRadius: 8, width: 380, overflow: "hidden",
        boxShadow: "0 20px 60px rgba(0,0,0,0.7)",
      }}>
        <div style={{
          padding: "14px 16px 10px",
          borderBottom: "1px solid #1e1e1e",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span style={{ ...MONO, fontSize: 11, color: "#4f8ef7", letterSpacing: "0.1em" }}>
            SELECT PATIENT
          </span>
          <button
            onClick={onClose}
            style={{ background:"none",border:"none",color:"#444",cursor:"pointer",fontSize:16 }}
          >×</button>
        </div>

        <div style={{ padding: 8 }}>
          {patients.map(p => {
            const already = openIds.includes(p.id);
            return (
              <button
                key={p.id}
                onClick={() => !already && onSelect(p)}
                style={{
                  width: "100%", textAlign: "left",
                  padding: "9px 12px",
                  background: already ? "rgba(255,255,255,0.02)" : "transparent",
                  border: "1px solid transparent",
                  borderRadius: 5, cursor: already ? "not-allowed" : "pointer",
                  marginBottom: 3, opacity: already ? 0.4 : 1,
                  transition: "all 0.1s",
                }}
                onMouseEnter={e => { if (!already) e.currentTarget.style.background = "rgba(79,142,247,0.08)"; }}
                onMouseLeave={e => { if (!already) e.currentTarget.style.background = "transparent"; }}
              >
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, color: "#ccc" }}>{p.name}</span>
                  <span style={{ ...MONO, fontSize: 10, color: "#333" }}>{p.id}</span>
                </div>
                <div style={{ ...MONO, fontSize: 10, color: "#3a3a3a", marginTop: 2 }}>
                  Age {p.age} · {p.sex ?? "M"}
                  {already && <span style={{ color: "#4f8ef7", marginLeft: 8 }}>already open</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
