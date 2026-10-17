# T-126 Multiple Correct Answers and Editable Choices (Claude, 2026-10-17)

Owner request with screenshots on 261017-1214: "ปรับให้รองรับการเฉลยข้อถูกมากกว่า 1 ข้อ" (set 3 Q9: the original circles both ก and ง) and "ปรับให้แก้ไข เพิ่ม/ลบ ตัวเลือกได้" (Q15 shows a merged choice).

## Before
- One answer per question: radio inputs sharing a name, `selectManualAnswer` keeps a single key, `answerItemsFromEditor` keeps the first manual row.
- Source vision prompt treated several circles as ambiguous and the server dropped any question with two rows.
- Choice text was editable, but rows could not be added or removed.
- The master template already marks several correct choices with "*" (template Q3 "2 *", "3 *"; Q4 two answers), and the export stars each row independently.

## Changes
- `lib/answer-editor.ts`: "ตอบได้หลายข้อ" toggle per question (checkboxes in multi mode, radios otherwise), toggle/confirm functions, multi keys saved (`reconciledAnswerKeys`), per-row × delete and "+ เพิ่มตัวเลือก" (max 5) with re-lettering through the key span (React splits "ค" and ". ").
- `lib/source-answer-service.ts` / `lib/source-answer-client.ts`: one entry per circled key; same key twice and X/tick evidence still rejected; such questions open in multi mode.
- `components/SplitDocumentEditor.tsx`: click and keys 1–5 toggle in multi mode; bulk AI confirmation keeps all answers of a multi question; new rows get the caret.
- `lib/export-document.ts`: zero-width spaces never exported.
- `documents/conversion-review-guide.md`: user guide section.

## Verification
- `scripts/test-source-answers.cjs`: two circled keys accepted, duplicate key rejected, client marks ก and ง correct.
- `scripts/test-t126-answers-choices.cjs` on the real set-3 PDF replay: Q9 ก+ง from the original in multi mode with checkboxes (`q9-two-answers.png`); Q1 manual multi add/remove and back to single keeps the first; Q2 delete ข → ก ข ค re-lettered on screen, add → ง with typed text and its answer (`q1-q2-edited.png`); save, reload, resume keep both; DOCX has two starred Q9 choices and the new Q2 choice with "*".
- Existing radio-based E2E contracts unchanged; `node scripts/finish-task.mjs T-126` exit 0 on dev 127.0.0.1:3121 (`completion-gate.log`).
- Production 261017-1342 (`.next-production-t126`) on localhost:3000 replacing 261017-1214: badge, CSS ok; deployed test-t126-answers-choices, test-t125-cached-ocr, test-t124-stale-draft, test-t121-fidelity (25), test-workspace-controls exit 0.

## Boundaries
- The AI solver still proposes one answer per question; multi answers come from the original or the user.
- QuizFlow import of multi-answer questions is not verified (B-36).
