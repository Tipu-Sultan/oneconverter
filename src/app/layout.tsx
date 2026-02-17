import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FileForge — Universal File Converter",
  description: "Convert images to PDF, DOCX, PPTX and between image formats. 100% client-side.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
