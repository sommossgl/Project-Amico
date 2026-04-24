"use client";
import { useEffect, useState } from "react";
import { authFetch, getUser, AmicoUser } from "@/lib/auth";

interface User { email: string; is_admin: boolean; created_at: string; }
interface Folder { id?: string; email: string; folder_id: string; folder_name: string; created_at?: string; }

export default function SettingsPage() {
  const [me, setMe] = useState<AmicoUser | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [newEmail, setNewEmail] = useState("");
  const [newAdmin, setNewAdmin] = useState(false);
  const [grantEmail, setGrantEmail] = useState("");
  const [grantFolderId, setGrantFolderId] = useState("");
  const [grantFolderName, setGrantFolderName] = useState("");

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      const [uRes, fRes] = await Promise.all([
        authFetch("/settings/users"),
        authFetch("/settings/folders"),
      ]);
      if (uRes.status === 403 || fRes.status === 403) {
        setErr("คุณไม่มีสิทธิ์เข้าถึงหน้านี้ (Admin เท่านั้น)");
        return;
      }
      const u = await uRes.json();
      const f = await fRes.json();
      setUsers(u.users || []);
      setFolders(f.folders || []);
    } catch {
      setErr("โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const u = getUser();
    if (!u) { window.location.href = "/login"; return; }
    if (!u.is_admin) { window.location.href = "/"; return; }
    setMe(u);
    load();
  }, []);

  const addUser = async () => {
    if (!newEmail.trim()) return;
    const r = await authFetch("/settings/users", {
      method: "POST",
      body: JSON.stringify({ email: newEmail.trim().toLowerCase(), is_admin: newAdmin }),
    });
    if (r.ok) { setNewEmail(""); setNewAdmin(false); load(); }
    else alert("เพิ่ม user ไม่สำเร็จ");
  };

  const deleteUser = async (email: string) => {
    if (!confirm(`ลบ user ${email}? (folder mapping จะถูกลบด้วย)`)) return;
    const r = await authFetch(`/settings/users/${encodeURIComponent(email)}`, { method: "DELETE" });
    if (r.ok) load();
    else alert("ลบไม่สำเร็จ");
  };

  const grantFolder = async () => {
    if (!grantEmail.trim() || !grantFolderId.trim() || !grantFolderName.trim()) return;
    const r = await authFetch("/settings/folders", {
      method: "POST",
      body: JSON.stringify({
        email: grantEmail.trim().toLowerCase(),
        folder_id: grantFolderId.trim(),
        folder_name: grantFolderName.trim(),
      }),
    });
    if (r.ok) {
      setGrantEmail(""); setGrantFolderId(""); setGrantFolderName("");
      load();
    } else alert("เพิ่มสิทธิ์ folder ไม่สำเร็จ");
  };

  const revokeFolder = async (email: string, folder_id: string) => {
    if (!confirm(`เอาสิทธิ์ folder ออกจาก ${email}?`)) return;
    const r = await authFetch(
      `/settings/folders?email=${encodeURIComponent(email)}&folder_id=${encodeURIComponent(folder_id)}`,
      { method: "DELETE" }
    );
    if (r.ok) load();
    else alert("ลบไม่สำเร็จ");
  };

  if (err) return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#f8fafc"}}>
      <div style={{background:"white",padding:28,borderRadius:12,border:"1px solid #fecaca",maxWidth:420}}>
        <h2 style={{color:"#b91c1c",fontSize:18,marginBottom:10}}>❌ {err}</h2>
        <a href="/" style={{color:"#1d4ed8",fontSize:13}}>← กลับหน้าหลัก</a>
      </div>
    </div>
  );

  if (loading || !me) return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",color:"#94a3b8"}}>กำลังโหลด...</div>
  );

  return (
    <div style={{minHeight:"100vh",background:"#f8fafc"}}>
      <nav style={{background:"#1e3a8a",color:"white",padding:"12px 24px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <a href="/" style={{color:"#bfdbfe",fontSize:13,textDecoration:"none"}}>← กลับหน้าหลัก</a>
          <span style={{color:"#3b82f6"}}>|</span>
          <span style={{fontWeight:700,fontSize:15}}>⚙️ Settings — Admin Panel</span>
        </div>
        <div style={{fontSize:12,color:"#bfdbfe"}}>{me.email}</div>
      </nav>

      <div style={{maxWidth:960,margin:"0 auto",padding:"28px 20px",display:"flex",flexDirection:"column",gap:24}}>

        {/* Users */}
        <section style={{background:"white",borderRadius:12,border:"1px solid #e2e8f0",padding:24}}>
          <h2 style={{fontSize:16,fontWeight:700,color:"#1e3a8a",marginBottom:14,display:"flex",alignItems:"center",gap:8}}>
            👥 Users ({users.length})
          </h2>

          <div style={{display:"flex",gap:8,marginBottom:16,padding:12,background:"#f8fafc",borderRadius:10}}>
            <input
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              placeholder="email@example.com"
              style={{flex:1,border:"1px solid #cbd5e1",borderRadius:8,padding:"8px 12px",fontSize:13,outline:"none"}}
            />
            <label style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:"#475569"}}>
              <input type="checkbox" checked={newAdmin} onChange={e => setNewAdmin(e.target.checked)} />
              Admin
            </label>
            <button onClick={addUser} style={{background:"#1d4ed8",color:"white",border:"none",borderRadius:8,padding:"8px 20px",fontSize:12,fontWeight:600,cursor:"pointer"}}>+ เพิ่ม</button>
          </div>

          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {users.map(u => (
              <div key={u.email} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",background:"#fafbfc",border:"1px solid #e2e8f0",borderRadius:8}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:13,color:"#1f2937",fontWeight:500}}>{u.email}</span>
                  {u.is_admin && <span style={{background:"#fbbf24",color:"#78350f",fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:10}}>ADMIN</span>}
                </div>
                {u.email !== me.email && (
                  <button onClick={() => deleteUser(u.email)} style={{background:"transparent",border:"1px solid #fecaca",color:"#b91c1c",borderRadius:6,padding:"3px 10px",fontSize:11,cursor:"pointer"}}>ลบ</button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Folder mappings */}
        <section style={{background:"white",borderRadius:12,border:"1px solid #e2e8f0",padding:24}}>
          <h2 style={{fontSize:16,fontWeight:700,color:"#1e3a8a",marginBottom:14,display:"flex",alignItems:"center",gap:8}}>
            📁 Folder Access ({folders.length})
          </h2>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1.4fr 1fr auto",gap:8,marginBottom:16,padding:12,background:"#f8fafc",borderRadius:10}}>
            <input value={grantEmail} onChange={e => setGrantEmail(e.target.value)} placeholder="email" style={{border:"1px solid #cbd5e1",borderRadius:8,padding:"8px 12px",fontSize:13,outline:"none"}} />
            <input value={grantFolderId} onChange={e => setGrantFolderId(e.target.value)} placeholder="folder ID (จาก URL)" style={{border:"1px solid #cbd5e1",borderRadius:8,padding:"8px 12px",fontSize:13,outline:"none"}} />
            <input value={grantFolderName} onChange={e => setGrantFolderName(e.target.value)} placeholder="ชื่อ folder" style={{border:"1px solid #cbd5e1",borderRadius:8,padding:"8px 12px",fontSize:13,outline:"none"}} />
            <button onClick={grantFolder} style={{background:"#1d4ed8",color:"white",border:"none",borderRadius:8,padding:"8px 16px",fontSize:12,fontWeight:600,cursor:"pointer"}}>+ ให้สิทธิ์</button>
          </div>

          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead>
              <tr style={{background:"#f1f5f9",color:"#475569"}}>
                <th style={{textAlign:"left",padding:"8px 12px"}}>Email</th>
                <th style={{textAlign:"left",padding:"8px 12px"}}>Folder</th>
                <th style={{textAlign:"left",padding:"8px 12px"}}>Folder ID</th>
                <th style={{padding:"8px 12px"}}></th>
              </tr>
            </thead>
            <tbody>
              {folders.map(f => (
                <tr key={`${f.email}-${f.folder_id}`} style={{borderBottom:"1px solid #f1f5f9"}}>
                  <td style={{padding:"8px 12px",color:"#374151"}}>{f.email}</td>
                  <td style={{padding:"8px 12px",color:"#374151",fontWeight:500}}>📂 {f.folder_name}</td>
                  <td style={{padding:"8px 12px",color:"#94a3b8",fontFamily:"monospace",fontSize:11}}>{f.folder_id.slice(0, 20)}...</td>
                  <td style={{padding:"8px 12px",textAlign:"right"}}>
                    <button onClick={() => revokeFolder(f.email, f.folder_id)} style={{background:"transparent",border:"1px solid #fecaca",color:"#b91c1c",borderRadius:6,padding:"3px 10px",fontSize:11,cursor:"pointer"}}>เอาออก</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <div style={{fontSize:11,color:"#94a3b8",textAlign:"center",paddingBottom:20}}>
          Amico v0.4.0 · Admin Panel · การเปลี่ยนแปลงมีผลทันที
        </div>
      </div>
    </div>
  );
}
