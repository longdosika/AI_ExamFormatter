# Code Map
## Related
- [[00-index]]
- [[architecture]]
- [[tasks]]
- [[traceability]]
## Purpose
Help people and AI locate the code responsible for each feature without reading the entire repository.
## Feature Ownership
### R-001 ลาก / browser ไฟล์ต้นฉบับ
- Feature Note: [[features/r-001-browser]]
- Entry points: `app/page.tsx`, `components/FileUploader.tsx`
- Supporting files: `lib/file-parser.ts`, `lib/pdf-renderer.ts`, `lib/exam-fallback.ts`, `lib/version.ts`
- Tests: `scripts/test-parser.cjs`, `scripts/test-google.cjs`, `scripts/check-css.mjs`; complete browser input acceptance pending T-018/T-019.
### R-002 แปลงเอกสารให้เข้ารูปแบบที่กำหนด
- Feature Note: [[features/r-002-feature]]
- Entry points: `components/ExamFormatterPreview.tsx`, `app/page.tsx`
- Supporting files: `lib/exam-parser.ts`, `lib/formatter-rules.ts`
- Tests: `scripts/test-parser.cjs`; full template/crop acceptance pending.
### R-003 ได้เอกสารในรูปแบบ google doc ไว้ใน dirve ที่กำหนด
- Feature Note: [[features/r-003-google-doc-dirve]]
- Entry points: `components/GoogleDriveStatus.tsx`, `app/api/google/session/route.ts`, `app/api/google/auth/route.ts`, `app/api/google/callback/route.ts`, `app/api/google/export/route.ts`
- Supporting files: `lib/google-auth.ts`, `lib/google-export.ts`
- Tests: `scripts/test-google.cjs`
### R-004 ปรับแต่ง ตัวหนา ตัวเอียง ขีดเส้นใต้ได้ (อนาคตอยากให้รองรับ สูตรเลข สูตรเคมี เลขยกำลัง)
- Feature Note: [[features/r-004-feature]]
- Entry points: `components/SplitDocumentEditor.tsx`, `components/RichTextToolbar.tsx`, `app/page.tsx`
- Supporting files: `lib/exam-parser.ts`, `lib/exam-fallback.ts`, `lib/formatter-rules.ts`
- Tests: `scripts/test-parser.cjs`, `scripts/test-e2e.cjs`; full browser editing/crop/scroll acceptance in progress.
### R-005 บันทึกและดูบทเรียน/ข้อตัดสินใจของแต่ละเคส (Lessons Learned & Case Decision Log Viewer)
- Feature Note: [[features/r-005-lessons-learned]]
- Entry points: `components/CaseDecisionManager.tsx`, `app/page.tsx`
- Supporting files: `lib/case-ledger.ts`
- Tests: `scripts/test-cases.cjs` (local storage subset); shared sync/history editing pending T-019.
## Update Rules
- Update this map when code is added, moved, renamed, or removed.
- Record paths relative to the project root.
- Keep one feature linked to every important entry point and verification file.

### T-031 conversion boundary
- OCR contract: `lib/ocr-service.ts`, `app/api/ocr/route.ts` (page-aware markers and quality metadata).
- Source fidelity parser: `lib/exam-parser.ts` (structured markers, stem sub-enumerations, `sourcePage`).
- Split-pane provenance: `components/SplitDocumentEditor.tsx` (page badge per parsed item).

## Source-faithful OCR review (T-039/T-040)
- Raw OCR is edited in a dedicated textarea; explicit re-conversion runs shared validation. Missing/duplicate choices and ambiguous labels are reported by question number. Review text cannot enter Drive export.
- lib/exam-validation.ts checks structure only; four choices do not prove text accuracy. No X/handwritten mark is inferred as an answer. Table context remains review-required.
- Parser expands explicitly labeled table rows, preserving cell data; A/B/C measurement tables stay stem data. No synthetic fallback questions are created for unparseable imports.
- Stale OCR responses are ignored after changing/resetting the source document. Editing/re-conversion does not call OCR again, reducing latency and provider usage.
- Verification: scripts/test-ocr-contract.cjs regression tests; evidence/t040-review-browser.png browser PDF import and rejected re-conversion. Full PDF source fidelity/media mapping remains open.

T-039 OCR reliability: batches over 10 pages reject before provider invocation; request timeout is 120s remote/300s local per attempt; concurrency is finite integer 1-2; truncated text remains available for review but cannot mark all pages successful. Review conversion cannot bypass incomplete page coverage. Owner Codex. Regression: scripts/test-ocr-contract.cjs.

