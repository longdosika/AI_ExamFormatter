import { ImportOptions, throwIfImportAborted } from "./import-lifecycle";

export interface PdfRenderResult {
  pageImages: string[];
  extractedText: string;
  pageCount: number;
}

// RGBA storage alone is 128 MB at this ceiling, excluding encoded images/text.
export const DEFAULT_PDF_PIXEL_BUDGET = 32_000_000;

export async function renderPdfPages(file: File, maxPages = Infinity, options: ImportOptions = {}): Promise<PdfRenderResult> {
  const { signal } = options;
  const pixelBudget = options.maxDecodedPixels ?? DEFAULT_PDF_PIXEL_BUDGET;
  if (!Number.isFinite(pixelBudget) || pixelBudget <= 0) throw new Error("งบประมาณพิกเซล PDF ต้องเป็นจำนวนบวกที่จำกัด");
  throwIfImportAborted(signal);
  let loadingTask: ReturnType<typeof import("pdfjs-dist").getDocument> | undefined;
  let activeRender: { cancel(): void } | undefined;
  let destruction: Promise<void> | undefined;
  const destroy = () => {
    if (loadingTask && !destruction) destruction = loadingTask.destroy().catch(() => {});
    return destruction;
  };
  const cancel = () => {
    activeRender?.cancel();
    void destroy();
  };
  signal?.addEventListener("abort", cancel, { once: true });
  try {
    const arrayBuffer = await file.arrayBuffer();
    throwIfImportAborted(signal);
    const pdfjsLib = await import("pdfjs-dist");
    throwIfImportAborted(signal);
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      // Keep PDF rendering deterministic in localhost/Vercel environments;
      // relying on a CDN worker makes a valid image/PDF look like an import
      // failure when the browser has no access to that external origin.
      pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    }
    loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useSystemFonts: true,
      standardFontDataUrl: "/pdf-assets/standard_fonts/",
      cMapUrl: "/pdf-assets/cmaps/",
      cMapPacked: true,
      isEvalSupported: false,
    });
    const pdf = await loadingTask.promise;
    throwIfImportAborted(signal);
    if (!pdf.numPages || pdf.numPages > maxPages) throw new Error("PDF เกินจำนวนหน้าที่กำหนด กรุณาแบ่งเอกสารก่อนนำเข้า");
    const pageImages: string[] = [];
    const textParts: string[] = [];
    let decodedPixels = 0;
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      throwIfImportAborted(signal);
      const page = await pdf.getPage(pageNum);
      let canvas: HTMLCanvasElement | undefined;
      try {
        throwIfImportAborted(signal);
        const viewport = page.getViewport({ scale: 1.6 });
        const width = Math.ceil(viewport.width);
        const height = Math.ceil(viewport.height);
        const pixels = width * height;
        if (!Number.isSafeInteger(pixels) || pixels <= 0 || decodedPixels + pixels > pixelBudget) {
          throw new Error(`PDF เกินงบประมาณภาพ ${pixelBudget.toLocaleString()} พิกเซล กรุณาแบ่งเอกสารหรือลดขนาดหน้าแล้วนำเข้าใหม่`);
        }
        decodedPixels += pixels;
        const textContent = await page.getTextContent();
        throwIfImportAborted(signal);

        // Group text items by line using Y coordinate clustering (tolerance 7pt)
        // Thai text tone marks and upper/lower vowels deviate slightly in Y,
        // so cluster them to preserve whole words without fracturing onto newlines.
        interface TextItemPos { str: string; x: number; y: number; hasEOL?: boolean; }
        const rawItems: TextItemPos[] = [];
        for (const item of textContent.items) {
          if (!("str" in item) || !item.str) continue;
          rawItems.push({
            str: item.str,
            x: item.transform[4],
            y: item.transform[5],
            hasEOL: "hasEOL" in item ? Boolean(item.hasEOL) : false,
          });
        }

        const lines: { y: number; items: TextItemPos[] }[] = [];
        for (const item of rawItems) {
          let targetLine = lines.find(l => Math.abs(l.y - item.y) <= 7);
          if (!targetLine) {
            targetLine = { y: item.y, items: [] };
            lines.push(targetLine);
          }
          targetLine.items.push(item);
        }
        // Top-to-bottom order (PDF Y is 0 at bottom)
        lines.sort((a, b) => b.y - a.y);

        let pageText = "";
        for (const line of lines) {
          // Left-to-right order on the same line
          line.items.sort((a, b) => a.x - b.x);
          const lineStr = line.items.map(it => it.str).join("").trim();
          if (lineStr) {
            pageText += (pageText ? "\n" : "") + lineStr;
          }
        }
        if (pageText.trim()) textParts.push(`--- หน้าที่ ${pageNum} ---\n${pageText}`);
        canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("เบราว์เซอร์ไม่สามารถสร้าง Canvas สำหรับ PDF ได้");
        const renderTask = page.render({ canvasContext: context, viewport });
        activeRender = renderTask;
        await renderTask.promise;
        activeRender = undefined;
        throwIfImportAborted(signal);
        pageImages.push(canvas.toDataURL("image/png"));
      } finally {
        activeRender = undefined;
        if (canvas) { canvas.width = 0; canvas.height = 0; }
        page.cleanup();
      }
    }
    return { pageImages, extractedText: textParts.join("\n").trim(), pageCount: pdf.numPages };
  } catch (error) {
    throwIfImportAborted(signal);
    if (error instanceof Error) throw error;
    throw new Error("ไม่สามารถอ่านหรือแสดงเอกสาร PDF ได้", { cause: error });
  } finally {
    signal?.removeEventListener("abort", cancel);
    await destroy();
  }
}
