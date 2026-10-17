import { stripCapturedTableText } from "./exam-parser";

/** Remove recognized duplicate lines without replacing styled narrative DOM or media. */
export function cleanCapturedTableElement(element: HTMLElement): boolean {
  let text = "";
  const segments: { node: Text | HTMLBRElement; start: number; end: number }[] = [];
  const visit = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const start = text.length;
      text += node.textContent || "";
      segments.push({ node: node as Text, start, end: text.length });
    } else if (node instanceof HTMLBRElement) {
      segments.push({ node, start: text.length, end: text.length + 1 });
      text += "\n";
    } else {
      const block = node !== element && node instanceof HTMLElement && /^(DIV|P|TR|LI)$/.test(node.tagName);
      if (block && text && !text.endsWith("\n")) text += "\n";
      node.childNodes.forEach(visit);
      if (block && !text.endsWith("\n")) text += "\n";
    }
  };
  visit(element);
  const kept = new Set(stripCapturedTableText(text).split("\n").map(line => line.trim()));
  const removed: { start: number; end: number }[] = [];
  for (const match of text.matchAll(/[^\n]+(?:\n|$)/g)) {
    if (match[0].trim() && !kept.has(match[0].trim())) removed.push({ start: match.index!, end: match.index! + match[0].length });
  }
  for (const segment of segments.reverse()) {
    for (const range of removed.slice().reverse()) {
      const start = Math.max(segment.start, range.start), end = Math.min(segment.end, range.end);
      if (end <= start) continue;
      if (segment.node instanceof HTMLBRElement) segment.node.remove();
      else segment.node.deleteData(start - segment.start, end - start);
    }
  }
  return removed.length > 0;
}

export function cleanCapturedTables(editor: HTMLElement): boolean {
  let changed = false;
  editor.querySelectorAll<HTMLElement>("[data-shared-context-block]").forEach(block => {
    const text = block.querySelector<HTMLElement>("[data-shared-text], .whitespace-pre-line");
    if (text && block.querySelector("[data-shared-image] img")) changed = cleanCapturedTableElement(text) || changed;
  });
  editor.querySelectorAll<HTMLElement>("[data-item-id]").forEach(item => {
    const text = item.querySelector<HTMLElement>("[data-question-text], :scope > div:not([data-shared-context-block]) > span.font-light");
    if (text && item.querySelector("[data-question-image] img")) changed = cleanCapturedTableElement(text) || changed;
  });
  return changed;
}
