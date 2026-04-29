/**
 * RecordsPage.jsx
 * Patient records data table — all patients with their ECG file metadata.
 * Click "View ECG →" to open the patient in a new viewer tab.
 */

import React, { useState } from "react";

const MONO = { fontFamily: "'Share Tech Mono', monospace" };

function Badge({ text, color }) {
  return (
    <span style={{
      ...MONO, fontSize: 9, padding: "2px 6px", borderRadius: 3,
      background: `${color}18`, border: `1px solid ${color}40`, color,
    }}>{text}</span>
  );
}

function fmtDur(hr) {
  if (!hr) return "—";
  const h = Math.floor(hr), m = Math.round((hr - h) * 60);
  return `${h}h ${m.toString().padStart(2,"0")}m`;
}

export default function RecordsPage({ patients, h5Files, onOpenPatient }) {
  const [sort,   setSort]   = useState({ key: "id", dir: 1 });
  const [search, setSearch] = useState("");

  const toggle = key => setSort(s => ({ key, dir: s.key === key ? -s.dir : 1 }));

  const enriched = patients.map(p => {
    const f3  = h5Files.find(f => f.filename === p.h5_3lead);
    const f12 = h5Files.find(f => f.filename === p.h5_12lead);
    return { ...p, dur3: f3?.duration_hr, dur12: f12?.duration_hr,
              sr: f3?.sr ?? f12?.sr ?? 250, has3: !!f3, has12: !!f12 };
  });

  const rows = enriched
    .filter(p => !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase()))
    .sort((a,b) => {
      const av = a[sort.key]??"", bv = b[sort.key]??"";
      return sort.dir * (av < bv ? -1 : av > bv ? 1 : 0);
    });

  const TH = ({ k, label }) => (
    <th onClick={() => toggle(k)} style={{
      ...MONO, fontSize: 9, color: sort.key===k ? "#4f8ef7" : "#2e2e2e",
      padding: "9px 12px", textAlign:"left", cursor:"pointer",
      letterSpacing:"0.1em", textTransform:"uppercase",
      borderBottom:"1px solid #1a1a1a", userSelect:"none", whiteSpace:"nowrap",
    }}>
      {label}{sort.key===k ? (sort.dir>0?" ↑":" ↓") : ""}
    </th>
  );

  return (
    <div style={{ flex:1, overflow:"auto", background:"#090909", padding:20 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div>
          <div style={{ ...MONO, fontSize:13, color:"#4f8ef7", letterSpacing:"0.1em" }}>PATIENT RECORDS</div>
          <div style={{ fontSize:11, color:"#2a2a2a", marginTop:3 }}>{rows.length} of {patients.length} patients</div>
        </div>
        <input
          placeholder="Search name or ID…" value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...MONO, fontSize:11, background:"#111", border:"1px solid #1e1e1e",
            borderRadius:5, padding:"6px 12px", color:"#777", outline:"none", width:200 }}
        />
      </div>

      <div style={{ border:"1px solid #171717", borderRadius:6, overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead style={{ background:"#0d0d0d" }}>
            <tr>
              <TH k="id"         label="ID"       />
              <TH k="name"       label="Name"     />
              <TH k="age"        label="Age"      />
              <TH k="sex"        label="Sex"      />
              <TH k="dob"        label="DOB"      />
              <TH k="created_at" label="Recorded" />
              <th style={{ ...MONO, fontSize:9, color:"#2e2e2e", padding:"9px 12px",
                textAlign:"left", letterSpacing:"0.1em", textTransform:"uppercase",
                borderBottom:"1px solid #1a1a1a" }}>3-LEAD</th>
              <th style={{ ...MONO, fontSize:9, color:"#2e2e2e", padding:"9px 12px",
                textAlign:"left", letterSpacing:"0.1em", textTransform:"uppercase",
                borderBottom:"1px solid #1a1a1a" }}>12-LEAD</th>
              <th style={{ ...MONO, fontSize:9, color:"#2e2e2e", padding:"9px 12px",
                textAlign:"left", letterSpacing:"0.1em", textTransform:"uppercase",
                borderBottom:"1px solid #1a1a1a" }}>SR</th>
              <th style={{ borderBottom:"1px solid #1a1a1a" }} />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0
              ? <tr><td colSpan={10} style={{ padding:"30px 12px", textAlign:"center",
                  ...MONO, fontSize:11, color:"#222" }}>No records found</td></tr>
              : rows.map((p, i) => (
                <tr key={p.id}
                  style={{ background: i%2===0 ? "#090909" : "#0c0c0c", cursor:"pointer" }}
                  onMouseEnter={e => e.currentTarget.style.background="rgba(79,142,247,0.06)"}
                  onMouseLeave={e => e.currentTarget.style.background=i%2===0?"#090909":"#0c0c0c"}
                >
                  <td style={{ ...MONO, fontSize:11, color:"#4f8ef7", padding:"10px 12px", borderBottom:"1px solid #111" }}>{p.id}</td>
                  <td style={{ fontSize:12, color:"#aaa", padding:"10px 12px", borderBottom:"1px solid #111" }}>{p.name}</td>
                  <td style={{ ...MONO, fontSize:11, color:"#444", padding:"10px 12px", borderBottom:"1px solid #111" }}>{p.age}</td>
                  <td style={{ ...MONO, fontSize:11, color:"#444", padding:"10px 12px", borderBottom:"1px solid #111" }}>{p.sex}</td>
                  <td style={{ ...MONO, fontSize:11, color:"#333", padding:"10px 12px", borderBottom:"1px solid #111" }}>{p.dob}</td>
                  <td style={{ ...MONO, fontSize:11, color:"#333", padding:"10px 12px", borderBottom:"1px solid #111" }}>{p.created_at}</td>
                  <td style={{ padding:"10px 12px", borderBottom:"1px solid #111" }}>
                    {p.has3 ? <Badge text={fmtDur(p.dur3)} color="#34c77b"/> : <span style={{...MONO,fontSize:10,color:"#1e1e1e"}}>—</span>}
                  </td>
                  <td style={{ padding:"10px 12px", borderBottom:"1px solid #111" }}>
                    {p.has12 ? <Badge text={fmtDur(p.dur12)} color="#4f8ef7"/> : <span style={{...MONO,fontSize:10,color:"#1e1e1e"}}>—</span>}
                  </td>
                  <td style={{ ...MONO, fontSize:11, color:"#333", padding:"10px 12px", borderBottom:"1px solid #111" }}>{p.sr} Hz</td>
                  <td style={{ padding:"10px 12px", borderBottom:"1px solid #111" }}>
                    <button onClick={() => onOpenPatient(p)}
                      style={{ ...MONO, fontSize:10,
                        background:"rgba(79,142,247,0.1)", border:"1px solid rgba(79,142,247,0.25)",
                        color:"#4f8ef7", borderRadius:4, padding:"4px 10px", cursor:"pointer" }}
                      onMouseEnter={e=>e.currentTarget.style.background="rgba(79,142,247,0.2)"}
                      onMouseLeave={e=>e.currentTarget.style.background="rgba(79,142,247,0.1)"}
                    >View ECG →</button>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  );
}
