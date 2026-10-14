import { NextRequest, NextResponse } from "next/server";
import { analyzePageDiagrams, QuestionContext } from "@/lib/diagram-service";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Origin rejected" }, { status: 403 });
  }

  try {
    if (Number(request.headers.get("content-length")) > 13_000_000) {
      return NextResponse.json({ error: "ภาพใหญ่เกินกำหนด" }, { status: 413 });
    }

    const { image, questions, page } = await request.json();
    if (
      typeof image !== "string" ||
      image.length > 12_000_000 ||
      !Number.isInteger(page) ||
      page < 1 ||
      (questions !== undefined && !Array.isArray(questions))
    ) {
      return NextResponse.json({ error: "ข้อมูลหน้าและรูปภาพไม่ถูกต้อง" }, { status: 400 });
    }

    const safeQuestions: QuestionContext[] = Array.isArray(questions)
      ? questions.filter((q: unknown): q is QuestionContext =>
          Boolean(q && typeof q === "object" && typeof (q as QuestionContext).questionNumber === "number")
        )
      : [];

    const result = await analyzePageDiagrams(image, page, safeQuestions);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const code = error instanceof Error ? error.message : "FAILED";
    const status =
      code === "GEMINI_NOT_CONFIGURED"
        ? 503
        : code === "GEMINI_BUSY"
        ? 429
        : code.startsWith("INVALID_")
        ? 400
        : 502;

    return NextResponse.json(
      {
        success: false,
        error:
          code === "GEMINI_NOT_CONFIGURED"
            ? "กรุณาตั้งค่า GEMINI_API_KEY เพื่อเปิดใช้งานระบบสกัดรูปประกอบอัตโนมัติ"
            : code === "GEMINI_BUSY"
            ? "ระบบกำลังสกัดรูปภาพหน้าอื่นอยู่ กรุณารอสักครู่"
            : "สกัดรูปภาพประกอบไม่สำเร็จ กรุณาตรวจโควตาหรือการเชื่อมต่ออินเทอร์เน็ต",
        code: /^GEMINI_HTTP_\d+$/.test(code) ? code : undefined,
      },
      { status }
    );
  }
}
