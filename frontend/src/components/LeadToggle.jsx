/**
 * LeadToggle.jsx
 * Pill-style toggle between 3-lead and 12-lead views.
 */

import React from "react";

const MONO = { fontFamily: "'Share Tech Mono', monospace" };

const OPTIONS = [
  { value: "3",  label: "3-Lead"  },
  { value: "12", label: "12-Lead" },
];

export default function LeadToggle({ value, onChange }) {
  return (
    <div style={{
      display: "inline-flex",
      background: "#141414",
      border: "1px solid #222",
      borderRadius: 6,
      overflow: "hidden",
    }}>
      {OPTIONS.map(({ value: v, label }) => {
        const active = value === v;
        return (
          <button
            key={v}
            onClick={() => onChange(v)}
            style={{
              ...MONO,
              padding: "6px 14px",
              fontSize: 11,
              letterSpacing: "0.06em",
              cursor: "pointer",
              border: "none",
              borderRight: v === "3" ? "1px solid #222" : "none",
              background: active ? "rgba(0,214,143,0.12)" : "transparent",
              color: active ? "#00d68f" : "#444",
              outline: active ? "none" : "none",
              transition: "all 0.12s",
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
