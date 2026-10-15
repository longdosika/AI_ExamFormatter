import { ExamItem } from "./formatter-rules";
import { DetectedDiagram } from "./diagram-service";
import { parseSharedContextHeader, stripCapturedTableText } from "./exam-parser";

type EdgeTrimMode = boolean | "all" | "top" | "bottom" | "none";

type EdgeTrimOptions = { top?: boolean; bottom?: boolean };

/**
 * Find edge cuts from a row-density projection. Keeping this independent from
 * Canvas makes the crop rule regression-testable without a browser runtime.
 */
export function detectIntruderCuts(
  rowDarkness: ArrayLike<number>,
  contentThreshold = 3,
  targetMargin = 3,
  options: EdgeTrimOptions = { top: true, bottom: true }
): { topCut: number; bottomCut: number } {
  const h = rowDarkness.length;
  let topCut = 0;
  let bottomCut = h;
  const maxBandHeight = 54;
  const minGap = 1;
  // PDF rasterisation can make a one-pixel antialiasing seam look like content.
  // Bridge one blank row while finding a text band, but retain real gutters.
  const collectRuns = (start: number, end: number, step: number) => {
    const runs: Array<{ start: number; end: number }> = [];
    let runStart = -1;
    let lastDark = -1;
    let blankAfter = 0;
    for (let y = start; step > 0 ? y < end : y >= end; y += step) {
      const dark = rowDarkness[y] >= contentThreshold;
      if (dark) {
        if (runStart === -1) runStart = y;
        lastDark = y;
        blankAfter = 0;
      } else if (runStart !== -1) {
        blankAfter += 1;
        if (blankAfter > 1) {
          runs.push({ start: Math.min(runStart, lastDark), end: Math.max(runStart, lastDark) });
          runStart = -1;
          lastDark = -1;
          blankAfter = 0;
        }
      }
    }
    if (runStart !== -1) runs.push({ start: Math.min(runStart, lastDark), end: Math.max(runStart, lastDark) });
    return runs;
  };

  if (options.top !== false) {
    const maxSearchTop = Math.min(Math.round(h * 0.5), 220);
    const runs = collectRuns(0, maxSearchTop, 1);
    const first = runs[0];
    const second = runs.find(run => first && run.start > first.end);
    if (first && second && first.end - first.start + 1 <= maxBandHeight && second.start - first.end - 1 >= minGap) {
      topCut = Math.max(0, second.start - targetMargin);
    } else if (!first) {
      let firstY = 0;
      while (firstY < maxSearchTop && rowDarkness[firstY] < contentThreshold) firstY++;
      if (firstY > targetMargin) topCut = firstY - targetMargin;
    } else if (first.start > targetMargin) {
      topCut = first.start - targetMargin;
    }
  }

  if (options.bottom !== false) {
    const minSearchBottom = Math.max(Math.round(h * 0.5), h - 220);
    const runs = collectRuns(h - 1, minSearchBottom - 1, -1);
    const first = runs[0];
    const second = runs.find(run => first && run.end < first.start);
    if (first && second && first.end - first.start + 1 <= maxBandHeight && first.start - second.end - 1 >= minGap) {
      bottomCut = Math.min(h, second.end + 1 + targetMargin);
    } else if (!first) {
      let lastY = h - 1;
      while (lastY >= minSearchBottom && rowDarkness[lastY] < contentThreshold) lastY--;
      if (h - 1 - lastY > targetMargin) bottomCut = Math.min(h, lastY + 1 + targetMargin);
    } else if (h - 1 - first.end > targetMargin) {
      bottomCut = Math.min(h, first.end + 1 + targetMargin);
    }
  }

  return { topCut, bottomCut };
}

/**
 * Smart edge trimmer that detects whitespace gutters separating the diagram/table
 * from adjacent text lines (such as table titles above or question stems below),
 * trimming away intruder text and leaving a clean, customizable margin (default 3px)
 * while accommodating table tilt / skew safely.
 */
