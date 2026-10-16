# T-106 Workspace Chrome Redesign Verification

Date: 2026-10-15, Asia/Bangkok. Host: DESKTOP-FNVSAKS.

## Findings (owner screenshot: evidence/t106-before-owner.png)
- Header carried eight equal-weight outlined buttons plus a separate full-width export banner row; the status pill competed with them.
- Labels for page position, question numbers and stepper badges were 7-10 px; question chips were 20 px tall.
- Chrome mixed cool slate/blue greys with the warm earth palette, and the body ground was `bg-slate-50`.
- Next-step buttons pulsed as a whole (`animate-pulse`), and the four stepper icons had no visible text saying what to do next.
- The requested `frontend-design` / `redesign-skill` skills are not installed in this environment; the analysis and redesign were done manually against the same principles (hierarchy, restraint, consistent tokens, purposeful motion).

## Changes
- Warm `--ui-*` token set and shared component classes in app/globals.css; body ground #f4f2ec.
- Header: identity (logo with subtle scan line, name, build, Drive dot) -> live status pill and Google Doc link -> quiet icon group with tooltips -> single "เลือกไฟล์ใหม่".
- Source head: title, page chip (`ต้นฉบับหน้า n/m` kept for screen readers and tests), file name, icon group (attach, magnifier with zoom segment, capture).
- Editor head: item count, stepper with halo on the next actionable step, popping completion check, filling connectors and a next-step text label (>= 1536 px); grouped formatting tools; teal export button.
- Question strip: 24 px chips, 11 px tabular numbers, gap dots; review findings in a softer collapsible.
- Upload card, Drive card, draft banner and uploader statuses use the same tokens.
- Unchanged by design: editor item markup/colors/12 pt typography (export snapshot), accessible names and data-layout/data-step contracts.

## Verification
- `npx tsc --noEmit`: exit 0. `eslint app components` (quiet): exit 0.
- `npm test`: exit 0 (evidence/t106-npm-test.log).
- `npm run test:e2e` against isolated dev server :3101: first run failed "Tools belong to header above question navigation" because the new pane entrance used a translateY animation while the test measured header and nav at different moments. Fixed by making the pane entrance opacity-only. Rerun: 28/28 PASS, exit 0 (evidence/t106-e2e.log).
- `scripts/capture-t106.cjs` (Edge, headless): header 44 px, nav 37 px, smallest chip 24 px, no horizontal overflow at 1600 px or 390 px, all T-106 animations stop under reduced motion (evidence/t106-capture.json).
- Screenshots: t106-upload.png, t106-raw-review.png, t106-workspace.png, t106-workspace-expanded.png (gap 11-19 open, tooltip shown), t106-workspace-1912.png (owner width), t106-workspace-mobile.png.
- Production build 261015-2110 (`.next-production-t106`) served at http://127.0.0.1:3102.
- `E2E_BASE_URL=http://127.0.0.1:3102 CSS_PORT=3102 node scripts/finish-task.mjs`: first attempt failed only on Windows `UNKNOWN` open errors while E2E wrote evidence/t047-12-page-fixture.pdf and qa-iteration-2/results.json (same transient lock recorded in T-105); the unchanged rerun exited 0: vault, platform, drift, typecheck, lint, npm test, E2E 28/28, build (stamp 261015-2114) and CSS health (evidence/t106-completion-gate.log).
- capture-t106 rerun against :3102 production: same bounds, reduced motion true. Browser pane on :3102: 30-question upload converted, navigation rendered, build badge 261015-2110.

## Boundaries
- Browser fixtures are local text files; OCR/AI providers are mocked inside E2E as before. Visual review is by screenshot, not a usability study.
- Owner-approved deployment: localhost:3000 now serves build 261015-2110 (`.next-production-t106`, bound 127.0.0.1); HTTP 200, CSS health OK, capture-t106 passes, browser flow converted 30 questions with 8 source answers and expanded the 11-19 gap. The temporary :3102 server was stopped. Log: evidence/t106-production-3000.log.
