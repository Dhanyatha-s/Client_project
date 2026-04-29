/**
 * SettingsPage.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Settings UI — three sections, all extensible:
 *   1. Hospital & Doctor Profile
 *   2. Appearance  (theme toggle, font size)
 *   3. ECG Display (default mode, paper speed, gain, marker toggle)
 *
 * All values read/write through AppContext — auto-persisted to localStorage.
 * To add a new setting later: add a field in DEFAULT_SETTINGS (AppContext),
 * add a control here, consume it wherever needed.
 */

import React, { useState } from "react";
import { useApp } from "../context/AppContext";

// ── Tiny primitives ────────────────────────────────────────────────────────────

function SectionHeader({ icon, title, subtitle }) {
  const { tokens } = useApp();
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: 12, color: tokens.accent,
          letterSpacing: "0.1em", textTransform: "uppercase",
        }}>
          {title}
        </span>
      </div>
      {subtitle && (
        <p style={{ fontSize: 11, color: tokens.textSecondary, marginLeft: 28 }}>
          {subtitle}
        </p>
      )}
      <div style={{ height: 1, background: tokens.border, marginTop: 10 }} />
    </div>
  );
}

function Field({ label, hint, children }) {
  const { tokens } = useApp();
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{
        display: "block",
        fontSize: 12, color: tokens.textLabel,
        fontFamily: "'IBM Plex Sans', sans-serif",
        marginBottom: 5,
      }}>
        {label}
        {hint && (
          <span style={{ fontSize: 10, color: tokens.textMuted, marginLeft: 8 }}>{hint}</span>
        )}
      </label>
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, mono }) {
  const { tokens } = useApp();
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: "100%",
        background: tokens.surface2,
        border: `1px solid ${tokens.border}`,
        borderRadius: 5,
        padding: "7px 10px",
        fontSize: 12,
        color: tokens.textPrimary,
        fontFamily: mono ? "'Share Tech Mono', monospace" : "'IBM Plex Sans', sans-serif",
        outline: "none",
        transition: "border-color 0.15s",
      }}
      onFocus={e => (e.target.style.borderColor = tokens.accent)}
      onBlur={e  => (e.target.style.borderColor = tokens.border)}
    />
  );
}

function Toggle({ checked, onChange, label, description }) {
  const { tokens } = useApp();
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "10px 12px",
        background: tokens.surface2,
        border: `1px solid ${tokens.border}`,
        borderRadius: 6, cursor: "pointer",
        transition: "border-color 0.15s",
        marginBottom: 8,
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = tokens.accent)}
      onMouseLeave={e => (e.currentTarget.style.borderColor = tokens.border)}
    >
      <div>
        <div style={{ fontSize: 12, color: tokens.textPrimary }}>{label}</div>
        {description && (
          <div style={{ fontSize: 10, color: tokens.textSecondary, marginTop: 2 }}>{description}</div>
        )}
      </div>
      {/* Pill toggle */}
      <div style={{
        width: 36, height: 20, borderRadius: 10,
        background: checked ? tokens.accentGreen : tokens.border2,
        position: "relative", transition: "background 0.2s", flexShrink: 0,
      }}>
        <div style={{
          position: "absolute", top: 3,
          left: checked ? 18 : 3,
          width: 14, height: 14, borderRadius: "50%",
          background: "#fff",
          transition: "left 0.2s",
          boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
        }} />
      </div>
    </div>
  );
}

function SelectInput({ value, onChange, options }) {
  const { tokens } = useApp();
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        width: "100%",
        background: tokens.surface2,
        border: `1px solid ${tokens.border}`,
        borderRadius: 5, padding: "7px 10px",
        fontSize: 12, color: tokens.textPrimary,
        fontFamily: "'Share Tech Mono', monospace",
        outline: "none", cursor: "pointer",
        appearance: "none",
      }}
    >
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function RangeInput({ value, onChange, min, max, step, unit }) {
  const { tokens } = useApp();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ flex: 1, accentColor: tokens.accent }}
      />
      <span style={{
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: 12, color: tokens.accent,
        minWidth: 48, textAlign: "right",
      }}>
        {value}{unit}
      </span>
    </div>
  );
}

