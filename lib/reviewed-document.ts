import { parseExamText } from "./exam-parser";
import { validateExamItems } from "./exam-validation";

/** Reuse only an exact, explicitly reviewed source; never fuzzy-match names. */
export function readReviewedDocument(value: unknown, sourceHash: string, pageCount: number) {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (!/^[a-f0-9]{64}$/.test(sourceHash) || record.schemaVersion !== 1 || record.sourceHash !== sourceHash ||
      record.sourcePageCount !== pageCount || record.reviewMethod !== "visual_source_comparison" ||
      typeof record.text !== "string" || typeof record.reviewer !== "string" || !record.reviewer.trim()) return null;
  const items = parseExamText(record.text);
  if (items.length !== record.questionCount || validateExamItems(items).length ||
      items.some(item => !item.sourcePage || item.sourcePage < 1 || item.sourcePage > pageCount)) return null;
  return { text: record.text, items: items.map(item => ({...item, imageStatus: item.imageUrl ? "CLEAN" as const : undefined})) };
}