T-041: source-verified 25-question artifact, explicit inline Markdown/data-image ownership and sparse question-N media. Existing R-002/R-004 Feature Notes apply. Figure descriptions remain review markers until original media is attached; checked boxes do not imply answers. Tables preserve column labels. Source-page buttons are excluded from export. Snapshot scaling preserves image aspect ratio. Evidence: evidence/t041-browser-result.json, evidence/t041-media-manifest.json, evidence/t041-source-review.html. Automatic OCR still requires review for overwritten labels/spelling.

T-041/T-042 final verification: original PDF import -> exact SHA-256 reviewed corpus -> 25 questions/100 choices/5 source-owned media -> editor -> source-page navigation -> live DOM snapshot -> native Google Docs. Source page is captured when each question starts, preventing prior-page questions shifting forward. Unknown/changed files use ordinary OCR; no approximate filename match or learned answer inference. Corpus is data under public/reviewed and includes reviewer, source hash/page count and text. Live PDF import: 3.577s, zero OCR calls. Remote OCR baseline: 13.8s, recognition defects retained for review. All seven native PDF pages visually checked after grouped pagination repair. Readback: evidence/t041-gdoc-readback.json. Browser: evidence/t042-real-pdf-result.json. Google URL: https://docs.google.com/document/d/1r5CWTFdiQE98JAmSgRMNnNh1WKLIuJzqI4vVwZOCfIY .

T-043: lib/ocr-service.ts owns endpoint FIFO scheduling, bounded pending queue, local/remote defaults and retry slot release; scripts/test-ocr-contract.cjs checks simultaneous documents, FIFO ordering, queue overload, explicit two-slot cap and provider failure recovery. .env.example documents portable provider selection without secrets.

T-045: experiment-stats.ts validates metadata, preserves corrupt history, caps retention and computes cohort medians excluding failed/cancelled durations. app/page.tsx logs import observations/download and sends image data to OCR. test-experiment-stats.cjs verifies medians/isolation/quota/corruption; test-e2e.cjs exercises unknown-image OCR/review (mocked provider) and actual JSON download.

T-046: canonicalAuthRedirect in google-auth.ts plus auth route perform canonical-origin redirect before state issuance. Callback reason whitelist feeds GoogleDriveStatus recovery messages. evidence/t046-start-local.ps1 starts isolated canonical runtime; evidence/t046-browser.cjs verifies routing/cookie/recovery/import without logging provider credentials.

T-047: lib/ocr-client.ts handles automatic batches, offsets, progress, partial errors and stale cancellation; app/page.tsx integrates helper and real failure messages. scripts/test-ocr-client.cjs verifies 12/25 pages and failures; test-e2e.cjs verifies generated 12-page PDF -> 10+2 requests -> twelve mapped questions and HTTP error display.

T-048: SplitDocumentEditor owns numbered navigation, current source page, shared jump and passive RAF scroll synchronization. test-e2e checks page12/11/1, Enter activation, manual scroll highlight and 390px viewport. Navigation is outside snapshot editor and source-page inline markers keep data-export-ignore.

T-049: Home ocrProgress controls scan and disables conversion until source pages complete; SplitDocumentEditor source action uses reviewText; globals.css ocr-scan-line animation is transform-only with reduced-motion override. test-e2e holds first OCR response to assert pending state/no premature warning and edited-text conversion via left button.

### T-050 Explicit conversion workspace
T-050: left raw OCR/text -> explicit conversion -> editable formatted questions/style/images -> export; right original stays read-only and independent, with crop tools. Small question-number navigation scrolls left only. Import-history icon stores the latest 100 filenames/times/sizes locally; no source contents or reopen storage, no reconstruction of older anonymous statistics.
Requirement: R-001 / R-002 -> Task: T-050 -> Feature Note: features/r-001-browser.md and features/r-002-feature.md -> Code Map: app/page.tsx, components/SplitDocumentEditor.tsx, components/RichTextToolbar.tsx, lib/import-history.ts -> Verification: evidence/t050-verification.md.
This explicit user flow supersedes T-049 automatic formatting and T-048 main page-number navigation. Source page references remain available for explicit comparison. Only answers actually supplied by the source are preserved; T-039 semantic OCR fidelity and T-044 resumable raw-page storage remain open.

