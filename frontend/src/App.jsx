/**
 * App.jsx  —  Holter ECG Dashboard root
 *
 * Navigation:
 *   [Records] tab — patient data table, click row → opens ECG tab
 *   [P001]…[P006]  — up to 6 independent ECG viewer tabs
 *
 * No per-second re-render: each ECGViewer manages its own state.
 * Smooth data: useEcgData pre-fetches 30s chunks and serves 10s windows from cache.
 */

import React, { useState, useEffect } from "react";
import PatientTabs  from "./components/PatientTabs";
import PatientPicker from "./components/PatientPicker";
import Sidebar      from "./components/Sidebar";
import StatusBar    from "./components/StatusBar";
import RecordsPage  from "./pages/RecordsPage";
import ECGViewer    from "./pages/ECGViewer";
import { getPatients } from "./utils/ecgApi";
import SettingsPage  from "./pages/SettingsPage";
import { useApp }    from "./context/AppContext";

const TAB_COLORS = ["#4f8ef7","#34c77b","#f5a623","#e06c75","#c678dd","#56b6c2"];

const RECORDS_TAB = { id: "__records__", name: "Records", isRecords: true };

export default function App() {
  const { theme, toggleTheme, tokens } = useApp();

  // ── Master patient list (from API) ─────────────────────────────────────────
  const [patients,    setPatients]   = useState([
    { id:"P001", name:"Test Patient", age:45, sex:"M", dob:"1981-01-01", created_at:"2026-01-01" }
  ]);
  const [h5Files,     setH5Files]    = useState([]);
  const [apiError,    setApiError]   = useState(false);

  useEffect(() => {
    getPatients()
      .then(list => { if (list.length) setPatients(list); setApiError(false); })
      .catch(() => setApiError(true));

    fetch("/api/files")
      .then(r => r.json())
      .then(files => setH5Files(files))
      .catch(() => {});
  }, []);

  // ── Tab state ──────────────────────────────────────────────────────────────
  // Each entry: { id, name, patient } where patient is full patient object
  const [ecgTabs,    setEcgTabs]    = useState([]);
  const [activeTab,  setActiveTab]  = useState("records");  // "records" | patient id
  const [showPicker, setShowPicker] = useState(false);

  // Open a patient in the ECG viewer (from Records table or Picker)
  const openPatient = (patient) => {
    const exists = ecgTabs.find(t => t.id === patient.id);
    if (exists) {
      setActiveTab(patient.id);
    } else {
      if (ecgTabs.length >= 6) return;   // max 6
      setEcgTabs(prev => [...prev, { id: patient.id, name: patient.name, patient }]);
      setActiveTab(patient.id);
    }
    setShowPicker(false);
  };

  const closeTab = (idx) => {
    const tab = ecgTabs[idx];
    const next = [...ecgTabs];
    next.splice(idx, 1);
    setEcgTabs(next);
    if (activeTab === tab.id) {
      // Activate adjacent or records
      setActiveTab(next[Math.min(idx, next.length - 1)]?.id ?? "records");
    }
  };

  // Sidebar active patient = whichever ECG tab is showing
  const sidebarPatient = ecgTabs.find(t => t.id === activeTab)?.patient ?? patients[0];

  // Build the tabs bar list (Records always first)
  const allTabsForBar = ecgTabs.map((t, i) => ({
    id: t.id, name: t.name, color: TAB_COLORS[i % TAB_COLORS.length],
  }));

  return (
    <div style={{
      display:"flex", flexDirection:"column", height:"100vh",
      background: tokens.bg, fontFamily:"'IBM Plex Sans',sans-serif",
      overflow:"hidden",
    }}>

      {/* Patient picker modal */}
      {showPicker && (
        <PatientPicker
          patients={patients}
          openIds={ecgTabs.map(t => t.id)}
          onSelect={openPatient}
          onClose={() => setShowPicker(false)}
        />
      )}

      {/* ── Top navigation bar ─────────────────────────────────────────────── */}
      <div style={{
        display:"flex", alignItems:"center",
        background: tokens.surface, borderBottom:`1px solid ${tokens.border}`,
        padding:"0 0 0 0", flexShrink:0,
      }}>
        {/* App logo */}
        <div style={{
          padding:"0 16px", borderRight:"1px solid #181818",
          display:"flex", flexDirection:"column", justifyContent:"center",
          height:36, flexShrink:0,
        }}>
          <span style={{ fontFamily:"'Share Tech Mono',monospace",
            fontSize:11, color: tokens.accent, letterSpacing:"0.12em" }}>HOLTER ECG</span>
        </div>

        {/* Records tab (always present) */}
        <div
          onClick={() => setActiveTab("records")}
          style={{
            padding:"0 16px", height:36,
            display:"flex", alignItems:"center", cursor:"pointer",
            borderRight:"1px solid #181818",
            borderBottom: activeTab==="records" ? `2px solid ${tokens.accent}` : "2px solid transparent",
            background: activeTab==="records" ? tokens.surface2 : "transparent",
          }}
        >
          <span style={{ fontFamily:"'Share Tech Mono',monospace",
            fontSize:11,
            color: activeTab==="records" ? tokens.accent : tokens.textMuted,
          }}>
            ☰ Records
          </span>
        </div>

        {/* Patient ECG tabs */}
        <PatientTabs
          tabs={allTabsForBar}
          activeIdx={ecgTabs.findIndex(t => t.id === activeTab)}
          onSelect={i => setActiveTab(ecgTabs[i].id)}
          onAdd={() => setShowPicker(true)}
          onClose={closeTab}
        />
      {/* Settings + Theme toggle — pinned to right */}
        <div style={{ marginLeft:"auto", display:"flex", alignItems:"center",
          borderLeft:`1px solid ${tokens.border}`, paddingLeft:0 }}>
          {/* Theme toggle button */}
          <button
            onClick={toggleTheme}
            title={`Switch to ${theme==="dark" ? "light" : "dark"} mode`}
            style={{
              height:36, padding:"0 14px",
              background:"transparent", border:"none",
              cursor:"pointer", fontSize:14,
              borderRight:`1px solid ${tokens.border}`,
              color: tokens.textSecondary,
              transition:"color 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.color = tokens.textPrimary}
            onMouseLeave={e => e.currentTarget.style.color = tokens.textSecondary}
          >
            {theme==="dark" ? "☀️" : "🌙"}
          </button>

          {/* Settings nav item */}
          <div
            onClick={() => setActiveTab("settings")}
            style={{
              height:36, padding:"0 16px",
              display:"flex", alignItems:"center", cursor:"pointer",
              borderBottom: activeTab==="settings" ? `2px solid ${tokens.accent}` : "2px solid transparent",
              background: activeTab==="settings" ? tokens.surface2 : "transparent",
            }}
          >
            <span style={{ fontFamily:"'Share Tech Mono',monospace",
              fontSize:11,
              color: activeTab==="settings" ? tokens.accent : tokens.textMuted,
            }}>
              ⚙ Settings
            </span>
          </div>
        </div>
      </div>

      {/* ── Main body ─────────────────────────────────────────────────────── */}
      <div style={{ display:"flex", flex:1, overflow:"hidden" }}>

        {/* Sidebar — only shown in ECG view */}
        {activeTab !== "records" && (
          <Sidebar
            patients={patients}
            activePatient={sidebarPatient}
            onSelectPatient={openPatient}
            hr={72}
            timeOffset={0}
            totalDuration={172800}
            loading={false}
            apiError={apiError}
          />
        )}

        {/* Page content */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", minWidth:0 }}>

          {/* Settings page */}
          {activeTab === "settings" && <SettingsPage />}

          {/* Records page */}
          {activeTab === "records" && (
            <RecordsPage
              patients={patients}
              h5Files={h5Files}
              onOpenPatient={openPatient}
            />
          )}

          {/* ECG viewer tabs — render all, hide inactive (preserves state) */}
          {ecgTabs.map((tab, i) => (
            <div
              key={tab.id}
              style={{
                display: activeTab === tab.id ? "flex" : "none",
                flexDirection:"column", flex:1, overflow:"hidden",
              }}
            >
              <ECGViewer
                patient={tab.patient}
                tabColor={TAB_COLORS[i % TAB_COLORS.length]}
              />
            </div>
          ))}

          {/* Empty ECG area when no tabs and records is active (shouldn't happen) */}
          {ecgTabs.length === 0 && activeTab !== "records" && (
            <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:12,
                  color:"#2a2a2a", marginBottom:10 }}>No ECG tab open</div>
                <button
                  onClick={() => setShowPicker(true)}
                  style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:11,
                    background:"rgba(79,142,247,0.1)", border:"1px solid rgba(79,142,247,0.3)",
                    color:"#4f8ef7", borderRadius:5, padding:"8px 16px", cursor:"pointer" }}
                >
                  + Open Patient ECG
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <StatusBar
        patientId={sidebarPatient?.id ?? "—"}
        timeOffset={0}
        mode="—"
        apiOk={!apiError}
      />

      <style>{`
        @keyframes livePulse {
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:0.3; transform:scale(0.75); }
        }
      `}</style>
    </div>
  );
}
