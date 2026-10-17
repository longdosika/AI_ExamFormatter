const fs = require('fs');
function edit(file, pairs, all) {
  let s = fs.readFileSync(file, 'utf8'); const crlf = s.includes('\r\n'); s = s.replace(/\r\n/g, '\n');
  for (const [from, to] of pairs) { if (!s.includes(from)) throw new Error(`${file}: missing ${from.slice(0, 70)}`); s = all ? s.split(from).join(to) : s.replace(from, () => to); }
  fs.writeFileSync(file, crlf ? s.replace(/\n/g, '\r\n') : s);
}
edit('release_log.md', [['BUILD_PENDING', '261017-0911']], true);
edit('release_log.md', [[/\| Build ที่ใช้งานอยู่ \(localhost:3000\) \|[^\n]*/.exec(fs.readFileSync('release_log.md', 'utf8').replace(/\r\n/g, '\n'))[0], '| Build ที่ใช้งานอยู่ (localhost:3000) | **`261017-0911`**, `.next-production-t121-audit`; badge ตรง source, CSS200, deployed fidelity/controls/source-mark replay ผ่าน |']]);
edit('documents/tasks.md', [['B-32 remains under D-068, B-36 remains blocked on the QuizFlow database.', 'Completion gate `finish-task T-121` exit0 on dev 127.0.0.1:3121 (37 PASS, CSS ok; evidence/t121/audit-completion-gate.log). Deployed production 261017-0911 (.next-production-t121-audit) on localhost:3000 replacing 261017-0014 PID17800: HTTP200, badge 261017-0911, CSS ok, deployed test-t121-fidelity/test-t121-controls/test-t121-source-marks-ui exit0. B-32 remains under D-068, B-36 remains blocked on the QuizFlow database.']]);
edit('documents/memory.md', [['### T-121 Audit Lessons (2026-10-17)\n', '### T-121 Audit Lessons (2026-10-17)\nRuntime: localhost:3000 serves 261017-0911 from .next-production-t121-audit (replaced 261017-0014). Restart: NEXT_DIST_DIR=.next-production-t121-audit npm run start -- -p 3000 -H 127.0.0.1.\n']]);
edit('README.md', [['### อัปเดตล่าสุด 2026-10-16\n', '### อัปเดตล่าสุด 2026-10-17\n\n**`T-121` ตรวจทาน / production build `261017-0911`** (localhost:3000): ตรวจงานที่ปิดไว้ซ้ำด้วย PDF จริงชุด3 แล้วแก้ I-033 รูปกราฟข้อ10ตัดขวา, I-034 เฉลยต้นฉบับได้0เพราะลำดับ key/model (ตอนนี้อ่านวงได้11ข้อ และไม่นับกากบาท), I-035 กรอบสเกล0..1 ทำตารางข้อ6หาย, I-036 เลขข้อย่อยติดบรรทัดเดียว และ B-18 ตารางที่ capture ไม่ได้เก็บเป็นแถวละบรรทัด ผ่าน `finish-task T-121` และ deployed regressions; B-32 (commit) รอเจ้าของตาม D-068, B-36 (QuizFlow import) ติดฐานข้อมูล QuizFlow ดู [release_log.md](release_log.md)\n']]);
console.log('final docs updated');
