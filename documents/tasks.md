# Tasks
## Related
- [[00-index]]
- [[prd]]
- [[architecture]]
- [[decisions]]
## Backlog
### T-001 Kick Off The Project Context
- Type: `Project Setup`
- Status: `Done`
- Acceptance Criteria:
  - Missing assumptions are confirmed or recorded as confirmation tasks in tasks.md.
  - Project Scaffolding Baseline (Next.js 14 / TypeScript / Tailwind CSS) created and verified with clean production build.
- Detail:
  - Review generated documents.
  - Record weak-evidence items requiring owner confirmation.
  - Set up Next.js + TypeScript scaffolding complying with Master Design Constitution.

### T-004 Implement R-001 Drag & Drop File Upload Engine
- Type: `Feature`
- Status: `Ready`
- Acceptance Criteria:
  - User can drag & drop or click to browse files (.docx, .pdf, .png, .jpg, .md, .html).
  - Validates file type and size (rejects unsupported extensions with clear error message).
  - Displays file metadata (name, size, mime type, last modified date).
  - Parses DOCX files using JSZip to extract `document.xml` text & image relationships.
  - Unit test / build verification passed cleanly.
- Affected Files:
  - `components/FileUploader.tsx`
  - `lib/file-parser.ts`
  - `app/page.tsx`
  - `features/r-001-browser.md`
  - `documents/code-map.md`

### T-005 Implement R-002 Core Formatting Engine & Master Constitution Alignment
- Type: `Feature`
- Status: `Ready`
- Acceptance Criteria:
  - Parses exam raw text into structured questions (Question text, images, choices, correct answer, explanation).
  - Enforces Master Design Constitution styling rules (12pt, `#F2604D` bold orange, `#006D77` teal, dual-color background).
  - Implements Master Answer Key Auto-Reconciliation (Feature D).
  - Implements Section Reset Parser & Nested Number Guard (Feature B).
  - Builds and passes quality checks cleanly.
- Affected Files:
  - `lib/exam-parser.ts`
  - `lib/formatter-rules.ts`
  - `components/ExamFormatterPreview.tsx`
  - `app/page.tsx`
  - `features/r-002-feature.md`
  - `documents/code-map.md`

### T-006 Implement R-005 Case Decision Engine & Interactive Lessons Learned UI
- Type: `Feature`
- Status: `Ready`
- Acceptance Criteria:
  - Interactive Case Decision Manager component / drawer / page route (`/cases` or modal).
  - Case entry schema includes: Source file name/link, problem description, decision rationale, output result, timestamp, status.
  - Pre-populated with canonical cases (Image Crop Sweeping, Answer Key Reconciliation, Multi-Set Reset).
  - Persists cases to `lib/case-ledger.ts` and syncs with Obsidian Knowledge Vault for AI learning.
  - Builds and passes quality checks cleanly.
- Affected Files:
  - `lib/case-ledger.ts`
  - `components/CaseDecisionManager.tsx`
  - `app/page.tsx`
  - `features/r-005-lessons-learned.md`
  - `documents/code-map.md`

### T-007 Implement Full-Screen Synchronized Split View & Editable Document Formatter
- Type: `Feature`
- Status: `Ready`
- Problem: Overhaul UI to Full-Screen 50-50 Split View after file import: Left panel displays original source document; Right panel displays continuous editable formatted document (12pt font, rich text formatting: Bold, Italic, Underline, Copy/Paste, Insert Image) with synchronized dual-pane scrolling.
- Acceptance Criteria:
  - After file import, UI transitions into a full-width 50-50 split view.
  - Left panel renders full original source text and images continuously with scroll.
  - Right panel renders full formatted exam continuously across ALL items (no paginated single-item card).
  - Right panel provides rich-text inline editing (Bold, Italic, Underline, Copy/Paste, Insert Image).
  - Mouse scroll position is synchronized between Left and Right panels.
  - Builds and passes quality checks cleanly.
- Affected Files:
  - `components/SplitDocumentEditor.tsx`
  - `components/RichTextEditorBar.tsx`
  - `components/ExamFormatterPreview.tsx`
  - `app/page.tsx`
  - `features/r-004-feature.md`
  - `documents/code-map.md`

### T-008 Enhance Original Source Viewer (PDF & Image)
- Type: `Feature`
- Status: `Ready`
- Problem: Left panel of 50-50 split view needs to render original PDF (iframe viewer) and image sources (.png/.jpg) natively instead of text placeholder string.
- Acceptance Criteria:
  - Left panel embeds PDF viewer iframe for `.pdf` uploads.
  - Left panel displays original source image for `.png`, `.jpg`, `.jpeg` uploads.
  - Left panel displays parsed raw text and images for `.docx`, `.md`, `.html` uploads.
  - Dual-pane scroll synchronization works seamlessly.
  - Builds and passes quality checks cleanly.
- Affected Files:
  - `lib/file-parser.ts`
  - `components/SplitDocumentEditor.tsx`
  - `documents/tasks.md`
  - `documents/audit-log.md`
  - `documents/code-map.md`

### T-009 Apply Sarabun 12pt Light Font to Main Document Text
- Type: `Feature`
- Status: `Ready`
- Problem: Main document text (question text, choice text, explanation text) must use Google Font Sarabun 12pt light/regular weight ("ตัวบาง").
- Acceptance Criteria:
  - Import Google Font Sarabun (weights 300, 400, 500, 600, 700) in `app/layout.tsx` and `app/globals.css`.
  - Set default font-family to Sarabun 12pt.
  - Question text, choice text, and explanation text explicitly use Sarabun 12pt light/regular weight (`font-light` / `font-normal`).
  - Builds and passes quality checks cleanly.
- Affected Files:
  - `app/layout.tsx`
  - `app/globals.css`
  - `components/SplitDocumentEditor.tsx`
  - `components/ExamFormatterPreview.tsx`
  - `documents/tasks.md`
  - `documents/audit-log.md`
  - `documents/code-map.md`

### T-010 Full-Width Clean PDF Viewer, Interactive Magnifier Glass & Continuous Multi-Question Scroll Sync
- Type: `Feature`
- Status: `Ready`
- Problem: Strip PDF iframe toolbar/navpanes (`#toolbar=0&navpanes=0&view=FitH`), add interactive Magnifier Glass inspection tool for left panel, and populate multi-question exam items (Questions 1..N) with dual-pane scroll synchronization.
- Acceptance Criteria:
  - Left PDF viewer hides sidebar thumbnails & top toolbar (`#toolbar=0&navpanes=0&view=FitH`) to maximize document reading space.
  - Interactive Magnifier Glass toggle tool allows spot inspection (2.5x zoom lens) on left panel.
  - Multi-question exam items (Questions 1..N) render continuously on the right panel.
  - Dual-pane scroll synchronization works seamlessly.
  - Builds and passes quality checks cleanly.
- Affected Files:
  - `lib/file-parser.ts`
  - `lib/exam-parser.ts`
  - `components/SplitDocumentEditor.tsx`
  - `documents/tasks.md`
  - `documents/audit-log.md`
  - `documents/code-map.md`

### T-011 Fix Magnifier Glass, Native Scroll Sync & Region Snipping/Capture Engine
- Type: `Feature`
- Status: `Ready`
- Problem: PDF iframe intercepted mouse/scroll events, breaking Magnifier Glass and scroll sync; Region Snipping/Capture tool was missing.
- Acceptance Criteria:
  - Left panel mouse-event overlay backdrop enables 100% reliable 2.5x Magnifier Glass Lens over PDF pages and images.
  - Dual-pane scroll ratio synchronization between Left and Right panels works seamlessly.
  - Interactive Region Snipping/Capture Tool (📸 แคปภาพเฉพาะจุด) allows drag-select cropping of diagrams/equations and inserting into Right Panel editor.
  - Builds and passes quality checks cleanly.
- Affected Files:
  - `components/SplitDocumentEditor.tsx`
  - `components/RegionCaptureTool.tsx`
  - `documents/tasks.md`
  - `documents/audit-log.md`
  - `documents/code-map.md`

### T-012 Native PDF Canvas Engine, Real-Pixel Magnifier, Pixel Crop & Clean File Reset
- Type: `Feature`
- Status: `Ready`
- Problem: Replace PDF iframe with client-side PDF Page Canvas/Image Renderer to eliminate iframe event-isolation; enable true pixel-magnification and pixel-cropping; ensure full state reset and new file parsing when uploading different files; adopt yymmdd-hhmm git commit format.
- Acceptance Criteria:
  - PDF pages are rendered directly into the Left Panel as full-resolution DOM canvas/images.
  - Magnifier Glass lens magnifies the actual rendered page pixels under cursor.
  - Region Snipping tool crops the actual canvas pixels of the document and inserts into the right panel item.
  - Left-to-Right scroll synchronization uses native DOM scroll events.
  - Re-uploading a file completely resets state and reads the new file's content (e.g. `การแยกสาร.pdf`).
  - Git commit messages format strictly follows `yymmdd-hhmm - [message for commit]`.
  - Builds and passes quality checks cleanly.
- Affected Files:
  - `lib/pdf-renderer.ts`
  - `lib/file-parser.ts`
  - `lib/exam-parser.ts`
  - `components/SplitDocumentEditor.tsx`
  - `app/page.tsx`
  - `documents/tasks.md`
  - `documents/audit-log.md`
  - `documents/code-map.md`

### T-013 Optical Centered Magnifier, 1-35 Question Sequence Matching & Fresh Keyed State Reset
- Type: `Bug / Feature`
- Status: `Ready`
- Problem:
  1. Magnifier lens was displaced from mouse cursor because container scale did not calculate lens center offset.
  2. Questions on right started from 21 instead of 1, and only had 5 questions so scrolling ran out of content when reaching later pages (e.g. Question 29).
  3. Uploading a new file kept old editor instance without fresh remount.
- Acceptance Criteria:
  1. Optical centered magnifier: Exact spot under cursor is placed at center of circular lens `(100 - docX * M, 100 - docY * M)`.
  2. Question sequence starts from Question 1 and extends continuously across all pages (Questions 1 to 35) matching Page 1 to 12.
  3. Left and right scrolling remains synchronized across the entire 12-page document (Questions 1 to 35).
  4. Region Capture crops real canvas/image slice directly from the active page.
  5. SplitDocumentEditor uses dynamic key (`key={parsedFile.fileName + "_" + Date.now()}`) to force clean remount on file change.
  6. Git commit commands strictly use `yymmdd-hhmm - [message for commit]`.
  - Builds and passes quality checks cleanly.
- Affected Files:
  - `lib/exam-parser.ts`
  - `components/SplitDocumentEditor.tsx`
  - `app/page.tsx`
  - `documents/tasks.md`
  - `documents/audit-log.md`
  - `documents/code-map.md`







### Needs Confirmation (Confirmation Tasks)
- **C-001 Tech Stack Baseline**: Confirm preferred stack (Architecture recommends Next.js / TypeScript / React / Node.js or Python backend for docx/pdf handling).
- **C-002 Input Format Definition**: Clarify target input formats (`.กน` assumed to be `.docx` / `.pdf` / image / doc / md).
- **C-003 Google Drive & Docs Integration Method**: Confirm authentication mechanism (Service Account vs OAuth2 User Handoff) and target Drive folder ID.
- **C-004 AI Provider Selection**: Confirm primary AI model provider (Gemini / OpenAI / Claude) and API key configuration method.
### T-002 Implement The Core Feature Set
- Type: `Feature`
- Status: `Proposed`
- Acceptance Criteria:
  - Each core feature is split into a small task before implementation.
- Detail:
  - R-001: ลาก / browser ไฟล์ต้นฉบับ
  - R-002: แปลงเอกสารให้เข้ารูปแบบที่กำหนด
  - R-003: ได้เอกสารในรูปแบบ google doc ไว้ใน dirve ที่กำหนด
  - R-004: ปรับแต่ง ตัวหนา ตัวเอียง ขีดเส้นใต้ได้ (อนาคตอยากให้รองรับ สูตรเลข สูตรเคมี เลขยกกำลัง)
### T-003 Validate Success Criteria
- Type: `Verification`
- Status: `Proposed`
- Acceptance Criteria:
  - Evidence confirms: ได้เอกสารในรูปแบบ google doc ไว้ใน dirve ที่กำหนด ตามรูปแบบ template ที่กำหนดไว้
- Detail:
  - Check that the implementation satisfies: ได้เอกสารในรูปแบบ google doc ไว้ใน dirve ที่กำหนด ตามรูปแบบ template ที่กำหนดไว้
## Task Lifecycle
- `Proposed`: request captured but not ready to implement
- `Ready`: scope and acceptance criteria are clear
- `In Progress`: implementation may begin
- `Verified`: relevant checks passed and evidence is recorded
- `Done`: affected knowledge documents are synchronized
## Per-Task Definition Of Done
Add this checklist inside every implementation task and reset it for each new task:
- [ ] Acceptance Criteria satisfied
- [ ] Core behavior covered by a real automated test; build-only evidence is not enough
- [ ] If no behavior-test command exists, a Test Setup follow-up Task is recorded and the requirement remains unverified
- [ ] Relevant verification passed and recorded
- [ ] [[tasks]] updated with result and follow-up work
- [ ] [[prd]] updated if product behavior or scope changed
- [ ] [[architecture]] updated if technical structure changed
- [ ] [[decisions]] updated if a meaningful tradeoff was made
- [ ] [[00-index]] updated if knowledge links changed
### T-014 Audit backlog and correct completion reporting
- Type: `Verification`
- Problem: README, task statuses and UAT claims disagree; product goal R-003 is absent and governance checks do not prove behavior.
- Status: `Done`
- Lifecycle: Proposed -> Ready -> In Progress (2026-10-10)
- Owner: Primary Codex agent (governance); audit_code agent (read-only code audit).
- Acceptance Criteria: Publish evidence-backed priorities, owners and blockers; synchronize current-state documents; run completion gate and report actual result.
- Affected Files: README.md, documents/tasks.md, documents/prd.md, documents/architecture.md, documents/traceability.md, documents/code-map.md, documents/decisions.md, documents/memory.md, documents/00-index.md, evidence/project-audit.md.
- Expected verification: Knowledge validator, platform readiness, drift check, finish-task gate; no product UAT claim without runtime evidence.
- Verification result: finish-task exit 0 with normal filesystem/network access; `evidence/project-audit.md`. Browser attempt timed out; lint/drift limitations disclosed.
- [x] Acceptance Criteria satisfied for audit scope; product completion excluded.
- [x] Relevant checks executed and evidence recorded.
- [x] Tasks, PRD, architecture, decisions, traceability, code-map, memory and index synchronized.
- [x] Behavioral tests added by T-015/T-016; no UAT claims from build.
- Lifecycle update: In Progress -> Verified -> Done (2026-10-10); final gate exit 0 in evidence/completion-gate.txt.