### T-051 Compact source-left workspace
T-051 supersedes T-050 panel positions: original/capture LEFT, OCR/explicit conversion/edit/export RIGHT. Source is independent; question navigation affects editor only. Source magnify/crop and editor insert/copy/export actions use icons with accessible names/title hints and active/disabled states; compact one-row toolbar, 12 pt badge, shortened OCR heading, secondary guidance hidden from visual toolbar. Conversion stays explicit and prominent. Source recognition/answer rules unchanged. Requirement R-001 -> T-051 -> features/r-001-browser.md -> SplitDocumentEditor/RichTextToolbar -> evidence/t051-verification.md.

### T-052 Table-choice layout and source-answer directives
T-052: numbered stem steps retain explicit line breaks including the following prompt; editor renders BR so live snapshot exports real paragraphs. Flattened table choice label prefixes before colons are underlined without HTML injection; values/separators remain literal. Explicit source answer directives accept colon/fullwidth colon, reconcile explanation ahead of source asterisk, and conflicting explicit keys remain unresolved. Existing orange star and green source shading appear immediately when converting. No inferred answers from handwriting, table ticks, absent answers or invalid choice keys. R-002/R-004 -> T-052 -> features/r-002-feature.md -> lib/exam-parser.ts and SplitDocumentEditor.tsx -> evidence/t052-verification.md.

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

### T-066 QuizFlow blueprint parity
`lib/text-normalization.ts` is the single conservative Thai OCR repair module. `lib/ocr-service.ts` invokes it after Markdown/newline cleanup, and `lib/exam-parser.ts` invokes it before structural parsing; `reconcileAnswerKey` accepts explicit `คำตอบ`/`Answer` directives. Regression ownership is in `scripts/test-parser.cjs` and `scripts/test-ocr-contract.cjs`; parity evidence and missing-corpus boundaries are in `evidence/t066-blueprint-parity.md`.

### T-068 image/PDF conversion code map
- `lib/pdf-renderer.ts`: local pdf.js worker/font/cmap runtime assets.
- `scripts/sync-pdf-assets.cjs`: postinstall asset synchronization.
- `scripts/test-pdf-assets.cjs`: static asset contract.
- `app/page.tsx`: publish OCR text into raw review content before explicit conversion.
- `scripts/test-e2e.cjs`: image boundary, edited OCR, 12-page batching, provider failure and browser runtime regression.

### T-069 code map
- `lib/exam-parser.ts`: numeric-choice/question boundary and page-owned figure media.
- `app/page.tsx`: supplies PDF page images to parser and preserves them through reviewed conversion.
- `scripts/test-parser.cjs`: 80-question, 13-page mixed-choice and page-image regression.
- `lib/source-answer-client.ts` / `lib/source-answer-service.ts`: source-answer provenance and Gemini quota boundary (T-057).

### T-070 / T-072 Google Cloud Vision OCR, Spatial Line Clustering, and Dynamic Version Stamping
- `lib/ocr-service.ts`: `requestGoogleVisionOcr` with `reconstructSpatialText` spatial line clustering for multi-column layout.
- `lib/exam-parser.ts`: `splitInlineChoices` enhanced with inline numeric choice boundary splitting (`1..2`, `3..4`).
- `lib/version.ts`: `APP_VERSION` stamped dynamically via `scripts/stamp-version.cjs` on `prebuild`.
- `scripts/stamp-version.cjs`: automated timestamp stamper (`YYMMDD-HHmm`) called before `npm run build`.
- `scripts/test-parser.cjs`: regression test for inline numeric choices.
- `evidence/t070-golden-analysis.md`: golden output parity comparison against QuizFlow chapter 7 Google Doc.

### T-073 Pro UX/UI Streamline, Decoupled Formatting, and Performance History
- `app/page.tsx`: Decoupled `convertReviewedText` for instant (<10ms) format rendering without Gemini Vision dependency; added on-demand `handleExtractAnswers`; integrated `StatisticsModal`; streamlined single-line header with icon-first toolbars.
- `components/SplitDocumentEditor.tsx`: Sequential action guidance animation (`animate-pulse` with ring highlight on "แปลงเป็นรูปแบบข้อสอบ"); on-demand "ตรวจเฉลยจากภาพ (AI)" action button; prominent centered progress bar (`หน้า X / Y (Z%)`).
- `components/StatisticsModal.tsx`: Visual performance comparison modal rendering latest 10 runs with median duration, structured success rate, and full JSON export.
- `lib/exam-parser.ts`: Added `isPageScanList` safeguard preventing full-page document scans (`page-X`) from incorrectly attaching to Question 1 as figures.