export function trimIntruderTextAndMargin(
  sourceCanvas: HTMLCanvasElement,
  targetMargin = 3,
  options: EdgeTrimOptions = { top: true, bottom: true }
): HTMLCanvasElement {
  const w = sourceCanvas.width;
  const h = sourceCanvas.height;
  if (w <= 10 || h <= 10) return sourceCanvas;

  const ctx = sourceCanvas.getContext("2d");
  if (!ctx) return sourceCanvas;

  let imgData: ImageData;
  try {
    imgData = ctx.getImageData(0, 0, w, h);
  } catch {
    return sourceCanvas;
  }
  const data = imgData.data;

  // Count dark pixels per row
  const rowDarkness = new Uint16Array(h);
  for (let y = 0; y < h; y++) {
    let count = 0;
    const offset = y * w * 4;
    for (let x = 0; x < w; x++) {
      const idx = offset + x * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      // Dark pixel test (grayscale brightness < 200)
      if ((r * 299 + g * 587 + b * 114) / 1000 < 200) {
        count++;
      }
    }
    rowDarkness[y] = count;
  }

  // Threshold for considering a row as containing content
  const contentThreshold = Math.max(3, Math.round(w * 0.005));

  const { topCut, bottomCut } = detectIntruderCuts(rowDarkness, contentThreshold, targetMargin, options);

  const newH = bottomCut - topCut;
  if (newH <= 15 || (topCut === 0 && bottomCut === h)) {
    return sourceCanvas;
  }

  const trimmedCanvas = document.createElement("canvas");
  trimmedCanvas.width = w;
  trimmedCanvas.height = newH;
  const tCtx = trimmedCanvas.getContext("2d");
  if (!tCtx) return sourceCanvas;

  tCtx.fillStyle = "#FFFFFF";
  tCtx.fillRect(0, 0, w, newH);
  tCtx.drawImage(sourceCanvas, 0, topCut, w, newH, 0, 0, w, newH);
  return trimmedCanvas;
}

/**
 * Crop normalized bounding box [ymin, xmin, ymax, xmax] (0..1000) from image data URL using Canvas.
 */
export async function cropBboxFromImage(
  imageSrc: string,
  rawBbox: [number, number, number, number] | any,
  paddingPx = 14,
  targetMargin = 3,
  trimEdges: EdgeTrimMode = true
): Promise<string> {
  const bbox: [number, number, number, number] = Array.isArray(rawBbox) && Array.isArray(rawBbox[0])
    ? (rawBbox[0] as [number, number, number, number])
    : (rawBbox as [number, number, number, number]);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const naturalWidth = img.naturalWidth || img.width;
      const naturalHeight = img.naturalHeight || img.height;

      const rawX = (bbox[1] / 1000) * naturalWidth;
      const rawY = (bbox[0] / 1000) * naturalHeight;
      const rawW = ((bbox[3] - bbox[1]) / 1000) * naturalWidth;
      const rawH = ((bbox[2] - bbox[0]) / 1000) * naturalHeight;

      // Generous adaptive padding: protects callout annotations and corners
      const padX = Math.max(paddingPx, Math.min(36, Math.round(rawW * 0.035)));
      const padY = Math.max(paddingPx, Math.min(32, Math.round(rawH * 0.035)));
      // Safe top padding bonus to ensure slightly tilted top border strokes are captured before smart trimming
      const padTop = Math.max(padY, Math.min(36, Math.round(padY * 1.15)));

      // Add border padding without going out of bounds
      const x = Math.max(0, Math.round(rawX - padX));
      const y = Math.max(0, Math.round(rawY - padTop));
      const w = Math.min(naturalWidth - x, Math.round(rawW + padX * 2));
      const h = Math.min(naturalHeight - y, Math.round(rawH + padTop + padY));

      if (w <= 0 || h <= 0) {
        resolve(imageSrc);
        return;
      }

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(imageSrc);
        return;
      }

      // Fill pure white background
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, x, y, w, h, 0, 0, w, h);

      const trimOptions =
        trimEdges === "bottom" ? { top: false, bottom: true } :
          trimEdges === "top" ? { top: true, bottom: false } :
            trimEdges === true || trimEdges === "all" ? { top: true, bottom: true } :
              null;
      const finalCanvas = trimOptions ? trimIntruderTextAndMargin(canvas, targetMargin, trimOptions) : canvas;
      resolve(finalCanvas.toDataURL("image/png"));
    };
    img.onerror = () => reject(new Error("FAILED_TO_LOAD_IMAGE_FOR_CROP"));
    img.src = imageSrc;
  });
}



/**
 * Harvest diagrams, framed tables, and figures from page images and attach to exam items.
 */
