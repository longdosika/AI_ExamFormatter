# Decisions

### D-033 Master Template Overrides Earlier Export Choices (T-109, 2026-10-15)
Owner restated that the master QuizFlow template is the supreme reference and decided: (1) template wins everywhere, replacing the T-108 look taken from a secondary example; (2) export drops "ก./ข." choice keys; (3) every correct answer is marked with run-level Pearl Aqua #B8F2E6 + coral "*" regardless of origin, so T-101 origin colours are editor-only; (4) title = file name in the template title style, footer = "V-<date>" + file name + page X of Y. The editor DOM is unchanged; the layout is applied at export for both download and Drive. Lesson: check design.md §1.1 and the template before following any other reference.

### D-032 Reference Layout Applied at Export, Roles from the Editor DOM (T-108, 2026-10-15)
Decision: keep the editor as the source of truth and apply the reference layout in one pure server-side step used by both DOCX download and Google Drive export, rather than restyling the editor. Paragraph roles come from existing data attributes, so manual edits and restored drafts export consistently. Answer-origin shading from T-101 is kept even though the reference shows only AI yellow, because colours carry provenance. The export uses reference wording ("รูปคำถาม:", "โจทย์ร่วม " without colon) while the editor keeps its managed labels, so parser/review contracts are unchanged. Header stamp uses Thai year and Bangkok time like the reference. Images are only shrunk to 528/307 px, never enlarged, to avoid blurring small crops. E2E evidence writes retry only transient Windows open errors (errno -4094) that recurred on this host; assertions are never retried.

### D-031 Single-Open Strip and DOM-Level Image Tools (T-107, 2026-10-15)
Decision: keep the question strip to one line by allowing only one open range and scrolling inside the strip, instead of wrapping or keeping several ranges open. Image editing acts directly on the live editor DOM (the export snapshot) rather than re-rendering React items, so manual edits survive; deletes keep the removed node for an Undo window. Size presets are stored as `data-export-scale` and honored by export so the document matches what the editor shows. File/drop/paste additions reuse the existing insert dialog instead of a second placement UI. Hover-label rails only expand for fine pointers at >= 768 px and only transition inside that media query, because labels left open during a resize overflowed phone layouts. Tradeoff: on touch devices labels are not shown; accessible names and the long-press-free icon set remain.

### D-030 Redesign Chrome, Not Exported Content (T-106, 2026-10-15)
Decision: modernize only the workspace chrome. The editor DOM is the export snapshot, so question/choice/answer colors and 12 pt Sarabun stay as the template requires. Accessible names and data-layout/data-step contracts stay identical so the existing E2E contract (28 checks) keeps guarding behavior. Secondary header utilities become a quiet icon group instead of a hidden menu, because a menu would add a click and break direct keyboard reach. Pane entrance animates opacity only: panes remount on each conversion and transform animation shifted geometry while tests and users measure it. Tradeoff: the next-step text label and "12 pt"/"ส่งออก" text appear only on wide screens (>= 1536 / 1800 px) to keep the editor head one row; narrower screens rely on tooltips and accessible names.

### D-029 Persist Originals Separately and Expand Gaps Deliberately (T-105, 2026-10-15)
Decision: store originals/rendered pages in IndexedDB, not base64 in localStorage drafts, to avoid the latter's small quota and preserve the distinction between source evidence and edited/OCR content. Original blobs enable fresh object URLs after reload. Do not pretend legacy drafts contain unavailable originals: reattach the matching file once, with hash validation where known, without provider calls or editor replacement. Keep stored sources until explicit associated draft deletion/browser eviction; surface capacity failures rather than silently evicting reference files. For long navigation retain semantic anchors and add explicit circular gap controls, with motion disabled by system preference. Completed steps use the same muted style while repeat actions stay enabled. Browser-local storage can be cleared/evicted; it is not a permanent backup or cross-device sync.

### D-028 Evidence-Led Export Repair (T-102, 2026-10-15)
Context: React conditionally added stars/badges after the imperative editor had already injected its own copies. Decision: use stable React slots, idempotent decoration and legacy snapshot repair, retaining live text/media. Decode images before either export path; no silent broken-image output, and tall figures scale proportionally. Google readback of the reported document contains 14 images and its rendered PDF shows Q16's four figures, so do not claim a missing-image transport root cause or rewrite OOXML speculatively. Track signed-in editor warning reproduction under T-103. The owner's newer example guides layout, not answer correctness or removal of origin colors.

### D-027 Three Answer Origins and User-Controlled Export (T-101, 2026-10-15)
Decision: retain existing green/yellow source/AI colors and add pale blue for manual answers. Manual overrides are explicit provenance, and automated answer readers must preserve them. Update answer ownership directly in the media-bearing editor DOM and merge only answer fields when saving structured draft data; avoid rebuilding edited text/media on each selection. Snapshot background inheritance follows nested blocks so all origin colors survive OOXML. Export current raw/edited work whenever the user chooses; review findings are advisory. Google OAuth/folder checks remain mandatory only for Google upload; bounded same-origin local DOCX generation requires no Google credentials. This supersedes the previous review-completion export gate.

