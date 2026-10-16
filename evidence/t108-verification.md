# T-108 Export Layout From Owner Reference Verification

Date: 2026-10-15, Asia/Bangkok. Host: DESKTOP-FNVSAKS.

## Inputs
- Target: https://docs.google.com/document/d/1wyAaKDjHQM8lYqhwXqGX7fJgXZ8FZ1Xa/edit, read via public DOCX export (HTTP 200, 566,391 bytes), byte-identical to evidence/t102-expected.docx.
- Before: https://docs.google.com/document/d/1bd5cqArKs2EwASUnVUS5qbHh5lVxRgxqNYVxUe9KC7Y requires Google sign-in (export HTTP 401; browser pane redirected to accounts.google.com). Not read. Current-system output was analysed from evidence/t102-broken.docx (owner-reported export) and fresh exports from this build.
- Requested skill `report-to-google-doc` is not installed in this environment; analysis used a DOCX paragraph/run dump and Word-rendered PDFs.

## Target layout (measured)
US Letter 12240x15840 twips; margins 864 top/bottom, 1008 left/right; Sarabun 12 pt; line 276 auto; no paragraph spacing. Header: centred "AI Exam Formatter_691013-1607" coral 11 pt, title bold teal 16 pt, two blank lines. Question "N. " bold coral + black text, blank, "ตัวเลือก:" bold teal, choices black (key not bold), answer row shaded + bold coral " *", blank between questions. "รูปคำถาม:" / "รูปโจทย์ร่วม:" bold coral with 528 px images; choice images 307 px under each choice; "โจทย์ร่วม " bold teal + text; "จบโจทย์ร่วม" bold teal. No tables, no indents.

## Before (current system) differences
A4 with 0.5" margins; 80-twip spacing after every paragraph; no header; no blank lines; slate/amber body colours (0F172A, 1E293B, 451A03); bold teal choice keys; shared-context paragraphs exported with solid 006D77 shading (5% editor fill exported as opaque).

## Changes
- Role tagging in `snapshotDocument` from editor data attributes; item id resolved from the nearest `[data-item-id]`.
- Pure `layoutExamDocument` applied inside `createExportDocx`, so DOCX download and Google Drive export share it. Run merge, image caps (shrink only), keep-with-next to the last choice, shared header merge, reference label wording in export only.
- Translucent backgrounds are not exported; only answer rows keep shading (T-101 origin colours preserved).
- E2E evidence writes retry transient Windows errno -4094 open failures (no assertion retry).

## Verification
- `node scripts/test-google.cjs`: layout fixture (normal, question image, choice images, shared context) checks paragraph sequence, header stamp `691013-1607` for 2026-10-13T09:07Z, colours, run merge, 528/307/528 image widths, keep-with-next, unshaded shared paragraphs, Letter page/margins, no 80-twip spacing, centred 11 pt header, styles.xml defaults, unknown-role rejection: pass.
- E2E on dev :3101 (evidence/t108-e2e.log): 30/30 PASS including DOCX from the live editor: Letter page, header stamp, blank line before choices, plain black "ก. " key, no legacy spacing. Two earlier attempts stopped on transient Windows `UNKNOWN` evidence writes before any assertion; retry wrapper added.
- `scripts/capture-t108.cjs` built a representative exam in the app (source answers, four choice images, shared context with table image, question image) -> evidence/t108-sample-export.docx; paragraph dump matches the target pattern.
- Word COM -> PDF -> pypdfium2 render: evidence/t108-compare-before-target-after-p1.png (before | target | after) and evidence/t108-compare-target-after-choice-images.png; evidence/t108-sample-export-word.pdf.
- Production build 261015-2227 (`.next-production-t108`): `finish-task` exit 0 against :3102 (E2E 30/30, gate stamp 261015-2229, CSS health) on the first attempt (evidence/t108-completion-gate.log).
- Deployment: localhost:3000 (127.0.0.1) serves 261015-2227; HTTP 200, CSS OK; capture-t108 against :3000 downloaded evidence/t108-deployed-export.docx: header "AI Exam Formatter_691015-2230", Letter page, blank rhythm, black choices, single shaded answer row.

## Boundaries
- Not compared against the owner's "before" Google Doc (no access). Answer shading follows answer origin (green/yellow/blue), so a source-answer row is green where the AI-answered reference is yellow.
- Real Google Drive conversion of the new layout was not exercised here (the browser pane has no Google session); the Drive path uploads the same DOCX bytes as the download.
