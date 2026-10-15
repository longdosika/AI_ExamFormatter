import { NextRequest, NextResponse } from "next/server";
import { analyzeSourceAnswers, SourceQuestion } from "@/lib/source-answer-service";

export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) return NextResponse.json({ error: "Origin rejected" }, { status: 403 });
  try {
    if (Number(request.headers.get("content-length")) > 13_000_000) return NextResponse.json({ error: "ภาพใหญ่เกินกำหนด" }, { status: 413 });
    const { image, questions, page } = await request.json();
    if (typeof image !== "string" || image.length > 12_000_000 || !Number.isInteger(page) || page < 1 ||
      !Array.isArray(questions) || !questions.length || questions.length > 100 ||
      questions.some((q: SourceQuestion) => !q || !Number.isInteger(q.id) || !Number.isInteger(q.questionNumber) || typeof q.questionText !== "string" || q.questionText.length > 10000 || !Array.isArray(q.keys) || q.keys.length > 5 || q.keys.some(k => typeof k !== "string" || !/^[ก-จ]$/.test(k))) ||
      new Set(questions.map((q: SourceQuestion) => q.id)).size !== questions.length) {
      return NextResponse.json({ error: "ข้อมูลหน้าและข้อสอบไม่ถูกต้อง" }, { status: 400 });
    }
    return NextResponse.json(await analyzeSourceAnswers(image, questions, page));
  } catch (error) {
    const code = error instanceof Error ? error.message : "FAILED";
    const status = code === "GEMINI_NOT_CONFIGURED" ? 503 : code === "GEMINI_BUSY" ? 429 : code.startsWith("INVALID_") ? 400 : 502;
    return NextResponse.json({ error: code === "GEMINI_NOT_CONFIGURED" ? "ตั้งค่า GEMINI_API_KEY แล้วเริ่มเซิร์ฟเวอร์ใหม่" : code === "GEMINI_BUSY" ? "กำลังวิเคราะห์เอกสารอื่น กรุณาลองใหม่" : "อ่านเฉลยจาก Google ไม่สำเร็จ กรุณาตรวจโควตาหรือการเชื่อมต่อ", code: /^GEMINI_HTTP_\d+$/.test(code) ? code : undefined }, { status });
  }
}
