"use client";
import { useEffect, useState } from "react";
import { API, saveSession } from "@/lib/auth";

export default function OAuthCallback() {
  const [msg, setMsg] = useState("กำลังเข้าสู่ระบบ...");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state") || "";
    if (!code) {
      setErr("ไม่พบ authorization code");
      return;
    }
    (async () => {
      try {
        const r = await fetch(`${API}/auth/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`);
        const d = await r.json();
        if (!r.ok) {
          setErr(d?.detail || "Login failed");
          return;
        }
        saveSession(d.session_token, d.user);
        setMsg(`ยินดีต้อนรับ ${d.user.name || d.user.email}`);
        setTimeout(() => { window.location.href = "/"; }, 600);
      } catch (e) {
        setErr("เชื่อมต่อ backend ไม่ได้");
      }
    })();
  }, []);

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#1e3a8a 0%,#3b82f6 100%)",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{background:"white",borderRadius:16,padding:"36px 32px",textAlign:"center",maxWidth:420,boxShadow:"0 20px 60px rgba(0,0,0,0.3)"}}>
        <div style={{fontSize:40,marginBottom:16}}>{err ? "❌" : "🔐"}</div>
        {err ? (
          <>
            <h2 style={{fontSize:18,color:"#b91c1c",fontWeight:600,marginBottom:10}}>เข้าสู่ระบบไม่สำเร็จ</h2>
            <p style={{fontSize:13,color:"#64748b",marginBottom:20}}>{err}</p>
            <a href="/login" style={{background:"#1d4ed8",color:"white",padding:"10px 20px",borderRadius:8,textDecoration:"none",fontSize:13,fontWeight:500}}>← กลับไปหน้า Login</a>
          </>
        ) : (
          <>
            <h2 style={{fontSize:18,color:"#1e3a8a",fontWeight:600,marginBottom:8}}>{msg}</h2>
            <p style={{fontSize:12,color:"#94a3b8"}}>กรุณารอสักครู่...</p>
          </>
        )}
      </div>
    </div>
  );
}
