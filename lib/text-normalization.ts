/**
 * Conservative repairs for Thai OCR text.
 *
 * These rules remove whitespace that OCR inserts inside a Thai grapheme. They
 * intentionally do not join ordinary word spaces or invent text for unknown
 * replacement characters; unresolved corruption remains visible for review.
 */
export const TEXT_REPAIRS: Readonly<Record<string, string>> = {
  "เป ็ น": "เป็น",
  "ป ี": "ปี",
  "ฝ ึ ก": "ฝึก",
  "น้้า": "น้ำ",
  "เอท เนอล": "เอทานอล",
  "ครึ่ ง": "ครึ่ง",
  "ปู ่": "ปู่",
  "ไม ่ใช่": "ไม่ใช่",
  "ค ํา": "คำ",
  "ทุจริ ต": "ทุจริต",
};

export function normalizeThaiOcrText(text: string): string {
  let normalized = text;
  // Apply exact known corruptions before dynamic passes can change their
  // shape (for example `เป ็ น` becomes `เป็ น` after one pass).
  for (const [broken, repaired] of Object.entries(TEXT_REPAIRS)) {
    normalized = normalized.split(broken).join(repaired);
  }
  // OCR may place more than one whitespace character between a consonant and
  // its mark. Three passes also repair stacked combinations after each pass.
  for (let pass = 0; pass < 3; pass += 1) {
    normalized = normalized
      .replace(/([ก-ฮ])\s+([่-๋์็ัิ-ืุ-ู])/g, "$1$2")
      .replace(/([เแโใไ])\s+([ก-ฮ])/g, "$1$2")
      .replace(/([ก-ฮ][ัิ-ืุ-ู])\s+([่-๋์])/g, "$1$2")
      .replace(/([ก-ฮ])\s+(ำ)/g, "$1$2");
  }
  for (const [broken, repaired] of Object.entries(TEXT_REPAIRS)) {
    normalized = normalized.split(broken).join(repaired);
  }

  // OCR may decompose sara-am around its tone mark; never join across lines.
  normalized = normalized.replace(/([ก-ฮ][่-๋]?)ํ([่-๋]?)า/g, "$1$2ำ");

  // Repair detached punctuation for enumeration numbers and choice letters:
  // e.g. "1 . " -> "1. ", "ข้อ 1 . " -> "ข้อ 1. ", "ก . " -> "ก. ", "1 ) " -> "1) "
  normalized = normalized.replace(/(^|[\s\n(])(\d+|[ก-จA-Ea-e])\s+([.)])(?=\s|$)/gm, "$1$2$3");

  return normalized;
}

