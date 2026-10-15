# ได้เอกสารในรูปแบบ google doc ไว้ใน dirve ที่กำหนด

Status: `Planned`

## Traceability

- Requirement: R-003 in [[documents/prd]]
- Task: T-002 in [[documents/tasks]]
- Decisions: add links from [[documents/decisions]] when a tradeoff is made
- Traceability Matrix: [[documents/traceability]]

## Behavior

Planned user need: ได้เอกสารในรูปแบบ google doc ไว้ใน dirve ที่กำหนด

T-016 makes the current UI truthful: the import screen states Google Drive is not connected, and the export action reports unavailable instead of claiming document creation. R-003 remains Planned pending authentication, a destination-folder contract, an export implementation, and actual Google Docs/Drive verification.

## Code

- Entry points: `app/page.tsx`, `components/SplitDocumentEditor.tsx` (availability messaging only)
- Supporting files: identify during implementation
- Data or integrations: record only when affected

## Verification

- Acceptance checks: replace with measurable evidence before marking the task Done
- Automated tests: record real project-relative paths or commands
- Manual checks: record only when needed; a Verified claim must link a real artifact under the evidence folder
- Runtime checks: keep Pending until target-platform evidence exists under the evidence folder

## Known Risks

Implementation details and verification evidence are not confirmed yet.

T-041/T-042 final verification: original PDF import -> exact SHA-256 reviewed corpus -> 25 questions/100 choices/5 source-owned media -> editor -> source-page navigation -> live DOM snapshot -> native Google Docs. Source page is captured when each question starts, preventing prior-page questions shifting forward. Unknown/changed files use ordinary OCR; no approximate filename match or learned answer inference. Corpus is data under public/reviewed and includes reviewer, source hash/page count and text. Live PDF import: 3.577s, zero OCR calls. Remote OCR baseline: 13.8s, recognition defects retained for review. All seven native PDF pages visually checked after grouped pagination repair. Readback: evidence/t041-gdoc-readback.json. Browser: evidence/t042-real-pdf-result.json. Google URL: https://docs.google.com/document/d/1r5CWTFdiQE98JAmSgRMNnNh1WKLIuJzqI4vVwZOCfIY .

T-046 regression: wrong-origin auth redirects to configured canonical origin before state cookie; safe callback reason messages; localhost:3000 runtime recovered. Live user sign-in/consent, Picker folder permission and actual in-app export require subsequent UAT.

T-064: Normalized APP_URL origin (stripping trailing slashes gracefully) and added granular, non-sensitive `missingFields` diagnostic array to `lib/google-auth.ts` and `app/api/google/session/route.ts`. Updated `components/GoogleDriveStatus.tsx` to display exact missing configuration requirements directly in the UI.

T-090: Vercel serverless cloud deployment readiness for Google Drive and AI features. Configured `vercel.json` with 60-second function timeout for `app/api/**/*.ts`, exported `maxDuration = 60` in `app/api/google/export/route.ts`, documented required cloud environment variables and OAuth redirect URI (`https://ai-exam-formatter.vercel.app/api/google/callback`).

