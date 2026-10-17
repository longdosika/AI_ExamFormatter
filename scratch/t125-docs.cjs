const fs = require('fs');
function edit(file, fn) {
  let s = fs.readFileSync(file, 'utf8'); const crlf = s.includes('\r\n'); s = s.replace(/\r\n/g, '\n');
  const next = fn(s); if (next === s) throw new Error('no change ' + file);
  for (let i = 0; i < 5; i++) { try { fs.writeFileSync(file, crlf ? next.replace(/\n/g, '\r\n') : next); return; } catch { require('child_process').execSync('sleep 2'); } }
  throw new Error('write failed ' + file);
}
const must = (s, a) => { if (!s.includes(a)) throw new Error('missing ' + a.slice(0, 60)); return a; };
edit('documents/tasks.md', s => s.replace(must(s, '### T-124 '), () => `### T-125 Capture without OCR geometry when a draft exists, and capture rules
- Type: Bug / Documentation
- Status: In Progress
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Problem: Owner screenshots on 261017-1152 (fresh conversion, set 3): Q6 and Q21 stems list the table rows, Q6's crop includes its own stem line, Q21 is cut on the right. Fresh-profile live runs on 1152 (evidence/t121/t125-live1, t125-live2) were clean. Cause: the browser already had a draft for the file; app/page.tsx reused the draft's OCR text without its line geometry, so harvesting ran with no stem limits and no geometry-based duplicate removal. Owner also asks for written capture rules and a learning record on every fix.
- Acceptance Criteria: cached OCR text is reused only with its geometry; harvesting without geometry reads OCR geometry first and stores it with the draft; replaying the owner's situation gives the same crops and clean stems as a fresh profile; documents/capture-rules.md holds the rules, image-type catalogue, mandatory fix procedure and a learning log, linked from README, release_log and the release checklist.
- Affected Files: app/page.tsx, scripts/test-t125-cached-ocr.cjs, package.json, documents/capture-rules.md, documents/release-checklist.md, knowledge docs, release_log.md, README.md.
- Expected Verification: test-t125-cached-ocr fails on 261017-1152 and passes after the fix; finish-task; deployed regressions.

### T-124 `));
edit('release_log.md', s => {
  const first = s.match(/\n(\| I-0\d+ \|)/)[1];
  s = s.replace(first, () => `| I-051 | แปลงไฟล์เดิมซ้ำแล้วรูปข้อ 6 ติดบรรทัดโจทย์, ตารางข้อ 21 ตัดขวา, แถวตารางค้างในโจทย์ (เครื่องที่ใช้ใหม่ไม่เกิด) | 261017-1152 (ภาพเจ้าของ) | เมื่อมีแบบร่างของไฟล์เดิม ระบบใช้ข้อความ OCR เก่าที่ไม่มีตำแหน่งบรรทัด ทำให้การครอบรูปไม่มีขอบเขตและล้างข้อความซ้ำไม่ได้ | แก้แล้ว: ใช้ OCR เก่าเฉพาะเมื่อมีตำแหน่งบรรทัด; ถ้าสกัดรูปโดยไม่มีตำแหน่งให้อ่าน OCR ก่อนและบันทึกไว้; ร่างกฎ capture และบันทึกการเรียนรู้ที่ documents/capture-rules.md | T125_BUILD | ใช่: ตรงกับ I-030/I-031/I-039 แต่เกิดเฉพาะเครื่องที่มีแบบร่างเดิม |\n` + first);
  s = s.replace(must(s, '## ประวัติ build (ใหม่สุดอยู่บน)\n\n| Build | งาน | สิ่งที่เปลี่ยน | สถานะ |\n|---|---|---|---|\n'), m => m + '| **T125_BUILD** | T-125 | ครอบรูปทุกครั้งต้องมีตำแหน่งบรรทัด OCR (I-051), กฎ capture + บันทึกการเรียนรู้ | Verified -> Done เมื่อ gate และ deploy ผ่าน |\n');
  s = s.replace(must(s, 'รายละเอียดเต็มของแต่ละงานอยู่ใน [documents/tasks.md](documents/tasks.md)'), m => m + ' กฎการครอบรูปและบันทึกการเรียนรู้ทุกครั้งที่แก้อยู่ที่ [documents/capture-rules.md](documents/capture-rules.md)');
  return s;
});
edit('README.md', s => s.replace(must(s, '### อัปเดตล่าสุด 2026-10-17\n\n'), m => m + '**`T-125` / production build `T125_BUILD`** (localhost:3000): ถ้ามีแบบร่างของไฟล์เดิม ระบบจะไม่ใช้ข้อความ OCR เก่าที่ไม่มีตำแหน่งบรรทัดแล้ว และอ่านตำแหน่งก่อนสกัดรูปทุกครั้ง แก้รูปข้อ 6 ติดโจทย์ ตารางข้อ 21 ตัดขวา และแถวตารางค้าง กฎการครอบรูปและบันทึกการเรียนรู้อยู่ที่ [documents/capture-rules.md](documents/capture-rules.md)\n\n'));
edit('documents/00-index.md', s => s.replace(must(s, '## Latest Verified Work\n'), m => m + '- T-125, 2026-10-17: capture always uses OCR line geometry; [[capture-rules]] holds the capture rules, image-type catalogue, mandatory fix procedure and learning log (update on every capture fix).\n'));
edit('documents/release-checklist.md', s => s + '\n## Capture changes (T-125)\n- Any change to figure/table capture or duplicate-text cleanup follows the procedure in [[capture-rules]]: reproduce with real responses in a fresh profile and in a profile that already has a draft, add a failing replay test, inspect crops visually, and add a row to its learning log plus an I-xxx entry in release_log.md.\n');
edit('documents/decisions.md', s => s.replace(must(s, '# Decisions\n'), m => m + `
### D-073 Capture Requires OCR Geometry (T-125, 2026-10-17)
- Decision: OCR text saved with a draft is reused only together with its line geometry; harvesting without geometry first reads OCR geometry (Vision OCR, same ink-filter setting) and stores it with the draft. Capture rules live in documents/capture-rules.md and every capture fix adds a learning-log row.
- Why: geometry is what bounds crops by stem/choice lines and proves which stem lines duplicate a figure; reusing text alone silently produced over-crops and duplicated table text only on machines that already had a draft.
- Tradeoff: re-converting a file whose old draft lacks geometry costs one more OCR pass.
`));
edit('documents/memory.md', s => s.replace(must(s, '# Memory\n'), m => m + `
### T-125 Profile State Matters (2026-10-17)
Fresh Playwright profiles never hit the "existing draft" path; the owner's browser does. Reproduce capture complaints in both a fresh profile and one with a saved draft (scripts/test-t125-cached-ocr.cjs). Capture without OCR geometry is unbounded. Rules and learning log: documents/capture-rules.md (update on every capture fix).
`));
edit('documents/code-map.md', s => s.replace(must(s, '### T-124 Stale Draft Repair\n'), m => '### T-125 Capture Geometry Guarantee\n- `app/page.tsx`: cached draft OCR text reused only with ocrTextRegions; handleHarvestDiagrams reads OCR geometry first when missing and saves it with the draft. Rules: `documents/capture-rules.md`. Test `scripts/test-t125-cached-ocr.cjs` (in test:e2e).\n\n' + m));
edit('documents/traceability.md', s => s.replace(must(s, '### T-124 Stale Draft Repair\n'), m => '### T-125 Capture Geometry Guarantee\nBug on existing R-001/R-003 behaviour -> Task T-125 -> existing Feature Note r-001-browser -> app/page.tsx, documents/capture-rules.md -> scripts/test-t125-cached-ocr.cjs -> evidence/t125/.\n\n' + m));
edit('features/r-001-browser.md', s => s + '- T-125 (2026-10-17): figure capture always uses OCR line geometry (cached OCR text without geometry is not reused; geometry is read before harvesting); rules in documents/capture-rules.md; regression scripts/test-t125-cached-ocr.cjs.\n');
console.log('docs ok');