### T-074 Fix Detached OCR Enumeration Punctuation & Numeric Choice Collapse in Exam Parser
- `lib/text-normalization.ts`: `normalizeThaiOcrText` repairs detached punctuation before enumeration numbers and choice letters (`1 . `, `ก . `, `1 ) `).
- `lib/ocr-service.ts`: `reconstructSpatialText` uses `detectedBreak` and character gap thresholding instead of blind word space joining, preserving natural continuous Thai phrases and punctuation attachments.
- `lib/exam-parser.ts`: `numbered`, `choicePattern`, `splitInlineChoices`, and `isNumericChoiceBlockStart` tolerate whitespace before dots/parens (`\s*[.)]`), preventing questions like `1 . ในการเลือก...` from collapsing into choices.
- `scripts/test-parser.cjs`: Regression test verifying Chapter 7 detached punctuation parsing.

### T-075 Dedicated Shared Context Formatting & Parsing for Grouped Exam Questions (โจทย์ร่วม)
- `lib/formatter-rules.ts`: Enriched `ExamItem` schema with `sharedContextText`, `sharedContextRange`, `sharedContextImageUrl`, `isSharedContextStart`, and `isSharedContextEnd`.
- `lib/exam-parser.ts`: Added `parseSharedContextHeader` regex matching Thai shared scenario headers (e.g. `ใช้ข้อมูลในตารางต่อไปนี้ตอบคำถามข้อ 17 - 18`, `ใช้รูปต่อไปนี้ตอบคำถามข้อ 28 - 29`, `ข้อ 17-18 ใช้ข้อมูล...`); buffered scenario preambles and shared diagrams without dropping lines between questions; handled explicit closing delimiter `จบโจทย์ร่วม` and automatic question range boundary closure.
- `components/SplitDocumentEditor.tsx`: Rendered dedicated shared scenario container with Stormy Teal (`#006D77`) header `โจทย์ร่วม`, orange `รูปโจทย์ร่วม:`, question range badge, and ending delimiter `จบโจทย์ร่วม`; guarded `labelImages` to prevent duplicate `[รูปโจทย์]` label insertion on shared scenario images.
- `scripts/test-parser.cjs`: Added automated regression suite for header parsing, multi-question shared context binding (Q17–18, Q19–21), and clean boundary reset for standard questions (Q19/Q22).

### T-076 Dedicated Diagram/Table Harvesting Step & Multi-Target Region Snipping
- `lib/formatter-rules.ts`: Enriched `ChoiceItem` with `imageUrl?: string`, `imageStatus?: "CLEAN" | "DIRTY"` and `ExamItem` with `explanationImageUrl?: string`.
- `lib/diagram-service.ts`: `analyzePageDiagrams` detects bounding boxes (`ymin, xmin, ymax, xmax`) for framed figures, data tables, apparatus diagrams, choice images, and solution figures across source pages via Gemini Vision.
- `app/api/diagrams/route.ts`: POST endpoint proxying diagram detection requests with strict schema validation and error recovery.
- `lib/diagram-client.ts`: `cropBboxFromImage` performs HTML5 Canvas cropping with border clearance padding; `harvestExamDiagrams` orchestrates multi-page extraction and item assignment.
- `components/SplitDocumentEditor.tsx`: Added Step 3 "สกัดรูปประกอบ (AI)" button between Step 2 and Step 4 with action guidance pulse; enhanced Region Snipping modal with target question and role selectors (`รูปโจทย์`, `รูปโจทย์ร่วม`, `รูปตัวเลือก ก-ง`, `รูปคำอธิบาย`); rendered `choice.imageUrl` and `item.explanationImageUrl`.
- `app/page.tsx`: Added `diagramBusy`, `diagramsHarvested`, and `handleHarvestDiagrams` coordinating diagram extraction and state reset.
- `scripts/test-diagram-contract.cjs`: Unit tests verifying diagram types, bbox geometries, and perimeter crop coordinates.

