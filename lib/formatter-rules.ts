/**
 * Master Technical Specification & Style Constitution
 * Official QuizFlow Template Compliant Target:
 * https://docs.google.com/document/d/1uA8A1Q1lXCDIGRPtgBA0H77xYoMWCoo7thp5Hi0nvBQ/edit?tab=t.0
 */

export const FORMATTER_CONSTANTS = {
  // Supreme Template Reference
  TEMPLATE_URL: "https://docs.google.com/document/d/1uA8A1Q1lXCDIGRPtgBA0H77xYoMWCoo7thp5Hi0nvBQ/edit?tab=t.0",
  
  // Typography
  FONT_SIZE_PT: 12,
  FONT_FAMILY: "Sarabun, sans-serif",

  // Color Palette
  COLOR_ORANGE: "#F2604D", // Unified Tone Orange (Question Numbers, Asterisks, [รูปโจทย์])
  COLOR_TEAL: "#006D77",   // Stormy Teal (Headers: ตัวเลือก:, คำอธิบาย:, โจทย์ร่วม)
  COLOR_BLACK: "#000000",  // Pure Black (Body text)

  // Dual-Color Answer Shading
  SHADING_GREEN: "#E6F4EA",  // Source provided correct answer
  SHADING_YELLOW: "#FFF4CC", // AI auto-solved correct answer

  // Labels
  LABEL_CHOICES: "ตัวเลือก:",
  LABEL_EXPLANATION: "คำอธิบาย:",
  LABEL_QUESTION_IMAGE: "[รูปโจทย์]",
  LABEL_SHARED_START: "โจทย์ร่วม",
  LABEL_SHARED_END: "จบโจทย์ร่วม",
};

export interface ChoiceItem {
  key: string; // "ก", "ข", "ค", "ง"
  text: string;
  isCorrect: boolean;
  shadingType?: "source_provided" | "auto_solved" | "none";
}

export interface ExamItem {
  id: number;
  questionNumber: number;
  /** Page in the original document used to produce this item. */
  sourcePage?: number;
  questionText: string;
  imageUrl?: string;
  imageLabel?: string;
  imageStatus?: "CLEAN" | "DIRTY";
  choices: ChoiceItem[];
  explanationText: string;
  reconciledAnswerKey?: string;
  reconciliationProvenance?: "source_asterisk" | "reconciled_from_explanation" | "source_vision" | "auto_solved" | "unresolved";
  sourceAnswerEvidence?: { page: number; confidence: number; evidence: string; bbox: number[]; model: string };
}

/**
 * Standardize choice key (ก-ง, A-D, 1-4) to Thai ก-ง key
 */
export function normalizeChoiceKey(rawKey: string): string {
  const clean = rawKey.trim().toUpperCase();
  const mapping: Record<string, string> = {
    "1": "ก", "A": "ก", "ก": "ก",
    "2": "ข", "B": "ข", "ข": "ข",
    "3": "ค", "C": "ค", "ค": "ค",
    "4": "ง", "D": "ง", "ง": "ง",
    "5": "จ", "E": "จ", "จ": "จ",
  };
  return mapping[clean] || clean;
}