### T-015 Establish real parser regression tests and fix fabricated output
- Type: `Bug`
- Problem: Parser substitutes hard-coded exam questions when parsing yields zero or one item and invents a correct answer without source evidence.
- Status: `Done`
- Lifecycle: Proposed -> Ready -> In Progress (2026-10-10)
- Owner: Parser implementation agent.
- Acceptance Criteria: Preserve real single questions; never fabricate fallback questions or unsupported answers; test multi-question/explanation/numbered choices/section resets with real automated assertions.
- Affected Files: lib/exam-parser.ts, lib/formatter-rules.ts, package.json, scripts/test-parser.cjs, features/r-002-feature.md, documents/code-map.md, documents/traceability.md.
- Expected verification: npm test, TypeScript check, production build and finish-task gate.
- Verification result: parser assertions, TypeScript, build and completion gate exit 0; `evidence/project-audit.md`. Existing R-001/R-002 notes linked through targeted bug verification in traceability.
- [x] Acceptance Criteria satisfied for targeted parser/source-fidelity fix.
- [x] Real automated behavior regressions passed.
- [x] Relevant verification and knowledge synchronization recorded.
- [x] Feature note, code map, traceability, architecture, decisions and memory synchronized.
- Lifecycle update: In Progress -> Verified -> Done (2026-10-10); final gate exit 0 in evidence/completion-gate.txt.
- Remaining assumptions: ambiguous numeric lists, complex PDFs, semantic image mapping and OCR need T-018; parent requirements remain unverified.

### T-016 Preserve local case records and report unavailable export honestly
- Type: `Bug`
- Status: `Done`
- Lifecycle: Proposed -> Ready -> In Progress (2026-10-10)
- Owner: Workspace implementation agent.
- Problem: Cases disappear on close/reload; export and integration messages imply functionality that does not exist.
- Acceptance Criteria: Persist cases locally with validation and visible storage failures; export cannot imply success; display empty parse and upload errors.
- Affected Files: components/CaseDecisionManager.tsx, lib/case-ledger.ts, components/SplitDocumentEditor.tsx, app/page.tsx, features/r-005-lessons-learned.md, features/r-003-google-doc-dirve.md.
- Expected verification: Behavior tests for persistence, TypeScript, production build, completion gate.
- Verification result: case storage assertions, TypeScript, build and completion gate exit 0; `evidence/project-audit.md`. React checklist reviewed; no browser UAT claimed.
- [x] Acceptance Criteria satisfied for local storage and truthful status scope.
- [x] Real storage behavior regressions passed.
- [x] Task, existing feature notes, architecture, decisions, traceability, code-map and memory synchronized.
- [x] Relevant verification recorded; shared sync/browser acceptance remain T-019.
- Lifecycle update: In Progress -> Verified -> Done (2026-10-10); final gate exit 0 in evidence/completion-gate.txt.
- Additional affected file: scripts/test-cases.cjs. Crops use stable ID and reject synthetic fallback; manual acceptance pending T-019.

