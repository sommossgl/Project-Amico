"use client";
import { useEffect, useState } from "react";
import { DriveFile } from "@/app/page";
const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface Props { selectedFiles: DriveFile[]; onToggle: (f: DriveFile) => void; }

const fileIcon = (mime: string) => mime.includes("sheet") || mime.includes("csv") ? "📊" : mime.includes("presentation") ? "📋" : "📄";

export default function FilePanel({ selectedFiles, onToggle }: Props) {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [query, setQuery] = useState("");

  const load = (q = "") => {
    const url = q ? `${API}/files/search?q=${encodeURIComponent(q)}` : `${API}/files`;
    fetch(url).then(r => r.json()).then(d => setFiles(d.files ?? [])).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  return (
    <div style={{width:280,background:"white",borderRight:"1px solid #e2e8f0",display:"flex",flexDirection:"column",flexShrink:0}}>
      <div style={{padding:"14px 16px 10px",borderBottom:"1px solid #f1f5f9"}}>
        <h3 style={{fontSize:13,fontWeight:600,color:"#374151",marginBottom:8}}>📁 ไฟล์ Google Drive</h3>
        <div style={{display:"flex",alignItems:"center",gap:6,background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:8,padding:"6px 10px"}}>
          <span>🔍</span>
          <input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==="Enter"&&load(query)}
            placeholder="ค้นหาไฟล์..." style={{border:"none",background:"none",outline:"none",fontSize:12,color:"#374151",width:"100%"}} />
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:8}}>
        {files.map(f => {
          const sel = !!selectedFiles.find(s => s.id === f.id);
          return (
            <div key={f.id} onClick={() => onToggle(f)} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderRadius:8,cursor:"pointer",fontSize:12,color:"#374151",marginBottom:2,background:sel?"#eff6ff":"transparent",border:sel?"1px solid #bfdbfe":"1px solid transparent"}}>
              <div style={{width:16,height:16,borderRadius:4,border:sel?"2px solid #93c5fd":"2px solid #d1d5db",background:sel?"#1d4ed8":"white",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontSize:9,flexShrink:0}}>{sel?"✓":""}</div>
              <span style={{fontSize:18,flexShrink:0}}>{fileIcon(f.mimeType)}</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:500,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{f.name}</div>
                <div style={{fontSize:10,color:"#9ca3af",marginTop:1}}>{f.mimeType.split(".").pop()}</div>
              </div>
            </div>
          );
        })}
      </div>
      {selectedFiles.length > 0 && (
        <div style={{padding:"10px 14px",borderTop:"1px solid #e2e8f0",background:"#f0f9ff",fontSize:12,color:"#0369a1",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <span>✅ {selectedFiles.length} ไฟล์ที่เลือก</span>
          <button style={{background:"#1d4ed8",color:"white",border:"none",borderRadius:6,padding:"5px 12px",fontSize:11,cursor:"pointer",fontWeight:500}}>เริ่ม Chat →</button>
        </div>
      )}
    </div>
  );
}
