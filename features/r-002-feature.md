# แปลงเอกสารให้เข้ารูปแบบที่กำหนด

Status: `In Progress`

## Traceability

- Requirement: R-002 in [[documents/prd]]
- Task: T-005, T-015 in [[documents/tasks]]
- Decisions: D-003 in [[documents/decisions]]
- Traceability Matrix: [[documents/traceability]]

## Behavior

Parses raw exam text into structured questions, enforcing the Supreme Design Constitution target (12pt font, orange `#F2604D` bold question numbers/asterisks, teal `#006D77` bold headers, dual-color shading `#E6F4EA`/`#FFF4CC`, Master Answer Key Auto-Reconciliation, and Multi-Set Section Restart Parser).

## Code

- Entry points: `components/ExamFormatterPreview.tsx`, `app/page.tsx`
- Supporting files: `lib/exam-parser.ts`, `lib/formatter-rules.ts`
- Data or integrations: Formatting rules engine aligned with official QuizFlow template `https://docs.google.com/document/d/1uA8A1Q1lXCDIGRPtgBA0H77xYoMWCoo7thp5Hi0nvBQ/edit?tab=t.0`

## Verification

- Acceptance checks: Master Constitution compliance, 12pt font size, dual-color shading, answer key reconciliation.
- Automated tests: `scripts/check-knowledge-vault.mjs`, `scripts/test-parser.cjs` (source fidelity, single questions, multi-question explanations, numbered choices, section resets, unresolved answers, DOCX paragraph preservation).
- Manual checks: UAT scenario `UAT-FMT-001` in [[evidence/uat-checklist]]
- Runtime checks: Live preview rendering compliance

## Known Risks

- Complex multi-column mathematical equations require MathJax / KaTeX rendering extensions in future passes.
## T-015 source fidelity correction

The parser returns only detected source questions, including a single question; unsupported text returns an empty result. Missing or ambiguous answer evidence stays unresolved without answer highlighting. Source explanations and marked choices provide green source shading; no answer is auto-solved. Numeric choices require a complete sequential 1–4 block to avoid guessing on ambiguous input. DOCX text retains paragraphs and joins Word text runs, and PDF text retains line boundaries using PDF text coordinates and end-of-line markers.

Remaining limits: scanned documents require OCR; complex columns and ambiguous numbered lists require source review. Embedded images remain assigned in extraction order rather than proven question positions.

T-015 boundary guard: Numbered explanation reasoning remains attached to its question. A numbered candidate inside an explanation starts the next question only when lookahead finds a source choice block before another question candidate or section. Imported images remain DIRTY until crop validation.
T-015 import validation: DOCX without document.xml and PDF rendering failures reject with errors. PDF extraction retains short text and renders all pages by default; an explicit page limit reports partial rendering. Imported DOCX/PDF/image media is unverified, and image messages explicitly state OCR is unavailable. Automated regressions cover missing DOCX document XML, browser image base64, PDF failure propagation and 16-page line-preserving PDF rendering through a controlled PDF.js fixture.

## T-022 parser performance baseline

The reproducible scripts/benchmark-parser.cjs benchmark generates 100, 1,000 and 5,000 source questions, warms up once, records seven samples, and asserts question text, numbering, choice count and source answer correctness for every sample. evidence/performance-baseline.json records runtime, CPU and sample measurements. The initial medians were 1.578 ms, 7.996 ms and 27.314 ms respectively on the captured host. Results measure synchronous text parsing only, exclude assertions from timed intervals and impose no flaky elapsed-time test threshold; they do not certify browser PDF or OCR performance.

T-041 verified source artifact: explicit inline/sparse media ownership, source-page navigation excluded from learner export, fixed OCR prompt, table column labels, checkbox markers not answer evidence, aspect-ratio-safe snapshots. Regression and evidence: evidence/t041-browser-result.json; evidence/t041-media-manifest.json. Full automatic source fidelity remains open in T-039.

T-041/T-042 final verification: original PDF import -> exact SHA-256 reviewed corpus -> 25 questions/100 choices/5 source-owned media -> editor -> source-page navigation -> live DOM snapshot -> native Google Docs. Source page is captured when each question starts, preventing prior-page questions shifting forward. Unknown/changed files use ordinary OCR; no approximate filename match or learned answer inference. Corpus is data under public/reviewed and includes reviewer, source hash/page count and text. Live PDF import: 3.577s, zero OCR calls. Remote OCR baseline: 13.8s, recognition defects retained for review. All seven native PDF pages visually checked after grouped pagination repair. Readback: evidence/t041-gdoc-readback.json. Browser: evidence/t042-real-pdf-result.json. Google URL: https://docs.google.com/document/d/1r5CWTFdiQE98JAmSgRMNnNh1WKLIuJzqI4vVwZOCfIY .

