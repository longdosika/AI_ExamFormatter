import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const isWindows = process.platform === "win32";

function run(command, args, label, extraEnv = {}) {
  console.log(`\n[completion-gate] ${label}: ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    stdio: "inherit",
    windowsHide: true,
    shell: isWindows && command === "npm",
    env: { ...process.env, ...extraEnv },
  });
  if (result.status !== 0) {
    console.error(`[completion-gate] Failed: ${label}. Fix the reported issue before marking the Task Done.`);
    process.exit(result.status ?? 1);
  }
}

run(process.execPath, ["scripts/check-knowledge-vault.mjs"], "Semantic Validator");
run(process.execPath, ["scripts/check-platform-readiness.mjs"], "Platform Readiness");
run(process.execPath, ["scripts/check-knowledge-drift.mjs", "--require-git"], "Git Drift Gate");

const excludedDirectories = new Set([
  ".git", ".next", ".nuxt", ".svelte-kit", ".turbo", ".cache", ".venv",
  "node_modules", "venv", "vendor", "build", "dist", "dist-installers", "out", "coverage", "release", "target",
]);
const implementationExtensions = /\.(?:js|jsx|ts|tsx|mjs|cjs|py|java|kt|swift|cs|go|rs|php|rb|vue|svelte)$/i;

function hasImplementation(directory = root) {
  return fs.readdirSync(directory, { withFileTypes: true }).some((entry) => {
    if (entry.name.startsWith(".") && entry.name !== ".github") return false;
    if (excludedDirectories.has(entry.name)) return false;
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return hasImplementation(target);
    const relativePath = path.relative(root, target).replace(/\\/g, "/");
    return implementationExtensions.test(entry.name) && !relativePath.startsWith("scripts/");
  });
}

const qualityCommands = [];
let hasBehaviorTest = false;
const packagePath = path.join(root, "package.json");

if (fs.existsSync(packagePath)) {
  const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));
  const scripts = packageJson.scripts ?? {};
  const orderedScripts = ["typecheck", "lint", "test", "test:unit", "test:runtime", "test:e2e", "build"];
  for (const scriptName of orderedScripts) {
    const commandBody = scripts[scriptName];
    if (typeof commandBody !== "string" || commandBody.includes("finish-task.mjs")) continue;
    qualityCommands.push({ command: "npm", args: ["run", scriptName], label: `npm script ${scriptName}` });
    if (scriptName === "test" || scriptName.startsWith("test:")) hasBehaviorTest = true;
  }
}

const requirementsPath = path.join(root, "requirements.txt");
const pyprojectPath = path.join(root, "pyproject.toml");
const pythonEvidence = [requirementsPath, pyprojectPath]
  .filter((filePath) => fs.existsSync(filePath))
  .map((filePath) => fs.readFileSync(filePath, "utf8"))
  .join("\n");
if (/\bpytest\b/i.test(pythonEvidence)) {
  qualityCommands.push({ command: isWindows ? "python" : "python3", args: ["-m", "pytest"], label: "Python tests" });
  hasBehaviorTest = true;
}
if (fs.existsSync(path.join(root, "Cargo.toml"))) {
  qualityCommands.push({ command: "cargo", args: ["test"], label: "Rust tests" });
  hasBehaviorTest = true;
}
if (fs.existsSync(path.join(root, "go.mod"))) {
  qualityCommands.push({ command: "go", args: ["test", "./..."], label: "Go tests" });
  hasBehaviorTest = true;
}

if (hasImplementation() && !hasBehaviorTest) {
  console.error("[completion-gate] Source code exists but no automated behavior-test command was discovered. Create a test-setup follow-up Task and add a real test command before marking behavior Verified or Done.");
  process.exit(1);
}

for (const qualityCommand of qualityCommands) {
  if (qualityCommand.label === "npm script build") {
    // Isolate build verification into .next-build to preserve active dev server cache in .next
    const buildDist = path.join(root, ".next-build");
    try { fs.rmSync(buildDist, { recursive: true, force: true }); } catch {}
    run(qualityCommand.command, qualityCommand.args, qualityCommand.label, { NEXT_DIST_DIR: ".next-build" });
    try { fs.rmSync(buildDist, { recursive: true, force: true }); } catch {}
  } else {
    run(qualityCommand.command, qualityCommand.args, qualityCommand.label);
  }
}

run(process.execPath, ["scripts/check-css.mjs"], "CSS Delivery Health Check");

if (qualityCommands.length === 0) {
  console.log("[completion-gate] No project quality commands discovered yet; governance-only setup validation completed.");
}
console.log("\nTask completion gate passed. Semantic, drift and discovered quality checks are green.");
