import { NextRequest, NextResponse } from "next/server";
import { assertSameOrigin, cookieOptions, getGoogleSession, googleConfig, SESSION_COOKIE } from "@/lib/google-auth";
import { checkTargetFolder, TARGET_FOLDER } from "@/lib/google-export";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const json = (value: object, status = 200) => NextResponse.json(value, { status, headers: { "Cache-Control": "no-store" } });
export async function GET(request: NextRequest) {
  try {
    const config = googleConfig();
    const session = config.ready ? getGoogleSession(request.cookies.get(SESSION_COOKIE)?.value) : null;
    const folderReady = session ? await checkTargetFolder(session.token) : false;
    return json({
      configured: config.ready,
      connected: Boolean(session),
      folderReady,
      folderId: TARGET_FOLDER,
      missingFields: config.missingFields || []
    });
  } catch (error) {
    return json({
      configured: false,
      connected: false,
      folderReady: false,
      folderId: TARGET_FOLDER,
      missingFields: [],
      error: error instanceof Error ? error.message : "การตั้งค่าไม่ถูกต้อง"
    });
  }
}
export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const session = getGoogleSession(request.cookies.get(SESSION_COOKIE)?.value);
    if (!session) return json({ error: "กรุณาเชื่อมบัญชี Google ใหม่" }, 401);
    const config = googleConfig();
    // Picker needs a short-lived token in memory; never persist it in browser storage.
    return json({ token: session.token, apiKey: config.apiKey, projectNumber: config.projectNumber, folderId: TARGET_FOLDER });
  } catch { return json({ error: "คำขอเชื่อมโฟลเดอร์ไม่ถูกต้อง" }, 403); }
}
export async function DELETE(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const response = json({ disconnected: true });
    response.cookies.set(SESSION_COOKIE, "", cookieOptions(0));
    return response;
  } catch { return json({ error: "คำขอไม่ถูกต้อง" }, 403); }
}
