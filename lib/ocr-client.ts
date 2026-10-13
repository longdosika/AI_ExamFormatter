/** The API limit is per request, not a user-facing document page limit. */
interface PageOutcome { page: number; success: boolean; modelUsed?: string; error?: string }

/**
 * Keep requests below common serverless/proxy body limits. The API still
 * accepts at most ten pages, but a page's Base64 PNG size varies widely.
 * A single oversized page is sent alone so the provider can return a useful
 * error rather than silently dropping it.
 */
export const OCR_MAX_PAGES_PER_BATCH = 10;
export const OCR_MAX_REQUEST_BYTES = 3_000_000;

function requestBytes(images: string[]): number {
  return new TextEncoder().encode(JSON.stringify({ images })).byteLength;
}

function takeBatch(images: string[], offset: number): string[] {
  const batch: string[] = [];
  for (let index = offset; index < images.length && batch.length < OCR_MAX_PAGES_PER_BATCH; index += 1) {
    const candidate = [...batch, images[index]];
    if (batch.length && requestBytes(candidate) > OCR_MAX_REQUEST_BYTES) break;
    batch.push(images[index]);
  }
  return batch;
}

async function readResponse(response: Response): Promise<any> {
  const raw = await response.text();
  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    const compact = raw.replace(/\s+/g, " ").trim().slice(0, 160);
    if (response.status === 413 || /request entity too large|payload too large/i.test(raw)) {
      throw new Error("คำขอ OCR ใหญ่เกินไป ระบบจะแบ่งภาพเป็นชุดเล็กลงให้อัตโนมัติ หากยังไม่ผ่านให้ลดความละเอียดหน้าเอกสาร");
    }
    throw new Error(`OCR ตอบกลับไม่ใช่ JSON (HTTP ${response.status}${compact ? `: ${compact}` : ""})`);
  }
}

export async function readOcrDocument(images: string[], options: {
  fetcher?: typeof fetch;
  isCurrent?: () => boolean;
  onProgress?: (completed: number, total: number) => void;
} = {}) {
  const fetcher = options.fetcher || fetch;
  const textParts: string[] = [];
  const pageResults: PageOutcome[] = [];
  let allPagesSuccess = images.length > 0;
  let ready = true;
  let questionMarkers = 0;
  let error: string | undefined;
  let cancelled = false;
  for (let offset = 0; offset < images.length;) {
    if (options.isCurrent && !options.isCurrent()) { cancelled = true; break; }
    options.onProgress?.(offset, images.length);
    const batch = takeBatch(images, offset);
    if (!batch.length) {
      error = "ไม่พบภาพสำหรับส่ง OCR";
      allPagesSuccess = false;
      break;
    }
    try {
      const response = await fetcher("/api/ocr", {
        method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({images:batch}),
      });
      if (options.isCurrent && !options.isCurrent()) { cancelled = true; break; }
      const data = await readResponse(response);
      if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : `OCR HTTP ${response.status}`);
      const text: string = typeof data.text === "string" ? data.text.trim() : "";
      if (text) textParts.push(text.replace(/^\[PAGE (\d+)\]/gm, (_match: string, page: string) => `[PAGE ${Number(page) + offset}]`));
      const outcomes: PageOutcome[] = Array.isArray(data.pageResults) ? data.pageResults : [];
      for (let index = 0; index < batch.length; index++) {
        const outcome = outcomes.find(page => page.page === index + 1);
        pageResults.push({page:offset + index + 1, success:outcome?.success === true,
          modelUsed:outcome?.modelUsed, error:outcome?.error || (!outcome ? "OCR ไม่ส่งผลของหน้านี้" : undefined)});
      }
      const complete = data.allPagesSuccess === true && Boolean(text) &&
        outcomes.length === batch.length && outcomes.every(page => page.success);
      allPagesSuccess = allPagesSuccess && complete;
      ready = ready && complete && data.quality === "ready";
      questionMarkers += Number.isFinite(data.questionMarkers) ? data.questionMarkers : 0;
      if (!complete) error = data.error || outcomes.find(page => page.error)?.error || "OCR ยังอ่านไม่ครบทุกหน้า";
      options.onProgress?.(offset + batch.length, images.length);
      offset += batch.length;
    } catch (failure) {
      error = failure instanceof Error ? failure.message : "เชื่อมต่อ OCR ไม่สำเร็จ";
      allPagesSuccess = false;
      // Stop transport failures; preserve earlier text, never mark remaining pages complete.
      for (let page = offset + 1; page <= images.length; page++) pageResults.push({page,success:false,error});
      break;
    }
  }
  const text = textParts.join("\n\n");
  return {success:Boolean(text),text,pageResults,pageCount:images.length,allPagesSuccess:allPagesSuccess && !cancelled,
    questionMarkers,quality:ready && allPagesSuccess && !cancelled ? "ready" : "needs_review",error,cancelled};
}
