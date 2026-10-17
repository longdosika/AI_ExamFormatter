# Traceability

### T-132 Crop Top and Enforced Capture Rules
Bug on capture (R-002, capture-rules C-10) -> Task T-132 -> Feature Note r-002-feature -> lib/capture-geometry.ts, documents/capture-rules.md section ฉ. -> scripts/test-capture-rules.cjs, scripts/test-t132-crop-top.cjs, test-t123.cjs, test-t121-fidelity.cjs -> evidence/t132/.

### T-131 Several Question Figures
Bug on capture (R-002 / capture-rules C-37, release_log I-059 / H-13) -> Task T-131 -> Feature Note r-002-feature (existing) -> lib/formatter-rules.ts, lib/diagram-client.ts, lib/harvest-editor.ts, lib/figure-text-cleanup.ts, components/SplitDocumentEditor.tsx, app/page.tsx -> scripts/test-t131-multi-figure.cjs (regression), test-t130-choice-table.cjs, test-t121-order-dom.cjs, full test:e2e -> evidence/t131/.

### T-130 Choice Tables, Header Notice, Drive Control
Bug on capture (R-002 / capture-rules C-36) and Feature on R-001 workspace and R-003 Google Drive -> Task T-130 -> Feature Notes r-002-feature, r-001-browser, r-003-google-doc-dirve -> lib/capture-geometry.ts, lib/diagram-client.ts, lib/harvest-editor.ts, lib/figure-text-cleanup.ts, app/page.tsx, components/RichTextToolbar.tsx, components/GoogleDriveStatus.tsx -> scripts/test-t130-choice-table.cjs, test-e2e.cjs, test-workspace-controls.cjs, test-t121-controls.cjs -> evidence/t130/.

### T-129 Header Merge
Feature on R-001 browser workspace -> Task T-129 -> Feature Note r-001-browser -> app/page.tsx, app/globals.css -> scripts/test-e2e.cjs, test-library-ui.cjs, test-workspace-controls.cjs -> evidence/t129/.

### T-128 Imports and Drive Layout
Feature on R-001 import and R-003 Google Drive -> Task T-128 -> Feature Notes r-001-browser, r-003-google-doc-dirve, r-006-document-library -> app/page.tsx, lib/document-draft-store.ts, lib/drive-library.ts, lib/export-naming.ts, components/DraftProgress.tsx, components/GoogleDriveStatus.tsx -> scripts/test-t128-duplicate-import.cjs, test-drive-library.cjs, test-document-drafts.cjs -> evidence/t128/.

### T-127 Answer Star Integrity
Bug on T-126 feature (R-002) -> Task T-127 -> Feature Note r-002-feature -> components/SplitDocumentEditor.tsx, lib/answer-editor.ts -> scripts/test-t127-answer-star.cjs -> evidence/t127/.

### T-126 Answers and Choices
Feature on R-002 answer handling -> Task T-126 -> Feature Note r-002-feature -> lib/answer-editor.ts, lib/source-answer-service.ts, lib/source-answer-client.ts, lib/harvest-editor.ts, components/SplitDocumentEditor.tsx -> scripts/test-t126-answers-choices.cjs, scripts/test-source-answers.cjs -> evidence/t126/.

### T-125 Capture Geometry Guarantee
Bug on existing R-001/R-003 behaviour -> Task T-125 -> existing Feature Note r-001-browser -> app/page.tsx, documents/capture-rules.md -> scripts/test-t125-cached-ocr.cjs -> evidence/t125/.

### T-124 Stale Draft Repair
Bug on existing R-001/R-003 behaviour (no new requirement) -> Task T-124 -> existing Feature Notes r-001-browser, r-003-google-doc-dirve -> lib/figure-text-cleanup.ts, lib/diagram-client.ts, lib/capture-geometry.ts, lib/harvest-editor.ts, components/SplitDocumentEditor.tsx -> scripts/test-t124-stale-draft.cjs, regression test-t121-fidelity (25/80), test-t121-order-dom -> evidence/t124/.

### T-123 Four/Five-Choice And Source-Geometry Repairs
Existing R-002/R-004 (owner-confirmed fifth choice) -> T-123 H-02..H-09/H-11 -> existing [[features/r-002-feature]], [[features/r-004-feature]] -> D-071 -> Code Map T-123 -> `scripts/test-t123.cjs`, `scripts/test-t123-browser.cjs`, existing parser/diagram/source80 regressions and [[../evidence/t123/verification]]. H-01 persistent QuizFlow import, H-07 full live/unruled coverage, H-10 quota/billing and H-12 publication are not certified by replay.
Live continuation: H-07 -> recorded18 real diagram page calls -> actual Q4/Q9 crop defects -> two failing geometry checks -> `lib/capture-geometry.ts`/`lib/diagram-client.ts` correction -> zero-call recorded-provider replay. H-10 -> eight source-only page calls -> manual12-circle truth ->11/1 correct in rounds1/2 -> threshold not met, round3 not spent. See `evidence/t123/live/source-mark-audit.json` and verification ledger; no purchase.

T-122 Proposed confirmation -> existing R-001 browser Feature Note -> owner-approved inline hover/observed quick IAB misclick -> future pointer regression and evidence; no code change or Done claim. T-121 verification records this residual boundary alongside the individually dispositioned backlog.

### T-121 Fidelity / T-113 Runtime
Template order 2026-10-17: I-037..I-041 -> lib/harvest-editor.ts, lib/export-document.ts, components/SplitDocumentEditor.tsx, lib/capture-geometry.ts, lib/diagram-client.ts -> scripts/test-t121-order-dom.cjs, scripts/test-t121-fidelity.cjs (order/rows/Q8/Q16) -> evidence/t121/order-*. Handoff T-123 <- release_log H-01..H-11 <- evidence/t121/set2, set4, set5.
Audit 2026-10-17: I-033..I-036 -> lib/diagram-client.ts (extendCropAcrossInk), lib/api-key-manager.ts (executeAcrossModelsAndKeys), lib/source-answer-service.ts (isSelectionEvidence), lib/ai-answer-service.ts, lib/diagram-service.ts (0..1 bbox), lib/capture-geometry.ts (hasCellRowEvidence, line-preserving removeCapturedGridText), lib/exam-parser.ts (isStemTableRow, splitInlineEnumerations) -> scripts/test-diagram-contract.cjs, test-provider-keys.cjs, test-source-answers.cjs, test-parser.cjs, test-t121-source-marks-ui.cjs, test-t121-fidelity.cjs -> evidence/t121/audit-*.
Existing R-001/R-002/R-003/R-004/R-006 -> Tasks T-121/T-113 -> existing Feature Notes r-001-browser, r-002-feature, r-003-google-doc-dirve, r-006-document-library -> D-067/D-068 -> T-121 Code Map -> parser/diagram/library units, legacy restore/sanitization E2E, real PDF live provider fixture and replay, clean install, audit and completion gate. B-01..B-40 have distinct dispositions in release_log.md; unexecuted external acceptance and Git publication are not Done.

### T-120 Release Log
Requirement R-002/R-003 (governance) -> Task T-120 -> release_log.md, README.md -> no code change -> evidence/t120-verification.md. Backlog B-01..B-40 feeds Proposed task T-121.

