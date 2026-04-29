import React from "react";
export default function LoadingOverlay({ visible }) {
  if (!visible) return null;
  return (
    <div style={{
      position:"absolute", inset:0,
      background:"rgba(12,12,12,0.45)",
      display:"flex", alignItems:"center", justifyContent:"center",
      zIndex:10, pointerEvents:"none",
    }}>
      <div style={{
        fontFamily:"'Share Tech Mono',monospace", fontSize:10,
        color:"#4f8ef7", letterSpacing:"0.12em",
        animation:"ecgPulse 1.2s ease-in-out infinite",
      }}>
        LOADING…
      </div>
      <style>{`@keyframes ecgPulse{0%,100%{opacity:1}50%{opacity:0.2}}`}</style>
    </div>
  );
}
