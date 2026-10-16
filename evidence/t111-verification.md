# T-111 Workspace Conveniences Verification

Date: 2026-10-16, Asia/Bangkok. Host: DESKTOP-FNVSAKS.

## Selection
Owner priority: performance > convenience/clarity > looks. Ten of the thirty proposed items were chosen because they reuse existing state and animate only transform/opacity/box-shadow once: header draft chip (#6), folding notice (#7), recent drafts on upload (#4), clickable next step (#18), J/K keys (#21), answered chip fill + jump (#20/#22), answer pop (#23), current-question pill (#26), dimmed crop surround (#13), upload received motion (#1). Deferred: minimap, workspace dark mode, export preview, OCR-coordinate highlight, step progress rings, export history.

## Process note
The task entry in documents/tasks.md was written after implementation started in this pass; it records the same scope and verification.

## Verification
- `npx tsc --noEmit`, `eslint app components lib --quiet`, `eslint scripts/test-e2e.cjs scripts/capture-t111.cjs`: exit 0.
- E2E on dev :3101 (evidence/t111-e2e.log): 31/31 PASS, including J/K from question 1 to 2 and back, answered chip jumps to the next unanswered question, recent-draft resume buttons on the upload screen without horizontal overflow.
- capture-t111: next-step button present; notice folded after 6.5 s; screenshots t111-draft-chip.png, t111-notice-folded.png, t111-recent-drafts.png, t111-crop-dim.png (300x160 frame, outside dimmed), t111-question-pill.png ("ข้อ 8 จาก 40", answered chip 14/40 filled).
- Production gate: `finish-task` exit 0 on production 261016-0945 at :3102 (E2E 31/31, gate stamp 261016-0947, CSS health) (evidence/t111-completion-gate.log).
- Deployment: localhost:3000 (127.0.0.1) serves 261016-0945 from `.next-production-t111`; HTTP 200, CSS OK; capture-t111 against :3000 passed (next-step button present, notice folded).

## Boundaries
- Shortcut keys are inactive while the cursor is in the editor, inputs or selects (by design).
- Performance was not profiled with tooling; the changes avoid per-frame React state and looping animations.