### T-119 Thirty-Point Pass
Requirement R-001/R-002/R-003/R-004 -> Task T-119 -> [[features/r-001-browser]], [[features/r-003-google-doc-dirve]] -> lib/exam-parser.ts, lib/exam-validation.ts, lib/export-document.ts, components/SplitDocumentEditor.tsx, components/RichTextToolbar.tsx, app/page.tsx, app/globals.css -> scripts/test-parser.cjs, scripts/test-e2e.cjs, scripts/capture-t119.cjs, evidence/t119-verification.md.

### T-118 Restore Working Controls
Verified -> Done on production261016-2013: final completion gate and deployed browser/real-source checks exit0, source/badge match and actual IAB Save/reload/resume/disconnected settings exercised. [[evidence/t118-verification]], [live build record](../evidence/t118-live-build.json). No new real Google/QuizFlow acceptance claim.
Existing R-001/R-003/R-004 -> Bug T-118 -> D-040 -> [[features/r-001-browser]], [[features/r-003-google-doc-dirve]], [[features/r-004-feature]] -> [[documents/code-map]] T-118 -> scripts/test-workspace-controls.cjs, scripts/test-document-drafts.cjs, updated library/E2E checks and evidence/t118-verification.md. Owner-confirmed inline expansion supersedes T-117 floating labels; no new product requirement or change to master export layout.

### T-117 Header Hover Regression
Existing R-001 -> Bug T-117 -> D-039 -> [[features/r-001-browser]] -> app/page.tsx, app/globals.css -> scripts/test-library-ui.cjs rectangle/repeated-pointer checks and evidence/t117-verification.md. No new product requirement.

### T-115 Exact Source Verification / T-116 Library
Existing R-002/R-004 -> Verification T-115 -> [[features/r-002-feature]], [[features/r-004-feature]] -> production lib/diagram-client.ts and scripts/verify-t115-source.cjs -> evidence/t115-verification.md. Hand-verified boxes test crop retention, not provider detection accuracy.
R-006 -> T-116 -> D-038 -> [[features/r-006-document-library]] -> [[documents/code-map]] (T-116 section) -> server hash/privacy/idempotency tests, browser library/queue checks and actual OAuth/Drive evidence/t116-verification.md.

### T-114 Capture and Duplicate Table Regression
Existing R-001/R-002/R-004 -> Bug Task T-114 -> [[features/r-001-browser]], [[features/r-002-feature]], [[features/r-004-feature]] -> lib/exam-parser.ts, lib/captured-table-editor.ts, lib/diagram-client.ts, lib/diagram-service.ts, components/SplitDocumentEditor.tsx -> parser/diagram contract tests and production browser capture/DOCX/Canvas checks, evidence/t114-verification.md. No new product requirement or export-template change; old cropped images require recapture from the stored original.

### T-112 GitHub Build Preparation
Security follow-up T-113 -> existing delivery/provider/PDF feature boundaries -> evidence/t112-npm-audit.json -> planned dependency-path review, approved migration and production audit/regression. No new product requirement or completed remediation is implied.
Existing delivery requirements and R-001/R-003 -> Task T-112 -> [[features/r-001-browser]], [[features/r-003-google-doc-dirve]] -> .github/workflows/build-test.yml, scripts/check-release-readiness.mjs, scripts/test-release-readiness.cjs, package scripts -> workflow YAML assertions, safety/unit checks, finish-task and isolated production evidence/t112-verification.md. Publication/deployment is expressly excluded. Checklist: [[release-checklist]].

### T-111 Workspace Conveniences
Requirement R-001 -> Task T-111 -> [[features/r-001-browser]] -> app/page.tsx, components/SplitDocumentEditor.tsx, components/FileUploader.tsx, app/globals.css -> scripts/test-e2e.cjs, scripts/capture-t111.cjs, evidence/t111-verification.md.

### T-110 Rails, Export Control, Question Strip
Requirement R-001/R-003 -> Task T-110 -> [[features/r-001-browser]], [[features/r-003-google-doc-dirve]] -> app/globals.css, components/RichTextToolbar.tsx, components/SplitDocumentEditor.tsx, app/page.tsx -> scripts/test-e2e.cjs, scripts/capture-t110.cjs, evidence/t110-verification.md.

### T-109 Master Template Export
Requirement R-003/R-004 -> Task T-109 -> [[features/r-003-google-doc-dirve]] -> lib/export-layout.ts, lib/google-export.ts, lib/export-document.ts -> scripts/test-google.cjs, scripts/test-e2e.cjs, scripts/capture-t108.cjs, evidence/t109-verification.md. Supersedes the T-108 layout; T-101 origin colours remain editor-only.

### T-108 Export Layout From Reference
Requirement R-003/R-004 -> Task T-108 -> [[features/r-003-google-doc-dirve]] -> lib/export-document.ts, lib/export-layout.ts, lib/google-export.ts -> scripts/test-google.cjs (layout unit), scripts/test-e2e.cjs (DOCX page/header/rhythm/choice key), scripts/capture-t108.cjs, evidence/t108-verification.md.

### T-107 Accordion Strip, Image Management and Hover Rails
Requirement R-001/R-004 -> Task T-107 -> [[features/r-001-browser]] -> components/SplitDocumentEditor.tsx, components/RichTextToolbar.tsx, app/page.tsx, app/globals.css, lib/export-document.ts -> scripts/test-e2e.cjs (accordion, one-line, image add/resize/delete/undo with DOCX extent), scripts/capture-t107.cjs, evidence/t107-verification.md.

### T-106 Workspace Chrome Redesign
Requirement R-001 -> Task T-106 -> [[features/r-001-browser]] -> app/globals.css, app/layout.tsx, app/page.tsx, components/SplitDocumentEditor.tsx, components/RichTextToolbar.tsx, components/FileUploader.tsx, components/GoogleDriveStatus.tsx -> scripts/test-e2e.cjs (unchanged contracts), scripts/capture-t106.cjs, evidence/t106-verification.md. Refactor of presentation only; no requirement or export behavior change.

### T-105 Original Persistence and Expandable Navigation
Requirement R-001/R-002/R-004 -> Task T-105 -> [[features/r-001-browser]], [[features/r-002-feature]], [[features/r-004-feature]] -> lib/original-source-store.ts, lib/file-parser.ts, components/FileUploader.tsx, app/page.tsx, components/SplitDocumentEditor.tsx, app/globals.css -> scripts/test-document-drafts.cjs, scripts/test-e2e.cjs, evidence/t105-verification.md. Legacy originals require one identity-checked attachment; no OCR/AI reprocessing. Old Google editor/Q66 follow-ups T-103/T-104 remain separate.

### T-102 Answer/Media Export Regression
Existing R-002/R-003/R-004 -> Task T-102 -> [[features/r-002-feature]], [[features/r-003-google-doc-dirve]], [[features/r-004-feature]] -> lib/answer-editor.ts, components/SplitDocumentEditor.tsx, lib/export-document.ts, lib/google-export.ts, app/page.tsx -> scripts/test-e2e.cjs, scripts/test-google.cjs, evidence/t102-verification.md. Covers async/repeated AI updates, manual changes, legacy duplicate repair, real DOCX single-star/media decoding, offscreen image canonicalization and corrupt-image rejection. Google editor warning recurrence is T-103, separate from successful Google PDF/media readback.

