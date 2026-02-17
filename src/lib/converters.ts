// ─────────────────────────────────────────────────────────────
//  converters.ts  — all client-side conversion logic
// ─────────────────────────────────────────────────────────────

export type ConvertTarget =
  | "pdf"
  | "docx"
  | "pptx"
  | "jpg"
  | "jpeg"
  | "png"
  | "webp"
  | "bmp"
  | "gif";

export interface ConversionResult {
  blob: Blob;
  filename: string;
  size: number;
}

/** Load a File into an HTMLImageElement + get its dataURL */
export function loadImageFile(
  file: File,
): Promise<{ img: HTMLImageElement; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      const img = new Image();
      img.onload = () => resolve({ img, dataUrl });
      img.onerror = reject;
      img.src = dataUrl;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** Canvas-based image format conversion */
export function convertImageFormat(
  img: HTMLImageElement,
  targetFormat: "jpg" | "jpeg" | "png" | "webp" | "bmp" | "gif",
  quality = 0.92,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d")!;

    // White background for formats that don't support transparency
    if (
      targetFormat === "jpg" ||
      targetFormat === "jpeg" ||
      targetFormat === "bmp"
    ) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0);

    const mimeMap: Record<string, string> = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      webp: "image/webp",
      bmp: "image/bmp",
      gif: "image/gif",
    };

    const mime = mimeMap[targetFormat] ?? "image/png";
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas toBlob failed"));
      },
      mime,
      quality,
    );
  });
}

/** Convert image to PDF using jsPDF (dynamically imported) */
export async function convertToPDF(
  img: HTMLImageElement,
  dataUrl: string,
  filename: string,
): Promise<Blob> {
  const { jsPDF } = await import("jspdf");

  const imgW = img.naturalWidth;
  const imgH = img.naturalHeight;

  const pageW = 210;
  const pageH = 297;
  const margin = 10;

  const orientation = imgW > imgH ? "landscape" : "portrait";
  const pdf = new jsPDF({ orientation, unit: "mm", format: "a4" });

  const effectivePageW = orientation === "landscape" ? pageH : pageW;
  const effectivePageH = orientation === "landscape" ? pageW : pageH;
  const maxW = effectivePageW - margin * 2;
  const maxH = effectivePageH - margin * 2;
  const r = Math.min(maxW / imgW, maxH / imgH);
  const dW = imgW * r;
  const dH = imgH * r;
  const dx = margin + (maxW - dW) / 2;
  const dy = margin + (maxH - dH) / 2;

  const ext = filename.split(".").pop()?.toUpperCase() ?? "JPEG";
  const fmt = ext === "PNG" ? "PNG" : "JPEG";
  pdf.addImage(dataUrl, fmt, dx, dy, dW, dH);
  return pdf.output("blob");
}

/** Merge multiple images into a single PDF — one image per page */
export async function convertAllToPDFMerged(
  items: Array<{ img: HTMLImageElement; dataUrl: string; filename: string }>,
): Promise<Blob> {
  const { jsPDF } = await import("jspdf");

  const pageW = 210;
  const pageH = 297;
  const margin = 10;

  let pdf: InstanceType<typeof jsPDF> | null = null;

  for (let i = 0; i < items.length; i++) {
    const { img, dataUrl, filename } = items[i];
    const imgW = img.naturalWidth;
    const imgH = img.naturalHeight;
    const orientation = imgW > imgH ? "landscape" : "portrait";

    if (i === 0) {
      pdf = new jsPDF({ orientation, unit: "mm", format: "a4" });
    } else {
      pdf!.addPage("a4", orientation);
    }

    const effectivePageW = orientation === "landscape" ? pageH : pageW;
    const effectivePageH = orientation === "landscape" ? pageW : pageH;
    const maxW = effectivePageW - margin * 2;
    const maxH = effectivePageH - margin * 2;
    const r = Math.min(maxW / imgW, maxH / imgH);
    const dW = imgW * r;
    const dH = imgH * r;
    const dx = margin + (maxW - dW) / 2;
    const dy = margin + (maxH - dH) / 2;

    const ext = filename.split(".").pop()?.toUpperCase() ?? "JPEG";
    const fmt = ext === "PNG" ? "PNG" : "JPEG";
    pdf!.addImage(dataUrl, fmt, dx, dy, dW, dH);
  }

  return pdf!.output("blob");
}

