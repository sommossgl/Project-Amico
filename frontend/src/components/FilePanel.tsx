"use client";
import { useEffect, useState } from "react";
import { DriveFile } from "@/app/page";
import { authFetch } from "@/lib/auth";

interface Folder { folder_id: string; folder_name: string; }
interface Props { selectedFiles: DriveFile[]; onToggle: (f: DriveFile) => void; }

const fileIcon = (mime: string) =>
  mime.includes("sheet") || mime.includes("csv") ? "📊"
  : mime.includes("presentation") ? "📋"
  : mime.includes("folder") ? "📁"
  : "📄";

export default function FilePanel({ selectedFiles, onToggle }: Props) {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = async (q = "") => {
    setLoading(true);
    setErr(null);
    try {
      const path = q ? `/files/search?q=${encodeURIComponent(q)}` : `/files`;
      const r = await authFetch(path);
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        setErr(d.detail || "โหลดไฟล์ไม่สำเร็จ");
        return;
      }
      const d = await r.json();
      setFiles(d.files ?? []);
      if (d.accessible_folders) setFolders(d.accessible_folders);
    } catch {
      setErr("เชื่อมต่อ backend ไม่ได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div style={{width:300,background:"white",borderRight:"1px solid #e2e8f0",display:"flex",flexDirection:"column",flexShrink:0}}>
      <div style={{padding:"14px 16px 10px",borderBottom:"1px solid #f1f5f9"}}>
        <h3 style={{fontSize:13,fontWeight:600,color:"#374151",marginBottom:8}}>📁 ไฟล์ Google Drive</h3>
        {folders.length > 0 && (
          <div style={{marginBottom:10,display:"flex",flexWrap:"wrap",gap:4}}>
            {folders.map(f => (
              <span key={f.folder_id} style={{background:"#f0fdf4",border:"1px solid #bbf7d0",color:"#15803d",borderRadius:20,padding:"2px 10px",fontSize:10,fontWeight:500}}>
                📂 {f.folder_name}
              </span>
            ))}
          </div>
        )}
        <div style={{display:"flex",alignItems:"center",gap:6,background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:8,padding:"6px 10px"}}>
          <span>🔍</span>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && load(query)}
            placeholder="ค้นหาไฟล์..."
            style={{border:"none",background:"none",outline:"none",fontSize:12,color:"#374151",width:"100%"}}
          />
          <button
            onClick={() => load(query)}
            style={{background:"#1d4ed8",color:"white",border:"none",borderRadius:6,padding:"2px 8px",fontSize:10,cursor:"pointer"}}
          >ค้นหา</button>
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:8}}>
        {loading && <div style={{padding:20,textAlign:"center",fontSize:12,color:"#94a3b8"}}>กำลังโหลด...</div>}
        {err && <div style={{padding:14,fontSize:11,color:"#b91c1c",background:"#fef2f2",border:"1px solid #fecaca",borderRadius:8,margin:8}}>{err}</div>}
        {!loading && !err && files.length === 0 && (
          <div style={{padding:20,textAlign:"center",fontSize:12,color:"#94a3b8"}}>
            ไม่พบไฟล์ในโฟลเดอร์ที่คุณเข้าถึงได้
          </div>
        )}
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
        </div>
      )}
    </div>
  );
}
