import { ExamItem } from "./formatter-rules";
import type { OcrTextRegion } from "./capture-geometry";

export interface DocumentDraft {
  id: string;
  docKey: string;
  fileName: string;
  fileBytes: number;
  sourceHash?: string | null;
  updatedAt: string;
  ocrText?: string;
  ocrTextRegions?: OcrTextRegion[][];
  formattedItems?: ExamItem[];
  editorHtml?: string;
  diagramsHarvested?: boolean;
  /** T-128: last successful export (DOCX download or Google Docs). */
  exportedAt?: string;
  itemCount: number;
  sourceItemCount?: number;
}

export const DRAFT_STORAGE_KEY = "exam-formatter-document-drafts-v1";
export const MAX_STORED_DRAFTS = 15;

export type StoragePort = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function makeDocKey(fileName: string, fileBytes: number, sourceHash?: string | null): string {
  const cleanName = (fileName || "").trim().toLowerCase();
  if (sourceHash && sourceHash.trim()) {
    return `${cleanName}-${fileBytes}-${sourceHash.trim()}`;
  }
  return `${cleanName}-${fileBytes}`;
}

export function validateDraftEntry(value: unknown): value is DocumentDraft {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    v.id.length > 0 &&
    typeof v.docKey === "string" &&
    v.docKey.length > 0 &&
    typeof v.fileName === "string" &&
    v.fileName.length > 0 &&
    Number.isFinite(v.fileBytes) &&
    (v.fileBytes as number) >= 0 &&
    typeof v.updatedAt === "string" &&
    Number.isFinite(Date.parse(v.updatedAt as string)) &&
    Number.isFinite(v.itemCount) &&
    (v.itemCount as number) >= 0
  );
}

export function loadAllDrafts(storage: StoragePort): DocumentDraft[] {
  try {
    const raw = storage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (parsed.schemaVersion !== 1 || !Array.isArray(parsed.drafts)) {
      return [];
    }
    return parsed.drafts.filter(validateDraftEntry);
  } catch {
    return [];
  }
}

export function findDraftByDoc(
  storage: StoragePort,
  fileName: string,
  fileBytes: number,
  sourceHash?: string | null
): DocumentDraft | undefined {
  const targetKey = makeDocKey(fileName, fileBytes, sourceHash);
  const drafts = loadAllDrafts(storage);
  return drafts.find(d => d.docKey === targetKey);
}

