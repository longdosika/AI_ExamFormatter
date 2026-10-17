# T-121 Audit Verification (Claude, 2026-10-17)

Owner request: "ตรวจสอบงานที่ทำค้างก่อน ว่าถูกทำไปหรือยัง หากทำแล้วเรียบร้อยไหมตรวจสอบด้วย หากยังไม่ทำหรือปิดยังไม่ได้ ทำสะ อย่าลืม update checklist release log".
Source: owner-supplied `C:/Users/natha/Downloads/บทที่ 7 ชุดที่ 3 เรื่อง การแยกสาร.pdf` (4 pages, 25 questions).

## Re-check of items closed by the other agent (live providers, deployed 261017-0014)
- `audit-0017/`: 25 questions, every question กขคง except Q15 (split waits for the user's confirmation), one choice per line, Q6/Q21 tables captured as images with table text removed, Q20 apparatus clean, Q8 complete.
- Defect found: Q10 graph cut at the right edge ("เวลา (น"): `audit-0017/q10.png`.

## Defects found and fixed
- I-033 Q10 crop: `extendCropAcrossInk` widens a padded crop whose printed ink touches the side, until a clear gap (budget 8% width, coloured ink ignored, figure rows only). After: `audit-fixed/q10.png` shows "เวลา (นาที)"; Q20/Q8 unchanged in content.
- I-034 source answers 0: key 1 had no gemini-3.8-flash quota; the old loop tried every model inside key 1 and always ended on flash-lite. `executeAcrossModelsAndKeys` tries the model on all keys first (source answers, AI answers, diagrams). Live result `audit-answers-fixed/`: source 11 (page 1: 1ค 2ค 4ง 6ค, matching the circles and the other agent's expected values), AI 13, 1 pending (Q15). X/tick evidence ("กากบาทสีแดงทับตัวเลือก ง" on Q23 in `audit-answers/`) is now rejected.
- I-035 a 0..1-scaled diagram box (`audit-answers-fixed/diagrams-response.json` page 1) dropped the Q6 table; boxes on that scale are rescaled.
- I-036 inline stem enumerations ("2. ละลายน้ำแล้วกรอง 3. ระเหยแห้ง") split one item per line.
- B-18: uncaptured table rows stay one row per line; ordinary ruled tables remove duplicate OCR text without grid detection (`hasCellRowEvidence`, true for Q6/Q21 in three real runs, false for Q20).

## Verification
- `npm test` exit 0 (`audit-npm-test.log`); `npm run lint` 0 errors / 9 existing warnings; `npm run typecheck` clean.
- New tests: test-parser (table rows, enumerations), test-diagram-contract (crop widening, 0..1 boxes, cell-row evidence on real OCR regions), test-provider-keys (model-before-key order), test-source-answers (X/tick rejection), `scripts/test-t121-source-marks-ui.cjs` (replay of recorded gemini-3.8-flash answers: source 11 / AI 13, Q4 chip preview shows the original mark).
- `node scripts/finish-task.mjs T-121` exit 0 on dev 127.0.0.1:3121: 37 PASS lines, all E2E suites, isolated build, CSS ok (`audit-completion-gate.log`). The first run stopped only at the CSS check because the dev server was bound to `localhost`.
- Production `261017-0911` (`.next-production-t121-audit`) on localhost:3000 replacing 261017-0014 (PID 17800): HTTP 200, badge 261017-0911 read in the browser pane, CSS ok; deployed test-t121-fidelity, test-t121-controls and the source-mark replay exit 0.
- Google Docs export (B-35) was not re-run: the browser pane is not signed in and the agent does not sign in for the owner. The other agent's screenshot `google-doc-80-q66-fixed.jpg` shows the Q66 table complete and one choice per line.

## Not done / boundaries
- B-32 commit: D-068 records the owner's no-stage/no-commit/no-push instruction; nothing was staged or committed.
- B-36 QuizFlow import: blocked on the QuizFlow database (other agent working on QF-BUG-DB-CONNECTION-347).
- Source-answer recall depends on model quota: after several live runs gemini-3.8-flash was exhausted on all keys and flash-lite again returned no circles. Recorded responses are replayed in tests instead of repeating live calls.
- The OCR ink filter stays opt-in (D-069).
