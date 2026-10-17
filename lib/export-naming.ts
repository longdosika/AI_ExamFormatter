/** T-128: export stamp yymmdd-hhmm in Thai time, the same form as build stamps (2026-10-17 14:30 -> 261017-1430). */
export function exportStamp(now = new Date()) {
  const thai = new Date(now.getTime() + 7 * 3600 * 1000), pad = (value: number) => String(value).padStart(2, "0");
  return `${String(thai.getUTCFullYear()).slice(-2)}${pad(thai.getUTCMonth() + 1)}${pad(thai.getUTCDate())}-${pad(thai.getUTCHours())}${pad(thai.getUTCMinutes())}`;
}

/** File name without its extension ("บทที่ 7.pdf" -> "บทที่ 7"). */
export const baseName = (name: string) => name.replace(/\.[^.]+$/, "");

/** T-128: name of an export (DOCX download, Drive DOCX, Google Doc): "[original filename]_[yymmdd-hhmm]". */
export const exportName = (sourceName: string, now = new Date()) => `${baseName(sourceName)}_${exportStamp(now)}`;
