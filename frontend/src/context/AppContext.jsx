/**
 * AppContext.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Global application context — provides:
 *   theme        : "dark" | "light"
 *   toggleTheme  : () => void
 *   profile      : { hospital, department, doctor, licenseNo, address, phone }
 *   setProfile   : (partial) => void
 *   settings     : { gridColor, traceThickness, defaultMode, showMarkers }
 *   setSetting   : (key, value) => void
 *
 * Everything is persisted to localStorage under "holter_app_state".
 *
 * Usage anywhere in the tree:
 *   import { useApp } from "../context/AppContext";
 *   const { theme, toggleTheme, profile } = useApp();
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

// ── Default values ─────────────────────────────────────────────────────────────
const DEFAULT_PROFILE = {
  hospital:    "",
  department:  "Cardiology",
  doctor:      "",
  licenseNo:   "",
  address:     "",
  phone:       "",
};

const DEFAULT_SETTINGS = {
  defaultMode:     "12",       // "3" | "12"
  showMarkers:     true,
  traceThickness:  1.5,        // px (before DPR scale)
  gridColor:       "classic",  // "classic" | "subtle" | "bold"
  paperSpeed:      25,         // mm/s — standard; 50 is also common
  gain:            10,         // mm/mV
};

const DEFAULT_STATE = {
  theme:    "dark",
  profile:  DEFAULT_PROFILE,
  settings: DEFAULT_SETTINGS,
};

// ── Theme token maps ───────────────────────────────────────────────────────────
export const THEMES = {
  dark: {
    // App chrome
    bg:           "#0c0c0c",
    surface:      "#0f0f0f",
    surface2:     "#141414",
    border:       "#1a1a1a",
    border2:      "#222",
    // Text
    textPrimary:  "#d0d0d0",
    textSecondary:"#555",
    textMuted:    "#2e2e2e",
    textLabel:    "#888",
    // Accent
    accent:       "#4f8ef7",
    accentGreen:  "#34c77b",
    accentRed:    "#e8614a",
    accentAmber:  "#e8a230",
    // ECG paper (canvas)
    paper:        "#fdf6f0",
    gridMinor:    "rgba(210,90,70,0.18)",
    gridMajor:    "rgba(195,60,45,0.48)",
    gridBorder:   "rgba(185,50,35,0.65)",
    trace:        "#111010",
  },
  light: {
    // App chrome
    bg:           "#f2f4f7",
    surface:      "#ffffff",
    surface2:     "#f7f9fc",
    border:       "#dde1e8",
    border2:      "#ccd0d8",
    // Text
    textPrimary:  "#1a1f2e",
    textSecondary:"#6b7280",
    textMuted:    "#9ca3af",
    textLabel:    "#4b5563",
    // Accent
    accent:       "#2563eb",
    accentGreen:  "#16a34a",
    accentRed:    "#dc2626",
    accentAmber:  "#d97706",
    // ECG paper (canvas) — same in both themes, paper is always warm-white
    paper:        "#fdf6f0",
    gridMinor:    "rgba(210,90,70,0.18)",
    gridMajor:    "rgba(195,60,45,0.48)",
    gridBorder:   "rgba(185,50,35,0.65)",
    trace:        "#111010",
  },
};

// ── Context ────────────────────────────────────────────────────────────────────
const AppContext = createContext(null);

export function AppProvider({ children }) {
  // Load persisted state
  const [state, setState] = useState(() => {
    try {
      const saved = localStorage.getItem("holter_app_state");
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          theme:    parsed.theme    ?? DEFAULT_STATE.theme,
          profile:  { ...DEFAULT_PROFILE,  ...(parsed.profile  ?? {}) },
          settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) },
        };
      }
    } catch {}
    return DEFAULT_STATE;
  });

  // Persist whenever state changes
  useEffect(() => {
    localStorage.setItem("holter_app_state", JSON.stringify(state));
  }, [state]);

  const toggleTheme = useCallback(() => {
    setState(s => ({ ...s, theme: s.theme === "dark" ? "light" : "dark" }));
  }, []);

  const setProfile = useCallback((partial) => {
    setState(s => ({ ...s, profile: { ...s.profile, ...partial } }));
  }, []);

  const setSetting = useCallback((key, value) => {
    setState(s => ({ ...s, settings: { ...s.settings, [key]: value } }));
  }, []);

  const tokens = THEMES[state.theme] ?? THEMES.dark;

  return (
    <AppContext.Provider value={{
      theme:       state.theme,
      tokens,
      toggleTheme,
      profile:     state.profile,
      setProfile,
      settings:    state.settings,
      setSetting,
    }}>
      {children}
    </AppContext.Provider>
  );
}

/** Hook — use anywhere inside AppProvider */
export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside <AppProvider>");
  return ctx;
}

export { DEFAULT_PROFILE, DEFAULT_SETTINGS };
