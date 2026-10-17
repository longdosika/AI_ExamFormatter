const fs = require('fs');
function edit(file, fn) {
  let s = fs.readFileSync(file, 'utf8'); const crlf = s.includes('\r\n'); s = s.replace(/\r\n/g, '\n');
  const next = fn(s); if (next === s) throw new Error('no change ' + file);
  for (let i = 0; i < 5; i++) { try { fs.writeFileSync(file, crlf ? next.replace(/\n/g, '\r\n') : next); return; } catch { require('child_process').execSync('sleep 2'); } }
  throw new Error('write failed ' + file);
}
const must = (s, a) => { if (!s.includes(a)) throw new Error('missing ' + a.slice(0, 60)); return a; };
edit('release_log.md', s => {
  s = s.replace(must(s, '## ประวัติ build (ใหม่สุดอยู่บน)\n\n| Build | งาน | สิ่งที่เปลี่ยน | สถานะ |\n|---|---|---|---|\n'), m => m + '| **T126_BUILD** | T-126 | เฉลยได้หลายข้อ (ปุ่ม "ตอบได้หลายข้อ", อ่านวงหลายวงจากต้นฉบับ, ส่งออก * ทุกข้อ) และเพิ่ม/ลบ/แก้ตัวเลือก พร้อมเรียงอักษรใหม่ | Verified -> Done เมื่อ gate และ deploy ผ่าน |\n');
  const first = s.match(/\n(\| I-0\d+ \|)/)[1];
  s = s.replace(first, () => '| I-052 | ข้อที่ต้นฉบับวงคำตอบไว้ 2 ตัวเลือก (ชุด 3 ข้อ 9 วง ก และ ง) เลือกเฉลยได้ข้อเดียว และเพิ่ม/ลบตัวเลือกไม่ได้ | 261017-1214 (ภาพเจ้าของ) | ระบบออกแบบเฉลยเป็นค่าเดียว (radio), ตัวอ่านเฉลยต้นฉบับถือว่าวงหลายวงคือคลุมเครือ และไม่มีปุ่มจัดการตัวเลือก | แก้แล้ว (ฟีเจอร์ใหม่ T-126): โหมด "ตอบได้หลายข้อ", อ่านวงหลายวงเป็นเฉลยหลายข้อ (กากบาท/ติ๊กยังไม่นับ), ปุ่มเพิ่ม/ลบตัวเลือกพร้อมเรียงอักษรใหม่ ส่งออก * ทุกข้อตามแม่แบบหลัก | T126_BUILD | ไม่ (แม่แบบหลักข้อ 3/4 มีเฉลย 2 ข้ออยู่แล้ว) |\n' + first);
  return s;
});
edit('documents/decisions.md', s => s.replace(must(s, '# Decisions\n'), m => m + `
### D-074 Multiple Correct Answers and Editable Choices (T-126, 2026-10-17)
- Decision: a question has one answer by default (radio buttons, unchanged contracts); "ตอบได้หลายข้อ" switches it to checkboxes and toggles keys. Source vision returns one entry per clearly circled key, so several circles mean several correct answers (X/tick and the same key twice still rejected); such questions open in multi mode. Each choice row has a delete control and each question an add control (max five, ก-จ); keys re-letter in row order and answers stay on their rows. Export stars every correct choice.
- Why: owner screenshot (Q9 circles ก and ง) and the master template, which marks several correct choices with "*" (template Q3/Q4).
- Tradeoff: confirming AI answers in multi mode confirms all of them; switching back to single mode keeps only the first.
`));
edit('documents/memory.md', s => s.replace(must(s, '# Memory\n'), m => m + `
### T-126 Answers and Choices (2026-10-17)
React renders a choice key as two text nodes ("ค" + ". "); relabel through the key span (choiceKeySpan), never by matching one text node. Single-answer radio contracts in older E2E tests stay valid; multi mode is opt-in per question or automatic when the original circles several keys. Test: scripts/test-t126-answers-choices.cjs.
`));
edit('documents/code-map.md', s => s.replace(must(s, '### T-125 Capture Geometry Guarantee\n'), m => '### T-126 Answers and Choices\n- `lib/answer-editor.ts`: multi toggle, toggleManualAnswer, setMultiAnswer, confirmCurrentAnswers, relabelChoices, choiceKeySpan, deleteChoice, add/delete controls in decorateAnswerEditor, multi keys in answerItemsFromEditor. `lib/source-answer-service.ts`/`source-answer-client.ts`: several circled keys per question. `lib/harvest-editor.ts` createChoiceRow (exported, key span aware). `components/SplitDocumentEditor.tsx` handleAnswerClick/keys 1-5. `lib/formatter-rules.ts` reconciledAnswerKeys. Test `scripts/test-t126-answers-choices.cjs`.\n\n' + m));
edit('documents/traceability.md', s => s.replace(must(s, '### T-125 Capture Geometry Guarantee\n'), m => '### T-126 Answers and Choices\nFeature on R-002 answer handling -> Task T-126 -> Feature Note r-002-feature -> lib/answer-editor.ts, lib/source-answer-service.ts, lib/source-answer-client.ts, lib/harvest-editor.ts, components/SplitDocumentEditor.tsx -> scripts/test-t126-answers-choices.cjs, scripts/test-source-answers.cjs -> evidence/t126/.\n\n' + m));
edit('features/r-002-feature.md', s => s + '\n- T-126 (2026-10-17): multiple correct answers per question ("ตอบได้หลายข้อ", several circled keys from the original, every correct choice starred in export) and add/delete choices with automatic re-lettering; regression scripts/test-t126-answers-choices.cjs.\n');
edit('documents/conversion-review-guide.md', s => s + '\n## เฉลยหลายข้อและการแก้ตัวเลือก (T-126)\n- ข้อที่ต้นฉบับวงไว้หลายตัวเลือกจะเปิดโหมด "ตอบได้หลายข้อ" ให้อัตโนมัติ ถ้าต้องการเอง ให้กดปุ่ม "ตอบได้หลายข้อ" ใต้ข้อนั้น แล้วคลิกเพิ่มหรือเอาเฉลยออกทีละตัวเลือก (กดเลข 1–5 ก็ได้) ถ้ากดปิดโหมด ระบบเก็บเฉลยตัวแรกไว้ตัวเดียว\n- ชี้ที่ตัวเลือกแล้วกด × เพื่อลบ ตัวเลือกที่เหลือจะเรียงอักษรใหม่ ปุ่ม "+ เพิ่มตัวเลือก" เพิ่มแถวท้ายข้อ (สูงสุด 5 ตัวเลือก ก–จ) แล้วพิมพ์ข้อความได้ทันที ข้อความตัวเลือกแก้ได้โดยคลิกพิมพ์ตรง ๆ\n');
console.log('docs ok');