T-043 regression scope: concurrent documents share provider slots; local default one, remote two, explicit override 1-2, pending limit 32, FIFO and failure recovery. No fabricated content or change to source validation. Multiple replicas require a separate distributed queue if deployed at scale.

T-045: import observations/download added; new PNG/JPG OCR transport repaired and regression tested at UI/API boundary. Provider recognition is mocked in regression, so arbitrary source fidelity remains an open real-world acceptance check.

T-047 regression: automatic sequential <=10-page OCR batches preserve absolute source pages, partial text and failure messages; reset prevents later stale batches. Generated twelve-page blank PDF mock provider test is orchestration evidence only.

### T-050 Explicit conversion workspace
T-050: left raw OCR/text -> explicit conversion -> editable formatted questions/style/images -> export; right original stays read-only and independent, with crop tools. Small question-number navigation scrolls left only. Import-history icon stores the latest 100 filenames/times/sizes locally; no source contents or reopen storage, no reconstruction of older anonymous statistics.
Requirement: R-001 / R-002 -> Task: T-050 -> Feature Note: features/r-001-browser.md and features/r-002-feature.md -> Code Map: app/page.tsx, components/SplitDocumentEditor.tsx, components/RichTextToolbar.tsx, lib/import-history.ts -> Verification: evidence/t050-verification.md.
This explicit user flow supersedes T-049 automatic formatting and T-048 main page-number navigation. Source page references remain available for explicit comparison. Only answers actually supplied by the source are preserved; T-039 semantic OCR fidelity and T-044 resumable raw-page storage remain open.

### T-052 Table-choice layout and source-answer directives
T-052: numbered stem steps retain explicit line breaks including the following prompt; editor renders BR so live snapshot exports real paragraphs. Flattened table choice label prefixes before colons are underlined without HTML injection; values/separators remain literal. Explicit source answer directives accept colon/fullwidth colon, reconcile explanation ahead of source asterisk, and conflicting explicit keys remain unresolved. Existing orange star and green source shading appear immediately when converting. No inferred answers from handwriting, table ticks, absent answers or invalid choice keys. R-002/R-004 -> T-052 -> features/r-002-feature.md -> lib/exam-parser.ts and SplitDocumentEditor.tsx -> evidence/t052-verification.md.

### T-055 Editable draft and crop handoff
T-055 changes readiness: structural issues no longer prevent an editable parsed draft; zero parsed questions still cannot create invented slots. Raw crop selector uses parsed navigation items; insertion first converts to draft then attaches to chosen live DOM after commit. Single top convert action replaces duplicate bottom action. Draft warnings remain outside editable/export content; export unavailable until live review passes. Review snapshot parses current edited text and checks actual attached images, source completeness and original-number retention without rerendering editor from stale items. Manual edits and inserted crops survive review. No missing choices or answers are synthesized.
R-001/R-002 -> T-055 -> browser/OCR feature -> app/page.tsx, SplitDocumentEditor.tsx -> evidence/t055-verification.md.

### T-056 / T-057 Source image captions and Gemini answer extraction
T-056: every inserted question image has [รูปโจทย์] above it, including toolbar and rich-text DOM paste; explicit user requirement supersedes the older caption-free skill rule. Capture/source DOM stays independent. Export snapshots include the caption.
T-057: Gemini is separate from fixed Typhoon OCR. Server-only GEMINI_API_KEY; configurable GEMINI_ANSWER_MODEL defaults gemini-3.8-flash. One bounded page request at a time per process; timeout 90 seconds, one bounded retry for Google503 or local429 after 1.5 seconds; failed pages reported without blocking later pages, no solving. Match source page, question id, stem, actual choice key; reject duplicate/conflicting candidates, confidence below 0.95, missing evidence or invalid normalized bbox. Preserve explicit parsed answers; render source-vision evidence outside export text. Analyze a fresh parse before publishing editable DOM, ignore stale upload/conversion responses, allow draft despite provider failure. Confidence is model-reported, not an accuracy certificate; handwritten X marks may be ambiguous and stay unanswered.
Lesson: models list HTTP200 does not prove generateContent works. Actual request returned404 for gemini-2.5-flash despite discovery listing it; Google restricts it for new users. Verify real generation before declaring provider ready. Evidence: evidence/t057-live-result.json; scripts/test-source-answers.cjs. Live completion gate still pending.
Requirement R-002/R-004 -> Task T-057 -> features/r-002-feature.md -> lib/source-answer-service.ts, lib/source-answer-client.ts, app/api/source-answers/route.ts, app/page.tsx, lib/formatter-rules.ts -> source-answer guards and live browser evidence. Bug T-056 -> existing browser feature -> components/SplitDocumentEditor.tsx -> caption/browser/export regressions.


