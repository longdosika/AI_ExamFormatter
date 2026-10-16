import { NextRequest, NextResponse } from "next/server";
import { createExportDocx, EXPORT_LIMIT, validateExportDocument } from "@/lib/google-export";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const fail = (error: string, status: number) => NextResponse.json({ error }, { status });
  const origin = `${new URL(request.url).protocol}//${request.headers.get("host")}`;
  if (request.headers.get("origin") !== origin) return fail("คำขอส่งออกไม่ถูกต้อง", 403);
  if (!request.headers.get("content-type")?.startsWith("application/json")) return fail("รูปแบบคำขอไม่ถูกต้อง", 415);
  const reader = request.body?.getReader();
  if (!reader) return fail("ไม่พบเอกสาร", 400);
  try {
    const chunks: Uint8Array[] = [];
    let length = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > EXPORT_LIMIT) { await reader.cancel(); return fail("เอกสารใหญ่เกิน 8 MB กรุณาแบ่งชุดข้อสอบ", 413); }
      chunks.push(value);
    }
    const document: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    validateExportDocument(document);
    const bytes = await createExportDocx(document);
    return new NextResponse(new Uint8Array(bytes), { headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": "attachment; filename=exam.docx",
      "Cache-Control": "no-store",
    } });
  } catch (error) { return fail(error instanceof Error ? error.message : "ส่งออกไม่สำเร็จ", 400); }
  finally { reader.releaseLock(); }
}
