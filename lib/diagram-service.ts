export interface DetectedDiagram {
  id: string;
  type: "question" | "shared_context" | "choice" | "explanation";
  questionNumber?: number;
  choiceKey?: string;
  description: string;
  bbox: [number, number, number, number]; // [ymin, xmin, ymax, xmax] normalized 0..1000
  page: number;
  confidence: number;
}

export interface QuestionContext {
  questionNumber: number;
  stem: string;
}

export function validateDetectedDiagrams(value: unknown, page: number): DetectedDiagram[] {
  if (!Array.isArray(value)) return [];
  const valid: DetectedDiagram[] = [];
  const choiceMap: Record<string, string> = {
    "1": "ก", "2": "ข", "3": "ค", "4": "ง", "5": "จ",
    "a": "ก", "b": "ข", "c": "ค", "d": "ง", "e": "จ",
    "ก": "ก", "ข": "ข", "ค": "ค", "ง": "ง", "จ": "จ",
  };

  for (let index = 0; index < value.length; index++) {
    const row = value[index];
    if (!row || typeof row !== "object") continue;
    const type = String((row as any).type || "").toLowerCase();
    if (!["question", "shared_context", "choice", "explanation"].includes(type)) continue;

    let rawBbox = (row as any).bbox;
    if (Array.isArray(rawBbox) && rawBbox.length === 1 && Array.isArray(rawBbox[0])) {
      rawBbox = rawBbox[0];
    }
    if (!Array.isArray(rawBbox) || rawBbox.length !== 4) continue;
    const [ymin, xmin, ymax, xmax] = rawBbox.map((n: unknown) => Number(n));
    if (!Number.isFinite(ymin) || !Number.isFinite(xmin) || !Number.isFinite(ymax) || !Number.isFinite(xmax)) continue;
    if (ymin < 0 || xmin < 0 || ymax > 1000 || xmax > 1000 || ymin >= ymax || xmin >= xmax) continue;

    const qNum = typeof (row as any).questionNumber === "number" && (row as any).questionNumber > 0 ? (row as any).questionNumber : undefined;
    let choiceKey = typeof (row as any).choiceKey === "string" ? String((row as any).choiceKey).trim() : undefined;
    if (choiceKey) {
      choiceKey = choiceMap[choiceKey.toLowerCase()] || choiceKey;
    }
    const description = typeof (row as any).description === "string" && (row as any).description.trim() ? (row as any).description.trim() : "ภาพประกอบโจทย์";

    valid.push({
      id: `diag-p${page}-${index + 1}`,
      type: type as DetectedDiagram["type"],
      questionNumber: qNum,
      choiceKey,
      description,
      bbox: [ymin, xmin, ymax, xmax],
      page,
      confidence: typeof (row as any).confidence === "number" && (row as any).confidence >= 0 && (row as any).confidence <= 1 ? (row as any).confidence : 0.9,
    });
  }
  return valid;
}

import { executeWithKeyRotation } from "./api-key-manager";

let activeDiagramScan = false;

const CANDIDATE_MODELS = [
  process.env.GEMINI_ANSWER_MODEL,
  "gemini-flash-lite-latest",
  "gemini-3.5-flash",
  "gemini-3.6-flash",
  "gemini-3.8-flash",
].filter((m): m is string => Boolean(m && typeof m === "string"));