### T-101 Three Answer Origins and Export at Any Working Stage
Requirement R-002/R-003/R-004 -> Task T-101 -> Feature Note: [[features/r-002-feature]], [[features/r-003-google-doc-dirve]], [[features/r-004-feature]] -> Code: lib/answer-editor.ts, lib/formatter-rules.ts, components/SplitDocumentEditor.tsx, components/RichTextToolbar.tsx, app/page.tsx, lib/export-document.ts, app/api/export/docx/route.ts -> Verification: scripts/test-e2e.cjs, scripts/test-google.cjs, evidence/t101-verification.md. Regression covers source/AI/manual colors, manual override and clearing, typed correction, saved draft resume, raw export, unresolved-draft export, and image/color preservation in real DOCX bytes. Google UI payload uses an isolated mock; real OAuth destination acceptance remains separate.

## Related
- [[00-index]]
- [[prd]]
- [[tasks]]
- [[decisions]]
- [[code-map]]
## Purpose
Trace each requirement through task, decision, feature knowledge, code, and verification evidence.
## Traceability Matrix
| Requirement | Task | Decision | Feature Note | Code | Verification |
|---|---|---|---|---|---|
| R-006 Related Drive Document Library | T-116 | D-038 | [[features/r-006-document-library]] | lib/drive-library.ts, app/api/google/library/route.ts, components/DocumentLibrary.tsx, lib/library-pending-store.ts | Verified: scripts/test-drive-library.cjs, scripts/test-library-ui.cjs; evidence/t116-verification.md, evidence/t116-t117-completion-gate-final.log exit 0 |
| R-001 ลาก / browser ไฟล์ต้นฉบับ | T-004, T-008, T-018 | - | [[features/r-001-browser]] | `components/FileUploader.tsx`, `lib/file-parser.ts`, `lib/pdf-renderer.ts` | Pending complete input/browser acceptance; targeted parser tests in `scripts/test-parser.cjs`; audit `evidence/project-audit.md` |
| R-002 แปลงเอกสารให้เข้ารูปแบบที่กำหนด | T-005, T-010, T-012, T-013 | - | [[features/r-002-feature]] | `lib/exam-parser.ts`, `lib/formatter-rules.ts`, `components/ExamFormatterPreview.tsx` | Pending full template/image acceptance; targeted regression `scripts/test-parser.cjs`; audit `evidence/project-audit.md` |
| R-003 ได้เอกสารในรูปแบบ google doc ไว้ใน dirve ที่กำหนด | T-017, T-003 | - | [[features/r-003-google-doc-dirve]] | `components/SplitDocumentEditor.tsx` (unavailable export indication only) | Pending app OAuth/export and real Google Doc output; folder metadata in `evidence/project-audit.md` |
| R-004 ปรับแต่ง ตัวหนา ตัวเอียง ขีดเส้นใต้ได้ (อนาคตอยากให้รองรับ สูตรเลข สูตรเคมี เลขยกำลัง) | T-007, T-009, T-011, T-019 | - | [[features/r-004-feature]] | `components/SplitDocumentEditor.tsx`, `components/RichTextToolbar.tsx` | Pending browser editing/crop/magnifier/scroll acceptance; `evidence/project-audit.md` |
| R-005 บันทึกและดูบทเรียน/ข้อตัดสินใจของแต่ละเคส (Lessons Learned & Case Decision Log Viewer) | T-006, T-019 | D-003 | [[features/r-005-lessons-learned]] | `components/CaseDecisionManager.tsx`, `lib/case-ledger.ts` | Pending full history editing/shared sync acceptance; local persistence tests `scripts/test-cases.cjs`; `evidence/project-audit.md` |

## Targeted bug verification
- T-015 and T-016 address subsets of existing requirements. Passing targeted regressions does not close their parent requirements or historical feature tasks.
- T-064 → existing R-003 note → `lib/google-auth.ts`, `app/api/google/session/route.ts`, `components/GoogleDriveStatus.tsx` → `scripts/test-google.cjs`, real diagnostic API tests.
- T-015 → existing R-001/R-002 notes → `lib/exam-parser.ts`, `lib/file-parser.ts`, `lib/pdf-renderer.ts`, `lib/formatter-rules.ts` → `scripts/test-parser.cjs`, `evidence/project-audit.md`.
- T-016 → existing R-003/R-004/R-005 notes → `app/page.tsx`, `components/CaseDecisionManager.tsx`, `components/SplitDocumentEditor.tsx`, `lib/case-ledger.ts` → `scripts/test-cases.cjs`, `evidence/project-audit.md`; browser acceptance remains T-019.
- T-020 → existing R-004 note → `tsconfig.json` → production build/completion log in `evidence/project-audit.md`.
- T-025 → existing R-001 note → `app/page.tsx`, `lib/exam-parser.ts`, `lib/exam-fallback.ts`, `lib/version.ts`, `components/GoogleDriveStatus.tsx` → `scripts/test-parser.cjs`, `scripts/test-google.cjs`, production build.
- T-027 → existing R-001/R-002/R-004 notes → `app/page.tsx`, `components/SplitDocumentEditor.tsx`, `lib/exam-fallback.ts`, `lib/exam-parser.ts`, `lib/formatter-rules.ts` → `scripts/test-parser.cjs`, `scripts/test-e2e.cjs`, production build.
- T-028 → existing R-001/R-004 notes → `next.config.mjs`, `scripts/finish-task.mjs`, `scripts/test-e2e.cjs`, `scripts/check-css.mjs` → `scripts/check-css.mjs`, `scripts/test-e2e.cjs`, production build.
- T-029 → existing R-001/R-002/R-004 notes → `app/page.tsx`, `lib/file-parser.ts`, `lib/pdf-renderer.ts`, `lib/exam-parser.ts`, `lib/exam-fallback.ts`, `lib/version.ts` → `scripts/test-parser.cjs`, `scripts/test-e2e.cjs`, production build.
- T-031 → existing R-001/R-002/R-004 notes → `lib/ocr-service.ts`, `app/api/ocr/route.ts`, `lib/exam-parser.ts`, `app/page.tsx`, `components/SplitDocumentEditor.tsx` → structured OCR fixture, parser regression, E2E, performance, build, and `finish-task` evidence.
## Update Rules
- Feature: link an existing or new Requirement, Task, Feature Note, affected Code, and Verification.
- Bug: link the Bug Task to the existing Feature Note and add regression verification; create no new Requirement unless expected behavior changes.
- Refactor: link the Refactor Task to existing Feature Notes and update Code Map or Architecture when structure changes.
- Store every canonical Feature Note under the root features/ folder, never documents/features/.
- When Verification becomes Verified or Done, synchronize the linked Requirement and Task statuses with the real evidence.
- Do not mark a task Done while its traceability row is incomplete.


## Source-faithful OCR review (T-039/T-040)
- Raw OCR is edited in a dedicated textarea; explicit re-conversion runs shared validation. Missing/duplicate choices and ambiguous labels are reported by question number. Review text cannot enter Drive export.
- lib/exam-validation.ts checks structure only; four choices do not prove text accuracy. No X/handwritten mark is inferred as an answer. Table context remains review-required.
- Parser expands explicitly labeled table rows, preserving cell data; A/B/C measurement tables stay stem data. No synthetic fallback questions are created for unparseable imports.
- Stale OCR responses are ignored after changing/resetting the source document. Editing/re-conversion does not call OCR again, reducing latency and provider usage.
- Verification: scripts/test-ocr-contract.cjs regression tests; evidence/t040-review-browser.png browser PDF import and rejected re-conversion. Full PDF source fidelity/media mapping remains open.