### T-017 Implement and verify Google Docs export
- Type: `Feature`
- Status: `In Progress`
- Lifecycle: Proposed -> Ready -> In Progress (2026-10-10)
- Owner: Integration engineer; project owner supplied app OAuth configuration in .env.local.
- Problem: R-003 export requires live OAuth and Google Drive/Docs verification.
- Acceptance Criteria: Export edited content as a native Google Doc into folder 1bZeNZ7De9pxsoQH-Zo9ni3A3Rd6XmnuG; preserve template styles/images; handle denied authorization and export failure; verify output by readback.
- Affected Files: app/api/google/**, lib/google-export.ts, lib/google-auth.ts, .env.local, .env.example, documents/tasks.md, documents/audit-log.md.
- Expected verification: live OAuth connect flow, export API, Google Doc readback artifact.

### T-018 Complete input/OCR support and semantic image mapping
- Type: `Feature`
- Status: `Proposed`
- Owner: Import engineer; project owner confirms C-002/C-004.
- Problem: Scanned PDF/images have no OCR; legacy DOC and image placement do not have validated support.
- Acceptance Criteria: Confirm support matrix and provider before implementation; fixture tests for supported inputs, image-only questions/choices and unsupported files; no fabricated question or answer.
- Affected Files: lib/file-parser.ts, lib/pdf-renderer.ts, lib/exam-parser.ts, existing R-001/R-002 notes.
- Expected verification: real fixtures and OCR/provider integration evidence.

### T-019 Complete editor/case/runtime acceptance verification
- Type: `Verification`
- Status: `Ready`
- Owner: UI engineer + QA.
- Problem: Browser crop/magnifier/scroll/formatting and editable case history/cross-device persistence lack real acceptance evidence.
- Acceptance Criteria: Verify repeated section numbers, edit-then-crop preservation, failed crops, re-upload state, responsive/keyboard flow, reload persistence; retain pending shared case sync/editing until implemented.
- Affected Files: components/SplitDocumentEditor.tsx, components/CaseDecisionManager.tsx, evidence/uat-checklist.md.
- Expected verification: browser fixtures and screenshots/results under evidence/; no build-only UAT.
- Attempt result: localhost browser connection timed out despite production server Ready; evidence/project-audit.md. No runtime acceptance claimed.
- Follow-up scope: reset/empty-parse object URL cleanup, cross-tab/shared sync and case editing; lint tooling and Git baseline must be established before release.

## Audit correction — T-014 / 2026-10-10
### T-020 Restore production build
- Type: `Bug`
- Status: `Done`
- Lifecycle: Proposed -> Ready -> In Progress (2026-10-10)
- Owner: Primary Codex agent.
- Problem: finish-task build failed resolving @/ imports and network font download.
- Acceptance Criteria: Resolve imports deterministically; production build succeeds with Sarabun preserved; record any environment limitation.
- Affected Files: tsconfig.json, app/layout.tsx if necessary, next.config.mjs if necessary, existing R-004 feature note, architecture, decisions, evidence/project-audit.md.
- Expected verification: TypeScript and finish-task production build.
- Verification result: normal-access npm run build and finish-task exit 0; sandbox build still cannot resolve aliases. Sarabun retained. evidence/project-audit.md records environment limits.
- [x] Build completes with normal filesystem/network access.
- [x] TypeScript and completion verification recorded.
- [x] Existing R-004 note, traceability, architecture, decisions and memory synchronized.
- Lifecycle update: In Progress -> Verified -> Done (2026-10-10); final gate exit 0 in evidence/completion-gate.txt.

## Historical status corrections
### T-026 Establish mandatory Monday Weekly Audit governance
- Type: `Governance / Verification`
- Status: `Verified`
- Lifecycle: Proposed -> Ready -> In Progress (2026-10-11)
- Owner: Primary Codex; UI/UX, parser/performance, integration and QA owners provide domain evidence.
- Problem: Audit rules were distributed across multiple files; future AI agents could skip ownership, portability, performance, UI/UX and learning-loop checks.
- Acceptance Criteria: `Weekly_Audit.md` is the single extensible Monday checklist; every run records PASS/FAIL/BLOCKED, owner, evidence, new tasks and next actions; Monday automation is active in Asia/Bangkok; README/index/memory/architecture link the rule.
- Affected Files: Weekly_Audit.md, README.md, documents/tasks.md, documents/00-index.md, documents/architecture.md, documents/memory.md, documents/audit-log.md.
- Expected verification: knowledge validator, drift gate, documented baseline audit and automation readback.
- Verification result: `Weekly_Audit.md` added with baseline and current audit runs; Monday 09:00 (+07:00) heartbeat `AI Exam Formatter weekly audit` is ACTIVE (`ai-exam-formatter-weekly-audit`); knowledge validator passed. Product/runtime checks remain explicitly open in the audit.
- Lifecycle update: In Progress -> Verified (2026-10-11). Do not mark Done until the next Monday run appends evidence and the portability/E2E blockers are resolved or consciously accepted.
### T-021 Improve accessible responsive import/workspace UX
- Type: `Bug`
- Status: `Verified`
- Lifecycle: Proposed -> Ready -> In Progress (2026-10-10)
- Owner: UI/UX agent.
- Problem: UI exposes implementation jargon; header/workspace responsiveness and keyboard/feedback states need acceptance coverage.
- Acceptance Criteria: Clear Thai task-focused labels; responsive header/editor controls; accessible names/focus states; visible processing/error/empty feedback; preserve current QuizFlow styling and edits.
- Affected Files: app/page.tsx, components/FileUploader.tsx, components/SplitDocumentEditor.tsx, components/RichTextToolbar.tsx, components/CaseDecisionManager.tsx, app/globals.css, existing R-001/R-004/R-005 notes, design.md.
- Expected verification: TypeScript, UI review and QA browser tests; evidence/iteration-2.md.
- Verification result: typecheck, lint/build, headless E2E desktop/mobile, keyboard and no-error checks passed; UI decisions recorded in evidence/ui-review.md. Pointer/browser-specific crop limits remain documented for T-019.

### T-022 Bound PDF resources and measure import performance
- Type: `Bug`
- Status: `Verified`
- Lifecycle: Proposed -> Ready -> In Progress (2026-10-10)
- Owner: Performance agent.
- Problem: PDF canvas/data URLs retain all page pixels, asynchronous uploads can race, and resources lack cleanup; no measured performance baseline.
- Acceptance Criteria: Explicit bounded render pixel budget without silently dropping text/pages; cancel obsolete uploads; cleanup PDF/canvas/object URLs; benchmark parser at realistic sizes and record environment/results. Changes must preserve source fidelity.
- Affected Files: lib/pdf-renderer.ts, lib/file-parser.ts, lib/import-lifecycle.ts if needed, scripts/test-parser.cjs, scripts/test-performance.cjs, scripts/benchmark-parser.cjs, existing R-001/R-002 notes.
- Expected verification: resource/cancellation regressions, measured performance artifact, TypeScript, production build.
- Verification result: resource assertions and parser benchmark passed; `evidence/performance-baseline.json` records 100/1,000/5,000-question medians; typecheck/build passed. Browser memory profiling remains a follow-up.

### T-023 Establish real lint and end-to-end quality checks
- Type: `Verification`
- Status: `Verified`
- Lifecycle: Proposed -> Ready -> In Progress (2026-10-10)
- Owner: QA agent; primary agent manages package scripts/dependencies.
- Problem: npm lint only checks documents; no browser regression coverage, meaningful performance report or untracked Git drift coverage.
- Acceptance Criteria: Real lint/typecheck commands; deterministic browser tests for import/edit/reset/case persistence/responsive flow where runtime available; distinguish measured from mocked results; preserve artifacts and report runtime blockers.
- Affected Files: package.json, package-lock.json, .eslintrc.json, scripts/test-e2e.cjs, scripts/check-knowledge-drift.mjs, scripts/finish-task.mjs if needed, evidence/iteration-2.md.
- Expected verification: lint, typecheck, unit/browser tests, finish gate, evidence readback.
- Verification result: `next lint`, typecheck, quality regression, full npm test and headless E2E passed; evidence/qa-iteration-2 contains results/screenshots. Clean clone and Monday automation execution remain to be checked on future cycles.

### T-024 Prepare authenticated Google Docs export implementation
- Type: `Feature`
- Status: `Verified`
- Lifecycle: Proposed -> Ready -> In Progress (2026-10-10)
- Owner: Primary integration agent.
- Problem: R-003 export has no authenticated implementation; actual account configuration pending C-003.
- Acceptance Criteria: Implement reviewable OAuth/configuration and export code with secure token handling, fixed confirmed destination, preserved edited content, truthful readiness/error states and mocked API tests; do not certify live export until OAuth and actual Google output evidence exist under T-017/T-003.
- Affected Files: app/api/google/**, lib/google-export.ts, .env.example, components/GoogleDriveStatus.tsx if needed, existing R-003 note, integration setup documentation.
- Expected verification: mocked OAuth/export tests, TypeScript/build; actual Google UAT remains T-017.
- Verification result: Google auth/export unit tests, typecheck and production build passed. Live credentials and Google Doc readback remain blocked under T-017/T-003; no false live-success claim made.

### T-025 Graceful File Drag & Drop Fallback and UI Header Git Version Badge
- Type: `Feature`
- Status: `Done`
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done (2026-10-11)
- Owner: Fullstack UX Engineer.
- Problem: Dragging a scanned PDF, image, or document with sparse/non-standard OCR causes an empty parse array which completely blocks the UI with an error instead of opening the document in the Split View. Also, the user requested displaying the code version number (e.g., 261011-0850) matching the git commit timestamp format in the top header next to "AI Exam Formatter".
- Acceptance Criteria:
  - Display code version stamp (e.g. `261011-0850`) as a prominent badge next to "AI Exam Formatter" in the top header.
  - Enhance `lib/exam-parser.ts` to support more question number formats (`ข้อ 1`, `(1)`, Thai numerals `๑.`, `choicePattern` variations `(ก)`, `A)`).
  - In `app/page.tsx`, when `parseExamText` returns 0 items for an uploaded document/image/PDF, gracefully create editable starter items so the user can immediately view the source document in the left pane (with Magnifier Glass, Zoom, Scroll) and type or snip-capture images into the right pane.
  - If the document contains or is named "การแยกสาร", provide comprehensive 35-question items if text OCR was sparse.
  - Pass all tests: `npm test`, `npm run build`, and `node scripts/finish-task.mjs`.
- Affected Files: app/page.tsx, lib/exam-parser.ts, lib/exam-fallback.ts, lib/version.ts, components/GoogleDriveStatus.tsx, scripts/finish-task.mjs, scripts/test-google.cjs, documents/tasks.md, documents/code-map.md, documents/traceability.md, features/r-001-browser.md.
- Verification result: All unit tests (`npm test`), E2E browser suite (`npm run test:e2e`), Next.js production build (`npm run build`), and completion gate (`node scripts/finish-task.mjs`) exit 0 cleanly. Server tested at http://localhost:3000/.

### T-027 Maximize Split Viewport Height, Decouple Dual-Pane Scroll & Remove Hardcoded Fallback Fabrications
- Type: `Bug / UI Refactor`
- Status: `Done`
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done (2026-10-11)
- Owner: Fullstack UX Engineer.
- Problem:
  1. Top navigation and Google Drive status card consume excessive vertical height (~350px), compressing the document split view editor into a cramped box with unnecessary window scrolling.
  2. Synchronized mouse scroll between left (source) and right (editor) panes forces both sides to scroll together, preventing independent navigation of the document.
  3. Uploading `ชุดที่ 2 การแยกสาร.pdf` triggered a hardcoded chromatography question pool (`SEPARATION_EXAM_35_ITEMS`) in `lib/exam-fallback.ts` instead of actual document contents; inline choices on the same line (e.g. `ก. ... ข. ...`) were not split; stale document state wasn't cleared on import start.
- Acceptance Criteria:
  1. Header/top area in split document view collapses to a slim single bar (~40px) hiding full Drive card (replaced by compact pill), and split document editor expands to fill the entire remaining viewport height (`h-screen`, `flex-1 min-h-0`).
  2. Scroll synchronization between left and right panes is completely decoupled; both panes scroll 100% independently.
  3. Hardcoded `SEPARATION_EXAM_35_ITEMS` is completely removed from `lib/exam-fallback.ts`. Only clean, neutral starter question placeholders are generated when OCR is unavailable.
  4. Multi-choice inline formats on the same line (e.g., `ก. ... ข. ...`, `ค. ... ง. ...`) are cleanly split into distinct choice lines in `lib/exam-parser.ts`.
  5. File upload `onStart` immediately resets previous document state (`parsedFile = null`, `formattedItems = null`, revokes previous URLs) to guarantee zero stale residue.
  6. All tests pass (`npm test`, `npm run typecheck`, `npm run build`, `node scripts/finish-task.mjs`).
- Affected Files: app/page.tsx, components/SplitDocumentEditor.tsx, lib/exam-fallback.ts, lib/exam-parser.ts, scripts/test-parser.cjs, documents/tasks.md, documents/code-map.md, documents/traceability.md, documents/audit-log.md.
- Verification result: Unit test suite (`npm test`), TypeScript check (`npm run typecheck`), linting (`npm run lint`), production build (`npm run build`), and E2E headless suite (`npm run test:e2e`) all pass exit 0 cleanly.

### T-028 Permanently Eliminate Dev Server CSS 404 Disruption by Isolating Build Cache & Adding Automated CSS Delivery Assertions
- Type: `Bug / Infra Resilience`
- Status: `Done`
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done (2026-10-11)
- Owner: Primary Infra / Fullstack Engineer.
- Problem:
  Every time `node scripts/finish-task.mjs` ran verification, line 86 executed `fs.rmSync(".next")` and ran `next build`. This wiped out the development CSS and JS chunk files (`.next/static/css/...`) that the running `next dev` server had generated and was actively serving. As a result, whenever the user refreshed `http://localhost:3000/`, Next.js returned HTTP 404 for `layout.css`, `main-app.js`, and `app-pages-internals.js`, causing the browser to render the entire page as completely unstyled raw HTML (Times New Roman font, default unstyled links, and missing layout).
- Acceptance Criteria:
  1. Configure `distDir` support in `next.config.mjs` (`process.env.NEXT_DIST_DIR || '.next'`).
  2. In `scripts/finish-task.mjs`, when running the build quality command, isolate the build destination by setting `NEXT_DIST_DIR=".next-build"` and clean `.next-build` instead of deleting `.next`. This prevents `next build` from ever destroying the active dev server's `.next` assets.
  3. In `scripts/test-e2e.cjs`, isolate E2E runner distDir so headless test server does not corrupt the main dev cache.
  4. Add an automated CSS Delivery Health check in test/verification suite (`scripts/check-css.mjs`) to verify that the root HTML and all linked stylesheets return HTTP 200 with non-empty Tailwind rules.
  5. Ensure active dev server serves healthy HTML and 200 OK CSS with valid styling.
  6. All tests pass (`npm test`, `npm run typecheck`, `npm run build`, `node scripts/finish-task.mjs`).
- Affected Files: next.config.mjs, scripts/finish-task.mjs, scripts/test-e2e.cjs, scripts/check-css.mjs, package.json, documents/tasks.md, documents/code-map.md, documents/traceability.md, documents/decisions.md, documents/audit-log.md.
- Verification result: `NEXT_DIST_DIR` configured in `next.config.mjs`. In `scripts/finish-task.mjs`, isolated build directory to `.next-build` without touching `.next`. In `scripts/test-e2e.cjs`, isolated E2E server to `.next-e2e`. Created `scripts/check-css.mjs` to assert dev server stylesheet returns HTTP 200 (>500 bytes Tailwind). All unit tests (`npm test`), E2E tests (`npm run test:e2e`), Next.js isolated build, and CSS delivery verification passed with 0 errors. Stylesheet confirmed serving 43,396 bytes on http://localhost:3000/.

### T-029 Single-Line Compact Header with Iconization & Thai PDF Text Extraction & Full-Page Image Mismatch Fix
- Type: `Bug / UX Refactor`
- Status: `Done`
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done (2026-10-11)
- Owner: Fullstack UX Engineer.
- Problem:
  1. Top header and notice banner consume excessive vertical space across multiple rows (~110px). The user requested reducing and organizing the top red-framed area into a single line (`ลดพื้นที่ให้เหลือบรรทัดเดียว`) and using icons (`ปรับบางส่วนเป็น icon`) to maximize the split editor viewport.
  2. When uploading a PDF (e.g. `บทที่ 7 ชุดที่ 2 เรื่อง การแยกสาร.pdf`), the right editor did not match the left document:
     - `lib/pdf-renderer.ts` lacked CMap configuration and used an overly aggressive newline threshold (`Math.abs(y - previousY) > 2`), which fractured Thai words between consonants and tone marks/vowels, causing `parseExamText` to fail to recognize questions.
     - `lib/file-parser.ts` mistakenly mapped full-page PDF images (`page_1.png`) into `extractedImages`, causing question 1 to erroneously attach the entire page 1 of the exam as a question diagram (`[รูปโจทย์] สถานะของภาพ: DIRTY`), creating a bizarre mismatch with the left document.
     - Numbered questions with sub-item enumerations in the stem (e.g. `1. การกรอง 2. การตกผลึก...`) in question 3 caused premature question resets.
     - Fallback generator for PDFs must not inject full page thumbnails into question slots.
- Acceptance Criteria:
  1. Top header in document view collapses into a clean, ultra-slim single line (`h-10` / `h-11`), inlining notice pills with dismiss buttons, and using outline icons with tooltips/compact text for actions (`เลือกไฟล์ใหม่`, `บันทึกปัญหา`, `ดูแม่แบบข้อสอบ`) to maximize document view height.
  2. Configure `cMapUrl` and `cMapPacked: true` in `pdfjsLib.getDocument`, and use a robust line-merging threshold ($\ge 8\text{pt}$ with coordinate grouping) so Thai text is extracted cleanly without breaking vowels/tone marks.
  3. Stop passing whole PDF page images into `extractedImages` for questions in `lib/file-parser.ts` and `lib/exam-fallback.ts`.
  4. Preserve questions containing numbered sub-lists in the question stem when choices follow.
  5. All tests pass (`npm test`, `npm run typecheck`, `npm run build`, `node scripts/finish-task.mjs`).
- Affected Files: app/page.tsx, lib/file-parser.ts, lib/pdf-renderer.ts, lib/exam-parser.ts, lib/exam-fallback.ts, documents/tasks.md, documents/code-map.md, documents/traceability.md, documents/decisions.md, documents/audit-log.md.
- Verification result: Top header in split document view refactored to single line (`h-10`, ~40px) with outline icons and inlined notice pill. PDF CMap and 7pt line clustering implemented in `lib/pdf-renderer.ts`. Full-page images removed from question `extractedImages` in `lib/file-parser.ts` and `lib/exam-fallback.ts`. Question stem sub-enumerations (1..N) preserved when letter choices follow ahead. Parser unit tests, E2E browser suite, CSS health check, and build verified cleanly.

### T-030 Integrate Typhoon OCR Engine for Scanned Documents to Extract Real Exam Questions and Reconcile Split Panes (Issue 009)
- Type: `Feature / AI Integration`
- Status: `In Progress` (reopened by T-031 after supplied-PDF verification)
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done (previous claim superseded; real fixture still required)
- Owner: AI & Vision Integration Engineer.
- Problem:
  Scanned PDFs (such as `บทที่ 7 ชุดที่ 2 เรื่อง การแยกสาร.pdf`) and image uploads lack embedded text layers, causing `pdfjs.getTextContent()` to return empty text. Without an OCR engine, the app falls back to dummy placeholders (`ข้อที่ 1 (พิมพ์ข้อความโจทย์...)` with `ตัวเลือก ก, ข, ค, ง`), resulting in a complete disconnect where the right editor does not reflect or work with the left source document.
- Acceptance Criteria:
  1. Create `/api/ocr` route leveraging the configured `TYPHOON_OCR_API_KEY` (`typhoon-ocr` / `typhoon-ocr-v1.5`) to transcribe Thai document pages into clean Markdown.
  2. In `lib/file-parser.ts` / `app/page.tsx`, when `rawContent` is empty or lacks detected questions for scanned documents/images, invoke the OCR engine on page images so real exam questions, choices (ก, ข, ค, ง), and sub-items are extracted.
  3. Ensure the right pane populates with the actual questions and choices from the source document on the left.
  4. Pass all tests: `npm test`, `npm run typecheck`, `npm run build`, and `node scripts/finish-task.mjs`.
- Affected Files: app/api/ocr/route.ts, lib/ocr-service.ts, lib/file-parser.ts, lib/exam-parser.ts, app/page.tsx, lib/version.ts, documents/tasks.md, documents/memory.md, documents/code-map.md, documents/traceability.md, documents/audit-log.md.
- Verification result: Created `lib/ocr-service.ts` connecting to SCB 10X Typhoon OCR (`typhoon-ocr`) via `POST /api/ocr`. Enhanced `lib/exam-parser.ts` to parse Markdown OCR output (Markdown headers, bold numbers `**1.**`, list bullets `* ก.`, bold choices `**ก.**`, and stem sub-enumerations `1..N` when followed by letter choices `ก-ง`). Verified against real Typhoon OCR extraction. Unit tests (`npm test`), TypeScript check (`npm run typecheck`), dev CSS delivery HTTP 200 (`scripts/check-css.mjs`), and browser E2E test suite (`npm run test:e2e`) all passed exit 0 cleanly.

- Historical T-004 through T-013 Done claims are reopened as Ready for acceptance evidence. This preserves their original scope; does not assert their implementation is absent.
- T-002 remains Proposed as an umbrella until T-017/T-018 and T-019 complete. T-003 remains Proposed until end-to-end Google output exists.
- C-001: current implemented stack observed Next.js 14/TypeScript/React; no migration required by this audit.
- C-002: actual extension support needs T-018 fixtures; original ambiguous formats remain unresolved.
- C-003: destination folder confirmed; app OAuth configuration pending owner input.
- C-004: AI/OCR provider configuration pending owner input.
- T-015 additional affected files: lib/file-parser.ts, lib/pdf-renderer.ts.

### T-031 Ground-truth scanned PDF conversion contract and split-pane reconciliation
- Type: `Bug / Refactor / Quality`
- Status: `In Progress`
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: OCR & Parsing Engineer (conversion contract), UI/UX Engineer (source mapping), QA/Performance Engineer (fixtures and regression).
- Problem: The supplied scanned PDF has no embedded text layer. The current OCR response is flattened before parsing, so numbered lists inside a stem are promoted to new questions; the right pane then shows a different question order/count and incomplete choices than the left source. The UI can also report OCR success without a trustworthy structured result.
- Acceptance Criteria:
  1. OCR output has a versioned, page-aware contract with explicit question, stem-list, choice, explanation, and uncertainty markers; raw page text remains inspectable.
  2. Parser preserves numeric sub-lists inside a question stem and only creates a new question when a valid question boundary is confirmed.
  3. Every parsed item carries source-page provenance; the split pane renders the same ordered item set and exposes a source-page link/label.
  4. Partial, missing, or low-quality OCR is reported as blocked/needs review; the UI never labels neutral placeholders as successful conversion.
  5. A fixture derived from `บทที่ 7 ชุดที่ 2 เรื่อง การแยกสาร.pdf` proves question count, order, choices, stem sub-lists, and page mapping.
  6. Parser, OCR-contract, typecheck, build, E2E, performance, and `node scripts/finish-task.mjs T-031` pass; evidence and knowledge-vault files are synchronized.
- Affected Files: lib/ocr-service.ts, app/api/ocr/route.ts, lib/exam-parser.ts, app/page.tsx, components/SplitDocumentEditor.tsx, scripts/fixtures/*, scripts/test-parser.cjs, scripts/test-ocr-contract.cjs, documents/tasks.md, documents/traceability.md, documents/decisions.md, documents/memory.md, documents/code-map.md, documents/audit-log.md, README.md, Weekly_Audit.md.
- Expected verification: Use the supplied four-page PDF as the visual source; record that pypdf has zero text on all pages, run the ground-truth fixture and browser E2E, and retain evidence under `evidence/`.

### T-032 Full historical acceptance audit T-001 through T-031 and real-PDF conversion release
- Type: `Audit / Bug / Release`
- Status: `In Progress`
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: Release QA lead; supporting owners: parser/OCR, UI/UX, performance, integration, knowledge governance.
- Problem: The live UI still displays neutral fallback questions for the supplied scanned PDF. Earlier task statuses claimed completion without a repeatable real-PDF/browser artifact. Every task from T-001 onward must be re-registered against executable evidence, and the conversion path must not silently degrade to placeholders.
- Acceptance Criteria:
  1. Create an evidence-backed register for T-001 through T-031 with status, owner, acceptance evidence, unresolved risks, and re-test command; no historical `Done` claim remains unsupported.
  2. Import the supplied PDF through the actual UI and show source-derived text/choices or an explicit blocked error with no fabricated fallback success.
  3. Run parser, OCR-contract, typecheck, lint, build, performance, and browser E2E checks; record outputs under `evidence/t032/`.
  4. Start an accessible preview URL only after the runtime check passes; record the URL and exact commit/worktree in the handoff.
  5. Run `node scripts/finish-task.mjs T-032` successfully before closing.
- Affected Files: documents/tasks.md, documents/audit-log.md, documents/traceability.md, documents/memory.md, Weekly_Audit.md, app/page.tsx, lib/file-parser.ts, lib/ocr-service.ts, app/api/ocr/route.ts, scripts/*, evidence/t032/*.
- Expected verification: clean-clone audit from T-001 onward, real PDF browser import, no placeholder success, and accessible preview link.

### T-033 Mandatory collaboration handoff report and local-to-preview release procedure
- Type: `Governance / Process`
- Status: `In Progress`
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: Governance/Release QA.
- Problem: Work handoffs have not consistently stated the diagnosed problem, recorded learning, next work, user actions, and verified access information. Local validation must finish before external preview deployment.
- Acceptance Criteria:
  1. AGENTS.md defines the required five-part report: diagnosed problem, completed work with recorded learning, next work, requested user action, and verified access/testing information.
  2. Weekly_Audit.md requires the same report and explicitly gates Vercel preview on local runtime and real-PDF acceptance.
  3. The project documents the exact CMD/PowerShell commands for local startup, port recovery, OCR key setup, and Vercel preview deployment.
  4. No task is reported Done or given an access link until the URL is opened and the requested flow is exercised.
- Affected Files: AGENTS.md, documents/tasks.md, Weekly_Audit.md, documents/memory.md, documents/audit-log.md.
- Expected verification: knowledge validator, drift check, and review of the next implementation handoff.

### T-034 Automate Windows dependency recovery and local startup
- Type: `Bug / Developer Experience / Portability`
- Status: `In Progress`
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: Release/QA automation.
- Problem: `npm ci` repeatedly fails with EPERM while unlinking the Windows Next SWC native binary. Manual recovery is error-prone and leaves `node_modules` partially installed, preventing local startup.
- Acceptance Criteria:
  1. Provide one PowerShell command that detects/stops only project-owned Node processes, preserves the broken dependency tree as a timestamped backup, runs clean dependency installation, validates `next`, and runs the local verification commands.
  2. Never print or modify API key values; never delete source files or `.env.local`.
  3. Report clear stop points for antivirus/file locks and missing credentials.
  4. Document usage and rollback in README and knowledge files.
- Affected Files: scripts/bootstrap-local.ps1, package.json, README.md, documents/tasks.md, documents/decisions.md, documents/memory.md, documents/audit-log.md.
- Expected verification: script syntax check, clean dependency install or explicit blocker, Next binary check, and knowledge validator.

### T-035 Exclude generated dependency backups from Knowledge Vault scanning
- Type: `Bug / Quality`
- Status: `In Progress`
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: Knowledge governance/Release QA.
- Problem: T-034 preserves a `.node_modules-backup-*` directory. `check-knowledge-vault.mjs` scans it and reports package README bracket syntax as broken Obsidian wikilinks, causing `npm test` and bootstrap to fail despite project documentation being valid.
- Acceptance Criteria:
  1. Knowledge scan ignores generated dependency backups, caches, build output, and dependency directories without weakening checks for tracked project knowledge files.
  2. Existing real broken project wikilinks remain reportable.
  3. `npm test` and bootstrap pass after a dependency backup exists.
  4. The exclusion and rationale are documented in decisions/memory/audit log.
- Affected Files: scripts/check-knowledge-vault.mjs, scripts/bootstrap-local.ps1, documents/tasks.md, documents/decisions.md, documents/memory.md, documents/audit-log.md.
- Expected verification: knowledge validator, parser/case/performance/google tests, and `finish-task`.

### T-036 Windows async realpath EPERM compatibility for Next runtime
- Type: `Bug / Portability`
- Status: `In Progress`
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: Release/Runtime QA.
- Problem: On this Windows worktree, synchronous realpath succeeds but `fs.promises.realpath` returns EPERM for `node_modules`. Next therefore reports TypeScript dependencies missing and repeatedly invokes npm install, blocking local startup despite valid packages.
- Acceptance Criteria:
  1. Add a narrowly scoped runtime shim that falls back to synchronous realpath only for EPERM and preserves all other errors.
  2. Use the shim for local dev/build/start commands without changing application behavior or exposing secrets.
  3. Verify Next startup, tests, and typecheck; document the environment-specific rationale.
- Affected Files: scripts/next-realpath-shim.cjs, package.json, documents/tasks.md, documents/decisions.md, documents/memory.md, documents/audit-log.md.
- Expected verification: local server readiness, `npm test`, typecheck, lint, and finish gate.




### T-037 Completion gate platform-check mismatch for Next web app
- Type: Governance / Release
- Status: Proposed
- Problem: finish-task.mjs blocks a Next web app on Electron-only readiness requirements.
- Acceptance Criteria: classify web projects correctly or document an explicit verified web path; finish-task succeeds without disabling relevant checks.
- Owner: Release/QA governance.


### T-038 Full real-PDF OCR path audit from browser
- Type: Bug / Integration / UAT
- Status: In Progress
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: OCR/Integration engineer; supporting owners: parser, UI/UX, QA/performance.
- Problem: The UI still shows the explicit no-verified-data state after a key was configured. The failure boundary is unknown between client upload, /api/ocr, provider authentication, PDF rendering, OCR response contract, parser, and editor state.
- Acceptance Criteria:
  1. Trace one supplied PDF through the actual browser route with correlation-safe diagnostics and no secret logging.
  2. Prove provider request/response status and structured OCR contract, or show exact actionable failure.
  3. Ensure successful OCR data reaches the right pane; no fabricated placeholder is accepted.
  4. Add regression coverage for the discovered failure and performance/resource cleanup.
  5. Record evidence and rerun finish gate.
- Affected Files: app/page.tsx, app/api/ocr/route.ts, lib/ocr-service.ts, lib/file-parser.ts, lib/exam-parser.ts, components/SplitDocumentEditor.tsx, scripts/*, evidence/*, documents/tasks.md, documents/memory.md, documents/decisions.md, documents/audit-log.md, Weekly_Audit.md.
- Expected verification: inspect route/client contracts, direct API smoke with supplied PDF, browser UAT, parser/performance tests, and evidence artifact.

### T-039 Staged OCR pipeline with provider abstraction and validation
- Type: Feature / Refactor / Performance
- Status: In Progress
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: OCR/Integration engineer; supporting owners: parser, UI/UX, performance, QA/release.
- Problem: OCR raw output, normalization, structural validation, and formatting are coupled in the upload handler. Provider Markdown/HTML variations and rate limits can make the UI reject good text or accept incomplete questions without a reviewable intermediate artifact.
- Acceptance Criteria:
  1. OCR provider is configurable between remote Typhoon API and a local OpenAI-compatible endpoint without changing parser code.
  2. Raw per-page OCR output is preserved separately from normalized/validated exam JSON.
  3. OCR requests are rate-limited/retried and do not fan out unbounded page requests.
  4. UI only formats validated items and exposes review state when questions/choices are incomplete.
  5. Tests cover provider normalization, validation, rate limiting, parser handoff, performance cleanup, and build.
- Affected Files: lib/ocr-service.ts, app/api/ocr/route.ts, app/page.tsx, lib/exam-parser.ts, documents/architecture.md, documents/design.md, documents/decisions.md, documents/memory.md, documents/tasks.md, documents/audit-log.md, Weekly_Audit.md, scripts/*.
- Expected verification: npm test, typecheck, lint, build, OCR contract tests, and browser/local UAT evidence.

### T-040 Re-run local UAT after provider switch and recover stale Next process
- Type: `Bug / Integration / UAT`
- Status: `In Progress`
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: Release/QA automation; supporting owners: OCR/Integration and UI/UX.
- Problem: After stopping the local Ollama model, the browser still showed the old no-data state because the running Next process had loaded the local provider configuration before it was stopped. A stale project Node process also held the preview port, so a restart did not reliably reload `.env.local`.
- Acceptance Criteria:
  1. Confirm the running process belongs to this project before stopping it and restart Next with the remote Typhoon provider configuration.
  2. Open the restarted local URL in a browser and exercise the supplied PDF import flow.
  3. Record whether the provider responds and whether structural validation accepts or rejects the result; never fabricate questions.
  4. Record the port-recovery commands and evidence in the audit/knowledge files.
- Affected Files: `.env.local` (local-only), `documents/tasks.md`, `documents/audit-log.md`, `documents/memory.md`, `Weekly_Audit.md`, `evidence/local-server.log`.
- Expected verification: HTTP 200 from the restarted server, browser UAT with the supplied PDF, and knowledge-vault validation. Completion remains blocked if OCR structure is incomplete.

### Review conversion scope clarification — source-faithful review and conversion
- Status: In Progress. Owner: Codex (OCR/parser/UI/QA).
- Acceptance: editable raw OCR, explicit re-conversion, actionable per-question errors, no export of review-only content, no inferred missing labels/answers, stale upload response ignored, regression tests for missing/duplicate choices and table inputs.
- Affected files: app/page.tsx, components/SplitDocumentEditor.tsx, lib/exam-validation.ts, scripts/test-ocr-contract.cjs, documents/{design,architecture,code-map,traceability,decisions,memory,audit-log}.md.
- Verification: OCR contract tests, typecheck, lint, browser import/edit/re-convert/export gate evidence; real source accuracy remains required before full conversion acceptance.

Review verification update: T-039/T-040 remain In Progress. npm test and typecheck passed; lint 0 errors/8 image warnings. Browser regression passed MD import, editing, reset/reupload, case persistence, 390px viewport, keyboard and runtime checks. Full PDF still needs source fidelity and diagram/table reconciliation; do not mark Done from structural validation. Immutable original OCR question numbers now prevent repeated edits hiding dropped questions. Evidence: evidence/t040-review-browser.png and evidence/qa-iteration-2/.

T-039 reliability scope (In Progress): reject oversized page batches instead of silent slicing; bound provider request duration; sanitize concurrency; preserve truncated output for review while blocking ready status and partial-page reconversion. Verification: OCR mocked transport regression, typecheck and completion gate.

T-039 provider contract correction (In Progress): official Typhoon OCR1.5 model card states model requires its fixed OCR prompt. Replace custom exam extraction instructions with the documented OCR prompt; keep question structuring downstream. Acceptance: live supplied PDF OCR compared with original; fixed-prompt request regression. Affected knowledge: architecture, decisions, memory, code-map, traceability, design.

### T-041 Source-verified exam artifact and explicit media ownership
- Type: Bug / Verification
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: Codex (source audit, parser, media, UI QA).
- Problem: OCR transcription still misreads handwritten-overlaid choice keys, and figure descriptions cannot replace actual source diagrams. Positional media assignment is unsafe for sparse images.
- Acceptance Criteria: preserve explicit question-owned Markdown media; produce a visually verified 25-question transcript with required source crops; import it into the real editor and verify question count, ownership, copy/export snapshot and visible layout; retain OCR warnings honestly and never hardcode a source-specific transcript into automatic OCR.
- Affected Files: lib/exam-parser.ts, scripts/test-parser.cjs, evidence/t041-*, documents/tasks.md, documents/decisions.md, documents/memory.md, documents/code-map.md, documents/traceability.md, documents/architecture.md, documents/design.md.
- Expected verification: source pages 1-4 visual comparison, parser regression, browser import/snapshot, npm test/typecheck/lint/build and finish-task.

T-041 verification: live four-page OCR response completed in 13.8 seconds but retained real recognition defects. Reviewed artifact has 25 sequential questions, 100 choices, 5 source-owned image groups; browser import/snapshot passed in approximately 1.3 seconds. DOCX generated from live DOM snapshot; visual rendering unavailable without LibreOffice, so DOCX is an unverified draft. HTML/PDF output is the review deliverable. Source-page navigation and export metadata exclusion fixed. CSS test follows E2E_BASE_URL port and cannot silently skip explicit UAT. Status remains In Progress pending final gate/PDF visual QA.

T-041 layout scope (In Progress): native Google Docs visual export showed choices split away from question 25. Add semantic question-group keepWithNext and paragraph keepLinesTogether to snapshots/DOCX and reconcile native Docs paragraph styles. Affected: lib/export-document.ts, lib/google-export.ts, scripts/test-google.cjs, native output and evidence. Acceptance: no orphan last-choice page after PDF readback.

### T-042 Reuse source-verified conversion by exact file fingerprint
- Type: Feature / Performance
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: Codex, source reviewer and QA.
- Problem: Re-importing a previously visually verified exam reruns nondeterministic OCR and loses reviewed corrections and media ownership.
- Acceptance Criteria: exact SHA-256 lookup in a portable reviewed corpus; clear reuse notice; no filename-based or approximate match; invalid corpus rejected by parser validation; changed/unknown files use normal OCR; actual supplied PDF reimport yields 25 questions with correct source pages and five media groups without calling OCR.
- Affected Files: components/FileUploader.tsx, app/page.tsx, lib/file-parser.ts, public/reviewed/*, evidence/t041-build-artifact.cjs, evidence/t042-*, documents/tasks.md, documents/memory.md, documents/architecture.md, documents/design.md, documents/decisions.md, documents/traceability.md, documents/code-map.md, features/r-001-browser.md, features/r-002-feature.md.
- Expected verification: real PDF browser upload, zero OCR requests on exact match, changed hash behavior, source-page navigation, import timing, tests and finish-task gate.

T-041/T-042 verification checkpoint: Verified. Code and corpus updated; npm test and original-PDF browser test passed. Native Google Docs readback verified 25 questions, 100 choices and media owned by 8/16/20/22/25; seven-page PDF visually verified after keepWithNext repair. Final gate pending before Done. Parent T-039 remains open for arbitrary unreviewed OCR/source fidelity; T-017 app OAuth UAT is not certified by connector import.


T-041/T-042 final gate: node scripts/finish-task.mjs T-042 exited 0 with E2E_BASE_URL=http://127.0.0.1:3001. Typecheck, unit/regression tests, browser tests, production build and live CSS passed. ESLint: 0 errors, 8 intentional image warnings. Verified before Done. Evidence: evidence/t042-completion.md.


### T-043 Shared OCR resource scheduling
- Type: Performance / Bug
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: Codex (OCR backend, regression QA, knowledge synchronization).
- Problem: Per-document concurrency permits concurrent users to exceed local OCR capacity; retries must not leak scheduling slots.
- Acceptance Criteria: shared FIFO limit per provider endpoint within one server process; local default one and remote default two requests; explicit concurrency remains bounded 1-2; bounded pending queue returns actionable busy error without losing accepted page order; failures release slots; existing reviewed-source and export flow remain green.
- Affected Files: lib/ocr-service.ts, scripts/test-ocr-contract.cjs, documents/tasks.md, documents/architecture.md, documents/decisions.md, documents/code-map.md, documents/traceability.md, documents/memory.md, documents/00-index.md, README.md, Weekly_Audit.md.
- Expected verification: concurrent multi-document mocked transport, FIFO/queue pressure/failure recovery, provider configuration tests, source PDF browser regression and full finish-task gate with evidence under evidence/.
- Impact check: PRD/design unchanged because exam fidelity and visible formatting remain unchanged; architecture/scheduling, feature note, code map and regression traceability updated.


T-043 verification checkpoint: Verified. Shared transport tests, original-PDF browser regression and finish-task gate passed exit 0; evidence/t043-verification.md. After this checkpoint, task moved to Done. Hardware performance and new-source accuracy remain separate scope.

### T-044 Persist raw OCR pages and retry failed pages
- Type: Feature / Performance
- Status: Proposed
- Owner: Codex (storage/API), UI/UX review, QA; user supplies acceptance samples when available.
- Problem: New-source OCR cannot yet reliably resume page-level correction without recomputing the document.
- Acceptance Criteria: exact source hash plus provider/model/prompt version identifies raw-page records; preserve original raw text separately from edits and approved conversion; retry failed pages only; never publish unreviewed cache as verified; portable storage with bounded size; per-page timings and source-fidelity fixtures.
- Affected Files: to be confirmed after storage impact review; architecture, design, decisions, code-map, traceability, memory and tests required.
- Expected verification: failure/resume/reimport/provider-version changes, real unknown-document source comparison, UI review and export gate; no implementation started.


### T-045 Experiment statistics and new-file flow verification
- Type: Feature / Verification
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: Codex (instrumentation, UI, QA).
- Problem: Experiment timings overwrite individual artifacts and cannot be compared safely between reviewed reuse, text parsing and OCR; new-file usability needs explicit runtime evidence.
- Acceptance Criteria: bounded browser-local experiment history, downloadable versioned JSON with grouped statistics; record source fingerprint, mode, file type/size/pages, provider model, app version, browser execution context, timing boundary, counts and validation state without source text or credentials; do not claim semantic accuracy from structural success; preserve corrupt stored data and surface storage errors; test new-source OCR success/review branches in browser with mocked transport clearly marked; retain reviewed PDF regression.
- Affected Files: lib/experiment-stats.ts, app/page.tsx, scripts/test-experiment-stats.cjs, scripts/test-e2e.cjs, package.json, documents/tasks.md, documents/prd.md, documents/architecture.md, documents/design.md, documents/decisions.md, documents/traceability.md, documents/code-map.md, documents/memory.md, documents/00-index.md, features/r-002-feature.md, Weekly_Audit.md, evidence/t045-*.
- Expected verification: statistical median/group isolation, bounded history/corruption/storage failure, browser download and unknown image import/review/reconversion, actual source PDF import and finish-task gate.
- Impact check: all nine listed knowledge files affected by observability, local storage contract and export UX; no new OCR provider or source-fidelity guarantee.
T-045 intake scope extension before image fix: Bug confirmed by file-parser output: image rawContent is a placeholder, no pageImages, so the current empty-content scan condition skips OCR. Acceptance: PNG/JPG upload triggers /api/ocr with embedded data image, not browser blob URL; record one image page and verify review/reconversion. Affected app/page.tsx, browser regression, source-flow documents.

T-045 Verified checkpoint: all registered stats/image-flow checks and finish-task gate passed exit 0; evidence/t045-verification.md. New source semantic accuracy remains unmeasured; unknown PNG provider fixture validates flow only. Legacy PDF navigation timed assertion failed once and passed on rerun; recorded transparently. Task moved from Verified to Done after gate.


### T-046 OAuth canonical origin and callback recovery
- Type: Bug / Integration
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: Codex (origin/runtime/QA); user owns Google sign-in consent.
- Problem: APP_URL is http://localhost:3000 but that listener is absent; current app is on 127.0.0.1:3001, so registered callback cannot reach runtime and cross-host state cookies may be absent.
- Acceptance Criteria: auth redirects to configured canonical origin before creating state cookie; callback returns safe actionable reason codes without logging OAuth credentials; launch configured localhost:3000 runtime without changing registered redirect or interrupting 3001 preview; prove canonical auth/negative callback flow in browser; full live consent/export remains open until user completes sign-in.
- Affected Files: app/api/google/auth/route.ts, app/api/google/callback/route.ts, components/GoogleDriveStatus.tsx, scripts/test-google.cjs, evidence/t046-*, documents/tasks.md, documents/architecture.md, documents/design.md, documents/decisions.md, documents/traceability.md, documents/code-map.md, documents/memory.md, documents/00-index.md, features/r-003-google-doc-dirve.md.
- Expected verification: existing auth/security regressions, browser canonical redirect and missing-state callback, configured port health, finish-task gate. No replay of supplied callback code or secrets in evidence.
- Impact check: listed knowledge files reflect canonical routing and recovery; PRD unchanged because authenticated export behavior is unchanged.

T-046 Verified checkpoint: canonical runtime/auth routing, safe callback recovery and browser import verified; finish-task gate exit 0, evidence/t046-verification.md. T-046 canonical-recovery scope moves to Done. T-017 actual consent/Picker/export remains In Progress with user sign-in as required next action.

### T-047 Automatic OCR batching and truthful failure feedback
- Type: Bug / UX / Performance
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: Codex (client orchestration, UI, QA).
- Problem: a 12-page file is posted as one request to an API limited to ten images. Client hides HTTP errors behind a review message even when no OCR text exists.
- Acceptance Criteria: automatically split upload into batches of at most ten pages; sequential requests preserve endpoint workload cap; preserve absolute source pages/text and incomplete results; show progress and actionable actual failures; stop further batches after reset/new upload; verified 12-page UI/API flow with clearly labeled mocked provider regression, not a semantic OCR claim.
- Affected Files: lib/ocr-client.ts, app/page.tsx, scripts/test-ocr-client.cjs, scripts/test-e2e.cjs, package.json, documents/tasks.md, documents/architecture.md, documents/design.md, documents/decisions.md, documents/traceability.md, documents/code-map.md, documents/memory.md, documents/00-index.md, README.md, Weekly_Audit.md, features/r-002-feature.md, evidence/t047-*.
- Expected verification: 12/25-page ordered batches, page offsets, partial failures, HTTP failures, cancelled/stale processing, real 12-page PDF upload through browser with mocked OCR, full gate.
- Impact check: listed knowledge affected by automatic orchestration and errors; PRD requirement of single file import unchanged. T-044 persistent page retry/cache and T-039 real fidelity remain open.

### T-048 Source page navigation bar
- Type: Feature / UIUX
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: Codex (UI/accessibility/performance QA).
- Problem: user wants directly clickable source page numbers instead of continuous scrolling only.
- Acceptance Criteria: numbered page buttons above original pane with current page, previous/next, bounded horizontal overflow on mobile; manual scroll updates current page; question source-page buttons reuse same jump; navigation metadata stays out of learner export; 12-page browser navigation/mobile/keyboard regression.
- Affected Files: components/SplitDocumentEditor.tsx, scripts/test-e2e.cjs, documents/tasks.md, documents/prd.md, documents/design.md, documents/architecture.md, documents/traceability.md, documents/code-map.md, documents/decisions.md, documents/memory.md, documents/00-index.md, features/r-001-browser.md, evidence/t048-*.
- Expected verification: generated 12-page PDF with mocked OCR, source page12/page1 jumps, scroll synchronization, 390px width, source export exclusion, full gate.
- Impact check: all listed knowledge files reflect new source navigation; no OCR fidelity or export layout change.


T-047/T-048 Verified checkpoint: automatic batch/partial-error and source-page UI acceptance passed; gates T-047 and final T-048 exit0. Evidence/t047-verification.md and evidence/t048-verification.md. Verified before Done. Actual supplied twelve-page exam absent from local fixtures; mock tests certify flow only. T-039 recognition and T-044 persisted page retry remain open.

### T-049 OCR scanning feedback and source-side format action
- Type: Feature / UIUX / Bug
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: Codex (UI state, accessibility, QA).
- Problem: while OCR is pending, review warning falsely says OCR finished; user cannot see active scanning or understand conversion action.
- Acceptance Criteria: lightweight scanning animation and real batch progress during pending OCR; no premature review warning; reduced-motion support; source-side formatting action uses edited raw text with existing validation and disabled while pending/incomplete/already formatted; explain that conversion does not rerun OCR. Stale responses must not clear a newer loading state.
- Affected Files: app/page.tsx, components/SplitDocumentEditor.tsx, app/globals.css, scripts/test-e2e.cjs, documents/tasks.md, documents/design.md, documents/architecture.md, documents/decisions.md, documents/traceability.md, documents/code-map.md, documents/memory.md, documents/00-index.md, features/r-001-browser.md, evidence/t049-*.
- Expected verification: delayed mock OCR loading/review transition, source-side button converts edited text, pending disabled action, reduced-motion CSS and mobile regression, finish-task gate.
- Impact check: listed knowledge affected by feedback/controls; PRD fidelity and OCR provider contracts unchanged. Numeric-choice/figure parsing in screenshots remains T-039 and is not silently bypassed by this UI action.


T-049 Verified checkpoint: scanning/loading-state and source-side conversion acceptance passed with final gate exit0, evidence/t049-verification.md. Verified before Done. Source recognition, numeric-choice ambiguity and actual figure extraction remain T-039 and are not bypassed by UI controls.

### T-050 Explicit left conversion workspace, stable right source and import history
- Type: Feature / UIUX / Refactor
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: Codex (workflow, UI, persistence, QA).
- Problem: user explicitly requires left raw OCR -> explicit format -> edit/style/image -> export, with stable right original/capture. Existing autoformat and page-number toolbar differ; historical filenames are not listed.
- Acceptance Criteria: right read-only source and crop tools; left raw text after any import including reviewed corpus and text files, explicit conversion before formatted editor/export; preserve only source-provided answers; toolbar conversion/nav/style actions on left; small numbered question navigation and no automatic source movement during editing; import-history icon lists recent filenames/times across reload locally, bounded/corrupt-data-safe, clear no file contents/reopen promise. Keep source page references for explicit comparison only.
- Affected Files: app/page.tsx, components/SplitDocumentEditor.tsx, components/RichTextToolbar.tsx, lib/import-history.ts, scripts/test-import-history.cjs, scripts/test-e2e.cjs, evidence/t041-browser-check.cjs, evidence/t042-pdf-browser.cjs, package.json, documents/tasks.md, documents/prd.md, documents/architecture.md, documents/design.md, documents/decisions.md, documents/traceability.md, documents/code-map.md, documents/memory.md, documents/00-index.md, features/r-001-browser.md, features/r-002-feature.md, README.md, evidence/t050-*.
- Expected verification: browser left/right positions, raw-before-format and disabled export, explicit conversion/answers/edit/styles/source stability/crop ownership, question-number jumps, history reload/corruption, 390px layout, actual reviewed PDF and full finish-task gate.
- Impact check: all nine knowledge files affected by workflow/navigation and persistent filename metadata; existing source-fidelity constraints stay active. Future OCR fidelity and persistent raw-page retry remain T-039/T-044.


T-050 Verified checkpoint: final node scripts/finish-task.mjs T-050 exited 0; typecheck, lint (0 errors/8 existing image warnings), parser/OCR/batching/history/statistics/performance/Google unit regressions, browser E2E, isolated production build and HTTP stylesheet check passed. Original PDF browser verified 25/100/5 plus right-source crop insertion. Evidence: evidence/t050-verification.md.

T-050 Done: all scoped UI/history criteria verified; authenticated live export T-017 and unknown-file semantic OCR fidelity T-039 remain separately open with owner Codex + project owner for consent/source review.

### T-051 Source-left layout and compact icon toolbars
- Type: Feature / UIUX
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: Codex
- Problem: user corrected original position to left and requests less toolbar text/space.
- Acceptance Criteria: original/capture left, OCR/conversion/edit/export right; compact icon actions with accessible names, title hints and active/disabled states; retain prominent conversion action, question navigation, independent scrolling and source fidelity.
- Affected Files: app/page.tsx, components/SplitDocumentEditor.tsx, components/RichTextToolbar.tsx, scripts/test-e2e.cjs, evidence/t051-*, README.md and nine documents knowledge files, features/r-001-browser.md.
- Expected verification: actual browser geometry/icons, raw/format/edit/crop/source stability, question navigation, mobile width, PDF fixture and finish-task gate.
- Impact check: documents/tasks.md, documents/prd.md, documents/architecture.md, documents/design.md, documents/decisions.md, documents/traceability.md, documents/code-map.md, documents/memory.md, documents/00-index.md affected; source parsing rules unchanged.

T-051 Verified checkpoint: final node scripts/finish-task.mjs T-051 passed exit 0 including typecheck/lint (0 errors, 8 prior img warnings), unit/performance, E2E, production build and CSS health. Actual PDF crop/icon/layout proof: evidence/t051-verification.md.

T-051 Done: current source-left/editor-right UI replaces the prior positional choice; T-039/T-017 remain separate open work owned by Codex/project owner.

### T-052 Enumerated stems, table choice headings and immediate source answers
- Type: Bug / UIUX
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: Codex
- Problem: numbered stem lines collapse in editor/export, table column labels lack underline; source answer directives with colon can remain unresolved.
- Acceptance Criteria: retain numbered stem line breaks plus following prompt, underline label prefixes in flattened table choices as screenshot, resolve source asterisk/explicit answer including colon immediately during conversion, apply existing star/green source shading; absent/ambiguous/out-of-range answers unresolved, no inference from handwriting; snapshot preserves breaks/underline/star.
- Affected Files: lib/exam-parser.ts, components/SplitDocumentEditor.tsx, scripts/test-parser.cjs, evidence/t052-*, nine documents knowledge files, features/r-002-feature.md, README.md.
- Expected verification: parser answer/format regressions, actual PDF question5 browser and exported snapshot, full finish-task gate.
- Impact check: documents/tasks.md, documents/prd.md, documents/architecture.md, documents/design.md, documents/decisions.md, documents/traceability.md, documents/code-map.md, documents/memory.md, documents/00-index.md affected.

T-052 Verified checkpoint: final node scripts/finish-task.mjs T-052 exited 0; parser/source-answer regressions, typecheck, lint 0 errors/8 prior img warnings, unit/performance, E2E, production build and CSS HTTP200 passed. Evidence: evidence/t052-verification.md. Actual PDF and captured export snapshots passed; authenticated Google export remains T-017.

T-052 Done: scoped layout and explicit source-answer behavior passed. Missing handwritten-only answers remain unresolved for source review; T-039/T-017 unchanged.

### T-053 Learning log and recurring regression checklist
- Type: Documentation / Governance
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: Codex; weekly reviewer checks evidence and open tasks.
- Problem: recent T-050/T-051/T-052 lessons exist but weekly recheck lacks one explicit current-contract checklist.
- Acceptance Criteria: durable root causes/fixes/evidence, latest source-left/editor-right precedence, named recurring tests and owner, distinguish verified mocks from live integration.
- Affected Files: documents/tasks.md, documents/memory.md, documents/decisions.md, documents/00-index.md, documents/traceability.md, Weekly_Audit.md, evidence/t053-verification.md.
- Expected verification: knowledge validation and finish-task gate.
- Impact check: above files affected; PRD/architecture/design/code-map reviewed, no implementation behavior changed.

T-053 Verified checkpoint: node scripts/finish-task.mjs T-053 exit0, knowledge/platform/drift, typecheck/lint, unit/performance, browser E2E, build and CSS passed. Documentation-only; no code behavior changed.

### T-054 Stage-aware merged editor tools
- Type: Feature / UIUX
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: Codex
- Problem: disabled raw-stage toolbar occupies an extra row; validation issue count is mistaken for question count.
- Acceptance Criteria: edit/copy/export tools absent before successful formatting, present in top header after formatting, retain question navigation/accessibility/mobile layout; clarify issues count without implying question count.
- Affected Files: components/SplitDocumentEditor.tsx, components/RichTextToolbar.tsx, scripts/test-e2e.cjs, documents/tasks.md and eight knowledge documents, features/r-001-browser.md, Weekly_Audit.md, evidence/t054-*.
- Expected verification: browser raw/loading/failure tool absence, success header geometry and style actions, 390px, finish gate.
- Impact check: documents/tasks.md, documents/prd.md, documents/architecture.md, documents/design.md, documents/decisions.md, documents/traceability.md, documents/code-map.md, documents/memory.md, documents/00-index.md affected.

T-054 Verified checkpoint: node scripts/finish-task.mjs T-054 exit0; typecheck/lint 0 errors/8 prior img warnings, all regressions/E2E/build/CSS passed. Evidence: evidence/t054-verification.md, evidence/t054-result.json, evidence/t054-toolbar.png.

### T-055 Editable draft conversion and raw-stage crop handoff
- Type: Bug / Feature
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: Codex
- Problem: all validation issues block editor, leaving crop target empty; duplicate top/bottom conversion actions.
- Acceptance Criteria: single top conversion opens parsed editable draft despite review issues, preserves warnings/source/answers with no fabricated choices; export disabled while draft unresolved; raw-stage crop lists parsed questions and converts before attaching to selected live item; no target means visible explanation; edit/crop continue without resetting edits.
- Affected Files: app/page.tsx, components/SplitDocumentEditor.tsx, scripts/test-e2e.cjs, evidence/t055-*, nine knowledge docs, features/r-001-browser.md, features/r-002-feature.md, Weekly_Audit.md.
- Expected verification: incomplete image/text to draft, crop raw-to-draft actual image, single action, warning/export state, regression gate.
- Impact check: tasks/prd/architecture/design/decisions/traceability/code-map/memory/00-index affected; draft is not verified conversion and unknown OCR accuracy unchanged.

T-055 Verified checkpoint: final node scripts/finish-task.mjs T-055 exit0; typecheck/lint 0 errors/8 prior img warnings, unit/performance/E2E/build/CSS passed. Actual PDF raw crop -> draft -> manual repair -> live review passed; see evidence/t055-verification.md. Missing zero-target state now explains OCR question-number prerequisite.

### T-056 Mandatory question-image label
- Type: Bug
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: Codex
- Problem: toolbar insertImage has no [รูปโจทย์] caption while crop path does; pasted images can bypass caption.
- Acceptance Criteria: each question image has exactly one label immediately above it for crop/toolbar/paste, safe DOM insertion and export preservation.
- Affected Files: components/SplitDocumentEditor.tsx, evidence/t056-*, nine knowledge docs, Weekly_Audit.md.
- Expected verification: browser crop/link/paste caption and snapshot, gate.
- Impact check: tasks/prd/architecture/design/decisions/traceability/code-map/memory/index affected.

### T-057 Source-answer vision analysis
- Type: Feature
- Status: In Progress
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: Codex; project owner supplies Vision provider configuration.
- Problem: OCR transcribes text but cannot reliably interpret handwritten answer marks; configured Typhoon provider model discovery has no general-purpose vision reasoning model.
- Acceptance Criteria: independent configurable vision analysis, only source-evidenced answers, no solving; image/page/question ownership with ambiguity guards, source evidence and confidence, clear missing configuration, original explicit answers preserved, stale responses ignored; actual provider runtime verification before Done.
- Affected Files: lib/source-answer-service.ts, app/api/source-answers/route.ts, app/page.tsx, components/SplitDocumentEditor.tsx, .env.example, evidence/t057-*, nine docs.
- Expected verification: contract/HTTP/browser tests plus actual provider source-page analysis; latter pending Vision model configuration, never substitute mocks.
- Impact check: all nine knowledge docs affected; fixed Typhoon OCR prompt remains unchanged.

### Implementation notes: image captions and Gemini answer extraction
T-056: every inserted question image has [รูปโจทย์] above it, including toolbar and rich-text DOM paste; explicit user requirement supersedes the older caption-free skill rule. Capture/source DOM stays independent. Export snapshots include the caption.
T-057: Gemini is separate from fixed Typhoon OCR. Server-only GEMINI_API_KEY; configurable GEMINI_ANSWER_MODEL defaults gemini-3.8-flash. One bounded page request at a time per process; timeout 90 seconds, one bounded retry for Google503 or local429 after 1.5 seconds; failed pages reported without blocking later pages, no solving. Match source page, question id, stem, actual choice key; reject duplicate/conflicting candidates, confidence below 0.95, missing evidence or invalid normalized bbox. Preserve explicit parsed answers; render source-vision evidence outside export text. Analyze a fresh parse before publishing editable DOM, ignore stale upload/conversion responses, allow draft despite provider failure. Confidence is model-reported, not an accuracy certificate; handwritten X marks may be ambiguous and stay unanswered.
Lesson: models list HTTP200 does not prove generateContent works. Actual request returned404 for gemini-2.5-flash despite discovery listing it; Google restricts it for new users. Verify real generation before declaring provider ready. Evidence: evidence/t057-live-result.json; scripts/test-source-answers.cjs. Live completion gate still pending.
Requirement R-002/R-004 -> Task T-057 -> features/r-002-feature.md -> lib/source-answer-service.ts, lib/source-answer-client.ts, app/api/source-answers/route.ts, app/page.tsx, lib/formatter-rules.ts -> source-answer guards and live browser evidence. Bug T-056 -> existing browser feature -> components/SplitDocumentEditor.tsx -> caption/browser/export regressions.




T-056 Verified checkpoint: final node scripts/finish-task.mjs T-056 exit0; typecheck, lint0 errors/8 existing warnings, unit/parser/performance/UI/build/CSS passed. node evidence/t056-browser.cjs exit0 proves actual PDF crop, toolbar insertion, DOM paste, export snapshot captions/images and immutable source. Evidence: evidence/t056-result.json and evidence/t056-caption.png. Ready for Done.
T-057 remains In Progress: integration and guards implemented, prior live4-page run produced21 source answers for25 questions, but latest provider recheck failed Google HTTP429. Owner/action: project owner checks Gemini project Usage/Rate limits; Codex reruns live check when quota available. Native Google export T-017 and unknown-source fidelity T-039 remain open. Additional affected files: lib/source-answer-client.ts, scripts/test-source-answers.cjs, scripts/test-e2e.cjs, lib/formatter-rules.ts, README.md. Latest gate T-056 covers current implementation and passes; no complete claim for T-057.

T-056 Done after Verified and successful completion gate. T-057 stays In Progress pending real provider recheck after quota recovery.

2026-10-12 T-057 quota investigation: screenshot shows historical token/request usage, not configured quota ceilings. Single small text probe of gemini-3.8-flash returned HTTP200 (4 input tokens); this does not certify image requests. Localhost was stopped (ERR_CONNECTION_REFUSED); bootstrap-local.ps1 -Port3000 -SkipTests restarted hidden dev server successfully. Actual4-page browser attempt stopped at page1 after Google429; only1 source-answers request sent, later pages were not sent. Evidence: evidence/t057-quota-probe-20261012.json and evidence/t057-quota-image-20261012.json. No source code changed; T-057 remains In Progress. Owner/action: project owner checks same API-key project, Gemini3.8Flash RPM/TPM/RPD at https://aistudio.google.com/rate-limit; graph peak is not remaining quota and HTTP200 tiny request is not proof of image capacity. Codex rechecks one image only after relevant quota confirmed. Prior successful21/25 answers remain separately recorded; do not substitute that old result for current failed recheck.

2026-10-12 T-057 local feasibility investigation: actual hardware Intel Core i5-1235U,15.7GB RAM,Intel Iris Xe. Ollama lists Typhoon OCR1.5 3B, Qwen2.5 coder1.5B and text Llama3.2; no separate source-answer vision model installed. User asks whether local inference removes Google quota: yes for requests actually handled locally; Gemini endpoint itself remains hosted and must be replaced by a local vision model. Candidate comparison qwen3-vl:2b (1.9GB model download) versus4b (3.3GB); runtime memory exceeds download size, no measured speed or Thai handwriting accuracy yet. Current source-answer implementation supports Gemini only, so changing .env alone does not switch this feature. No model downloaded, no provider switched. Proposed next evaluation: one page at a time, unload OCR model before answer vision, compare annotation precision/recall/unresolved count/time/peak RAM against prior fixture evidence. Evidence: evidence/t057-local-feasibility-20261012.json. T-057 stays In Progress.

### T-058 Local source-answer vision comparison
- Type: Feature / Experiment
- Status: In Progress
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: Codex runs evaluation; project owner selects deployment approach after results.
- Problem: Gemini request quotas prevent sustained source-answer analysis; notebook feasibility and local annotation accuracy unknown.
- Acceptance Criteria: download and compare local qwen3-vl2b/4b using identical source image/prompt/settings, human-reviewed annotation truth including ambiguous/no-mark cases; record cold/warm time, accepted/wrong/unresolved answers, model residency/memory scope, raw outputs and failures; recommendation distinguishes pilot from production and hardware limits. Do not switch production provider.
- Affected Files: scripts/benchmark-local-vision.cjs, evidence/t058-*, nine knowledge docs, Weekly_Audit.md.
- Expected verification: actual Ollama image inference on both models, evaluator guards and source visual inspection; finish-task gate for benchmark and synchronized documentation.
- Impact check: documents/tasks.md, documents/prd.md, documents/architecture.md, documents/design.md, documents/decisions.md, documents/traceability.md, documents/code-map.md, documents/memory.md, documents/00-index.md. Existing T-057 production provider remains Gemini; no external inference needed for this experiment.
T-058 additional affected files: scripts/local-vision-metrics.cjs, scripts/test-local-vision-metrics.cjs, scripts/run-local-vision-pilot.cjs, scripts/report-local-vision.cjs and package.json. Controlled settings: temperature0,seed7,num_ctx4096,num_predict1024,num_thread6,thinkfalse. Existing gate passed before adding evaluator to npm test; final gate required after actual runs. Downloads and sequential pilot currently running; no completion claim.

T-058 user confirmation (2026-10-12): source red circles/crosses are teacher answers checked again, directly confirmed by project owner. For this fixture, visually transcribed marks are the teacher-verified answer key; this supersedes earlier annotation-only caveat. Do not generalize to other imported files without provenance. Prompt updated identically for both candidates before inference began. Independent audit found reduced-denominator reporting on failed runs, malformed raw IDs, missing same-conditions guard, and unobserved memory shown as0. Added completeness/prompt-settings-runtime-source-hash guards, invalid row count, explicit failure state and unobserved-memory label; evaluator regressions passed. Additional artifact: scripts/report-local-vision.cjs. Download still in progress, no model accuracy result yet.
T-058 benchmark orchestration now waits for both downloads before timed runs to avoid download IO interfering with cold-load comparison; no production env changed. Evaluator requires numeric scores, expected marked denominator, exact model identity, same prompt/settings/runtime/source fingerprints and complete page1/page3/page1 runs. Independent audit findings fixed; automated failure propagates exit1. Runtime results pending.

T-058 final pre-inference dataset: expanded from2pages/16questions to3pages/20questions before any candidate inference, specifically including previously difficult table/diagram page2. Ground truth:19 teacher-marked answers and1 no-unique-choice control (Q13 Free). Pages1,2,3 plus repeated page1 for warm timing;4 runs/model. Both models receive actual reviewed question stems/keys matching production request fields, with no truth key leaked in requests. Preflight: node scripts/benchmark-local-vision.cjs qwen3-vl:2b --preflight passed20questions19marked; fixtures.json captures image hashes and owner confirmation. Completeness and denominators derive from manifest, not hardcoded reduced counts. This supersedes earlier16-question design notes. Await both downloads before timing; no production switch.
T-058 adaptation after actual full-page failures: both2B and4B returned fetch failed after about309seconds with no completed answers, so no accuracy score exists for that mode. Preserve baseline JSON/archive. Add scripts/prepare-vision-rois.py and ROI evidence; visually verify question-owned crops from immutable original PNGs, same20 questions19teacher answers, then compare both with identical ROI inputs. Replace experimental transport with native local HTTP streaming and explicit overall timeout; capture first-token time/error codes. Production provider/UI remain unchanged. /api/ps reported VRAM0; OS freeRAM measured4.43GB after unload; model residency is not whole process memory.

T-058 ROI verification checkpoint (2026-10-12): owner confirms teacher-rechecked red circles/crosses for this fixture. Visually inspected all three QA contact sheets: 20 question-owned original-pixel crops,19 marked keys and Q13 Free/no unique choice. QA labels are excluded from inference images. Experimental native loopback HTTP NDJSON transport added (scripts/local-vision-http.cjs); guards tested for UTF8, final metadata, incomplete stream, provider error and loopback-only scope. Metrics now match case IDs rather than first matching page, preventing repeated-page ROI truth contamination. Initial cropped 2B response completed in63.348s but captured empty content; preserved evidence/t058-roi/initial-stream-empty.json, no accuracy certification. Raw stream capture added for diagnosis. Both full-page failed baselines remain in evidence/t058-local. T-058 remains In Progress; production Gemini provider unchanged. Final actual comparison and finish-task gate pending.
T-058 runtime diagnosis: actual stream evidence shows schema JSON wholly in message.thinking with empty content despite thinkfalse. Diagnostic fallback is strictly JSON-only and experiment-only; preserve channel/chunks, never integrate as production response. First diagnostic2B q1 selected ข incorrectly with confidence0.95 (teacher truth ก); confidence alone unsafe. Transport tests passed. Evidence diagnostic-thinking-channel.json, ROI outputs. Full20case comparison ongoing.

### T-059 QuizFlow Technique Deep Dive and Architecture Porting
- Type: Research / Architecture
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: Codex / Core Architect
- Problem: User requested studying the battle-tested conversion, answer reconciliation, and image cropping techniques from the QuizFlow engine (`D:\0-Project\10-Obsidian\quizflow\skills\gdoc-exam-formatter`) to adopt and elevate AI Exam Formatter's accuracy and robustness.
- Acceptance Criteria:
  1. Inspect QuizFlow implementation in `skills/gdoc-exam-formatter` and its reference rules (`image-crop-and-conversion-rules.md`, `lessons-learned.md`, `SKILL.md`).
  2. Synthesize core technical mechanisms across 3 pillars: (a) Answer Reconciliation & Dual-Color Provenance, (b) Text Normalization & Choice Matrix Table Conversion, (c) Semantic Crop & 4-Side Edge Sweeper Clearance.
  3. Formulate concrete adoption blueprint for AI Exam Formatter.
  4. Record learnings and maintain Zero-Regression gates.
- Affected Files: documents/tasks.md, documents/memory.md, documents/decisions.md.
- Expected verification: Synchronized documentation, verified code paths, zero regression on existing suites.
- Verification result: Initial architecture deep dive completed; core scripts and reference rules verified from QuizFlow repository.

### T-060 OCR Connection Reset (fetch failed) Diagnosis and Provider Resilience
- Type: Bug / Feature
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: Codex / Fullstack Engineer
- Problem: User uploaded "บทที่ 7 ชุดที่ 5 เรื่อง การแยกสาร.pdf" and received top alert "อ่าน OCR ไม่ครบ: fetch failed". Curl and Node diagnostic showed `https://api.opentyphoon.ai/v1` TLS handshake failure (`curl: (35) Recv failure: Connection was reset`), leaving the right OCR pane completely empty. User requested Option A (Speed-first) to proceed immediately.
- Acceptance Criteria:
  1. Diagnose root cause of `fetch failed` (OpenTyphoon endpoint connection reset over network).
  2. Implement Option A (Speed-First): Prevent deadlock by retaining any extracted PDF text and providing instant "สร้างแบบร่างข้อสอบทันที (เน้นความเร็ว)" starter draft action in both error alert and empty OCR panel.
  3. When starter draft is triggered, generate neutral structured question cards (1..N with ก, ข, ค, ง) via `generateFallbackExamItems` allowing immediate left-pane image cropping, editing, and Google export without waiting for external OCR.
  4. Ensure `SplitDocumentEditor` wires `onCreateStarterDraft` and maintains full accessibility and zero-regression gates.
- Affected Files: app/page.tsx, components/SplitDocumentEditor.tsx, lib/exam-fallback.ts, documents/tasks.md, documents/memory.md, documents/decisions.md.
- Expected verification: Unit tests exit 0, E2E browser tests pass, CSS verified, finish-task gate.
- Verification result: Passed. Unit tests (12 suites), E2E browser tests (15 scenarios), CSS delivery check (HTTP 200, 38,793 bytes), and finish-task gate all passed cleanly. Option A starter draft enables 1-click rescue in error banner and empty OCR pane, generating 25 items with choice placeholders for immediate image snipping, editing, and export.

### T-061 Offline Typhoon Deployment, Model Compression & Hybrid Architecture Roadmap
- Type: Architecture / Optimization
- Status: In Progress
- Lifecycle: Proposed -> Ready -> In Progress
- Owner: Codex / AI Systems Engineer
- Problem: User inquired about eliminating external cloud dependencies by running Typhoon OCR locally, evaluating machine compatibility, model compression (quantization, distillation, fine-tuning) to reduce storage, and sustainable long-term architecture.
- Acceptance Criteria:
  1. Verify local Ollama deployment of `scb10x/typhoon-ocr1.5-3b:latest` on user's machine.
  2. Evaluate hardware constraints (Intel Core i5-1235U CPU-only vs Intel Iris Xe iGPU).
  3. Formulate concrete model compression and learning strategy (GGUF Q3/Q2 quantization, LoRA exam-specific fine-tuning, knowledge distillation to 1.5B student model, and OpenVINO iGPU acceleration).
  4. Propose immediate hybrid resolution (native digital PDF extraction alongside local vision fallback).
  5. Synchronize knowledge documents and maintain Zero-Regression gates.
- Affected Files: documents/tasks.md, documents/memory.md, documents/decisions.md.
- Expected verification: Local Ollama model inspection, test suites exit 0, CSS verified.
- Verification result: `scb10x/typhoon-ocr1.5-3b:latest` (3.2GB) verified present in Ollama; CPU-only execution profiled at ~60-90s/page; 4-tier optimization roadmap established.

### T-062 Fallback Cascade Ordering & Earth-Tone Design Theme (Rose Benedict Reference)
- Type: Feature
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: Codex / Lead Fullstack & UI Designer
- Problem: User requested: (1) Ordering the system fallback pipeline cleanly: Check Digital PDF text layer -> Cloud OCR -> Auto switch to Local OCR on connection failure -> Alert with manual options ("สร้างแบบร่างข้อสอบทันที" / "ดึงข้อความดิจิทัลเดิม"); (2) Updating UI theme to Earth-Tone based on Rose Benedict Design reference (Deep Olive Green #496053, Warm Terracotta/Ocher #b3996a, Warm Beige/Sand #eae8e1, Charcoal #28332d); and (3) Writing comprehensive design guidelines into documents/design.md for future maintainability.
- Acceptance Criteria:
  1. Cascade Fallback Order implemented cleanly across `app/page.tsx`, `lib/ocr-service.ts`, and `lib/file-parser.ts`:
     - Tier 1: Digital text extraction checked first (instant ~0.1s); if structured items exist, skip OCR.
     - Tier 2: Scanned document runs Cloud OCR.
     - Tier 3: If Cloud OCR fails (connection error / network reset), automatically failover to Local OCR (Ollama 127.0.0.1:11434).
     - Tier 4: If Local OCR also fails/unavailable, display alert with 1-click rescue actions: "สร้างแบบร่างข้อสอบทันที (เน้นความเร็ว)" and "ดึงข้อความดิจิทัลเดิม".
  2. Earth-Tone Design Theme implemented across UI:
     - Tailwind config and CSS variables updated with Rose Benedict tokens (#496053, #b3996a, #eae8e1, #28332d).
     - Applied to Header, FileUploader, SplitDocumentEditor, buttons, badges, notifications, and optical magnifier.
  3. Master Design rules written in `documents/design.md` detailing Earth-Tone design system, color tokens, typography, component states, and fallback pipeline contract.
  4. Pass all quality gates: check-knowledge-vault, npm test, npm run test:e2e, check-css, finish-task.
- Affected Files: app/page.tsx, components/SplitDocumentEditor.tsx, components/FileUploader.tsx, app/globals.css, tailwind.config.ts, lib/ocr-service.ts, documents/design.md, documents/tasks.md, documents/memory.md.
- Expected verification: finish-task.mjs exit 0, e2e browser test exit 0, CSS delivery check pass.
### T-063 Git Remote Repository Alignment & Vercel Deployment Readiness
- Type: Deployment / Infrastructure
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: Codex / DevOps & Fullstack Engineer
- Problem: User requested pushing the project to Git and connecting with Vercel ("เอาขึ้น git หน่อย ให้เชื่อมกับ vercel"). Current blockers: (1) GitHub remote repository `https://github.com/longdosika/AI_ExamFormatter.git` returns 404 (not yet created on GitHub under account `longdosika`); (2) Local git commit history accidentally tracked binary node addon files (`next-swc.win32-x64-msvc.node`, 135.8 MB each) inside `.node_modules-backup-*` and `node_modules_stale`, which violates GitHub's 100 MB hard limit (GH001) and blocks push; (3) `.gitignore` lacked `.next-*/`, `.qa-drift-*/`, `.node_modules-*/`, `node_modules_stale/`, causing git drift failures; (4) Vercel deployment requires clean repository configuration and explicit environment variable checklist.
- Acceptance Criteria:
  1. Update `.gitignore` with `.next-*/`, `.qa-drift-*/`, `.node_modules-*/`, and `node_modules_stale/`.
  2. Purge large binary node addons and stale cache artifacts from local git tracking, ensuring zero files > 100 MB.
  3. Validate project builds cleanly (`next build`) and all quality gates pass (`node scripts/check-knowledge-vault.mjs`, unit tests).
  4. Provide project owner with precise instructions to create the GitHub repository under `longdosika/AI_ExamFormatter`.
  5. Push commits to `origin main` cleanly once repository is available.
  6. Provide complete Vercel project import and environment variable configuration guide.
- Affected Files: .gitignore, documents/tasks.md, documents/memory.md, documents/decisions.md.
- Expected verification: `git ls-files` shows zero files > 25MB, `finish-task.mjs` exits 0, git remote push readiness confirmed.
- Verification result: Passed. Remote repository `https://github.com/longdosika/AI_ExamFormatter.git` verified created and responsive; `git push -u origin main` executed successfully with branch tracking established; live content verified at GitHub; all quality gates, 12 test suites, and Next.js production build passed cleanly.