export async function analyzePageDiagrams(
  image: string,
  page: number,
  questions: QuestionContext[] = []
): Promise<{ diagrams: DetectedDiagram[]; model: string; keyIndex?: number }> {
  if (activeDiagramScan) throw new Error("GEMINI_BUSY");

  const match = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/.exec(image);
  if (!match || image.length > 12_000_000) throw new Error("INVALID_IMAGE");

  activeDiagramScan = true;
  try {
    const systemPrompt = `You are an expert Thai examination visual diagram and table extractor.
Analyze this Thai exam page image and detect ALL figures, apparatus diagrams, data tables, framed boxes (ตารางโจทย์ หรือ กรอบปิดสี่เหลี่ยม), experiment illustrations, and choice diagrams.

CRITICAL INSTRUCTIONS:
1. CHOICE DIAGRAMS / MULTI-OPTION FIGURES:
   When choices (1, 2, 3, 4 or ก, ข, ค, ง) contain individual images or illustrations (e.g. crystal shapes, circuit diagrams, geometric forms):
   - You MUST extract EACH choice image as a separate item with type: "choice".
   - Set "choiceKey": "ก" (for choice 1), "ข" (for choice 2), "ค" (for choice 3), "ง" (for choice 4).
   - "questionNumber": the question number (e.g. 16).
   - "bbox": [ymin, xmin, ymax, xmax] tightly enclosing ONLY that specific choice's image (not the choice number text).
   - DO NOT combine all choices into one single question box!

2. DATA TABLES & SHARED CONTEXT FIGURES (ตารางข้อมูล และ โจทย์ร่วม):
   - When a table or diagram is used for multiple questions (e.g. "ใช้ข้อมูลในตารางต่อไปนี้ตอบคำถามข้อ 17-18" or "ใช้รูปต่อไปนี้ตอบคำถามข้อ 28-29"):
   - Set type: "shared_context".
   - "questionNumber": the FIRST question number in the range (e.g. 17).
   - "bbox": [ymin, xmin, ymax, xmax] MUST enclose the 100% COMPLETE TABLE with ALL outer borders and headers:
     * TOP: Must start safely ABOVE the topmost horizontal border line, completely enclosing table column headers (e.g. 'สาร', 'ผลการทดลอง', 'ชนิดสาร', 'ปริมาณ', etc.). NEVER slice into or below the header row!
     * BOTTOM: Must extend safely BELOW the bottommost horizontal border line.
     * SIDES: Must encompass both outer left and right vertical border strokes with a safe margin.


3. QUESTION FIGURES (รูปโจทย์):
   - Single question prompt illustrations or apparatus diagrams: type: "question", "questionNumber": integer.
   - MANDATORY INCLUSIVITY FOR LABELS & CALLOUTS:
     For science apparatus, diagrams, experiments, charts, and chemical/physical setups (e.g. distillation flasks, test tubes, pulleys, circuits, biological specimens) that have text labels, annotations, callout pointers, or leader lines around them (e.g. 'เทอร์มอมิเตอร์', 'คอลัมน์ที่ใช้แยก', 'ของเหลวที่นำมาแยก', 'ทางน้ำออก', 'ควบแน่น', 'ทางน้ำเข้า', 'ของเหลวที่แยกได้'):
     You MUST enclose the ENTIRE figure INCLUDING ALL associated text labels, pointer lines, and annotations on ALL 4 SIDES (top, bottom, left, right).
     DO NOT tightly crop only the central glassware/drawing and cut off the surrounding descriptive Thai text labels! Ensure the bbox bounds safely encompass all peripheral callouts belonging to the apparatus.

4. EXPLANATION FIGURES:
   - Figures inside solution or explanation blocks: type: "explanation".

Questions on this page: ${JSON.stringify(questions.map(q => ({ no: q.questionNumber, stem: q.stem.slice(0, 100) })))}

Return JSON: {"diagrams": [ {"type": "question"|"shared_context"|"choice"|"explanation", "questionNumber": number, "choiceKey": "ก"|"ข"|"ค"|"ง"|null, "description": string, "bbox": [ymin, xmin, ymax, xmax]} ]}. If no visual diagrams, return {"diagrams": []}.`;

    const rotation = await executeWithKeyRotation("gemini", async (key, keyIdx, totalKeys) => {
      let lastError: Error | null = null;
      for (const model of CANDIDATE_MODELS) {
        try {
          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-goog-api-key": key },
            signal: AbortSignal.timeout(90_000),
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: systemPrompt }] },
              contents: [
                {
                  role: "user",
                  parts: [
                    { text: `Page ${page}: Identify all diagrams, data tables, and choice figures.` },
                    { inlineData: { mimeType: `image/${match[1]}`, data: match[2] } }
                  ]
                }
              ],
              generationConfig: {
                temperature: 0,
                responseMimeType: "application/json",
                maxOutputTokens: 4096,
              }
            })
          });

          if (response.status === 429 || response.status === 503 || response.status === 404) {
            lastError = new Error(`GEMINI_HTTP_${response.status}`);
            continue; // Try next model in cascade
          }
          if (!response.ok) throw new Error(`GEMINI_HTTP_${response.status}`);

          const result = await response.json();
          const text = result.candidates?.[0]?.content?.parts
            ?.filter((part: { text?: string; thought?: boolean }) => part.text && !part.thought)
            ?.map((part: { text: string }) => part.text)
            ?.join("");

          if (!text) throw new Error("GEMINI_EMPTY_RESPONSE");
          const parsed = JSON.parse(text);
          return { diagrams: validateDetectedDiagrams(parsed.diagrams, page), model, keyIndex: keyIdx, totalKeys };
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err));
        }
      }

      throw lastError || new Error("ALL_MODELS_FAILED");
    });

    return rotation.result;
  } finally {
    activeDiagramScan = false;
  }
}
