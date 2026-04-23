"use client";
import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface Session { id: string; created_at: string; message_count: number; }
interface Props { onSelectSession: (id: string) => void; activeSession: string | null; }

export default function HistorySidebar({ onSelectSession, activeSession }: Props) {
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    fetch(`${API}/sessions`).then((r) => r.json()).then((d) => setSessions(d.sessions ?? []));
  }, [activeSession]);

  return (
    <aside className="w-64 bg-white border-r border-gray-100 p-4 flex flex-col">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">ประวัติ</h2>
      {sessions.length === 0 ? (
        <p className="text-gray-400 text-xs">ยังไม่มีการสนทนา</p>
      ) : (
        <ul className="space-y-1 overflow-y-auto flex-1">
          {sessions.map((s) => (
            <li key={s.id}>
              <button
                onClick={() => onSelectSession(s.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs transition ${
                  activeSession === s.id ? "bg-blue-50 text-blue-800 font-medium" : "hover:bg-gray-50 text-gray-600"
                }`}
              >
                <div className="truncate">Session {s.id.slice(0, 8)}...</div>
                <div className="text-gray-400">{s.message_count} ข้อความ</div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