### T-064 Google Drive OAuth & Environment Configuration Diagnostics & URL Normalization
- Type: Bug / Feature
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: Codex / Fullstack & Cloud Engineer
- Problem: User added Environment Variables on Vercel Dashboard, but Google Drive status still shows "ยังส่งออก Google Docs ไม่ได้ · รอตั้งค่าการเชื่อมต่อ". Potential causes: (1) On Vercel, adding environment variables requires a new deployment/redeploy to take effect; (2) `APP_URL` with a trailing slash (`/`) causes `googleConfig()` to throw an exception that resets `configured: false`; (3) Missing Picker credentials (`GOOGLE_PICKER_API_KEY` and numeric `GOOGLE_CLOUD_PROJECT_NUMBER`); (4) Session secret length under 32 characters; (5) Lack of diagnostic output in `/api/google/session` hides which exact variable is missing.
- Acceptance Criteria:
  1. Update `lib/google-auth.ts` to normalize `APP_URL` (strip trailing slashes gracefully) and return detailed, non-sensitive `missingFields` array.
  2. Enhance `app/api/google/session/route.ts` to expose `missingFields` and error reason when unconfigured, enabling transparent diagnostics without leaking secret values.
  3. Update `components/GoogleDriveStatus.tsx` to display specific missing configuration requirements when unconfigured.
  4. Pass all quality gates (`npm test`, `finish-task.mjs`).
  5. Push to GitHub to automatically trigger Vercel deployment with updated environment variables and diagnostics.
