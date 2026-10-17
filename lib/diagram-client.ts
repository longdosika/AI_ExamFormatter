import { ExamItem, QuestionFigure, questionFigures, sortFiguresBySource } from "./formatter-rules";
import { DetectedDiagram } from "./diagram-service";
import { parseSharedContextHeader, stripCapturedTableText } from "./exam-parser";
import { figureReach, isChoiceTableFigure, choiceBelowFigureTop, constrainFigure, figureVerticalLimits, hasCellRowEvidence, stripTrailingFigureLabels, hasTabularTextEvidence, removeCapturedGridText, removeCapturedFigureEnumerations, tableContinuationTop, type OcrTextRegion } from "./capture-geometry";
import { detectRuledTable } from "./table-bounds";

type EdgeTrimMode = boolean | "all" | "top" | "bottom" | "none";

type EdgeTrimOptions = { top?: boolean; bottom?: boolean; contentTop?: number; contentBottom?: number };

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
    if (first && second && first.end - first.start + 1 > 3 && first.end - first.start + 1 <= maxBandHeight && second.start - first.end - 1 >= minGap) {
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
    if (first && second && first.end - first.start + 1 > 3 && first.end - first.start + 1 <= maxBandHeight && first.start - second.end - 1 >= minGap) {
      bottomCut = Math.min(h, second.end + 1 + targetMargin);
    } else if (!first) {
      let lastY = h - 1;
      while (lastY >= minSearchBottom && rowDarkness[lastY] < contentThreshold) lastY--;
      if (h - 1 - lastY > targetMargin) bottomCut = Math.min(h, lastY + 1 + targetMargin);
    } else if (h - 1 - first.end > targetMargin) {
      bottomCut = Math.min(h, first.end + 1 + targetMargin);
    }
  }

  // A whitespace gap is not proof of contamination inside the detector's figure.
  // Only remove padding outside that protected region; keep detached guide lines.
  if (options.contentTop !== undefined) topCut = Math.min(topCut, Math.max(0, Math.floor(options.contentTop) - targetMargin));
  if (options.contentBottom !== undefined) bottomCut = Math.max(bottomCut, Math.min(h, Math.ceil(options.contentBottom) + targetMargin));
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
/**
 * T-121 (audit): a provider box can end inside a figure label ("เวลา (น|าที)"). When printed ink touches
 * the left/right edge of the padded crop, widen that side until a clear whitespace gap, within a small
 * budget. Coloured pen marks are ignored; if no gap appears in budget the side is left unchanged.
 */
export function extendCropAcrossInk(
  pixels: Uint8ClampedArray, width: number, height: number,
  crop: { x: number; y: number; w: number; h: number },
  allowed: { left: number; right: number } = { left: 0, right: width },
  band: { top: number; bottom: number } = { top: crop.y, bottom: crop.y + crop.h },
): { x: number; w: number } {
  const top = Math.max(0, band.top), bottom = Math.min(height, band.bottom);
  const hasInk = (column: number) => {
    let dark = 0;
    for (let row = top; row < bottom; row++) {
      const index = (row * width + column) * 4;
      const red = pixels[index], green = pixels[index + 1], blue = pixels[index + 2];
      const coloured = Math.max(red, green, blue) - Math.min(red, green, blue) > 60;
      if (!coloured && red * 0.299 + green * 0.587 + blue * 0.114 < 150 && ++dark >= 2) return true;
    }
    return false;
  };
  const gap = Math.max(10, Math.round(width * 0.012));
  const budget = Math.round(width * 0.08);
  const walk = (edge: number, step: 1 | -1, limit: number) => {
    // Padding is 14-36px, so ink within 6px of the padded edge means the figure continues past it
    // (glyphs have 2-3px internal gaps, so a single edge column is not enough).
    if (![0, 1, 2, 3, 4, 5].some(offset => hasInk(edge - step * offset))) return edge;
    let blank = 0;
    for (let column = edge + step; step > 0 ? column < limit : column >= limit; column += step) {
      blank = hasInk(column) ? 0 : blank + 1;
      if (blank >= gap) return column - step * (blank - 4);
    }
    return edge;
  };
  const right = walk(crop.x + crop.w - 1, 1, Math.min(width, allowed.right, crop.x + crop.w + budget)) + 1;
  const left = walk(crop.x, -1, Math.max(0, allowed.left, crop.x - budget));
  return { x: left, w: right - left };
}

