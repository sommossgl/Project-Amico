import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Project Amico — SompenTech",
  description: "Chat กับไฟล์ Google Drive ด้วย AI",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
