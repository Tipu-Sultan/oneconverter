"use client";

import { useState } from "react";
import { fmtBytes, typeIcon } from "@/lib/converters";

export type FileStatus = "queued" | "converting" | "done" | "error";

export interface QueuedFile {
  id: string;
  file: File;
  dataUrl: string;
  status: FileStatus;
  progress: number;
  label?: string;           // custom output filename (no extension)
  resultBlob?: Blob;
  resultFilename?: string;
  error?: string;
}

interface FileQueueItemProps {
  item: QueuedFile;
  index: number;
  total: number;
  targetExt: string;
  onRemove: (id: string) => void;
  onRename: (id: string, label: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  // drag-and-drop
  onDragStart: (index: number) => void;
  onDragOver: (index: number) => void;
  onDragEnd: () => void;
  isDragging: boolean;
  isDragOver: boolean;
}

const STATUS_CONFIG = {
  queued:     { label: "QUEUED",     color: "#666",    bg: "rgba(102,102,102,0.1)",  border: "rgba(102,102,102,0.2)" },
  converting: { label: "CONVERTING", color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.3)"  },
  done:       { label: "DONE",       color: "#22c55e", bg: "rgba(34,197,94,0.1)",   border: "rgba(34,197,94,0.3)"   },
  error:      { label: "ERROR",      color: "#ef4444", bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.3)"   },
};

export default function FileQueueItem({
  item, index, total, targetExt, onRemove, onRename,
  onMoveUp, onMoveDown, onDragStart, onDragOver, onDragEnd,
  isDragging, isDragOver,
}: FileQueueItemProps) {
  const cfg = STATUS_CONFIG[item.status];
  const srcExt = item.file.name.split(".").pop() ?? "img";
  const ext = targetExt === "jpeg" ? "jpg" : targetExt;
  const [editing, setEditing] = useState(false);
  const [labelVal, setLabelVal] = useState(item.label ?? item.file.name.replace(/\.[^.]+$/, ""));

  const handleDownload = () => {
    if (!item.resultBlob || !item.resultFilename) return;
    const url = URL.createObjectURL(item.resultBlob);
    const a = document.createElement("a");
    a.href = url; a.download = item.resultFilename; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const commitRename = () => {
    setEditing(false);
    if (labelVal.trim()) onRename(item.id, labelVal.trim());
  };

  const canReorder = item.status !== "converting";

  return (
    <div
      draggable={canReorder}
      onDragStart={() => canReorder && onDragStart(index)}
      onDragOver={(e) => { e.preventDefault(); onDragOver(index); }}
      onDragEnd={onDragEnd}
      className={`group relative rounded-xl border bg-[#161616] overflow-hidden transition-all duration-200 animate-fade-in
        ${isDragging ? "opacity-40 scale-[0.98]" : ""}
        ${isDragOver ? "border-[#f59e0b] bg-[rgba(245,158,11,0.04)]" : ""}
      `}
      style={{
        borderColor: isDragOver ? "#f59e0b"
          : item.status === "done" ? "rgba(34,197,94,0.2)"
          : item.status === "error" ? "rgba(239,68,68,0.2)"
          : "#2a2a2a",
        cursor: canReorder ? "grab" : "default",
      }}
    >
      <div className="flex items-center gap-2 p-3">

        {/* ── Drag handle + sequence number ── */}
        <div className="flex flex-col items-center gap-0.5 flex-shrink-0 w-8">
          <span className="text-[9px] font-mono text-[#444] leading-none">{String(index + 1).padStart(2, "0")}</span>
          <div className="text-[#333] text-xs leading-none select-none">⠿</div>
          {/* Arrow reorder buttons */}
          <div className="flex flex-col gap-0.5 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              disabled={index === 0 || !canReorder}
              onClick={() => onMoveUp(index)}
              className="text-[#444] hover:text-[#f59e0b] disabled:opacity-20 disabled:cursor-not-allowed text-[10px] leading-none"
              title="Move up"
            >▲</button>
            <button
              disabled={index === total - 1 || !canReorder}
              onClick={() => onMoveDown(index)}
              className="text-[#444] hover:text-[#f59e0b] disabled:opacity-20 disabled:cursor-not-allowed text-[10px] leading-none"
              title="Move down"
            >▼</button>
          </div>
        </div>

        {/* ── Thumbnail ── */}
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#0e0e0e] border border-[#2a2a2a] flex-shrink-0 relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.dataUrl} alt="" className="w-full h-full object-cover" />
          {item.status === "converting" && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-[#f59e0b] border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* ── Info + rename ── */}
        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="flex items-center gap-1">
              <input
                autoFocus
                value={labelVal}
                onChange={(e) => setLabelVal(e.target.value)}
                onBlur={commitRename}
                onKeyDown={(e) => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") setEditing(false); }}
                className="flex-1 bg-[#0e0e0e] border border-[#f59e0b] rounded-lg px-2 py-0.5 text-xs font-mono text-[#e5e5e5] outline-none"
              />
              <button onClick={commitRename} className="text-[#f59e0b] text-[10px] font-mono">✓</button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 min-w-0">
              <p className="text-xs font-bold text-[#e5e5e5] truncate">{item.label || item.file.name.replace(/\.[^.]+$/, "")}</p>
              {item.status !== "converting" && (
                <button
                  onClick={() => setEditing(true)}
                  className="opacity-0 group-hover:opacity-100 text-[#444] hover:text-[#f59e0b] text-[10px] transition-all flex-shrink-0"
                  title="Rename output file"
                >✎</button>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border font-bold type-${srcExt.toLowerCase()}`}>
              {srcExt.toUpperCase()}
            </span>
            <span className="text-[10px] text-[#444]">→</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border font-bold type-${ext}`}>
              {ext.toUpperCase()}
            </span>
            <span className="text-[10px] text-[#555]">{fmtBytes(item.file.size)}</span>
          </div>

          {item.status === "converting" && (
            <div className="mt-1.5 h-1 bg-[#2a2a2a] rounded-full overflow-hidden">
              <div className="progress-stripe h-full rounded-full" style={{ width: `${item.progress}%` }} />
            </div>
          )}
          {item.status === "error" && (
            <p className="text-[10px] text-red-400 mt-1 truncate">{item.error}</p>
          )}
          {item.status === "done" && item.resultBlob && (
            <p className="text-[10px] text-[#444] font-mono mt-1">
              {item.resultFilename} · {fmtBytes(item.resultBlob.size)}
            </p>
          )}
        </div>

        {/* ── Right actions ── */}
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border"
            style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}>
            {cfg.label}
          </span>
          {item.status === "done" && item.resultBlob && (
            <button
              onClick={handleDownload}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.3)] text-[#22c55e] text-[10px] font-mono hover:bg-[rgba(34,197,94,0.2)] transition-colors"
            >⬇ Save</button>
          )}
          {item.status !== "converting" && (
            <button
              onClick={() => onRemove(item.id)}
              className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded text-[#555] hover:text-red-400 hover:bg-[rgba(239,68,68,0.1)] transition-all text-xs"
            >×</button>
          )}
        </div>
      </div>
    </div>
  );
}
