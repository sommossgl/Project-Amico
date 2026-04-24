"use client";
import { AmicoUser, logout } from "@/lib/auth";

interface Props { user: AmicoUser }

export default function Navbar({ user }: Props) {
  const initial = (user.name || user.email).charAt(0).toUpperCase();
  return (
    <nav style={{background:"#1e3a8a",color:"white",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 20px",height:52,flexShrink:0}}>
      <div style={{display:"flex",alignItems:"center",gap:10,fontWeight:700,fontSize:16}}>
        <div style={{width:28,height:28,background:"#3b82f6",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>🤖</div>
        Project Amico
        <span style={{background:"#1d4ed8",border:"1px solid #3b82f6",borderRadius:20,padding:"2px 10px",fontSize:11,color:"#93c5fd"}}>v0.4.0 · SompenTech</span>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:12,fontSize:13,color:"#bfdbfe"}}>
        {user.is_admin && (
          <span style={{background:"#fbbf24",color:"#78350f",fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:10}}>ADMIN</span>
        )}
        <span style={{maxWidth:220,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{user.name || user.email}</span>
        {user.picture ? (
          <img src={user.picture} alt="" style={{width:30,height:30,borderRadius:"50%"}} />
        ) : (
          <div style={{width:30,height:30,background:"#3b82f6",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:600,color:"white"}}>{initial}</div>
        )}
        <button onClick={logout} style={{background:"transparent",border:"1px solid #3b82f6",color:"#bfdbfe",borderRadius:6,padding:"4px 10px",fontSize:11,cursor:"pointer"}}>Logout</button>
      </div>
    </nav>
  );
}
