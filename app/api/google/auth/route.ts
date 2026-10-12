import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { canonicalAuthRedirect, cookieOptions, DRIVE_SCOPE, oauthClient, sealCookie, STATE_COOKIE } from "@/lib/google-auth";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  try {
    const canonical = canonicalAuthRedirect(request.url);
    if (canonical) {
      const response = NextResponse.redirect(canonical);
      response.headers.set("Cache-Control", "no-store");
      return response;
    }
    const client = oauthClient();
    const { codeVerifier, codeChallenge } = await client.generateCodeVerifierAsync();
    const state = randomBytes(32).toString("base64url");
    const url = client.generateAuthUrl({ scope: [DRIVE_SCOPE], state, access_type: "online", prompt: "select_account", code_challenge: codeChallenge, code_challenge_method: "S256" as never });
    const response = NextResponse.redirect(url);
    response.cookies.set(STATE_COOKIE, sealCookie({ state, verifier: codeVerifier, expires: Date.now() + 600000 }, STATE_COOKIE), cookieOptions(600));
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch { return NextResponse.json({ error: "ยังไม่ได้ตั้งค่าการเชื่อม Google กรุณาดูคู่มือ integration" }, { status: 503 }); }
}
