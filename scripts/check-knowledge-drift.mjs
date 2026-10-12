import { spawnSync } from "node:child_process";

const cliArgs = process.argv.slice(2);
const stagedOnly = cliArgs.includes("--staged");
const requireGit = stagedOnly || cliArgs.includes("--require-git");
const requestedBase = cliArgs.find((argument) => !argument.startsWith("--")) || process.env.KNOWLEDGE_BASE_REF || "";

function git(args) {
  return spawnSync("git", args, { encoding: "utf8", windowsHide: true });
}

function outputLines(result) {
  return result.status === 0
    ? result.stdout.split(/\r?\n/).map((line) => line.trim().replace(/\\/g, "/")).filter(Boolean)
    : [];
}

const repositoryCheck = git(["rev-parse", "--is-inside-work-tree"]);
if (repositoryCheck.status !== 0) {
  const setupGuidance = "Run git init, git add ., and git commit -m 'Initialize project baseline' before implementation so the Drift Gate can compare changes.";
  if (requireGit) {
    console.error(`Knowledge drift check requires Git for implementation validation. ${setupGuidance}`);
    process.exit(1);
  }
  console.log(`Knowledge drift check skipped during initial setup: this folder is not a Git repository yet. ${setupGuidance}`);
  process.exit(0);
}

let changedFiles = [];
let comparisonLabel = "working tree against HEAD";

if (stagedOnly) {
  changedFiles = outputLines(git(["diff", "--cached", "--name-only", "--diff-filter=ACMR"]));
  comparisonLabel = "staged changes";
} else if (requestedBase) {
  const baseCheck = git(["rev-parse", "--verify", `${requestedBase}^{commit}`]);
  if (baseCheck.status !== 0) {
    console.error(`Knowledge drift check could not resolve base revision: ${requestedBase}.`);
    process.exit(1);
  }
  changedFiles = outputLines(git(["diff", "--name-only", "--diff-filter=ACMR", `${requestedBase}...HEAD`]));
  comparisonLabel = `${requestedBase}...HEAD`;
} else {
  const headCheck = git(["rev-parse", "--verify", "HEAD"]);
  changedFiles = headCheck.status === 0
    ? outputLines(git(["diff", "HEAD", "--name-only", "--diff-filter=ACMRD"]))
    : outputLines(git(["ls-files", "--cached"]));
  changedFiles.push(...outputLines(git(["ls-files", "--others", "--exclude-standard"])));
  changedFiles = [...new Set(changedFiles)];
  if (headCheck.status !== 0) comparisonLabel = "initial working tree (no HEAD)";
  if (changedFiles.length === 0) {
    const parentCheck = git(["rev-parse", "--verify", "HEAD~1"]);
    changedFiles = parentCheck.status === 0
      ? outputLines(git(["diff", "HEAD~1...HEAD", "--name-only", "--diff-filter=ACMR"]))
      : headCheck.status === 0 ? outputLines(git(["diff-tree", "--root", "--no-commit-id", "--name-only", "-r", "HEAD"])) : [];
    comparisonLabel = parentCheck.status === 0 ? "HEAD~1...HEAD" : "initial commit";
  }
}

if (changedFiles.length === 0) {
  console.log(`Knowledge drift check passed: no changed files in ${comparisonLabel}.`);
  process.exit(0);
}

const implementationExtensions = /\.(?:js|jsx|ts|tsx|mjs|cjs|py|java|kt|swift|cs|go|rs|php|rb|vue|svelte|html|css|scss|sql)$/i;
const sourcePrefixes = ["src/", "app/", "electron/", "server/", "api/", "lib/", "packages/", "components/"];
const manifestFiles = new Set([
  "package.json",
  "package-lock.json",
  "pnpm-lock.yaml",
  "yarn.lock",
  "pyproject.toml",
  "requirements.txt",
  "Cargo.toml",
  "go.mod",
]);

const sourceChanged = changedFiles.some((fileName) =>
  sourcePrefixes.some((prefix) => fileName.startsWith(prefix)) ||
  (implementationExtensions.test(fileName) && !fileName.startsWith("scripts/")),
);
const deliveryChanged = changedFiles.some((fileName) =>
  fileName.startsWith(".github/workflows/") || manifestFiles.has(fileName) || /(?:^|\/)(?:vite|next|electron-builder|webpack|rollup)\.config\./.test(fileName),
);

if (!sourceChanged && !deliveryChanged) {
  console.log(`Knowledge drift check passed: ${comparisonLabel} has no implementation or delivery changes.`);
  process.exit(0);
}

const changed = new Set(changedFiles);
const taskChanged = changed.has("documents/tasks.md");
const traceabilityChanged = changed.has("documents/traceability.md");
const codeMapChanged = changed.has("documents/code-map.md");
const featureChanged = changedFiles.some((fileName) =>
  fileName.startsWith("features/") && fileName.endsWith(".md") && !fileName.endsWith("README.md") && !fileName.endsWith("FEATURE_TEMPLATE.md"),
);
const architectureDecisionChanged = changed.has("documents/architecture.md") || changed.has("documents/decisions.md");
const issues = [];

if (!taskChanged) {
  issues.push("Implementation or delivery changed without documents/tasks.md. Register and update the Task in the same change.");
}
if (sourceChanged && (!featureChanged || !traceabilityChanged || !codeMapChanged)) {
  issues.push("Source code changed without a Feature Note, documents/traceability.md and documents/code-map.md update.");
}
if (deliveryChanged && !architectureDecisionChanged) {
  issues.push("Package, build or CI delivery changed without documents/architecture.md or documents/decisions.md.");
}

if (issues.length > 0) {
  console.error(`Project Knowledge Vault drift detected for ${comparisonLabel}:\n- ${issues.join("\n- ")}\nChanged files:\n- ${changedFiles.join("\n- ")}`);
  process.exitCode = 1;
} else {
  console.log(`Knowledge drift check passed for ${comparisonLabel}: implementation and knowledge files changed together.`);
}
