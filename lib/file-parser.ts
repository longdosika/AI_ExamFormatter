import JSZip from "jszip";
import { renderPdfPages } from "./pdf-renderer";
import { ImportOptions, throwIfImportAborted } from "./import-lifecycle";
import type { OcrTextRegion } from "./capture-geometry";
export { revokeParsedFileUrls } from "./import-lifecycle";

export interface ParsedFileResult {
  fileName: string;
  sourceHash?: string;
  fileSize: number;
  fileType: string;
  extension: string;
  rawContent: string;
  fileUrl?: string; // Data/Object URL for PDF/Image viewer
  sourceBlob?: Blob;
  originalText?: string;
  pageImages?: string[]; // Rendered page images for continuous native PDF viewing
  ocrTextRegions?: OcrTextRegion[][];
  extractedImages: { id: string; dataUrl: string }[];
  isClean: boolean;
  statusMessage: string;
}

export const SUPPORTED_EXTENSIONS = [".docx", ".doc", ".pdf", ".png", ".jpg", ".jpeg", ".md", ".html"];

export function validateFile(file: File): { valid: boolean; error?: string } {
  const extension = "." + file.name.split(".").pop()?.toLowerCase();
  if (!SUPPORTED_EXTENSIONS.includes(extension)) {
    return {
      valid: false,
      error: `ไม่รองรับไฟล์ประเภท ${extension} (รองรับเฉพาะ: ${SUPPORTED_EXTENSIONS.join(", ")})`,
    };
  }
  // Max file size 50MB
  if (file.size > 50 * 1024 * 1024) {
    return {
      valid: false,
      error: "ขนาดไฟล์ใหญ่เกินกำหนด (สูงสุด 50MB)",
    };
  }
  return { valid: true };
}

/**
 * Decode Numeric HTML Entities (Feature E from design.md)
 */
export function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&#(\d+);/g, (_, dec) => {
      const code = parseInt(dec, 10);
      return code >= 0 && code <= 0x10ffff ? String.fromCodePoint(code) : _;
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => {
      const code = parseInt(hex, 16);
      return code >= 0 && code <= 0x10ffff ? String.fromCodePoint(code) : _;
    });
}

/**
 * Unpack Binary DOCX files using JSZip (Feature C from design.md)
 */
export async function parseDocxFile(file: File, options: ImportOptions = {}): Promise<ParsedFileResult> {
  throwIfImportAborted(options.signal);
  const arrayBuffer = await file.arrayBuffer();
  throwIfImportAborted(options.signal);
  const zip = await JSZip.loadAsync(arrayBuffer);
  throwIfImportAborted(options.signal);
  
  // 1. Read document.xml
  const docXmlFile = zip.file("word/document.xml");
  if (!docXmlFile) throw new Error("ไฟล์ DOCX ไม่มี word/document.xml จึงไม่สามารถอ่านข้อความต้นฉบับได้");
  let rawText = "";
  if (docXmlFile) {
    const xmlContent = await docXmlFile.async("text");
    throwIfImportAborted(options.signal);
    // Preserve paragraph/line boundaries and join adjacent text runs faithfully.
    rawText = decodeHtmlEntities(xmlContent
      .replace(/<w:(?:br|cr)\b[^>]*\/?\s*>/g, "\n")
      .replace(/<w:tab\b[^>]*\/?\s*>/g, "\t")
      .replace(/<\/w:p>/g, "\n")
      .replace(/<[^>]+>/g, ""))
      .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&")
      .split(/\r?\n/).map(line => line.trim()).join("\n").trim();
  }

  // 2. Extract embedded media/images from word/media/
  const extractedImages: { id: string; dataUrl: string }[] = [];
  const mediaFolder = zip.folder("word/media");
  if (mediaFolder) {
    const mediaFiles = Object.keys(mediaFolder.files).filter((path) =>
      path.match(/^word\/media\/.+\.(png|jpg|jpeg|gif)$/i)
    );
    for (const mediaPath of mediaFiles) {
      throwIfImportAborted(options.signal);
      const imgFile = zip.file(mediaPath);
      if (imgFile) {
        const base64 = await imgFile.async("base64");
        throwIfImportAborted(options.signal);
        const ext = mediaPath.split(".").pop()?.toLowerCase();
        const mime = ext === "jpg" ? "jpeg" : ext;
        extractedImages.push({
          id: mediaPath.replace("word/media/", ""),
          dataUrl: `data:image/${mime};base64,${base64}`,
        });
      }
    }
  }

  return {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type || "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    extension: ".docx",
    rawContent: rawText,
    extractedImages,
    isClean: extractedImages.length === 0,
    statusMessage: `ถอดรหัส DOCX สำเร็จ: พบข้อความหลักและรูปภาพฝังในเอกสาร ${extractedImages.length} รูป`,
  };
}

