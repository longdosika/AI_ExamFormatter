# ปรับแต่ง ตัวหนา ตัวเอียง ขีดเส้นใต้ได้ (อนาคตอยากให้รองรับ สูตรเลข สูตรเคมี เลขยกกำลัง)

### T-123 Fifth-Choice Editing
The existing radio/manual-origin, Save/resume and capture controls support จ when that source choice exists. Four-choice questions do not gain a fifth answer on keyboard5. One-choice-per-line template, source comparison and existing theme remain unchanged. [[../evidence/t123/verification]].

### T-118 Explicit Live Save
Toolbar Save captures live DOM, styles, images and manual answers immediately; raw stage captures current textarea. Strict storage readback reports failures and never falls back to a truncated snapshot while claiming success. Existing automatic saves continue. Regression: scripts/test-document-drafts.cjs and scripts/test-workspace-controls.cjs; evidence/t118-verification.md.

### T-115 Exact Original Resume
Actual PDF source-only reattachment renders all13 pages, survives reload, preserves the isolated edited fixture and enables magnification without OCR/AI calls. Four exact-source crops retain their protected pixels and detached guides. Private rendered artifacts remain under ignored tmp/pdfs/t115; evidence/t115-verification.md records the result and detection limits.

### T-114 Capture Editing Integrity
Preserve styled manual narrative during duplicate-table cleanup. Suggest the current question/role, retain the native-picker replacement target and reveal modified images. Automatic crops protect detached figure guides within their original bounds; saved truncated crops still need source recapture. Regression: parser/diagram unit checks, test-e2e and test-capture-editor; evidence/t114-verification.md.

### T-105 Continuous Original Reference and Expandable Question Ranges
Stored originals survive draft reopen, enabling magnifier/capture. Legacy source-only attachment keeps the live edited DOM/answers intact and verifies known identity. Circular gap controls expose hidden questions explicitly, support keyboard/aria/reduced motion and mobile wrapping. Completed workflow icons share subdued styling, with repeat actions still enabled. Evidence: evidence/t105-verification.md.

### T-102 Idempotent Live/Restored Answer Controls
The same managed marker/badge slots serve React updates and DOM editing. Legacy draft reopen and export remove doubled decorations while preserving text/media. Browser regressions exercise repeated AI analysis, manual changes and old duplicated snapshots; image preparation validates bytes even when an image has not scrolled into view. Evidence: evidence/t102-verification.md.

