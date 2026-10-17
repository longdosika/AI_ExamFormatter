// T-134 / I-063: a diff that only re-stamps build lines must pass the Drift Gate, real source edits must not,
// and the finish-task restore must put stamp lines back without losing other edits.
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { isStampOnlyDiff, restoreStampLines, snapshotStampLines } from "./build-stamp-lines.mjs";

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const repo = fs.mkdtempSync(path.join(os.tmpdir(), "drift-stamp-"));

function write(fileName, content) {
  const target = path.join(repo, fileName);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content, "utf8");
}
function read(fileName) {
  return fs.readFileSync(path.join(repo, fileName), "utf8");
}
function git(...args) {
  const result = spawnSync("git", args, { cwd: repo, encoding: "utf8", windowsHide: true });
  assert.equal(result.status, 0, `git ${args.join(" ")}: ${result.stderr}`);
}
function drift() {
  return spawnSync(process.execPath, ["scripts/check-knowledge-drift.mjs", "--require-git"], { cwd: repo, encoding: "utf8", windowsHide: true });
}

const versionFile = (stamp) => `/**\n * Application Version Stamp\n * Auto-updated on build\n */\nexport const APP_VERSION = "${stamp}";\n`;
const pageFile = (stamp, body = "return <main />;") => `export default function Page() {\n  ${body}\n}\n\n/* BUILD_STAMP: ${stamp} */\n`;
const nextEnvFile = (dist) => `/// <reference types="next" />\n/// <reference path="./${dist}/types/routes.d.ts" />\n\n// NOTE: This file should not be edited\n`;
const baseline = () => {
  write("lib/version.ts", versionFile("261017-2046"));
  write("app/page.tsx", pageFile("261017-2046"));
  write("next-env.d.ts", nextEnvFile(".next-production-t132b"));
};
const stampAsBuild = () => {
  write("lib/version.ts", versionFile("261017-2111"));
  write("app/page.tsx", pageFile("261017-2111"));
  write("next-env.d.ts", nextEnvFile(".next-build"));
};

try {
  for (const name of ["check-knowledge-drift.mjs", "build-stamp-lines.mjs"]) {
    write(`scripts/${name}`, fs.readFileSync(path.join(scriptsDir, name), "utf8"));
  }
  write("documents/tasks.md", "# Tasks\n");
  baseline();
  git("init", "-q");
  git("config", "user.email", "test@example.invalid");
  git("config", "user.name", "drift-stamp-test");
  git("config", "core.autocrlf", "false");
  git("add", ".");
  git("commit", "-q", "-m", "baseline");
  // Second commit with docs only so the clean-tree HEAD~1 fallback has nothing to flag.
  write("documents/tasks.md", "# Tasks\n\n- note\n");
  git("commit", "-q", "-am", "docs");

  // 1. Build re-stamped all three files after the owner's commit: gate passes.
  stampAsBuild();
  let result = drift();
  assert.equal(result.status, 0, `stamp-only diff must pass:\n${result.stdout}${result.stderr}`);
  assert.match(result.stdout, /ignored build-stamp-only changes: .*lib\/version\.ts/);

  // 2. Stamp-only plus CRLF line endings (Windows checkout) still passes.
  write("app/page.tsx", pageFile("261017-2111").replace(/\n/g, "\r\n"));
  result = drift();
  assert.equal(result.status, 0, `stamp + CRLF diff must pass:\n${result.stdout}${result.stderr}`);

  // 3. A real code change in a stamp file fails, even when its stamp also changed.
  write("app/page.tsx", pageFile("261017-2111", "return <main>changed</main>;"));
  result = drift();
  assert.equal(result.status, 1, "real code change in app/page.tsx must fail the gate");
  assert.match(result.stderr, /Source code changed without a Feature Note/);

  // 4. A code change in another source file fails while the stamp files are ignored.
  baseline();
  stampAsBuild();
  write("lib/other.ts", "export const value = 1;\n");
  result = drift();
  assert.equal(result.status, 1, "new lib source must fail the gate");
  assert.match(result.stderr, /lib\/other\.ts/);
  fs.rmSync(path.join(repo, "lib/other.ts"));

  // 5. Extra APP_VERSION-looking line added elsewhere is still a stamp line, but any other added line is not.
  assert.equal(isStampOnlyDiff("lib/version.ts", "@@ -1 +1 @@\n-export const APP_VERSION = \"a\";\n+export const APP_VERSION = \"b\";\n"), true);
  assert.equal(isStampOnlyDiff("lib/version.ts", "@@ -1 +1,2 @@\n+export const OTHER = 1;\n"), false);
  assert.equal(isStampOnlyDiff("lib/exam-parser.ts", ""), false);

  // 6. finish-task restore: put stamps back, keep an edit made elsewhere in app/page.tsx during the build.
  baseline();
  const snapshot = snapshotStampLines(repo);
  stampAsBuild();
  write("app/page.tsx", pageFile("261017-2111", "return <main>concurrent edit</main>;").replace(/\n/g, "\r\n"));
  const restored = restoreStampLines(repo, snapshot).sort();
  assert.deepEqual(restored, ["app/page.tsx", "lib/version.ts", "next-env.d.ts"]);
  assert.equal(read("lib/version.ts"), versionFile("261017-2046"));
  assert.equal(read("next-env.d.ts"), nextEnvFile(".next-production-t132b"));
  assert.equal(read("app/page.tsx"), pageFile("261017-2046", "return <main>concurrent edit</main>;").replace(/\n/g, "\r\n"));
  assert.deepEqual(restoreStampLines(repo, snapshot), [], "second restore is a no-op");

  console.log("test-drift-stamp: stamp-only diffs pass, real source changes fail, restore keeps other edits (6 cases).");
} finally {
  fs.rmSync(repo, { recursive: true, force: true });
}
