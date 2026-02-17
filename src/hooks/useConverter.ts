"use client";

import { useState, useCallback } from "react";
import {
  loadImageFile,
  convertImageFormat,
  convertToPDF,
  convertAllToPDFMerged,
  convertToDOCX,
  convertToPPTX,
  type ConvertTarget,
} from "@/lib/converters";
import type { QueuedFile } from "@/components/FileQueueItem";

function makeId() {
  return Math.random().toString(36).slice(2, 9);
}

export function useConverter() {
  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [mergedPdfBlob, setMergedPdfBlob] = useState<Blob | null>(null);

  const updateItem = useCallback((id: string, patch: Partial<QueuedFile>) => {
    setQueue((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }, []);

  const addFiles = useCallback(async (files: File[]) => {
    const newItems: QueuedFile[] = [];
    for (const file of files) {
      const { dataUrl } = await loadImageFile(file);
      newItems.push({ id: makeId(), file, dataUrl, status: "queued", progress: 0, label: file.name.replace(/\.[^.]+$/, "") });
    }
    setQueue((prev) => [...prev, ...newItems]);
  }, []);

  const removeFile = useCallback((id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
    setMergedPdfBlob(null);
  }, []);

  const clearAll = useCallback(() => {
    setQueue([]);
    setMergedPdfBlob(null);
  }, []);

  // Reset all files back to queued state so user can convert again
  const resetAll = useCallback(() => {
    setQueue((prev) => prev.map((item) => ({ ...item, status: "queued" as const, progress: 0, resultBlob: undefined, resultFilename: undefined, error: undefined })));
    setMergedPdfBlob(null);
  }, []);

  // Reorder: move item at fromIndex to toIndex
  const reorderFile = useCallback((fromIndex: number, toIndex: number) => {
    setQueue((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
    setMergedPdfBlob(null);
  }, []);

  // Rename label (not file.name, just display label used for output filename)
  const renameFile = useCallback((id: string, label: string) => {
    setQueue((prev) => prev.map((item) => item.id === id ? { ...item, label } : item));
  }, []);

  const convertAll = useCallback(async (target: ConvertTarget, quality: number, pdfMerge: boolean) => {
    const toConvert = queue.filter((item) => item.status === "queued" || item.status === "error");
    if (toConvert.length === 0) return;
    setIsConverting(true);
    setMergedPdfBlob(null);

    // ── MERGED PDF MODE ────────────────────────────────────────
    if (target === "pdf" && pdfMerge && toConvert.length > 1) {
      // Mark all as converting
      toConvert.forEach((item) => updateItem(item.id, { status: "converting", progress: 20 }));
      try {
        // Load all images
        const loaded: Array<{ img: HTMLImageElement; dataUrl: string; filename: string }> = [];
        for (let i = 0; i < toConvert.length; i++) {
          const item = toConvert[i];
          const { img, dataUrl } = await loadImageFile(item.file);
          loaded.push({ img, dataUrl, filename: item.file.name });
          const pct = Math.round(20 + (i / toConvert.length) * 50);
          toConvert.forEach((it) => updateItem(it.id, { progress: pct }));
        }
        const blob = await convertAllToPDFMerged(loaded);
        setMergedPdfBlob(blob);
        toConvert.forEach((item) => updateItem(item.id, { status: "done", progress: 100 }));
      } catch (err) {
        toConvert.forEach((item) => updateItem(item.id, { status: "error", progress: 0, error: err instanceof Error ? err.message : "Merge failed" }));
      }
      setIsConverting(false);
      return;
    }

    // ── INDIVIDUAL CONVERSION ──────────────────────────────────
    for (const item of toConvert) {
      updateItem(item.id, { status: "converting", progress: 10 });
      try {
        const { img, dataUrl } = await loadImageFile(item.file);
        updateItem(item.id, { progress: 40 });
        let resultBlob: Blob;
        let ext: string;
        if (target === "pdf") {
          resultBlob = await convertToPDF(img, dataUrl, item.file.name);
          ext = "pdf";
        } else if (target === "docx") {
          resultBlob = await convertToDOCX(img, dataUrl);
          ext = "docx";
        } else if (target === "pptx") {
          resultBlob = await convertToPPTX(img, dataUrl);
          ext = "pptx";
        } else {
          const imgTarget = target as "jpg" | "jpeg" | "png" | "webp" | "bmp" | "gif";
          resultBlob = await convertImageFormat(img, imgTarget, quality / 100);
          ext = target === "jpeg" ? "jpg" : target;
        }
        updateItem(item.id, { progress: 90 });
        const label = item.label || item.file.name.replace(/\.[^.]+$/, "");
        const resultFilename = label + "." + ext;
        updateItem(item.id, { status: "done", progress: 100, resultBlob, resultFilename });
      } catch (err) {
        updateItem(item.id, { status: "error", progress: 0, error: err instanceof Error ? err.message : "Conversion failed" });
      }
    }
    setIsConverting(false);
  }, [queue, updateItem]);

  const downloadAll = useCallback(() => {
    const done = queue.filter((item) => item.status === "done" && item.resultBlob);
    done.forEach((item, i) => {
      setTimeout(() => {
        const url = URL.createObjectURL(item.resultBlob!);
        const a = document.createElement("a");
        a.href = url; a.download = item.resultFilename!; a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }, i * 300);
    });
  }, [queue]);

  const downloadMergedPdf = useCallback((filename = "merged.pdf") => {
    if (!mergedPdfBlob) return;
    const url = URL.createObjectURL(mergedPdfBlob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, [mergedPdfBlob]);

  const doneCount = queue.filter((i) => i.status === "done").length;
  const queuedCount = queue.filter((i) => i.status === "queued").length;
  const errorCount = queue.filter((i) => i.status === "error").length;
  const hasConvertible = queue.some((i) => i.status === "queued" || i.status === "error");
  const allDone = queue.length > 0 && queue.every((i) => i.status === "done");

  return {
    queue, isConverting, mergedPdfBlob,
    addFiles, removeFile, clearAll, resetAll, reorderFile, renameFile,
    convertAll, downloadAll, downloadMergedPdf,
    doneCount, queuedCount, errorCount, hasConvertible, allDone,
  };
}
