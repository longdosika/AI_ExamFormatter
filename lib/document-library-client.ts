import type { ParsedFileResult } from "./file-parser";
import type { LibraryFile } from "./drive-library";
export type { LibraryFile } from "./drive-library";
export async function libraryRequest(path = "", init?: RequestInit) {
  const response = await fetch(`/api/google/library${path}`, { ...init, cache: "no-store" });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "ทำรายการคลังไม่สำเร็จ");
  return result;
}
export async function saveLibrarySource(file: Pick<ParsedFileResult, "sourceBlob" | "sourceHash" | "fileName">): Promise<{ collection: LibraryFile; source: LibraryFile }> {
  if (!file.sourceBlob || !file.sourceHash) throw new Error("ยังไม่มีไฟล์ต้นฉบับครบ กรุณาแนบไฟล์เดิมก่อนเก็บในคลัง Drive");
  return libraryRequest("", { method: "POST", headers: { "X-Library-Action": "source", "X-File-Name": encodeURIComponent(file.fileName), "X-Source-Hash": file.sourceHash }, body: file.sourceBlob });
}
export async function saveLibraryOutput(collectionId: string, bytes: Blob, name: string, versionId: string): Promise<{ output: LibraryFile; folder: string }> {
  return libraryRequest("", { method: "POST", headers: { "X-Library-Action": "output", "X-Collection-Id": collectionId, "X-File-Name": encodeURIComponent(name), "X-Version-Id": versionId }, body: bytes });
}
export function libraryLink(file?: LibraryFile | null) {
  if (!file?.webViewLink) return undefined;
  try { const url = new URL(file.webViewLink); return url.protocol === "https:" && ["drive.google.com", "docs.google.com"].includes(url.hostname) ? url.href : undefined; } catch { return undefined; }
}
