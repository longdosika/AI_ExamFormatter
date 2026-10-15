import { NextRequest, NextResponse } from "next/server";
import { solveExamAnswers } from "@/lib/ai-answer-service";
import type { SourceQuestion } from "@/lib/source-answer-service";

export const runtime = "nodejs";
export const maxDuration = 60;

function validQuestions(questions: unknown): questions is SourceQuestion[] {
  return Array.isArray(questions) && questions.length > 0 && questions.length <= 100 &&
    questions.every((q: SourceQuestion) => q && Number.isInteger(q.id) && Number.isInteger(q.questionNumber) &&
      typeof q.questionText === "string" && q.questionText.length <= 10000 && Array.isArray(q.keys) && q.keys.length > 0 && q.keys.length <= 5 &&
      q.keys.every(k => typeof k === "string" && /^[ก-จ]$/.test(k))) &&
    new Set((questions as SourceQuestion[]).map(q => q.id)).size === questions.length;
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) return NextResponse.json({ error: "Origin rejected" }, { status: 403 });
  try {
    if (Number(request.headers.get("content-length")) > 13_000_000) return NextResponse.json({ error: "ข้อมูลใหญ่เกินกำหนด" }, { status: 413 });
    const body = await request.json();
    const { image, questions, page } = body;
    if ((image !== undefined && typeof image !== "string") || (typeof image === "string" && image.length > 12_000_000) ||
      !validQuestions(questions) || (page !== undefined && (!Number.isInteger(page) || page < 1))) {
      return NextResponse.json({ error: "ข้อมูลข้อสอบไม่ถูกต้อง" }, { status: 400 });
    }
    return NextResponse.json(await solveExamAnswers(questions, image, page));
  } catch (error) {
    const code = error instanceof Error ? error.message : "FAILED";
    const status = code === "GEMINI_NOT_CONFIGURED" ? 503 : code === "GEMINI_BUSY" ? 429 : code.startsWith("INVALID_") ? 400 : 502;
    return NextResponse.json({ error: code === "GEMINI_NOT_CONFIGURED" ? "ตั้งค่า GEMINI_API_KEY แล้วเริ่มเซิร์ฟเวอร์ใหม่" : code === "GEMINI_BUSY" ? "กำลังวิเคราะห์ข้อสอบอื่น กรุณาลองใหม่" : "วิเคราะห์เฉลยจาก AI ไม่สำเร็จ กรุณาตรวจโควตาหรือการเชื่อมต่อ", code: /^GEMINI_HTTP_\d+$/.test(code) ? code : undefined }, { status });
  }
}
