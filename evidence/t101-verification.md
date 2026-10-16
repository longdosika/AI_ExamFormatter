# T-101 Answer ownership and working-copy export

Date: 2026-10-15 (Asia/Bangkok)

## Problem and implementation

Only source/AI shading existed; manual changes were not a distinct origin. Export was blocked by review findings and absent at raw OCR stage. Added green/source, yellow/AI, blue/manual with named badges, native answer selection and clearing, and typed-marker ownership. Draft saves merge answer fields into existing media-bearing items. A memoized restored DOM prevents scroll/state updates from resetting manual changes.

Raw OCR and formatted drafts now offer local DOCX and authenticated Google export regardless of pipeline/review stage. Both snapshot current edited content. Background inheritance now crosses nested block boundaries, preserving answer shading in OOXML. The local download endpoint validates same-origin requests and streams at most 8 MB of JSON input.

## Evidence collected

- Browser E2E on isolated localhost:3218 passed all 22 checks, including raw-answer correction and mobile regressions. It exercised real DOCX generation/download/unzip and Google export payload via an isolated mock (no real Google document was created).
- Three answer colors: computed green RGB(230,244,234), yellow RGB(255,244,204), manual RGB(227,239,250); each expected OOXML fill was present in the downloaded DOCX, and attached media count was preserved.
- Manual answer select, change, typed asterisk, clear, draft reload and scroll stability passed.
- Raw edited text exported to DOCX and Google payload before conversion; formatted export succeeded while review issues remained.
- `node scripts/test-google.cjs` passed including three OOXML shading colors. Earlier typecheck/lint passed; lint has 8 existing image warnings.
- Screenshots: `evidence/t101-three-origins.png`, `evidence/t101-three-origins-mobile.png`, `evidence/t101-answer-workflow.png`. Initial visual review found narrow mobile title wrapping and a restored-DOM reset; both corrected before the final gate.

## Boundaries

Google connection/payload behavior is verified with a browser mock. Real Google upload still requires the user's authenticated session and destination permission. Provider OCR/answer accuracy is not certified by these deterministic fixtures. Source and AI provenance may not overwrite an explicit manual answer.

## Final verification

`node scripts/finish-task.mjs T-101` passed with exit 0: semantic validator, platform readiness, knowledge drift, typecheck, lint (0 errors, 8 existing image warnings), all unit/contract suites, E2E 22/22, isolated production build 261015-1901, and CSS delivery health (HTTP 200).

Final release build: `NEXT_DIST_DIR=.next-production npm run build` passed, stamp 261015-1902. Started production via `npm run start -- -p 3000 -H 127.0.0.1` with that distDir. `E2E_BASE_URL=http://localhost:3000 node scripts/test-e2e.cjs` passed all 22 checks against production. HTTP 200 and served HTML containing 261015-1902 confirmed. Runtime logs: evidence/local-production.log and evidence/local-production-error.log (ignored local logs). The live source/draft data in the user's own browser profile was not altered by these isolated headless fixtures.
