// Lines that `npm run build` rewrites on every run (prebuild stamp-version.cjs and Next's next-env.d.ts).
// They are build output, not source edits: the Drift Gate ignores diffs limited to them, and
// finish-task puts them back after its throw-away .next-build verification build (T-134 / I-063).
import fs from "node:fs";
import path from "node:path";

export const BUILD_STAMP_LINES = {
  "lib/version.ts": /^export const APP_VERSION = "[^"]*";$/,
  "app/page.tsx": /^\/\* BUILD_STAMP: [^*]+ \*\/$/,
  "next-env.d.ts": /^\/\/\/ <reference path="\.\/[^"]*types\/routes\.d\.ts" \/>$/,
};

// True when a unified diff (-U0) of fileName changes nothing but its stamp line(s) or line endings.
export function isStampOnlyDiff(fileName, diffText) {
  const pattern = BUILD_STAMP_LINES[fileName];
  if (!pattern) return false;
  const changedLines = diffText
    .split(/\r?\n/)
    .filter((line) => /^[+-]/.test(line) && !/^(?:\+\+\+|---)( |$)/.test(line))
    .map((line) => line.slice(1).replace(/\r$/, "").trim())
    .filter(Boolean);
  return changedLines.every((line) => pattern.test(line));
}

// Remember each stamp line before a build so it can be restored afterwards.
export function snapshotStampLines(root) {
  const snapshot = {};
  for (const [fileName, pattern] of Object.entries(BUILD_STAMP_LINES)) {
    const filePath = path.join(root, fileName);
    if (!fs.existsSync(filePath)) continue;
    const line = fs.readFileSync(filePath, "utf8").split(/\r?\n/).find((value) => pattern.test(value.trim()));
    if (line !== undefined) snapshot[fileName] = line;
  }
  return snapshot;
}

// Put the remembered stamp lines back, touching only those lines so edits made elsewhere
// in the same files during the build are kept. Returns the files that were rewritten.
export function restoreStampLines(root, snapshot) {
  const restored = [];
  for (const [fileName, savedLine] of Object.entries(snapshot)) {
    const filePath = path.join(root, fileName);
    if (!fs.existsSync(filePath)) continue;
    const pattern = BUILD_STAMP_LINES[fileName];
    const content = fs.readFileSync(filePath, "utf8");
    const parts = content.split(/(\r?\n)/);
    let changed = false;
    for (let index = 0; index < parts.length; index += 2) {
      if (pattern.test(parts[index].trim()) && parts[index] !== savedLine) {
        parts[index] = savedLine;
        changed = true;
      }
    }
    if (changed) {
      fs.writeFileSync(filePath, parts.join(""), "utf8");
      restored.push(fileName);
    }
  }
  return restored;
}
