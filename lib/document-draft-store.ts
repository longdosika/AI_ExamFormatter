import { ExamItem } from "./formatter-rules";

export interface DocumentDraft {
  id: string;
  docKey: string;
  fileName: string;
  fileBytes: number;
  sourceHash?: string | null;
  updatedAt: string;
  ocrText?: string;
  formattedItems?: ExamItem[];
  diagramsHarvested?: boolean;
  itemCount: number;
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
  input: Omit<DocumentDraft, "id" | "updatedAt" | "docKey"> & { id?: string; updatedAt?: string; docKey?: string }
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
    formattedItems: Array.isArray(input.formattedItems) ? input.formattedItems : [],
    diagramsHarvested: Boolean(input.diagramsHarvested),
    itemCount: Array.isArray(input.formattedItems) && input.formattedItems.length > 0 
      ? input.formattedItems.length 
      : (input.itemCount || 0),
  };

  // Remove any previous draft with the same docKey
  const remaining = existing.filter(d => d.docKey !== docKey && d.id !== id);
  const updatedList = [newDraft, ...remaining].slice(0, MAX_STORED_DRAFTS);

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
          const minimalDraft: DocumentDraft = { ...newDraft, formattedItems: [] };
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
