import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Exam Formatter — QuizFlow Document Engine",
  description: "ระบบแปลงเอกสารข้อสอบเข้าสู่รูปแบบมาตรฐาน Google Doc ตามคัมภีร์ Master Design Constitution",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className="min-h-screen bg-[var(--background)] text-[var(--ui-ink)] antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