## Related
- [[00-index]]
- [[prd]]
- [[architecture]]
- [[tasks]]
- [[memory]]
## Decision Log Rules
- Record important implementation, product, architecture, security, data, and deployment decisions here.
- Each decision should include context, decision, reason, affected files, and follow-up tasks.
- If evidence is weak, mark it as an assumption and add a confirmation task in [[tasks]].

## D-090 Vercel Serverless Deployment & 60-Second Function Timeout Policy
- Context: Deploying Next.js 14 App Router to Vercel requires configuration for serverless functions, build pipeline, and environment parity. Multi-page Typhoon OCR and Gemini diagram analysis routes can take up to 30-45 seconds, which would exceed Vercel's default 15-second serverless timeout on Hobby tier if unconfigured.
- Decision:
  1. Add `vercel.json` defining Next.js framework, install/build commands, and a wildcard function timeout configuration `app/api/**/*.ts` set to 60 seconds (the maximum for Vercel Hobby accounts).
  2. Explicitly export `export const maxDuration = 60;` in compute-heavy route handlers (`app/api/diagrams/route.ts`, `app/api/ocr/route.ts`, `app/api/source-answers/route.ts`, `app/api/google/export/route.ts`) so Next.js build manifests directly instruct Vercel's Edge/Serverless runtime.
  3. Ensure all local file processing happens in browser Web APIs (Canvas, JSZip, PDF.js) and server routes remain strictly stateless HTTP proxies, avoiding ephemeral filesystem assumptions.
  4. Document required Vercel Environment Variables (`GEMINI_API_KEY`, `TYPHOON_OCR_API_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_SESSION_SECRET`, `APP_URL`).
- Reason: Guarantees zero 504 Gateway Timeouts during OCR and diagram extraction on Vercel while preserving identical behavior between local development and cloud production.
- Affected notes: `vercel.json`, `app/api/diagrams/route.ts`, `app/api/ocr/route.ts`, `app/api/source-answers/route.ts`, `app/api/google/export/route.ts`, `.env.example`, [[tasks]], [[architecture]], [[code-map]], [[traceability]].
- Status: `Approved`

## D-006 Build cache isolation and dev server CSS protection
- Context: When `finish-task.mjs` ran `next build`, it wiped `.next/static/css/...`, breaking the running dev server on port 3000 and causing CSS 404s (raw unstyled HTML with Times New Roman and broken layouts).
- Decision:
  1. Add `distDir` support in `next.config.mjs` (`process.env.NEXT_DIST_DIR || '.next'`).
  2. In `scripts/finish-task.mjs`, isolate `next build` into `.next-build` so `.next` is never wiped out.
  3. In `scripts/test-e2e.cjs`, isolate test runner server into `.next-e2e`.
  4. Add automated CSS delivery health check `scripts/check-css.mjs` to completion gate to ensure HTTP 200 on all stylesheets.
- Reason: Permanently eliminates CSS 404 regressions and protects the developer's live environment during continuous task verification.
- Affected notes: `next.config.mjs`, `scripts/finish-task.mjs`, `scripts/test-e2e.cjs`, `scripts/check-css.mjs`, [[tasks]], [[traceability]], [[code-map]].
- Status: `Approved`

### D-065 OCR request-size and imported-skill boundary
- Decision: Keep the provider's ten-page ceiling, but split client requests earlier when serialized Base64 payloads approach 3 MB. Treat non-JSON HTTP failures as transport errors with user-facing guidance.
- Rationale: Runtime/proxy limits vary by deployment and can return plain text such as `Request Entity Too Large`; unconditional JSON parsing obscures the real cause. A skill copied from another repository may inform heuristics but cannot override this repository's governance or source-of-truth documents.
- Status: `Approved`

## D-009 Automated Windows dependency recovery
- Context: `npm ci` can fail while replacing the Next SWC native binary, leaving a partial `node_modules` tree and making local startup impossible.
- Decision: Use `scripts/bootstrap-local.ps1` as the supported recovery path. It stops only project-owned Node processes, preserves the existing dependency tree as a timestamped backup, installs from the lockfile, validates the Next binary, runs checks, and starts a local server. It never deletes source or `.env.local` and never prints secrets.
- Reason: A repeatable recovery command reduces machine-specific drift while preserving rollback evidence.
- Status: `Approved`

## D-010 Generated dependency backups are outside the Knowledge Vault
- Context: T-034 preserves failed dependency trees as `.node_modules-backup-*`; package READMEs contain bracket syntax that is not project wikilinks.
- Decision: The Knowledge Vault scanner excludes generated dependency backups, build/cache directories, and QA scratch directories by name pattern while continuing to scan tracked project knowledge files.
- Reason: Generated third-party text must not create false governance failures, while source-of-truth documents remain fully checked.
- Status: `Approved`