/**
 * Generic File Parser Dispatcher
 */
export async function parseUploadedFile(file: File, options: ImportOptions = {}): Promise<ParsedFileResult> {
  throwIfImportAborted(options.signal);
  const validation = validateFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const extension = "." + file.name.split(".").pop()?.toLowerCase();

  if (extension === ".docx") {
    return await parseDocxFile(file, options);
  }

  if (extension === ".pdf") {
    const rawUrl = URL.createObjectURL(file);
    let pdfResult;
    try {
      pdfResult = await renderPdfPages(file, Infinity, options);
      if (!pdfResult.pageCount || !pdfResult.pageImages.length) throw new Error("ไม่พบหน้า PDF ที่แสดงผลได้");
    } catch (error) {
      URL.revokeObjectURL(rawUrl);
      throw error;
    }
    const rawContent = pdfResult.extractedText;

    return {
      fileName: file.name,
      fileSize: file.size,
      fileType: "application/pdf",
      extension: ".pdf",
      rawContent,
      fileUrl: rawUrl,
      pageImages: pdfResult.pageImages,
      extractedImages: [],
      isClean: false,
      statusMessage: `แสดง PDF ${pdfResult.pageImages.length}/${pdfResult.pageCount} หน้า${pdfResult.pageImages.length < pdfResult.pageCount ? " (แสดงผลเพียงบางหน้า)" : ""}${rawContent.trim() ? " พร้อมข้อความต้นฉบับ" : " ไม่พบข้อความที่อ่านได้ ต้องใช้ OCR ซึ่งยังไม่พร้อมใช้งาน"} รูปภาพยังไม่ได้ตรวจสอบความสะอาด`,
    };
  }

  if (extension === ".md" || extension === ".html" || extension === ".doc") {
    const text = await file.text();
    throwIfImportAborted(options.signal);
    const decodedText = extension === ".html" ? decodeHtmlEntities(text) : text;
    return {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type || "text/plain",
      extension,
      rawContent: decodedText,
      extractedImages: [],
      isClean: true,
      statusMessage: `อ่านข้อความต้นฉบับสำเร็จ (${decodedText.length} ตัวอักษร)`,
    };
  }

  // Image files (.png, .jpg, .jpeg)
  if ([".png", ".jpg", ".jpeg"].includes(extension)) {
    const arrayBuffer = await file.arrayBuffer();
    throwIfImportAborted(options.signal);
    const bytes = new Uint8Array(arrayBuffer);
    let binary = "";
    for (let offset = 0; offset < bytes.length; offset += 8192) {
      binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
    }
    const base64 = btoa(binary);
    const mime = extension === ".png" ? "image/png" : "image/jpeg";
    const dataUrl = `data:${mime};base64,${base64}`;
    const fileUrl = URL.createObjectURL(file);
    return {
      fileName: file.name,
      fileSize: file.size,
      fileType: mime,
      extension,
      rawContent: `[รูปภาพต้นฉบับ: ${file.name}]`,
      fileUrl,
      extractedImages: [{ id: file.name, dataUrl }],
      isClean: false,
      statusMessage: "โหลดรูปภาพต้นฉบับสำเร็จ รูปภาพยังไม่ได้ตรวจสอบความสะอาด และ OCR ยังไม่พร้อมใช้งาน",
    };
  }

  // Fallback for other formats
  return {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type || "application/octet-stream",
    extension,
    rawContent: `[ไฟล์ ${file.name} พร้อมประมวลผล]`,
    extractedImages: [],
    isClean: true,
    statusMessage: "เตรียมไฟล์พร้อมสำหรับกระบวนการจัดรูปแบบ",
  };
}
