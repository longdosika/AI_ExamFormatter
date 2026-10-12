export const IMPORT_HISTORY_KEY = "exam-formatter-import-history-v1";
export interface ImportHistoryEntry { id: string; fileName: string; importedAt: string; fileBytes: number }
type StoragePort = Pick<Storage, "getItem" | "setItem">;
export function readImportHistory(storage: StoragePort): ImportHistoryEntry[] {
  const raw = storage.getItem(IMPORT_HISTORY_KEY);
  if (!raw) return [];
  const value = JSON.parse(raw);
  if (value.schemaVersion !== 1 || !Array.isArray(value.entries) || !value.entries.every((entry: ImportHistoryEntry) =>
    entry && typeof entry.id === "string" && typeof entry.fileName === "string" && entry.fileName.length <= 256 &&
    typeof entry.importedAt === "string" && Number.isFinite(Date.parse(entry.importedAt)) &&
    Number.isFinite(entry.fileBytes) && entry.fileBytes >= 0)) throw new Error("อ่านประวัติเดิมไม่ได้ ข้อมูลยังไม่ถูกลบ");
  return value.entries;
}
export function recordImport(storage: StoragePort, entry: ImportHistoryEntry): void {
  const entries = readImportHistory(storage);
  storage.setItem(IMPORT_HISTORY_KEY, JSON.stringify({schemaVersion:1,entries:[entry,...entries].slice(0,100)}));
}