T-039 OCR reliability: batches over 10 pages reject before provider invocation; request timeout is 120s remote/300s local per attempt; concurrency is finite integer 1-2; truncated text remains available for review but cannot mark all pages successful. Review conversion cannot bypass incomplete page coverage. Owner Codex. Regression: scripts/test-ocr-contract.cjs.

T-041: source-verified 25-question artifact, explicit inline Markdown/data-image ownership and sparse question-N media. Existing R-002/R-004 Feature Notes apply. Figure descriptions remain review markers until original media is attached; checked boxes do not imply answers. Tables preserve column labels. Source-page buttons are excluded from export. Snapshot scaling preserves image aspect ratio. Evidence: evidence/t041-browser-result.json, evidence/t041-media-manifest.json, evidence/t041-source-review.html. Automatic OCR still requires review for overwritten labels/spelling.

T-041/T-042 final verification: original PDF import -> exact SHA-256 reviewed corpus -> 25 questions/100 choices/5 source-owned media -> editor -> source-page navigation -> live DOM snapshot -> native Google Docs. Source page is captured when each question starts, preventing prior-page questions shifting forward. Unknown/changed files use ordinary OCR; no approximate filename match or learned answer inference. Corpus is data under public/reviewed and includes reviewer, source hash/page count and text. Live PDF import: 3.577s, zero OCR calls. Remote OCR baseline: 13.8s, recognition defects retained for review. All seven native PDF pages visually checked after grouped pagination repair. Readback: evidence/t041-gdoc-readback.json. Browser: evidence/t042-real-pdf-result.json. Google URL: https://docs.google.com/document/d/1r5CWTFdiQE98JAmSgRMNnNh1WKLIuJzqI4vVwZOCfIY .

T-043 performance bug -> existing features/r-002-feature.md OCR feature -> lib/ocr-service.ts -> scripts/test-ocr-contract.cjs shared scheduling regression -> evidence/t043-verification.md. No new product requirement: source fidelity and reviewed-source behavior remain unchanged.

T-045 statistics requirement -> features/r-002-feature.md -> lib/experiment-stats.ts and app/page.tsx -> scripts/test-experiment-stats.cjs and scripts/test-e2e.cjs -> evidence/t045-experiments.json and evidence/t045-verification.md. Image placeholder/blob transport bug regression linked to existing OCR feature; no new OCR accuracy guarantee.

T-046 OAuth bug -> features/r-003-google-doc-dirve.md -> lib/google-auth.ts, auth/callback routes, GoogleDriveStatus -> scripts/test-google.cjs and evidence/t046-browser.cjs -> evidence/t046-result.json. T-017 live consent/Picker/export acceptance remains open.

T-047 bug -> existing features/r-002-feature.md import/OCR -> lib/ocr-client.ts and app/page.tsx -> test-ocr-client.cjs and test-e2e.cjs -> evidence/t047-batch-result.json and evidence/t047-verification.md. Generated twelve-page PDF and mocked OCR exercise actual render/upload/API boundary, not the unprovided user PDF.

T-048 source-page navigation requirement -> features/r-001-browser.md -> SplitDocumentEditor.tsx -> test-e2e.cjs -> evidence/t048-result.json and evidence/t048-verification.md; tests share generated 12-page PDF with mocked OCR, not semantic recognition evidence.

T-049 UI feedback/action -> features/r-001-browser.md -> app/page.tsx, SplitDocumentEditor.tsx, globals.css -> test-e2e delayed OCR transport/reduced-motion/source-action checks -> evidence/t049-result.json and evidence/t049-verification.md. Mock confirms state/UI flow, not real OCR accuracy.

### T-050 Explicit conversion workspace
T-050: left raw OCR/text -> explicit conversion -> editable formatted questions/style/images -> export; right original stays read-only and independent, with crop tools. Small question-number navigation scrolls left only. Import-history icon stores the latest 100 filenames/times/sizes locally; no source contents or reopen storage, no reconstruction of older anonymous statistics.
Requirement: R-001 / R-002 -> Task: T-050 -> Feature Note: features/r-001-browser.md and features/r-002-feature.md -> Code Map: app/page.tsx, components/SplitDocumentEditor.tsx, components/RichTextToolbar.tsx, lib/import-history.ts -> Verification: evidence/t050-verification.md.
This explicit user flow supersedes T-049 automatic formatting and T-048 main page-number navigation. Source page references remain available for explicit comparison. Only answers actually supplied by the source are preserved; T-039 semantic OCR fidelity and T-044 resumable raw-page storage remain open.

### T-051 Compact source-left workspace
T-051 supersedes T-050 panel positions: original/capture LEFT, OCR/explicit conversion/edit/export RIGHT. Source is independent; question navigation affects editor only. Source magnify/crop and editor insert/copy/export actions use icons with accessible names/title hints and active/disabled states; compact one-row toolbar, 12 pt badge, shortened OCR heading, secondary guidance hidden from visual toolbar. Conversion stays explicit and prominent. Source recognition/answer rules unchanged. Requirement R-001 -> T-051 -> features/r-001-browser.md -> SplitDocumentEditor/RichTextToolbar -> evidence/t051-verification.md.

### T-052 Table-choice layout and source-answer directives
T-052: numbered stem steps retain explicit line breaks including the following prompt; editor renders BR so live snapshot exports real paragraphs. Flattened table choice label prefixes before colons are underlined without HTML injection; values/separators remain literal. Explicit source answer directives accept colon/fullwidth colon, reconcile explanation ahead of source asterisk, and conflicting explicit keys remain unresolved. Existing orange star and green source shading appear immediately when converting. No inferred answers from handwriting, table ticks, absent answers or invalid choice keys. R-002/R-004 -> T-052 -> features/r-002-feature.md -> lib/exam-parser.ts and SplitDocumentEditor.tsx -> evidence/t052-verification.md.

Governance T-053 -> memory/decisions learning -> Weekly_Audit recurring contract -> evidence/t053-verification.md. No code or product behavior change.

### T-054 Merged stage-aware controls
T-054: tools absent during raw/loading/failed-conversion stage; after success RichTextToolbar is nested in conversion header above question navigation, no independent toolbar row. Icon names/title/disabled state retained. Validation count means issues, not distinct questions. E2E selection explicitly targets plain text: center-click plus Control+End is layout-dependent and can land inside bold heading, falsely testing bold toggle. Keep tests about intended edit operation, not accidental caret location.
R-001 -> T-054 -> features/r-001-browser.md -> SplitDocumentEditor/RichTextToolbar -> scripts/test-e2e.cjs -> evidence/t054-verification.md.

### T-055 Editable draft and crop handoff
T-055 changes readiness: structural issues no longer prevent an editable parsed draft; zero parsed questions still cannot create invented slots. Raw crop selector uses parsed navigation items; insertion first converts to draft then attaches to chosen live DOM after commit. Single top convert action replaces duplicate bottom action. Draft warnings remain outside editable/export content; export unavailable until live review passes. Review snapshot parses current edited text and checks actual attached images, source completeness and original-number retention without rerendering editor from stale items. Manual edits and inserted crops survive review. No missing choices or answers are synthesized.
R-001/R-002 -> T-055 -> browser/OCR feature -> app/page.tsx, SplitDocumentEditor.tsx -> evidence/t055-verification.md.

