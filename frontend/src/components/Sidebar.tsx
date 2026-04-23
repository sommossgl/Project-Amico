"use client";
import { useEffect, useState } from "react";
const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface Session { id: string; created_at: string; message_count: number; }
interface Props { sessionId: string | null; onSelectSession: (id: string) => void; }

const menuItems = [
  { icon: "💬", label: "Chat กับไฟล์", active: true },
  { icon: "📁", label: "Google Drive", active: false },
  { icon: "📊", label: "รายงาน", active: false },
  { icon: "⚙️", label: "ตั้งค่า", active: false },
];

export default function Sidebar({ sessionId, onSelectSession }: Props) {
  const [sessions, setSessions] = useState<Session[]>([]);
  useEffect(() => {
    fetch(`${API}/sessions`).then(r => r.json()).then(d => setSessions(d.sessions ?? [])).catch(()=>{});
  }, [sessionId]);

  return (
    <div style={{width:240,background:"#1e293b",color:"#cbd5e1",display:"flex",flexDirection:"column",flexShrink:0}}>
      <div style={{padding:"16px 12px 8px",fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:1,color:"#64748b"}}>เมนู</div>
      {menuItems.map(m => (
        <div key={m.label} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 14px",fontSize:13,cursor:"pointer",borderRadius:6,margin:"1px 6px",background:m.active?"#1d4ed8":"transparent",color:m.active?"white":"#cbd5e1"}}>
          <span style={{fontSize:14,width:18,textAlign:"center"}}>{m.icon}</span>{m.label}
        </div>
      ))}
      <div style={{padding:"16px 12px 8px",fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:1,color:"#64748b",marginTop:8}}>ประวัติการสนทนา</div>
      <div style={{flex:1,overflowY:"auto",paddingBottom:12}}>
        {sessions.length === 0 ? (
          <div style={{padding:"8px 14px",fontSize:12,color:"#64748b"}}>ยังไม่มีการสนทนา</div>
        ) : sessions.map(s => (
          <div key={s.id} onClick={() => onSelectSession(s.id)} style={{padding:"8px 14px",margin:"1px 6px",borderRadius:6,cursor:"pointer",fontSize:12,color:sessionId===s.id?"#bfdbfe":"#94a3b8",background:sessionId===s.id?"#1e3a8a":"transparent"}}>
            <div style={{whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>💬 Session {s.id.slice(0,8)}...</div>
            <div style={{fontSize:10,color:"#64748b",marginTop:2}}>{s.message_count} ข้อความ</div>
          </div>
        ))}
      </div>
    </div>
  );
}
