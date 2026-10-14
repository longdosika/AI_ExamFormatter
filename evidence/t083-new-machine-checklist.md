# T-083 New Machine Development Environment Checklist

## Machine record
- Date/time checked: 2026-10-14 19:56:02 +07:00
- Machine name: DESKTOP-FNVSAKS
- Project path: `D:\90-AI\AI_ExamFormatter`
- Git remote: `https://github.com/longdosika/AI_ExamFormatter.git`
- Branch: `main`
- Commit checked: `c9153dd`
- Task: T-083

## Environment snapshot
- Node.js: `v24.19.0`
- npm: `11.17.0`
- Git: `2.49.0.windows.1`
- OS snapshot from doctor: Windows `10.0.26300`, x64
- Recommendation: Node 24 is supported by Next.js minimum checks, but Node 20 or 22 LTS remains the preferred parity target for this project.

## Checklist for first-time setup on this machine
- [x] Confirm repository path and branch.
- [x] Create a local `.env.local` from `.env.example`.
- [x] Install dependencies from committed lockfile with `npm ci --no-audit --no-fund`.
- [x] Verify postinstall PDF assets are available.
- [x] Record redacted environment check with `npm run env:check:record`.
- [x] Run unit/contract suite with `npm test`.
- [x] Run TypeScript check with `npm run typecheck`.
- [x] Run lint with `npm run lint`.
- [x] Run browser E2E with `npm run test:e2e`.
- [x] Run production build with `npm run build`.
- [x] Attempt project finish gate with `node scripts/finish-task.mjs T-083`.
- [x] Confirm real local secrets/provider settings are present without printing values.
- [x] Re-run `npm run env:check:record` after provider configuration.
- [ ] Re-run `node scripts/finish-task.mjs T-083` after provider secrets and drift docs are fully synchronized.

## Actions completed
- Created `.env.local` from `.env.example`; no secret values were printed or copied into evidence.
- Installed 429 npm packages successfully. `scripts/sync-pdf-assets.cjs` synced the pdf.js worker, cmaps, and standard fonts.
- The first `npm ci` failed inside sandbox due DNS/network restriction (`ENOTFOUND registry.npmjs.org`). Re-running with approved network access completed successfully.
- `npm run env:check:record` wrote `evidence/environment-check.json`.
- `npm test` first failed inside sandbox on local loopback (`connect EACCES 127.0.0.1`). Re-running with approved loopback access passed.
- `npm run typecheck` passed.
- `npm run lint` passed with 0 errors and 8 existing Next.js `<img>` warnings.
- `npm run test:e2e` passed all 16 browser scenarios.
- `npm run build` passed and stamped a temporary build version `261014-1953`; generated source stamp changes were reverted because they are build artifacts, not T-083 source changes.
- `.env.local` originally pointed Typhoon OCR at local Ollama (`127.0.0.1:11434`), but Ollama was not installed/reachable. It was switched to remote Typhoon (`https://api.opentyphoon.ai/v1`) because a local `TYPHOON_OCR_API_KEY` is present.
- `npm run env:check:record` now reports WARN, not FAIL: OCR, Gemini, and Google OAuth configuration pass; remaining warnings are Node 24 not being the recommended LTS line and port 3000 being in use by the running project server.
- `node scripts/finish-task.mjs T-083` was attempted before documentation sync and failed at Git Drift Gate because verification/evidence files changed and T-083 documentation was not yet fully synchronized at that point.

## Current readiness
- Ready for local development: Yes.
- Ready for parser/unit/browser regression testing: Yes.
- Ready for local UI testing without external providers: Yes.
- Ready for real OCR with remote Typhoon: Yes; `TYPHOON_OCR_API_KEY` is present and base URL is remote Typhoon.
- Ready for Gemini source-answer/diagram provider calls: Yes; Gemini key is present and `GEMINI_ANSWER_MODEL=gemini-3.8-flash`.
- Ready for Google Drive export OAuth: Configured locally; live browser consent/export still needs manual user acceptance in the app.

## Provider configuration notes
Update `.env.local` locally only. Do not commit or paste these values into chat or evidence.

- `TYPHOON_OCR_API_KEY`: present locally; values were not printed.
- `GEMINI_API_KEY`: present locally; values were not printed.
- Optional fallback keys: `GEMINI_API_KEY_2`, `GEMINI_API_KEY_3`, `GOOGLE_VISION_API_KEY_2`, `GOOGLE_VISION_API_KEY_3`, `TYPHOON_OCR_API_KEY_2`, `TYPHOON_OCR_API_KEY_3`.
- Google export settings are present locally: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CLOUD_PROJECT_NUMBER`, `GOOGLE_PICKER_API_KEY`, and `GOOGLE_SESSION_SECRET`; values were not printed.
- Confirm `APP_URL=http://localhost:3000` for local OAuth.
- Local Ollama is not installed/reachable on this machine. Remote Typhoon is the active OCR mode, so Ollama is optional unless the user wants offline/local OCR later.

## Commands and actual results
| Command | Result |
|---|---|
| `hostname` | `DESKTOP-FNVSAKS` |
| `node -v` | `v24.19.0` |
| `npm -v` | `11.17.0` |
| `git rev-parse --abbrev-ref HEAD` | `main` |
| `git rev-parse --short HEAD` | `c9153dd` |
| `git remote get-url origin` | `https://github.com/longdosika/AI_ExamFormatter.git` |
| `Copy-Item -LiteralPath .env.example -Destination .env.local -Force` | Passed |
| `npm ci --no-audit --no-fund` | Passed after network approval |
| `npm run env:check:record` | WARN only: Node 24 is not preferred LTS and port 3000 is in use by the running local app |
| `npm test` | Passed after loopback approval |
| `npm run typecheck` | Passed |
| `npm run lint` | Passed with 8 warnings, 0 errors |
| `npm run test:e2e` | Passed 16/16 scenarios |
| `npm run build` | Passed |
| `Invoke-WebRequest http://localhost:3000` | Passed, HTTP 200 |
| `node scripts/finish-task.mjs T-083` | Passed after documentation sync: semantic, platform, drift, typecheck, lint, tests, E2E, build `261014-2001`, and CSS health check |

## Minimal future update checklist
Use this lighter path when code is pulled later and `.env.local` already exists:

1. `git status --short`
2. `git pull`
3. If `package-lock.json` changed: `npm ci --no-audit --no-fund`
4. If `.env.example` changed: compare with `.env.local` and add new local keys if needed.
5. `npm run env:check:record`
6. `npm test`
7. `npm run typecheck`
8. `npm run lint`
9. `npm run test:e2e`
10. `.\scripts\bootstrap-local.ps1 -Port 3000 -SkipTests`

## Known local caveats
- npm network access may require running outside sandbox or normal PowerShell because the sandbox DNS can block `registry.npmjs.org`.
- Tests that open local loopback servers may need normal PowerShell or approved loopback access.
- `node_modules`, `.next`, and `.env.local` must remain uncommitted.
- Running E2E/build can refresh evidence screenshots, statistics JSON, and build stamps. Treat those as generated verification artifacts unless a task explicitly changes behavior.
- Port 3000 warning during `env:check` is expected while the local dev server is intentionally running.
