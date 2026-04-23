"use client";
import { useState, useRef, useEffect } from "react";
import { DriveFile } from "@/app/page";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface Message { role: "user" | "assistant"; text: string; }
interface Props {
  files: DriveFile[];
  sessionId: string | null;
  onSessionCreated: (id: string) => void;
}

export default function ChatBox({ files, sessionId, onSessionCreated }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMessages([]); }, [files.map((f) => f.id).join(",")]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function send() {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((m) => [...m, { role: "user", text: userMsg }]);
    setLoading(true);

    try {
      const isMulti = files.length > 1;
      const endpoint = isMulti ? "/chat/multi" : "/chat";
      const body = isMulti
        ? { files: files.map((f) => ({ id: f.id, name: f.name, mimeType: f.mimeType })), message: userMsg, session_id: sessionId }
        : { file_id: files[0].id, file_name: files[0].name, mime_type: files[0].mimeType, message: userMsg, session_id: sessionId };

      const res = await fetch(`${API}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.session_id) onSessionCreated(data.session_id);
      setMessages((m) => [...m, { role: "assistant", text: data.reply }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", text: "❌ เกิดข้อผิดพลาด กรุณาลองใหม่" }]);
    } finally {
      setLoading(false);
    }
  }

  const fileLabel = files.length === 1 ? files[0].name : `${files.length} ไฟล์`;

  return (
    <div className="bg-white rounded-2xl shadow p-5 flex flex-col h-[500px]">
      <p className="text-sm text-blue-700 font-medium mb-3">💬 Chat กับ: {fileLabel}</p>
      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {messages.length === 0 && (
          <p className="text-gray-400 text-sm text-center mt-8">ถามอะไรก็ได้เกี่ยวกับไฟล์ที่เลือก</p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm whitespace-pre-wrap ${
              m.role === "user" ? "bg-blue-600 text-white rounded-br-sm" : "bg-gray-100 text-gray-800 rounded-bl-sm"
            }`}>{m.text}</div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 px-4 py-2 rounded-2xl text-gray-400 text-sm animate-pulse">Amico กำลังคิด...</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="พิมพ์คำถาม แล้วกด Enter..."
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button onClick={send} disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 hover:bg-blue-700 transition">
          ส่ง
        </button>
      </div>
    </div>
  );
}
