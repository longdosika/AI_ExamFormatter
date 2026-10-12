# UI task review — T-021

Review date: 2026-10-10 (Asia/Bangkok). This artifact records implementation review; browser results are recorded separately by the QA owner. It is not a completed device/UAT claim.

## Decisions and scope

- Preserve the established coral/teal/white visual style and 12 pt Sarabun editor; use Thai labels describing user actions instead of internal requirement IDs and engine terminology.
- Wrap the header, toolbar, and case controls at narrow widths. Below the desktop breakpoint, source and editor stack with separate 60 vh scroll regions; wide screens keep equal columns. Filenames truncate inside their panel, not across the page.
- File selection is a named native button usable with keyboard. Reading progress includes the filename and a cancel action. Replacement, cancellation, and unmount abort the pending parse; stale completions do not enter the editor. Home revokes accepted file URLs on reset/replacement/unmount and rejected empty/failed exam parses.
- Accepted imports increment a document version so same-filename/same-size content cannot reuse stale editable DOM.
- Formatting buttons have accessible names. Remember the selection inside the editor and restore it for formatting/image insertion. Announce notifications and errors; give the editor a multiline textbox role and label. Add visible keyboard focus and reduced-motion styling.
- Crop confirmation has a labeled dialog, initial select focus, Tab wrapping, Escape dismissal, and focus restoration. Crop targets use unique item IDs; inserting the image changes only its live DOM slot and retains text edits.
- Export acts on the live editor element, waits for the supplied integration callback, disables repeat submission while pending, and reports rejection. Google export remains disabled until the parent confirms readiness; the toolbar explains how to enable it.
- Mark editor metadata as noneditable and excluded from document serialization. Choice keys use teal bold styling. Display answer source descriptions without internal hex colors/provenance names.
- Case input labels are associated with fields; search has an accessible name, empty results have a helpful status, new entries show a Thai review status, and storage failures remain visible. Storage is explicitly browser scoped.

## Verification

- TypeScript: `npx tsc --noEmit` (initial pass succeeded; rerun after final edits by task owner).
- Case persistence contract: `node scripts/test-cases.cjs` (succeeded).
- React best practices review applied: versioned localStorage schema, effects with cleanup, selection and pending work in refs, explicit error/disabled states, no direct state rerender of user-edited children during crop insertion.
- Browser interaction, real mobile viewport overflow, and same-file import assertions are owned by T-019/T-023 QA; use their generated evidence before claiming acceptance.

## Limits

- Region selection and cursor-following magnification use pointer input. Keyboard users can insert a figure by its HTTPS/data-image URL via the toolbar; no keyboard rectangle-selection model is implemented.
- `contentEditable` and `document.execCommand` remain the current editing mechanism; browser-specific rich text behavior requires runtime evidence.
- Formatting while a modal or export is open retains the current browser editor state; persistence of arbitrary document edits beyond the active session is not part of this task.
