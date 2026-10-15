import { ExamItem } from "./formatter-rules";
import type { SourceAnswer } from "./source-answer-service";
import type { SourceQuestion } from "./source-answer-service";

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

/** Solve only questions that remain unresolved after source-mark extraction. */
export async function solveUnresolvedAnswers(items: ExamItem[], images: string[], current: () => boolean, progress: (page: number, total: number) => void) {
  let count = 0;
  const failures: number[] = [];
  const groups = new Map<number, ExamItem[]>();
  for (const item of items) {
    if (item.reconciledAnswerKey || !item.choices.length) continue;
    const page = item.sourcePage || 1;
    const group = groups.get(page) || [];
    group.push(item);
    groups.set(page, group);
  }
  const pages = [...groups.keys()].sort((a, b) => a - b);
  for (const page of pages) {
    if (!current()) return { count, failures };
    const group = groups.get(page) || [];
    const questions: SourceQuestion[] = group.map(item => ({ id: item.id, questionNumber: item.questionNumber, questionText: item.questionText, keys: item.choices.map(choice => choice.key) }));
    progress(page, pages.length);
    let result: { answers?: Array<{ id: number; key: string; confidence: number; evidence: string }>; model?: string } | null = null;
    try {
      for (let attempt = 0; attempt < 2; attempt++) {
        if (!current()) return { count, failures };
        const image = images[page - 1];
        const response = await fetch("/api/ai-answers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image, questions, page }), signal: AbortSignal.timeout(100_000) });
        const body = await response.json();
        if (response.ok) { result = body; break; }
        if (body.code === "GEMINI_HTTP_429") throw new Error("Google Gemini ถึงขีดจำกัดโควตา กรุณาตรวจ Usage / Rate limits ใน AI Studio ก่อนลองใหม่");
        if (!attempt && (body.code === "GEMINI_HTTP_503" || response.status === 429)) { await new Promise(resolve => setTimeout(resolve, 1500)); continue; }
        if (response.status === 503) throw new Error(body.error);
        break;
      }
    } catch (error) {
      if (error instanceof Error && /GEMINI_API_KEY|โควตา/.test(error.message)) throw error;
    }
    if (!current()) return { count, failures };
    if (!result) { failures.push(page); continue; }
    for (const answer of result.answers || []) {
      const item = items.find(candidate => candidate.id === answer.id);
      if (!item || item.reconciledAnswerKey || !item.choices.some(choice => choice.key === answer.key)) continue;
      item.reconciledAnswerKey = answer.key;
      item.reconciliationProvenance = "ai_generated";
      item.sourceAnswerEvidence = { page: item.sourcePage || page, confidence: answer.confidence, evidence: answer.evidence, bbox: [], model: result.model || "AI" };
      item.choices.forEach(choice => { choice.isCorrect = choice.key === answer.key; choice.shadingType = choice.isCorrect ? "auto_solved" : "none"; });
      count++;
    }
  }
  return { count, failures };
}
