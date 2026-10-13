# T-068 verification — image/PDF exam conversion

- Date: 2026-10-13 (Asia/Bangkok)
- Task: T-068 Complete image-exam conversion flow
- Status: Verified -> Done; completion gate passed.

## Root-cause checks

1. Fresh browser E2E previously returned to the upload screen before OCR. Diagnostic body reported: `Setting up fake worker failed: Cannot load script at https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`.
2. OCR success previously updated React review text but did not update the parsed-file `rawContent`, so image fallback conversion could read the initial placeholder.

## Changes verified

- `lib/pdf-renderer.ts` uses `/pdf.worker.min.js`, `/pdf-assets/cmaps/`, and `/pdf-assets/standard_fonts/`.
- `scripts/sync-pdf-assets.cjs` and `package.json` postinstall keep those assets available.
- `app/page.tsx` persists the successful OCR response into `result.rawContent` before parsing/conversion.
- `scripts/test-e2e.cjs` starts Next with the workspace realpath shim and records diagnostics when raw OCR review is absent.

## Commands and results

- `node scripts/sync-pdf-assets.cjs` — PASS; worker, cmaps, and standard fonts synchronized.
- `node scripts/test-pdf-assets.cjs` — PASS.
- `node scripts/test-parser.cjs` — PASS.
- `node scripts/test-ocr-client.cjs` — PASS.
- `npm test` — PASS; knowledge vault, parser, OCR, source-answer, local-vision, statistics, history, cases, performance, Google, and PDF-asset checks passed.
- `npm run typecheck` — PASS.
- `npm run lint` — PASS with 8 existing `@next/next/no-img-element` warnings and 0 errors.
- `node scripts/check-knowledge-drift.mjs --require-git` — PASS.
- `node scripts/check-knowledge-vault.mjs` — PASS.
- `E2E_BASE_URL=http://127.0.0.1:3220 npm run test:e2e` against a fresh server — PASS, all 15 checks:
  - MD source upload and two-question preservation
  - explicit conversion and source-left/editor-right layout
  - edited text survives conversion
  - reset and same-file reupload
  - reload persistence and history panel
  - 390px layout and keyboard upload access
  - unknown PNG image OCR boundary with mocked provider
  - edited raw text reconversion without rerunning OCR
  - statistics persistence
  - twelve-page automatic 10+2 batching with absolute source pages
  - numbered navigation/source stability/mobile width
  - provider HTTP failure visibility
  - no uncaught browser runtime errors

## Remaining gate / risk

- `node scripts/finish-task.mjs T-068` must be run after this evidence and knowledge synchronization. Real Typhoon/Gemini accuracy is provider-dependent and is not certified by mocked browser E2E. Existing lint image optimization warnings remain non-blocking.

