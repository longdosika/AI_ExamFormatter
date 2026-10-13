# Traceability
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

