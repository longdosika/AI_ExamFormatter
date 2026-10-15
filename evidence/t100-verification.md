# T-100 Verification — Review/export media preservation

วันที่ตรวจ: 2026-10-15 (Asia/Bangkok)
Task: T-100

## ปัญหาและสาเหตุ

กดตรวจสอบฉบับแก้ไขแล้ว editor ถูก parse จากข้อความล้วนและ `setFormattedItems` ทำให้ React render ใหม่ รูปตัวเลือก/รูปโจทย์ร่วม/รูปคำอธิบายที่ไม่ได้อยู่ในข้อความจึงหาย และป้าย managed เช่น `รูปโจทย์:` อาจกลายเป็นข้อความโจทย์หรือซ้ำกัน

## การแก้ไขที่ตรวจจริง

- `app/page.tsx` ตรวจ DOM จริงโดย normalize ป้ายใน place แล้วใช้ clone ที่ตัด managed media/labels เฉพาะสำหรับ validation
- ไม่ replace live editor ด้วย parser result หลัง review
- draft เก็บ structured model เดิมคู่กับ `editorHtml` เพื่อรักษา media metadata และ manual edits
- browser regression ตรวจรูป 4 บทบาทก่อน/หลัง click และตรวจป้ายแต่ละชนิดเหลืออย่างละหนึ่ง
- Google export regression ตรวจ DOCX มี `word/media/*` ครบ 4 รูป

## หลักฐานและผลลัพธ์

| Check | Command/artifact | Result |
|---|---|---|
| Live review DOM | `E2E_BASE_URL=http://127.0.0.1:3000 node scripts/test-e2e.cjs` / `evidence/qa-iteration-2/results.json` | PASS; 19 checks, no browser errors |
| Image roles + labels | same E2E check `Review preserves question/shared/choice/explanation images and managed labels` | PASS |
| DOCX media embedding | `node scripts/test-google.cjs` | PASS; 4 media files |
| Type safety | `npm run typecheck` | PASS |
| Lint | `npm run lint` | PASS; 0 errors, 8 existing `<img>` warnings |
| Full regression | `npm test` | PASS; all parser/OCR/diagram/draft/export contracts green |
| Completion gate | `node scripts/finish-task.mjs T-100` | PASS; final gate recorded below |

## ขอบเขตและความเสี่ยง

หลักฐานนี้รับรองโครงสร้าง DOM, การคงรูป และการฝังรูปใน export สำหรับบทบาทที่ทดสอบ ไม่ใช่ใบรับรองความถูกต้อง OCR/เฉลยของเอกสารทุกชนิด การส่ง Google Drive จริงยังขึ้นกับ OAuth/credential และต้องตรวจ source-vs-output กับไฟล์จริงอีกครั้ง

## Completion gate

`node scripts/finish-task.mjs T-100` ผ่านเมื่อ 2026-10-15 หลังรัน semantic validator, platform readiness, git drift, typecheck, lint, full npm test, browser E2E, isolated production build และ CSS delivery health check (รอบสุดท้ายหลังเพิ่ม regression duplicate-label).