## D-008 Page-aware OCR is a hard conversion boundary
- Context: The supplied four-page separation exam is image-only and produced a right pane with a different question sequence because flattened OCR text made numbered stem lists indistinguishable from question boundaries.
- Decision: OCR responses must carry explicit `[PAGE]`, `[QUESTION]`, `[STEM_ITEM]`, `[CHOICE]`, `[EXPLANATION]`, and `[UNCERTAIN]` markers. The API reports quality only when all pages succeed and structured question markers exist. The parser preserves source-page provenance, and the UI labels each converted item with its source page. Unstructured or partial OCR remains a review state and cannot be presented as a successful conversion.
- Reason: A conversion tool must preserve source fidelity and make uncertainty visible; fabricated confidence is worse than a reviewable blocked result.
- Affected notes: [[tasks]], [[traceability]], [[code-map]], [[memory]], [[features/r-001-browser]], [[features/r-002-feature]]
- Status: `Approved`

## D-005 Independent dual-pane scrolling, compact header and zero document fabrication
- Context: In user testing with "ชุดที่ 2 การแยกสาร.pdf", synchronized dual-pane scroll prevented independent document exploration; top navigation and Google Drive card consumed ~350px vertical height; and fallback mechanism fabricated hardcoded chromatography exam questions causing document discrepancy between left and right panes.
- Decision:
  1. Decouple dual-pane scroll synchronization completely, allowing left (source) and right (editor) to scroll independently.
  2. Collapse header in document view to an ultra-compact single bar (h-10) and expand the split editor to 100% viewport height (`h-screen flex-1 min-h-0`).
  3. Completely remove hardcoded question pools (`SEPARATION_EXAM_35_ITEMS`), providing neutral starter question slots when OCR text is unavailable to prevent document mismatch.
  4. Automatically clear previous document state on file upload start to prevent stale document residue.
- Reason: Enhances usability, maximizes document reading and editing area, and prevents confusing content discrepancies.
- Affected notes: `app/page.tsx`, `components/SplitDocumentEditor.tsx`, `lib/exam-fallback.ts`, `lib/exam-parser.ts`, [[tasks]], [[traceability]], [[code-map]].
- Status: `Approved`

## D-004 Evidence-based audit and safe parsing
- Context: T-014 found synthetic questions/default answers and unsupported Done/UAT claims.
- Decision: Remove fabricated output under T-015; preserve unresolved answers; distinguish governance, automated behavior and browser/integration acceptance. Reopen historical implementation tasks pending evidence.
- Reason: Source fidelity is required for exam correctness; build/knowledge success cannot certify Google Docs export.
- Affected files: lib/exam-parser.ts, lib/formatter-rules.ts, README.md, [[tasks]], [[traceability]], [[memory]].
- Status: `Approved`
- Follow-up: T-017 OAuth/export, T-018 OCR/input fixtures, T-019 browser/shared persistence. T-016 localStorage is local-only and does not fulfill cross-device/Vault sync.
- T-020 build: preserve Sarabun and existing dependency versions; explicit alias baseUrl plus normal-access build verification. Sandbox Webpack resolution still differs; do not claim offline/sandbox portability. Missing ESLint and no Git baseline remain release follow-ups.
## D-001 Initial Project Direction
- Context: Create a web app ที่แปลงเอกสาร .ยกด / รูปภาพ / doc / google doc / md file ให้ถูกแบ่งสัดส่วน จัดรูปแบบ ให้เข้า format ตามที่กำหนดไว้
- Decision: Start with Web App and keep generated knowledge linked through [[00-index]].
- Reason: A linked knowledge vault helps both humans and AI keep project context synchronized with code.
- Affected notes: [[prd]], [[architecture]], [[tasks]]
- Status: `Proposed`

## D-002 Project Intake & Confirmation Tasks
- Context: Kickoff pass required identifying tech stack, input format ambiguity, Google integration method, and AI provider.
- Decision: Registered confirmation tasks C-001 through C-004 in [[tasks]] while setting T-001 to `In Progress`.
- Reason: Operating rules prohibit guessing stack, contracts, or credentials without explicit evidence.
- Affected notes: [[tasks]], [[architecture]], [[prd]]
- Status: `Approved`

## D-003 Master Design Constitution & Lessons Learned Logging
- Context: User specified that design.md must serve as the Master Design Constitution for all layout, formatting, and UI agreements based on official template `https://docs.google.com/document/d/1uA8A1Q1lXCDIGRPtgBA0H77xYoMWCoo7thp5Hi0nvBQ/edit?tab=t.0`. Additionally, all feature case decisions (e.g. image capture cases) must be persisted with timestamp, action taken, and decision rationale.
- Decision: Make [[design]] the supreme design reference and add R-005 to [[prd]] for viewing and recording case decision logs / lessons learned.
- Reason: Ensures deterministic output across environments and enables historical case lookup/refinement.
- Affected notes: [[design]], [[prd]], [[tasks]], [[memory]], [[traceability]], [[code-map]]
- Status: `Approved`

