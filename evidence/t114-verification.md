# T-114 Capture and Table Regression

Date: 2026-10-16, Asia/Bangkok. Host: DESKTOP-FNVSAKS.
Baseline: clean main at 1901442 (261016-1034), synchronized to its cached origin; no Git mutation/publication authorized or performed by this task. User screenshots show build 261016-1043.

## Findings and Changes
- Q58-61 flattened color/distance/unit table headers and cells were outside the old text filter patterns. Restored HTML bypassed render-time cleanup. New table-context-gated patterns apply to parser/harvest and existing live/restored image-bearing text; DOM text ranges are deleted without rebuilding bold/italic prose. Unknown prose is kept; original OCR and the left reference are not edited.
- Capture target retained the previous navigation choice and reset to the first item when formattedItems changed. Pointer/keyboard context now suggests the edited question and role, while selection remains overridable. Shared range members resolve to their opening block instead of duplicating the table elsewhere. Displayed question numbers and internal item IDs remain distinct.
- Insert/replace/resize did not reveal their destination. They now reveal the affected figure after layout/image load; focus restoration does not scroll back and left reference scrolling remains independent.
- Row-gap trimming treated disconnected guide lines/labels as intruders even inside the original detection box. Protect that box, preserve thin lines, clamp padding correctly and explicitly request solvent-front/baseline/X labels in detection. A bad provider box can still include adjacent text or omit content; do not claim semantic completeness from row density.
- Focused tests discovered a narrow-image toolbar extending into the left pane, preventing clicks. Constrain its alignment to the editor; freeze replacement image across native picker delay.

## Verification
- node scripts/test-parser.cjs: passed chromatography table fixture, preserved narrative/chemical prose, existing parser regressions.
- node scripts/test-diagram-contract.cjs: passed existing intruder/choice contracts plus detached guide and protected-bounds cases.
- npm run typecheck: exit 0. npm run lint: exit 0, eight existing img warnings, zero errors.
- Development production-code browser checks: existing E2E 32/32 passed, including clicked-question capture suggestion, explicit override, destination visibility and image upload/resize/delete/undo. Focused script passed styled DOM/idempotence, actual crop Canvas pixels (both two-pixel guides intact), legacy resume, DOCX content/media, contextual upload/shared ownership, narrow toolbar bounds, native-picker replacement and 390px layout.
- Artifacts: evidence/t114-guide-crop.png, evidence/t114-capture-target.png, evidence/t114-restored-cleanup.png, evidence/t114-image-tools.png, evidence/t114-mobile.png, evidence/t114-capture-results.json. Initial DOCX fixture had its image in the label paragraph; corrected to match real editor markup rather than changing export layout.
- E2E_BASE_URL=http://localhost:3000 CSS_PORT=3000 node scripts/finish-task.mjs T-114: final corrected r2 run EXIT 0. Knowledge/platform/drift, type/lint/unit, 32/32 production Edge checks, focused capture/DOCX/pixel suite, production build (gate stamp 261016-1601) and CSS HTTP 200 / 54,319 bytes passed. Log: evidence/t114-completion-gate-r2.log. Final deployment/badge alignment is being verified separately; this gate output is temporary and not the served build.
- Initial production gate passed browser/focused checks but failed stamping lib/version.ts with Windows UNKNOWN open (-4094); file is not read-only and no task dev worker remained. A subsequent full rerun exposed a real timing regression: browser focus scrolling cleared the just-clicked capture target (1 instead of 2). Removed generic scroll invalidation; only deliberate wheel/touch/navigation/background interaction clears the explicit edit context. Corrected r2 gate passed; failures are retained in t114-completion-gate.log and t114-completion-gate-retry.log, not counted as passing runs.

## Final Deployment and Handoff
- Final isolated production build .next-production-t114-final: npm run build exit 0, stamp 261016-1602; evidence/t114-final-build.log. This final build contains the same corrected functional code as the successful r2 gate, with the newer generated stamp so source and served badge agree.
- Serving http://localhost:3000/ on loopback, task-owned PID 25000. Only task-owned development/candidate PIDs were stopped after checking identity; unrelated quizflow/other-port processes were not stopped. No external deployment or network exposure configured.
- E2E_BASE_URL=http://localhost:3000 npm run test:e2e: exit 0 on final build, 32/32 Edge checks, zero uncaught browser errors, plus the focused capture suite. evidence/t114-final-browser.log, evidence/qa-iteration-2/results.json and evidence/t114-capture-results.json. Capture/target override/actual source pixels, uploaded image edit, resumed table cleanup and actual downloaded DOCX were exercised on this exact URL.
- Opened final URL again in a fresh Edge context: HTTP 200, visible badge 261016-1602 equals lib/version.ts. evidence/t114-live-build.json. Source/left originals stay unchanged; tests used isolated synthetic browser profiles, not the user's drafts.
- Knowledge docs synchronized: tasks, architecture, design, decisions D-037, traceability, code-map, memory, index, existing R-001/R-002/R-004 notes and README. PRD unchanged because this fixes existing behavior. Shared E2E screenshots/JSON/DOCX regenerated by the existing suite and retained.
- Task moved In Progress -> Verified after successful gate, then Done after final deployed URL/flow verification. Scope is implementation and fixture-backed regression, not exact original-PDF or real provider/Google acceptance. No stage/commit/push performed.

## Limits and Follow-Up
- No exact original 13-page user PDF is present in this checkout. Fixtures reproduce the reported shape/text failures, not real-provider accuracy or acceptance of every figure in that document. No paid provider or real Google export was invoked.
- Existing cropped PNGs cannot be restored from missing pixels. Reharvest or manually recapture the old incomplete image once from the stored original. Ambiguous OCR fragments remain editable instead of being silently deleted.
- T-113 security hold and separate T-103/T-104 acceptance work remain open. No dependency versions, export template, Git history or user reference documents changed.
