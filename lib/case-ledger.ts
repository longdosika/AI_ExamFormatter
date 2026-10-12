export interface CaseDecisionEntry {
  id: string;
  topic: string;
  sourceFile: string; // ลิงก์ / ชื่อไฟล์ที่พบปัญหา
  problemDescription: string; // ปัญหาที่พบ
  decisionTaken: string; // เราตัดสินใจอย่างไร / เหตุผล
  outputResult: string; // ผลลัพธ์ที่ระบบสร้าง
  timestamp: string; // วันเวลาที่บันทึก
  status: "RESOLVED" | "NEEDS_REVIEW";
}

export const CASE_STORAGE_KEY = "ai-exam-formatter.case-decisions.v1";
type CaseStorage = Pick<Storage, "getItem" | "setItem">;

export function validateCaseEntries(value: unknown): value is CaseDecisionEntry[] {
  if (!Array.isArray(value)) return false;
  const ids = new Set<string>();
  return value.every((entry) => {
    if (!entry || typeof entry !== "object") return false;
    const fields = ["id", "topic", "sourceFile", "problemDescription", "decisionTaken", "outputResult", "timestamp"];
    if (!fields.every((field) => typeof entry[field] === "string" && entry[field].trim().length > 0)) return false;
    if (ids.has(entry.id) || !["RESOLVED", "NEEDS_REVIEW"].includes(entry.status)) return false;
    ids.add(entry.id);
    return true;
  });
}

export function loadCaseEntries(storage: CaseStorage): CaseDecisionEntry[] {
  const raw = storage.getItem(CASE_STORAGE_KEY);
  if (raw === null) return [...INITIAL_CASE_DECISIONS];
  const data: unknown = JSON.parse(raw);
  if (!data || typeof data !== "object" || !("version" in data) || data.version !== 1 ||
      !("entries" in data) || !validateCaseEntries(data.entries)) {
    throw new Error("Invalid case ledger data");
  }
  return data.entries;
}

export function saveCaseEntries(storage: CaseStorage, entries: CaseDecisionEntry[]): void {
  if (!validateCaseEntries(entries)) throw new Error("Invalid case ledger entries");
  storage.setItem(CASE_STORAGE_KEY, JSON.stringify({ version: 1, entries }));
}

export const INITIAL_CASE_DECISIONS: CaseDecisionEntry[] = [
  {
    id: "CASE-001",
    topic: "Image Crop & Perimeter Sweeping",
    sourceFile: "references/image-crop-and-conversion-rules.md (exam-chemistry-01.pdf)",
    problemDescription: "การ Crop รูปตาราง/แผนภาพแนบชิดเกินไป ทำให้เส้นขอบตารางถูกตัดขาด หรือมีข้อความโจทย์ข้างเคียงหลุดเข้ามาในรูป",
    decisionTaken: "ใช้ 4-Side Perimeter Sweeping: สแกนพิกเซลขอบ 4 ด้าน (Grayscale >= 245) ขยาย Canvas สีขาวบริสุทธิ์ออก 4px รอบวัตถุ",
    outputResult: "ได้รูปภาพขอบตารางสมบูรณ์ ไม่ถูกตัดขาด ขอบสีขาวบริสุทธิ์ 4px พร้อมสถานะ status=CLEAN 100%",
    timestamp: "2026-10-10 18:40",
    status: "RESOLVED",
  },
  {
    id: "CASE-002",
    topic: "Master Answer Key Auto-Reconciliation",
    sourceFile: "references/lessons-learned.md (exam-biology-set2.docx)",
    problemDescription: "ดอกจันเฉลยในโจทย์พิมพ์ผิดตำแหน่ง (พิมพ์ดอกจันที่ข้อ ข.) แต่ข้อความคำอธิบายระบุว่า 'เฉลย: ตอบ ข้อ ก.'",
    decisionTaken: "ใช้ Master Answer Key Reconciliation Guard สแกนข้อความคำอธิบายเป็นสรณะ ย้ายเฉลยไปที่ข้อ ก. และบันทึก provenance=reconciled_from_explanation",
    outputResult: "ปุ่มเฉลยถูกปรับเป็น ข้อ ก. สีเขียวไฮไลท์ (#E6F4EA) ตรงกับข้อความคำอธิบาย 100%",
    timestamp: "2026-10-10 18:58",
    status: "RESOLVED",
  },
  {
    id: "CASE-003",
    topic: "Multi-Set Restart Parser & Nested Number Guard",
    sourceFile: "references/lessons-learned.md (exam-large-suite.docx)",
    problemDescription: "เอกสารชุดใหญ่มักแบ่งเป็น 'ชุดที่ 1' และ 'ชุดที่ 2' ตัว Parser ทั่วไปจะเข้าใจผิดว่าข้อ 1 ของชุดที่ 2 เป็นเนื้อหาของข้อ 50 ในชุดแรก หรือตัดเลขข้อในคำอธิบายเป็นข้อใหม่",
    decisionTaken: "ใช้ State Machine และ Section Reset Detector (/^\\s*(?:ชุด|ตอน|แบบทดสอบ|ข้อสอบ)/i) เพื่อรีเซ็ตลำดับเลขข้อเป็น 0 เมื่อพบหัวข้อใหม่",
    outputResult: "แยกชุดข้อสอบได้อย่างถูกต้อง ไม่เกิด Phantom Error Items ในระบบ",
    timestamp: "2026-10-10 19:14",
    status: "RESOLVED",
  },
];