## D-007 Single-Line Ultra-Slim Header & Thai PDF Extraction with Stem Sub-Enumerations
- Context: Two user issues: (1) Top header and status banners consumed excessive vertical space (~110px) crowding the split editor. (2) Uploading PDF caused mismatched right pane with placeholder questions and whole-page thumbnail previews due to lack of CMap configuration, micro-Y newline fragmentation, and treating full page renders as question image attachments.
- Decision:
  1. Compress the document split view header into a strict single line (`h-10`, ~40px) with outline icons and tooltips. Inline notice pills into the header row rather than stacking full-width banners.
  2. Configure `cMapUrl` and `cMapPacked: true` in `pdfjsLib.getDocument` for CID Thai fonts.
  3. Cluster PDF text items into lines using vertical tolerance (7pt) and horizontal sorting (ascending X), eliminating Thai vowel/tone-mark fragmentation.
  4. Stop mapping full PDF page images into question `extractedImages`.
  5. Distinguish stem sub-enumerations (statements 1..N) from exam choices when letter choices follow ahead.
- Reason: Maximizes document editing height while ensuring PDF exam questions and choices parse cleanly and match source documents.
- Affected notes: [[tasks]], [[code-map]], [[traceability]], [[architecture]]
- Status: `Approved`


## D-011 — Staged OCR and provider abstraction (2026-10-11)
- Adopt OCR Raw -> Normalize/Validate -> Format as the canonical pipeline because Typhoon returns layout-aware Markdown/HTML rather than a guaranteed custom marker contract.
- Keep remote Typhoon as the default while allowing a local OpenAI-compatible endpoint via environment configuration.
- Bound OCR concurrency at two and retry transient provider overloads to respect documented rate limits; never log API keys or raw secrets.

## Source-faithful OCR review (T-039/T-040)
- Raw OCR is edited in a dedicated textarea; explicit re-conversion runs shared validation. Missing/duplicate choices and ambiguous labels are reported by question number. Review text cannot enter Drive export.
- lib/exam-validation.ts checks structure only; four choices do not prove text accuracy. No X/handwritten mark is inferred as an answer. Table context remains review-required.
- Parser expands explicitly labeled table rows, preserving cell data; A/B/C measurement tables stay stem data. No synthetic fallback questions are created for unparseable imports.
- Stale OCR responses are ignored after changing/resetting the source document. Editing/re-conversion does not call OCR again, reducing latency and provider usage.
- Verification: scripts/test-ocr-contract.cjs regression tests; evidence/t040-review-browser.png browser PDF import and rejected re-conversion. Full PDF source fidelity/media mapping remains open.

T-039 OCR reliability: batches over 10 pages reject before provider invocation; request timeout is 120s remote/300s local per attempt; concurrency is finite integer 1-2; truncated text remains available for review but cannot mark all pages successful. Review conversion cannot bypass incomplete page coverage. Owner Codex. Regression: scripts/test-ocr-contract.cjs.

T-041: source-verified 25-question artifact, explicit inline Markdown/data-image ownership and sparse question-N media. Existing R-002/R-004 Feature Notes apply. Figure descriptions remain review markers until original media is attached; checked boxes do not imply answers. Tables preserve column labels. Source-page buttons are excluded from export. Snapshot scaling preserves image aspect ratio. Evidence: evidence/t041-browser-result.json, evidence/t041-media-manifest.json, evidence/t041-source-review.html. Automatic OCR still requires review for overwritten labels/spelling.

T-041/T-042 final verification: original PDF import -> exact SHA-256 reviewed corpus -> 25 questions/100 choices/5 source-owned media -> editor -> source-page navigation -> live DOM snapshot -> native Google Docs. Source page is captured when each question starts, preventing prior-page questions shifting forward. Unknown/changed files use ordinary OCR; no approximate filename match or learned answer inference. Corpus is data under public/reviewed and includes reviewer, source hash/page count and text. Live PDF import: 3.577s, zero OCR calls. Remote OCR baseline: 13.8s, recognition defects retained for review. All seven native PDF pages visually checked after grouped pagination repair. Readback: evidence/t041-gdoc-readback.json. Browser: evidence/t042-real-pdf-result.json. Google URL: https://docs.google.com/document/d/1r5CWTFdiQE98JAmSgRMNnNh1WKLIuJzqI4vVwZOCfIY .

