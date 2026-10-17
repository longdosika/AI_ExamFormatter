# T-130 Verification (2026-10-17)

Owner screenshot on 261017-1543 (chapter 7 set 2, Q5) plus requests: (A) a choice table is not รูปโจทย์, (B) remove the header status text, (C) merge the Drive and export buttons, and other controls in one flow.

| Check | Command / action | Result |
|---|---|---|
| Real data recorded | `E2E_BASE_URL=http://localhost:3000 T121_PDF=".../บทที่ 7 ชุดที่ 2 เรื่อง การแยกสาร.pdf" T121_RUN=t130-set2 node scripts/capture-t121-real.cjs` | OCR + diagrams HTTP 200 (first try on 127.0.0.1 got 403 "Origin rejected"; rerun on localhost). Provider marked choice tables of Q5/Q7/Q8/Q10 as question figures |
| Rule on real OCR lines | isChoiceTableFigure | Q5 table true, Q8 table true, Q8 diagram false; Q10 (noisy OCR, 7/20 values) true after the all-labels + rows rule |
| Replay test | `scripts/test-t130-choice-table.cjs` | Q5/Q7/Q10 no รูปโจทย์, Q8 keeps its diagram, Q16/20/22/25 keep figures; old draft with a Q5 choice-table image cleaned on reopen; header status sr-only; Drive control locked (no menu) then ready with menu (backup + Drive settings) |
| Types / unit | `npx tsc --noEmit -p .`, `npm test` | exit 0 / exit 0 |
| Full E2E on dev 127.0.0.1:3121 | `npm run test:e2e` | exit 0 (after updating test-e2e, test-workspace-controls, test-t121-controls for the one Drive control) |
| Production | `NEXT_DIST_DIR=.next-production-t130 npm run build` | exit 0, stamp 261017-1907 |
| Deployed localhost:3000 | badge 261017-1907, CSS 200; test-t130-choice-table, test-e2e, test-workspace-controls, test-t121-controls, test-t128-duplicate-import, test-library-ui | all exit 0 (deployed-*.log) |
| Live on deployed build | `T121_RUN=t130-set2-live capture-t121-real.cjs` | provider again returned Q5/Q7/Q10 figures; editor has รูปโจทย์ only on Q8, 16, 20, 22, 25 (evidence/t121/t130-set2-live/editor.txt, harvested.png: header without status text, toolbar shows one "เชื่อม Google" lock control) |

Screenshots: q5-no-table-figure.png, q8-diagram-kept.png, drive-menu-ready.png, export-ready.png, header-locked.png.

Open / not covered:
- I-059 / H-13: Q25 has four figures (รูปที่ 1-4) but one question keeps one รูปโจทย์; the last figure wins. Pre-existing, handed off.
- Real Google Drive export and backup through the new menu were exercised with mocked Drive only (no sign-in in this environment).
