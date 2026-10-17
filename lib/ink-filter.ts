/**
 * T-121 (B-26): coloured pen marks (red/blue/green ticks, crosses, circles) make OCR misread choice keys
 * ("ง." -> "4.", "ก./"). Printed exam text is black or grey, so strongly coloured pixels are whitened in the
 * copy sent to OCR only. The original page, the capture tool and source-answer vision still see the marks.
 */
export const OCR_INK_FILTER_STORAGE_KEY = "exam-formatter-ocr-ink-filter";

/** Saturation above which a pixel counts as pen ink rather than print or paper. */
export const INK_SATURATION = 60;

export function isColouredInk(red: number, green: number, blue: number): boolean {
  return Math.max(red, green, blue) - Math.min(red, green, blue) > INK_SATURATION;
}

export function ocrInkFilterEnabled(): boolean {
  try { return window.localStorage.getItem(OCR_INK_FILTER_STORAGE_KEY) === "on"; } catch { return false; }
}

export async function removeColouredInk(dataUrl: string): Promise<string> {
  if (typeof document === "undefined" || !dataUrl.startsWith("data:image/")) return dataUrl;
  try {
    const image = new Image();
    image.src = dataUrl;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context || !canvas.width || !canvas.height) return dataUrl;
    context.drawImage(image, 0, 0);
    const frame = context.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = frame.data;
    let changed = 0;
    for (let index = 0; index < pixels.length; index += 4) {
      if (isColouredInk(pixels[index], pixels[index + 1], pixels[index + 2])) {
        pixels[index] = pixels[index + 1] = pixels[index + 2] = 255;
        changed++;
      }
    }
    if (!changed) return dataUrl;
    context.putImageData(frame, 0, 0);
    return dataUrl.startsWith("data:image/jpeg") ? canvas.toDataURL("image/jpeg", 0.92) : canvas.toDataURL("image/png");
  } catch {
    return dataUrl;
  }
}
