export interface OcrSuggestion { from: string; to: string }
/** Suggestions only: these can be legitimate words in other contexts. Never rewrite source/OCR automatically. */
export function suggestOcrWords(text: string): OcrSuggestion[] {
  const result: OcrSuggestion[] = [];
  if (/สถาน(?!ะ|ที่|ศึกษา|การณ์|ภาพ)/u.test(text)) result.push({ from: "สถาน", to: "สถานะ" });
  if (text.includes("ละลายนำ")) result.push({ from: "ละลายนำ", to: "ละลายน้ำ" });
  if (text.includes("ละลายนา")) result.push({ from: "ละลายนา", to: "ละลายน้ำ" });
  if (text.includes("น่ามันเบนซิน")) result.push({ from: "น่ามันเบนซิน", to: "น้ำมันเบนซิน" });
  if (text.includes("ของเทค")) result.push({ from: "ของเทค", to: "ของเหลว" });
  if (text.includes("R₁₂")) result.push({ from: "R₁₂", to: "Rf" });
  return result;
}
