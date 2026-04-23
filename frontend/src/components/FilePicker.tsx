"use client";
import { useEffect, useState } from "react";
import { DriveFile } from "@/app/page";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface Props {
  onToggle: (file: DriveFile) => void;
  selectedFiles: DriveFile[];
}

export default function FilePicker({ onToggle, selectedFiles }: Props) {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");

  const fetchFiles = (q = "") => {
    setLoading(true);
    const url = q ? `${API}/files/search?q=${encodeURIComponent(q)}` : `${API}/files`;
    fetch(url)
      .then((r) => r.json())
      .then((d) => setFiles(d.files ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchFiles(); }, []);

  return (
    <div className="bg-white rounded-2xl shadow p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-gray-700">📁 Google Drive</h2>
        {selectedFiles.length > 0 && (
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
            {selectedFiles.length} ไฟล์ที่เลือก
          </span>
        )}
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && fetchFiles(query)}
        placeholder="ค้นหาไฟล์... (Enter)"
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
      />

      {loading ? (
        <p className="text-gray-400 text-sm">กำลังโหลด...</p>
      ) : (
        <ul className="space-y-1 max-h-52 overflow-y-auto">
          {files.map((f) => {
            const selected = selectedFiles.find((s) => s.id === f.id);
            return (
              <li key={f.id}>
                <button
                  onClick={() => onToggle(f)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition flex items-center gap-2 ${
                    selected ? "bg-blue-50 text-blue-800 font-medium" : "hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <span>{selected ? "✅" : "⬜"}</span>
                  <span className="truncate">{f.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
