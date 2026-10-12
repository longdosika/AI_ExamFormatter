export interface ExportRun { text?: string; bold?: boolean; italic?: boolean; underline?: boolean; color?: string; image?: string; width?: number; height?: number }
export interface ExportParagraph { runs: ExportRun[]; background?: string; keepWithNext?: boolean }
export interface ExportDocument { title: string; paragraphs: ExportParagraph[] }

function hexColor(value: string): string | undefined {
  const rgb = value.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/);
  if (!rgb || (rgb[4] !== undefined && Number(rgb[4]) === 0)) return undefined;
  return rgb.slice(1, 4).map(n => Number(n).toString(16).padStart(2, "0")).join("").toUpperCase();
}

/** Snapshot the live edited DOM; never reconstruct it from stale parsed items. */
export function snapshotDocument(editor: HTMLElement, title: string): ExportDocument {
  const paragraphs: ExportParagraph[] = [];
  let current: ExportParagraph = { runs: [] };
  const flush = () => { if (current.runs.length) paragraphs.push(current); current = { runs: [] }; };
  const visit = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || "";
      if (!text) return;
      const parent = node.parentElement;
      const style = parent ? getComputedStyle(parent) : null;
      current.runs.push({ text, bold: Number(style?.fontWeight) >= 600, italic: style?.fontStyle === "italic", underline: style?.textDecorationLine.includes("underline"), color: style ? hexColor(style.color) : undefined });
      return;
    }
    if (!(node instanceof HTMLElement) || node.matches('[data-export-ignore],script,style,button,svg')) return;
    if (node instanceof HTMLImageElement) {
      const sourceWidth = node.naturalWidth || node.width || 500;
      const sourceHeight = node.naturalHeight || node.height || 300;
      const width = Math.min(sourceWidth, 600);
      current.runs.push({ image: node.src, width, height: sourceHeight * width / sourceWidth });
      return;
    }
    if (node.tagName === "BR") { flush(); return; }
    const style = getComputedStyle(node);
    const block = ["block", "flex", "grid", "list-item"].includes(style.display);
    if (block) flush();
    const background = hexColor(style.backgroundColor);
    const inherited = current.background;
    if (background && background !== "FFFFFF") current.background = background;
    for (const child of Array.from(node.childNodes)) visit(child);
    if (block) flush();
    else if (inherited) current.background = inherited;
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
