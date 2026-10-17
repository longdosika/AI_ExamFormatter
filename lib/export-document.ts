export interface ExportRun { text?: string; bold?: boolean; italic?: boolean; underline?: boolean; color?: string; image?: string; width?: number; height?: number; displayScale?: number }
/** Semantic role of an exported paragraph, read from editor data attributes (T-108). */
export type ParagraphRole = "question" | "questionImageLabel" | "questionImage" | "choicesLabel" | "choice" | "choiceImage"
  | "sharedHeader" | "sharedText" | "sharedImageLabel" | "sharedImage" | "sharedEnd"
  | "explanation" | "explanationImageLabel" | "explanationImage";
export const PARAGRAPH_ROLES: readonly ParagraphRole[] = ["question", "questionImageLabel", "questionImage", "choicesLabel", "choice", "choiceImage", "sharedHeader", "sharedText", "sharedImageLabel", "sharedImage", "sharedEnd", "explanation", "explanationImageLabel", "explanationImage"];
export interface ExportParagraph { runs: ExportRun[]; background?: string; keepWithNext?: boolean; role?: ParagraphRole; item?: number }
export interface ExportDocument { title: string; paragraphs: ExportParagraph[] }

function paragraphRole(anchor: Element | null, text: string): ParagraphRole | undefined {
  if (!anchor) return undefined;
  const image = anchor instanceof HTMLImageElement;
  const within = (selector: string) => Boolean(anchor.closest(selector));
  if (within("[data-shared-context-end]")) return "sharedEnd";
  if (within("[data-shared-image]")) return image ? "sharedImage" : "sharedImageLabel";
  if (within("[data-shared-context-block]")) return text.trim().startsWith("โจทย์ร่วม") ? "sharedHeader" : "sharedText";
  if (within("[data-question-image]")) return image ? "questionImage" : "questionImageLabel";
  if (within("[data-choice-image]")) return "choiceImage";
  if (within("[data-choice-key]")) return "choice";
  if (within("[data-explanation-image]")) return image ? "explanationImage" : "explanationImageLabel";
  if (within("[data-explanation-block]")) return "explanation";
  if (text.trim() === "ตัวเลือก:") return "choicesLabel";
  if (within("[data-item-id]")) return image ? "questionImage" : "question";
  return undefined;
}

/** Widest exported figure: the master template text column holds 661 px question/shared images (T-109). */
const MAX_EXPORT_IMAGE_WIDTH = 661;

function hexColor(value: string): string | undefined {
  const rgb = value.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/);
  // Translucent fills (e.g. the 5% teal shared-context box) are editor decoration; DOCX shading is opaque,
  // so exporting them would paint a solid block. Only fully opaque colors are exported.
  if (!rgb || (rgb[4] !== undefined && Number(rgb[4]) < 1)) return undefined;
  return rgb.slice(1, 4).map(n => Number(n).toString(16).padStart(2, "0")).join("").toUpperCase();
}

