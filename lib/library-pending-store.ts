import type { ParsedFileResult } from "./file-parser";

export interface PendingLibraryOutput {
  file: Pick<ParsedFileResult, "fileName" | "sourceBlob" | "sourceHash">;
  bytes: Blob; name: string; version: string;
}

function pendingStore<T>(mode: IDBTransactionMode, work: (store: IDBObjectStore, result: (value: T) => void) => void): Promise<T> {
  return new Promise((resolve, reject) => {
    let db: IDBDatabase | undefined, transaction: IDBTransaction | undefined, result: T, settled = false;
    const finish = (error?: unknown) => {
      if (settled) return;
      settled = true; clearTimeout(timer); db?.close();
      if (error) reject(error); else resolve(result);
    };
    const timer = setTimeout(() => { transaction?.abort(); finish(new Error("เปิดคิวคลังไม่ได้")); }, 8000);
    try {
      const open = indexedDB.open("exam-formatter-library-pending-v1", 1);
      open.onupgradeneeded = () => open.result.createObjectStore("outputs", { keyPath: "version" });
      open.onerror = () => finish(open.error);
      open.onblocked = () => finish(new Error("คิวคลังถูกใช้โดยแท็บอื่น"));
      open.onsuccess = () => {
        db = open.result;
        if (settled) { db.close(); return; }
        db.onversionchange = () => db?.close();
        try {
          transaction = db.transaction("outputs", mode);
          transaction.oncomplete = () => finish();
          transaction.onerror = transaction.onabort = () => finish(transaction?.error || new Error("เก็บคิวคลังไม่ได้"));
          work(transaction.objectStore("outputs"), value => { result = value; });
        } catch (error) { finish(error); }
      };
    } catch (error) { finish(error); }
  });
}
export const readPendingOutputs = () => pendingStore<PendingLibraryOutput[]>("readonly", (store, result) => { const request = store.getAll(); request.onsuccess = () => result(request.result); });
export const putPendingOutput = (entry: PendingLibraryOutput) => pendingStore<void>("readwrite", store => { store.put(entry); });
export const removePendingOutput = (version: string) => pendingStore<void>("readwrite", store => { store.delete(version); });
