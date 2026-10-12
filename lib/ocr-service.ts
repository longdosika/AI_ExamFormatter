/**
 * AI OCR Service - Powered by SCB 10X Typhoon OCR
 * Specifically designed for Thai document and exam parsing
 */

export interface OcrResult {
  success: boolean;
  text: string;
  modelUsed?: string;
  error?: string;
}

/** Normalize harmless Markdown escaping emitted by Typhoon before parsing. */
export function normalizeOcrText(text: string): string {
  return text
    .replace(/\\([\\`*_[\]{}()#+.!-])/g, "$1")
    .replace(/\r\n/g, "\n")
    // A checkbox is not answer evidence. Strip it only when the actual
    // printed choice key is still present; missing keys remain unresolved.
    .replace(/^[ \t]*[☐☑]\s*(?=[ก-จA-E][.)])/gm, "")
    .trim();
}

const TYPHOON_MODELS = [
  "typhoon-ocr",
  "typhoon-ocr-v1.5",
  "typhoon-ocr-preview",
];

// Typhoon OCR 1.5 is trained for this fixed transcription prompt.
// Exam-specific structure belongs in the downstream parser, not this request.
// https://huggingface.co/typhoon-ai/typhoon-ocr1.5-2b#prompting
export const TYPHOON_OCR_PROMPT = `Extract all text from the image.

Instructions:
- Only return the clean Markdown.
- Do not include any explanation or extra text.
- You must include all information on the page.

Formatting Rules:
- Tables: Render tables using <table>...</table> in clean HTML format.
- Equations: Render equations using LaTeX syntax with inline ($...$) and block ($$...$$).
- Images/Charts/Diagrams: Wrap any clearly defined visual areas (e.g. charts, diagrams, pictures) in:

<figure>
Describe the image's main elements (people, objects, text), note any contextual clues (place, event, culture), mention visible text and its meaning, provide deeper analysis when relevant (especially for financial charts, graphs, or documents), comment on style or architecture if relevant, then give a concise overall summary. Describe in Thai.
</figure>
- Page Numbers: Wrap page numbers in <page_number>...</page_number> (e.g., <page_number>14</page_number>).
- Checkboxes: Use ☐ for unchecked and ☑ for checked boxes.`;

export interface OcrProviderConfig {
  baseUrl: string;
  models: string[];
  apiKey?: string;
  maxConcurrency: number;
}

export function getOcrProviderConfig(): OcrProviderConfig {
  const baseUrl = (process.env.TYPHOON_OCR_BASE_URL || "https://api.opentyphoon.ai/v1").replace(/\/$/, "");
  const defaultConcurrency = isLocalProvider(baseUrl) ? 1 : 2;
  const concurrency = Number(process.env.TYPHOON_OCR_CONCURRENCY || defaultConcurrency);
  const configuredModel = process.env.TYPHOON_OCR_MODEL?.trim();
  return {
    baseUrl,
    models: configuredModel ? [configuredModel] : TYPHOON_MODELS,
    apiKey: process.env.TYPHOON_OCR_API_KEY?.trim() || undefined,
    maxConcurrency: Number.isFinite(concurrency) ? Math.max(1, Math.min(2, Math.floor(concurrency))) : defaultConcurrency,
  };
}

function isLocalProvider(baseUrl: string): boolean {
  return /^(https?:\/\/)?(127\.0\.0\.1|localhost)(:\d+)?\//i.test(`${baseUrl}/`);
}

// Shared across documents in this process, not across replicas/serverless instances.
// Keep a slot for retries so a busy provider cannot be flooded by other uploads.
const providerQueues = new Map<string, { active: number; waiting: Array<() => void> }>();
const MAX_PENDING_OCR = 32;

async function acquireProvider(config: OcrProviderConfig): Promise<(() => void) | null> {
  let queue = providerQueues.get(config.baseUrl);
  if (!queue) {
    queue = { active: 0, waiting: [] };
    providerQueues.set(config.baseUrl, queue);
  }
  const state = queue;
  if (state.active >= config.maxConcurrency || state.waiting.length) {
    if (state.waiting.length >= MAX_PENDING_OCR) return null;
    await new Promise<void>(resolve => state.waiting.push(resolve));
  } else {
    state.active++;
  }
  let released = false;
  return () => {
    if (released) return;
    released = true;
    const next = state.waiting.shift();
    if (next) next(); // Transfer the occupied slot to the oldest waiting page.
    else {
      state.active--;
      if (!state.active) providerQueues.delete(config.baseUrl);
    }
  };
}

export async function processImageOcr(imageDataUrl: string): Promise<OcrResult> {
  const config = getOcrProviderConfig();
  const isLocal = isLocalProvider(config.baseUrl);
  if (!config.apiKey && !isLocal) {
    const localConfig: OcrProviderConfig = {
      baseUrl: "http://127.0.0.1:11434/v1",
      models: [process.env.TYPHOON_OCR_LOCAL_MODEL || "scb10x/typhoon-ocr1.5-3b:latest"],
      maxConcurrency: 1,
    };
    const localRelease = await acquireProvider(localConfig);
    if (!localRelease) return { success: false, text: "", error: "คิว OCR เต็ม กรุณารอให้งานก่อนหน้าเสร็จแล้วลองใหม่" };
    try {
      const localRes = await requestImageOcr(imageDataUrl, localConfig, true);
      if (localRes.success) return { ...localRes, modelUsed: localRes.modelUsed || "local-ollama" };
      return {
        success: false,
        text: "",
        error: "ไม่พบคีย์ TYPHOON_OCR_API_KEY และ Local OCR (Ollama) ไม่พร้อมใช้งาน",
      };
    } finally {
      localRelease();
    }
  }

  const release = await acquireProvider(config);
  if (!release) {
    return { success: false, text: "", error: "คิว OCR เต็ม กรุณารอให้งานก่อนหน้าเสร็จแล้วลองใหม่" };
  }
  try {
    const result = await requestImageOcr(imageDataUrl, config, isLocal);
    if (result.success || isLocal) {
      return result;
    }

    // Auto Failover from Cloud OCR to Local OCR if Cloud connection failed
    try {
      const localConfig: OcrProviderConfig = {
        baseUrl: "http://127.0.0.1:11434/v1",
        models: [process.env.TYPHOON_OCR_LOCAL_MODEL || "scb10x/typhoon-ocr1.5-3b:latest"],
        maxConcurrency: 1,
      };
      const localRes = await requestImageOcr(imageDataUrl, localConfig, true);
      if (localRes.success) {
        return {
          ...localRes,
          modelUsed: localRes.modelUsed || "local-ollama-failover",
        };
      }
    } catch {
      // Local failover probe/run failed
    }

    return result;
  } finally {
    release();
  }
}

async function requestImageOcr(imageDataUrl: string, config: OcrProviderConfig, isLocal: boolean): Promise<OcrResult> {

  // Ensure image data URL format
  const imageUrl = imageDataUrl.startsWith("data:") 
    ? imageDataUrl 
    : `data:image/png;base64,${imageDataUrl}`;

  let lastError = "";

  for (const model of config.models) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (config.apiKey) headers.Authorization = `Bearer ${config.apiKey}`;
        const response = await fetch(`${config.baseUrl}/chat/completions`, {
        signal: AbortSignal.timeout(isLocal ? 300000 : 120000),
        method: "POST",
        headers,
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: TYPHOON_OCR_PROMPT },
                { type: "image_url", image_url: { url: imageUrl } },
              ],
            },
          ],
          temperature: 0.1,
          max_tokens: 16384,
        }),
      });

        if (!response.ok) {
        const errorText = await response.text();
        lastError = `HTTP ${response.status}: ${errorText}`;
          if ((response.status === 429 || response.status === 503 || response.status === 502) && attempt === 0) {
            await new Promise(resolve => setTimeout(resolve, 500));
            continue;
          }
          break;
        }

        const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
        if (!content) {
        lastError = "Empty completion from OCR";
          break;
        }

      // Handle natural_text JSON wrapper if returned by preview models
      let extractedText = normalizeOcrText(content);
      if (extractedText.startsWith("{") && extractedText.includes("natural_text")) {
        try {
          const parsed = JSON.parse(extractedText);
          if (parsed.natural_text) {
            extractedText = normalizeOcrText(parsed.natural_text);
          }
        } catch {
          // Keep raw content if JSON parse fails
        }
      }

        return {
        success: data.choices?.[0]?.finish_reason !== "length",
        text: extractedText,
        error: data.choices?.[0]?.finish_reason === "length" ? "OCR ตอบไม่ครบเพราะถึงขีดจำกัดข้อความ กรุณาประมวลผลหน้านี้ใหม่" : undefined,
        modelUsed: model,
        };
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
        if (attempt === 0) {
          await new Promise(resolve => setTimeout(resolve, 250));
          continue;
        }
      }
    }
  }

  return {
    success: false,
    text: "",
    error: lastError || "ไม่สามารถเชื่อมต่อ Typhoon OCR ได้",
  };
}

export async function processImagesOcr(images: string[]): Promise<OcrPageResult[]> {
  const config = getOcrProviderConfig();
  const results: OcrPageResult[] = new Array(images.length);
  let nextIndex = 0;
  const worker = async () => {
    while (true) {
      const index = nextIndex++;
      if (index >= images.length) return;
      const result = await processImageOcr(images[index]);
      results[index] = { page: index + 1, ...result };
    }
  };
  await Promise.all(Array.from({ length: Math.min(config.maxConcurrency, images.length) }, worker));
  return results;
}

export interface OcrPageResult extends OcrResult {
  page: number;
}