export function saveDocumentDraft(
  storage: StoragePort,
  input: Omit<DocumentDraft, "id" | "updatedAt" | "docKey"> & { id?: string; updatedAt?: string; docKey?: string },
  options: { requireFullSnapshot?: boolean } = {}
): DocumentDraft {
  const existing = loadAllDrafts(storage);
  const now = new Date().toISOString();
  const id = input.id || `draft-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const docKey = input.docKey || makeDocKey(input.fileName, input.fileBytes, input.sourceHash);

  const newDraft: DocumentDraft = {
    id,
    docKey,
    fileName: input.fileName.slice(0, 256),
    fileBytes: input.fileBytes,
    sourceHash: input.sourceHash || null,
    updatedAt: input.updatedAt || now,
    ocrText: input.ocrText || "",
    ocrTextRegions: input.ocrTextRegions ?? existing.find(entry => entry.docKey === docKey)?.ocrTextRegions,
    formattedItems: Array.isArray(input.formattedItems) ? input.formattedItems : [],
    editorHtml: typeof input.editorHtml === "string" ? input.editorHtml : "",
    // T-128: saves that do not mention a step keep what the draft already reached.
    diagramsHarvested: input.diagramsHarvested ?? existing.find(entry => entry.docKey === docKey)?.diagramsHarvested ?? false,
    exportedAt: input.exportedAt ?? existing.find(entry => entry.docKey === docKey)?.exportedAt,
    itemCount: Array.isArray(input.formattedItems) && input.formattedItems.length > 0 
      ? input.formattedItems.length 
      : (input.itemCount || 0),
    sourceItemCount: input.sourceItemCount ?? existing.find(entry => entry.docKey === docKey)?.sourceItemCount,
  };

  // Remove any previous draft with the same docKey
  const remaining = existing.filter(d => d.docKey !== docKey && d.id !== id);
  const updatedList = [newDraft, ...remaining].slice(0, MAX_STORED_DRAFTS);

  if (options.requireFullSnapshot) {
    const serialized = JSON.stringify({ schemaVersion: 1, drafts: updatedList });
    storage.setItem(DRAFT_STORAGE_KEY, serialized);
    if (storage.getItem(DRAFT_STORAGE_KEY) !== serialized) throw new Error("ยังยืนยันการบันทึกแบบร่างไม่ได้");
    return newDraft;
  }

  // Write with quota protection: if localStorage is full, trim older entries
  let targetSlice = updatedList;
  while (targetSlice.length > 0) {
    try {
      storage.setItem(
        DRAFT_STORAGE_KEY,
        JSON.stringify({ schemaVersion: 1, drafts: targetSlice })
      );
      break;
    } catch {
      if (targetSlice.length <= 1) {
        // If even 1 draft can't be stored with full items, omit large formattedItems or fail silently
        try {
          const minimalDraft: DocumentDraft = { ...newDraft, formattedItems: [], editorHtml: "" };
          storage.setItem(
            DRAFT_STORAGE_KEY,
            JSON.stringify({ schemaVersion: 1, drafts: [minimalDraft] })
          );
        } catch {
          // localStorage completely full or blocked
        }
        break;
      }
      targetSlice = targetSlice.slice(0, targetSlice.length - 1);
    }
  }

  return newDraft;
}

export function deleteDocumentDraft(storage: StoragePort, idOrDocKey: string): void {
  const existing = loadAllDrafts(storage);
  const filtered = existing.filter(d => d.id !== idOrDocKey && d.docKey !== idOrDocKey);
  try {
    storage.setItem(
      DRAFT_STORAGE_KEY,
      JSON.stringify({ schemaVersion: 1, drafts: filtered })
    );
  } catch {
    // Ignore storage write failure on delete
  }
}

export function clearAllDocumentDrafts(storage: StoragePort): void {
  try {
    storage.removeItem(DRAFT_STORAGE_KEY);
  } catch {
    // Ignore storage clear failure
  }
}

/**
 * T-128: every earlier draft of this source, newest first. The SHA-256 of the file decides first, so a renamed copy
 * of a file imported before is still recognised; the old name/size key covers drafts saved without a hash.
 */
export function draftsForSource(storage: StoragePort, fileName: string, fileBytes: number, sourceHash?: string | null): DocumentDraft[] {
  const key = makeDocKey(fileName, fileBytes, sourceHash);
  return loadAllDrafts(storage)
    .filter(draft => (sourceHash && draft.sourceHash === sourceHash) || draft.docKey === key)
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}

/** T-128: record an export on the draft of this source without touching its snapshot. */
export function markDraftExported(storage: StoragePort, sourceHash: string | null | undefined, fileName: string, fileBytes: number, at = new Date().toISOString()) {
  const key = makeDocKey(fileName, fileBytes, sourceHash);
  try {
    const parsed = JSON.parse(storage.getItem(DRAFT_STORAGE_KEY) || "null");
    if (!parsed || parsed.schemaVersion !== 1 || !Array.isArray(parsed.drafts)) return false;
    let changed = false;
    for (const draft of parsed.drafts) if (draft && ((sourceHash && draft.sourceHash === sourceHash) || draft.docKey === key)) { draft.exportedAt = at; changed = true; }
    if (changed) storage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(parsed));
    return changed;
  } catch {
    return false;
  }
}

export interface DraftProgress { converted: boolean; figures: boolean; answered: number; total: number; exportedAt?: string }

/** T-128: how far a draft got: converted, figures captured, answers n/N (from the saved editor), exported. */
export function draftProgress(draft: DocumentDraft): DraftProgress {
  const total = draft.itemCount || draft.formattedItems?.length || 0;
  let answered = 0;
  if (draft.editorHtml) {
    for (const part of draft.editorHtml.split(/data-item-id="/).slice(1)) {
      if (!/data-merged-away="true"/.test(part.slice(0, 200)) && /data-answer-origin="(?:source_provided|auto_solved|manual)"/.test(part)) answered++;
    }
  } else answered = (draft.formattedItems || []).filter(item => item.choices.some(choice => choice.isCorrect)).length;
  return { converted: total > 0, figures: Boolean(draft.diagramsHarvested), answered: Math.min(answered, total || answered), total, exportedAt: draft.exportedAt };
}
