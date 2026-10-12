import { NextRequest, NextResponse } from "next/server";
import { processImagesOcr } from "@/lib/ocr-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const images: string[] = body.images || (body.image ? [body.image] : []);

    if (!Array.isArray(images) || !images.length || images.some(image => typeof image !== "string" || !image.trim())) {
      return NextResponse.json(
        { success: false, error: "ไม่พบรูปภาพสำหรับทำ OCR" },
        { status: 400 }
      );
    }

    if (images.length > 10) {
      return NextResponse.json({ success: false, error: "รองรับครั้งละไม่เกิน 10 หน้า กรุณาแบ่งเอกสารก่อนนำเข้า" }, { status: 400 });
    }
    const pageResults = await processImagesOcr(images);

    const validTexts = pageResults.filter(p => p.text).map(p => `[PAGE ${p.page}]\n${p.text}`);
    const allPagesSuccess = pageResults.every(p => p.success && Boolean(p.text));
    const fullText = validTexts.join("\n\n").trim();

    const uncertainCount = (fullText.match(/\[UNCERTAIN\]/gi) || []).length;
    // Typhoon sometimes returns faithful Markdown numbered questions instead of
    // the requested markers. Count both forms; parser validation still happens
    // in the client before data is shown as converted.
    const questionMarkers = (fullText.match(/\[QUESTION\s+\d+\]/gi) || []).length ||
      (fullText.match(/^\s*(?:\*\*)?\d+[.)](?:\*\*)?/gm) || []).length;
    return NextResponse.json({
      success: validTexts.length > 0,
      text: fullText,
      pageCount: images.length,
      processedCount: validTexts.length,
      allPagesSuccess,
      questionMarkers,
      uncertainCount,
      quality: allPagesSuccess && questionMarkers > 0 && uncertainCount === 0 ? "ready" : "needs_review",
      pageResults: pageResults.map(({ page, success, error, modelUsed }) => ({ page, success, error, modelUsed })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการประมวลผล OCR";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
