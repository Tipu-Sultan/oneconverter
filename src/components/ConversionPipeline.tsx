"use client";

import { typeClass, typeIcon } from "@/lib/converters";
import type { ConvertTarget } from "@/lib/converters";

interface ConversionPipelineProps {
  fileCount: number;
  target: ConvertTarget;
  doneCount: number;
  isConverting: boolean;
}

export default function ConversionPipeline({
  fileCount,
  target,
  doneCount,
  isConverting,
}: ConversionPipelineProps) {
  const ext = target === "jpeg" ? "jpg" : target;
  const pct = fileCount > 0 ? Math.round((doneCount / fileCount) * 100) : 0;

  return (
    <div className="rounded-xl border border-[#2a2a2a] bg-[#161616] p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
        <span className="text-[10px] font-mono uppercase tracking-[2px] text-[#666]">
          Pipeline
        </span>
      </div>

      <div className="flex items-center gap-3 justify-center py-3">
        {/* Source */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="w-10 h-10 rounded-lg bg-[#0e0e0e] border border-[#2a2a2a] flex items-center justify-center text-xl">
            🖼️
          </div>
          <span className="text-[9px] font-mono text-[#555] uppercase tracking-[1px]">IMAGE</span>
        </div>

        {/* Arrow flow */}
        <div className="flex items-center gap-1 flex-1 max-w-[100px]">
          <div className="flex-1 h-0.5 bg-gradient-to-r from-[#333] to-[#f59e0b]" />
          <div
            className={`text-[#f59e0b] text-xs ${isConverting ? "animate-pulse" : ""}`}
          >
            ▶
          </div>
          <div className="flex-1 h-0.5 bg-gradient-to-r from-[#f59e0b] to-[#333]" />
        </div>

        {/* Target */}
        <div className="flex flex-col items-center gap-1.5">
          <div
            className={`w-10 h-10 rounded-lg border flex items-center justify-center text-xl transition-all ${isConverting ? "animate-glow" : ""} type-${ext}`}
          >
            {typeIcon(ext)}
          </div>
          <span className={`text-[9px] font-mono uppercase tracking-[1px] type-${ext}`}>
            {ext.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 mt-2">
        {[
          { label: "Total",   val: String(fileCount)  },
          { label: "Done",    val: String(doneCount)   },
          { label: "Remain",  val: String(Math.max(0, fileCount - doneCount)) },
        ].map(({ label, val }) => (
          <div key={label} className="text-center bg-[#0e0e0e] rounded-lg py-2 border border-[#2a2a2a]">
            <div className="font-mono text-lg font-bold text-[#f59e0b]">{val}</div>
            <div className="text-[9px] font-mono text-[#555] uppercase tracking-[1px] mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Progress */}
      {fileCount > 0 && (
        <div className="mt-3">
          <div className="h-1 bg-[#0e0e0e] rounded-full overflow-hidden border border-[#2a2a2a]">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${pct}%`,
                background: isConverting
                  ? "linear-gradient(90deg, #f59e0b, #fbbf24)"
                  : doneCount === fileCount && fileCount > 0
                  ? "#22c55e"
                  : "#f59e0b",
              }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[9px] font-mono text-[#555]">
              {isConverting ? "Converting…" : doneCount === fileCount && fileCount > 0 ? "Complete" : "Ready"}
            </span>
            <span className="text-[9px] font-mono text-[#f59e0b]">{pct}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
