import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Project Amico — SompenTech", description: "AI-powered Google Drive chat for SompenTech team" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="th"><body style={{fontFamily:"'Segoe UI',system-ui,sans-serif",background:"#f0f4f8",height:"100vh",display:"flex",flexDirection:"column"}}>{children}</body></html>;
}
