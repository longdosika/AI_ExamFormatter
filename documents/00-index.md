# Project Knowledge Vault
## GitHub Preparation
- [[release-checklist]]: T-112 local-only build/CI preparation and explicit pre-publication security/content review. No push authorized; verification in [[evidence/t112-verification]].
## Latest Verified Work
- T-112 Done, 2026-10-16: GitHub preparation only, no stage/commit/push. Candidate 261016-1027 passed 31/31 Edge E2E and completion gate; source-only gate stamp 261016-1034, main 261016-0945 unchanged. Publication HOLD: production audit 2 critical/3 high (T-113), historical key and binary privacy review. [[release-checklist]], [[evidence/t112-verification]].
- T-111 Done, 2026-10-16, build 261016-0945 (main http://localhost:3000): header draft chip, folding notice, recent drafts on upload, clickable next step, J/K keys, answered-chip jump, answer pop, question pill, dimmed crop. Gate exit 0, E2E 31/31; [[evidence/t111-verification]].
- T-110 Done, 2026-10-16, build 261016-0902 (main http://localhost:3000): dark olive rails with working shimmer, one export control (export / export again / open), question strip with answer-origin dots, review rings, preview card and answered/issue summary. Gate exit 0, E2E 30/30; [[evidence/t110-verification]]. Drive D: nearly full.
- T-109 Done, 2026-10-15, build 261015-2300 (main http://localhost:3000): DOCX/Drive export follows the master QuizFlow template (design.md §1.1): A4, file-name title, keyless indented choices, Pearl Aqua answers, italic shared passage + ◆, V-date/file/page footer. Supersedes the T-108 look. Gate exit 0, E2E 30/30; [[evidence/t109-verification]].
- T-108 Done, 2026-10-15, build 261015-2227 (main http://localhost:3000): DOCX download and Google Drive export follow the owner reference layout (Letter, Sarabun 12/1.15, stamp+title header, blank rhythm, black text, 528/307 px images); solid shared-context shading bug fixed. Gate exit 0, E2E 30/30; [[evidence/t108-verification]].
- T-107 Done, 2026-10-15, build 261015-2153 (main http://localhost:3000): one-line single-open question strip with coral current marker, editor image add/replace/recapture/resize/delete+undo (size exported), hover-label rails, jump flash/progress/copy motion. Gate exit 0, E2E 30/30; [[evidence/t107-verification]].
- T-106 Done, 2026-10-15, build 261015-2110 (main http://localhost:3000): calmer workspace chrome with warm tokens, icon utility group, readable pane heads, halo stepper with next-step label, 24 px question chips; exported content unchanged. Gate exit 0, E2E 28/28; [[evidence/t106-verification]].
- T-105 Done, 2026-10-15, build 261015-2017: persistent original media, safe legacy reattachment, muted completed steps and circular question gaps. Production E2E 28/28; [[evidence/t105-verification]].
- T-102, 2026-10-15, build 261015-1932: single answer decorations, legacy repair, validated export media; [[evidence/t102-verification]]. Pending signed-in Google editor confirmation T-103 and Q66 table-image harvesting T-104 in [[tasks]].
## Project
AI Exam Formatter
## How To Use This Vault
- Open this folder as an Obsidian vault to see the project knowledge graph.
- Start from [[prd]], then read [[architecture]], [[tasks]], and [[decisions]].
- After AI changes code, update the related notes and keep links current.
## Core Map
- [[evidence/project-audit]] - current evidence-backed findings, ownership and external dependencies
- [[Weekly_Audit]] - mandatory Monday audit checklist, owners, evidence and extensible rules
- [[prd]] - product goal, users, scope, and success criteria
- [[architecture]] - technical structure, platform guidance, data flow, and integration assumptions
- [[tasks]] - execution ledger for AI and human work
- [[traceability]] - requirement-to-code and verification matrix
- [[code-map]] - feature ownership and implementation location map
- [[decisions]] - decision log, tradeoffs, assumptions, and confirmation items
- [[audit-log]] - audit trail of activity history, timestamps, and changes
- [[memory]] - durable context for future AI sessions when included
- [[feature-catalog]] - แผนผังความสามารถระบบภาษาไทย แยกตาม workflow พร้อมกรณี capture และทะเบียนข้อจำกัดที่ต้องพิสูจน์
## AI Knowledge Governance
- Every implementation pass must update [[tasks]].
- Behavior or scope changes must update [[prd]].
- Architecture, API, database, auth, integration, deployment, or module changes must update [[architecture]].
- Meaningful tradeoffs or assumptions must be recorded in [[decisions]].
- Durable lessons for the next AI session should be recorded in [[memory]] when available.

Current acceptance evidence: evidence/t042-real-pdf-result.json; evidence/t041-gdoc-readback.json; evidence/t041-final-contact.png. T-041/T-042 review deliverables are registered in tasks.

T-043 shared OCR scheduling: tasks, architecture, decisions, code-map, traceability and memory record process-local scope and unknown-source fidelity limits. Verification: evidence/t043-verification.md.

T-045 experiment stats and unknown-file flow: lib/experiment-stats.ts, evidence/t045-verification.md, evidence/t045-experiments.json; see architecture/design/decisions for storage limits, timing boundaries and proposed evaluation weights.

T-046 OAuth canonical recovery: evidence/t046-result.json, evidence/t046-verification.md, architecture/design/decisions; live Google consent and export still tracked under T-017.

T-047 automatic OCR batching: evidence/t047-verification.md, evidence/t047-batch-result.json; code map/architecture/design explain per-request limit and single import UX.

T-048 source navigation: evidence/t048-result.json, evidence/t048-page-navigation.png and evidence/t048-verification.md. T-047 batching evidence remains separate.

T-049 OCR scanning feedback and source-side format action: evidence/t049-result.json, evidence/t049-scanning.png, evidence/t049-verification.md; design explains automatic and review conversion flow.

### T-050 Explicit conversion workspace
T-050: left raw OCR/text -> explicit conversion -> editable formatted questions/style/images -> export; right original stays read-only and independent, with crop tools. Small question-number navigation scrolls left only. Import-history icon stores the latest 100 filenames/times/sizes locally; no source contents or reopen storage, no reconstruction of older anonymous statistics.
Requirement: R-001 / R-002 -> Task: T-050 -> Feature Note: features/r-001-browser.md and features/r-002-feature.md -> Code Map: app/page.tsx, components/SplitDocumentEditor.tsx, components/RichTextToolbar.tsx, lib/import-history.ts -> Verification: evidence/t050-verification.md.
This explicit user flow supersedes T-049 automatic formatting and T-048 main page-number navigation. Source page references remain available for explicit comparison. Only answers actually supplied by the source are preserved; T-039 semantic OCR fidelity and T-044 resumable raw-page storage remain open.

### T-051 Compact source-left workspace
T-051 supersedes T-050 panel positions: original/capture LEFT, OCR/explicit conversion/edit/export RIGHT. Source is independent; question navigation affects editor only. Source magnify/crop and editor insert/copy/export actions use icons with accessible names/title hints and active/disabled states; compact one-row toolbar, 12 pt badge, shortened OCR heading, secondary guidance hidden from visual toolbar. Conversion stays explicit and prominent. Source recognition/answer rules unchanged. Requirement R-001 -> T-051 -> features/r-001-browser.md -> SplitDocumentEditor/RichTextToolbar -> evidence/t051-verification.md.

### T-052 Table-choice layout and source-answer directives
T-052: numbered stem steps retain explicit line breaks including the following prompt; editor renders BR so live snapshot exports real paragraphs. Flattened table choice label prefixes before colons are underlined without HTML injection; values/separators remain literal. Explicit source answer directives accept colon/fullwidth colon, reconcile explanation ahead of source asterisk, and conflicting explicit keys remain unresolved. Existing orange star and green source shading appear immediately when converting. No inferred answers from handwriting, table ticks, absent answers or invalid choice keys. R-002/R-004 -> T-052 -> features/r-002-feature.md -> lib/exam-parser.ts and SplitDocumentEditor.tsx -> evidence/t052-verification.md.

T-053 learning and recurring regressions: documents/memory.md, documents/decisions.md, Weekly_Audit.md, evidence/t053-verification.md.

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

T-066 QuizFlow parity: deterministic Thai normalization and answer directives are ported with synthetic regression coverage. External QuizFlow golden corpus and output manifests are absent; see `evidence/t066-blueprint-parity.md`, `documents/tasks.md`, and the T-066 verification evidence.

### T-068 status
Image/PDF conversion reliability is verified by fresh browser E2E and local asset checks; finish-task gate evidence is recorded in `evidence/t068-verification.md`.

### T-069 long exam conversion
The image/PDF conversion requirement now includes a long-document contract: preserve all source question numbers, handle mixed numeric/letter choices, map figure markers to source-page images, and preserve unresolved answer provenance. See `evidence/t069-verification.md`.
