### T-126 Multiple correct answers and add/edit/delete choices
- Type: Feature
- Status: In Progress
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Problem: Owner screenshots on 261017-1214 (set 3): Q9's original circles both ก and ง, but a question can hold only one answer (radio buttons, single source-answer key). Owner: "ปรับให้รองรับการเฉลยข้อถูกมากกว่า 1 ข้อ" and "ปรับให้แก้ไข เพิ่ม/ลบ ตัวเลือกได้" (Q15 shows a merged choice the user may need to fix by hand). The master template marks several correct choices with "*" (template Q3 "2 *", "3 *"; Q4 two answers), so multiple answers are template-conformant.
- Acceptance Criteria: a per-question "หลายคำตอบ" mode turns answer controls into checkboxes and toggles keys (mouse and keys 1-5), single mode keeps today's radio behaviour; source vision may return several circled keys for one question (X/tick still rejected) and such questions open in multi mode; saved drafts, statistics and DOCX/Google export mark every correct choice with "*"; each choice row has a delete control and each question an "เพิ่มตัวเลือก" control (max five, ก-จ), keys re-letter in order, answers follow their rows, and edits survive save/reload and export.
- Affected Files: lib/formatter-rules.ts, lib/answer-editor.ts, lib/source-answer-service.ts, lib/source-answer-client.ts, components/SplitDocumentEditor.tsx, app/globals.css, scripts/test-t126-answers-choices.cjs (new), scripts/test-source-answers.cjs, knowledge docs, release_log.md.
- Expected Verification: unit tests for multi source answers; browser test on the real set-3 PDF replay (Q9 ก+ง, add/delete/re-letter, save/reload, DOCX stars); existing E2E (radio contracts) unchanged; finish-task; deployed check.

