/**
 * T-121 (B-26): coloured pen marks (red/blue/green ticks, crosses, circles) make OCR misread choice keys
 * ("ง." -> "4.", "ก./"). Printed exam text is black or grey, so strongly coloured pixels are whitened in the
 * copy sent to OCR only. The original page, the capture tool and source-answer vision still see the marks.
 * Figure crops whiten pen ink only in their padding, outside the model box (whitenPenInkOutsideBox, T-135).
 */
export const OCR_INK_FILTER_STORAGE_KEY = "exam-formatter-ocr-ink-filter";

/** Saturation above which a pixel counts as pen ink rather than print or paper. */
export const INK_SATURATION = 60;

export function isColouredInk(red: number, green: number, blue: number): boolean {
  return Math.max(red, green, blue) - Math.min(red, green, blue) > INK_SATURATION;
}

/** Faint pen tint (anti-aliased circle edges): mildly saturated and light. Printed ink is dark, paper is neutral. */
const PEN_TINT_SATURATION = 25;

/**
 * T-135 (capture rule C-18, I-062): crop padding outside the model box must not bring in teacher pen marks
 * (set 2 Q20: the red circle around choice ก. beside the cylinder). Whitens coloured ink, and light pen tint, in the
 * part of an RGBA crop outside `box` (the model box in crop pixels). The box itself is never touched, and nothing is
 * whitened when the figure is a colour figure (coloured pixels are at least `colourFigureShare` of the box's ink),
 * so colour that belongs to a figure stays. Returns the number of pixels whitened.
 */
export function whitenPenInkOutsideBox(
  pixels: Uint8ClampedArray, width: number, height: number,
  box: { x: number; y: number; w: number; h: number },
  colourFigureShare = 0.25,
): number {
  const left = Math.max(0, Math.round(box.x)), top = Math.max(0, Math.round(box.y));
  const right = Math.min(width, Math.round(box.x + box.w)), bottom = Math.min(height, Math.round(box.y + box.h));
  let coloured = 0, ink = 0;
  for (let row = top; row < bottom; row++) for (let column = left; column < right; column++) {
    const index = (row * width + column) * 4, red = pixels[index], green = pixels[index + 1], blue = pixels[index + 2];
    if (isColouredInk(red, green, blue)) { coloured++; ink++; } else if (red * 0.299 + green * 0.587 + blue * 0.114 < 150) ink++;
  }
  if (ink && coloured / ink >= colourFigureShare) return 0;
  let changed = 0;
  for (let row = 0; row < height; row++) for (let column = 0; column < width; column++) {
    if (row >= top && row < bottom && column >= left && column < right) continue;
    const index = (row * width + column) * 4, red = pixels[index], green = pixels[index + 1], blue = pixels[index + 2];
    const saturation = Math.max(red, green, blue) - Math.min(red, green, blue);
    if (saturation > INK_SATURATION || (saturation > PEN_TINT_SATURATION && red * 0.299 + green * 0.587 + blue * 0.114 >= 150)) {
      pixels[index] = pixels[index + 1] = pixels[index + 2] = 255;
      changed++;
    }
  }
  return changed;
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
