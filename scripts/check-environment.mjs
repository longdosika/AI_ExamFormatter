import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import os from "node:os";
import { execFileSync } from "node:child_process";
import net from "node:net";

const root = process.cwd();
const args = new Set(process.argv.slice(2));
const jsonOnly = args.has("--json");
const strict = args.has("--strict");
const skipNetwork = args.has("--skip-network");
const writeEvidence = args.has("--write-evidence");
const checks = [];

function check(id, status, message, details = undefined) {
  checks.push({ id, status, message, ...(details ? { details } : {}) });
}

function command(commandName, commandArgs = []) {
  try {
    const executable = process.platform === "win32" && commandName === "npm" ? "cmd.exe" : commandName;
    const args = process.platform === "win32" && commandName === "npm"
      ? ["/d", "/s", "/c", ["npm", ...commandArgs].join(" ")]
      : commandArgs;
    return execFileSync(executable, args, {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      windowsHide: true,
    }).trim();
  } catch {
    return "";
  }
}

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const output = {};
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    output[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
  }
  return output;
}

function redactUrl(raw) {
  try {
    const url = new URL(raw);
    url.username = "";
    url.password = "";
    url.search = "";
    url.hash = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return "invalid-url";
  }
}

function versionTuple(version) {
  const match = String(version).match(/(\d+)\.(\d+)\.(\d+)/);
  return match ? match.slice(1).map(Number) : [0, 0, 0];
}

function isAtLeast(version, major, minor) {
  const [foundMajor, foundMinor] = versionTuple(version);
  return foundMajor > major || (foundMajor === major && foundMinor >= minor);
}

function portAvailable(port, host = "127.0.0.1") {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => server.close(() => resolve(true)));
    server.listen(port, host);
  });
}

async function fetchJson(url) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(2500) });
    const body = await response.json();
    return { ok: response.ok, status: response.status, body };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

const packageJsonPath = path.join(root, "package.json");
const lockPath = path.join(root, "package-lock.json");
const envPath = path.join(root, ".env.local");
const envExamplePath = path.join(root, ".env.example");
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
const env = parseEnvFile(envPath);
const ocrBaseUrl = env.TYPHOON_OCR_BASE_URL || "https://api.opentyphoon.ai/v1";
const ocrUrl = redactUrl(ocrBaseUrl);
let networkSkipped = skipNetwork;

const nodeVersion = process.versions.node;
const npmVersion = command("npm", ["--version"]);
const gitVersion = command("git", ["--version"]);
const branch = command("git", ["branch", "--show-current"]);
const commit = command("git", ["rev-parse", "--short", "HEAD"]);
const remote = command("git", ["remote", "get-url", "origin"]).replace(/:\/\/[^/@]+:[^/@]+@/, "://***:***@");

if (isAtLeast(nodeVersion, 18, 17)) check("node", "PASS", `Node.js ${nodeVersion} meets Next.js minimum 18.17.`);
else check("node", "FAIL", `Node.js ${nodeVersion} is too old; install Node.js 18.17+ (20 or 22 LTS recommended).`);
if (npmVersion) check("npm", "PASS", `npm ${npmVersion} is available.`);
else check("npm", "FAIL", "npm is not available on PATH.");
if (gitVersion) check("git", "PASS", `${gitVersion} is available.`);
else check("git", "FAIL", "Git is not available on PATH.");
if (nodeVersion.startsWith("20.") || nodeVersion.startsWith("22.")) check("node-policy", "PASS", "Node major is a recommended LTS line.");
else check("node-policy", "WARN", "Node is supported, but Node 20 or 22 LTS is recommended for cross-machine parity.");

if (fs.existsSync(lockPath)) {
  const lockHash = crypto.createHash("sha256").update(fs.readFileSync(lockPath)).digest("hex");
  check("package-lock", "PASS", "package-lock.json is present; npm ci can reproduce dependencies.", { sha256: lockHash });
} else check("package-lock", "FAIL", "package-lock.json is missing; do not use npm install for the handoff.");
if (fs.existsSync(path.join(root, "node_modules", ".bin", process.platform === "win32" ? "next.cmd" : "next"))) check("dependencies", "PASS", "node_modules and the Next.js binary are present.");
else check("dependencies", "FAIL", "Dependencies are not installed; run npm ci before starting the app.");
if (fs.existsSync(envExamplePath)) check("env-example", "PASS", ".env.example is present for non-secret configuration setup.");
else check("env-example", "FAIL", ".env.example is missing; environment setup cannot be copied safely.");
if (fs.existsSync(envPath)) check("env-local", "PASS", ".env.local is present; secret values were not printed.", { keys: Object.keys(env).sort() });
else check("env-local", "WARN", ".env.local is missing; copy .env.example and fill local secrets/provider settings.");

