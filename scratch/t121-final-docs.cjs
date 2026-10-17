const fs = require('fs');
function edit(file, pairs, all) {
  let s = fs.readFileSync(file, 'utf8'); const crlf = s.includes('\r\n'); s = s.replace(/\r\n/g, '\n');
  for (const [from, to] of pairs) {
    if (from instanceof RegExp) { if (!from.test(s)) throw new Error(`${file}: missing ${from}`); s = s.replace(from, () => to); continue; }
    if (!s.includes(from)) throw new Error(`${file}: missing ${from.slice(0, 70)}`);
    s = all ? s.split(from).join(to) : s.replace(from, () => to);
  }
  fs.writeFileSync(file, crlf ? s.replace(/\n/g, '\r\n') : s);
}
edit('release_log.md', [['BUILD2_PENDING', '261017-0949']], true);
edit('release_log.md', [
  [/\| Build ที่ใช้งานอยู่ \(localhost:3000\) \|[^\n]*/, '| Build ที่ใช้งานอยู่ (localhost:3000) | **`261017-0949`**, `.next-production-t121-order`; badge ตรง source, CSS200, deployed fidelity 25/80, controls, source-mark และ template-order ผ่าน |'],
  ['| ตรวจทานล่าสุด (Claude, 17ต.ค.2026 เช้า) |', '| แก้ล่าสุด (Claude, 17ต.ค.2026 09:49) | ลำดับตามแม่แบบหลัก: รูปคำถามก่อนตัวเลือก (I-037), ข้อความตารางไม่ซ้ำหลังจับรูป (I-039 regression ของ 0911), ป้ายในรูปไม่ติดท้ายโจทย์ (I-040), ตัวเลือกที่เป็นรูปล้วนไม่หาย (I-041); งานที่เหลือจ่ายต่อใน "งานรอจ่าย (Handoff)" H-01 ถึง H-12 / T-123 |\n| ตรวจทานล่าสุด (Claude, 17ต.ค.2026 เช้า) |'],
  ['## ประวัติ build (ใหม่สุดอยู่บน)\n\n| Build | งาน | สิ่งที่เปลี่ยน | สถานะ |\n|---|---|---|---|\n', '## ประวัติ build (ใหม่สุดอยู่บน)\n\n| Build | งาน | สิ่งที่เปลี่ยน | สถานะ |\n|---|---|---|---|\n| **261017-0949** | T-121 (ลำดับแม่แบบ) | แก้ I-037 ถึง I-041; ตรวจชุด 1–3 ไม่พบปัญหาโครงสร้าง ยกเว้น H-01; ชุด 4/5 จ่ายเป็น T-123 | In Progress (B-32/B-36 รอเจ้าของ); ใช้งานบน 3000 |\n'],
  ['In Progress (B-32/B-36 รอเจ้าของ); ใช้งานบน3000 |', 'In Progress; ถูกแทนที่ด้วย 261017-0949 |'],
]);
edit('documents/tasks.md', [['Sets 4/5 findings handed off as T-123 (release_log H-01..H-11).', 'Sets 4/5 findings handed off as T-123 (release_log H-01..H-11). Verification: finish-task T-121 exit0 on dev 127.0.0.1:3121 (37 PASS, CSS ok, evidence/t121/order-completion-gate.log); production 261017-0949 (.next-production-t121-order) on localhost:3000 replacing 261017-0911: badge 261017-0949, CSS ok, deployed test-t121-fidelity 25 and 80 (T121_SOURCE80=1 with set 1 PDF), test-t121-controls, test-t121-source-marks-ui (5 figure questions with figure before choices) exit0; scripts/audit-docx-template.cjs: set 1 no findings, set 3 only H-01.']]);
edit('documents/memory.md', [['Runtime: localhost:3000 serves 261017-0911 from .next-production-t121-audit (replaced 261017-0014). Restart: NEXT_DIST_DIR=.next-production-t121-audit npm run start -- -p 3000 -H 127.0.0.1.', 'Runtime: localhost:3000 serves 261017-0949 from .next-production-t121-order (replaced 261017-0911). Restart: NEXT_DIST_DIR=.next-production-t121-order npm run start -- -p 3000 -H 127.0.0.1.']]);
edit('README.md', [['### อัปเดตล่าสุด 2026-10-17\n\n', '### อัปเดตล่าสุด 2026-10-17\n\n**`T-121` ลำดับตามแม่แบบหลัก / production build `261017-0949`** (localhost:3000): "รูปโจทย์" อยู่ก่อนตัวเลือกแล้วทั้งในจอแก้ไขและ DOCX (แบบร่างเก่าถูกจัดใหม่ตอนเปิด/ส่งออก), แก้ข้อความตารางซ้ำหลังจับรูปที่ build 0911 ทำพัง, ตัดป้ายในรูปที่ติดท้ายโจทย์ (ข้อ8) และตัวเลือกที่เป็นรูปล้วนไม่หาย (ชุด1 ข้อ16) งานที่เหลือพร้อมหลักฐานและเกณฑ์ผ่านอยู่ที่ [release_log.md](release_log.md) หัวข้อ "งานรอจ่าย (Handoff)" / `T-123`\n\n']]);
console.log('final docs updated');