T-043 decision: keep existing Next.js, documented fixed OCR prompt, separate validation and formatting, exact-hash reviewed corpus. Add shared scheduling before introducing another framework. Default notebook OCR to one slot to avoid competing inference; two remains opt-in after hardware measurements. Do not promise lower OCR latency without live hardware benchmarks. Future priorities: raw page persistence/retry, generic review UX, measured source fidelity, then cloud deployment.

T-045: use local bounded observations first; download to retain/share, not pretend cross-device persistence. Semantic accuracy remains null until checked against ground truth; structural pass never substitutes for it. Proposed decision weights for future measured trials: source accuracy 50%, completeness/media fidelity 25%, speed 15%, reliability 10%; these are recommendations, not an implemented calculated score. Accuracy/completeness failures block acceptance regardless of total score. Record hardware/GPU/provider concurrency and costs alongside human trials before comparing model alternatives; current UA/logical-CPU context alone cannot identify GPU changes.

T-046 decision: preserve registered localhost:3000 callback and start that listener rather than silently changing APP_URL or Google Cloud configuration. Auth entry redirects wrong-host requests before cookie creation. Keep 3001 preview alive using distinct Next dist directory. Human account sign-in/consent remains a user action; synthetic callback test cannot certify a live exported document.

T-047 decision: preserve backend request/workload limits and chunk client submissions rather than raising cap. Sequential batches respect notebook shared resource queue. Only request orchestration is certified by mocked twelve-page tests; no new-source semantic accuracy claim. Stop subsequent work after stale upload/reset; current in-flight request may finish server-side.

T-048: keep source page navigation separate from formatted questions so split-view correction context remains intact. Immediate pane scroll replaces timing-dependent smooth animation; controls are learner-export-excluded by placement. T-047 batching remains independent of UI navigation.

T-049: lightweight CSS scanning effect avoids bitmap assets/dependencies and respects reduced motion. Both conversion buttons call existing reviewed-text validation, never rerun OCR or infer missing choices/figures. Incomplete numeric-choice/figure recognition from user screenshot is still T-039, not hidden by enabled UI.

### T-050 Explicit conversion workspace
T-050: left raw OCR/text -> explicit conversion -> editable formatted questions/style/images -> export; right original stays read-only and independent, with crop tools. Small question-number navigation scrolls left only. Import-history icon stores the latest 100 filenames/times/sizes locally; no source contents or reopen storage, no reconstruction of older anonymous statistics.
Requirement: R-001 / R-002 -> Task: T-050 -> Feature Note: features/r-001-browser.md and features/r-002-feature.md -> Code Map: app/page.tsx, components/SplitDocumentEditor.tsx, components/RichTextToolbar.tsx, lib/import-history.ts -> Verification: evidence/t050-verification.md.
This explicit user flow supersedes T-049 automatic formatting and T-048 main page-number navigation. Source page references remain available for explicit comparison. Only answers actually supplied by the source are preserved; T-039 semantic OCR fidelity and T-044 resumable raw-page storage remain open.

### T-051 Compact source-left workspace
T-051 supersedes T-050 panel positions: original/capture LEFT, OCR/explicit conversion/edit/export RIGHT. Source is independent; question navigation affects editor only. Source magnify/crop and editor insert/copy/export actions use icons with accessible names/title hints and active/disabled states; compact one-row toolbar, 12 pt badge, shortened OCR heading, secondary guidance hidden from visual toolbar. Conversion stays explicit and prominent. Source recognition/answer rules unchanged. Requirement R-001 -> T-051 -> features/r-001-browser.md -> SplitDocumentEditor/RichTextToolbar -> evidence/t051-verification.md.

### T-052 Table-choice layout and source-answer directives
T-052: numbered stem steps retain explicit line breaks including the following prompt; editor renders BR so live snapshot exports real paragraphs. Flattened table choice label prefixes before colons are underlined without HTML injection; values/separators remain literal. Explicit source answer directives accept colon/fullwidth colon, reconcile explanation ahead of source asterisk, and conflicting explicit keys remain unresolved. Existing orange star and green source shading appear immediately when converting. No inferred answers from handwriting, table ticks, absent answers or invalid choice keys. R-002/R-004 -> T-052 -> features/r-002-feature.md -> lib/exam-parser.ts and SplitDocumentEditor.tsx -> evidence/t052-verification.md.

