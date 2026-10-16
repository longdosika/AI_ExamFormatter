import type { ParsedFileResult } from "./file-parser";
import { makeDocKey, type DocumentDraft } from "./document-draft-store";

const DATABASE = "exam-formatter-originals-v1";
const STORE = "sources";
interface SourceEntry { key: string; savedAt: number; source: Omit<ParsedFileResult, "fileUrl"> }

export function sourceMatchesDraft(source: ParsedFileResult, draft: Pick<DocumentDraft, "fileName" | "fileBytes" | "sourceHash">) {
  if (source.fileName !== draft.fileName || source.fileSize !== draft.fileBytes) return false;
  return !draft.sourceHash || source.sourceHash === draft.sourceHash;
}

function withSources<T>(mode: IDBTransactionMode, work: (store: IDBObjectStore, result: (value: T) => void) => void): Promise<T> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") { reject(new Error("ไม่สามารถเข้าถึงที่เก็บไฟล์ต้นฉบับในเบราว์เซอร์")); return; }
    let db: IDBDatabase | undefined;
    let transaction: IDBTransaction | undefined;
    let value: T;
    let settled = false;
    const finish = (error?: unknown) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      db?.close();
      if (error) reject(error); else resolve(value);
    };
    const timer = setTimeout(() => { transaction?.abort(); finish(new Error("เปิดที่เก็บต้นฉบับไม่สำเร็จ")); }, 8000);
    let request: IDBOpenDBRequest;
    try { request = indexedDB.open(DATABASE, 1); }
    catch (error) { finish(error); return; }
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: "key" });
    request.onerror = () => finish(request.error || new Error("เปิดที่เก็บต้นฉบับไม่ได้"));
    request.onblocked = () => finish(new Error("ที่เก็บต้นฉบับถูกใช้งานโดยแท็บอื่น"));
    request.onsuccess = () => {
      db = request.result;
      if (settled) { db.close(); return; }
      db.onversionchange = () => db?.close();
      try {
        transaction = db.transaction(STORE, mode);
        transaction.oncomplete = () => finish();
        transaction.onabort = () => finish(transaction?.error || new Error("บันทึกต้นฉบับไม่ได้"));
        transaction.onerror = () => finish(transaction?.error || new Error("อ่านต้นฉบับไม่ได้"));
        work(transaction.objectStore(STORE), result => { value = result; });
      } catch (error) { finish(error); }
    };
  });
}

export function saveOriginalSource(source: ParsedFileResult, key = makeDocKey(source.fileName, source.fileSize, source.sourceHash)): Promise<void> {
  const { fileUrl: _fileUrl, ...stored } = source;
  return withSources<void>("readwrite", (store, result) => {
    store.put({ key, savedAt: Date.now(), source: { ...stored, rawContent: source.originalText ?? source.rawContent } } satisfies SourceEntry);
    result(undefined);
  });
}

export async function loadOriginalSource(draft: DocumentDraft): Promise<ParsedFileResult | null> {
  const entry = await withSources<SourceEntry | undefined>("readonly", (store, result) => {
    const request = store.get(draft.docKey);
    request.onsuccess = () => result(request.result);
  });
  if (!entry || !sourceMatchesDraft(entry.source, draft)) return null;
  const source = entry.source;
  return { ...source, fileUrl: source.sourceBlob ? URL.createObjectURL(source.sourceBlob) : undefined };
}

export function deleteOriginalSource(key?: string): Promise<void> {
  return withSources<void>("readwrite", (store, result) => {
    if (key) store.delete(key); else store.clear();
    result(undefined);
  });
}
