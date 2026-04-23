"use client";
import { useState } from "react";
import FilePicker from "@/components/FilePicker";
import ChatBox from "@/components/ChatBox";
import HistorySidebar from "@/components/HistorySidebar";

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
}

export default function Home() {
  const [selectedFiles, setSelectedFiles] = useState<DriveFile[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const toggleFile = (file: DriveFile) => {
    setSelectedFiles((prev) =>
      prev.find((f) => f.id === file.id)
        ? prev.filter((f) => f.id !== file.id)
        : [...prev, file]
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <HistorySidebar onSelectSession={setSessionId} activeSession={sessionId} />

      {/* Main */}
      <main className="flex-1 flex flex-col items-center p-8">
        <h1 className="text-3xl font-bold text-blue-800 mb-1">🤖 Project Amico</h1>
        <p className="text-gray-500 mb-6 text-sm">Chat กับไฟล์ Google Drive ด้วย AI — SompenTech</p>

        <div className="w-full max-w-2xl space-y-4">
          <FilePicker onToggle={toggleFile} selectedFiles={selectedFiles} />
          {selectedFiles.length > 0 && (
            <ChatBox files={selectedFiles} sessionId={sessionId} onSessionCreated={setSessionId} />
          )}
        </div>
      </main>
    </div>
  );
}