export async function harvestExamDiagrams(
  items: ExamItem[],
  pageImages: string[],
  current: () => boolean,
  onProgress?: (completed: number, total: number, message: string) => void
): Promise<{ items: ExamItem[]; count: number; error?: string }> {
  const resultItems = items.map(item => ({
    ...item,
    choices: item.choices.map(c => ({ ...c }))
  }));

  if (!pageImages || pageImages.length === 0) {
    return { items: resultItems, count: 0, error: "ไม่พบรูปหน้าต้นฉบับสำหรับสกัดรูปภาพ" };
  }

  let harvestedCount = 0;
  let firstError: string | undefined;

  const choiceKeyMap: Record<string, string> = {
    "1": "ก", "2": "ข", "3": "ค", "4": "ง", "5": "จ",
    "A": "ก", "B": "ข", "C": "ค", "D": "ง", "E": "จ",
    "a": "ก", "b": "ข", "c": "ค", "d": "ง", "e": "จ",
    "ก": "ก", "ข": "ข", "ค": "ค", "ง": "ง", "จ": "จ"
  };

  for (let pageIndex = 0; pageIndex < pageImages.length; pageIndex++) {
    if (!current()) break;
    const pageNumber = pageIndex + 1;
    const pageImage = pageImages[pageIndex];

    onProgress?.(pageIndex, pageImages.length, `กำลังตรวจหารูปภาพและตาราง หน้า ${pageNumber}/${pageImages.length}...`);

    if (pageIndex > 0) {
      await new Promise(r => setTimeout(r, 600)); // Pacing to respect Google API rate limit
    }

    // Questions likely on this page
    const pageQuestions = resultItems
      .filter(item => !item.sourcePage || item.sourcePage === pageNumber)
      .map(item => ({ questionNumber: item.questionNumber, stem: item.questionText }));

    try {
      const response = await fetch("/api/diagrams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: pageImage,
          page: pageNumber,
          questions: pageQuestions,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        if (!firstError) firstError = err.error || `HTTP ${response.status}`;
        continue;
      }

      const data = await response.json();
      const diagrams: DetectedDiagram[] = Array.isArray(data.diagrams) ? data.diagrams : [];

      for (const diag of diagrams) {
        if (!current()) break;
        const cropPadding = diag.type === "shared_context" ? 16 : diag.type === "question" ? 32 : diag.type === "choice" ? 20 : 16;
        const shouldTrimEdges: EdgeTrimMode = (diag.type === "shared_context" || diag.type === "question") ? "all" : "none";
        const crop = await cropBboxFromImage(pageImage, diag.bbox, cropPadding, 3, shouldTrimEdges).catch(() => null);
        if (!crop) continue;



        // Locate target question
        let targetItem = resultItems.find(it => it.questionNumber === diag.questionNumber);
        if (!targetItem && diag.questionNumber) {
          // If not found by questionNumber, find by range or source page
          targetItem = resultItems.find(it => it.sourcePage === pageNumber);
        }

        if (diag.type === "shared_context") {
          // Locate question starting this shared scenario block
          let sharedItem = resultItems.find(it =>
            it.isSharedContextStart &&
            it.sharedContextRange &&
            diag.questionNumber !== undefined &&
            diag.questionNumber >= it.sharedContextRange.start &&
            diag.questionNumber <= it.sharedContextRange.end
          );
          if (!sharedItem && targetItem) {
            sharedItem = targetItem.isSharedContextStart ? targetItem : resultItems.find(it => it.isSharedContextStart && it.sourcePage === pageNumber);
          }
          if (sharedItem) {
            sharedItem.sharedContextImageUrl = crop;
            if (sharedItem.sharedContextText) {
              sharedItem.sharedContextText = stripCapturedTableText(sharedItem.sharedContextText);
            }
            harvestedCount++;
          } else if (targetItem) {
            targetItem.sharedContextImageUrl = crop;
            if (targetItem.sharedContextText) {
              targetItem.sharedContextText = stripCapturedTableText(targetItem.sharedContextText);
            }
            harvestedCount++;
          }
        } else if (diag.type === "choice" && diag.choiceKey && targetItem) {
          const mappedKey = choiceKeyMap[diag.choiceKey] || diag.choiceKey;
          let choice = targetItem.choices.find(c => c.key === mappedKey || c.key === diag.choiceKey);
          if (!choice) {
            choice = {
              key: mappedKey,
              text: "",
              isCorrect: false,
              imageUrl: crop,
              imageStatus: "CLEAN",
            };
            targetItem.choices.push(choice);
            const order = ["ก", "ข", "ค", "ง", "จ", "1", "2", "3", "4", "5", "A", "B", "C", "D", "E"];
            targetItem.choices.sort((a, b) => {
              const ai = order.indexOf(a.key);
              const bi = order.indexOf(b.key);
              return (ai !== -1 ? ai : 99) - (bi !== -1 ? bi : 99);
            });
            // Clean up stray standalone numeric choice markers in question stem if any
            targetItem.questionText = targetItem.questionText
              .split("\n")
              .filter(l => !/^\s*[1-4]\s*\.?\s*\d*\s*$/.test(l))
              .join("\n")
              .trim();
            harvestedCount++;
          } else {
            choice.imageUrl = crop;
            choice.imageStatus = "CLEAN";
            choice.text = "";
            harvestedCount++;
          }
        } else if (diag.type === "question" && targetItem) {
          targetItem.imageUrl = crop;
          targetItem.imageStatus = "CLEAN";
          harvestedCount++;
        } else if (diag.type === "explanation" && targetItem) {
          targetItem.explanationImageUrl = crop;
          harvestedCount++;
        }
      }
    } catch (e) {
      if (!firstError) firstError = e instanceof Error ? e.message : "NETWORK_ERROR";
    }
  }

  return { items: resultItems, count: harvestedCount, error: firstError };
}
