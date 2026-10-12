import { NextRequest, NextResponse } from "next/server";
import { cookieOptions, DRIVE_SCOPE, equalState, googleConfig, oauthClient, openCookie, sealCookie, SESSION_COOKIE, STATE_COOKIE } from "@/lib/google-auth";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  const config = googleConfig();
  const response = NextResponse.redirect(new URL("/?google=failed", config.appUrl));
  response.cookies.set(STATE_COOKIE, "", cookieOptions(0));
  response.headers.set("Cache-Control", "no-store");
  const failed = (reason: string) => {
    response.headers.set("location", new URL(`/?google=failed&reason=${reason}`, config.appUrl).toString());
    return response;
  };
  try {
    const transaction = openCookie(request.cookies.get(STATE_COOKIE)?.value, STATE_COOKIE) as {state?: string; verifier?: string; expires?: number} | null;
    const state = request.nextUrl.searchParams.get("state") || "";
    const code = request.nextUrl.searchParams.get("code");
    if (request.nextUrl.searchParams.has("error")) return failed("cancelled");
    if (!transaction || typeof transaction.state !== "string" || typeof transaction.verifier !== "string") return failed("missing_state");
    if (!transaction.expires || transaction.expires < Date.now()) return failed("expired");
    if (!equalState(state, transaction.state) || !code) return failed("invalid_state");
    const { tokens } = await oauthClient().getToken({ code, codeVerifier: transaction.verifier });
    if (!tokens.access_token || !tokens.expiry_date || !tokens.scope?.split(" ").includes(DRIVE_SCOPE)) return failed("missing_scope");
    response.headers.set("location", new URL("/?google=connected", config.appUrl).toString());
    response.cookies.set(SESSION_COOKIE, sealCookie({ token: tokens.access_token, expires: tokens.expiry_date }, SESSION_COOKIE), cookieOptions(Math.max(1, Math.floor((tokens.expiry_date - Date.now()) / 1000))));
    return response;
  } catch { return failed("exchange_failed"); }
}
