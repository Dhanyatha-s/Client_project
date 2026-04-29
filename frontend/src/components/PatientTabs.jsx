/**
 * PatientTabs.jsx
 * Up to 6 patient ECG tabs — each tab is an independent viewer.
 * "+ New Patient" opens the patient picker.
 */

import React from "react";

const MAX_TABS = 6;
const MONO = { fontFamily: "'Share Tech Mono', monospace" };

const TAB_COLORS = [
  "#4f8ef7", "#34c77b", "#f5a623", "#e06c75", "#c678dd", "#56b6c2",
];

export default function PatientTabs({ tabs, activeIdx, onSelect, onAdd, onClose }) {
  return (
    <div style={{
      display: "flex", alignItems: "stretch",
      background: "#0d0d0d",
      borderBottom: "1px solid #1e1e1e",
      overflowX: "auto",
      flexShrink: 0,
      minHeight: 36,
    }}>
      {tabs.map((tab, i) => {
        const active = i === activeIdx;
        const color  = TAB_COLORS[i % TAB_COLORS.length];
        return (
          <div
            key={tab.id + i}
            onClick={() => onSelect(i)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "0 14px",
              minWidth: 130, maxWidth: 180,
              cursor: "pointer",
              background: active ? "#141414" : "transparent",
              borderRight: "1px solid #1a1a1a",
              borderBottom: active ? `2px solid ${color}` : "2px solid transparent",
              transition: "all 0.12s",
              position: "relative",
              flexShrink: 0,
            }}
          >
            {/* Colour dot */}
            <span style={{
              width: 6, height: 6, borderRadius: "50%",
              background: color, flexShrink: 0,
            }} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{
                ...MONO, fontSize: 11,
                color: active ? "#e8e8e8" : "#444",
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                lineHeight: "1.2",
              }}>
                {tab.name}
              </div>
              <div style={{
                ...MONO, fontSize: 9,
                color: active ? color : "#2a2a2a",
                lineHeight: "1.2",
              }}>
                {tab.id}
              </div>
            </div>
            {/* Close button — don't show if only one tab */}
            {tabs.length > 1 && (
              <button
                onClick={e => { e.stopPropagation(); onClose(i); }}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "#333", fontSize: 13, lineHeight: 1,
                  padding: "0 2px", flexShrink: 0,
                  transition: "color 0.1s",
                }}
                onMouseEnter={e => e.target.style.color = "#aaa"}
                onMouseLeave={e => e.target.style.color = "#333"}
              >
                ×
              </button>
            )}
          </div>
        );
      })}

      {/* Add tab */}
      {tabs.length < MAX_TABS && (
        <button
          onClick={onAdd}
          style={{
            ...MONO, fontSize: 16, color: "#2a2a2a",
            background: "none", border: "none",
            padding: "0 14px",
            cursor: "pointer", flexShrink: 0,
            transition: "color 0.12s",
          }}
          onMouseEnter={e => e.target.style.color = "#4f8ef7"}
          onMouseLeave={e => e.target.style.color = "#2a2a2a"}
          title="Open new patient tab"
        >
          +
        </button>
      )}
    </div>
  );
}
