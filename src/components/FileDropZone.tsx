"use client";

import { useRef, useState } from "react";

interface FileDropZoneProps {
  onFiles: (files: File[]) => void;
  hasFiles: boolean;
}

const ACCEPTED = ["image/jpeg","image/jpg","image/png","image/webp","image/gif","image/bmp"];

export default function FileDropZone({ onFiles, hasFiles }: FileDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = (raw: FileList | null) => {
    if (!raw) return;
    const valid = Array.from(raw).filter((f) => ACCEPTED.includes(f.type));
    if (valid.length === 0) { alert("Please upload image files (JPG, PNG, WEBP, GIF, BMP)."); return; }
    onFiles(valid);
  };

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files); }}
      className={`
        relative cursor-pointer rounded-2xl border-2 transition-all duration-300 overflow-hidden
        ${isDragging
          ? "border-[#f59e0b] bg-[rgba(245,158,11,0.08)] scale-[1.01]"
          : hasFiles
          ? "border-[#2a2a2a] bg-[#161616] hover:border-[#333]"
          : "border-dashed border-[#333] bg-[#161616] hover:border-[#f59e0b] hover:bg-[rgba(245,158,11,0.04)]"
        }
      `}
      style={{ minHeight: hasFiles ? "auto" : 180 }}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* Ambient corner accent */}
      <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[#f59e0b] rounded-tl-2xl opacity-40 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[#f59e0b] rounded-br-2xl opacity-40 pointer-events-none" />

      <div className="flex flex-col items-center justify-center gap-3 py-10 px-6">
        <div className={`text-5xl transition-transform duration-300 ${isDragging ? "scale-125" : ""}`}>
          {isDragging ? "📂" : "🗂️"}
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-[#e5e5e5]">
            {hasFiles ? "Drop more files to add" : "Drop images here"}
          </p>
          <p className="text-xs text-[#555] mt-1 font-mono">
            JPG · PNG · WEBP · GIF · BMP &nbsp;|&nbsp; Multi-file supported
          </p>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
          className="px-5 py-2 rounded-lg border border-[#333] bg-[#1c1c1c] text-xs text-[#888] font-mono hover:border-[#f59e0b] hover:text-[#f59e0b] transition-colors"
        >
          browse files
        </button>
      </div>
    </div>
  );
}
