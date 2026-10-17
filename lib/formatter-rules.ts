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

  // Answer origin colors
  SHADING_GREEN: "#E6F4EA",  // Source provided correct answer
  SHADING_YELLOW: "#FFF4CC", // AI auto-solved correct answer
  SHADING_BLUE: "#E3EFFA",   // User-entered or corrected answer

  // Labels
  LABEL_CHOICES: "ตัวเลือก:",
  LABEL_EXPLANATION: "คำอธิบาย:",
  LABEL_QUESTION_IMAGE: "[รูปโจทย์]",
  LABEL_SHARED_START: "โจทย์ร่วม",
  LABEL_SHARED_END: "จบโจทย์ร่วม",
};

export const THAI_CHOICE_KEYS = ["ก", "ข", "ค", "ง", "จ"];

export function hasCompleteChoiceKeys(keys: (string | undefined)[]): boolean {
  return (keys.length === 4 || keys.length === 5) && new Set(keys).size === keys.length &&
    THAI_CHOICE_KEYS.slice(0, keys.length).every(key => keys.includes(key));
}

export interface ChoiceItem {
  key: string; // ก..ง or ก..จ
  text: string;
  isCorrect: boolean;
  shadingType?: "source_provided" | "auto_solved" | "manual" | "none";
  imageUrl?: string;
  imageStatus?: "CLEAN" | "DIRTY" | "UNVERIFIED";
  sourceBbox?: [number, number, number, number];
  /** T-121: the key was restored from an OCR misread ("4." for ง, "À." for ก, a lost key); compare with the original. */
  keyInferred?: boolean;
}

/** T-131: one question figure (รูปโจทย์) and the source box it was cropped from. */
export interface QuestionFigure { url: string; bbox?: [number, number, number, number] }

export interface ExamItem {
  id: number;
  questionNumber: number;
  /** Page in the original document used to produce this item. */
  sourcePage?: number;
  questionText: string;
  imageUrl?: string;
  imageLabel?: string;
  imageStatus?: "CLEAN" | "DIRTY" | "UNVERIFIED";
  imageBbox?: [number, number, number, number];
  /**
   * T-131: every question figure of the item, in source order (row by row, left to right). imageUrl/imageBbox
   * stay the first entry so single-figure readers keep working.
   */
  questionImages?: QuestionFigure[];
  sharedContextImageBbox?: [number, number, number, number];
  explanationImageBbox?: [number, number, number, number];
  choices: ChoiceItem[];
  explanationText: string;
  explanationImageUrl?: string;
  reconciledAnswerKey?: string;
  /** T-126: all correct keys when a question has more than one (reconciledAnswerKey stays the first). */
  reconciledAnswerKeys?: string[];
  reconciliationProvenance?: "source_asterisk" | "reconciled_from_explanation" | "source_vision" | "ai_generated" | "auto_solved" | "manual" | "unresolved";
  sourceAnswerEvidence?: { page: number; confidence: number; evidence: string; bbox: number[]; model: string };
  // Shared context properties (โจทย์ร่วม)
  sharedContextText?: string;
  sharedContextRange?: { start: number; end: number };
  sharedContextImageUrl?: string;
  isSharedContextStart?: boolean;
  isSharedContextEnd?: boolean;
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


/** T-131: an item's question figures (falls back to the single imageUrl of older items and drafts). */
export function questionFigures(item: Pick<ExamItem, "questionImages" | "imageUrl" | "imageBbox">): QuestionFigure[] {
  if (item.questionImages?.length) return item.questionImages;
  return item.imageUrl ? [{ url: item.imageUrl, bbox: item.imageBbox }] : [];
}

/**
 * T-131: order figures as printed: rows top to bottom, left to right inside a row. Two boxes are on one row
 * when they share at least half of the shorter box's height (รูปที่ 1|2 above รูปที่ 3|4).
 */
export function sortFiguresBySource<T extends { bbox?: [number, number, number, number] }>(figures: T[]): T[] {
  const sameRow = (a: [number, number, number, number], b: [number, number, number, number]) =>
    Math.min(a[2], b[2]) - Math.max(a[0], b[0]) >= 0.5 * Math.min(a[2] - a[0], b[2] - b[0]);
  return figures.map((figure, index) => ({ figure, index })).sort((x, y) => {
    const a = x.figure.bbox, b = y.figure.bbox;
    if (!a || !b) return x.index - y.index;
    return sameRow(a, b) ? a[1] - b[1] || x.index - y.index : a[0] - b[0];
  }).map(entry => entry.figure);
}
