import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const issues = [];
const excludedDirectories = new Set([
  ".git", ".next", ".nuxt", ".svelte-kit", ".turbo", ".cache", ".venv",
  "node_modules", "venv", "vendor", "build", "dist", "dist-installers", "out", "coverage", "release", "target",
]);
const implementationExtensions = /\.(?:js|jsx|ts|tsx|mjs|cjs)$/i;

function read(relativePath) {
  const target = path.join(root, relativePath);
  return fs.existsSync(target) ? fs.readFileSync(target, "utf8") : "";
}

function readJson(relativePath) {
  try {
    return JSON.parse(read(relativePath) || "{}");
  } catch {
    issues.push("Invalid JSON file: " + relativePath + ".");
    return {};
  }
}

function collectFiles(directory = root) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (excludedDirectories.has(entry.name) || entry.name.startsWith(".node_modules-backup-") || entry.name.startsWith(".next-") || entry.name === "evidence") return [];
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectFiles(target);
    return entry.isFile() ? [target] : [];
  });
}

function relative(filePath) {
  return path.relative(root, filePath).replace(/\\/g, "/");
}

const packageJson = readJson("package.json");
const scripts = packageJson.scripts ?? {};
const dependencies = { ...(packageJson.dependencies ?? {}), ...(packageJson.devDependencies ?? {}) };
const files = collectFiles();
const sourceFiles = files.filter((filePath) => implementationExtensions.test(filePath) && !relative(filePath).startsWith("scripts/"));
const sourceText = sourceFiles.map((filePath) => fs.readFileSync(filePath, "utf8")).join("\n");
const electronDetected = Boolean(dependencies.electron) || /(?:from\s+["']electron["']|require\(["']electron["']\)|\bBrowserWindow\b)/.test(sourceText);

if (electronDetected) {
  const mainCandidates = [packageJson.main, "electron/main.cjs", "electron/main.mjs", "electron/main.js", "main.cjs", "main.mjs", "main.js"]
    .filter((item) => typeof item === "string" && item.trim());
  const mainPath = mainCandidates.find((candidate) => fs.existsSync(path.join(root, candidate)));
  if (!mainPath) {
    issues.push("Electron main entry is missing. Set package.json main to an existing desktop entry file.");
  }
  const mainSource = mainPath ? read(mainPath) : sourceText;
  if (!/contextIsolation\s*:\s*true/.test(mainSource)) {
    issues.push("Electron must set contextIsolation: true.");
  }
  if (!/nodeIntegration\s*:\s*false/.test(mainSource)) {
    issues.push("Electron must set nodeIntegration: false.");
  }

  const preloadFiles = sourceFiles.filter((filePath) => /^preload\.(?:js|mjs|cjs|ts)$/i.test(path.basename(filePath)));
  if (preloadFiles.length === 0) {
    issues.push("Electron preload entry is missing; expose only a minimal contextBridge API.");
  }
  if (/sandbox\s*:\s*true/.test(mainSource)) {
    for (const preloadFile of preloadFiles) {
      const preloadSource = fs.readFileSync(preloadFile, "utf8");
      if (path.extname(preloadFile).toLowerCase() !== ".mjs" && /^\s*(?:import\s|export\s)/m.test(preloadSource)) {
        issues.push("Electron sandbox preload uses ESM syntax in " + relative(preloadFile) + ". Use a sandbox-compatible CommonJS preload (.cjs) or a verified Electron module configuration.");
      }
    }
  }

  const htmlFiles = files.filter((filePath) => filePath.toLowerCase().endsWith(".html"));
  if (!htmlFiles.some((filePath) => /content-security-policy/i.test(fs.readFileSync(filePath, "utf8")))) {
    issues.push("Electron renderer HTML is missing a Content-Security-Policy.");
  }

  const desktopStart = ["start:desktop", "dev:desktop", "start"]
    .some((scriptName) => typeof scripts[scriptName] === "string" && /\belectron\b/i.test(scripts[scriptName]));
  if (!desktopStart) {
    issues.push("Electron project needs a real desktop start script such as start:desktop: electron .");
  }
  if (typeof scripts["test:runtime"] !== "string" || !scripts["test:runtime"].trim()) {
    issues.push("Electron project needs a real test:runtime script for packaged or desktop startup behavior.");
  }
  const packageScript = ["package", "dist", "make"]
    .some((scriptName) => typeof scripts[scriptName] === "string" && scripts[scriptName].trim());
  const packageTool = Object.keys(dependencies).some((name) => /^(?:electron-builder|electron-packager|@electron-forge\/)/.test(name));
  if (!packageScript || !packageTool) {
    issues.push("Electron project needs a packaging script and an Electron packaging tool before distribution can be Verified.");
  }

  const decrementTimer = /setInterval\s*\(/.test(sourceText) && /(?:\.tick\(\s*1\s*\)|\bremaining\w*\s*(?:--|-=\s*1))/.test(sourceText);
  const wallClockReconciliation = /(?:Date\.now\s*\(|performance\.now\s*\()/.test(sourceText);
  if (decrementTimer && !wallClockReconciliation) {
    issues.push("Timer uses decrement-only setInterval without wall-clock reconciliation. Recalculate elapsed time with Date.now/performance.now and verify sleep/resume behavior.");
  }
}

if (issues.length > 0) {
  console.error("Platform readiness needs attention:\n- " + issues.join("\n- "));
  process.exitCode = 1;
} else if (electronDetected) {
  console.log("Platform readiness passed for the detected Electron project.");
} else {
  console.log("Platform readiness passed; no Electron-specific runtime was detected.");
}
