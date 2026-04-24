"use client";
import { useState, useRef, useEffect } from "react";
import { DriveFile } from "@/app/page";
import { authFetch } from "@/lib/auth";

interface Msg { role: "user"|"assistant"; text: string; time: string; }
interface Props { files: DriveFile[]; sessionId: string|null; onSessionCreated: (id:string)=>void; }

const fileIcon = (mime: string) => mime.includes("sheet") ? "📊" : "📄";
const now = () => new Date().toLocaleTimeString("th-TH",{hour:"2-digit",minute:"2-digit"});

export default function ChatArea({ files, sessionId, onSessionCreated }: Props) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMsgs(files.length > 0 ? [{role:"assistant",text:`สวัสดีครับ ผม Amico พร้อมช่วยวิเคราะห์ ${files.length} ไฟล์ที่เลือก:\n${files.map(f=>`${fileIcon(f.mimeType)} ${f.name}`).join("\n")}\n\nถามอะไรได้เลยครับ`,time:now()}] : []);
  }, [files.map(f=>f.id).join(",")]);

  useEffect(() => { bottomRef.current?.scrollIntoView({behavior:"smooth"}); }, [msgs]);

  async function send() {
    if (!input.trim() || loading || files.length === 0) return;
    const text = input.trim(); setInput(""); setLoading(true);
    setMsgs(m => [...m, {role:"user",text,time:now()}]);
    try {
      const isMulti = files.length > 1;
      const body = isMulti
        ? {files:files.map(f=>({id:f.id,name:f.name,mimeType:f.mimeType})),message:text,session_id:sessionId}
        : {file_id:files[0].id,file_name:files[0].name,mime_type:files[0].mimeType,message:text,session_id:sessionId};
      const res = await authFetch(`/chat${isMulti?"/multi":""}`,{method:"POST",body:JSON.stringify(body)});
      const data = await res.json();
      if (!res.ok) {
        setMsgs(m => [...m, {role:"assistant",text:`❌ ${data.detail || "เกิดข้อผิดพลาด"}`,time:now()}]);
        return;
      }
      if (data.session_id) onSessionCreated(data.session_id);
      setMsgs(m => [...m, {role:"assistant",text:data.reply,time:now()}]);
    } catch {
      setMsgs(m => [...m, {role:"assistant",text:"❌ เกิดข้อผิดพลาด กรุณาลองใหม่",time:now()}]);
    } finally { setLoading(false); }
  }

  if (files.length === 0) return (
    <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12,color:"#94a3b8"}}>
      <div style={{fontSize:48}}>📁</div>
      <div style={{fontSize:16,fontWeight:600,color:"#374151"}}>เลือกไฟล์เพื่อเริ่ม Chat</div>
      <div style={{fontSize:13}}>เลือกไฟล์จาก Google Drive ด้านซ้ายได้เลยครับ</div>
    </div>
  );

  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div style={{flex:1,overflowY:"auto",padding:20,display:"flex",flexDirection:"column",gap:16}}>
        <div style={{textAlign:"center",fontSize:11,color:"#94a3b8",background:"#f8fafc",borderRadius:20,padding:"4px 14px",alignSelf:"center"}}>
          เริ่มการสนทนาใหม่ · {files.length} ไฟล์
        </div>
        {msgs.map((m,i) => (
          <div key={i} style={{display:"flex",gap:10,maxWidth:"80%",alignSelf:m.role==="user"?"flex-end":"flex-start",flexDirection:m.role==="user"?"row-reverse":"row"}}>
            <div style={{width:30,height:30,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,flexShrink:0,background:m.role==="assistant"?"#1d4ed8":"#e5e7eb",color:m.role==="user"?"#374151":"white"}}>
              {m.role==="user"?"ส":"🤖"}
            </div>
            <div>
              <div style={{padding:"10px 14px",borderRadius:m.role==="user"?"12px 2px 12px 12px":"2px 12px 12px 12px",fontSize:13,lineHeight:1.6,background:m.role==="user"?"#1d4ed8":"white",color:m.role==="user"?"white":"#1a202c",border:m.role==="user"?"none":"1px solid #e2e8f0",whiteSpace:"pre-wrap"}}>
                {m.text}
              </div>
              <div style={{fontSize:10,color:"#9ca3af",marginTop:4,textAlign:m.role==="user"?"right":"left"}}>{m.time}</div>
            </div>
          </div>
        ))}
        {loading && (
          <div style={{display:"flex",gap:10,maxWidth:"80%",alignSelf:"flex-start"}}>
            <div style={{width:30,height:30,borderRadius:"50%",background:"#1d4ed8",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:"white"}}>🤖</div>
            <div style={{padding:"10px 14px",background:"white",border:"1px solid #e2e8f0",borderRadius:"2px 12px 12px 12px",display:"flex",gap:4,alignItems:"center"}}>
              {[0,0.2,0.4].map((d,i)=><div key={i} style={{width:6,height:6,background:"#93c5fd",borderRadius:"50%",animation:`bounce 1.2s ${d}s infinite`}}/>)}
            </div>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>
      <div style={{background:"white",borderTop:"1px solid #e2e8f0",padding:"12px 16px"}}>
        <div style={{fontSize:11,color:"#94a3b8",marginBottom:8,display:"flex",alignItems:"center",gap:6}}>
          กำลัง chat กับ: {files.map(f=><span key={f.id} style={{background:"#eff6ff",color:"#1d4ed8",borderRadius:4,padding:"1px 6px",fontWeight:500}}>{f.name}</span>)}
        </div>
        <div style={{display:"flex",gap:8,alignItems:"flex-end"}}>
          <textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}}
            placeholder="ถามอะไรก็ได้เกี่ยวกับไฟล์ที่เลือก..." rows={1}
            style={{flex:1,background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:10,padding:"10px 14px",fontSize:13,resize:"none",outline:"none",fontFamily:"inherit",color:"#374151",minHeight:42}} />
          <button onClick={send} disabled={loading} style={{background:"#1d4ed8",color:"white",border:"none",borderRadius:10,width:42,height:42,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>➤</button>
        </div>
        <div style={{fontSize:10,color:"#cbd5e1",marginTop:6,textAlign:"right"}}>Enter เพื่อส่ง · Shift+Enter ขึ้นบรรทัดใหม่</div>
      </div>
    </div>
  );
}