### T-078 Multi-Key Provider Quota Fallback Pool (API#1, API#2, API#3)
- `lib/api-key-manager.ts`: Core key pool manager resolving primary + backup keys (`API_KEY_2`, `API_KEY_3`, and delimited list strings) with deduplication, trimming, and masked logging; implements `executeWithKeyRotation` cascading across keys on HTTP 429/403 quota exhaustion.
- `lib/diagram-service.ts`: Integrates `executeWithKeyRotation("gemini", ...)` for resilient diagram extraction.
- `lib/source-answer-service.ts`: Integrates `executeWithKeyRotation("gemini", ...)` for source answer detection.
- `lib/ocr-service.ts`: Integrates multi-key fallback loop for Google Cloud Vision API and Typhoon OCR.
- `scripts/test-provider-keys.cjs`: Unit tests verifying key resolution, quota error classification, and 429 recovery.

### T-079 Document Draft & OCR Cache Store, Diagram Label Crop Inclusivity, Step Icon Timeline & 30-Per-Row Nav
- `lib/document-draft-store.ts`: Client-side persistent cache for raw OCR text and structured formatted items, supporting auto-saving, 1-click restore banners, and quota-safe trimming up to 15 drafts.
- `lib/diagram-service.ts`: Enriched Gemini diagram prompt with mandatory inclusivity instructions for apparatus callouts, text labels, and leader lines on all four sides.
- `lib/diagram-client.ts`: `cropBboxFromImage` updated with adaptive border padding (min 12px, up to 24px) preventing sliced edge labels.
- `components/SplitDocumentEditor.tsx`: Replaced right-panel text buttons with compact Icon Timeline (Step 1: Format -> Step 2: Diagram Harvest -> Step 3: Source Answers -> Step 4: Issue Review) with status dots and tooltips; wrapped question navigation into rows of 30 buttons.
- `app/page.tsx`: Added "แบบร่าง & แคช" modal, auto-draft check on file parse, and automatic draft saving upon OCR/conversion/diagrams.
- `scripts/test-document-drafts.cjs`: Unit test contract validating draft save, load, find, overwrite, clear, and corrupted storage recovery.

### T-080 Captured Text Deduplication, 12pt Standard Typography Default, and Connected Stepper Timeline
- `lib/exam-parser.ts`: Added `stripCapturedTableText` export to detect and filter redundant table headers/rows/cells while preserving directive preamble instructions and narrative experiment text; integrated into `finish()`.
- `lib/diagram-client.ts`: Automatically strips captured table/diagram text from `sharedContextText` when a shared context figure is attached, and clears `choice.text` when visual choice figures are harvested.
- `components/SplitDocumentEditor.tsx`: Enforced Master Design Constitution 12 pt standard typography (`text-[12pt]`, Sarabun) across editor container, question stems, choices, shared contexts, and explanations; redesigned pipeline header into a connected horizontal stepper with connector lines, status badges (`Check`), active breathing animations, and accessible button names; integrated `stripCapturedTableText` in manual crop dialog.
- `scripts/test-parser.cjs`: Added regression assertions for `stripCapturedTableText` validating that captured table text is stripped and narrative text is preserved.

### T-081 Unbounded Stepper Resizing, Full Table Boundary Inclusivity, and Table Row Stripping
- `components/SplitDocumentEditor.tsx`: Removed the outer rounded rectangle wrapper border (`bg-white border rounded-xl px-2.5 py-1 shadow-2xs`) from the Stepper Timeline; resized circular action buttons to compact dimensions (`w-6 h-6 sm:w-6.5 sm:h-6.5`) with proportional icons (`w-3 h-3 sm:w-3.5 sm:h-3.5`), connector lines (`h-0.5 w-2 sm:w-3.5`), and subtle `scale-102` active animations.
- `lib/diagram-service.ts`: Refined the Gemini Vision prompt for `shared_context` and tables to mandate 100% complete outer table boundaries starting safely above the topmost horizontal border stroke and including all column headers.
- `lib/diagram-client.ts`: Enhanced `cropBboxFromImage` with an extra top padding bonus (`padTop = Math.max(padY, Math.min(40, Math.round(padY * 1.25)))`) and generous padding (up to 22px) for shared context tables, ensuring full outer frames and headers are never clipped.
- `lib/exam-parser.ts`: Upgraded `stripCapturedTableText` with Thai-safe boundaries to filter table headers ("สาร", "ผลการทดลอง") and sample row data lines (`^[A-Za-zก-ฮ0-9]\s*(?:[:：|]|\s)\s*(?:ได้|เป็น|มี|สาร|ของเหลว|ตกผลึก|สี|ใส|\d)`), eliminating leaked table rows while keeping narrative experiment procedures.
- `scripts/test-parser.cjs`: Added regression test asserting table row and header elimination while preserving narrative experiment text.

