"use client";
import { useEffect, useState } from "react";
import { API, getToken } from "@/lib/auth";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (getToken()) window.location.href = "/";
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch(`${API}/auth/login`);
      const d = await r.json();
      if (d?.url) window.location.href = d.url;
      else setErr("ไม่สามารถสร้าง login URL ได้");
    } catch (e) {
      setErr("เชื่อมต่อ backend ไม่ได้");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#1e3a8a 0%,#3b82f6 100%)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:"white",borderRadius:16,padding:"40px 36px",maxWidth:420,width:"100%",boxShadow:"0 20px 60px rgba(0,0,0,0.3)"}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{width:64,height:64,background:"linear-gradient(135deg,#1e3a8a,#3b82f6)",borderRadius:16,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px",fontSize:32}}>🤖</div>
          <h1 style={{fontSize:24,fontWeight:700,color:"#1e3a8a",marginBottom:6}}>Project Amico</h1>
          <p style={{fontSize:13,color:"#64748b"}}>AI chat กับเอกสารใน Google Drive</p>
          <p style={{fontSize:11,color:"#94a3b8",marginTop:4}}>by SompenTech</p>
        </div>

        <div style={{background:"#f0f9ff",border:"1px solid #bfdbfe",borderRadius:10,padding:"12px 14px",marginBottom:20,fontSize:12,color:"#1e40af"}}>
          🔒 ระบบปิด — ต้องได้รับอนุญาตให้ login ด้วย email ที่ลงทะเบียนเท่านั้น
        </div>

        {err && (
          <div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:10,padding:"10px 14px",marginBottom:16,fontSize:12,color:"#b91c1c"}}>
            ❌ {err}
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width:"100%",background:"white",color:"#1f2937",border:"1px solid #d1d5db",
            borderRadius:10,padding:"12px 16px",fontSize:14,fontWeight:500,cursor:loading?"not-allowed":"pointer",
            display:"flex",alignItems:"center",justifyContent:"center",gap:10,
            opacity:loading?0.6:1,transition:"all 0.15s"
          }}
          onMouseEnter={e=>{if(!loading)e.currentTarget.style.background="#f9fafb"}}
          onMouseLeave={e=>{if(!loading)e.currentTarget.style.background="white"}}
        >
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.5z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 19 13 24 13c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.5-5.2l-6.2-5.3C29.2 34.9 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.5l6.2 5.3C41 34.5 44 29.7 44 24c0-1.3-.1-2.6-.4-3.5z"/>
          </svg>
          {loading ? "กำลัง redirect..." : "Sign in with Google"}
        </button>

        <div style={{marginTop:24,paddingTop:18,borderTop:"1px solid #f1f5f9",fontSize:11,color:"#94a3b8",textAlign:"center"}}>
          ติดต่อ admin หากไม่สามารถ login ได้
        </div>
      </div>
    </div>
  );
}