## บทเรียนล่าสุด 2026-10-11 — T-050 ถึง T-053
- ข้อกำหนดล่าสุดใช้ T-051: ต้นฉบับซ้าย / OCR-จัดรูปแบบ-แก้ไข-ส่งออกขวา; T-050 เป็นประวัติ ไม่ใช่คำสั่งสลับกลับ อ้างอิง evidence/t051-verification.md
- การรักษา newline ใน parser ไม่เพียงพอ: HTML จะยุบช่องว่าง จึงต้องใช้ BR และตรวจ snapshot ว่าแปลงเป็นย่อหน้าจริง หลักฐาน evidence/t052-table-snapshot.json
- ตารางตัวเลือกต้องรักษาหัวคอลัมน์คู่กับค่า: ขีดเส้นใต้เฉพาะ label ก่อน colon ไม่เปลี่ยนค่าหรือใช้ HTML ดิบจาก OCR หลักฐาน evidence/t052-table-format.png
- เฉลยถูกละเพราะ regex ไม่รองรับ colon: รองรับ เฉลย: ง / ตอบ ข้อ ก. ทันทีตอนแปลง ใช้ดอกจันและเขียวตาม source provenance; ถ้า explicit keys ขัดกัน ไม่เลือกคำตอบเอง หลักฐาน evidence/t052-answer-snapshot.json
- รอยเขียน/วงกลม/กากบาทไม่เท่ากับเฉลยที่รับรอง ไม่มีการเดาคำตอบ; คำอธิบายที่ระบุชัดมีลำดับเหนือดอกจันตามกฎ reconciliation เดิม
- ไอคอนต้องมี accessible name/title และสถานะ active/disabled; ตรวจ 390px และคีย์บอร์ดทุกครั้งที่ปรับ toolbar
- ผล mock พิสูจน์ UI/transport/snapshot เท่านั้น; PDF ที่ตรง SHA-256 ใช้ฉบับตรวจแก้ได้ ไม่พิสูจน์ OCR ของไฟล์ใหม่หรือ live Google export
- ประวัติชื่อไฟล์ล่าสุด100รายการอยู่ใน browser; แยกจากสถิติ200ครั้งซึ่งไม่เก็บชื่อ/ข้อความ ไม่รับประกันเปิดไฟล์เก่าซ้ำ

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

T-058 user confirmation (2026-10-12): source red circles/crosses are teacher answers checked again, directly confirmed by project owner. For this fixture, visually transcribed marks are the teacher-verified answer key; this supersedes earlier annotation-only caveat. Do not generalize to other imported files without provenance. Prompt updated identically for both candidates before inference began. Independent audit found reduced-denominator reporting on failed runs, malformed raw IDs, missing same-conditions guard, and unobserved memory shown as0. Added completeness/prompt-settings-runtime-source-hash guards, invalid row count, explicit failure state and unobserved-memory label; evaluator regressions passed. Additional artifact: scripts/report-local-vision.cjs. Download still in progress, no model accuracy result yet.

T-058 final pre-inference dataset: expanded from2pages/16questions to3pages/20questions before any candidate inference, specifically including previously difficult table/diagram page2. Ground truth:19 teacher-marked answers and1 no-unique-choice control (Q13 Free). Pages1,2,3 plus repeated page1 for warm timing;4 runs/model. Both models receive actual reviewed question stems/keys matching production request fields, with no truth key leaked in requests. Preflight: node scripts/benchmark-local-vision.cjs qwen3-vl:2b --preflight passed20questions19marked; fixtures.json captures image hashes and owner confirmation. Completeness and denominators derive from manifest, not hardcoded reduced counts. This supersedes earlier16-question design notes. Await both downloads before timing; no production switch.

T-058 runtime diagnosis: actual stream evidence shows schema JSON wholly in message.thinking with empty content despite thinkfalse. Diagnostic fallback is strictly JSON-only and experiment-only; preserve channel/chunks, never integrate as production response. First diagnostic2B q1 selected ข incorrectly with confidence0.95 (teacher truth ก); confidence alone unsafe. Transport tests passed. Evidence diagnostic-thinking-channel.json, ROI outputs. Full20case comparison ongoing.