### T-056 / T-057 Source image captions and Gemini answer extraction
T-056: every inserted question image has [รูปโจทย์] above it, including toolbar and rich-text DOM paste; explicit user requirement supersedes the older caption-free skill rule. Capture/source DOM stays independent. Export snapshots include the caption.
T-057: Gemini is separate from fixed Typhoon OCR. Server-only GEMINI_API_KEY; configurable GEMINI_ANSWER_MODEL defaults gemini-3.8-flash. One bounded page request at a time per process; timeout 90 seconds, one bounded retry for Google503 or local429 after 1.5 seconds; failed pages reported without blocking later pages, no solving. Match source page, question id, stem, actual choice key; reject duplicate/conflicting candidates, confidence below 0.95, missing evidence or invalid normalized bbox. Preserve explicit parsed answers; render source-vision evidence outside export text. Analyze a fresh parse before publishing editable DOM, ignore stale upload/conversion responses, allow draft despite provider failure. Confidence is model-reported, not an accuracy certificate; handwritten X marks may be ambiguous and stay unanswered.
Lesson: models list HTTP200 does not prove generateContent works. Actual request returned404 for gemini-2.5-flash despite discovery listing it; Google restricts it for new users. Verify real generation before declaring provider ready. Evidence: evidence/t057-live-result.json; scripts/test-source-answers.cjs. Live completion gate still pending.
Requirement R-002/R-004 -> Task T-057 -> features/r-002-feature.md -> lib/source-answer-service.ts, lib/source-answer-client.ts, app/api/source-answers/route.ts, app/page.tsx, lib/formatter-rules.ts -> source-answer guards and live browser evidence. Bug T-056 -> existing browser feature -> components/SplitDocumentEditor.tsx -> caption/browser/export regressions.

Final 2026-10-11 handoff: T-056 Done; current shared completion gate exit0 and actual crop/link/DOM-paste/export-snapshot evidence/t056-result.json passed. T-057 In Progress: successful live fixture run21/25 source answers across4 pages retained in evidence/t057-live-result.json; latest recheck Google429 recorded in evidence/t057-provider-recheck.json. Do not overwrite success evidence with failure or claim stable provider readiness. Quota errors now stop all further page requests immediately, preserve already applied answers, and show Usage/Rate limits action; regression verifies one request only. Final feature gate covers code/UI/build, not quota availability or general handwriting accuracy. UI fixture Gemini mocks isolated from real-provider checks. Test selectors use accessible name ไปข้อ N or explicit editor caret, not bare visible digit. No new Google export/deployment certification.

### Local comparison T-058
Pilot compares qwen3-vl2b/4b locally without changing production. Existing source PNGs page1/page3 visually reviewed; truth labels are visible red annotation selections, NOT verified subject-answer correctness. Page1 truth1ก2ก3ง4ค5ง6ง; page3 truth11ง12ง13unmarked14ก15ข16ก17ข18ง19ค20ก. Sixteen unique questions with15 marked and1 abstention control; cold page1, warm page3, repeated warm page1 per model. Same source hashes/prompt/settings; precision/recall/wrong/missing/false-positive reported separately before and after existing0.95/bbox guards. Ollama /api/ps model residency and VRAM counters are sampled, not total process/system peak RAM. Evidence and raw responses retained under evidence/t058-local; scripts/benchmark-local-vision.cjs owns evaluation. Model downloads authorized by user; benchmark pending downloads. R-002/R-004 -> T-058 -> features/r-002-feature.md -> benchmark script -> actual local result files and comparison report. Pilot cannot certify production readiness, full-document conversion or general Thai OCR accuracy. T-057 Gemini still unchanged.

T-058 clarification: project owner directly confirmed on2026-10-12 that the tested red marks are teacher answers rechecked for correctness. For these fixture hashes only, the benchmark truth is a visually transcribed, teacher-verified key. Previous annotation-only caveat is superseded for this source, not for arbitrary future imports. Both candidate prompts use this same confirmation and still forbid solving or inventing answers. Independent auditor reviewed evaluator/comparison fairness; completeness, invalid rows, shared fingerprint, error exit and unobserved-memory guards now covered by tests. New evaluator wired into npm test. Model inference results still pending download; never report a winning model without actual matching-condition results.

T-058 final pre-inference dataset: expanded from2pages/16questions to3pages/20questions before any candidate inference, specifically including previously difficult table/diagram page2. Ground truth:19 teacher-marked answers and1 no-unique-choice control (Q13 Free). Pages1,2,3 plus repeated page1 for warm timing;4 runs/model. Both models receive actual reviewed question stems/keys matching production request fields, with no truth key leaked in requests. Preflight: node scripts/benchmark-local-vision.cjs qwen3-vl:2b --preflight passed20questions19marked; fixtures.json captures image hashes and owner confirmation. Completeness and denominators derive from manifest, not hardcoded reduced counts. This supersedes earlier16-question design notes. Await both downloads before timing; no production switch.

T-058 ROI verification checkpoint (2026-10-12): owner confirms teacher-rechecked red circles/crosses for this fixture. Visually inspected all three QA contact sheets: 20 question-owned original-pixel crops,19 marked keys and Q13 Free/no unique choice. QA labels are excluded from inference images. Experimental native loopback HTTP NDJSON transport added (scripts/local-vision-http.cjs); guards tested for UTF8, final metadata, incomplete stream, provider error and loopback-only scope. Metrics now match case IDs rather than first matching page, preventing repeated-page ROI truth contamination. Initial cropped 2B response completed in63.348s but captured empty content; preserved evidence/t058-roi/initial-stream-empty.json, no accuracy certification. Raw stream capture added for diagnosis. Both full-page failed baselines remain in evidence/t058-local. T-058 remains In Progress; production Gemini provider unchanged. Final actual comparison and finish-task gate pending.
T-058 runtime diagnosis: actual stream evidence shows schema JSON wholly in message.thinking with empty content despite thinkfalse. Diagnostic fallback is strictly JSON-only and experiment-only; preserve channel/chunks, never integrate as production response. First diagnostic2B q1 selected ข incorrectly with confidence0.95 (teacher truth ก); confidence alone unsafe. Transport tests passed. Evidence diagnostic-thinking-channel.json, ROI outputs. Full20case comparison ongoing.

T-064 Google Drive OAuth diagnostic & URL normalization -> features/r-003-google-doc-dirve.md -> lib/google-auth.ts, app/api/google/session/route.ts, components/GoogleDriveStatus.tsx -> scripts/test-google.cjs.


### T-066 QuizFlow conversion blueprint parity
Requirement R-002/R-004 -> Task T-066 -> parser/OCR feature note -> `lib/text-normalization.ts`, `lib/ocr-service.ts`, `lib/exam-parser.ts` -> synthetic regressions in `scripts/test-parser.cjs` and `scripts/test-ocr-contract.cjs` -> `evidence/t066-blueprint-parity.md` and `evidence/t066-verification.md`. External QuizFlow golden artifacts are absent, so the traceability claim is limited to deterministic rules evidenced in this repository.

### T-068 image conversion traceability
Requirement R-001/R-002 -> T-068 -> `app/page.tsx`, `lib/pdf-renderer.ts`, `scripts/test-e2e.cjs`, `scripts/sync-pdf-assets.cjs`, `public/pdf.worker.min.js`, `public/pdf-assets/` -> `evidence/t068-verification.md`.

