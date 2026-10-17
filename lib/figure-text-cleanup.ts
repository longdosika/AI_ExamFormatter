import { hasCellRowEvidence, isChoiceTableFigure, hasTabularTextEvidence, stripTrailingFigureLabels, validTextRegions, type OcrTextRegion } from "./capture-geometry";
import { normalizeThaiOcrText } from "./text-normalization";

type Bbox = [number, number, number, number];

/** Version written on figures cropped by the current pipeline; older figures can be re-cropped from the original. */
export const CROP_VERSION = "2";

function readBox(image: HTMLImageElement): { page: number; bbox: Bbox } | null {
  const page = Number(image.dataset.sourcePage);
  try {
    const bbox = JSON.parse(image.dataset.sourceBbox || "null");
    if (page > 0 && Array.isArray(bbox) && bbox.length === 4 && bbox.every((n: unknown) => typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= 1000)) return { page, bbox: bbox as Bbox };
  } catch {}
  return null;
}

/** OCR lines fully inside the figure box, top to bottom. */
function figureLines(regions: OcrTextRegion[], bbox: Bbox): string[] {
  return validTextRegions(regions)
    .filter(row => row.bbox[0] >= bbox[0] && row.bbox[1] >= bbox[1] && row.bbox[2] <= bbox[2] && row.bbox[3] <= bbox[3])
    .sort((a, b) => a.bbox[0] - b.bbox[0] || a.bbox[1] - b.bbox[1])
    .map(row => normalizeThaiOcrText(row.text).trim()).filter(Boolean);
}

function tidy(stem: HTMLElement) {
  for (const child of Array.from(stem.childNodes)) if (child.nodeType === Node.TEXT_NODE && !child.textContent?.trim()) child.remove();
  for (const br of Array.from(stem.querySelectorAll("br"))) {
    const before = br.previousSibling, after = br.nextSibling;
    if (!before || !after || before.nodeName === "BR") br.remove();
  }
}

/**
 * T-124: remove stem text that duplicates a captured figure, using the OCR line geometry stored with the draft.
 * Table rows are removed only with table evidence, either as whole lines or as a run of two or more consecutive
 * rows flattened into one line; single words that also occur in the question are never removed. Short labels
 * printed in the figure are removed only from the end of the stem. Formatting elements are kept.
 */
export function cleanStemAgainstFigure(stem: HTMLElement, regions: OcrTextRegion[], bbox: Bbox): boolean {
  const lines = figureLines(regions, bbox);
  let changed = false;
  if (lines.length && (hasCellRowEvidence(regions, bbox) || hasTabularTextEvidence(regions, bbox))) {
    const rows = new Set(lines);
    // Whole lines separated by <br>.
    const groups: Node[][] = [[]];
    for (const child of Array.from(stem.childNodes)) { if (child.nodeName === "BR") groups.push([child]); else groups[groups.length - 1].push(child); }
    groups.forEach((group, index) => {
      if (index === 0) return; // the first line is the stem's own sentence
      const text = group.filter(node => node.nodeName !== "BR").map(node => node.textContent || "").join("").trim();
      if (text && rows.has(text)) { group.forEach(node => node.parentNode?.removeChild(node)); changed = true; }
    });
    // Runs of consecutive rows flattened into one text node by older builds.
    const walker = document.createTreeWalker(stem, NodeFilter.SHOW_TEXT);
    const texts: Text[] = []; let node: Node | null;
    while ((node = walker.nextNode())) texts.push(node as Text);
    for (const text of texts) {
      let value = text.textContent || "";
      for (let size = lines.length; size >= 2; size--) {
        for (let start = 0; start + size <= lines.length; start++) {
          const run = lines.slice(start, start + size).join(" ");
          if (value.includes(run)) { value = value.split(run).join(" ").replace(/[ \t]{2,}/g, " "); changed = true; }
        }
      }
      if (value !== text.textContent) text.textContent = value;
    }
  }
  // Labels printed inside the figure at the end of the stem.
  const walker = document.createTreeWalker(stem, NodeFilter.SHOW_TEXT);
  let last: Text | null = null; let node: Node | null;
  while ((node = walker.nextNode())) if (node.textContent?.trim()) last = node as Text;
  if (last) {
    const value = last.textContent || "";
    const stripped = stripTrailingFigureLabels(value, regions, bbox);
    if (stripped !== value.trimEnd()) { last.textContent = stripped; changed = true; }
  }
  if (changed) tidy(stem);
  return changed;
}

/** T-124: run the figure-text cleanup for every question and shared figure that records its source page and box. */
/** Visible choice text of an editor item, without key, answer marks and controls. */
function choiceTexts(item: HTMLElement): { text: string }[] {
  return Array.from(item.querySelectorAll<HTMLElement>("[data-choice-key]")).map(row => {
    const clone = row.cloneNode(true) as HTMLElement;
    clone.querySelectorAll("[data-export-ignore],[data-answer-marker],[data-answer-badge],input,button").forEach(node => node.remove());
    return { text: (clone.textContent || "").replace(/​/g, "").replace(/^\s*[ก-จ]\.\s*/, "").trim() };
  });
}

export function cleanFigureTextInEditor(editor: HTMLElement, regionsByPage: OcrTextRegion[][] | undefined): number {
  if (!regionsByPage?.length) return 0;
  let changed = 0;
  editor.querySelectorAll<HTMLElement>("[data-item-id]").forEach(item => {
    const stem = item.querySelector<HTMLElement>("[data-question-text]");
    // T-131: a question can hold several figures; check and clean against each of them.
    for (const image of Array.from(item.querySelectorAll<HTMLImageElement>(":scope > [data-question-image] img"))) {
      const box = readBox(image);
      if (!box) continue;
      // T-130: an older harvest attached the choice table as the question figure; the choices already hold it.
      if (isChoiceTableFigure(choiceTexts(item), regionsByPage[box.page - 1] || [], box.bbox)) {
        const block = image.closest<HTMLElement>("[data-question-image]");
        const wrapper = image.parentElement !== block && image.parentElement?.querySelectorAll("img").length === 1 ? image.parentElement : image;
        wrapper?.remove();
        if (block && !block.querySelector("img")) block.remove();
        changed++;
        continue;
      }
      if (stem && cleanStemAgainstFigure(stem, regionsByPage[box.page - 1] || [], box.bbox)) changed++;
    }
  });
  editor.querySelectorAll<HTMLElement>("[data-shared-context-block]").forEach(block => {
    const image = block.querySelector<HTMLImageElement>("[data-shared-image] img");
    const text = block.querySelector<HTMLElement>("[data-shared-text], .whitespace-pre-line");
    const box = image && readBox(image);
    if (text && box && cleanStemAgainstFigure(text, regionsByPage[box.page - 1] || [], box.bbox)) changed++;
  });
  return changed;
}

/** Figures cropped before the current pipeline that still know where they came from (candidates for re-cropping). */
export function staleFigures(editor: HTMLElement): HTMLImageElement[] {
  return Array.from(editor.querySelectorAll<HTMLImageElement>("[data-question-image] img, [data-shared-image] img"))
    .filter(image => !image.dataset.cropVersion && readBox(image) !== null);
}

export function figureSource(image: HTMLImageElement) { return readBox(image); }
