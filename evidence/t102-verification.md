# T-102 Export Decoration and Media Verification

Date: 2026-10-15, Asia/Bangkok. Host: DESKTOP-FNVSAKS. Task: T-102. Follow-ups: T-103 and T-104.

## Findings and Reference
- Actual reported Google document: https://docs.google.com/document/d/1TgtZzwQ-PR0B7hv8yamMDPTAnNKoI2kreGbnDNCP-js/edit
- Owner's expected output: https://docs.google.com/document/d/1wyAaKDjHQM8lYqhwXqGX7fJgXZ8FZ1Xa/edit
- Metadata confirms the reference is a Word DOCX, not a native Google Doc. Read-only download preserved as t102-expected.docx. It has 15 embedded PNGs and no doubled answer stars. Its layout contains choice labels followed by images and shared-context group endings. It is not an authoritative source-answer key.
- The reported document's Google DOCX readback (t102-broken.docx) has 78 doubled stars and 14 embedded PNGs. Inspected Q16 image bytes display actual crystals, not warning placeholders.
- Google's PDF readback (t102-google-readback.pdf, 20 pages, 14 embedded images) shows all four Q16 figures on page 4. Render: t102-google-before-q16.png. Thus screenshot placeholders do not prove missing DOCX bytes or a transport defect. Account-specific editor rendering remains T-103. The in-app browser reaches Google sign-in; original/reference files were not edited.
- Duplicate root cause: the DOM decorator injected marker/badge nodes for initially unselected choices; later React's conditional selected-answer JSX added a second copy. Stable unconditional slots plus legacy normalization remove the competing ownership.
- Standard-library XML paragraph/image relationship comparison localizes the 15-vs-14 image occurrence difference to Q66. The reference has the chromatography ranking table (t102-reference-q66.png); the reported file instead embeds its header and X/Y/Z values into the question text, with no Q66 image relationship. This is an upstream harvest/binding issue, not evidence of a DOCX conversion drop. T-104 is Ready; exact original source page/draft media is required to reproduce and fix that distinct issue.

## Changes
- Share one managed answer star/badge slot; normalize duplicated older drafts before decoration and snapshot.
- Await image preparation for both download and Google export: decode independently of lazy loading, retain valid PNG/JPEG/GIF bytes, embed other readable sources as PNG, fail before API upload on unreadable media.
- Preserve aspect ratio for tall images constrained by maximum DOCX dimensions.

## Verification
- `npm run typecheck`: passed.
- `node scripts/test-google.cjs`: passed, including proportional tall-image regression in the final gate.
- Initial expanded browser suite passed asynchronous/repeated AI and legacy repair regressions. A subsequent run hit a transient Windows evidence-file lock (UNKNOWN); rerun results recorded below.
- `node scripts/finish-task.mjs T-102`: exit 0. Semantic vault, platform readiness, Git drift, typecheck, lint (0 errors, 8 existing img warnings), all unit/contract suites, E2E 25 checks, isolated build 261015-1930 and CSS delivery passed. Log: t102-completion-gate.log.
- Browser checks include exact marker/badge/star counts after repeated asynchronous AI actions and manual edits; legacy duplicate repair on reopen; actual DOCX image decoding; offscreen WebP canonicalized to PNG with matching teal pixels; corrupt image abort before any export POST. Screenshot: t102-repaired-draft.png. Downloaded fixture: t102-export.docx.
- Owner authorized one new native Google test document, created via connected Drive import in the existing target folder: https://docs.google.com/document/d/1SQzFqee4XxKPyVSC4ZhRLM6hngjycsZlRP-dFO96hmU/edit (T-102 Export Regression). Metadata confirms native Google Docs and target parent. DOCX readback t102-google-qa.docx contains two answer stars (one per selected answer), two embedded PNGs and manual background E3EFFA. Google PDF t102-google-qa.pdf renders the blue answers and nonblank teal/coral test image; visually inspected t102-google-qa-render.png.
- `NEXT_DIST_DIR=.next-production-t102 npm run build`: exit 0, build 261015-1932. Replaced only the verified old Next server on port 3000. Production process started detached with hidden window; test server kept isolated on 3218 during verification.
- `E2E_BASE_URL=http://localhost:3000 node scripts/test-e2e.cjs`: exit 0, 25 checks passed, zero uncaught browser errors. Production opened and the actual editor/download/restore flow exercised. Build 261015-1932 visible in t102-repaired-draft.png. Logs: t102-production-build.log and t102-production-browser.log. Results: qa-iteration-2/results.json.
- Google PDF embedded image readback: 1x1 fixture plus 37x79 colored image; interior RGB (0,110,120), confirming nonblank media after real conversion.
- Final knowledge-vault and working-tree drift checks: exit 0 after README/index/handoff synchronization. T-102 moved In Progress -> Verified -> Done; T-103/T-104 stay open. Production server remains available; isolated port 3218 test server is no longer needed.

## Limits
- OCR/AI providers and Google API upload responses in browser tests are deterministic mocks. Local DOCX generation/download and image decoding are real.
- Real existing Google file was downloaded read-only and rendered; no original/reference document was modified. The separately authorized test validates real Google conversion of browser-downloaded app DOCX bytes. Upload uses the connected Drive importer, not the app's browser OAuth session, so it does not prove that account-specific session/editor behavior.
- Do not claim complete parity with the 80-question reference: T-104 Q66 table capture remains pending exact source-page input. Existing drafts can be reopened/edited/exported without repeating OCR/AI; repairs apply to their managed decorations on reopen/export.