### T-082 Smart Table Edge Trimming, Configurable Safe Margins, and Skew Tolerance
- `lib/diagram-client.ts`: Added `trimIntruderTextAndMargin` to perform row-by-row pixel darkness profiling. Detects intruder text lines at top or bottom edges separated by a whitespace gutter (>= 2px) from the table frame; trims intruder text cleanly with a calibrated `targetMargin` (default 3px) outside the outermost solid border line. Tolerates document tilt/skew (0.5° - 2°) across horizontal extents without clipping table corners.
- `lib/diagram-client.ts`: Calibrated `cropBboxFromImage` to use `paddingPx = 10` and `targetMargin = 3` with `trimIntruderTextAndMargin`. Calibrated `harvestExamDiagrams` padding parameters (`shared_context: 14`, `question: 12`, `choice: 8`, targetMargin: 3).
- `components/SplitDocumentEditor.tsx`: Updated Region Snipping modal to inform user of automatic 2-3px edge trimming and skew/tilt tolerance during manual diagram captures.
- `scripts/test-diagram-contract.cjs`: Added unit regression test verifying smart gutter trimming algorithm cuts outer intruder text lines while preserving table content and maintaining clean margins.

### T-083 New Machine Development Environment Onboarding
- `.env.example`: Source template copied to machine-local `.env.local`; secrets remain local and uncommitted.
- `package-lock.json`: Dependency source of truth used by `npm ci --no-audit --no-fund`.
- `scripts/sync-pdf-assets.cjs`: Ran through `postinstall`, syncing local pdf.js worker, cmap, and standard-font assets.
- `scripts/check-environment.mjs`: Produced redacted readiness evidence in `evidence/environment-check.json`; dependencies passed, provider secrets remain missing.
- `scripts/bootstrap-local.ps1`: Canonical local startup command for the ready development URL once checks are complete.
- `evidence/t083-new-machine-checklist.md`: Machine-specific onboarding checklist for `DESKTOP-FNVSAKS`, including completed checks, remaining secrets, and future minimal update path.

### T-084 Complete Figure Crop Coverage and Shared-Question Render Order
- `lib/diagram-client.ts`: `cropBboxFromImage` accepts `trimEdges`; `harvestExamDiagrams` applies smart trimming only to `shared_context` table/diagram crops, while question/apparatus figures use larger padding and preserve separated bottom/right labels.
- `lib/diagram-service.ts`: Diagram prompt now explicitly requires complete bottom/right Thai labels, receiver containers, leader lines, and captions such as `ของเหลวที่แยกได้` for science apparatus figures.
- `components/SplitDocumentEditor.tsx`: Shared context heading renders `โจทย์ร่วม:`; question images render with explicit `รูปโจทย์:` heading; explanation image blocks render `รูปคำอธิบาย:` and the explanation text label appears only when explanation text exists.
- `scripts/test-diagram-contract.cjs`: Regression checks cover question crop policy, shared-context trim policy, explicit image headings, and first-class render-order markup.

### T-085 Duplicate Question-Image Label Removal and Apparatus Margin Expansion
- `components/SplitDocumentEditor.tsx`: `labelImages` now detects existing `รูปโจทย์` headings and skips auto-inserting another label; manual crop insertion and toolbar image insertion create `รูปโจทย์:` headings instead of legacy `[รูปโจทย์]`.
- `lib/diagram-client.ts`: Question/apparatus diagram padding increased to 56px while keeping `trimEdges=false` for question figures and `trimEdges=true` for shared-context table figures.
- `scripts/test-diagram-contract.cjs`: Regression asserts the duplicate-label guard exists and no manual/auto question-image path inserts `FORMATTER_CONSTANTS.LABEL_QUESTION_IMAGE`.

### T-086 Tight Question-Figure Bottom Trimming and Visible Build Stamp
- `lib/diagram-client.ts`: `trimIntruderTextAndMargin` accepts top/bottom trim options; question figures now use bottom-only smart trimming so top captions stay in the crop while lower neighboring option text is removed across a whitespace gutter.
- `package.json`: `predev` now runs `scripts/stamp-version.cjs`, matching `prebuild`, so local development startup refreshes the visible build number.
- `scripts/test-diagram-contract.cjs`: Regression covers question bottom-only trimming and verifies the dev startup build-stamp hook remains configured.
- `app/page.tsx` / `lib/version.ts`: Build output keeps the current stamped `APP_VERSION`/`BUILD_STAMP` as the user-visible release identifier after the completion gate.