/**
 * T-132 (C-14 upward): when printed ink touches the top rows of the crop, walk upward over the figure's ink until a
 * clear gap (blank rows), never above `topLimit`. Only columns right of `leftLimit` count, so a question number
 * printed left of the figure does not pull the crop up. Returns the new top row (or the old one).
 */
export function extendCropUpAcrossInk(pixels: Uint8ClampedArray, width: number, height: number, crop: { x: number; y: number; w: number; h: number }, topLimit: number, leftLimit = 0): number {
  const from = Math.max(crop.x, leftLimit), to = Math.min(width, crop.x + crop.w);
  if (to - from < 4 || topLimit >= crop.y) return crop.y;
  const rowInk = (row: number) => {
    let dark = 0;
    for (let column = from; column < to; column++) {
      const index = (row * width + column) * 4;
      const red = pixels[index], green = pixels[index + 1], blue = pixels[index + 2];
      if (Math.max(red, green, blue) - Math.min(red, green, blue) > 60) continue;
      if (red * 0.299 + green * 0.587 + blue * 0.114 < 150 && ++dark >= 2) return true;
    }
    return false;
  };
  if (![0, 1, 2].some(offset => crop.y + offset < height && rowInk(crop.y + offset))) return crop.y;
  const gap = Math.max(6, Math.round(height * 0.004));
  let lastInk = crop.y, blank = 0;
  for (let row = crop.y - 1; row >= Math.max(0, topLimit); row--) {
    if (rowInk(row)) { lastInk = row; blank = 0; } else if (++blank >= gap) break;
  }
  return Math.max(Math.max(0, topLimit), lastInk - 3);
}

/**
 * T-124: re-crop a figure that was cropped by an older version, from its original page and stored source box,
 * with the current limits (stem lines, a choice line directly below, table continuation, edge widening).
 */
export async function recropFigure(pageImage: string, bbox: [number, number, number, number], role: "question" | "shared", question: number,
  pageQuestions: { questionNumber: number; stem: string }[], regions: OcrTextRegion[], isTable: boolean): Promise<{ url: string; bbox: [number, number, number, number] } | null> {
  const limits: [number, number, number, number] = role === "question"
    ? figureVerticalLimits(question, pageQuestions.map(entry => entry.questionNumber), regions, isTable, bbox, pageQuestions)
    : [0, 0, 1000, 1000];
  const choiceTop = role === "question" ? choiceBelowFigureTop(regions, bbox) : undefined;
  if (choiceTop !== undefined) limits[2] = Math.min(limits[2], choiceTop - 3);
  let safe = constrainFigure(bbox, limits);
  const continuation = safe && isTable ? tableContinuationTop(regions, safe, limits[2]) : undefined;
  if (continuation !== undefined) { limits[2] = Math.min(limits[2], continuation - 3); safe = safe && constrainFigure(safe, limits); }
  if (!safe) return null;
  const url = await cropBboxFromImage(pageImage, safe, role === "question" ? 32 : 16, 3, "all", limits, role === "question" ? figureReach(question, pageQuestions, regions, bbox) : undefined);
  return { url, bbox: safe };
}