function SaveBanner({ saved }) {
  const { tokens } = useApp();
  if (!saved) return null;
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24,
      background: tokens.accentGreen,
      color: "#fff", borderRadius: 6,
      padding: "8px 16px", fontSize: 12,
      fontFamily: "'Share Tech Mono', monospace",
      boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
      animation: "fadeUp 0.2s ease",
      zIndex: 1000,
    }}>
      ✓ Settings saved
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const { tokens, theme, toggleTheme, profile, setProfile, settings, setSetting } = useApp();
  const [saved, setSaved] = useState(false);

  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div style={{
      flex: 1, overflow: "auto",
      background: tokens.bg,
      display: "flex", justifyContent: "center",
    }}>
      <div style={{ width: "100%", maxWidth: 680, padding: "28px 24px" }}>

        {/* Page title */}
        <div style={{ marginBottom: 28 }}>
          <div style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: 16, color: tokens.accent, letterSpacing: "0.1em",
          }}>
            SETTINGS
          </div>
          <div style={{ fontSize: 12, color: tokens.textSecondary, marginTop: 4 }}>
            System configuration — hospital profile, appearance, and ECG display preferences.
          </div>
        </div>

        {/* ── 1. HOSPITAL & DOCTOR PROFILE ────────────────────────────────── */}
        <SectionHeader
          icon="🏥"
          title="Hospital & Doctor Profile"
          subtitle="Appears on ECG printouts and report headers."
        />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Field label="Hospital Name">
            <TextInput
              value={profile.hospital}
              onChange={v => setProfile({ hospital: v })}
              placeholder="e.g. Apollo Hospitals Chennai"
            />
          </Field>
          <Field label="Department">
            <TextInput
              value={profile.department}
              onChange={v => setProfile({ department: v })}
              placeholder="e.g. Cardiology"
            />
          </Field>
          <Field label="Attending Doctor" hint="Name shown on reports">
            <TextInput
              value={profile.doctor}
              onChange={v => setProfile({ doctor: v })}
              placeholder="Dr. "
            />
          </Field>
          <Field label="Medical License No." hint="Optional">
            <TextInput
              value={profile.licenseNo}
              onChange={v => setProfile({ licenseNo: v })}
              placeholder="MCI / NMC number"
              mono
            />
          </Field>
          <Field label="Phone / Contact" hint="Optional">
            <TextInput
              value={profile.phone}
              onChange={v => setProfile({ phone: v })}
              placeholder="+91 "
              mono
            />
          </Field>
          <Field label="Address" hint="Optional">
            <TextInput
              value={profile.address}
              onChange={v => setProfile({ address: v })}
              placeholder="Hospital address"
            />
          </Field>
        </div>

        <div style={{ height: 32 }} />

        {/* ── 2. APPEARANCE ───────────────────────────────────────────────── */}
        <SectionHeader
          icon="🎨"
          title="Appearance"
          subtitle="UI theme and display preferences."
        />

        {/* Theme toggle — prominent */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 16px",
          background: tokens.surface,
          border: `1px solid ${tokens.border}`,
          borderRadius: 8, marginBottom: 16,
        }}>
          <div>
            <div style={{ fontSize: 13, color: tokens.textPrimary, fontWeight: 500 }}>
              {theme === "dark" ? "🌙 Dark Mode" : "☀️ Light Mode"}
            </div>
            <div style={{ fontSize: 11, color: tokens.textSecondary, marginTop: 2 }}>
              {theme === "dark"
                ? "Dark background — recommended for low-light clinical environments"
                : "Light background — recommended for well-lit rooms and printing"}
            </div>
          </div>
          <button
            onClick={toggleTheme}
            style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: 11, padding: "7px 16px",
              background: theme === "dark"
                ? "rgba(79,142,247,0.12)"
                : "rgba(37,99,235,0.1)",
              border: `1px solid ${tokens.accent}40`,
              color: tokens.accent,
              borderRadius: 6, cursor: "pointer",
              transition: "all 0.15s",
              flexShrink: 0,
            }}
          >
            Switch to {theme === "dark" ? "Light" : "Dark"}
          </button>
        </div>

        <div style={{ height: 32 }} />

        {/* ── 3. ECG DISPLAY ──────────────────────────────────────────────── */}
        <SectionHeader
          icon="📈"
          title="ECG Display"
          subtitle="Clinical rendering preferences. Changes apply immediately to all ECG viewers."
        />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <Field label="Default Lead Mode">
            <SelectInput
              value={settings.defaultMode}
              onChange={v => setSetting("defaultMode", v)}
              options={[
                { value: "12", label: "12-Lead (standard)" },
                { value: "3",  label: "3-Lead (monitoring)" },
              ]}
            />
          </Field>
          <Field label="Paper Speed" hint="standard: 25 mm/s">
            <SelectInput
              value={String(settings.paperSpeed)}
              onChange={v => setSetting("paperSpeed", Number(v))}
              options={[
                { value: "25", label: "25 mm/s  (Standard)" },
                { value: "50", label: "50 mm/s  (High speed)" },
              ]}
            />
          </Field>
          <Field label="Gain" hint="standard: 10 mm/mV">
            <SelectInput
              value={String(settings.gain)}
              onChange={v => setSetting("gain", Number(v))}
              options={[
                { value: "5",  label: "5 mm/mV  (Half)" },
                { value: "10", label: "10 mm/mV (Standard)" },
                { value: "20", label: "20 mm/mV (Double)" },
              ]}
            />
          </Field>
          <Field label="Trace Thickness" hint="px">
            <RangeInput
              value={settings.traceThickness}
              onChange={v => setSetting("traceThickness", v)}
              min={0.8} max={3} step={0.1}
              unit="px"
            />
          </Field>
        </div>

        <Toggle
          checked={settings.showMarkers}
          onChange={v => setSetting("showMarkers", v)}
          label="R-peak & RR Interval Markers"
          description="Show blue R-peak triangles and green RR interval labels on Lead II"
        />

        <div style={{ height: 32 }} />

        {/* ── Save button ──────────────────────────────────────────────────── */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button
            onClick={save}
            style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: 12, padding: "9px 24px",
              background: `${tokens.accent}18`,
              border: `1px solid ${tokens.accent}50`,
              color: tokens.accent,
              borderRadius: 6, cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = `${tokens.accent}30`)}
            onMouseLeave={e => (e.currentTarget.style.background = `${tokens.accent}18`)}
          >
            Save Settings
          </button>
        </div>

        {/* ── Extensibility notice ─────────────────────────────────────────── */}
        <div style={{
          marginTop: 36,
          padding: "12px 14px",
          background: tokens.surface,
          border: `1px dashed ${tokens.border2}`,
          borderRadius: 6,
        }}>
          <div style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: 10, color: tokens.textMuted,
            letterSpacing: "0.08em", marginBottom: 4,
          }}>
            EXTENSIBILITY NOTE
          </div>
          <div style={{ fontSize: 11, color: tokens.textSecondary, lineHeight: 1.6 }}>
            To add a new setting: add a key to <code>DEFAULT_SETTINGS</code> in{" "}
            <code>src/context/AppContext.jsx</code>, add a control in this file,
            and consume <code>settings.yourKey</code> via <code>useApp()</code> wherever needed.
            Settings are auto-persisted to <code>localStorage</code>.
          </div>
        </div>

      </div>

      <SaveBanner saved={saved} />
    </div>
  );
}
