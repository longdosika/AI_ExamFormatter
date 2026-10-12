import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const requiredFiles = [
  ".gitignore",
  "AGENTS.md",
  "AI_WORKFLOW.md",
  "CHANGE_REQUEST.md",
  "QUALITY_CHECKLIST.md",
  ".github/workflows/knowledge-governance.yml",
  "documents/00-index.md",
  "documents/prd.md",
  "documents/tasks.md",
  "documents/traceability.md",
  "documents/code-map.md",
  "features/README.md",
  "features/FEATURE_TEMPLATE.md",
  "evidence/README.md",
  "scripts/finish-task.mjs",
  "scripts/check-knowledge-drift.mjs",
  "scripts/check-platform-readiness.mjs",
];
const issues = [];

for (const relativePath of requiredFiles) {
  if (!fs.existsSync(path.join(root, relativePath))) issues.push(`Missing required file: ${relativePath}`);
}

function read(relativePath) {
  const target = path.join(root, relativePath);
  return fs.existsSync(target) ? fs.readFileSync(target, "utf8") : "";
}

const prd = read("documents/prd.md");
const tasks = read("documents/tasks.md");
const decisions = read("documents/decisions.md");
const traceability = read("documents/traceability.md");
const codeMap = read("documents/code-map.md");
const featureTemplate = read("features/FEATURE_TEMPLATE.md");

function markdownFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (excludedMarkdownDirectories.has(entry.name) ||
        entry.name.startsWith(".node_modules-backup-") ||
        entry.name.startsWith(".next-") ||
        entry.name.startsWith(".qa-")) return [];
      return markdownFiles(target);
    }
    return entry.isFile() && entry.name.endsWith(".md") ? [target] : [];
  });
}

const excludedMarkdownDirectories = new Set([
  ".git",
  ".next",
  ".nuxt",
  ".svelte-kit",
  ".turbo",
  ".cache",
  ".venv",
  "node_modules",
  "venv",
  "vendor",
  "build",
  "dist",
  "dist-installers",
  "out",
  "coverage",
  "target",
]);

const markdownPaths = markdownFiles(root);
const notePaths = new Set(
  markdownPaths.map((filePath) => path.relative(root, filePath).replace(/\\/g, "/").replace(/\.md$/, "")),
);
const noteBasenames = new Set(Array.from(notePaths, (notePath) => path.posix.basename(notePath)));

function relative(filePath) {
  return path.relative(root, filePath).replace(/\\/g, "/");
}

