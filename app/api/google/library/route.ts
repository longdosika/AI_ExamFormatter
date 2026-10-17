import { NextRequest, NextResponse } from "next/server";
import { assertSameOrigin, getGoogleSession, SESSION_COOKIE } from "@/lib/google-auth";
import { driveLibrary, SOURCE_LIMIT } from "@/lib/drive-library";
import { APP_VERSION } from "@/lib/version";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;
const json = (body: object, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });

async function readBytes(request: NextRequest, limit: number) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("ไม่พบข้อมูลไฟล์");
  const chunks: Uint8Array[] = []; let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) { await reader.cancel(); throw new Error("ไฟล์ใหญ่เกินขีดจำกัดคลัง"); }
      chunks.push(value);
    }
    return Buffer.concat(chunks);
  } finally { reader.releaseLock(); }
}

export async function GET(request: NextRequest) {
  const session = getGoogleSession(request.cookies.get(SESSION_COOKIE)?.value);
  if (!session) return json({ error: "กรุณาเชื่อมบัญชี Google เพื่อเปิดคลังไฟล์" }, 401);
  try {
    const library = driveLibrary(session.token), collection = request.nextUrl.searchParams.get("collection");
    if(collection && request.nextUrl.searchParams.get("source")==="1") {
      const result=await library.readSource(collection);
      return new NextResponse(new Uint8Array(result.bytes),{headers:{"Content-Type":result.source.mimeType,"Cache-Control":"private, no-store"}});
    }
    // T-128: duplicate-import check by SHA-256 (renamed copies included).
    const hash=request.nextUrl.searchParams.get("hash");
    if(hash) return json(await library.findByHash(hash));
    const draft=request.nextUrl.searchParams.get("draft");
    return json(collection && draft ? await library.readDraft(collection,draft) : collection ? await library.details(collection) : await library.listCollections());
  } catch (error) { return json({ error: error instanceof Error ? error.message : "อ่านคลังไม่ได้" }, 400); }
}

export async function POST(request: NextRequest) {
  try { assertSameOrigin(request); } catch { return json({ error: "คำขอคลังไม่ได้มาจากแอปนี้" }, 403); }
  const session = getGoogleSession(request.cookies.get(SESSION_COOKIE)?.value);
  if (!session) return json({ error: "กรุณาเชื่อมบัญชี Google ก่อนเก็บไฟล์" }, 401);
  try {
    const library = driveLibrary(session.token), action = request.headers.get("x-library-action");
    if (action === "source") {
      const name = decodeURIComponent(request.headers.get("x-file-name") || "");
      const mime: Record<string, string> = { pdf: "application/pdf", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", doc: "application/msword", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", md: "text/markdown", html: "text/html" };
      const type = mime[name.split(".").pop()?.toLowerCase() || ""];
      if (!type) throw new Error("ชนิดไฟล์ต้นฉบับไม่รองรับ");
      return json(await library.saveSource(await readBytes(request, SOURCE_LIMIT), name, type, request.headers.get("x-source-hash") || ""));
    }
    if (action === "output") return json(await library.saveOutput(request.headers.get("x-collection-id") || "", await readBytes(request, 8 * 1024 * 1024), decodeURIComponent(request.headers.get("x-file-name") || "exam.docx"), request.headers.get("x-version-id") || "", APP_VERSION));
    if (action === "draft") return json(await library.saveDraft(request.headers.get("x-collection-id") || "",await readBytes(request,8*1024*1024),request.headers.get("x-version-id") || "",APP_VERSION));
    if (action === "import") {
      const value = JSON.parse((await readBytes(request, 4096)).toString("utf8"));
      return json({ imported: await library.confirmImport(value.collectionId, value.outputId, value.operation, value.confirmed, value.note || "") });
    }
    return json({ error: "ไม่รองรับการทำรายการนี้" }, 400);
  } catch (error) { return json({ error: error instanceof Error ? error.message : "บันทึกคลังไม่สำเร็จ" }, 400); }
}
