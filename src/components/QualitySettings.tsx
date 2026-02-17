"use client";

import type { ConvertTarget } from "@/lib/converters";

interface QualitySettingsProps {
  target: ConvertTarget;
  quality: number;
  onQualityChange: (q: number) => void;
}

const needsQuality = (t: ConvertTarget) =>
  t === "jpg" || t === "jpeg" || t === "webp";

export default function QualitySettings({
  target,
  quality,
  onQualityChange,
}: QualitySettingsProps) {
  if (!needsQuality(target)) return null;

  const pct = ((quality - 1) / 99) * 100;

  return (
    <div className="rounded-xl border border-[#2a2a2a] bg-[#161616] p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
          <span className="text-[10px] font-mono uppercase tracking-[2px] text-[#666]">
            Compression Quality
          </span>
        </div>
        <span className="font-mono text-base font-bold text-[#f59e0b]">{quality}%</span>
      </div>

      {/* Track */}
      <div className="relative h-2 bg-[#0e0e0e] rounded-full border border-[#2a2a2a] cursor-pointer"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const val = Math.round(1 + (x / rect.width) * 99);
          onQualityChange(Math.max(1, Math.min(100, val)));
        }}
      >
        <div
          className="absolute top-0 left-0 h-full rounded-full transition-all"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, #f59e0b, #fbbf24)",
          }}
        />
        <input
          type="range"
          min={1} max={100}
          value={quality}
          onChange={(e) => onQualityChange(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer"
        />
      </div>

      <div className="flex justify-between mt-2">
        {[
          { label: "Low", val: 40 },
          { label: "Medium", val: 70 },
          { label: "High", val: 85 },
          { label: "Max", val: 100 },
        ].map(({ label, val }) => (
          <button
            key={val}
            onClick={() => onQualityChange(val)}
            className={`text-[9px] font-mono px-2 py-0.5 rounded border transition-all ${
              quality === val
                ? "border-[#f59e0b] text-[#f59e0b] bg-[rgba(245,158,11,0.1)]"
                : "border-[#2a2a2a] text-[#555] hover:border-[#444] hover:text-[#888]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