### T-087 Editable Draft Resume and Earth-Tone Draft Modal
- `lib/document-draft-store.ts`: Draft records now support `editorHtml` so manual rich-text edits, inserted images, and review-time DOM state can be restored in later sessions.
- `app/page.tsx`: `handleApplyDraft` creates a resumable `ParsedFileResult` from a saved draft when no active file exists, restores formatted items/OCR state, increments the document key, and autosaves editor input/review snapshots back to the same draft.
- `components/SplitDocumentEditor.tsx`: Accepts restored editor HTML, renders it inside the editable document, and emits editor input changes for debounced draft autosave.
- `scripts/test-document-drafts.cjs`: Regression covers `editorHtml`, active draft resume hooks, editor autosave hooks, and earth-tone modal marker.

### T-088 Keep Source Pane Original-Only for Comparison, Capture, and Magnifier
- `components/SplitDocumentEditor.tsx`: Added `data-source-original-only="missing"` empty state for left panel when resuming drafts without original source pixels, preventing OCR or plain text from leaking into the visual source pane.
- `scripts/test-document-drafts.cjs`: Added assertions for source pane original-only contract and draft modal theme styling.

### T-089 Robust Diagram Gutter Trimming & Adaptive Margins (Fix Q43/Q80 Over-Crop & Q16 Choice Under-Crop)
- `lib/diagram-client.ts`: Refactored `trimIntruderTextAndMargin` to eliminate rigid `y < 16`/`y > h - 16` offsets and 65px search clamps. Detects isolated text bands (height <= 36px) separated by a blank gutter (>= 2px) across the outer 35% zone regardless of padding depth, and cleanly trims them away with a standard 3px margin. Enabled top and bottom trimming (`all`) for question figures and shared contexts. Increased `choice` diagram padding to 20px (preventing Q16 crystal vertices from being clipped), set question crop padding to 32px with lateral expansion up to 36px (preserving Q80 right-hand annotations "สารละลายส่วนบน", "สารละลายส่วนล่าง").
- `lib/diagram-service.ts`: Updated Gemini prompt for choice figures (mandating comfortable margin around all vertices/corners) and question apparatus diagrams (mandating full right-hand annotation coverage without truncating trailing words like "บน", "ล่าง").
- `scripts/test-diagram-contract.cjs`: Added regression assertions for T-089 crop policies (question: 32 all, choice: 20 none, shared_context: 16 all), deep intruder text top/bottom trimming, and choice crystal preservation.

### T-090 Vercel Deployment Configuration & Cloud Environment Readiness
- `vercel.json`: Deployment manifest for Vercel configuring Next.js framework, build command (`npm run build`), install command (`npm install`), and 60-second function timeout for `app/api/**/*.ts`.
- `app/api/diagrams/route.ts`: Added `export const maxDuration = 60;` for Vercel serverless execution.
- `app/api/ocr/route.ts`: Added `export const maxDuration = 60;` for Vercel serverless execution.
- `app/api/source-answers/route.ts`: Added `export const maxDuration = 60;` for Vercel serverless execution.
- `app/api/google/export/route.ts`: Added `export const maxDuration = 60;` for Vercel serverless execution.
- `.env.example`: Updated production guidance for Vercel Environment Variables and OAuth `APP_URL`.








### Thai feature catalog (T-091)

- `documents/feature-catalog.md`: user-facing capability map, capture case matrix, workflow explanation, limitations, and open verification register.
- Source import/original pane: `app/page.tsx`, `components/FileUploader.tsx`, `components/SplitDocumentEditor.tsx`, `lib/file-parser.ts`, `lib/pdf-renderer.ts`.
- OCR/normalization/parser: `lib/ocr-service.ts`, `lib/ocr-client.ts`, `lib/text-normalization.ts`, `lib/exam-parser.ts`, `lib/exam-validation.ts`.
- Diagram/capture: `lib/diagram-service.ts`, `lib/diagram-client.ts`, `app/api/diagrams/route.ts`, `components/SplitDocumentEditor.tsx`.
- Answers/editor/export: `lib/source-answer-service.ts`, `lib/source-answer-client.ts`, `components/RichTextToolbar.tsx`, `lib/export-document.ts`, `lib/google-export.ts`.
- Draft/history/statistics: `lib/document-draft-store.ts`, `lib/import-history.ts`, `lib/experiment-stats.ts`, `components/StatisticsModal.tsx`.
- The catalog is documentation only; it does not replace source-level tests or real-file evidence.