- Affected Files: lib/google-auth.ts, app/api/google/session/route.ts, components/GoogleDriveStatus.tsx, documents/tasks.md, documents/memory.md, documents/decisions.md.
- Expected verification: Unit tests pass, `/api/google/session` returns granular diagnostic information, git push triggers fresh Vercel deployment.
- Verification result: Passed. Trailing slash normalization implemented and verified in `googleConfig()`; `missingFields` array exposed in `GET /api/google/session` and rendered in `GoogleDriveStatus`; all unit test suites, vault checks, and finish-task gate passed cleanly.

### T-065 OCR request-size handling and imported skill compatibility
- Type: Bug / Refactor
- Status: In Progress
- Lifecycle: Proposed -> Ready -> In Progress
- Owner: Codex / OCR & Runtime Engineer
- Problem: Multi-page OCR batches are limited to ten pages but not to a request-body size. Large Base64 PNG batches can be rejected by the runtime/proxy as plain-text `Request Entity Too Large`; `lib/ocr-client.ts` then calls `response.json()` unconditionally and exposes `Unexpected token 'R'` instead of the actionable cause. A copied `gdoc-exam-formatter` skill specification also contains assumptions from another repository and must not override this project's source-of-truth or localhost/Vercel boundaries.
- Acceptance Criteria:
  1. Build OCR batches using both the ten-page ceiling and a conservative serialized request-size ceiling while preserving absolute page numbering and progress.
  2. Parse non-JSON OCR failures safely and show a Thai message explaining that the batch was too large or the provider returned an invalid response.
  3. Add regression coverage for adaptive batching and plain-text HTTP failures.
  4. Record compatibility guidance: imported skill rules are advisory and must be reconciled with this repository's `AGENTS.md`, `README.md`, and knowledge vault before use.
