# T-107 Accordion Strip, Editor Image Tools and Hover Rails Verification

Date: 2026-10-15, Asia/Bangkok. Host: DESKTOP-FNVSAKS.

## Findings (owner screenshot of build 261015-2110)
- The 80-question strip wrapped to two lines because every opened range stayed open (`expandedGaps` set).
- Editor images (for example the shared table for items 17-18) had no replace/resize/delete controls; adding an image required typing a URL into `prompt()`.
- Header utilities were icon-only; names appeared only through delayed tooltips.
- The requested `frontend-design` / `redesign-skill` skills are not installed here; design followed the project palette (documents/design.md section 5.1, Rose Benedict-inspired Earth tone).

## Changes
- Single-open accordion (`openGap`), one-line scrolling strip with faded edges, teal capsule for the open range, coral marker for the current question inside a folded range, auto-reveal of the active chip/open range.
- Floating image toolbar on hover/click: replace from file, recapture from original, 50/75/100% size (`data-export-scale`, honored by DOCX/Google export), delete with 8 s Undo. Add image via file picker, drag-drop or paste; all reuse the insert dialog (title "แทรกรูปจากไฟล์").
- Header utility rail and source tool rail unfold labels on hover/focus with staggered slide (fine pointer, >= 768 px only).
- Motion polish: question-jump coral flash (box-shadow only), editor reading-progress line, copy-success check morph, source page tick, image frame fade. All disabled under reduced motion.

## Verification
- `npx tsc --noEmit`, `eslint app components lib --quiet`, `eslint scripts/test-e2e.cjs`: exit 0.
- E2E on isolated dev :3101 (evidence/t107-e2e.log): first run failed "Mobile import page must not overflow horizontally" because hover-expanded header labels were still transitioning when the test shrank the viewport to 390 px. Fixed by scoping both label expansion and its transition to `(hover: hover) and (min-width: 768px)`. Rerun: 30/30 PASS including new checks: single open range, jump-outside closes, current-question marker "66", strip height <= 48 px desktop and mobile, image add from file through the dialog, 50% preset -> DOCX `<wp:extent cx="1143000" cy="571500"/>` (120x60 px from a 240x120 PNG), delete removes figure and label, Undo restores.
- capture-t107 (1912x914 and 390 px): nav 37 px both widths, no horizontal overflow. Screenshots: t107-nav-open-range.png, t107-nav-marker.png, t107-upload-dialog.png, t107-image-tools.png, t107-image-undo.png, t107-header-rail.png, t107-source-rail.png, t107-workspace.png, t107-mobile.png.
- Production gate: first run failed only on transient Windows `UNKNOWN` evidence writes. Second run found a real defect: switching ranges let the closing range's chips wrap, so the strip briefly measured 60 px. Fixed (`.nav-gap-content` nowrap, open max-height 28 px); a production measurement stayed 37 px through the switch. Rebuilt 261015-2153; `finish-task` exit 0 with E2E 30/30, build (stamp 261015-2155) and CSS health (evidence/t107-completion-gate.log).
- Deployment: localhost:3000 (127.0.0.1) serves 261015-2153 from `.next-production-t107`; HTTP 200, CSS OK, capture-t107 rerun passed against :3000, browser pane flow: 80 questions converted, only range 50 open after opening 20 then 50, strip 37 px.

## Boundaries
- Drag-drop and clipboard paste are implemented with the same handler as the file picker; automated tests cover the file-picker path only.
- Recapture uses the existing original-capture flow and requires a visual original (PDF/image pages).
