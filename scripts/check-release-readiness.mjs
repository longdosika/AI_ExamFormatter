import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const MiB = 1024 * 1024;
const patterns = [
  ["private-key", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g],
  ["google-api-key", /AIza[0-9A-Za-z_-]{35}/g],
  ["github-token", /(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})/g],
  ["google-oauth-token", /ya29\.[A-Za-z0-9_-]{25,}/g],
  ["aws-access-key", /(?:AKIA|ASIA)[A-Z0-9]{16}/g],
];

/** Findings deliberately include only locations and categories, never matching values. */
export function inspectReleaseFile(file, bytes, size = bytes.length) {
  const findings = [], warnings = [];
  const normalized = file.replace(/\\/g, "/");
  if (/(^|\/)(?:\.env(?:\..+)?|[^/]+\.(?:pem|key))$/.test(normalized) && path.posix.basename(normalized) !== ".env.example") findings.push({ type: "local-secret-file", path: file });
  if (/(^|\/)(?:node_modules|\.next(?:-[^/]+)?|dist|build|\.vercel)\//.test(normalized)) findings.push({ type: "generated-output", path: file });
  if (size > 100 * MiB) findings.push({ type: "github-file-limit", path: file, bytes: size });
  else if (size > 50 * MiB) warnings.push({ type: "large-file", path: file, bytes: size });
  if (size <= 8 * MiB && !bytes.includes(0) && !/\.(?:png|jpe?g|gif|webp|pdf|docx|zip|woff2?|ttf|ico)$/i.test(file)) {
    const text = bytes.toString("utf8");
    for (const [type, pattern] of patterns) {
      for (const match of text.matchAll(pattern)) findings.push({ type, path: file, line: text.slice(0, match.index).split("\n").length });
    }
  }
  return { findings, warnings };
}

export function inspectWorkingTree(root = process.cwd()) {
  const git = args => execFileSync("git", args, { cwd: root, encoding: "utf8", windowsHide: true });
  const files = [...new Set(git(["ls-files", "--cached", "--others", "--exclude-standard", "-z"]).split("\0").filter(Boolean))];
  const findings = [], warnings = [];
  let checkedFiles = 0, totalBytes = 0;
  for (const file of files) {
    const absolute = path.join(root, file);
    if (!fs.existsSync(absolute)) continue;
    const stat = fs.lstatSync(absolute);
    if (stat.isSymbolicLink()) { warnings.push({ type: "symlink-not-followed", path: file }); continue; }
    if (!stat.isFile()) continue;
    checkedFiles++;
    totalBytes += stat.size;
    const result = inspectReleaseFile(file, stat.size <= 8 * MiB ? fs.readFileSync(absolute) : Buffer.alloc(0), stat.size);
    findings.push(...result.findings);
    warnings.push(...result.warnings);
  }
  const probes = [".env.local", ".env.production.local", "node_modules/release-probe", ".next/release-probe", ".next-release-probe/output", "build/release-probe"];
  const ignored = execFileSync("git", ["check-ignore", "--stdin"], { cwd: root, input: probes.join("\n") + "\n", encoding: "utf8", windowsHide: true }).trim().split(/\r?\n/);
  for (const file of probes) if (!ignored.includes(file)) findings.push({ type: "missing-ignore-protection", path: file });
  return { status: findings.length ? "FAIL" : "PASS", checkedFiles, totalBytes, findings, warnings, scope: "Current Git-managed working tree only; not a full history, binary-content, or live-credential audit." };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const report = inspectWorkingTree();
    console.log(JSON.stringify(report, null, 2));
    process.exitCode = report.status === "PASS" ? 0 : 1;
  } catch (error) {
    console.error(`Release readiness check failed (${error.code || error.name || "unknown"}). Git inspection could not complete.`);
    process.exitCode = 1;
  }
}