/** Convert image to DOCX using docx.js (dynamically imported) */
export async function convertToDOCX(
  img: HTMLImageElement,
  dataUrl: string,
): Promise<Blob> {
  const { Document, Packer, Paragraph, ImageRun, AlignmentType } =
    await import("docx");

  // Convert dataUrl to Uint8Array
  const base64 = dataUrl.split(",")[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

  // Scale to max 15cm wide (Word page width minus margins ~16cm)
  const maxWidthEmu = 5400000; // ~15cm in EMU
  const ratio = img.naturalHeight / img.naturalWidth;
  const widthEmu = Math.min(maxWidthEmu, img.naturalWidth * 9525);
  const heightEmu = Math.round(widthEmu * ratio);

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new ImageRun({
                data: bytes,
                transformation: {
                  width: Math.round(widthEmu / 9525),
                  height: Math.round(heightEmu / 9525),
                },
              }),
            ],
          }),
        ],
      },
    ],
  });

  return Packer.toBlob(doc);
}

/** Convert image to PPTX using PptxGenJS (dynamically imported) */
export async function convertToPPTX(
  img: HTMLImageElement,
  dataUrl: string,
): Promise<Blob> {
  const PptxGenJS = (await import("pptxgenjs")).default;
  const pptx = new PptxGenJS();

  // Standard 16:9 slide: 10" x 5.625"
  pptx.layout = "LAYOUT_WIDE";

  const slide = pptx.addSlide();

  // Background
  slide.background = { color: "1a1a2e" };

  // Scale image to fit slide with padding
  const slideW = 10;
  const slideH = 5.625;
  const padX = 0.5;
  const padY = 0.5;
  const maxW = slideW - padX * 2;
  const maxH = slideH - padY * 2;

  const imgRatio = img.naturalHeight / img.naturalWidth;
  let drawW = maxW;
  let drawH = drawW * imgRatio;
  if (drawH > maxH) {
    drawH = maxH;
    drawW = drawH / imgRatio;
  }

  const x = (slideW - drawW) / 2;
  const y = (slideH - drawH) / 2;

  slide.addImage({ data: dataUrl, x, y, w: drawW, h: drawH });

  const blob = (await pptx.write({ outputType: "blob" })) as Blob;
  return blob;
}

/** Get extension from MIME */
export function mimeToExt(mime: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/bmp": "bmp",
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      "docx",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation":
      "pptx",
  };
  return map[mime] ?? "bin";
}

/** Format bytes */
export function fmtBytes(b: number): string {
  if (b < 1024) return b + " B";
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + " KB";
  return (b / (1024 * 1024)).toFixed(2) + " MB";
}

/** Get colour class for file type */
export function typeClass(ext: string): string {
  const e = ext.toLowerCase();
  if (e === "pdf") return "type-pdf";
  if (e === "docx") return "type-docx";
  if (e === "pptx") return "type-pptx";
  if (e === "jpg" || e === "jpeg") return "type-jpg";
  if (e === "png") return "type-png";
  if (e === "webp") return "type-webp";
  if (e === "gif") return "type-gif";
  if (e === "bmp") return "type-bmp";
  return "";
}

/** Get emoji icon for file type */
export function typeIcon(ext: string): string {
  const e = ext.toLowerCase();
  if (e === "pdf") return "📄";
  if (e === "docx") return "📝";
  if (e === "pptx") return "📊";
  if (e === "jpg" || e === "jpeg") return "🟢";
  if (e === "png") return "🟣";
  if (e === "webp") return "🔵";
  if (e === "gif") return "🌀";
  if (e === "bmp") return "🟡";
  return "📁";
}
