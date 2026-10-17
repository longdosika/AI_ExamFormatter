# T-132 Verification (2026-10-17)

Owner screenshots on 261017-1907 (chapter 7 set 2): Q22 crop lost the funnel top (labels 3, กรวย) and Q20 the cylinder top. The owner also asked whether the crop rules are recorded, really applied and learned from.

## Root cause
- Recorded OCR reads "22. 3 จากรูป…" (question number, figure label and stem) as one full-width line (y 204-228). Rule C-10 always put the crop top at that line's bottom +3, so a figure printed beside the line lost its top. Data from sets 2-3: under-stem figures start at least 1.25 line heights below the line top; beside figures start at 0.34-0.81.
- A live run then gave Q20 a model box starting at 850 although the cylinder starts at about 808. A geometry rule on the model box cannot fix that; the crop must follow the figure's ink upward (C-14 had only left/right).

## Rules audit (owner question)
- All rules C-01 to C-36 had code. Six rule functions had no direct unit test, and two rule tests existed but were never run: test-t123.cjs (C-13, C-20) and test-t121-fidelity.cjs (C-15, C-31, C-35) were not in npm test or test:e2e.
- Added capture-rules.md section ฉ. (rule -> code -> test) and scripts/test-capture-rules.cjs in npm test (so in the completion gate). It fails when a rule has no row, the code no longer contains the named function, or a listed test is missing or not run. Both unwired tests are now wired. All 26 rules (including C-37 from T-131) pass.

## Checks
| Check | Command / action | Result |
|---|---|---|
| Before (deployed 261017-1907) | `T132_LABEL=before T132_REPORT_ONLY=1 ... test-t132-crop-top.cjs` (first version) | Q22 top=231, 38 ink pixels on the top edge; Q20 top=834, 9 |
| C-10 only (261017-2028) on live boxes | `T132_LABEL=c10only T132_REPORT_ONLY=1` | recorded boxes fixed; live Q20 still 9 ink pixels on top edge |
| After (C-10 + C-14 upward) | `scripts/test-t132-crop-top.cjs` (recorded + live fixtures) | Q20/Q22 no ink on top edge, whole figure, no question number; crops in evidence/t132/after-*/ |
| Rule map + units | `node scripts/test-capture-rules.cjs` | 26 rules mapped; C-10 beside/under, C-12, C-36 unit checks pass |
| Unit / types | `npm test`, `npx tsc --noEmit -p .` | exit 0 |
| Full E2E on dev 127.0.0.1:3122 | `npm run test:e2e` (now includes test-t121-fidelity and test-t132-crop-top) | exit 0 |
| Set 1 regression | `T121_SOURCE80=1 test-t121-fidelity.cjs` | 80 questions pass |
| Production | `NEXT_DIST_DIR=.next-production-t132b npm run build` | 261017-2046 (2028 superseded) |
| Deployed localhost:3000 | badge 261017-2046, CSS 200; t132, t130, t131, t121-fidelity, e2e, workspace, t124, t125 | all exit 0 (deployed-*.log) |
| Live set 2 on 261017-2046 | `T121_RUN=t132-set2-live2 capture-t121-real.cjs` | model box Q20 850 (low again), Q22 213; crops complete: evidence/t132/live2-q20.png, live2-q22.png |

Note: port 3121 was held by another session's dev server; this task used 3122.

Open: I-062 red pen circle beside Q20 enters the right edge of the crop (coloured ink filter applies to OCR only).
