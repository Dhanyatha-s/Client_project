import React from "react";
const MONO = { fontFamily:"'Share Tech Mono',monospace" };

function fmtOff(s) {
  const h=Math.floor(s/3600).toString().padStart(2,"0");
  const m=Math.floor((s%3600)/60).toString().padStart(2,"0");
  const sec=Math.floor(s%60).toString().padStart(2,"0");
  return `${h}:${m}:${sec}`;
}

export default function StatusBar({ patientId, timeOffset, mode, apiOk }) {
  return (
    <div style={{
      background:"#070707", borderTop:"1px solid #121212",
      padding:"4px 16px",
      display:"flex", justifyContent:"space-between", alignItems:"center",
      flexWrap:"wrap", gap:8, flexShrink:0,
    }}>
      <span style={{ ...MONO, fontSize:9, color:"#1e1e1e" }}>
        LCC 00000-0000 &nbsp;|&nbsp; Speed: 25 mm/s &nbsp;|&nbsp; Limb: 10 mm/mV &nbsp;|&nbsp; Chest: 10 mm/mV
      </span>
      <div style={{ display:"flex", gap:10, alignItems:"center" }}>
        <div style={{ display:"flex", alignItems:"center", gap:4 }}>
          <span style={{ width:5,height:5,borderRadius:"50%",
            background:apiOk?"#34c77b":"#e05050", display:"inline-block" }}/>
          <span style={{ ...MONO, fontSize:9, color:apiOk?"#2a5a3a":"#5a2a2a" }}>
            {apiOk?"API OK":"API DOWN"}
          </span>
        </div>
        <span style={{ ...MONO, fontSize:9, color:"#1e1e1e" }}>
          {patientId} &nbsp;|&nbsp; {mode}-Lead &nbsp;|&nbsp; T {fmtOff(timeOffset)}
        </span>
        <span style={{ ...MONO, fontSize:9, border:"1px solid #161616",
          color:"#1e1e1e", padding:"1px 5px", borderRadius:2 }}>
          50Ω 0.15–150 Hz
        </span>
      </div>
    </div>
  );
}
