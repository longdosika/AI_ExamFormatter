# T-117 Stable Header Targets
2026-10-16, DESKTOP-FNVSAKS. Verified -> Done.

Live CUA test on261016-1648: getByRole(button, name=คลังไฟล์บน Drive).click opened ประวัติไฟล์นำเข้า instead. The existing ui-rail expands every label on hover/focus, moving controls while the pointer enters. Fixed only header rail with fixed32px buttons and per-control floating labels. scripts/test-library-ui.cjs all-tool before/after-hover rectangles and three pointer re-entry/library-open checks pass on261016-1716, alongside mobile/Escape/focus checks. node scripts/finish-task.mjs T-116 T-117 exit0 (evidence/t116-t117-completion-gate.log),32/32 E2E plus focused capture/library, type/lint/unit/build/CSS200. Final deployment and real-pointer smoke pending.

Final shared gate after all code changes exit0 (evidence/t116-t117-completion-gate-final.log). Final production261016-1734 IAB reload and real library click open correct modal; separate full browser rerun exit0,32/32 plus capture/library with stable all-tool rectangle and repeated entry checks (evidence/t116-release-browser-final.log). CSS200/57,168 bytes; mobile/Escape/focus passed. No unrelated toolbar or template change.