export async function cropBboxFromImage(
  imageSrc: string,
  rawBbox: [number, number, number, number] | any,
  paddingPx = 14,
  targetMargin = 3,
  trimEdges: EdgeTrimMode = true,
  allowedBbox: [number, number, number, number] = [0, 0, 1000, 1000],
  reach?: { top: number; left: number; lineBottom: number }
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
      let x = Math.max(0, Math.round(rawX - padX), Math.ceil(allowedBbox[1] / 1000 * naturalWidth));
      let y = Math.max(0, Math.round(rawY - padTop), Math.ceil(allowedBbox[0] / 1000 * naturalHeight));
      let w = Math.min(naturalWidth, Math.ceil(rawX + rawW + padX), Math.floor(allowedBbox[3] / 1000 * naturalWidth)) - x;
      let h = Math.min(naturalHeight, Math.ceil(rawY + rawH + padY), Math.floor(allowedBbox[2] / 1000 * naturalHeight)) - y;
      let contentTop = rawY;
      if (w > 0 && h > 0) {
        const page = document.createElement("canvas");
        page.width = naturalWidth;
        page.height = naturalHeight;
        const pageContext = page.getContext("2d", { willReadFrequently: true });
        if (pageContext) {
          pageContext.drawImage(img, 0, 0);
          const pixels = pageContext.getImageData(0, 0, naturalWidth, naturalHeight).data;
          if (reach) {
            // T-132: the figure's own ink touches the crop top -> walk up to the first clear gap, not above the question line.
            const raised = extendCropUpAcrossInk(pixels, naturalWidth, naturalHeight, { x, y, w, h },
              Math.round(reach.top / 1000 * naturalHeight), Math.ceil(reach.left / 1000 * naturalWidth));
            if (raised < y) {
              h += y - raised; y = raised; contentTop = Math.min(contentTop, raised);
              if (raised < reach.lineBottom / 1000 * naturalHeight) {
                const left = Math.max(x, Math.ceil(reach.left / 1000 * naturalWidth));
                w -= left - x; x = left;
              }
            }
          }
          const widened = extendCropAcrossInk(pixels, naturalWidth, naturalHeight, { x, y, w, h },
            { left: Math.ceil(allowedBbox[1] / 1000 * naturalWidth), right: Math.floor(allowedBbox[3] / 1000 * naturalWidth) },
            // Only the figure's own rows decide: stem and choice lines above/below span the whole width.
            { top: Math.max(y, Math.round(rawY)), bottom: Math.min(y + h, Math.round(rawY + rawH)) });
          x = widened.x;
          w = widened.w;
        }
      }

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
      const finalCanvas = trimOptions ? trimIntruderTextAndMargin(canvas, targetMargin, {
        ...trimOptions, contentTop: contentTop - y, contentBottom: rawY + rawH - y,
      }) : canvas;
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
  onProgress?: (completed: number, total: number, message: string) => void,
  textRegions: OcrTextRegion[][] = []
): Promise<{ items: ExamItem[]; count: number; error?: string }> {
  const resultItems: ExamItem[] = items.map(item => ({
    ...item,
    choices: item.choices.map(c => ({ ...c })),
    questionImages: questionFigures(item).map(figure => ({ ...figure })),
  }));
  // T-131: question figures found by this harvest, per item; they replace the item's figures at the end
  // (a re-harvest must not append duplicates), and items without new figures keep theirs.
  const harvestedFigures = new Map<ExamItem, QuestionFigure[]>();

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

      let diagrams: DetectedDiagram[] = [];
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        if (!firstError) firstError = err.error || `HTTP ${response.status}`;
      } else {
        const data = await response.json();
        diagrams = Array.isArray(data.diagrams) ? data.diagrams : [];
      }
      const tableReference = /ตาราง|\[ตาราง\]|<table|สาร\s+จุดเดือด.*การละลาย/i;
      const missingTables = pageQuestions.filter(q => tableReference.test(q.stem) && !diagrams.some(diag => diag.questionNumber === q.questionNumber));
      if (response.ok && missingTables.length && current()) {
        const retry = await fetch("/api/diagrams", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image: pageImage, page: pageNumber, questions: missingTables }) });
        const body = await retry.json().catch(() => ({}));
        if (retry.ok && Array.isArray(body.diagrams)) diagrams.push(...body.diagrams.filter((diag: DetectedDiagram) => missingTables.some(q => q.questionNumber === diag.questionNumber)));
        else if (!retry.ok && !firstError) firstError = body.error || `HTTP ${retry.status}`;
      }
      for(const question of missingTables.filter(q=>!diagrams.some(diag=>diag.questionNumber===q.questionNumber))) {
        const limits=figureVerticalLimits(question.questionNumber,pageQuestions.map(q=>q.questionNumber),textRegions[pageIndex] || [],true,undefined,pageQuestions);
        if(limits[0]===0) continue;
        const image=new Image();image.src=pageImage;await image.decode();
        const canvas=document.createElement("canvas");canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
        const context=canvas.getContext("2d",{willReadFrequently:true});
        if(!context) continue;
        context.drawImage(image,0,0);
        const bbox=detectRuledTable(context.getImageData(0,0,canvas.width,canvas.height).data,canvas.width,canvas.height,limits);
        if(bbox) diagrams.push({id:`local-grid-${pageNumber}-${question.questionNumber}`,type:"question",questionNumber:question.questionNumber,description:"ตารางจากเส้นกริดในต้นฉบับ",bbox,page:pageNumber,confidence:0});
      }

      for (const diag of diagrams) {
        if (!current()) break;
        const declaredTarget = resultItems.find(item => item.questionNumber === diag.questionNumber && (!item.sourcePage || item.sourcePage === pageNumber));
        if (!declaredTarget) { if (!firstError) firstError = `จับคู่รูปหน้า ${pageNumber} กับหมายเลขข้อไม่ได้ กรุณาตรวจต้นฉบับ`; continue; }
        if (diag.type === "shared_context" && !declaredTarget.sharedContextRange) diag.type = "question";
        // T-130: a table that only repeats the choices (already rebuilt as choice text) is not a question figure.
        if (diag.type === "question" && isChoiceTableFigure(declaredTarget.choices, textRegions[pageIndex] || [], diag.bbox, diag.description)) {
          const covered = (old?: [number, number, number, number]) => Boolean(old && Math.max(0, Math.min(old[2], diag.bbox[2]) - Math.max(old[0], diag.bbox[0])) * Math.max(0, Math.min(old[3], diag.bbox[3]) - Math.max(old[1], diag.bbox[1])) > 0.5 * (old[2] - old[0]) * (old[3] - old[1]));
          // T-131: drop only the earlier figure(s) this choice table covers; other figures of the item stay.
          declaredTarget.questionImages = (declaredTarget.questionImages || []).filter(figure => !covered(figure.bbox));
          harvestedFigures.set(declaredTarget, (harvestedFigures.get(declaredTarget) || []).filter(figure => !covered(figure.bbox)));
          continue;
        }
        const cropPadding = diag.type === "shared_context" ? 16 : diag.type === "question" ? 32 : diag.type === "choice" ? 20 : 16;
        const shouldTrimEdges: EdgeTrimMode = (diag.type === "shared_context" || diag.type === "question") ? "all" : "none";
        const isTable=/ตาราง|table/i.test(diag.description) || tableReference.test(declaredTarget.questionText);
        const limits = diag.type === "question" ? figureVerticalLimits(diag.questionNumber || 0, pageQuestions.map(q => q.questionNumber), textRegions[pageIndex] || [],isTable,diag.bbox,pageQuestions) : [0, 0, 1000, 1000] as [number, number, number, number];
        // T-124: a choice line directly under the figure bounds it as well.
        const choiceTop = diag.type === "question" ? choiceBelowFigureTop(textRegions[pageIndex] || [], diag.bbox) : undefined;
        if (choiceTop !== undefined) limits[2] = Math.min(limits[2], choiceTop - 3);
        let safeBbox = constrainFigure(diag.bbox, limits);
        const continuation=safeBbox&&isTable ? tableContinuationTop(textRegions[pageIndex] || [],safeBbox,limits[2]) : undefined;
        if(continuation!==undefined) {limits[2]=Math.min(limits[2],continuation-3);safeBbox=safeBbox&&constrainFigure(safeBbox,limits);}
        let confirmedGrid=false;
        if (safeBbox && diag.type === "question" && isTable) {
          const image = new Image(); image.src = pageImage; await image.decode();
          const canvas = document.createElement("canvas"); canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
          const context=canvas.getContext("2d",{willReadFrequently:true});
          if(context) {
            context.drawImage(image,0,0);
            const grid=detectRuledTable(context.getImageData(0,0,canvas.width,canvas.height).data,canvas.width,canvas.height,limits);
            confirmedGrid=Boolean(grid); safeBbox=grid || safeBbox;
          }
        }
        if (!safeBbox) { if (!firstError) firstError = `กรอบรูปข้อ ${diag.questionNumber} ทับข้อความ ต้องจับภาพใหม่จากต้นฉบับ`; continue; }
        const reach = diag.type === "question" && !confirmedGrid ? figureReach(diag.questionNumber || 0, pageQuestions, textRegions[pageIndex] || [], diag.bbox) : undefined;
        const crop = await cropBboxFromImage(pageImage, safeBbox, cropPadding, 3, shouldTrimEdges, limits, reach).catch(() => null);
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
            sharedItem.sharedContextImageBbox = safeBbox;
            if (sharedItem.sharedContextText) {
              sharedItem.sharedContextText = stripTrailingFigureLabels(stripCapturedTableText(sharedItem.sharedContextText), textRegions[pageIndex] || [], safeBbox);
            }
            harvestedCount++;
          } else if (targetItem) {
            targetItem.sharedContextImageUrl = crop;
            targetItem.sharedContextImageBbox = safeBbox;
            if (targetItem.sharedContextText) {
              targetItem.sharedContextText = stripTrailingFigureLabels(stripCapturedTableText(targetItem.sharedContextText), textRegions[pageIndex] || [], safeBbox);
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
              imageStatus: "UNVERIFIED",
              sourceBbox: safeBbox,
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
            choice.imageStatus = "UNVERIFIED";
            choice.sourceBbox = safeBbox;
            choice.text = "";
            harvestedCount++;
          }
        } else if (diag.type === "question" && targetItem) {
          harvestedFigures.set(targetItem, [...(harvestedFigures.get(targetItem) || []), { url: crop, bbox: safeBbox }]);
          const tableTextConfirmed=confirmedGrid || (isTable && (hasTabularTextEvidence(textRegions[pageIndex] || [],safeBbox) || hasCellRowEvidence(textRegions[pageIndex] || [],safeBbox)));
          const withoutCapturedText = tableTextConfirmed ? removeCapturedGridText(targetItem.questionText, textRegions[pageIndex] || [], safeBbox)
            : !isTable ? removeCapturedFigureEnumerations(targetItem.questionText, textRegions[pageIndex] || [], safeBbox) : targetItem.questionText;
          targetItem.questionText = stripTrailingFigureLabels(stripCapturedTableText(withoutCapturedText),textRegions[pageIndex] || [],safeBbox);
          targetItem.imageStatus = "UNVERIFIED";
          harvestedCount++;
        } else if (diag.type === "explanation" && targetItem) {
          targetItem.explanationImageUrl = crop;
          targetItem.explanationImageBbox = safeBbox;
          harvestedCount++;
        }
      }
    } catch (e) {
      if (!firstError) firstError = e instanceof Error ? e.message : "NETWORK_ERROR";
    }
  }

  for (const item of resultItems) {
    const fresh = harvestedFigures.get(item);
    // T-131: several figures per question (Q25 รูปที่ 1-4), in source order; the first also fills imageUrl.
    const figures = sortFiguresBySource(fresh?.length ? fresh : item.questionImages || []);
    item.questionImages = figures.length ? figures : undefined;
    item.imageUrl = figures[0]?.url;
    item.imageBbox = figures[0]?.bbox;
  }
  return { items: resultItems, count: harvestedCount, error: firstError };
}
