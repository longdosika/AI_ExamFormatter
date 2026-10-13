import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { OAuth2Client } from "google-auth-library";

export const SESSION_COOKIE = "quizflow_google";
export const STATE_COOKIE = "quizflow_google_state";
export const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";
export interface GoogleSession { token: string; expires: number }
export function googleConfig() {
  const rawUrl = (process.env.APP_URL || "http://localhost:3000").trim().replace(/\/+$/, "");
  const url = new URL(rawUrl);
  if (url.origin !== rawUrl || (url.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(url.hostname))) throw new Error("APP_URL ต้องเป็น origin HTTPS หรือ localhost");
  const appUrl = rawUrl;
  const clientId = (process.env.GOOGLE_CLIENT_ID || "").trim();
  const clientSecret = (process.env.GOOGLE_CLIENT_SECRET || "").trim();
  const sessionSecret = (process.env.GOOGLE_SESSION_SECRET || "").trim();
  const apiKey = (process.env.GOOGLE_PICKER_API_KEY || "").trim();
  const projectNumber = (process.env.GOOGLE_CLOUD_PROJECT_NUMBER || "").trim();

  const missingFields: string[] = [];
  if (!clientId) missingFields.push("GOOGLE_CLIENT_ID");
  if (!clientSecret) missingFields.push("GOOGLE_CLIENT_SECRET");
  if (!sessionSecret) missingFields.push("GOOGLE_SESSION_SECRET");
  else if (sessionSecret.length < 32) missingFields.push("GOOGLE_SESSION_SECRET (ต้องยาวอย่างน้อย 32 ตัวอักษร)");
  if (!apiKey) missingFields.push("GOOGLE_PICKER_API_KEY");
  if (!projectNumber) missingFields.push("GOOGLE_CLOUD_PROJECT_NUMBER");
  else if (!/^\d+$/.test(projectNumber)) missingFields.push("GOOGLE_CLOUD_PROJECT_NUMBER (ต้องเป็นตัวเลขล้วน ไม่ใช่ Project ID)");

  return {
    appUrl,
    clientId,
    clientSecret,
    sessionSecret,
    apiKey,
    projectNumber,
    ready: missingFields.length === 0,
    missingFields,
    secure: url.protocol === "https:"
  };
}
function key() {
  const secret = googleConfig().sessionSecret;
  if (secret.length < 32) throw new Error("ยังไม่ได้ตั้งค่าการเชื่อม Google");
  return createHash("sha256").update(secret).digest();
}
export function sealCookie(value: object, purpose: string): string {
  const iv = randomBytes(12), cipher = createCipheriv("aes-256-gcm", key(), iv);
  cipher.setAAD(Buffer.from(purpose));
  const bytes = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), bytes]).toString("base64url");
}
export function openCookie(value: string | undefined, purpose: string): unknown {
  if (!value || value.length > 4000) return null;
  try {
    const bytes = Buffer.from(value, "base64url");
    const decipher = createDecipheriv("aes-256-gcm", key(), bytes.subarray(0, 12));
    decipher.setAAD(Buffer.from(purpose)); decipher.setAuthTag(bytes.subarray(12, 28));
    return JSON.parse(Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]).toString("utf8"));
  } catch { return null; }
}
export function getGoogleSession(value: string | undefined): GoogleSession | null {
  const session = openCookie(value, SESSION_COOKIE) as GoogleSession | null;
  return session && typeof session.token === "string" && session.token.length > 0 && Number.isFinite(session.expires) && session.expires > Date.now() + 30000 ? session : null;
}
export function cookieOptions(maxAge: number) { return { httpOnly: true, sameSite: "lax" as const, secure: googleConfig().secure, path: "/", maxAge }; }
export function assertSameOrigin(request: Request): void {
  if (request.headers.get("origin") !== googleConfig().appUrl) throw new Error("คำขอนี้ไม่ได้มาจากเว็บแอป");
}
export function oauthClient() {
  const config = googleConfig();
  if (!config.ready) throw new Error("ยังไม่ได้ตั้งค่าการเชื่อม Google");
  return new OAuth2Client(config.clientId, config.clientSecret, `${config.appUrl}/api/google/callback`);
}
export function canonicalAuthRedirect(requestUrl: string): string | null {
  const appUrl = googleConfig().appUrl;
  return new URL(requestUrl).origin === appUrl ? null : `${appUrl}/api/google/auth`;
}
export function equalState(left: string, right: string) {
  const a = Buffer.from(left), b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}
