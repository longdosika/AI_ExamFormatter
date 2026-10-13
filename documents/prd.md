# PRD
## Related
- [[00-index]]
- [[architecture]]
- [[tasks]]
- [[decisions]]
## Project Name
AI Exam Formatter
## Project Type
Web App
## Platform Summary
Browser-based application that users open through a web browser on desktop or mobile devices.
## Goal
Create a web app ที่แปลงเอกสาร .ยกด / รูปภาพ / doc / google doc / md file ให้ถูกแบ่งสัดส่วน จัดรูปแบบ ให้เข้า format ตามที่กำหนดไว้
## Target Users
เราเอง ใช้ผ่าน internet
## Requirements
### R-001 ลาก / browser ไฟล์ต้นฉบับ
- User need: ลาก / browser ไฟล์ต้นฉบับ
- Status: `Proposed`
- Acceptance Criteria:
  - Confirm the expected behavior before implementation.

### R-002 แปลงเอกสารให้เข้ารูปแบบที่กำหนด
- User need: แปลงเอกสารให้เข้ารูปแบบที่กำหนด
- Status: `Proposed`
- Acceptance Criteria:
  - Confirm the expected behavior before implementation.

### R-003 ได้เอกสารในรูปแบบ google doc ไว้ใน dirve ที่กำหนด
- User need: ได้เอกสารในรูปแบบ google doc ไว้ใน dirve ที่กำหนด
- Status: `Proposed`
- Acceptance Criteria:
  - Confirm the expected behavior before implementation.

### R-004 ปรับแต่ง ตัวหนา ตัวเอียง ขีดเส้นใต้ได้ (อนาคตอยากให้รองรับ สูตรเลข สูตรเคมี เลขยกำลัง)
- User need: ปรับแต่ง ตัวหนา ตัวเอียง ขีดเส้นใต้ได้ (อนาคตอยากให้รองรับ สูตรเลข สูตรเคมี เลขยกำลัง)
- Status: `Proposed`
- Acceptance Criteria:
  - Confirm the expected behavior before implementation.

### R-005 บันทึกและดูบทเรียน/ข้อตัดสินใจของแต่ละเคส (Lessons Learned & Case Decision Log Viewer)
- User need: สามารถดูรายการ Feature/เมนู/Note และข้อตัดสินใจของเคสต่างๆ (เช่น กรณีการ Capture รูปแบบต่างๆ) พร้อมบันทึกวันเวลา วิธีดำเนินการ และเปิดแก้ไข/ดูประวัติการตัดสินใจในอนาคตได้
- Status: `Proposed`
- Acceptance Criteria:
  - มีระบบบันทึกและแสดงรายการ Case Decisions / Lessons Learned แยกตาม Feature/เคส
  - รองรับการเรียกดูประวัติวิธีดำเนินการ วันเวลาที่ตัดสินใจ และเปิดให้ปรับแต่ง/สังเคราะห์เคสใหม่ได้
## User Flow
1. ลาก / browse ไฟล์ต้นฉบับ
2. แปลงเอกสารให้เข้ารูปแบบตาม Master Design Constitution (design.md / Official QuizFlow Template)
3. ระบบบันทึกบทเรียน/เคสใหม่ลงใน Lessons Learned & Decision Log
4. ได้เอกสารในรูปแบบ google doc ไว้ใน drive ที่กำหนด
## Success Criteria
Audit T-014 (2026-10-10): requirements remain Proposed pending full acceptance evidence. Implemented UI/parser subsets and targeted fixes do not certify this product success criterion. Destination folder is confirmed as `1bZeNZ7De9pxsoQH-Zo9ni3A3Rd6XmnuG`; app OAuth/export and OCR/AI remain pending T-017/T-018. Local browser case storage does not fulfill cross-device consistency or Vault synchronization.

ได้เอกสารในรูปแบบ google doc ไว้ใน drive ที่กำหนด ตามรูปแบบ template ที่กำหนดไว้ (`https://docs.google.com/document/d/1uA8A1Q1lXCDIGRPtgBA0H77xYoMWCoo7thp5Hi0nvBQ/edit?tab=t.0`) และบันทึกบทเรียนทุกเคสให้ตรวจสอบได้
## Constraints
ดูแลง่าย เมื่อมีการแก้ไข ได้ผลลัพธ์แล้ว ต้องถูกบันทึกบทเรียนเสมอ เพื่อใช้เป็นการเรียนรู้หากพบรูปแบบเดิมอีก ต้องสามารถแก้ไขหรือสร้างรูปแบบที่เคยเจอมาก่อน และผ่านการตัดสินใจมาก่อนแล้วได้ ทำที่ไหน เครื่องใคร ตอนไหน ต้องได้ผลลัพธ์เดียวกัน ไม่ติดเรื่อง environment และการออกแบบ UX/UI ทุกข้อตกลงต้องระบุไว้ใน design.md เป็นคัมภีร์หลักการออกแบบของระบบ โดย UX/UI ต้องเรียบง่าย หลีกเลี่ยงรูปแบบที่ AI ชอบใช้ ไม่ใช้ข้อความเยอะ เน้น symbolic เป็นหลัก + icon ลายเส้น คุมโทน

T-045 requirement: retain import experiment observations for future evidence-based decisions; export versioned metadata and grouped metrics, keeping reviewed reuse separate from OCR and structural success separate from source accuracy. Initial history is browser-local, downloadable for team retention.

T-048 requirement: directly navigate original PDF pages with numbered controls and current-page feedback during source comparison.

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

### T-066 Blueprint parity scope
The product accepts only evidence-backed parity changes. T-066 guarantees conservative Thai OCR normalization before parsing and recognizes `คำตอบ`/`Answer` answer declarations. It does not promise QuizFlow's external DOCX/manifest/Google Doc pipeline until the project owner supplies the corresponding permitted fixtures and expected outputs.

### T-068 image exam conversion
The product flow for image/scanned exams is source image -> local PDF rendering when applicable -> OCR raw-text review -> explicit editable conversion. The conversion stage must preserve source answers/media and remain reviewable when structure is incomplete. Local pdf.js assets are part of the runtime contract; external CDN availability is not.

### T-069 product requirement
For scanned exams with 80 or more questions, conversion must expose every parsed source number for review. Numeric choice blocks, page markers, tables, and figure markers must not collapse distinct questions. Images are attached only when the source marker or embedded media provides evidence; answer analysis never invents a key when Vision or source evidence is unavailable.