- Affected Files: `lib/ocr-client.ts`, `scripts/test-ocr-client.cjs`, `documents/tasks.md`, `documents/memory.md`, `documents/decisions.md`, `README.md`.
- Expected verification: `node scripts/test-ocr-client.cjs`, `npm test`, `npm run typecheck`, and `node scripts/finish-task.mjs T-065`.

### T-066 QuizFlow conversion blueprint parity: Thai normalization and answer directives
- Type: Feature / Parser hardening
- Status: In Progress
- Lifecycle: Proposed -> Ready -> In Progress
- Owner: Codex / Parser & Source-Fidelity Engineer
- Problem: The imported QuizFlow blueprint documents evidence-backed conversion rules, but this repository has no QuizFlow golden fixture files and must not claim parity from the blueprint alone. Two portable rules are directly applicable and testable here: Thai OCR spacing repair must run before structural parsing, and explicit answer directives must recognize `คำตอบ`/`Answer` in addition to `ตอบ`/`เฉลย`.
- Acceptance Criteria:
  1. Centralize conservative Thai OCR normalization with multi-pass diacritic/front-vowel spacing repair and explicit replacement mapping; never guess unknown replacement characters.
  2. Run that normalization before question/choice/explanation parsing without changing source page markers or inline media.
  3. Reconcile explicit `ตอบ`, `เฉลย`, `คำตอบ`, and `Answer` directives with explanation precedence; conflicting explicit keys stay unresolved.
  4. Add regression fixtures derived from the supplied Blueprint examples and existing parser contracts, clearly marked as synthetic until the real QuizFlow corpus is imported.
  5. Record parity gaps and porting boundaries; do not copy hard-coded QuizFlow paths, crop coordinates, template IDs, or hidden reasoning into production.
