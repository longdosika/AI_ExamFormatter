/** The API limit is per request, not a user-facing document page limit. */
interface PageOutcome { page: number; success: boolean; modelUsed?: string; error?: string }
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
  for (let offset = 0; offset < images.length; offset += 10) {
    if (options.isCurrent && !options.isCurrent()) { cancelled = true; break; }
    options.onProgress?.(offset, images.length);
    const batch = images.slice(offset, offset + 10);
    try {
      const response = await fetcher("/api/ocr", {
        method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({images:batch}),
      });
      if (options.isCurrent && !options.isCurrent()) { cancelled = true; break; }
      const data = await response.json();
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
