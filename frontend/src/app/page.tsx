"use client";
import { useState } from "react";
import FilePicker from "@/components/FilePicker";
import ChatBox from "@/components/ChatBox";

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
}

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<DriveFile | null>(null);

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center p-8">
      <h1 className="text-3xl font-bold text-blue-800 mb-2">🤖 Project Amico</h1>
      <p className="text-gray-500 mb-8">Chat กับไฟล์ Google Drive ของคุณด้วย AI</p>

      <div className="w-full max-w-2xl space-y-6">
        <FilePicker onSelect={setSelectedFile} selectedFile={selectedFile} />
        {selectedFile && <ChatBox file={selectedFile} />}
      </div>
    </main>
  );
}
