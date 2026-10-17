# GitHub Build Readiness

Task: T-112. Prepared: 2026-10-16 (Asia/Bangkok). Machine: DESKTOP-FNVSAKS.
Owner instruction: prepare and verify only; no stage, commit, push or remote release in this pass.

## Source and Delivery
- [x] T-121: compare editor and DOCX choices, figure sizes and shared-context order with the master template before any layout change; never restore a two-column choice grid. Real25/80-source DOCX and Google readback are recorded separately from provider accuracy.
- [x] Existing remote: longdosika/AI_ExamFormatter, branch main.
- [x] Initial tree clean; existing local commit 99a9413 is one commit ahead of cached origin/main (22a4c84). It has not been amended or pushed by this task.
- [x] Keep existing knowledge-governance workflow.
- [x] Add Build and Test workflow: Node 22, npm ci, file safety, typecheck, lint, unit tests, production build, Chromium production E2E and CSS delivery.
- [x] Workflow token is read-only; no application secrets, deployment credentials, automatic commits, release publication or production deployment.
- [x] Upload only selected synthetic browser diagnostics for 7 days, not .env or .next.
- [x] .gitignore excludes local env files, dependency trees, all .next variants and build/cache output.
- [x] Add npm run release:check with redacted findings and unit tests.
- [x] Add blocking production audit to CI: npm audit --omit=dev --audit-level=high. Current dependencies do not pass this security gate.
- [ ] Run the workflow on GitHub after a separately authorized push. Local YAML/Windows tests do not prove Ubuntu/Node 22 runner success.

## Security and Content Review
- [x] T-113 continuation 2026-10-17: Next15.5.27/PDF4.10.38/PostCSS8.5.30, production npm audit exit0 with zero findings; isolated clean npm ci exit0. Earlier T-112 findings below are historical, not the current audit. Node22 GitHub CI, historical-key confirmation and document privacy review still remain before publication.
- [x] Run read-only production dependency audit: five affected dependency entries, two critical and three high; evidence/t112-npm-audit.json. No upgrade, exploit validation or npm audit fix --force performed.
- [ ] HOLD: resolve T-113 (Next.js, PDF.js and transitive dependency findings) before publication. Major-version migration needs an explicit scope and regression plan. A passing functional build is not security clearance.
- [x] Initial tracked-tree scan: 665 files, 57,392,972 bytes, no tracked env/build/dependency output, no file above 50 MiB.
- [x] One credential-shaped Google key literal was found in a key-masking test and replaced with an obvious synthetic value. No live validation or network call using that value was made.
- [ ] Owner must confirm that historical value is fake, or revoke/rotate it if it was real. Its originating commit c9153dd is already an ancestor of cached origin/main. Removing it from the current tree does not remove it from history. No history rewriting is authorized in this task.
- [ ] Owner must review PDF/DOCX/screenshots and document IDs in existing evidence/public data before publishing or changing repository visibility. Initial scan counts 181 image/document files; text-pattern scanning is not a privacy, binary-content or full-history audit.
- [x] The scanner reports only paths/categories/line numbers, never matching credential values. It fails on generated/secret paths, selected credential patterns and files above 100 MiB; files above 50 MiB generate warnings.
- [ ] Review GitHub secret-scanning/push-protection and branch-protection settings separately. No account or repository security settings changed here.

## Local Verification
- [x] Latest local production261017-0014: T-113/T-103/T-104 Done after Verified/gate exit0; T-121 remains open with explicit residual acceptance.37PASS lines plus capture/library/workspace/legacy-cloud suites,25/80-source resumed-harvest DOCX regressions, actual Google80/15images, actual Drive restore80/13pages/15images, final CSS200. evidence/t121/verification.md. Earlier T-112 entries below are historical.
- [x] Workflow YAML parsed and assertions checked for read-only token, Node 22, build/test sequence, explicit Chromium, production URL, cleanup trap and no secret references.
- [x] Release scanner and scanner unit tests passed after removing the key-shaped fixture literal.
- [x] Full completion gate exit 0; isolated production candidate 261016-1027 on :3218 passed 31/31 Edge E2E checks and CSS delivery. Gate-only source stamp 261016-1034 is not deployed. Candidate stopped after verification; main build 261016-0945 unchanged.
- [x] Main localhost:3000 opened and synthetic import -> convert -> edit -> actual DOCX download/content checked; evidence/t112-main-smoke.png. No user browser storage was touched.
- [x] Exact CI audit command tested separately: exit 1, two critical/three high. Functional gate success does not override publication HOLD or establish cloud CI success.
- [ ] Fresh npm ci on GitHub is pending. Do not run npm ci over this machine's in-use node_modules while Next is running; the Windows SWC binary can be locked.

## Configuration and Hosting
CI uses mocked providers and needs no production API keys. Real OCR/AI/Google OAuth require configuration from .env.example on the deployment host; never commit .env.local. Server-only provider keys must not use NEXT_PUBLIC_ names. Set the deployment's APP_URL and register its exact Google callback /api/google/callback; localhost credentials/cookies do not establish cloud readiness.

GitHub stores source and runs CI. A successful GitHub build is not an internet-hosted Next.js server, and GitHub Pages is not the deployment target for the existing API/OAuth server routes. Hosting/deployment is separate and not performed here. Do not upload local .next folders: build from the lockfile on the target platform.

## Next Authorized Publication Pass
1. Resolve T-113 production dependency security findings and the historical-key/document-privacy review items above.
2. Inspect git status --short, git diff, and the existing unpublished commit with git show --stat HEAD.
3. Run npm run release:check and node scripts/finish-task.mjs T-112 again if code/config changes.
4. Fetch origin and reconcile its current main without discarding local work. Do not force-push.
5. Stage only explicitly reviewed paths (including required knowledge/evidence); inspect git diff --cached --stat and --check, then rerun npm run release:check. Avoid blanket git add . or uploading dependencies/builds.
6. Commit preparation changes only when authorized, keeping existing commit 99a9413 intact.
7. Push only after explicit approval, then observe both Knowledge Governance and Build and Test checks on GitHub. Do not call the cloud build verified until those actual runs succeed.
8. Plan hosting separately; preserve evidence-backed application limitations (T-103 Google editor rendering and T-104 Q66 table harvesting).

## Technical References
- https://docs.github.com/en/actions/tutorials/build-and-test-code/nodejs
- https://playwright.dev/docs/ci
- https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github

## Capture changes (T-125)
- Any change to figure/table capture or duplicate-text cleanup follows the procedure in [[capture-rules]]: reproduce with real responses in a fresh profile and in a profile that already has a draft, add a failing replay test, inspect crops visually, and add a row to its learning log plus an I-xxx entry in release_log.md.
