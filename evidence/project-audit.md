# Project audit — 2026-10-10

Scope: local source and knowledge audit; no browser/deployed/Google output UAT performed.

## Findings and assignments

| Priority | Evidence | Assignment | Closure |
|---|---|---|---|
| P0 | Parser substitutes 3/35 hardcoded items for zero/single parsed question; defaults answer ก | T-015 / parser_fix | real-source regression tests, no fabricated answers |
| P0 | Google export only shows toast; no API exists | T-016 honest status; T-017 integration | real authenticated Google Doc |
| P1 | DOCX/PDF flatten lines; numbered choice ambiguity; explanation swallows next question | T-015 | parser/import tests |
| P1 | Browser image Buffer usage; no OCR/AI provider | T-015 encoding; T-018 OCR | real image/scanned PDF evidence |
| P1 | Cases only React state; no Vault/server sync | T-016 local persistence; T-019 shared sync | remount/reload verification |
| P1 | contentEditable DOM edits may be overwritten on crop re-render | T-019 UI / QA | edit → crop → preserve text |
| P2 | Crop targets repeated question number; failed crop creates decorative fallback | T-016 targeted fix; T-019 runtime | duplicate-number/failed crop verification |
| P2 | DOC decoded as text, HTML tags retained, image mapping by position | T-018 import | support matrix and fixtures |
| P1 | Historical Done/PASS claims lack behavioral evidence; npm test only knowledge validator | T-014 | reopen evidence-pending claims |

## Verification

- Initial knowledge validator: exit 0; document contract only.
- Git status: project files are untracked; historical drift baseline is not meaningful. No staging/commit performed.
- Parser regressions: node scripts/test-parser.cjs exit 0 (source fidelity, unknown answers, nested explanation, numeric choices, section resets, DOCX valid/invalid, browser base64 image, mocked PDF reject/16-page line extraction).
- Case regressions: node scripts/test-cases.cjs exit 0 (save/load, schema/version/duplicate validation, corrupt data preserved, storage failures).
- npx tsc --noEmit: exit 0.
- Initial sandbox completion attempts: exit 1 (Google Fonts DNS failure and/or workspace @ alias resolution). Added tsconfig baseUrl; normal-access npm run build and node scripts/finish-task.mjs T-014 both exit 0. Sandboxed Webpack still fails alias resolution; normal-access verification required in this environment.
- Next build emits missing ESLint warning but exits 0. npm lint is knowledge validation only; no ESLint coverage claimed.
- Browser attempt: production server on port 3100 reported Ready; in-app browser http://localhost:3100 failed net::ERR_CONNECTION_TIMED_OUT. No browser acceptance evidence obtained; T-019 remains open.
- Drive metadata readback: folder ID 1bZeNZ7De9pxsoQH-Zo9ni3A3Rd6XmnuG, title AI_ExamFormatter, MIME application/vnd.google-apps.folder; connected user has owner permission. This verifies connector access, not app OAuth or successful export.

## External dependencies

- C-003 destination supplied; app OAuth configuration still unspecified.
- C-004 OCR/AI provider/key configuration unspecified; no auto-solving verified.
- T-003 needs source fixture, output Google Doc and browser/template evidence.

## Implemented scope and residual risks
- Final completion gate after corrections: exit 0; full stdout/stderr artifact [completion-gate.txt](completion-gate.txt). T-014/T-015/T-016/T-020 moved through Verified to Done; product goal remains open.

- T-015: synthetic fallback/default answers removed; source boundaries and failed imports corrected. Imported image CLEAN certification removed. Mocked PDF runtime tests are not browser UAT.
- T-016: validated local case persistence, storage failures, upload/empty parse errors, truthful unavailable export; crop stable ID/direct DOM insertion and failed crop rejection. New case timestamps explicitly Asia/Bangkok (+07:00).
- LocalStorage is per browser/origin, no cross-tab merge/server/Vault sync or editable case history. ContentEditable changes are DOM-only and not durable across reset/reload.
- PDF processing all pages can use substantial memory; image mapping still by extraction position; complex PDF columns, HTML and legacy DOC acceptance pending T-018.
- Object URL cleanup on reset/empty parse remains follow-up in T-019.
- T-020 only establishes a passing normal-access build and explicit alias root; sandbox alias limitation and network font dependency remain recorded.
