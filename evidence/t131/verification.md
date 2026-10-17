# T-131 Verification: several question figures per question (I-059 / H-13)

Date: 2026-10-17. Working tree only (no stage/commit/push, D-068). Dev server: http://127.0.0.1:3121 (NEXT_DIST_DIR=.next-dev-t131).

## Master template check
evidence/t109-master-template.docx (Google Doc 1uA8A1Q1lXCDIGRPtgBA0H77xYoMWCoo7thp5Hi0nvBQ): questions 7, 8, 11, 12, 23, 24 each have "รูปคำถาม:" followed by exactly one image paragraph, then "ตัวเลือก:". The template has no example with several images and no rule against it. Chosen: one label, one image paragraph per figure (D-078); to be confirmed by the owner / a real QuizFlow import.

## Root causes
1. ExamItem had one imageUrl/imageBbox; harvestExamDiagrams overwrote it for every "question" figure of the same item (Q25: 4 recorded figures, 1 kept).
2. Found while testing: SplitDocumentEditor labelImages (MutationObserver) inserted a "รูปโจทย์:" heading in front of figures 2 and 4 (no heading next to them), so the first DOCX had 3 labels for Q25.

## Results
| Check | Command | Result |
|---|---|---|
| Typecheck | `npx tsc --noEmit -p .` | exit 0 |
| New replay test | `E2E_BASE_URL=http://127.0.0.1:3121 node scripts/test-t131-multi-figure.cjs` | pass: Q25 4 figures [[590,106,771,512],[595,550,771,888],[772,150,938,252],[800,320,938,440]] = รูปที่ 1-4; one block, one label; Q5 none, Q8/16/20/22 one each; re-harvest still 4; draft reopen identical; DOCX: one "รูปคำถาม:", 4 image paragraphs before "ตัวเลือก:"; Google payload: 1 questionImageLabel + 4 questionImage, server DOCX writer keeps 4 |
| Unit suite | `npm test` | exit 0 |
| DOM order test | `node scripts/test-t121-order-dom.cjs` | pass |
| Full E2E on dev | `E2E_BASE_URL=http://127.0.0.1:3121 npm run test:e2e` | exit 0 (test-e2e.log), incl. T-124/T-125/T-130 figure suites |
| Completion gate | `E2E_BASE_URL=http://127.0.0.1:3121 node scripts/finish-task.mjs T-131` | exit 0: vault, platform, drift, typecheck, lint, test, test:unit, test:e2e (T-130/T-131 pass), build stamp 261017-2006, CSS |

Before the fix the same replay (recorded responses) produced one Q25 figure (I-059, T-130 live run on 261017-1907).

## Artifacts
- q25-four-figures.png: editor, Q25 with รูปที่ 1-4 under one รูปโจทย์:
- q25-export.docx: downloaded DOCX
- q25-editor-harvested.html / -reharvested.html / -reopened.html: Q25 editor markup per stage (image data elided)
- replay-result.json: boxes, DOCX and Google layout counts
- test-e2e.log, completion-gate.log

## Not covered
- Not deployed to localhost:3000 (still 261017-1907); not run against live providers (recorded responses only).
- Real QuizFlow import of a question with several images not exercised (B-36 still open).
- Manual capture (จับภาพ) for a question still replaces the whole figure block.
