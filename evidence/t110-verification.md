# T-110 Dark Rails, One Export Control, Richer Question Strip Verification

Date: 2026-10-16, Asia/Bangkok. Host: DESKTOP-FNVSAKS.

## Findings (owner screenshot, build 261015-2300)
- A: after export the "เปิด Google Doc" link appeared in the page header while export itself lives in the editor toolbar (B), so the flow had two places.
- C: the question strip showed only numbers; answer state and review findings were invisible there.
- D-E: pane header bars were light and blended with the paper.

## Changes
- One export control in the toolbar: sand "ส่งออก" button (name "ส่งออกเข้า Google Drive" unchanged), spinner while exporting, then "ส่งออกใหม่" plus an attached "เปิด" segment linking to the exported document; header link removed; screen-reader status text added.
- Question strip: answer-origin dots (source/AI/manual), amber ring for questions named in review findings (folded ranges show an amber dot), hover/focus preview card, answered-count chip and issue chip that jumps to the first flagged question; strip stays one line.
- Dark olive-ink rails for source and editor heads via scoped --ui-* tokens; sand next-action and sage finished steps; sand shimmer along the rail edge while work runs.
- Design guidance: frontend-design skill (one bold move, motion only in response to actions, no "·"-joined meta strings).

## Verification
- `npx tsc --noEmit`, `eslint app components lib --quiet`, `eslint scripts/test-e2e.cjs scripts/capture-t110.cjs`: exit 0.
- E2E on dev :3101 (evidence/t110-e2e.log): 30/30 PASS. New checks: open-document link inside the export control with the export URL, no export link in the header, export button title switches to export-again, manual-origin dot on a chip, summary "3/N", hover preview tooltip, dark gradient rail. First run failed only because the header check also matched the template link "แม่แบบข้อสอบ (Google Docs)"; the assertion was narrowed.
- capture-t110 (1912x914 and 390 px): strip 37 px on both, no horizontal overflow, header links only the template link, summary 20/80, issue 1. Screenshots: t110-workspace.png, t110-strip-preview.png, t110-rail-busy.png, t110-rail-busy-shimmer.png, t110-rail-exported.png, t110-source-rail.png, t110-mobile.png.
- Production gate: first run reached build and failed with ENOSPC (drive D: 0 bytes free; project ~1.5 GB, rest outside the project). Deleted only agent-created obsolete build folders (~0.5 GB). Rerun `finish-task` exit 0 on production 261016-0902 at :3102 (E2E 30/30, gate stamp 261016-0911, CSS health) (evidence/t110-completion-gate.log).
- Deployment: localhost:3000 (127.0.0.1) serves 261016-0902 from `.next-production-t110`; HTTP 200, CSS OK; capture-t110 against :3000 passed.

## Boundaries
- Google export is mocked in E2E/captures; real Drive conversion is unchanged from T-109 and not exercised here.
