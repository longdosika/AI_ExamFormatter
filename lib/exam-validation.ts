import { mergedChoicePattern } from "./exam-parser";
import { ExamItem, hasCompleteChoiceKeys, THAI_CHOICE_KEYS } from "./formatter-rules";

export const referencesFigure = (text: string): boolean => /ตาราง|ดังรูป|ในภาพ|จากรูป|จากภาพ|แผนภาพ|(?:จาก|เขียน|แสดง|เป็น)กราฟ|กราฟ(?:ดัง|ต่อไป|ที่|แสดง)/.test(text);

/** Structural checks do not certify OCR spelling or infer missing source content. */
export function validateExamItems(items: ExamItem[]): string[] {
  if (!items.length) return ["ไม่พบหมายเลขข้อสอบ ตรวจแก้เลขข้อและข้อความโจทย์ก่อนแปลง"];
  const issues: string[] = [];
  const seen = new Set<number>();
  items.forEach((item, index) => {
    const label = `ข้อ ${item.questionNumber}`;
    const previous = items[index - 1];
    // T-121 (B-09): name the likely OCR cause of a repeated or backwards number.
    const looksLikeLostChoice = previous && !item.choices.length && previous.choices.length === 3 ? " (อาจเป็นตัวเลือก ง. ของข้อก่อนหน้าที่ OCR อ่านเป็นเลข ใช้ปุ่มรวมเป็นตัวเลือก)" : "";
    if (seen.has(item.questionNumber)) issues.push(`${label}: หมายเลขซ้ำ${looksLikeLostChoice}`);
    else if (previous && item.questionNumber < previous.questionNumber) issues.push(`${label}: เลขข้อย้อนหลังจากข้อ ${previous.questionNumber}${looksLikeLostChoice}`);
    // T-121 (B-29): skipped numbers usually mean a question merged into its neighbour.
    if (previous && item.questionNumber > previous.questionNumber + 1 && item.questionNumber - previous.questionNumber <= 5) {
      const missing = Array.from({ length: item.questionNumber - previous.questionNumber - 1 }, (_, offset) => previous.questionNumber + offset + 1);
      issues.push(`${label}: ไม่พบข้อ ${missing.join(", ")} (เลขข้ามจากข้อ ${previous.questionNumber})`);
    }
    seen.add(item.questionNumber);
    if (!item.questionText.trim()) issues.push(`${label}: ไม่มีข้อความโจทย์`);
    const keys = item.choices.map(choice => choice.key);
    if (!hasCompleteChoiceKeys(keys)) {
      issues.push(`${label}: ต้องมีตัวเลือก ก ข ค ง หรือ ก ข ค ง จ ครบและไม่ซ้ำ (พบ ${keys.join(" ") || "ไม่มี"})`);
    }
    if (item.choices.some(choice => !choice.text.trim() && !choice.imageUrl)) issues.push(`${label}: ตัวเลือกว่าง`);
    // T-121: keys restored from an OCR misread are correct by position but must be checked against the original.
    const inferred = item.choices.filter(choice => choice.keyInferred).map(choice => choice.key);
    if (inferred.length) issues.push(`${label}: ตัวเลือก ${inferred.join(" ")} กู้คืนจาก OCR ที่อ่านตัวอักษรตัวเลือกผิด โปรดเทียบต้นฉบับ`);
    // T-119: name the likely cause when a missing key appears inside the previous choice.
    for (const choice of item.choices) {
      const nextKey = THAI_CHOICE_KEYS[THAI_CHOICE_KEYS.indexOf(choice.key) + 1];
      if (nextKey && !keys.includes(nextKey) && mergedChoicePattern(nextKey).test(choice.text)) {
        issues.push(`${label}: ตัวเลือก ${choice.key} อาจมีตัวเลือก ${nextKey} รวมอยู่ ใช้ปุ่มแยกตัวเลือก`);
      }
    }
    if (!item.imageUrl && !item.sharedContextImageUrl && /\[รูปต้องตรวจสอบ\]|จากรูป|จากภาพ|จากแผนภาพ|จากตาราง|ตารางแสดง|\[ตาราง\]/.test(item.questionText)) {
      issues.push(`${label}: โจทย์อ้างถึงตาราง/รูป แต่ยังไม่มีรูปต้นฉบับที่ผูกกับข้อนี้`);
    }
    if (/<table\b|\[ตาราง\]|\[UNCERTAIN\]|[☒]|(?:^|\s)X[.)]/i.test(item.questionText + item.choices.map(choice => choice.text).join(" "))) {
      issues.push(`${label}: มีตารางหรือข้อความที่ยังอ่านไม่แน่นอน ต้องตรวจเทียบต้นฉบับ`);
    }
  });
  return issues;
}
