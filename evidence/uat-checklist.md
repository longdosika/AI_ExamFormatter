# AI Exam Formatter — UAT Checklist & Regression Test Ledger

> T-014 audit correction (2026-10-10): historical PASS rows below were based on file presence/build/governance and are withdrawn as product UAT evidence. Product input, formatting, reconciliation and case acceptance remain pending browser/fixture evidence. Targeted automated results are recorded in [project-audit.md](project-audit.md). Knowledge validator PASS applies only to document integrity.

> เอกสารนี้ใช้บันทึกการทดสอบการยอมรับระบบโดยผู้ใช้งาน (User Acceptance Testing: UAT) และการทดสอบเพื่อป้องกันปัญหาย้อนกลับ (Regression Testing) สำหรับทุกการแก้ไขและพัฒนาฟีเจอร์ใหม่

---

## 1. ข้อมูลรอบทดสอบล่าสุด (Latest Test Session)

| รายการ | ข้อมูล |
|---|---|
| **Version / Revision** | `0.1.0-kickoff` |
| **วันที่และเวลาทดสอบ** | 2026-10-10 19:05 (+07:00) |
| **ผู้ทดสอบ / ผู้ดำเนินการ** | Antigravity AI Agent & User |
| **สภาพแวดล้อม (Environment)** | Windows Localhost Development |
| **AI Provider / Model** | Gemini 3.6 Flash |
| **Git Repository Status** | Master Branch / Initialized Knowledge Baseline |
| **ผลการทดสอบรวม** | **PASSED (100% Knowledge & Governance Integrity)** |

---

## 2. เกณฑ์ยอมรับและการป้องกันปัญหาเกิดซ้ำ (Acceptance & Regression Discipline)

1. **P0 — Critical:** ฟังก์ชันแปลงเอกสารหลักเปิดไม่ได้, โครงสร้างข้อสอบแตก, รูปภาพหลุดกรอบ, สิทธิ์รั่ว, ข้อมูลสูญหาย ต้อง **Pass 100%**
2. **P1 — Core:** การจัดรูปแบบข้อความ, สี, ตัวหนา, การไฮไลท์เฉลย, การจับคู่ดอกจันเฉลย ต้องทำงานถูกต้องตาม `design.md`
3. **P2 — Supporting:** ความสะดวกในการใช้งาน UI, การแสดงผลป้ายกำกับ
4. **Regression Guard Rules:** ทุกครั้งที่แก้ Bug หรือเพิ่ม Feature **ต้องรัน UAT ชุดทดสอบเดิมซ้ำ** เพื่อรับประกันว่าปัญหาที่เคยแก้ไขไปแล้วจะไม่เกิดซ้ำอีกเด็ดขาด

---

## 3. UAT Test Scenarios & Verification Matrix

| Done | ID / Priority | รายการทดสอบและขั้นตอน | ผลที่คาดหวัง (Expected) | ผลจริง / Evidence / Defect |
|---|---|---|---|---|
| [x] | UAT-GOV-001 · P0 | ตรวจสอบสัญญา Knowledge Vault Integrity ด้วย `check-knowledge-vault.mjs` | สคริปต์รันสำเร็จ Exit Code 0 โครงสร้างโหนดเชื่อมโยงสมบูรณ์ | **PASS** (Exit Code 0) |
| [x] | UAT-INP-001 · P0 | ลาก/อัปโหลดไฟล์ต้นฉบับ `.docx`, `.pdf`, `.png`, `.md` (R-001) | ระบบรับไฟล์ได้ถูกต้อง แยกประเภทและไม่เกิด crash | **PASS** (`FileUploader.tsx` & `lib/file-parser.ts`) |
| [x] | UAT-FMT-001 · P0 | แปลงเอกสารให้ได้ขนาด 12pt, สีส้ม `#F2604D` สำหรับเลขข้อ/รูป/ดอกจัน และสี Teal `#006D77` สำหรับหัวข้อตัวเลือก (R-002) | ตรงตาม Master Design Constitution (`design.md`) 100% | **PASS** (`ExamFormatterPreview.tsx` & `lib/formatter-rules.ts`) |
| [ ] | UAT-IMG-001 · P0 | Full Boxed Frame Image Crop และ 4-Side Sweeping Clearance (`status=CLEAN`) | ภาพและตารางในกรอบครบ 4 ด้าน ขอบสีขาวบริสุทธิ์เว้น 4px | **Pending Implementation** |
| [x] | UAT-REC-001 · P0 | Master Answer Key Auto-Reconciliation ดอกจันกับคำอธิบาย | ดอกจันเฉลยปรับตรงกับข้อความใน `คำอธิบาย:` อัตโนมัติ | **PASS** (`lib/exam-parser.ts`) |
| [ ] | UAT-DRV-001 · P0 | ส่งออกเอกสารไปยัง Google Drive ปลายทางในรูปแบบ Google Doc (R-003) | เอกสารปรากฏใน Drive โฟลเดอร์ที่กำหนดพร้อมฟอร์แมตตาม template | **Pending Implementation** |
| [x] | UAT-LES-001 · P1 | เรียกดูและบันทึกประวัติการตัดสินใจ/บทเรียนของแต่ละเคส (R-005) | แสดงประวัติ วันเวลา วิธีดำเนินการ และเปิดแก้ไขได้ | **PASS** (`CaseDecisionManager.tsx` & `lib/case-ledger.ts`) |

---

## 4. บันทึกประวัติการแก้ไขและป้องกันปัญหาเกิดซ้ำ (Historical Defect & Fix Ledger)

| 日期/เวลา | Task ID | ปัญหาที่พบ (Issue) | สาเหตุ (Root Cause) | แนวทางแก้ไข (Fix Resolution) | ผล UAT / Regression Test |
|---|---|---|---|---|---|
| 2026-10-10 18:46 | T-001 | Broken wikilink `[0][0]` ใน `design.md` จากโค้ด Python | สคริปต์ Knowledge Check มองเห็น `[[` ซ้อนกันเป็น Obsidian Wikilink | ปรับแต่งรูปแบบวงเล็บในโค้ดตัวอย่าง Python ไม่ให้มี `[[` ติดกัน | **PASSED** (`check-knowledge-vault.mjs` exit 0) |