### T-092 Q80 crop boundary and editor spacing

- `lib/diagram-client.ts`: `detectIntruderCuts` is the production/test-shared row-density edge detector; `trimIntruderTextAndMargin` applies its cuts after Canvas extraction.
- `lib/diagram-service.ts`: Vision prompt separates figure boundaries from neighboring stem/choice text and explicitly guards Q80.
- `components/SplitDocumentEditor.tsx`: conversion header, stepper, review disclosure, navigation strip, and editor canvas receive consistent breathing room while preserving source-left/editor-right and export DOM contracts.
- `scripts/test-diagram-contract.cjs`: imports the production detector and covers the deep/one-row-gap Q80 regression plus existing table/choice cases.

### T-094 compact OCR workspace layout

- `components/SplitDocumentEditor.tsx`: conversion header and question navigation use compact layout markers, one flex-wrapped navigation strip, and reduced editor spacing while preserving source/capture/export boundaries.
- `scripts/test-e2e.cjs`: asserts the compact header/navigation contract and retains the 80-question navigation and keyboard/source stability checks.

### T-095 active question-window navigation

- `components/SplitDocumentEditor.tsx`: derives the active 10-question window and decade anchors from the current question, preserving all question records while rendering only the compact navigation subset.
- `app/globals.css`: animates window transitions and disables the animation for reduced-motion users.
- `scripts/test-e2e.cjs`: verifies the exact visible sequences for initial, active 10, and active 20 states.

### T-096 first-question navigation anchor

- `components/SplitDocumentEditor.tsx`: keeps the first parsed question as an outside-window anchor and avoids duplicates when it is inside the active range.
- `scripts/test-e2e.cjs`: verifies the first anchor while navigating to questions 10, 20, and 60 in the 80-question fixture.

### T-097 compact status rail and automatic answer action

- `app/page.tsx`: renders document status as a centered compact pill and keeps review findings in the editor icon rail instead of a duplicate full-width alert; source-answer failures remain explicit.
- `components/SplitDocumentEditor.tsx`: uses fixed 32px icon slots with hover/focus labels, a floating editor toast, and an answer-analysis icon that remains available after conversion.
- `scripts/test-e2e.cjs`: verifies stable icon geometry, compact status placement, no duplicate workspace alert, and automatic answer analysis on a page-backed fixture.

### T-098 AI answer fallback
- `lib/source-answer-service.ts` and `app/api/source-answers/route.ts`: retain the conservative source-mark extractor; it never solves missing answers.
- `lib/ai-answer-service.ts` and `app/api/ai-answers/route.ts`: validate and solve unresolved multiple-choice questions with Gemini, optional page image context, confidence/evidence guards, and explicit abstention.
- `lib/source-answer-client.ts`: runs source extraction first, then groups unresolved questions for AI solving and prevents replacement of any existing answer.
- `app/page.tsx` and `components/SplitDocumentEditor.tsx`: expose one answer action, report source/AI/unresolved counts, and show `เฉลยจาก AI · ตรวจทาน` on generated choices.
- `scripts/test-source-answers.cjs` and `scripts/test-e2e.cjs`: cover validation, no-image fallback, source ownership, and the end-to-end click flow.

### T-099 Local Ollama readiness
- `lib/ollama-runtime.ts`: probes local `/api/tags`, starts a detached `ollama serve` process when needed, polls readiness, and deduplicates concurrent startup.
- `app/api/ocr/route.ts`: gates local/fallback OCR behind runtime readiness and returns an actionable 503 when the daemon cannot be started.
- `scripts/test-ollama-runtime.cjs`: covers local reuse, automatic startup, remote bypass, concurrent startup locking, URL mapping, and bounded failure.

### T-100 Review/export media preservation
- `app/page.tsx`: review normalizes managed labels, validates a media-stripped clone, preserves the live editor DOM, and saves the existing structured model plus `editorHtml`.
- `components/SplitDocumentEditor.tsx`: remains the source of the four media-role DOM contracts consumed by review and export.
- `scripts/test-e2e.cjs`: verifies question/shared/choice/explanation image retention and exactly one managed label after review.
- `scripts/test-google.cjs`: verifies all four image roles are embedded in the generated DOCX media package.

