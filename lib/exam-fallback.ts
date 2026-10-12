import { ExamItem, FORMATTER_CONSTANTS } from "./formatter-rules";
import { ParsedFileResult } from "./file-parser";

/**
 * Generate neutral starter ExamItems when automatic parser returns empty.
 * (e.g. Scanned PDF, image-only documents, or unsupported text encoding).
 * Never fabrics fake questions or false answers from different exams.
 * Allows the user to view the original source document on the left,
 * use the magnifier glass, snip/crop images, and edit/type questions on the right.
 */
export function generateFallbackExamItems(result: ParsedFileResult, count?: number): ExamItem[] {
  // Count based on pages or provide at least 25 starter question slots for standard exam sets
  const pageCount = result.pageImages?.length || (result.extractedImages?.length || 1);
  const totalCount = count && count > 0 ? count : Math.max(pageCount * 4, 25);

  return Array.from({ length: totalCount }, (_, idx) => {
    const qNum = idx + 1;
    const img = result.extension !== ".pdf" ? result.extractedImages?.[idx]?.dataUrl : undefined;
    return {
      id: qNum,
      questionNumber: qNum,
      questionText: `ข้อที่ ${qNum} (พิมพ์ข้อความโจทย์ หรือแคปภาพจากเอกสารฝั่งซ้าย)`,
      choices: [
        { key: "ก", text: "ตัวเลือก ก", isCorrect: false, shadingType: "none" as const },
        { key: "ข", text: "ตัวเลือก ข", isCorrect: false, shadingType: "none" as const },
        { key: "ค", text: "ตัวเลือก ค", isCorrect: false, shadingType: "none" as const },
        { key: "ง", text: "ตัวเลือก ง", isCorrect: false, shadingType: "none" as const },
      ],
      explanationText: "",
      reconciliationProvenance: "unresolved" as const,
      imageUrl: img,
      imageLabel: img ? FORMATTER_CONSTANTS.LABEL_QUESTION_IMAGE : undefined,
      imageStatus: img ? "DIRTY" as const : undefined,
    };
  });
}