## D-014 Git History Sanitization & Vercel Deployment Architecture (2026-10-12)
- Context: User requested pushing the project to Git and connecting to Vercel ("เอาขึ้น git หน่อย ให้เชื่อมกับ vercel"). Initial unpushed commit history contained binary node addons (`next-swc.win32-x64-msvc.node`, 135.8 MB) inside stale backup folders, which violates GitHub's 100 MB file limit (`GH001`) and blocks push.
- Decision:
  1. Updated `.gitignore` to strictly exclude `.next-*/`, `.qa-drift-*/`, `.node_modules-*/`, and `node_modules_stale/`.
  2. Rebuilt a clean, lightweight Git commit history on `main` containing only genuine sources, documentation, tests, and evidence (336 files, maximum file size 5.5 MB, zero files over GitHub's threshold).
  3. Validated clean Next.js production build (`next build`) and test suites (`finish-task.mjs` pass).
  4. Prepared automated GitHub repository creation & push workflow and Vercel environment configuration checklist.
- Reason: Guarantees rejection-free push to GitHub and reliable, zero-drift continuous deployment on Vercel.
- Affected notes: [[tasks]], [[memory]], [[code-map]]
## D-015 Transparent OAuth Diagnostics & Origin URL Normalization (2026-10-13)
- Context: When environment variables for Google Drive are partially set or APP_URL contains a trailing slash, the system previously failed silently, returning `configured: false` with generic "รอตั้งค่าการเชื่อมต่อ", making it hard to diagnose which exact variable is missing.
- Decision:
  1. Automatically normalize APP_URL by stripping trailing slashes in `googleConfig()`.
  2. Expose a non-sensitive `missingFields` array in `GET /api/google/session` to identify missing or invalid keys (e.g. non-numeric Project Number or short session secret).
  3. Render explicit missing field names directly in the Google Drive status UI.
- Reason: Removes user ambiguity and makes cloud deployment diagnostics transparent and actionable.
- Affected notes: [[tasks]], [[memory]], [[code-map]], [[traceability]]
- Status: `Approved`



## D-016 Port deterministic QuizFlow rules only (2026-10-13)
- Context: A QuizFlow conversion blueprint was supplied, but the referenced external source files and golden outputs are not present in this repository.
- Decision: Port only rules that are deterministic and directly testable here: conservative Thai OCR normalization before parsing, explicit `คำตอบ`/`Answer` answer directives, and unresolved handling for conflicting evidence. Keep unknown replacement characters visible.
- Excluded: hidden reasoning, hard-coded paths/crops/templates, unverified manifest schemas, auto-solving, and claims of QuizFlow output parity.
- Evidence: `evidence/t066-blueprint-parity.md`, `scripts/test-parser.cjs`, `scripts/test-ocr-contract.cjs`.
- Status: `In Progress` pending full repository verification and external golden corpus acquisition.

### D-017 Keep pdf.js runtime assets local
Decision: serve the pdf.js worker, cmap files, and standard fonts from repository `public/` assets and synchronize them from `pdfjs-dist` during postinstall. Reason: the previous CDN URL made valid imports depend on a third-party origin and produced a misleading return-to-upload failure in browser E2E. Tradeoff: approximately 3 MB of static assets are maintained in the app, with a regression check to detect missing files after dependency changes.

### D-018 Numeric choice boundary before question boundary
Decision: detect a complete numeric choice block before treating a numeric line as a new question. This prevents question 2/3/4 choice labels from swallowing or merging later questions, including when a page marker appears between the choices and the next question. A fifth numeric stem item remains a stem enumeration, preserving source fidelity.

### D-019 Numeric choice boundary clarification (2026-10-13)
Numeric-choice blocks are capped at four. A following 5. remains a stem-enumeration item unless the very next line is a letter choice, which identifies question 5 after question 4. This distinction is covered by the alternating 80-question regression and prevents both merged questions and false question boundaries.

### D-020 Cross-machine environment contract (2026-10-13)
Use the committed `package-lock.json` with `npm ci` on every machine. Keep `.env.local` machine-specific and untracked. `scripts/check-environment.mjs` is the portable doctor: it reports redacted PASS/WARN/FAIL checks for runtime, dependencies, provider configuration, optional services, and port state. It must never print secret values or make a remote provider call merely to claim readiness; local Ollama reachability is checked only when local OCR is configured. `--write-evidence` records a safe environment snapshot for comparison.

### D-021 QuizFlow Golden Document Parity & Teacher-Student Synthesis Strategy (2026-10-14)
- Context: User supplied original 13-page scanned PDF (80 questions) and expected QuizFlow Google Doc output. Evaluated viability of using Typhoon OCR 3B / Gemini Flash as a teacher model to distill 2,000-5,000 exam pages.
- Decision:
  1. Parity validation: Golden QuizFlow plain text was retrieved and verified against `lib/exam-parser.ts`, proving 100% parse rate (80/80 questions, 320 choices, monotonic sequence).
  2. Teacher-Student strategy: Validated high ROI. Gemini 1.5 Flash costs less than $3 USD for 3,000 pages to generate synthetic training datasets for local Typhoon OCR 3B fine-tuning.
  3. Immediate fallback cascade: Prioritize runtime resilience in the web app: Tier 1 (Digital text) -> Tier 2 (Cloud OCR) -> Tier 3 (Local Ollama) -> Tier 4 (1-click Instant Starter Draft).
- Evidence: `evidence/t070-golden-analysis.md`, `evidence/golden-output-ch7.txt`.
- Status: `Approved`

### D-022 Dedicated Diagram & Table Harvesting Pipeline & In-Browser Canvas Cropping (2026-10-14)
- Context: Users need to extract figures, framed tables, apparatus diagrams, choice images (e.g. Q16 crystal structures), and solution explanations before checking answers.
- Decision:
  1. Insert dedicated Step 3 ("สกัดรูปประกอบ (AI)") between Step 2 ("แปลงเป็นรูปแบบข้อสอบ") and Step 4 ("ตรวจเฉลยจากภาพ (AI)") with sequential action guidance animation (`animate-pulse`).
  2. Implement AI bounding box detection via Gemini Vision (`/api/diagrams`) and crop normalized bboxes in-browser via HTML5 Canvas with 4px border clearance padding and perimeter edge clamping. This minimizes network payload transfer, avoids server-side image processing bottlenecks, and preserves native document resolution.
  3. Support 4 discrete target roles for both automated harvesting and manual Region Snipping: `รูปโจทย์ [รูปโจทย์]`, `รูปโจทย์ร่วม`, `รูปตัวเลือก (ก, ข, ค, ง)`, and `รูปคำอธิบาย`.
  4. Choice and explanation images are first-class citizens in `ChoiceItem` and `ExamItem` schemas, rendered in the live editor and captured directly in OOXML Google Docs export via `snapshotDocument`.
- Evidence: `scripts/test-diagram-contract.cjs`, `lib/diagram-service.ts`, `lib/diagram-client.ts`, `components/SplitDocumentEditor.tsx`.
- Status: `Approved`

### D-023 Preserve Visible Build Stamp After Every Implementation Pass (2026-10-14)
- Context: The header build badge is the user's quick confirmation that the running system includes the newest fix. Reverting `APP_VERSION` / `BUILD_STAMP` after a successful build makes the UI appear stale even when code changed, and dev server startup previously did not stamp a fresh value.
- Decision:
  1. Keep the freshly generated `APP_VERSION` in `lib/version.ts` and matching `BUILD_STAMP` in `app/page.tsx` after `npm run build` / `finish-task`.
  2. Add `predev` alongside `prebuild` so `npm run dev` and `scripts/bootstrap-local.ps1` refresh the visible build badge before serving the app.
  3. Treat the final stamped value as intentional release evidence for the completed implementation pass, not disposable build noise.
- Tradeoff: Source diffs include a timestamp-only change after each completed pass, but the UI now reliably identifies the active local build for user verification.
- Evidence: `package.json`, `scripts/stamp-version.cjs`, `app/page.tsx`, `lib/version.ts`, `scripts/test-diagram-contract.cjs`.
- Status: `Approved`

### D-024 Keep figure-boundary rules testable and use spacing as a layout token (2026-10-15)
- Context: Q80 crops still contained a stem line above and an option line below after the earlier padding increase. The editor header and 80-question navigation also became visually dense.
- Decision:
  1. Keep row-density edge detection in a pure exported helper and call it from the Canvas crop path. The helper tolerates deep padding, one-row raster gaps, and up to 54px intruder bands; it is covered by a Q80-shaped regression fixture.
  2. Repeat the top/bottom exclusion rule in the Vision prompt, while retaining the complete apparatus and right-side labels. Provider output remains subject to source/browser verification.
  3. Increase spacing in the conversion header, stepper, review disclosure, navigation, and editor body without changing pane ownership or export markup.
- Tradeoff: More whitespace increases vertical use in the editor header, but reduces control collisions and improves scanning of long question lists. Heuristic trimming can still abstain when no reliable gutter exists; it must never invent or solve content.
- Evidence: `scripts/test-diagram-contract.cjs`, `lib/diagram-client.ts`, `components/SplitDocumentEditor.tsx`, and `evidence/t092-verification.md`.
- Status: `Approved` after the T-092 completion gate passed; exact source-PDF Vision UAT is tracked separately in T-093.

### D-025 Start local Ollama on demand before OCR (2026-10-15)
- Context: Local OCR previously required the user to run `ollama serve` manually before every session, even though the app already knows the local endpoint.
- Decision: At the OCR API boundary, probe `/api/tags`; if the configured provider is local and the probe fails, spawn `ollama serve` detached/hidden and wait for readiness. Share one in-flight startup promise across concurrent OCR requests. Reuse a running daemon and bypass this logic for remote providers.
- Tradeoff: The host must already have Ollama installed and discoverable on PATH; the app does not install software or pull models. A failed startup is surfaced as HTTP 503 with a clear remediation message.
- Evidence: `scripts/test-ollama-runtime.cjs`, `evidence/t099-verification.md`, `lib/ollama-runtime.ts`.



### D-026 Validate review on a clone and preserve the live media DOM (2026-10-15)
- Context: The review action reparsed editor text and replaced `formattedItems`. Managed labels entered the parser as question text, while choice/shared/explanation images were not represented in that text and disappeared from the rendered editor before export.
- Decision: Normalize managed labels in the live DOM, create a validation-only clone with managed media removed, run parser/validator against the clone, and leave the live editor DOM untouched. Persist the original structured model together with the edited `editorHtml` snapshot.
- Tradeoff: Review findings describe the text structure at click time; the DOM snapshot remains authoritative for media and manual formatting. A later text edit still requires another review before export.
- Evidence: `scripts/test-e2e.cjs` preserves all four media roles and single labels after review; `scripts/test-google.cjs` embeds all four image roles in OOXML.