### Local comparison T-058
Pilot compares qwen3-vl2b/4b locally without changing production. Existing source PNGs page1/page3 visually reviewed; truth labels are visible red annotation selections, NOT verified subject-answer correctness. Page1 truth1ก2ก3ง4ค5ง6ง; page3 truth11ง12ง13unmarked14ก15ข16ก17ข18ง19ค20ก. Sixteen unique questions with15 marked and1 abstention control; cold page1, warm page3, repeated warm page1 per model. Same source hashes/prompt/settings; precision/recall/wrong/missing/false-positive reported separately before and after existing0.95/bbox guards. Ollama /api/ps model residency and VRAM counters are sampled, not total process/system peak RAM. Evidence and raw responses retained under evidence/t058-local; scripts/benchmark-local-vision.cjs owns evaluation. Model downloads authorized by user; benchmark pending downloads. R-002/R-004 -> T-058 -> features/r-002-feature.md -> benchmark script -> actual local result files and comparison report. Pilot cannot certify production readiness, full-document conversion or general Thai OCR accuracy. T-057 Gemini still unchanged.

T-058 clarification: project owner directly confirmed on2026-10-12 that the tested red marks are teacher answers rechecked for correctness. For these fixture hashes only, the benchmark truth is a visually transcribed, teacher-verified key. Previous annotation-only caveat is superseded for this source, not for arbitrary future imports. Both candidate prompts use this same confirmation and still forbid solving or inventing answers. Independent auditor reviewed evaluator/comparison fairness; completeness, invalid rows, shared fingerprint, error exit and unobserved-memory guards now covered by tests. New evaluator wired into npm test. Model inference results still pending download; never report a winning model without actual matching-condition results.

T-058 final pre-inference dataset: expanded from2pages/16questions to3pages/20questions before any candidate inference, specifically including previously difficult table/diagram page2. Ground truth:19 teacher-marked answers and1 no-unique-choice control (Q13 Free). Pages1,2,3 plus repeated page1 for warm timing;4 runs/model. Both models receive actual reviewed question stems/keys matching production request fields, with no truth key leaked in requests. Preflight: node scripts/benchmark-local-vision.cjs qwen3-vl:2b --preflight passed20questions19marked; fixtures.json captures image hashes and owner confirmation. Completeness and denominators derive from manifest, not hardcoded reduced counts. This supersedes earlier16-question design notes. Await both downloads before timing; no production switch.

T-058 ROI verification checkpoint (2026-10-12): owner confirms teacher-rechecked red circles/crosses for this fixture. Visually inspected all three QA contact sheets: 20 question-owned original-pixel crops,19 marked keys and Q13 Free/no unique choice. QA labels are excluded from inference images. Experimental native loopback HTTP NDJSON transport added (scripts/local-vision-http.cjs); guards tested for UTF8, final metadata, incomplete stream, provider error and loopback-only scope. Metrics now match case IDs rather than first matching page, preventing repeated-page ROI truth contamination. Initial cropped 2B response completed in63.348s but captured empty content; preserved evidence/t058-roi/initial-stream-empty.json, no accuracy certification. Raw stream capture added for diagnosis. Both full-page failed baselines remain in evidence/t058-local. T-058 remains In Progress; production Gemini provider unchanged. Final actual comparison and finish-task gate pending.
T-058 runtime diagnosis: actual stream evidence shows schema JSON wholly in message.thinking with empty content despite thinkfalse. Diagnostic fallback is strictly JSON-only and experiment-only; preserve channel/chunks, never integrate as production response. First diagnostic2B q1 selected ข incorrectly with confidence0.95 (teacher truth ก); confidence alone unsafe. Transport tests passed. Evidence diagnostic-thinking-channel.json, ROI outputs. Full20case comparison ongoing.