### T-069 traceability
Requirement R-001/R-002 -> T-069 -> `lib/exam-parser.ts`, `app/page.tsx`, `scripts/test-parser.cjs` -> `evidence/t069-verification.md`. Answer provider quota remains linked to T-057 and is not silently bypassed by this parser fix.

### T-071 traceability
Portability requirement -> T-071 -> `scripts/check-environment.mjs`, `scripts/test-environment-check.cjs`, `.env.example`, `package.json`, `README.md` -> `evidence/environment-check.json` (when recorded). The handoff contract uses `git push`/`git clone`, `npm ci`, machine-local `.env.local`, and redacted environment checks; provider warnings are not treated as successful OCR/answer accuracy.

### T-070 / T-072 Google Cloud Vision OCR, Spatial Line Clustering, and Dynamic Version Stamping
Requirement R-001/R-002 -> Task T-070, T-072 -> Feature Note: [[features/r-001-browser]] -> Code: `lib/ocr-service.ts`, `lib/exam-parser.ts`, `lib/version.ts`, `scripts/stamp-version.cjs` -> Verification: `scripts/test-parser.cjs`, `scripts/test-ocr-contract.cjs`, `evidence/golden-output-ch7.txt`, `evidence/t070-golden-analysis.md`. All 13 pages processed in 34.6s with Google Cloud Vision OCR and 79/80 questions parsed end-to-end. Dynamic build timestamp badge stamps `YYMMDD-HHmm` on every build.

### T-073 Pro UX/UI Streamline, Decoupled Formatting, and Performance History
Requirement R-001/R-002/R-004 -> Task T-073 -> Feature Note: [[features/r-001-browser]] -> Code: `app/page.tsx`, `components/SplitDocumentEditor.tsx`, `components/StatisticsModal.tsx`, `lib/exam-parser.ts`, `lib/experiment-stats.ts` -> Verification: `scripts/test-parser.cjs`, `scripts/test-e2e.cjs`, `evidence/t045-experiments.json`, Next.js build stamp `261014-0938`. Conversion decoupled from Gemini AI Vision answers for instant <10ms formatting; prominent progress bar (`หน้า completed / total (pct%)`); sequential pulsing action animation; 10 recent runs performance modal; page-level scan leaking to Q1 fixed.

### T-074 Fix Detached OCR Enumeration Punctuation & Numeric Choice Collapse
Requirement R-002 -> Task T-074 -> Feature Note: [[features/r-002-feature]] -> Code: `lib/text-normalization.ts`, `lib/ocr-service.ts`, `lib/exam-parser.ts` -> Verification: `scripts/test-parser.cjs`, `scripts/test-e2e.cjs`. Detached punctuation (`1 . `, `ก . `) normalized and regexes made whitespace-tolerant; Chapter 7 Question 1 correctly captures stem and maps choices 1..4 to ก..ง rather than collapsing into empty questions.

### T-075 Dedicated Shared Context Formatting & Parsing for Grouped Exam Questions (โจทย์ร่วม)
Requirement R-002/R-004 -> Task T-075 -> Feature Note: [[features/r-002-feature]] -> Code: `lib/formatter-rules.ts`, `lib/exam-parser.ts`, `components/SplitDocumentEditor.tsx` -> Verification: `scripts/test-parser.cjs`, `npm test`, `npm run typecheck`, `npm run lint`, `scripts/test-e2e.cjs`. Detects shared scenario headers (`ใช้ข้อมูลในตารางต่อไปนี้ตอบคำถามข้อ 17 - 18`), buffers preambles and shared diagrams without dropping lines between questions, attaches structured shared context metadata, and renders dedicated Stormy Teal (`#006D77`) shared scenario containers ending with `จบโจทย์ร่วม` in full alignment with the QuizFlow Supreme Constitution.

### T-076 Dedicated Diagram/Table Harvesting Step & Multi-Target Region Snipping
Requirement R-002/R-004 -> Task T-076 -> Feature Note: [[features/r-002-feature]], [[features/r-004-feature]] -> Code: `lib/formatter-rules.ts`, `lib/diagram-service.ts`, `app/api/diagrams/route.ts`, `lib/diagram-client.ts`, `components/SplitDocumentEditor.tsx`, `app/page.tsx` -> Verification: `scripts/test-diagram-contract.cjs`, `npm test`, `npm run typecheck`, `npm run lint`, `node scripts/test-e2e.cjs`. Added Step 3 "สกัดรูปประกอบ (AI)" in pipeline between formatting and answer checking; implemented Gemini Vision bbox extraction for framed figures, data tables, apparatus diagrams, choice images, and solution figures; implemented in-browser Canvas cropping with 4px border clearance; updated manual Region Snipping modal with question and role selectors (`รูปโจทย์`, `รูปโจทย์ร่วม`, `รูปตัวเลือก ก-ง`, `รูปคำอธิบาย`); rendered choice and explanation images.

### T-078 Multi-Key Provider Quota Fallback Pool (API#1, API#2, API#3)
Requirement R-001/R-002 -> Task T-078 -> Feature Note: [[features/r-001-browser]] -> Code: `lib/api-key-manager.ts`, `lib/diagram-service.ts`, `lib/source-answer-service.ts`, `lib/ocr-service.ts` -> Verification: `scripts/test-provider-keys.cjs`, `npm test`, `node scripts/test-e2e.cjs`. Automatic fallback pool supporting primary + `API_KEY_2`, `API_KEY_3` and delimited strings; `executeWithKeyRotation` catches HTTP 429/403 and quota exhaustion, rotating to backup keys automatically while isolating non-quota client errors.

### T-079 Document Draft & OCR Cache Persistence, Apparatus Diagram Inclusivity, Step Icon Timeline & 30-Per-Row Nav
Requirement R-001/R-002/R-004 -> Task T-079 -> Feature Note: [[features/r-001-browser]], [[features/r-002-feature]] -> Code: `lib/document-draft-store.ts`, `lib/diagram-service.ts`, `lib/diagram-client.ts`, `components/SplitDocumentEditor.tsx`, `app/page.tsx` -> Verification: `scripts/test-document-drafts.cjs`, `npm test`, `npm run typecheck`, `npm run lint`, `node scripts/test-e2e.cjs`. Client-side localStorage persistence for OCR text, formatted items, attached diagrams, and answers keyed by document hash/size; 1-click restore banner and "แบบร่าง & แคช" modal; apparatus diagram detection prompt instructing full inclusivity of surrounding text callouts and leader lines; adaptive canvas crop padding (min 12px, up to 24px); right-panel header text buttons transformed into compact Icon Timeline with status dots and tooltips; question navigation strip chunks into rows of 30 buttons.

### T-080 Captured Text Deduplication, 12pt Standard Typography, and Connected Stepper Timeline
Requirement R-001/R-002/R-004 -> Task T-080 -> Feature Note: [[features/r-001-browser]], [[features/r-002-feature]], [[features/r-004-feature]] -> Code: `lib/exam-parser.ts`, `lib/diagram-client.ts`, `components/SplitDocumentEditor.tsx`, `scripts/test-parser.cjs` -> Verification: `scripts/test-parser.cjs`, `npm test`, `npm run typecheck`, `npm run lint`, `node scripts/test-e2e.cjs`. Strips redundant OCR table text when shared figure diagrams are harvested while preserving directive prompts and narrative procedures (`stripCapturedTableText`); clears redundant choice text when visual choice images are harvested; enforces 12pt standard typography (`text-[12pt]`, Sarabun) across all editor elements; transforms pipeline header step controls into an accessible horizontal connected stepper with thin connector lines, checkmark status badges, pulsing animations, and comfortable spacing.

