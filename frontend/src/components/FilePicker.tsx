"use client";
import { useEffect, useState } from "react";
import { DriveFile } from "@/app/page";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface Props {
  onSelect: (file: DriveFile) => void;
  selectedFile: DriveFile | null;
}

export default function FilePicker({ onSelect, selectedFile }: Props) {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/files`)
      .then((r) => r.json())
      .then((data) => setFiles(data.files ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <h2 className="font-semibold text-gray-700 mb-3">📁 เลือกไฟล์จาก Google Drive</h2>
      {loading ? (
        <p className="text-gray-400">กำลังโหลดไฟล์...</p>
      ) : (
        <ul className="space-y-2 max-h-60 overflow-y-auto">
          {files.map((f) => (
            <li key={f.id}>
              <button
                onClick={() => onSelect(f)}
                className={`w-full text-left px-4 py-2 rounded-lg transition ${
                  selectedFile?.id === f.id
                    ? "bg-blue-100 text-blue-800 font-semibold"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
              >
                {f.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