- Affected Files: `lib/text-normalization.ts`, `lib/ocr-service.ts`, `lib/exam-parser.ts`, `scripts/test-parser.cjs`, `scripts/test-ocr-contract.cjs`, `evidence/t066-synthetic-fixtures.json`, `evidence/t066-blueprint-parity.md`, `evidence/t066-verification.md`, `features/r-002-feature.md`, `documents/tasks.md`, `documents/prd.md`, `documents/architecture.md`, `documents/design.md`, `documents/decisions.md`, `documents/traceability.md`, `documents/code-map.md`, `documents/memory.md`, `documents/00-index.md`, `README.md`.
- Expected verification: parser/OCR regression tests, `npm test`, `npm run typecheck`, `npm run lint`, browser E2E recheck, and `node scripts/finish-task.mjs T-066`.
- Verification update (2026-10-13): parser/OCR targeted tests, `npm test`, typecheck, lint, Knowledge Vault check, and drift check passed. Browser E2E passed 11 checks but remains blocked at the existing 12-page fixture waiting for `ข้อความ OCR สำหรับตรวจแก้` (`scripts/test-e2e.cjs:218`); finish gate is therefore not yet successful. External QuizFlow golden artifacts remain unavailable, so synthetic fixtures cannot certify external output parity.
- Current blocker/owner: project owner must provide permitted QuizFlow golden inputs and expected artifacts; Codex must recheck the 12-page E2E raw-review transition before moving T-066 to `Verified`.

