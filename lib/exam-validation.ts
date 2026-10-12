import { ExamItem } from "./formatter-rules";

/** Structural checks do not certify OCR spelling or infer missing source content. */
export function validateExamItems(items: ExamItem[]): string[] {
  if (!items.length) return ["ไม่พบหมายเลขข้อสอบ ตรวจแก้เลขข้อและข้อความโจทย์ก่อนแปลง"];
  const issues: string[] = [];
  const seen = new Set<number>();
  for (const item of items) {
    const label = `ข้อ ${item.questionNumber}`;
    if (seen.has(item.questionNumber)) issues.push(`${label}: หมายเลขซ้ำ`);
    seen.add(item.questionNumber);
    if (!item.questionText.trim()) issues.push(`${label}: ไม่มีข้อความโจทย์`);
    const keys = item.choices.map(choice => choice.key);
    if (keys.length !== 4 || new Set(keys).size !== 4 || !["ก", "ข", "ค", "ง"].every(key => keys.includes(key))) {
      issues.push(`${label}: ต้องมีตัวเลือก ก ข ค ง ครบและไม่ซ้ำ (พบ ${keys.join(" ") || "ไม่มี"})`);
    }
    if (item.choices.some(choice => !choice.text.trim())) issues.push(`${label}: ตัวเลือกว่าง`);
    if (!item.imageUrl && /\[รูปต้องตรวจสอบ\]|จากรูป|จากแผนภาพ/.test(item.questionText)) {
      issues.push(`${label}: โจทย์อ้างถึงรูป แต่ยังไม่มีรูปต้นฉบับที่ผูกกับข้อนี้`);
    }
    if (/<table\b|\[ตาราง\]|\[UNCERTAIN\]|[☒]|(?:^|\s)X[.)]/i.test(item.questionText + item.choices.map(choice => choice.text).join(" "))) {
      issues.push(`${label}: มีตารางหรือข้อความที่ยังอ่านไม่แน่นอน ต้องตรวจเทียบต้นฉบับ`);
    }
  }
  return issues;
}
