"use client";

import { useState, useRef } from "react";
import FileDropZone from "@/components/FileDropZone";
import ConversionTargetSelector from "@/components/ConversionTargetSelector";
import QualitySettings from "@/components/QualitySettings";
import ConversionPipeline from "@/components/ConversionPipeline";
import FileQueueItem from "@/components/FileQueueItem";
import { useConverter } from "@/hooks/useConverter";
import { fmtBytes } from "@/lib/converters";
import type { ConvertTarget } from "@/lib/converters";

export default function Home() {
  const [target, setTarget] = useState<ConvertTarget>("pdf");
  const [quality, setQuality] = useState(85);
  const [pdfMerge, setPdfMerge] = useState(true);
  const [mergedName, setMergedName] = useState("merged");

  // Drag-and-drop reorder state
  const dragFrom = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  const {
    queue, isConverting, mergedPdfBlob,
    addFiles, removeFile, clearAll, resetAll, reorderFile, renameFile,
    convertAll, downloadAll, downloadMergedPdf,
    doneCount, hasConvertible, allDone,
  } = useConverter();

  const ext = target === "jpeg" ? "jpg" : target;
  const isPdf = target === "pdf";
  const showMergeOption = isPdf && queue.length > 1;
  const isMergedMode = isPdf && pdfMerge && queue.length > 1;

  const handleDragStart = (index: number) => { dragFrom.current = index; };
  const handleDragOver = (index: number) => { setDragOver(index); };
  const handleDragEnd = () => {
    if (dragFrom.current !== null && dragOver !== null && dragFrom.current !== dragOver) {
      reorderFile(dragFrom.current, dragOver);
    }
    dragFrom.current = null;
    setDragOver(null);
  };

  const handleMoveUp = (index: number) => { if (index > 0) reorderFile(index, index - 1); };
  const handleMoveDown = (index: number) => { if (index < queue.length - 1) reorderFile(index, index + 1); };

  return (
    <main className="relative z-10 min-h-screen">
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{ width:600, height:2, background:"linear-gradient(90deg,transparent,#f59e0b,transparent)", boxShadow:"0 0 60px 20px rgba(245,158,11,0.15)" }}
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 pb-20">

        {/* HEADER */}
        <header className="mb-10">
          <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold text-black flex-shrink-0" style={{background:"linear-gradient(135deg,#f59e0b,#fbbf24)"}}>
                ⚡
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight leading-none">
                  <span style={{color:"#f59e0b"}}>OneFile</span>
                  <span className="text-[#e5e5e5]">Converter</span>
                </h1>
                <p className="text-[10px] font-mono text-[#555] mt-0.5 tracking-[2px] uppercase">Design & Developed By : Tipu Sultan</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#161616] border border-[#2a2a2a] font-mono text-[11px]">
              <span className={`w-1.5 h-1.5 rounded-full ${isConverting ? "bg-[#f59e0b] animate-pulse" : "bg-[#22c55e]"}`} />
              <span className="text-[#666]">{isConverting ? "CONVERTING" : "READY"}</span>
              <span className="text-[#444]">|</span>
              <span className="text-[#555]">100% CLIENT-SIDE</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {[{icon:"📄",label:"→ PDF"},{icon:"📝",label:"→ DOCX"},{icon:"📊",label:"→ PPTX"},{icon:"🔄",label:"PNG ↔ JPG"},{icon:"🌐",label:"→ WEBP"},{icon:"🎨",label:"→ BMP/GIF"}].map(({icon,label})=>(
              <span key={label} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#161616] border border-[#2a2a2a] text-[10px] font-mono text-[#666]">{icon} {label}</span>
            ))}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          {/* LEFT */}
          <div className="space-y-5">
            <section>
              <SectionLabel>01 — Upload Images</SectionLabel>
              <FileDropZone onFiles={addFiles} hasFiles={queue.length > 0} />
            </section>

            {queue.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <SectionLabel>02 — File Queue ({queue.length})</SectionLabel>
                  <div className="flex items-center gap-3">
                    {/* Tips */}
                    <span className="text-[9px] font-mono text-[#444] hidden sm:block">
                      drag ⠿ to reorder · ✎ to rename
                    </span>
                    <button
                      onClick={clearAll}
                      disabled={isConverting}
                      className="text-[10px] font-mono text-[#555] hover:text-red-400 transition-colors disabled:opacity-40"
                    >clear all ×</button>
                  </div>
                </div>

                {/* PDF Merge toggle — only shown when target=pdf and 2+ files */}
                {showMergeOption && (
                  <div className="mb-3 flex items-center gap-3 p-3 rounded-xl border border-[#2a2a2a] bg-[#161616]">
                    <button
                      onClick={() => setPdfMerge(!pdfMerge)}
                      className={`relative w-9 h-5 rounded-full border transition-all flex-shrink-0 ${
                        pdfMerge
                          ? "bg-[#f59e0b] border-[#f59e0b]"
                          : "bg-[#0e0e0e] border-[#333]"
                      }`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${pdfMerge ? "left-[18px]" : "left-0.5"}`} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-[#e5e5e5] font-mono">
                        {pdfMerge ? "Merge all into one PDF" : "Separate PDF per image"}
                      </p>
                      <p className="text-[10px] text-[#555] font-mono mt-0.5">
                        {pdfMerge
                          ? `${queue.length} images → 1 PDF file · sequence order matters`
                          : `${queue.length} images → ${queue.length} PDF files`}
                      </p>
                    </div>
                    {pdfMerge && (
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="text-[10px] font-mono text-[#555]">filename:</span>
                        <input
                          value={mergedName}
                          onChange={(e) => setMergedName(e.target.value)}
                          className="w-28 bg-[#0e0e0e] border border-[#333] rounded-lg px-2 py-0.5 text-xs font-mono text-[#e5e5e5] outline-none focus:border-[#f59e0b] transition-colors"
                          placeholder="merged"
                        />
                        <span className="text-[10px] font-mono text-[#555]">.pdf</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                  {queue.map((item, index) => (
                    <FileQueueItem
                      key={item.id}
                      item={item}
                      index={index}
                      total={queue.length}
                      targetExt={ext}
                      onRemove={removeFile}
                      onRename={renameFile}
                      onMoveUp={handleMoveUp}
                      onMoveDown={handleMoveDown}
                      onDragStart={handleDragStart}
                      onDragOver={handleDragOver}
                      onDragEnd={handleDragEnd}
                      isDragging={dragFrom.current === index}
                      isDragOver={dragOver === index}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Action buttons */}
            {queue.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Convert / Refresh */}
                {allDone ? (
                  <button
                    onClick={resetAll}
                    className="flex-1 py-4 rounded-xl font-mono font-bold text-sm border border-[#333] bg-[#161616] text-[#888] hover:border-[#f59e0b] hover:text-[#f59e0b] transition-all duration-200 hover:-translate-y-0.5 flex items-center justify-center gap-2"
                  >
                    <span className="text-base">↺</span> Convert Again
                  </button>
                ) : (
                  <button
                    onClick={() => convertAll(target, quality, isMergedMode)}
                    disabled={isConverting || !hasConvertible}
                    className="flex-1 relative py-4 rounded-xl font-mono font-bold text-sm text-black transition-all duration-200 overflow-hidden disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(245,158,11,0.3)] active:translate-y-0"
                    style={{background:"linear-gradient(135deg,#f59e0b,#fbbf24)"}}
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {isConverting ? (
                        <><span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />Converting…</>
                      ) : isMergedMode ? (
                        <>⚡ Merge {queue.length} Images → PDF</>
                      ) : (
                        <>⚡ Convert {hasConvertible ? queue.filter(i=>i.status==="queued"||i.status==="error").length : ""} Files → {ext.toUpperCase()}</>
                      )}
                    </span>
                  </button>
                )}

                {/* Merged PDF download */}
                {mergedPdfBlob && isMergedMode && (
                  <button
                    onClick={() => downloadMergedPdf((mergedName || "merged") + ".pdf")}
                    className="px-5 py-4 rounded-xl font-mono font-bold text-sm border border-[rgba(239,68,68,0.4)] bg-[rgba(239,68,68,0.08)] text-[#ef4444] hover:bg-[rgba(239,68,68,0.15)] transition-all duration-200 hover:-translate-y-0.5 flex items-center gap-2 whitespace-nowrap"
                  >
                    📄 Download PDF
                    <span className="text-[10px] opacity-70">({fmtBytes(mergedPdfBlob.size)})</span>
                  </button>
                )}

                {/* Download all individual */}
                {!isMergedMode && doneCount > 0 && (
                  <button
                    onClick={downloadAll}
                    className="px-6 py-4 rounded-xl font-mono font-bold text-sm border border-[rgba(34,197,94,0.4)] bg-[rgba(34,197,94,0.08)] text-[#22c55e] hover:bg-[rgba(34,197,94,0.15)] transition-all duration-200 hover:-translate-y-0.5"
                  >
                    ⬇ Download All ({doneCount})
                  </button>
                )}
              </div>
            )}

            {/* Merged PDF success banner */}
            {mergedPdfBlob && isMergedMode && allDone && (
              <div className="rounded-xl border border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.06)] p-4 flex items-center gap-3 animate-fade-in">
                <span className="text-2xl">📄</span>
                <div className="flex-1">
                  <p className="text-sm font-bold text-[#ef4444] font-mono">{(mergedName || "merged")}.pdf ready</p>
                  <p className="text-[10px] text-[#666] font-mono mt-0.5">
                    {queue.length} pages · {fmtBytes(mergedPdfBlob.size)} · click "Download PDF" to save
                  </p>
                </div>
              </div>
            )}

            {queue.length === 0 && (
              <div className="rounded-xl border border-dashed border-[#222] p-6 text-center">
                <p className="text-[#444] font-mono text-xs">Upload images above to get started</p>
                <p className="text-[#333] font-mono text-[10px] mt-1">Supports JPG · PNG · WEBP · GIF · BMP</p>
              </div>
            )}
          </div>

          {/* RIGHT */}
          <div className="space-y-4">
            <section>
              <SectionLabel>03 — Convert To</SectionLabel>
              <div className="rounded-xl border border-[#2a2a2a] bg-[#161616] p-4">
                <ConversionTargetSelector selected={target} onChange={setTarget} />
              </div>
            </section>
            <QualitySettings target={target} quality={quality} onQualityChange={setQuality} />
            <ConversionPipeline fileCount={queue.length} target={target} doneCount={doneCount} isConverting={isConverting} />
            <div className="rounded-xl border border-[#2a2a2a] bg-[#161616] p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" />
                <span className="text-[10px] font-mono uppercase tracking-[2px] text-[#666]">Format Notes</span>
              </div>
              <div className="space-y-1 text-[10px] font-mono text-[#555] leading-relaxed">
                <FormatNote ext={ext} />
              </div>
            </div>

            {/* How to reorder hint */}
            {queue.length > 1 && (
              <div className="rounded-xl border border-[#222] bg-[#161616] p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
                  <span className="text-[10px] font-mono uppercase tracking-[2px] text-[#555]">Reorder Tips</span>
                </div>
                <div className="space-y-1 text-[10px] font-mono text-[#444] leading-relaxed">
                  <p>• Drag ⠿ handle to reorder files</p>
                  <p>• Use ▲▼ arrows on hover</p>
                  <p>• Click ✎ to rename output file</p>
                  {isPdf && <p>• PDF page order follows queue order</p>}
                </div>
              </div>
            )}
          </div>
        </div>

        <footer className="mt-12 pt-6 border-t border-[#1a1a1a] flex flex-wrap items-center justify-between gap-3">
          <span className="text-[10px] font-mono text-[#444]">FileForge · 100% in-browser · No server uploads · Your files stay private</span>
          <div className="flex items-center gap-1 font-mono text-[10px] text-[#333]">
            <span className="cursor-blink text-[#f59e0b]">▌</span>
            <span>ready</span>
          </div>
        </footer>
      </div>
    </main>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <span className="text-[10px] font-mono uppercase tracking-[3px] text-[#555]">{children}</span>
      <div className="flex-1 h-px bg-[#1f1f1f]" />
    </div>
  );
}

function FormatNote({ ext }: { ext: string }) {
  const notes: Record<string, React.ReactNode> = {
    pdf:  <><p>• Image centered on A4 page</p><p>• Landscape auto-detected</p><p>• Merge mode: all images in one PDF</p></>,
    docx: <><p>• Image embedded in Word doc</p><p>• Scaled to fit page width</p><p>• Opens in MS Word / LibreOffice</p></>,
    pptx: <><p>• One slide per image</p><p>• 16:9 widescreen layout</p><p>• Dark background applied</p></>,
    jpg:  <><p>• JPEG compression applied</p><p>• Transparency replaced with white</p><p>• Smaller file size than PNG</p></>,
    jpeg: <><p>• Same as JPG format</p><p>• Lossy compression</p><p>• Best for photos</p></>,
    png:  <><p>• Lossless compression</p><p>• Transparency preserved</p><p>• Best for graphics/icons</p></>,
    webp: <><p>• Modern browser format</p><p>• Smaller than JPG/PNG</p><p>• Supports transparency</p></>,
    bmp:  <><p>• Uncompressed bitmap</p><p>• Large file size, no quality loss</p></>,
    gif:  <><p>• Limited to 256 colours</p><p>• Best for simple graphics</p></>,
  };
  return <>{notes[ext] ?? <p>Select a target format to see notes.</p>}</>;
}
