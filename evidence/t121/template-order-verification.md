# T-121 Template Order Verification (Claude, 2026-10-17)

Owner request (screenshots of build 261017-0014): "ลำดับ รูปโจทย์ วางผิดตำแหน่ง จริงๆ ควรจะอยู่ก่อนตัวเลือก ตรวจสอบส่วนอื่นๆด้วย ยึดคัมภีร์สูงสุดในการแปลงข้อความ พร้อมลิสต์งานที่ต้องปรับแก้ส่วนอื่นที่เห็น ลง log เสมอเตรียมจ่ายงานให้คนอื่นทำ".
Reference: master template copy `evidence/t109-master-template.docx`. Per-question order: `N. stem -> รูปคำถาม: -> image -> ตัวเลือก: -> choices (no keys) -> คำอธิบาย:`; shared: `โจทย์ร่วม -> passage -> รูปโจทย์ร่วม: -> questions -> จบโจทย์ร่วม -> ◆`.

## Findings and fixes
| ID | Finding | Cause | Fix |
|---|---|---|---|
| I-037 | Figure after choices in editor and DOCX (Q6/8/10/20/21 of set 3, both 0014 and 0911) | `mergeHarvestedEditor` compared the choice list's parent with the question node, but the list sits one wrapper deeper, so the figure was appended | `orderItemSections` on harvest, draft restore (repairs saved drafts) and before export |
| I-039 | Table rows repeated in Q6/Q21 stems after capture on 0911 | B-18 (Claude) keeps rows on separate lines; DOM textContent has no `\n`, so the merge never matched | newline-free compare + `removeWholeLines` (no mid-word cut) |
| I-040 | Q8 stem ended with "D สี C สี B สี A สาร ก" | OCR reads chromatogram labels as text | `stripTrailingFigureLabels`: short OCR lines inside the figure box (2% margin), stem tail only; on four real runs it removes only Q8 labels |
| I-041 | Set 1 Q16 (image-only choices) exported without choices; a first fix duplicated "ตัวเลือก:" | merge only filled existing rows | `createChoiceRow` reuses the existing empty choices section |
| I-038 | Tests missed the above | fidelity test only checked one-line table text | fidelity: template order per block, no table rows, Q8 tail, Q16 four images and one label; `scripts/test-t121-order-dom.cjs` in test:e2e; source-mark replay checks figure-before-choices on screen |

## Verification
- `node scripts/finish-task.mjs T-121` exit 0 on dev 127.0.0.1:3121, 37 PASS, CSS ok: `order-completion-gate.log`.
- Production 261017-0949 (`.next-production-t121-order`) on localhost:3000: badge 261017-0949, CSS ok; deployed `test-t121-fidelity.cjs` (set 3, 25) and with `T121_SOURCE80=1` (set 1, 80) exit 0; `test-t121-controls.cjs` and `test-t121-source-marks-ui.cjs` exit 0 (5 figure questions with figure before choices).
- Screens: `audit-answers-fixed/template-order-q6.png`, `template-order-q8.png`.
- `scripts/audit-docx-template.cjs`: set 1 DOCX no findings; set 3 only numbered stem lines (H-01).
- Wider check without image capture: set 2 clean; sets 4/5 findings in release_log "งานรอจ่าย (Handoff)" H-01..H-12 and task T-123.

## Not done
- Handoff items H-01..H-12 (T-123 Proposed). B-32 under D-068, B-36 blocked on the QuizFlow database.
- No new live Google export in this pass (browser pane not signed in).
