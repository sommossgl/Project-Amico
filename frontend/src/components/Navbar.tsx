export default function Navbar() {
  return (
    <nav style={{background:"#1e3a8a",color:"white",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 20px",height:52,flexShrink:0}}>
      <div style={{display:"flex",alignItems:"center",gap:10,fontWeight:700,fontSize:16}}>
        <div style={{width:28,height:28,background:"#3b82f6",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>🤖</div>
        Project Amico
        <span style={{background:"#1d4ed8",border:"1px solid #3b82f6",borderRadius:20,padding:"2px 10px",fontSize:11,color:"#93c5fd"}}>SompenTech Internal</span>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:8,fontSize:13,color:"#bfdbfe"}}>
        <span>สมประสงค์ กาบบัวลอย</span>
        <div style={{width:30,height:30,background:"#3b82f6",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:600,color:"white"}}>ส</div>
      </div>
    </nav>
  );
}
