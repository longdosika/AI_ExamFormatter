# T-099 verification — automatic Ollama readiness before local OCR

วันที่ตรวจ: 2026-10-15 (Asia/Bangkok)

## ผลลัพธ์

| รายการ | ผล | หลักฐาน |
|---|---|---|
| ตรวจ local `/api/tags` ก่อน OCR | PASS | `lib/ollama-runtime.ts`, `app/api/ocr/route.ts` |
| เปิด `ollama serve` แบบ detached/ซ่อนหน้าต่างเมื่อจำเป็น | PASS | `scripts/test-ollama-runtime.cjs` ตรวจ command `ollama serve`, `detached: true`, `windowsHide: true` |
| ใช้ startup เดียวเมื่อมีคำขอพร้อมกัน | PASS | runtime contract ยืนยัน concurrent calls เปิด process เพียง 1 ครั้ง |
| reuse daemon ที่ทำงานอยู่ | PASS | runtime contract และ live probe |
| provider ระยะไกลไม่เปิด Ollama | PASS | runtime contract ยืนยันไม่เรียก fetch/spawn |
| แจ้ง failure แบบ actionable | PASS | runtime contract ยืนยัน `OLLAMA_NOT_READY`; route map เป็น HTTP 503 |
| endpoint จริงของเครื่อง | PASS | `node` probe ได้ HTTP 200 จาก `http://127.0.0.1:11434/api/tags`; พบโมเดล local รวม Typhoon OCR |

## คำสั่งที่รันจริง

- `node scripts/test-ollama-runtime.cjs` — PASS
- `node scripts/test-ollama-runtime.cjs --live` — PASS; live probe คืน `ready: true`, `started: false` เพราะ daemon พร้อมอยู่แล้ว
- `npm test` — PASS (รวม Ollama runtime contract และ local vision loopback)
- `npm run typecheck` — PASS
- `npm run lint` — PASS, 0 errors และ 8 warnings เดิมเรื่อง `<img>`
- `E2E_BASE_URL=http://127.0.0.1:3000 node scripts/test-e2e.cjs` — PASS, browser scenarios ผ่านครบ 18 รายการ หลังรีสตาร์ท dev server เดียวของโปรเจกต์
- `node scripts/finish-task.mjs T-099` — PASS: semantic validator, platform readiness, git drift, typecheck, lint, full test suite, E2E, production build (`261015-1441`) และ CSS delivery health check

`--live` ยืนยัน readiness กับ executable/endpoint จริง แต่ไม่ได้หยุด daemon เพื่อบังคับ cold-start เพราะการหยุด service ของผู้ใช้ขณะใช้งานอาจรบกวนงานอื่น; cold-start path ถูกตรวจด้วย deterministic spawn mock ใน contract test

ระหว่างรอบแรกของ E2E พบ stale dev server ที่ส่ง HTML ก่อน hydrate ทำให้ import timeout; หยุดเฉพาะ process ของโปรเจกต์บนพอร์ต 3000 แล้วเปิดใหม่ ผล E2E ผ่านครบ และไม่พบ browser runtime error

## ขอบเขตและความเสี่ยง

- เครื่องต้องติดตั้ง Ollama และให้คำสั่ง `ollama` อยู่ใน PATH; ระบบไม่ติดตั้งโปรแกรมหรือดาวน์โหลดโมเดลอัตโนมัติ
- Vercel/serverless และ provider ระยะไกลจะไม่พยายามเปิด process local
- หากเปิด process ไม่ได้หรือ endpoint ไม่พร้อมภายในเวลาที่กำหนด API จะตอบ 503 และผู้ใช้แก้ด้วยการติดตั้ง/ตรวจ `ollama serve`
