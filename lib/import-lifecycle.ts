export interface ImportOptions {
  signal?: AbortSignal;
  /** Maximum cumulative decoded PDF pixels retained during one import. */
  maxDecodedPixels?: number;
}

export function throwIfImportAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw new DOMException("ยกเลิกการนำเข้าแล้ว", "AbortError");
}

/** Release URLs owned by a discarded import, without revoking remote/data URLs. */
export function revokeParsedFileUrls(result?: { fileUrl?: string } | null): void {
  if (result?.fileUrl?.startsWith("blob:")) URL.revokeObjectURL(result.fileUrl);
}
