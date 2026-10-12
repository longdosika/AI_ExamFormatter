import { ExamItem } from "./formatter-rules";
import type { SourceAnswer } from "./source-answer-service";

/** Mutates only a fresh, unpublished parse; never resets a user's live editor. */
export async function readSourceAnswers(items: ExamItem[], images: string[], current: () => boolean, progress: (page: number) => void) {
  let count = 0;
  const failures: number[] = [];
  for (let index = 0; index < images.length; index++) {
    if (!current()) return { count, failures };
    const questions = items.filter(item => item.sourcePage === index + 1 && !item.reconciledAnswerKey && item.choices.length)
      .map(item => ({ id: item.id, questionNumber: item.questionNumber, questionText: item.questionText, keys: item.choices.map(choice => choice.key) }));
    if (!questions.length) continue;
    progress(index + 1);
    let result;
    try {
      for (let attempt = 0; attempt < 2; attempt++) {
        if (!current()) return { count, failures };
        const response = await fetch("/api/source-answers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image: images[index], questions, page: index + 1 }), signal: AbortSignal.timeout(100_000) });
        result = await response.json();
        if (response.ok) break;
        if (result.code === "GEMINI_HTTP_429") throw new Error("Google Gemini ถึงขีดจำกัดโควตา กรุณาตรวจ Usage / Rate limits ใน AI Studio ก่อนลองใหม่");
        if (!attempt && (result.code === "GEMINI_HTTP_503" || response.status === 429)) { await new Promise(resolve => setTimeout(resolve, 1500)); continue; }
        if (response.status === 503) throw new Error(result.error);
        result = null;
        break;
      }
    } catch (error) {
      if (error instanceof Error && /GEMINI_API_KEY|โควตา/.test(error.message)) throw error;
      result = null;
    }
    if (!current()) return { count, failures };
    if (!result) { failures.push(index + 1); continue; }
    for (const answer of (result.answers || []) as SourceAnswer[]) {
      const item = items.find(item => item.id === answer.id && item.sourcePage === answer.page);
      if (!item || item.reconciledAnswerKey || !item.choices.some(choice => choice.key === answer.key)) continue;
      item.reconciledAnswerKey = answer.key;
      item.reconciliationProvenance = "source_vision";
      item.sourceAnswerEvidence = { page: answer.page, confidence: answer.confidence, evidence: answer.evidence, bbox: answer.bbox, model: result.model };
      item.choices.forEach(choice => { choice.isCorrect = choice.key === answer.key; choice.shadingType = choice.isCorrect ? "source_provided" : "none"; });
      count++;
    }
  }
  return { count, failures };
}