### T-081 Unbounded Stepper Resizing, Full Table Boundary Inclusivity, and Table Row Stripping
Requirement R-001/R-002/R-004 -> Task T-081 -> Feature Note: [[features/r-001-browser]], [[features/r-002-feature]], [[features/r-004-feature]] -> Code: `lib/diagram-service.ts`, `lib/diagram-client.ts`, `lib/exam-parser.ts`, `components/SplitDocumentEditor.tsx`, `scripts/test-parser.cjs` -> Verification: `scripts/test-parser.cjs`, `npm test`, `npm run typecheck`, `npm run lint`, `node scripts/test-e2e.cjs`. Removes the outer rounded rectangle wrapper border from the Stepper Timeline and resizes buttons to sleek proportions (`w-6 h-6 sm:w-6.5 sm:h-6.5`); mandates 100% complete outer table boundaries in Gemini system prompt to start safely above the top border stroke; adds top padding bonus in `cropBboxFromImage` preventing table frame clipping; enhances `stripCapturedTableText` with Thai-safe boundaries to eliminate leaked table rows while preserving narrative procedures.

### T-082 Smart Table Edge Trimming, Configurable Safe Margins, and Skew Tolerance
Requirement R-001/R-002/R-004 -> Task T-082 -> Feature Note: [[features/r-001-browser]], [[features/r-002-feature]] -> Code: `lib/diagram-client.ts`, `components/SplitDocumentEditor.tsx`, `scripts/test-diagram-contract.cjs` -> Verification: `scripts/test-diagram-contract.cjs`, `npm test`, `npm run typecheck`, `npm run lint`, `node scripts/test-e2e.cjs`. Implements `trimIntruderTextAndMargin` in `lib/diagram-client.ts` to detect whitespace gutters and trim away outer text lines (above and below tables), enforcing a clean 2-3px safe margin that absorbs slight tilt/skew; adds status label in Region Snipping modal; documents GitHub Desktop local repository registration.

### T-083 New Machine Development Environment Onboarding
Portability/development-readiness requirement -> Task T-083 -> Feature Note: existing environment portability contract from T-071 -> Code/Tools: `.env.example`, `package-lock.json`, `scripts/check-environment.mjs`, `scripts/bootstrap-local.ps1`, `scripts/finish-task.mjs` -> Verification: `evidence/t083-new-machine-checklist.md`, `evidence/environment-check.json`, `npm ci --no-audit --no-fund`, `npm test`, `npm run typecheck`, `npm run lint`, `npm run test:e2e`, and `npm run build`. Machine `DESKTOP-FNVSAKS` is ready for local development and regression testing after dependency install; provider-backed OCR, Gemini answer/diagram extraction, and Google Drive export remain blocked until local secrets are added to `.env.local`.

### T-084 Complete Figure Crop Coverage and Shared-Question Render Order
Requirement R-002/R-004 -> Task T-084 -> Feature Note: [[features/r-002-feature]], [[features/r-004-feature]] -> Code: `lib/diagram-client.ts`, `lib/diagram-service.ts`, `components/SplitDocumentEditor.tsx`, `scripts/test-diagram-contract.cjs` -> Verification: `scripts/test-diagram-contract.cjs`, `scripts/test-parser.cjs`, `npm test`, `npm run typecheck`, `npm run lint`, `node scripts/test-e2e.cjs`. Question/apparatus figure crops now use wider padding and bypass table-focused smart trimming so bottom/right apparatus labels remain inside the capture; table/shared-context crops retain smart gutter trimming. The editor renders the requested order with explicit `โจทย์ร่วม:`, `รูปโจทย์ร่วม:`, `รูปโจทย์:`, `ตัวเลือก:`, optional `คำอธิบาย:` text, optional `รูปคำอธิบาย:`, then `จบโจทย์ร่วม`.

### T-085 Duplicate Question-Image Label Removal and Apparatus Margin Expansion
Requirement R-002/R-004 -> Task T-085 -> Feature Note: [[features/r-002-feature]], [[features/r-004-feature]] -> Code: `components/SplitDocumentEditor.tsx`, `lib/diagram-client.ts`, `scripts/test-diagram-contract.cjs` -> Verification: `scripts/test-diagram-contract.cjs`, `npm test`, `npm run typecheck`, `npm run lint`, `node scripts/test-e2e.cjs`. Managed question images now render only `รูปโจทย์:` and the DOM auto-label guard recognizes that heading, preventing legacy `[รูปโจทย์]` duplication. Question/apparatus crop padding is widened to preserve bottom/right labels; shared-context table trim behavior remains unchanged.

### T-086 Tight Question-Figure Bottom Trimming and Visible Build Stamp
Requirement R-001/R-002/R-004 -> Task T-086 -> Feature Note: [[features/r-001-browser]], [[features/r-002-feature]], [[features/r-004-feature]] -> Code: `lib/diagram-client.ts`, `scripts/test-diagram-contract.cjs`, `package.json`, `app/page.tsx`, `lib/version.ts` -> Verification: `scripts/test-diagram-contract.cjs`, `npm test`, `npm run typecheck`, `npm run lint`, `node scripts/test-e2e.cjs`. Question/apparatus crops now preserve top captions while applying bottom-only gutter trimming to remove neighboring option text below figures, addressing Q80-style overcapture. Development startup now stamps the visible build number via `predev`, and final builds preserve the new `APP_VERSION`/`BUILD_STAMP` so the header reflects each implementation pass.

### T-087 Editable Draft Resume and Earth-Tone Draft Modal
Requirement R-001/R-004 -> Task T-087 -> Feature Note: [[features/r-001-browser]], [[features/r-004-feature]] -> Code: `app/page.tsx`, `components/SplitDocumentEditor.tsx`, `lib/document-draft-store.ts`, `scripts/test-document-drafts.cjs` -> Verification: `scripts/test-document-drafts.cjs`, `npm test`, `npm run typecheck`, `npm run lint`, `node scripts/test-e2e.cjs`. Saved drafts can now open as active editable working sessions even without reimporting the source file; existing editor DOM snapshots restore exact manual edits and autosave future editor input back into the same draft. OCR-only history opens into a raw-review continuation path, and the drafts modal uses the established earth-tone surface/actions.

### T-088 Keep Source Pane Original-Only for Comparison, Capture, and Magnifier
Requirement R-001/R-004 -> Task T-088 -> Feature Note: [[features/r-001-browser]], [[features/r-004-feature]] -> Code: `components/SplitDocumentEditor.tsx`, `scripts/test-document-drafts.cjs` -> Verification: `scripts/test-document-drafts.cjs`, `npm test`, `npm run typecheck`, `npm run lint`. Ensures left source pane never displays raw OCR text or fallback text when drafts are resumed without an original PDF/image, providing a clean earth-tone placeholder prompting the user to reimport for visual comparison/capture.

