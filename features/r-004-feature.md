# ปรับแต่ง ตัวหนา ตัวเอียง ขีดเส้นใต้ได้ (อนาคตอยากให้รองรับ สูตรเลข สูตรเคมี เลขยกกำลัง)

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
