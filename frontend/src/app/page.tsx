"use client";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import FilePanel from "@/components/FilePanel";
import ChatArea from "@/components/ChatArea";
import { getToken, getUser, AmicoUser } from "@/lib/auth";

export interface DriveFile { id: string; name: string; mimeType: string; modified?: string; }
export interface Session { id: string; created_at: string; message_count: number; title?: string; }

export default function Home() {
  const [selectedFiles, setSelectedFiles] = useState<DriveFile[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [user, setUser] = useState<AmicoUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getToken();
    const u = getUser();
    if (!token || !u) {
      window.location.href = "/login";
      return;
    }
    setUser(u);
    setReady(true);
  }, []);

  const toggleFile = (file: DriveFile) =>
    setSelectedFiles(prev =>
      prev.find(f => f.id === file.id) ? prev.filter(f => f.id !== file.id) : [...prev, file]
    );

  if (!ready || !user) {
    return (
      <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#f8fafc"}}>
        <div style={{color:"#64748b",fontSize:14}}>กำลังโหลด...</div>
      </div>
    );
  }

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100vh"}}>
      <Navbar user={user} />
      <div style={{display:"flex",flex:1,overflow:"hidden"}}>
        <Sidebar sessionId={sessionId} onSelectSession={setSessionId} isAdmin={user.is_admin} />
        <main style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <div style={{background:"white",borderBottom:"1px solid #e2e8f0",padding:"10px 20px",display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
            <span style={{fontSize:14,fontWeight:600,color:"#1e3a8a"}}>💬 Chat กับไฟล์</span>
            {selectedFiles.map(f => (
              <span key={f.id} style={{background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:20,padding:"3px 12px",fontSize:12,color:"#1d4ed8",display:"flex",alignItems:"center",gap:5}}>
                {f.name.endsWith(".xlsx")?"📊":"📄"} {f.name}
                <span style={{cursor:"pointer",color:"#93c5fd",marginLeft:4}} onClick={()=>toggleFile(f)}>×</span>
              </span>
            ))}
            <button onClick={()=>{setSelectedFiles([]);setSessionId(null);}} style={{marginLeft:"auto",background:"#1d4ed8",color:"white",border:"none",borderRadius:8,padding:"6px 14px",fontSize:12,cursor:"pointer",fontWeight:500}}>+ New Chat</button>
          </div>
          <div style={{flex:1,display:"flex",overflow:"hidden"}}>
            <FilePanel selectedFiles={selectedFiles} onToggle={toggleFile} />
            <ChatArea files={selectedFiles} sessionId={sessionId} onSessionCreated={setSessionId} />
          </div>
        </main>
      </div>
    </div>
  );
}