### T-089 Robust Diagram Gutter Trimming & Adaptive Margins (Fix Q43/Q80 Over-Crop & Q16 Choice Under-Crop)
Requirement R-002/R-004 -> Task T-089 -> Feature Note: [[features/r-002-feature]], [[features/r-004-feature]] -> Code: `lib/diagram-client.ts`, `lib/diagram-service.ts`, `scripts/test-diagram-contract.cjs` -> Verification: `scripts/test-diagram-contract.cjs`, `npm test`, `npm run typecheck`, `npm run lint`, `node scripts/test-e2e.cjs`. Solves oscillation by replacing hardcoded `y < 16` offsets with a robust content-aware gutter scanner that detects isolated text lines (height <= 36px) across outer 35% zones regardless of padding depth; enables top and bottom trimming for questions (removing Q42 options from Q43 and question stem/choices from Q80); expands choice padding to 20px (preserving Q16 crystal vertices); expands question lateral padding up to 36px (preserving Q80 right-hand annotations "สารละลายส่วนบน", "สารละลายส่วนล่าง").

### T-090 Vercel Deployment Configuration & Cloud Environment Readiness
Deployment / Cloud Platform Requirement -> Task T-090 -> Feature Note: [[features/r-001-browser]], [[features/r-003-google-doc-dirve]] -> Code: `vercel.json`, `app/api/diagrams/route.ts`, `app/api/ocr/route.ts`, `app/api/source-answers/route.ts`, `app/api/google/export/route.ts`, `.env.example` -> Verification: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`, `node scripts/finish-task.mjs T-090`. Configures `vercel.json` and 60-second serverless execution timeouts on long-running AI/OCR routes; synchronizes pre-bundled PDF.js assets; documents cloud environment variables and Google Cloud OAuth production redirect URI.


### T-091 Thai system feature catalog and open verification register

Requirement R-001/R-002/R-003/R-004 -> Task T-091 -> `documents/feature-catalog.md` -> implementation references in `app/page.tsx`, `components/SplitDocumentEditor.tsx`, `components/RichTextToolbar.tsx`, `lib/file-parser.ts`, `lib/ocr-service.ts`, `lib/exam-parser.ts`, `lib/diagram-service.ts`, `lib/diagram-client.ts`, `lib/source-answer-service.ts`, `lib/document-draft-store.ts`, `lib/experiment-stats.ts`, and `lib/google-export.ts` -> verification commands and real-file evidence listed in the catalog. The catalog explicitly separates implemented behavior from provider/configuration-dependent behavior and keeps a 20-item open-verification register; no universal OCR, answer, crop, or export accuracy is claimed.

### T-092 Q80 figure crop and spacious editor controls
Requirement R-002/R-004 -> Task T-092 -> Feature Notes: `features/r-002-feature.md`, `features/r-004-feature.md` -> Code: `lib/diagram-client.ts`, `lib/diagram-service.ts`, `components/SplitDocumentEditor.tsx`, `scripts/test-diagram-contract.cjs` -> Verification: production crop detector contract, full unit/contract suite, typecheck, lint, build, E2E/browser evidence when the source fixture is available, and `node scripts/finish-task.mjs T-092`. The current fixture verifies removal of top/bottom intruders and the UI spacing contract; provider-backed Q80 browser confirmation remains required before declaring universal crop accuracy.

### T-093 exact Q80 source-PDF Vision UAT
Requirement R-002 -> Confirmation Task T-093 -> Evidence: `evidence/t093-q80-source-uat.md` (to be created by the real-file run). This is deliberately separated from the deterministic T-092 implementation so a provider/quota failure cannot be mistaken for a crop-code regression.

### T-094 compact OCR workspace layout
Requirement R-001/R-004 -> Task T-094 -> Feature Notes: `features/r-001-browser.md`, `features/r-004-feature.md` -> Code: `components/SplitDocumentEditor.tsx`, `scripts/test-e2e.cjs` -> Verification: compact layout data markers, 80-question navigation count, source-left/editor-right E2E, typecheck, lint, unit tests, build, knowledge drift/vault checks, and `node scripts/finish-task.mjs T-094`.

### T-095 active question-window navigation
Requirement R-001/R-004 -> Task T-095 -> Feature Notes: `features/r-001-browser.md`, `features/r-004-feature.md` -> Code: `components/SplitDocumentEditor.tsx`, `app/globals.css`, `scripts/test-e2e.cjs` -> Verification: deterministic 80-question visible sequences for active 1/10/20, keyboard/source stability, reduced-motion CSS contract, full tests, build, knowledge checks, and `node scripts/finish-task.mjs T-095`.

### T-096 first-question navigation anchor
Requirement R-001/R-004 -> Task T-096 -> Feature Notes: `features/r-001-browser.md`, `features/r-004-feature.md` -> Code: `components/SplitDocumentEditor.tsx`, `scripts/test-e2e.cjs` -> Verification: first-question anchor in active 10/20/60/80 windows, no duplicate in the first window, non-1 first-question and short-document guards, full tests, build, knowledge checks, and `node scripts/finish-task.mjs T-096`.

### T-097 compact status rail and automatic answer action
Requirement R-001/R-004 -> Task T-097 -> Feature Notes: `features/r-001-browser.md`, `features/r-004-feature.md` -> Code: `app/page.tsx`, `components/SplitDocumentEditor.tsx`, `scripts/test-e2e.cjs` -> Verification: stable compact status/icon-stepper geometry, no duplicate workspace alert, answer-analysis callback on image-backed fixture, full tests, build, knowledge checks, and `node scripts/finish-task.mjs T-097`.


### T-098 AI answer fallback when source key is absent
Requirement R-001/R-004 -> Task T-098 -> Feature Notes: [[features/r-001-browser]], [[features/r-004-feature]] -> Code: `lib/source-answer-client.ts`, `lib/ai-answer-service.ts`, `app/api/ai-answers/route.ts`, `app/page.tsx`, `components/SplitDocumentEditor.tsx`, `scripts/test-source-answers.cjs`, `scripts/test-e2e.cjs` -> Verification: source/AI answer contracts, browser click flow with mocked empty source-answer response and AI fallback, full tests, typecheck, lint, build, knowledge checks, and `node scripts/finish-task.mjs T-098`. The source Vision path remains abstention-only and AI solving runs only on unresolved questions, recording `ai_generated` provenance and review evidence without overwriting source answers.

### T-099 Automatic Ollama readiness before local OCR
Local OCR usability requirement -> Task T-099 -> Feature Note: `features/r-001-browser.md` -> Code: `lib/ollama-runtime.ts`, `app/api/ocr/route.ts`, `scripts/test-ollama-runtime.cjs` -> Verification: runtime contract, full unit/contract suite, typecheck, lint, build, local executable/endpoint smoke when available, and `node scripts/finish-task.mjs T-099`. Scope explicitly excludes Ollama installation/model download and remote provider startup.

### T-100 Review/export media preservation
Requirement R-002/R-004 (media ownership and export fidelity) -> Task T-100 -> Feature Note: [[features/r-001-browser]] -> Code: `app/page.tsx`, `components/SplitDocumentEditor.tsx`, `lib/export-document.ts`, `scripts/test-e2e.cjs`, `scripts/test-google.cjs` -> Verification: live-DOM review regression, four-role Google export media regression, `npm test`, typecheck, lint, E2E, build and `node scripts/finish-task.mjs T-100` -> Evidence: `evidence/t100-verification.md`, `evidence/qa-iteration-2/results.json`.

