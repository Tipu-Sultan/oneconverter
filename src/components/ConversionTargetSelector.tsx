"use client";

import { typeClass, typeIcon } from "@/lib/converters";

export type ConvertTarget = "pdf" | "docx" | "pptx" | "jpg" | "jpeg" | "png" | "webp" | "bmp" | "gif";

interface TargetGroup {
  label: string;
  targets: { value: ConvertTarget; label: string; desc: string }[];
}

const GROUPS: TargetGroup[] = [
  {
    label: "Documents",
    targets: [
      { value: "pdf",  label: "PDF",  desc: "Portable Document" },
      { value: "docx", label: "DOCX", desc: "Word Document" },
      { value: "pptx", label: "PPTX", desc: "PowerPoint Slide" },
    ],
  },
  {
    label: "Image Formats",
    targets: [
      { value: "jpg",  label: "JPG",  desc: "JPEG Compressed" },
      { value: "png",  label: "PNG",  desc: "Lossless / Alpha" },
      { value: "webp", label: "WEBP", desc: "Modern Web Format" },
      { value: "bmp",  label: "BMP",  desc: "Bitmap Uncompressed" },
      { value: "gif",  label: "GIF",  desc: "Graphics Interchange" },
    ],
  },
];

interface ConversionTargetSelectorProps {
  selected: ConvertTarget;
  onChange: (t: ConvertTarget) => void;
}

export default function ConversionTargetSelector({
  selected,
  onChange,
}: ConversionTargetSelectorProps) {
  return (
    <div className="space-y-4">
      {GROUPS.map((group) => (
        <div key={group.label}>
          {/* Group header */}
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[10px] font-mono uppercase tracking-[3px] text-[#666]">
              {group.label}
            </span>
            <div className="flex-1 h-px bg-[#2a2a2a]" />
          </div>
          {/* Pills */}
          <div className="flex flex-wrap gap-2">
            {group.targets.map(({ value, label, desc }) => {
              const isActive = selected === value;
              const ext = value === "jpeg" ? "jpg" : value;
              return (
                <button
                  key={value}
                  onClick={() => onChange(value)}
                  className={`
                    group relative flex flex-col items-start px-4 py-3 rounded-xl border
                    font-mono text-left transition-all duration-200
                    ${isActive
                      ? "border-[#f59e0b] bg-[rgba(245,158,11,0.1)] shadow-[0_0_16px_rgba(245,158,11,0.2)]"
                      : "border-[#2a2a2a] bg-[#161616] hover:border-[#333] hover:bg-[#1c1c1c]"
                    }
                  `}
                >
                  {isActive && (
                    <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
                  )}
                  <span className={`text-xs font-bold mb-0.5 ${isActive ? "text-[#f59e0b]" : "text-[#e5e5e5]"}`}>
                    {typeIcon(ext)} {label}
                  </span>
                  <span className="text-[10px] text-[#555]">{desc}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
