import { NextRequest, NextResponse } from "next/server";
import { assertSameOrigin, getGoogleSession, SESSION_COOKIE } from "@/lib/google-auth";
import { EXPORT_LIMIT, uploadGoogleDocument, validateExportDocument } from "@/lib/google-export";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
export async function POST(request: NextRequest) {
  const json = (value: object, status: number) => NextResponse.json(value, { status, headers: { "Cache-Control": "no-store" } });
  try { assertSameOrigin(request); } catch { return json({error: "คำขอส่งออกไม่ถูกต้อง"}, 403); }
  const session = getGoogleSession(request.cookies.get(SESSION_COOKIE)?.value);
  if (!session) return json({error: "กรุณาเชื่อมบัญชี Google ก่อนส่งออก"}, 401);
  if (!request.headers.get("content-type")?.startsWith("application/json")) return json({error: "รูปแบบคำขอไม่ถูกต้อง"}, 415);
  // Bound actual streamed bytes even when Content-Length is absent or dishonest.
  const reader = request.body?.getReader();
  if (!reader) return json({error: "ไม่พบเอกสาร"}, 400);
  const chunks: Uint8Array[] = []; let length = 0;
  try {
    for (;;) {
      const {done, value} = await reader.read(); if (done) break;
      length += value.byteLength;
      if (length > EXPORT_LIMIT) { await reader.cancel(); return json({error: "เอกสารใหญ่เกิน 8 MB กรุณาแบ่งชุดข้อสอบ"}, 413); }
      chunks.push(value);
    }
    const document: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    validateExportDocument(document);
    const result = await uploadGoogleDocument(document, session.token);
    return json(result, 200);
  } catch (error) { return json({error: error instanceof Error ? error.message : "ส่งออกไม่สำเร็จ กรุณาตรวจ Drive ก่อนลองใหม่"}, 400); }
  finally { reader.releaseLock(); }
}