/** Snapshot the live edited DOM; never reconstruct it from stale parsed items. */
export function snapshotDocument(editor: HTMLElement, title: string): ExportDocument {
  normalizeAnswerDecorations(editor);
  const paragraphs: ExportParagraph[] = [];
  let current: ExportParagraph = { runs: [] };
  let anchor: Element | null = null;
  const flush = () => {
    if (current.runs.length) {
      const role = paragraphRole(anchor, current.runs.map(run => run.text || "").join(""));
      if (role) current.role = role;
      // Restored drafts wrap items in an extra element, so resolve the item from the anchor itself.
      const item = Number(anchor?.closest<HTMLElement>("[data-item-id]")?.dataset.itemId);
      if (Number.isFinite(item) && item > 0) current.item = item;
      paragraphs.push(current);
    }
    current = { runs: [] };
    anchor = null;
  };
  const visit = (node: Node, inheritedBackground?: string) => {
    if (node.nodeType === Node.TEXT_NODE) {
      // T-126: zero-width spaces (caret placeholders in new choice rows, pasted text) never reach the export.
      const text = (node.textContent || "").replace(/​/g, "");
      if (!text) return;
      const parent = node.parentElement;
      const style = parent ? getComputedStyle(parent) : null;
      if (inheritedBackground) current.background = inheritedBackground;
      if (!anchor && text.trim()) anchor = parent;
      current.runs.push({ text, bold: Number(style?.fontWeight) >= 600, italic: style?.fontStyle === "italic", underline: style?.textDecorationLine.includes("underline"), color: style ? hexColor(style.color) : undefined });
      return;
    }
    if (!(node instanceof HTMLElement) || node.matches('[data-export-ignore],script,style,button,svg')) return;
    if (node instanceof HTMLImageElement) {
      const sourceWidth = node.naturalWidth || node.width || 500;
      const sourceHeight = node.naturalHeight || node.height || 300;
      // T-107: editor size presets (50/75/100%) travel as data-export-scale and shrink the exported image.
      const requested = Number(node.dataset.exportScale);
      const displayScale = requested > 0 && requested < 1 ? requested : undefined;
      const width = Math.min(sourceWidth, MAX_EXPORT_IMAGE_WIDTH) * (displayScale ?? 1);
      if (!anchor) anchor = node;
      current.runs.push({ image: node.src, width, height: sourceHeight * width / sourceWidth, displayScale });
      return;
    }
    if (node.tagName === "BR") { flush(); return; }
    const style = getComputedStyle(node);
    const block = ["DIV", "P", "LI"].includes(node.tagName) || ["block", "flex", "grid", "list-item"].includes(style.display);
    if (block) flush();
    const background = hexColor(style.backgroundColor);
    const effectiveBackground = background === "FFFFFF" ? undefined : background || inheritedBackground;
    for (const child of Array.from(node.childNodes)) visit(child, effectiveBackground);
    if (block) flush();
  };
  for (const child of Array.from(editor.childNodes)) {
    const start = paragraphs.length;
    visit(child);
    flush();
    if (child instanceof HTMLElement && child.hasAttribute("data-item-id")) {
      for (let index = start; index < paragraphs.length - 1; index++) paragraphs[index].keepWithNext = true;
    }
  }
  flush();
  return { title: title.replace(/\.[^.]+$/, "") + " — QuizFlow", paragraphs };
}
import { normalizeAnswerDecorations } from "./answer-editor";
import { orderItemSections } from "./harvest-editor";


/** Decode independently of lazy/offscreen DOM images before either export path. */
export async function prepareExportDocument(editor: HTMLElement, title: string, onProgress?: (done: number, total: number) => void): Promise<ExportDocument> {
  // T-121: the export follows the editor order, so old drafts are put in master-template order first.
  orderItemSections(editor);
  const snapshot = snapshotDocument(editor, title);
  const prepared = new Map<string, ExportRun>();
  // T-119: report image preparation so the export control can show real progress.
  const totalImages = snapshot.paragraphs.reduce((sum, paragraph) => sum + paragraph.runs.filter(run => run.image).length, 0);
  let doneImages = 0;
  onProgress?.(0, totalImages);
  for (const paragraph of snapshot.paragraphs) {
    for (const run of paragraph.runs) {
      if (!run.image) continue;
      onProgress?.(++doneImages, totalImages);
      const displayScale = run.displayScale ?? 1;
      delete run.displayScale;
      const cacheKey = `${run.image}|${displayScale}`;
      const cached = prepared.get(cacheKey);
      if (cached) { Object.assign(run, cached); continue; }
      const source = run.image;
      const image = new Image();
      image.crossOrigin = "anonymous";
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        image.src = source;
        await Promise.race([
          image.decode(),
          new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error("timeout")), 15000); }),
        ]);
        if (!image.naturalWidth || !image.naturalHeight) throw new Error("empty image");
        if (!/^data:image\/(png|jpeg|gif);base64,/.test(source)) {
          if (image.naturalWidth * image.naturalHeight > 24000000) throw new Error("image too large");
          const canvas = document.createElement("canvas");
          canvas.width = image.naturalWidth;
          canvas.height = image.naturalHeight;
          const context = canvas.getContext("2d");
          if (!context) throw new Error("canvas unavailable");
          context.drawImage(image, 0, 0);
          run.image = canvas.toDataURL("image/png");
        }
        const scale = Math.min(1, MAX_EXPORT_IMAGE_WIDTH / image.naturalWidth, 800 / image.naturalHeight) * displayScale;
        run.width = image.naturalWidth * scale;
        run.height = image.naturalHeight * scale;
        prepared.set(cacheKey, { image: run.image, width: run.width, height: run.height });
      } catch {
        throw new Error("อ่านรูปภาพสำหรับส่งออกไม่ได้ กรุณาตรวจรูปหรือจับภาพใหม่ก่อนส่งออก");
      } finally { clearTimeout(timer); }
    }
  }
  return snapshot;
}