### T-101 Answer Origins and Working-Copy Export
Source answers use green (#E6F4EA), AI yellow (#FFF4CC), and user-entered/corrected answers blue (#E3EFFA), with named origin badges. Selecting/changing/clearing manual answers keeps live edits and images; draft saves merge ownership without reclassifying user corrections as source answers. Raw OCR and formatted drafts can be downloaded as DOCX or sent through authenticated Google export at any stage, including review findings. Snapshots preserve all answer colors and media. Evidence: evidence/t101-verification.md; scripts/test-e2e.cjs and scripts/test-google.cjs. This supersedes older review-gated export behavior.


Status: `In Progress`

## Traceability

- Requirement: R-004 in [[documents/prd]]
- Task: T-007 in [[documents/tasks]]
- UI accessibility/responsiveness: T-021 in [[documents/tasks]]
- Decisions: D-003 in [[documents/decisions]]
- Traceability Matrix: [[documents/traceability]]

## Behavior

User can edit the formatted document directly via Full-Screen 50-50 Split View. Left panel renders continuous original source file; Right panel renders continuous editable formatted document (12pt font) with RichTextToolbar providing Bold, Italic, Underline, Insert Image, Copy/Paste, and independent dual-pane scrolling.

T-021 preserves desktop equal-column comparison and stacks individually scrollable panes on small screens. T-027 decouples dual-pane scroll synchronization so left and right scroll completely independently, collapses top header to an ultra-compact single bar to maximize document viewport height, eliminates hardcoded fallback question fabrications to prevent document discrepancy, and clears prior document state on import start.

## Code

- Entry points: `components/SplitDocumentEditor.tsx`, `components/RichTextToolbar.tsx`, `app/page.tsx`
- Supporting files: `lib/exam-parser.ts`
- Data or integrations: Interactive ContentEditable rich-text formatting and dual-pane scroll ratio sync

## Verification

- Acceptance checks: Rich text toolbar formatting, full document continuous scroll, dual-pane scroll synchronization.
- Automated tests: Browser interaction coverage pending T-019; knowledge validation is not behavior evidence.
- Manual checks: Pending T-019 browser artifact under evidence/.
- UI implementation review: [[evidence/ui-review]]; runtime acceptance must use QA browser artifacts.
- Runtime checks: Pending editing, crop, magnifier and scroll acceptance; [[evidence/project-audit]].

## Known Risks
- T-020: Production font compilation requires Google Fonts network access; alias baseUrl explicitly set to project root.
- Build passed with normal filesystem/network access; sandbox alias resolution still fails. T-016 inserts captured images by stable item ID without rebuilding edited document; browser acceptance pending T-019.

- Math formula editing (KaTeX / MathJax) will be added in a future enhancement phase.

T-041 verified source artifact: explicit inline/sparse media ownership, source-page navigation excluded from learner export, fixed OCR prompt, table column labels, checkbox markers not answer evidence, aspect-ratio-safe snapshots. Regression and evidence: evidence/t041-browser-result.json; evidence/t041-media-manifest.json. Full automatic source fidelity remains open in T-039.

T-041/T-042 final verification: original PDF import -> exact SHA-256 reviewed corpus -> 25 questions/100 choices/5 source-owned media -> editor -> source-page navigation -> live DOM snapshot -> native Google Docs. Source page is captured when each question starts, preventing prior-page questions shifting forward. Unknown/changed files use ordinary OCR; no approximate filename match or learned answer inference. Corpus is data under public/reviewed and includes reviewer, source hash/page count and text. Live PDF import: 3.577s, zero OCR calls. Remote OCR baseline: 13.8s, recognition defects retained for review. All seven native PDF pages visually checked after grouped pagination repair. Readback: evidence/t041-gdoc-readback.json. Browser: evidence/t042-real-pdf-result.json. Google URL: https://docs.google.com/document/d/1r5CWTFdiQE98JAmSgRMNnNh1WKLIuJzqI4vVwZOCfIY .

### T-084 image-order editing contract
The editable formatter now renders explicit image headings in the requested sequence. Shared contexts begin with `โจทย์ร่วม:` and optional shared image `รูปโจทย์ร่วม:`; question images render under `รูปโจทย์:` before the choices; explanation image blocks render `รูปคำอธิบาย:` after optional `คำอธิบาย:` text. This keeps manual review/export order predictable while preserving existing rich-text editing and crop insertion behavior.

### T-085 consistent manual/automatic image headings
Manual crop insertion, toolbar image insertion, and AI-harvested question images now use the same visible heading: `รูปโจทย์:`. The observer no longer injects `[รูปโจทย์]` when that heading is already present, preventing duplicate text in the editable document and export snapshots.

### T-086 crop/editing hygiene
AI-harvested question images keep their explicit `รูปโจทย์:` heading while the crop pipeline removes option text that belongs outside the figure. This keeps the editable document cleaner before manual review and export.

### T-087 resumable draft editing
Saved draft entries are working documents. When a draft contains formatted items, the editor opens immediately for continued editing even if the original file is not active. The saved editor DOM is restored for exact continuation, future edits autosave back to local draft storage, and the drafts modal follows the earth-tone action/theme rules.

### T-092 spacious editor controls
The conversion header, stage stepper, review disclosure, question navigation, and editable document area use explicit spacing so the right editor remains readable with long question lists. The source pane stays read-only and the toolbar remains above navigation; the export DOM contract is unchanged.

### T-094 compact OCR workspace layout
The OCR/editor pane prioritizes readable content by keeping the stepper and actions in a compact responsive header, flattening question navigation into a dense flex strip, and reducing editor padding. Tooltips, accessible labels, active states, and source-left/editor-right boundaries remain intact.

### T-095 active question-window navigation
The editor navigation keeps the active ten-question range expanded and shows decade anchors outside it, reducing visual density without hiding the full question set from the document. A short transition and reduced-motion fallback communicate the active range change without altering source or export content.

### T-096 first-question navigation anchor
The editor keeps the first parsed question visible as a permanent navigation anchor in long documents. The active ten-question range, decade anchors, keyboard semantics, source pane, and export content remain unchanged.

### T-097 compact status rail and automatic answer action
The editor header and status messages do not push the source/editor panes. Stepper actions remain fixed-size icon controls and reveal labels only on hover/focus. Review findings are represented by the review icon/badge, while the answer icon runs the existing source-answer Vision pipeline and reports unresolved evidence without hallucinating an answer.

### T-098 AI answer fallback when source key is absent
Answer reconciliation preserves source ownership and adds an explicit AI fallback for unresolved questions. The editor reports source/AI/unresolved counts and labels AI-generated answers for manual review before export.
