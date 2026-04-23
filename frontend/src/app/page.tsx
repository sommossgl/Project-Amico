"use client";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import FilePanel from "@/components/FilePanel";
import ChatArea from "@/components/ChatArea";

export interface DriveFile { id: string; name: string; mimeType: string; modified?: string; }
export interface Session { id: string; created_at: string; message_count: number; title?: string; }

export default function Home() {
  const [selectedFiles, setSelectedFiles] = useState<DriveFile[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const toggleFile = (file: DriveFile) =>
    setSelectedFiles(prev =>
      prev.find(f => f.id === file.id) ? prev.filter(f => f.id !== file.id) : [...prev, file]
    );

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100vh"}}>
      <Navbar />
      <div style={{display:"flex",flex:1,overflow:"hidden"}}>
        <Sidebar sessionId={sessionId} onSelectSession={setSessionId} />
        <main style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          {/* Topbar */}
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