const localOcr = (() => {
  try {
    const hostname = new URL(ocrBaseUrl).hostname;
    return ["localhost", "127.0.0.1", "::1"].includes(hostname);
  } catch {
    return false;
  }
})();
if (localOcr) {
  const model = env.TYPHOON_OCR_LOCAL_MODEL || env.TYPHOON_OCR_MODEL;
  if (model) check("ocr-config", "PASS", `Local OCR configured at ${ocrUrl} with a model name.`);
  else check("ocr-config", "FAIL", "Local OCR is selected but TYPHOON_OCR_MODEL/TYPHOON_OCR_LOCAL_MODEL is missing.");
  if (skipNetwork) {
    networkSkipped = true;
    check("ollama", "SKIP", "Ollama reachability check skipped by --skip-network.");
  } else {
    const origin = new URL(ocrBaseUrl).origin;
    const result = await fetchJson(`${origin}/api/tags`);
    if (!result.ok) check("ollama", "FAIL", `Local OCR endpoint is not reachable at ${origin}. Start Ollama before using OCR.`, { error: result.error || `HTTP ${result.status}` });
    else {
      const names = Array.isArray(result.body?.models) ? result.body.models.map((item) => item.name).filter(Boolean) : [];
      const model = env.TYPHOON_OCR_LOCAL_MODEL || env.TYPHOON_OCR_MODEL;
      if (model && names.includes(model)) check("ollama", "PASS", `Ollama is reachable and the configured model is installed.`, { model });
      else check("ollama", "WARN", "Ollama is reachable, but the configured model was not found in /api/tags.", { configuredModel: model || null, installedModels: names });
    }
  }
} else if (env.TYPHOON_OCR_API_KEY) {
  check("ocr-config", "PASS", `Remote OCR configured at ${ocrUrl}; API key is present but redacted.`);
} else {
  check("ocr-config", "FAIL", "Remote OCR is selected but TYPHOON_OCR_API_KEY is missing, and no local OCR endpoint is configured.");
}

if (env.GEMINI_API_KEY) check("gemini", "PASS", `Gemini answer provider key is present; model ${env.GEMINI_ANSWER_MODEL || "gemini-3.8-flash"}.`);
else check("gemini", "WARN", "GEMINI_API_KEY is missing; OCR can run, but source-answer extraction will remain unavailable.");

const googleKeys = ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_SESSION_SECRET"];
const googlePresent = googleKeys.filter((key) => env[key]);
if (googlePresent.length === 0) check("google-oauth", "WARN", "Google OAuth is not configured; local import/edit still works, Drive export will not.");
else if (googlePresent.length === googleKeys.length && env.APP_URL) check("google-oauth", "PASS", `Google OAuth settings are present for ${env.APP_URL}.`);
else check("google-oauth", "FAIL", "Google OAuth is partially configured; set APP_URL and all three server-side credentials.");

const port = Number(env.PORT || 3000);
if (Number.isInteger(port) && port > 0 && port < 65536) {
  if (await portAvailable(port)) check("port", "PASS", `Port ${port} is available.`);
  else check("port", "WARN", `Port ${port} is already in use; use another port or stop the project-owned process.`);
} else check("port", "FAIL", "PORT must be an integer between 1 and 65535.");

const report = {
  generatedAt: new Date().toISOString(),
  projectRoot: root,
  status: checks.some((item) => item.status === "FAIL") ? "FAIL" : checks.some((item) => item.status === "WARN") ? "WARN" : "PASS",
  checks,
  snapshot: { node: nodeVersion, npm: npmVersion || null, platform: process.platform, arch: process.arch, os: os.release(), branch: branch || null, commit: commit || null, remote: remote || null, ocrBaseUrl: ocrUrl, networkSkipped },
};

if (writeEvidence) {
  fs.mkdirSync(path.join(root, "evidence"), { recursive: true });
  fs.writeFileSync(path.join(root, "evidence", "environment-check.json"), JSON.stringify(report, null, 2) + "\n", "utf8");
}

if (jsonOnly) console.log(JSON.stringify(report, null, 2));
else {
  console.log(`Environment check: ${report.status}`);
  for (const item of checks) console.log(`[${item.status}] ${item.id}: ${item.message}`);
  if (writeEvidence) console.log("Evidence written to evidence/environment-check.json");
}

if (report.status === "FAIL" || (strict && report.status === "WARN")) process.exitCode = 1;
