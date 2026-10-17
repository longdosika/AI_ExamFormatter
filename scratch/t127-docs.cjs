const fs = require('fs');
function edit(file, fn) {
  let s = fs.readFileSync(file, 'utf8'); const crlf = s.includes('\r\n'); s = s.replace(/\r\n/g, '\n');
  const next = fn(s); if (next === s) throw new Error('no change ' + file);
  for (let i = 0; i < 5; i++) { try { fs.writeFileSync(file, crlf ? next.replace(/\n/g, '\r\n') : next); return; } catch { require('child_process').execSync('sleep 2'); } }
  throw new Error('write failed ' + file);
}
const must = (s, a) => { if (!s.includes(a)) throw new Error('missing ' + a.slice(0, 60)); return a; };
edit('documents/tasks.md', s => s.replace(must(s, '### T-126 '), () => `### T-127 User-marked answer on an added choice loses its star
- Type: Bug
- Status: In Progress
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Problem: Owner screenshot on 261017-1342 (set 3 Q15): a choice the user created and marked as the answer shows "เฉลยโดยผู้ใช้" but no "*" and is not saved/exported as correct. Reproduced (scripts/test-t127-answer-star.cjs): add a choice, select it, then click its text and type. The managed star span was editable, the click put the caret in or after it, the first character landed there, and the "typed star" rule (clear the answer when no row ends with "*") removed the answer and lost the character. Also "แยกตัวเลือก" wrote the split text into the bold key span and dropped the visible key, because React renders the key as two text nodes and the template-string regex had lost its backslashes.
- Acceptance Criteria: the star span is not editable (new and saved drafts); text typed after it moves into the choice text; a typed "*" only adds an answer and never clears one (clearing uses "ล้างเฉลย"); split rows show their key and put text in the text span; the answer survives save/reload and is starred in DOCX.
- Affected Files: components/SplitDocumentEditor.tsx, lib/answer-editor.ts, scripts/test-t127-answer-star.cjs, package.json, knowledge docs, release_log.md.
- Expected Verification: test-t127-answer-star fails on 261017-1342 and passes after the fix; T-126 test; finish-task; deployed check.

### T-126 `));
edit('release_log.md', s => {
  s = s.replace(must(s, '## ประวัติ build (ใหม่สุดอยู่บน)\n\n| Build | งาน | สิ่งที่เปลี่ยน | สถานะ |\n|---|---|---|---|\n'), m => m + '| **T127_BUILD** | T-127 | เครื่องหมาย * ของเฉลยที่ผู้ใช้เลือกไม่หายเมื่อพิมพ์ข้อความตามหลัง, "แยกตัวเลือก" แสดงอักษร ง และข้อความไม่ไปอยู่ในช่องอักษร | Verified -> Done เมื่อ gate และ deploy ผ่าน |\n');
  const first = s.match(/\n(\| I-0\d+ \|)/)[1];
  s = s.replace(first, () => '| I-054 | กด "แยกตัวเลือก" แล้วตัวเลือกใหม่ไม่มีอักษร ง และข้อความไปอยู่ในช่องอักษรตัวหนา | 261017-1342 (พบระหว่างทำ T-127) | React แยกอักษรเป็น 2 ส่วน ("ค" กับ ". ") และ regex ใน template string เสียเครื่องหมาย \\ จึงหาอักษรไม่เจอ | แก้แล้ว: ใช้ช่องอักษรทั้งช่อง (choiceKeySpan) ใส่ข้อความในช่องข้อความ | T127_BUILD | ใช่: เรื่องเดียวกับบั๊กเรียงอักษรใน T-126 |\n| I-053 | ตัวเลือกที่ผู้ใช้เพิ่มแล้วเลือกเป็นเฉลย ขึ้น "เฉลยโดยผู้ใช้" แต่ไม่มี * และไม่ถูกบันทึกหรือส่งออกเป็นข้อถูก | 261017-1342 (ภาพเจ้าของ ข้อ 15) | ช่อง * แก้ไขได้ พอคลิกท้ายแถวแล้วพิมพ์ ตัวอักษรแรกไปอยู่ในหรือหลังช่อง * กฎ "ไม่มี * ที่พิมพ์ = ล้างเฉลย" จึงล้างเฉลยและตัวอักษรหาย | แก้แล้ว: ช่อง * แก้ไม่ได้, ข้อความที่พิมพ์หลัง * ย้ายเข้าข้อความตัวเลือก, การพิมพ์ * ใช้เพิ่มเฉลยเท่านั้น (ล้างด้วย "ล้างเฉลย") | T127_BUILD | ใช่: เกี่ยวกับ I-012 (เครื่องหมายเฉลยซ้ำ/หาย) |\n' + first);
  return s;
});
edit('documents/memory.md', s => s.replace(must(s, '# Memory\n'), m => m + `
### T-127 Managed Marks Must Not Be Editable (2026-10-17)
Any managed decoration inside the contentEditable editor (answer star, badges) must be contentEditable=false, otherwise clicks at the end of a line type into it and rules that read text ("typed *") misfire. Test user sequences in the order people actually use (select first, type after), not only the convenient order. Do not build regexes from template strings with "\\s" (it becomes "s").
`));
edit('documents/code-map.md', s => s.replace(must(s, '### T-126 Answers and Choices\n'), m => '### T-127 Answer Star Integrity\n- `components/SplitDocumentEditor.tsx` handleEditorInput (moves text typed after the star into the choice text; typed "*" only adds), insertChoiceAfter (key span aware), non-editable star span; `lib/answer-editor.ts` star contentEditable=false for saved drafts. Test `scripts/test-t127-answer-star.cjs`.\n\n' + m));
edit('documents/traceability.md', s => s.replace(must(s, '### T-126 Answers and Choices\n'), m => '### T-127 Answer Star Integrity\nBug on T-126 feature (R-002) -> Task T-127 -> Feature Note r-002-feature -> components/SplitDocumentEditor.tsx, lib/answer-editor.ts -> scripts/test-t127-answer-star.cjs -> evidence/t127/.\n\n' + m));
edit('features/r-002-feature.md', s => s + '- T-127 (2026-10-17): the answer star is not editable, text typed after it joins the choice text, and a typed "*" only adds an answer; split rows keep their key. Regression scripts/test-t127-answer-star.cjs.\n');
console.log('docs ok');