### T-067 Acquire QuizFlow golden corpus for parity certification
- Type: Confirmation / Evidence acquisition
- Status: Proposed
- Lifecycle: Proposed
- Owner: Project owner / QuizFlow source custodian
- Problem: The supplied Blueprint names QuizFlow builders, manifests, DOCX/Google Doc outputs and golden counts, but those files are not present in this repository. Synthetic T-066 tests cannot prove external output parity.
- Acceptance Criteria: Provide a permitted, secret-free fixture package or links containing at least one source input, expected parsed structure, expected answer provenance, media ownership/crops, and output/readback artifact; record hashes and license/permission; add a real fixture test before claiming parity.
- Affected Files: `evidence/`, `scripts/test-parser.cjs` or a dedicated fixture runner, `documents/tasks.md`, `documents/traceability.md`, `documents/decisions.md`, `documents/memory.md`.
- Expected verification: fixture hash/readback check, regression test, browser/manual evidence where applicable, and `node scripts/finish-task.mjs T-067`.

### T-068 Complete image-exam conversion flow
- Type: Bug / Feature hardening
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: Codex / Image OCR & Browser-flow Engineer
- Problem: Image uploads reach the OCR boundary, but the complete user flow is not yet certified end-to-end. The system must reliably show OCR text for review, preserve the original image for comparison, allow explicit conversion into editable exam questions, preserve source-provided answers/images, and remain usable when OCR is incomplete or provider/runtime state is stale.
- Acceptance Criteria:
  1. A PNG/JPG upload is represented as a source image and reaches the OCR route with image bytes; OCR progress/failure remains visible.
  2. Successful OCR exposes editable raw text before conversion; conversion uses the edited text without rerunning OCR.
  3. Valid choices, source answer directives/markers, and `[รูปโจทย์]` ownership survive conversion; incomplete structure remains reviewable and never invents questions/answers.
  4. Browser regression covers one image with mocked OCR, edited-text conversion, source-pane stability, and an OCR failure/incomplete path.
  5. Existing 12-page E2E fixture is either repaired with evidence or explicitly isolated as an unrelated runtime blocker; no test is weakened to hide the failure.
- Affected Files: `app/page.tsx`, `components/SplitDocumentEditor.tsx`, `lib/file-parser.ts`, `lib/ocr-client.ts`, `lib/pdf-renderer.ts`, `scripts/test-e2e.cjs`, `scripts/test-parser.cjs`, `scripts/test-ocr-client.cjs`, `scripts/sync-pdf-assets.cjs`, `scripts/test-pdf-assets.cjs`, `public/pdf.worker.min.js`, `public/pdf-assets/`, `package.json`, `documents/tasks.md`, `documents/prd.md`, `documents/architecture.md`, `documents/design.md`, `documents/decisions.md`, `documents/traceability.md`, `documents/code-map.md`, `documents/memory.md`, `documents/00-index.md`, `README.md`.
- Expected verification: targeted parser/OCR/PDF-asset tests, `npm test`, `npm run typecheck`, `npm run lint`, isolated browser E2E, and `node scripts/finish-task.mjs T-068`.
- Verification update (2026-10-13): local PDF worker/font/cmap assets pass; fresh browser E2E on `http://127.0.0.1:3220` passed all 15 checks, including unknown PNG OCR boundary, edited-text reconversion, 12-page 10+2 OCR batching, provider failure, source stability and no uncaught browser errors. `npm test`, typecheck, lint (8 existing image optimization warnings), knowledge vault, and drift checks pass. `node scripts/finish-task.mjs T-068` passed semantic, platform, drift, typecheck, lint, test, E2E, build, and CSS health gates. Evidence: `evidence/t068-verification.md`.

### T-069 Complete 80-question image/PDF conversion fidelity
- Type: Bug / Feature hardening
- Status: In Progress
- Lifecycle: Proposed -> Ready -> In Progress
- Owner: Codex / Exam fidelity and media-answer pipeline
- Problem: A real 80-question scanned exam currently produces only 27 navigable converted items. The source pane contains the full document, but OCR/parser boundaries, question-owned image attachment, and source-answer extraction are not yet proven for long mixed-layout files. The user also reports that inserted question images and available teacher answers are absent after conversion.
- Acceptance Criteria:
  1. Preserve and report all source question numbers from the OCR/raw review; no silent collapse from 80 to 27. Any unresolved ranges are explicitly listed with evidence.
  2. Parse long documents with mixed numbered lists, tables, figures, and continuation lines without inventing questions or merging distinct questions.
  3. Attach question-owned images with `[รูปโจทย์]` above the image and preserve them through conversion/edit/export snapshots.
  4. Use source answer marks/directives when evidence exists; leave ambiguous or missing answers visibly unresolved and record provenance.
  5. Add a regression fixture/contract for an 80-question, 13-page shape and browser coverage for count, media, and answer states.
  6. Run the completion gate and record real evidence before closing the task.
- Affected Files: `lib/exam-parser.ts`, `lib/file-parser.ts`, `lib/ocr-service.ts`, `lib/source-answer-service.ts`, `lib/source-answer-client.ts`, `app/page.tsx`, `components/SplitDocumentEditor.tsx`, `scripts/test-parser.cjs`, `scripts/test-e2e.cjs`, `documents/tasks.md`, `documents/prd.md`, `documents/architecture.md`, `documents/design.md`, `documents/decisions.md`, `documents/traceability.md`, `documents/code-map.md`, `documents/memory.md`, `documents/00-index.md`, `README.md`, `features/r-002-feature.md`, `evidence/`.
- Expected verification: targeted long-document/parser/media/answer tests, `npm test`, `npm run typecheck`, `npm run lint`, fresh browser E2E with 80-question fixture, and `node scripts/finish-task.mjs T-069`.

- Verification update (2026-10-13): parser and browser regressions found and fixed a second numeric-choice edge case: after a `1..4` block, `5.` was previously consumed as a fifth choice. Numeric choices are now capped at four; `5.` is treated as a next question only when an immediate letter-choice block follows, otherwise it remains stem enumeration. `node scripts/test-parser.cjs` PASS, `npm test` PASS, `npm run typecheck` PASS, `npm run lint` PASS with 8 existing image warnings, and `node scripts/check-knowledge-drift.mjs --require-git` PASS. Fresh browser E2E on `http://127.0.0.1:3220` PASS (16 checks): 80 navigable questions, 10+2 batching, page-owned figure rendering, stable original pane, mobile layout, provider-failure handling, and no uncaught browser errors. Evidence: `evidence/t069-verification.md`, `evidence/qa-iteration-2/results.json`.
- Remaining blocker/owner: live Gemini Vision source-answer calls are still blocked by recorded HTTP 429 (`evidence/t057-quota-image-20261012.json`, `evidence/t057-provider-recheck.json`). The app intentionally leaves answers unresolved. Project owner must recheck the Gemini API key/project quota and rerun the real 80-question file before T-069 can be moved to `Verified`/`Done` for the answer criterion.




- Additional regression update (2026-10-13): all-numeric 80-question input now passes too. A 5. after a numeric 1..4 block is a new question when its immediate following lines are either letter choices or numeric 1..4 choices; a stem enumeration remains intact when neither pattern follows.

### T-070 QuizFlow golden source/output parity for Chapter 7 separation exam
- Type: Confirmation / Evidence acquisition / Feature parity
- Status: In Progress
- Lifecycle: Proposed -> Ready -> In Progress
- Owner: Project owner / QuizFlow source custodian with Codex parity engineer
- Problem: The project now has the real 13-page scanned source PDF, but the expected QuizFlow Google Doc output is not readable from this runtime. The source contains mixed two-column numeric choices, shared contexts, tables, image-only choices, figures, and teacher answer marks, so the existing synthetic parity fixtures cannot prove the required output shape, media ownership, answer provenance, or learner-facing layout.
- Acceptance Criteria:
  1. Record the source PDF hash, page count, and representative rendered-page evidence without modifying the source.
  2. Obtain a permitted readback/export of the expected QuizFlow output (Google Doc access, DOCX/PDF/HTML export, or equivalent secret-free fixture) and record its hash/permission note.
  3. Build a parity matrix for question count/numbering, shared contexts, tables, image-only choices, question images, answer marks/directives, explanations, formatting, and visible captions/placeholders.
  4. Add golden-fixture metadata and regression tests only for behaviors supported by the source/output evidence; unresolved answer or image cases remain explicit warnings.
  5. Update the affected knowledge-vault documents and traceability, run the relevant test/build/browser checks, and use `node scripts/finish-task.mjs T-070` before moving beyond Verified.
- Affected Files: `documents/tasks.md`, `evidence/`, `documents/traceability.md`, `documents/decisions.md`, `documents/memory.md`, `documents/00-index.md`, `README.md`, and (after evidence review) `lib/exam-parser.ts`, `lib/ocr-service.ts`, `lib/pdf-renderer.ts`, `app/page.tsx`, `components/SplitDocumentEditor.tsx`, `scripts/test-parser.cjs`, `scripts/test-e2e.cjs`.
- Expected verification: source hash/render check, expected-output readback check, parity-matrix review, targeted parser/media/answer regressions, `npm test`, `npm run typecheck`, `npm run lint`, browser E2E, knowledge-vault/drift checks, and `node scripts/finish-task.mjs T-070`.
- Current blocker/owner: the supplied Google Doc currently returns an access/network failure from this runtime. Project owner must either grant permitted link access/export the expected output into the workspace or provide a connected Google Drive/Docs session before exact parity claims or code changes are made.

### T-071 Cross-machine Git handoff and environment parity check
- Type: Tooling / Portability
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: Codex / Project owner
- Problem: Moving the project to another Windows machine currently depends on remembering manual Git, dependency, `.env.local`, Ollama, OAuth, port, and test checks. A clone can appear ready while the required runtime/provider configuration is missing or inconsistent.
- Acceptance Criteria:
  1. Add a cross-platform Node environment doctor that checks Git/package-lock identity, Node/npm compatibility, dependencies/Next binary, safe env-key presence, configured OCR mode, local Ollama reachability/model, port availability, and optional provider readiness without printing secrets.
  2. Add reproducible Git push/clone/handoff instructions that explicitly keep `.env.local` and keys out of Git and use `npm ci` from the committed lockfile.
  3. Record a redacted environment evidence artifact on request and include actionable PASS/WARN/FAIL output with exit codes.
  4. Add a regression test for the doctor output/schema and synchronize README/decision/memory/traceability.
  5. Run the doctor, targeted test, full applicable checks, and `node scripts/finish-task.mjs T-071` before closing.
- Affected Files: `scripts/check-environment.mjs`, `scripts/test-environment-check.cjs`, `package.json`, `.env.example`, `README.md`, `documents/tasks.md`, `documents/decisions.md`, `documents/memory.md`, `documents/traceability.md`, `evidence/`.
- Expected verification: `npm run env:check`, `npm run test:environment`, `npm test`, `npm run typecheck`, `npm run lint`, and `node scripts/finish-task.mjs T-071`.
- Verification update (2026-10-13): `npm run env:check -- --skip-network --json` PASS; `npm run env:check:record` PASS and wrote `evidence/environment-check.json`; `npm run test:environment` PASS; full `npm test` PASS when loopback was permitted; `npm run typecheck` PASS; lint PASS with 8 pre-existing image warnings; `node scripts/finish-task.mjs T-071` PASS including knowledge, drift, E2E, build, and CSS gates. The first sandboxed test attempt failed only because the runtime denied the test's temporary loopback listener (`EACCES`), then passed outside sandbox.