for (const filePath of markdownPaths) {
  const relativePath = relative(filePath);
  if (relativePath.startsWith("documents/features/")) {
    issues.push(
      `Feature Note is in a non-canonical path: ${relativePath}. Move it to features/${path.basename(filePath)} and update wikilinks to [[features/${path.basename(filePath, ".md")}]].`,
    );
  }
  const source = fs.readFileSync(filePath, "utf8");
  const sourceDirectory = path.dirname(path.relative(root, filePath)).replace(/\\/g, "/");
  for (const match of source.matchAll(/\[\[([^\]|#]+)(?:[|#][^\]]*)?\]\]/g)) {
    const target = match[1].trim().replace(/\.md$/, "");
    const relativeTarget = path.posix.normalize(path.posix.join(sourceDirectory === "." ? "" : sourceDirectory, target));
    if (!notePaths.has(target) && !notePaths.has(relativeTarget) && !noteBasenames.has(path.posix.basename(target))) {
      issues.push(`Broken wikilink in ${relative(filePath)}: [[${target}]]`);
    }
  }
}

function definedIds(source, prefix) {
  return Array.from(source.matchAll(new RegExp(`^###\\s+(${prefix}-\\d{3})\\b`, "gm")), (match) => match[1]);
}

function reportDuplicateIds(ids, label) {
  const seen = new Set();
  for (const id of ids) {
    if (seen.has(id)) issues.push(`Duplicate ${label} ID: ${id}.`);
    seen.add(id);
  }
}

const requirementIds = definedIds(prd, "R");
const taskIds = definedIds(tasks, "T");
const decisionIds = Array.from(decisions.matchAll(/^#{2,3}\s+(D-\d{3})\b/gm), (match) => match[1]);
const requirementIdSet = new Set(requirementIds);
const taskIdSet = new Set(taskIds);
const decisionIdSet = new Set(decisionIds);

function statusById(source, prefix) {
  const statuses = new Map();
  let currentId = null;
  for (const line of source.split(/\r?\n/)) {
    const heading = line.match(new RegExp(`^#{2,3}\\s+(${prefix}-\\d{3})\\b`));
    if (heading) {
      currentId = heading[1];
      continue;
    }
    if (!currentId) continue;
    const status = line.match(/^- Status:\s*[^A-Za-z]*(Proposed|Ready|In Progress|Verified|Done)\b/i);
    if (status) statuses.set(currentId, status[1]);
  }
  return statuses;
}

const requirementStatuses = statusById(prd, "R");
const taskStatuses = statusById(tasks, "T");
const decisionStatuses = statusById(decisions, "D");
const completedStatuses = new Set(["verified", "done"]);

if (requirementIds.length === 0) issues.push("PRD has no Requirement headings such as ### R-001.");
if (taskIds.length === 0) issues.push("Tasks has no Task headings such as ### T-001.");
reportDuplicateIds(requirementIds, "Requirement");
reportDuplicateIds(taskIds, "Task");
reportDuplicateIds(decisionIds, "Decision");

if (!traceability.includes("| Requirement | Task | Decision | Feature Note | Code | Verification |")) {
  issues.push("Traceability matrix header is missing.");
}
["## Traceability", "## Behavior", "## Code", "## Verification", "## Known Risks"].forEach((heading) => {
  if (!featureTemplate.includes(heading)) issues.push(`Feature template is missing ${heading}.`);
});

function wikilinkTargets(source) {
  return Array.from(source.matchAll(/\[\[([^\]|#]+)(?:[|#][^\]]*)?\]\]/g), (match) => match[1].trim().replace(/\.md$/, ""));
}

function validateProjectPaths(source, sourceName) {
  const supportedExtensions = /\.(?:js|jsx|ts|tsx|mjs|cjs|py|java|kt|swift|cs|go|rs|php|rb|vue|svelte|html|css|scss|json|ya?ml|md|sql)$/i;
  for (const match of source.matchAll(/`([^`\r\n]+)`/g)) {
    const candidate = match[1].trim().replace(/\\/g, "/");
    if (!supportedExtensions.test(candidate)) continue;
    if (/[*{},]/.test(candidate) || candidate.startsWith("/") || /^[A-Za-z]:/.test(candidate) || /^https?:/.test(candidate)) continue;
    if (!fs.existsSync(path.join(root, candidate))) {
      issues.push(`Missing referenced project path in ${sourceName}: ${candidate}.`);
    }
  }
}

const traceabilityRows = traceability
  .split(/\r?\n/)
  .filter((line) => /^\|\s*R-/.test(line));

for (const row of traceabilityRows) {
  const cells = row.split("|").slice(1, -1).map((cell) => cell.trim());
  if (cells.length !== 6) {
    issues.push(`Malformed traceability row: ${row}`);
    continue;
  }

  const [requirementCell, taskCell, decisionCell, featureCell, codeCell, verificationCell] = cells;
  const requirementRefs = requirementCell.match(/\bR-\d{3}\b/g) ?? [];
  const taskRefs = taskCell.match(/\bT-\d{3}\b/g) ?? [];
  const decisionRefs = decisionCell.match(/\bD-\d{3}\b/g) ?? [];

  if (/\bR-\d{3}-\d+\b/.test(requirementCell)) issues.push(`Non-canonical Requirement ID in traceability: ${requirementCell}.`);
  if (/\bT-\d{3}-\d+\b/.test(taskCell)) issues.push(`Non-canonical Task ID in traceability: ${taskCell}.`);
  if (requirementRefs.length !== 1 || !requirementIdSet.has(requirementRefs[0])) {
    issues.push(`Traceability row references an undefined Requirement: ${requirementCell}.`);
  }
  if (taskRefs.length === 0) {
    issues.push(`Traceability row has no canonical Task ID: ${taskCell}.`);
  }
  for (const taskId of taskRefs) {
    if (!taskIdSet.has(taskId)) issues.push(`Traceability row references an undefined Task: ${taskId}.`);
  }
  for (const decisionId of decisionRefs) {
    if (!decisionIdSet.has(decisionId)) issues.push(`Traceability row references an undefined Decision: ${decisionId}.`);
  }

  const requirementId = requirementRefs[0];
  const verificationIsComplete = /\b(?:Verified|Done)\b/i.test(verificationCell);
  const requirementStatus = requirementId ? requirementStatuses.get(requirementId) : null;
  const completedTaskIds = taskRefs.filter((taskId) =>
    completedStatuses.has((taskStatuses.get(taskId) ?? "").toLowerCase()),
  );

  if (verificationIsComplete && requirementId && !completedStatuses.has((requirementStatus ?? "").toLowerCase())) {
    issues.push(
      `Traceability cannot be ${verificationCell} while Requirement ${requirementId} status is ${requirementStatus ?? "missing"}. Set the Requirement to Verified or Done only after evidence agrees.`,
    );
  }
  if (verificationIsComplete && taskRefs.length > 0 && completedTaskIds.length === 0) {
    const taskSummary = taskRefs.map((taskId) => `${taskId}=${taskStatuses.get(taskId) ?? "missing"}`).join(", ");
    issues.push(
      `Traceability cannot be ${verificationCell} because no linked Task is Verified or Done: ${taskSummary}.`,
    );
  }
  if (verificationIsComplete) {
    const incompleteDecisions = decisionRefs.filter(
      (decisionId) => !completedStatuses.has((decisionStatuses.get(decisionId) ?? "").toLowerCase()),
    );
    if (incompleteDecisions.length > 0) {
      const decisionSummary = incompleteDecisions
        .map((decisionId) => `${decisionId}=${decisionStatuses.get(decisionId) ?? "missing"}`)
        .join(", ");
      issues.push(
        `Traceability cannot be ${verificationCell} while linked Decision is not Verified or Done: ${decisionSummary}.`,
      );
    }
  }
  if (!verificationIsComplete && completedTaskIds.length > 0) {
    issues.push(
      `Task ${completedTaskIds.join(", ")} is Verified or Done but traceability Verification is ${verificationCell}. Record real evidence and synchronize the row before Done.`,
    );
  }
  if (!verificationIsComplete && requirementId && completedStatuses.has((requirementStatus ?? "").toLowerCase())) {
    issues.push(
      `Requirement ${requirementId} status is ${requirementStatus} but traceability Verification is ${verificationCell}. Synchronize the evidence state.`,
    );
  }

  const featureTargets = wikilinkTargets(featureCell).filter((target) => target.startsWith("features/"));
  if (featureTargets.length !== 1 || !notePaths.has(featureTargets[0])) {
    issues.push(`Traceability row must link one existing Feature Note with [[features/...]]: ${featureCell}.`);
  }
  validateProjectPaths(codeCell, "documents/traceability.md");
}

if (traceabilityRows.length !== requirementIds.length) {
  issues.push(`Traceability coverage mismatch: ${traceabilityRows.length} rows for ${requirementIds.length} Requirements.`);
}

const featureDirectory = path.join(root, "features");
const featureFiles = fs.existsSync(featureDirectory)
  ? fs.readdirSync(featureDirectory)
      .filter((fileName) => fileName.endsWith(".md") && !["README.md", "FEATURE_TEMPLATE.md"].includes(fileName))
      .map((fileName) => path.join(featureDirectory, fileName))
  : [];

for (const filePath of featureFiles) {
  const source = fs.readFileSync(filePath, "utf8");
  const sourceName = relative(filePath);
  ["## Traceability", "## Behavior", "## Code", "## Verification", "## Known Risks"].forEach((heading) => {
    if (!source.includes(heading)) issues.push(`Feature Note ${sourceName} is missing ${heading}.`);
  });

  const featureRequirements = source.match(/\bR-\d{3}\b/g) ?? [];
  const featureTasks = source.match(/\bT-\d{3}\b/g) ?? [];
  if (!featureRequirements.some((id) => requirementIdSet.has(id))) {
    issues.push(`Feature Note ${sourceName} has no existing Requirement ID.`);
  }
  if (!featureTasks.some((id) => taskIdSet.has(id))) {
    issues.push(`Feature Note ${sourceName} has no existing Task ID.`);
  }
  for (const claim of source.matchAll(/^- (?:Manual|Runtime) checks?:\s*(?:`)?(?:Verified|Done)(?:`)?([^\r\n]*)/gim)) {
    const evidencePaths = Array.from(claim[1].matchAll(/`(evidence\/[A-Za-z0-9._\/-]+\.(?:md|txt|log|json|png|jpe?g|webp))`/gi), (match) => match[1]);
    if (evidencePaths.length === 0) {
      issues.push(`Feature Note ${sourceName} claims manual or runtime verification without an evidence/ artifact.`);
      continue;
    }
    for (const evidencePath of evidencePaths) {
      if (!fs.existsSync(path.join(root, evidencePath))) {
        issues.push(`Feature Note ${sourceName} references missing verification evidence: ${evidencePath}.`);
      }
    }
  }
  validateProjectPaths(source, sourceName);
}

validateProjectPaths(codeMap, "documents/code-map.md");

if (issues.length > 0) {
  console.error("Project Knowledge Graph needs attention:\n- " + issues.join("\n- "));
  process.exitCode = 1;
} else {
  console.log("Project Knowledge Graph contract passed.");
}
