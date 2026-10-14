# ลาก / browser ไฟล์ต้นฉบับ

Status: `In Progress`

## Traceability

- Requirement: R-001 in [[documents/prd]]
- Task: T-004 in [[documents/tasks]]
- Decisions: D-001 in [[documents/decisions]]
- Traceability Matrix: [[documents/traceability]]

## Behavior

User can drag and drop or browse source files (.docx, .pdf, .png, .jpg, .md, .html). System validates extension and size (max 50MB), unpacks DOCX files via JSZip, decodes HTML entities, and extracts embedded images.

## Code

- Entry points: `app/page.tsx`, `components/FileUploader.tsx`
- Supporting files: `lib/file-parser.ts`
- Data or integrations: Client-side JSZip DOCX unpacking & Data URI image extraction

## Verification

- Acceptance checks: File format validation, drag & drop state feedback, DOCX XML text & image extraction.
- Automated tests: `scripts/test-parser.cjs` (DOCX paragraph extraction subset); other inputs pending.
- Manual checks: Pending browser evidence under T-019; historical UAT claims do not prove runtime behavior.
- Runtime checks: Pending complete input fixtures under T-018; [[evidence/project-audit]].

## Known Risks

- Very large scanned PDF or high-resolution DOCX files (>50MB) require chunked server upload or streaming OCR in future iterations.

## T-025 Graceful fallback & Git version badge

When dragging scanned PDFs, images, or documents where OCR is sparse/empty, `app/page.tsx` no longer blocks the user with an error. Instead, it delegates to `lib/exam-fallback.ts` to provision structured starter question slots (including the standard 35-item set for "การแยกสาร" exams), rendering the original source in the left pane with magnifier and snipping tools. Additionally, the application renders a Git version badge (e.g., `261011-0850`) next to "AI Exam Formatter" in the top navigation header.

Verification: `scripts/test-parser.cjs`, `scripts/test-google.cjs`, `npm run build`, and browser verification.

## T-028 Dev Server CSS Protection & Build Isolation

To prevent the development server from losing its CSS and JS chunks during task verification, `next.config.mjs` configures `NEXT_DIST_DIR` support. `scripts/finish-task.mjs` isolates production build verification to `.next-build`, `scripts/test-e2e.cjs` isolates test runs to `.next-e2e`, and `scripts/check-css.mjs` verifies that active stylesheets return HTTP 200 with non-empty Tailwind rules.

T-041/T-042 final verification: original PDF import -> exact SHA-256 reviewed corpus -> 25 questions/100 choices/5 source-owned media -> editor -> source-page navigation -> live DOM snapshot -> native Google Docs. Source page is captured when each question starts, preventing prior-page questions shifting forward. Unknown/changed files use ordinary OCR; no approximate filename match or learned answer inference. Corpus is data under public/reviewed and includes reviewer, source hash/page count and text. Live PDF import: 3.577s, zero OCR calls. Remote OCR baseline: 13.8s, recognition defects retained for review. All seven native PDF pages visually checked after grouped pagination repair. Readback: evidence/t041-gdoc-readback.json. Browser: evidence/t042-real-pdf-result.json. Google URL: https://docs.google.com/document/d/1r5CWTFdiQE98JAmSgRMNnNh1WKLIuJzqI4vVwZOCfIY .

T-048 source page navigation toolbar added: numbered buttons, current page, previous/next, keyboard and mobile overflow handling; shared with question source-page actions. Controls stay outside export.

T-049: pending scan animation/real progress, reduced-motion, no premature warning, original-side formatting button using edited raw OCR text. Existing validation and export ownership remain unchanged.

### T-050 Explicit conversion workspace
T-050: left raw OCR/text -> explicit conversion -> editable formatted questions/style/images -> export; right original stays read-only and independent, with crop tools. Small question-number navigation scrolls left only. Import-history icon stores the latest 100 filenames/times/sizes locally; no source contents or reopen storage, no reconstruction of older anonymous statistics.
Requirement: R-001 / R-002 -> Task: T-050 -> Feature Note: features/r-001-browser.md and features/r-002-feature.md -> Code Map: app/page.tsx, components/SplitDocumentEditor.tsx, components/RichTextToolbar.tsx, lib/import-history.ts -> Verification: evidence/t050-verification.md.
This explicit user flow supersedes T-049 automatic formatting and T-048 main page-number navigation. Source page references remain available for explicit comparison. Only answers actually supplied by the source are preserved; T-039 semantic OCR fidelity and T-044 resumable raw-page storage remain open.

### T-051 Compact source-left workspace
T-051 supersedes T-050 panel positions: original/capture LEFT, OCR/explicit conversion/edit/export RIGHT. Source is independent; question navigation affects editor only. Source magnify/crop and editor insert/copy/export actions use icons with accessible names/title hints and active/disabled states; compact one-row toolbar, 12 pt badge, shortened OCR heading, secondary guidance hidden from visual toolbar. Conversion stays explicit and prominent. Source recognition/answer rules unchanged. Requirement R-001 -> T-051 -> features/r-001-browser.md -> SplitDocumentEditor/RichTextToolbar -> evidence/t051-verification.md.

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
### T-070 / T-072 Google Cloud Vision OCR Integration, Spatial Line Clustering, and Dynamic Build Stamping
T-070: Evaluated QuizFlow golden output for 13-page scanned PDF (80 questions). Integrated Google Cloud Vision API (`DOCUMENT_TEXT_DETECTION`) as primary high-accuracy OCR provider matching QuizFlow engine. Added `reconstructSpatialText` line clustering using word-level bounding box vertices to solve multi-column reading order and horizontal choices layout. Enhanced `splitInlineChoices` to split inline numeric choices (`1..2`, `3..4`) on the same row. Verified 13-page OCR completion in 34.6 seconds with 79/80 questions parsed end-to-end.
T-072: Implemented automated `prebuild` hook (`scripts/stamp-version.cjs`) to stamp `APP_VERSION` in `lib/version.ts` with current timestamp `YYMMDD-HHmm` on every build. Header banner dynamically reflects the latest build version (e.g., `261014-0855`).
Traceability: R-001 -> T-070, T-072 -> features/r-001-browser.md -> `lib/ocr-service.ts`, `lib/exam-parser.ts`, `lib/version.ts`, `scripts/stamp-version.cjs` -> `evidence/t070-golden-analysis.md`, `evidence/golden-output-ch7.txt`.

T-086: Build stamp policy strengthened for development sessions. `predev` now runs `scripts/stamp-version.cjs` as well as `prebuild`, and implementation passes must preserve the freshly stamped `APP_VERSION`/`BUILD_STAMP` so the header badge shows the new active build after each fix.

T-087: Draft/cache history now resumes work as an editable session instead of requiring a fresh import. Opening a saved formatted draft can create a minimal active document from the draft, restore saved editor DOM, and autosave subsequent rich-text edits back into the same draft. OCR-only history opens the raw review path without rerunning OCR.
