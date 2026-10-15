# T-094 compact OCR workspace layout verification

- วันที่: 2026-10-15 (Asia/Bangkok)
- Scope: ลดพื้นที่หัว conversion และ question navigation โดยคง source pane, editor, capture, keyboard navigation และ export contract เดิม

## ผลการตรวจ

- `npm run typecheck` — PASS
- `npm run lint -- --quiet` — PASS; 0 errors, 8 existing `<img>` warnings
- `npm test` — PASS หลังรันแบบอนุญาต loopback
- `npm run build` — PASS; build stamp `261015-1036` ก่อน completion gate และ `261015-1042` ใน completion gate
- `node scripts/test-e2e.cjs` ด้วย `E2E_PORT=3227` — PASS; browser checks 16/16
- `node scripts/check-knowledge-vault.mjs` — PASS
- `node scripts/check-knowledge-drift.mjs --require-git` — PASS
- `node scripts/finish-task.mjs T-094` โดยเปิด dev server ที่ `http://127.0.0.1:3228` และตั้ง `E2E_BASE_URL` — PASS; semantic, platform, drift, typecheck, lint, unit tests, E2E, build และ CSS delivery health ผ่าน

## หลักฐานพฤติกรรม

- `components/SplitDocumentEditor.tsx` มี `data-layout="compact-conversion-header"` และ `data-layout="compact-question-nav"`
- Browser test ตรวจพบ marker ทั้งสอง, แปลงเอกสารได้, ยังคง source-left/editor-right, นำทางครบ 80 ข้อ, ใช้ Enter/keyboard ได้, และไม่มี horizontal overflow ที่ viewport 390px
- Question navigation ถูก flatten เป็น flex strip ที่ห่ออัตโนมัติ ปุ่มยังมี `aria-label` และ `aria-current`

## ข้อจำกัด/บทเรียน

- Completion gate ครั้งแรกที่ปล่อยให้ reuse dev server port 3000 timeout ตอน upload เพราะ server เดิมไม่ใช่ instance ที่ตรวจชุดนี้ จึงเปิด server แยกที่ port 3228 และรันซ้ำจนผ่าน
- ยังมี lint warning `<img>` เดิม 8 รายการ ไม่มี error และไม่เกี่ยวกับ layout change
- การตรวจนี้ยืนยัน layout contract และ deterministic browser fixture ไม่ใช่การรับรองความแม่นยำ OCR/provider กับไฟล์ข้อสอบใหม่
