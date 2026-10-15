# AI Exam Formatter — AI Butler Dashboard

> 🛎️ **Executive Dashboard & Project Gateway:** เอกสารนี้ทำหน้าที่เป็นศูนย์รวมข้อมูลและสวิตช์บอร์ดประจำโปรเจกต์ นำเสนอสรุปสถานะสั้นกระชับ อ่านง่าย และเชื่อมโยงไปยังเอกสารเฉพาะทางใน Project Knowledge Vault เพื่อไม่ให้ไฟล์นี้ใหญ่เกินไป

### แผนผังความสามารถระบบฉบับภาษาไทย

ดูรายละเอียดความสามารถตามกลุ่มการใช้งาน กรณี capture รูป/ตาราง เงื่อนไข OCR การอ่านเฉลย และทะเบียนข้อจำกัดที่ต้องตรวจจากไฟล์จริงได้ที่ [documents/feature-catalog.md](documents/feature-catalog.md) งานทะเบียนและการปิดหลักฐานอยู่ใน `T-091`.

---

## 1. 📊 สรุปสถานะโปรเจกต์ (Executive Summary)

* **เป้าหมายโปรเจกต์:** พัฒนา Web Application สำหรับแปลงไฟล์ข้อสอบหลายรูปแบบให้ถูกจัดสัดส่วน สี รูปแบบ และส่งออกเป็น Google Doc เข้า Google Drive ตามแม่แบบมาตรฐาน
* **งานปิดแล้ว:** `T-014` audit/ทะเบียนงาน, `T-015` parser regression, `T-016` workspace/persistence, `T-020` ตรวจ build; finish-task exit 0 ด้วยสิทธิ์ไฟล์/เครือข่ายปกติ ([หลักฐาน](evidence/completion-gate.txt))
* **งานเปิด:** `T-017` Google export/OAuth, `T-018` OCR/input/image mapping, `T-019` browser UAT/shared cases และ `T-003` end-to-end acceptance
* **งานแก้ไขเร่งด่วน:** `T-031` กำหนดสัญญา OCR แบบมีหน้า/ข้อ/ข้อย่อย/ตัวเลือก เพื่อให้ PDF สแกนแปลงตรงต้นฉบับและฝั่งซ้าย-ขวาตรวจสอบย้อนกลับได้
* **สัญญาการออกแบบ (Master Design Constitution):** [documents/design.md](file:///d:/0-Project/92-AiAccess/AI_ExamFormatter/documents/design.md) (ยึดถือแม่แบบ [Official QuizFlow Template](https://docs.google.com/document/d/1uA8A1Q1lXCDIGRPtgBA0H77xYoMWCoo7thp5Hi0nvBQ/edit?tab=t.0))
* **สถานะ UAT:** ยังไม่ยืนยันครบเส้นทาง; `check-knowledge-vault.mjs` ตรวจเอกสารเท่านั้น ไม่ใช่การรับรองพฤติกรรมผลิตภัณฑ์
* **ผลตรวจล่าสุด 2026-10-11:** PDF การแยกสารฉบับที่ตรวจเทียบต้นฉบับแล้วนำเข้าได้ 25 ข้อ / 100 ตัวเลือก / รูปจริง 5 กลุ่ม ผ่านการผูกหน้าต้นฉบับและส่งออก snapshot เป็น Google Docs ผ่าน connector ดู `evidence/t042-real-pdf-result.json` และ `evidence/t041-gdoc-readback.json` ระบบแสดงว่าใช้ฉบับตรวจแก้เดิมและจับคู่ด้วย SHA-256 เท่านั้น ไฟล์ใหม่ยังต้องตรวจ OCR; การส่งออกด้วย OAuth ภายในแอปยังมี UAT แยกต่างหาก
* **Drive ปลายทาง:** [AI_ExamFormatter](https://drive.google.com/drive/folders/1bZeNZ7De9pxsoQH-Zo9ni3A3Rd6XmnuG) ตรวจ metadata ผ่าน connector แล้ว; เว็บแอปตั้งค่า OAuth ใน local แล้ว; การยืนยัน consent/Picker/export จริงภายในแอปยังอยู่ T-017
* **กฎตรวจประจำสัปดาห์:** [Weekly_Audit.md](Weekly_Audit.md) — ตรวจทุกวันจันทร์ 09:00 (+07:00) ครอบคลุม ownership, portability, parser fidelity, learning loop, UI/UX, performance, security, integration และ release evidence

### ปัญหา งานค้าง และผู้รับผิดชอบ

| Task | ปัญหา / งานค้าง | ผู้รับผิดชอบ | เกณฑ์ปิด |
|---|---|---|---|
| T-014 · Done | แก้รายงานสถานะและจ่ายงาน | Codex หลัก + audit_code | เอกสารตรงผลตรวจแล้ว |
| T-015 · Done | เลิกสร้างโจทย์/เฉลยแทนต้นฉบับ แก้การอ่านและ import failures | parser_fix | regression tests + build + finish gate ผ่าน |
| T-016 · Done | เก็บเคสในเบราว์เซอร์ แก้ข้อความ export/crop failure | workspace_fix | persistence tests + typecheck/build ผ่าน; UAT แยก T-019 |
| T-020 · Done | ตั้ง alias root และยืนยัน build ปกติ | Codex หลัก | ข้อจำกัด sandbox บันทึกแล้ว |
| T-017 · P0 | Google Docs/Drive export มี implementation; live OAuth UAT ยังไม่ครบ | Integration engineer; เจ้าของโครงการดูแล OAuth | Google Doc จริงในโฟลเดอร์และเทียบ template |
| T-018 · P1 | OCR/AI, input support, image mapping | Import engineer; เจ้าของโครงการเลือก provider | fixtures ครบรวม scanned PDF/image |
| T-019 · P1 | Editor/crop/scroll/เคสมี browser evidence; ข้ามอุปกรณ์ยังต้องตรวจเพิ่ม | UI engineer + QA | browser UAT พร้อม artifact |
| T-003 | ตรวจผลลัพธ์ครบเส้นทาง | QA + เจ้าของโครงการ | import → edit → export → ตรวจปลายทาง |

รายละเอียดและผลตรวจ: [Project audit](evidence/project-audit.md) · [ทะเบียนงาน](documents/tasks.md)

ข้อจำกัดปัจจุบัน: Git ไม่มี baseline commit; ESLint มี 8 image warnings; browser UAT ของ fixture ตรวจแก้ผ่านแล้ว แต่ยังไม่รับรองความแม่นยำ OCR ของเอกสารใหม่ทุกประเภทหรือการส่งออกด้วย OAuth ภายในแอป

---

## 2. 🗂️ การแบ่งหน้าที่เอกสาร (Knowledge Vault Matrix)

เอกสารแต่ละส่วนถูกแบ่งหน้าที่อย่างชัดเจนเพื่อความเป็นสัดส่วน:

| เอกสาร | หน้าที่และภาระการทำงาน (Domain Responsibility) |
|---|---|
| 📌 **[README.md](file:///d:/0-Project/92-AiAccess/AI_ExamFormatter/README.md)** | **Executive Butler Dashboard:** สรุปภาพรวม สถานะปัจจุบัน ลิงก์ดรรชนี และคำสั่งรันงาน |
| 📋 **[documents/tasks.md](file:///d:/0-Project/92-AiAccess/AI_ExamFormatter/documents/tasks.md)** | **Task Backlog & Intake:** รายการงาน สถานะ (`In Progress`, `Done`) และประเด็นรอการยืนยัน |
| 🎨 **[documents/design.md](file:///d:/0-Project/92-AiAccess/AI_ExamFormatter/documents/design.md)** | **Master Design Constitution:** กฎหมายการออกแบบ ฟอนต์ สี แถบไฮไลท์ และการ Crop รูป |
| 🏗️ **[documents/architecture.md](file:///d:/0-Project/92-AiAccess/AI_ExamFormatter/documents/architecture.md)** | **Architecture Blueprint:** โครงสร้างทางเทคนิค Stack, Auth, APIs และ Database |
| 📜 **[documents/audit-log.md](file:///d:/0-Project/92-AiAccess/AI_ExamFormatter/documents/audit-log.md)** | **Audit Trail & History Ledger:** บันทึกว่าใครสั่ง ใครทำ เมื่อไร แก้ไฟล์ใด และปัญหาที่พบ |
| 🧪 **[evidence/uat-checklist.md](file:///d:/0-Project/92-AiAccess/AI_ExamFormatter/evidence/uat-checklist.md)** | **UAT & Regression Ledger:** ตารางทดสอบระบบ UAT และบันทึกประวัติการแก้ Defect |
| 💡 **[documents/decisions.md](file:///d:/0-Project/92-AiAccess/AI_ExamFormatter/documents/decisions.md)** | **Decision Log:** บันทึกข้อตัดสินใจทางเทคนิคและสถาปัตยกรรม (D-001..D-003) |
| 🗺️ **[documents/00-index.md](file:///d:/0-Project/92-AiAccess/AI_ExamFormatter/documents/00-index.md)** | **Knowledge Map Index:** แผนที่ความรู้หลักสำหรับ Obsidian Vault |

---

## 3. 🛠️ คำสั่งตรวจสอบคุณภาพระบบ (Verification Commands)

### กู้คืน dependency และเปิด Local อัตโนมัติบน Windows

เปิด PowerShell ในโฟลเดอร์โปรเจกต์แล้วรันคำสั่งเดียว:

```powershell
.\scripts\bootstrap-local.ps1
```

สคริปต์จะหยุดเฉพาะ Node process ของโปรเจกต์, เปลี่ยนชื่อ `node_modules` เดิมเก็บเป็น backup, รัน `npm ci`, ตรวจ Next, รัน test/typecheck/lint และเปิด `http://localhost:3000` เมื่อพร้อม โดยไม่แตะ `.env.local` หรือแสดงค่า secret หากไฟล์ถูกล็อกจนย้ายไม่ได้ ให้ปิดโปรแกรมที่ใช้โปรเจกต์หรือ restart Windows แล้วรันซ้ำ

### ย้ายงานไปอีกเครื่องด้วย Git (Windows PowerShell)

เครื่องต้นทางต้อง commit เฉพาะ source และเอกสาร ห้าม commit `.env.local`, API keys, `node_modules` หรือโฟลเดอร์ build:

```powershell
git status
git add app components lib scripts documents evidence package.json package-lock.json README.md .env.example
git diff --cached --check
git commit -m "chore: prepare cross-machine handoff"
git push -u origin <ชื่อ-branch>
```

ถ้ายังไม่มี remote ให้สร้าง repository เปล่าก่อน แล้วตั้งค่า remote ครั้งเดียว:

```powershell
git remote add origin https://github.com/<บัญชี>/<repository>.git
git branch -M main
git push -u origin main
```

เครื่องปลายทางทำตามนี้:

```powershell
git clone https://github.com/<บัญชี>/<repository>.git
cd AI_ExamFormatter
Copy-Item .env.example .env.local
# เปิด .env.local แล้วใส่ค่าของเครื่องนี้เอง ห้ามคัดลอกคีย์ลงแชตหรือ commit
npm ci --no-audit --no-fund
npm run env:check:record
npm test
npm run typecheck
npm run lint
.
scripts\bootstrap-local.ps1 -Port 3000 -SkipTests
```

`npm ci` ใช้ `package-lock.json` เป็นแหล่งจริง จึงทำให้ dependencies ตรงกันข้ามเครื่อง ส่วน `.env.local` เป็นค่าลับและค่าบริการเฉพาะเครื่อง ต้องสร้างใหม่ทุกเครื่อง

### ตรวจ environment ก่อนเริ่มงาน

```powershell
npm run env:check
```

คำสั่งนี้ตรวจ Node/npm/Git, lockfile, dependencies, `.env.local`, โหมด OCR, Ollama/model เมื่อใช้ local OCR, Gemini, Google OAuth และพอร์ต 3000 โดยไม่แสดงค่า secret ผลแบบ redacted บันทึกได้ด้วย:

```powershell
npm run env:check:record
```

ไฟล์หลักฐานจะอยู่ที่ `evidence/environment-check.json` หากต้องการให้ warning ทำให้คำสั่งไม่ผ่าน ใช้ `npm run env:check:strict`

```powershell
# 1. ตรวจสอบความสมบูรณ์ของ Knowledge Graph
node scripts/check-knowledge-vault.mjs

# 2. ตรวจสอบความพร้อมของ Platform & Runtime
node scripts/check-platform-readiness.mjs

# 3. ตรวจสอบการอัปเดตเอกสารขนานไปกับโค้ดใน Git (Drift Check)
node scripts/check-knowledge-drift.mjs

# 4. ประตูปิดงาน (Finish Task Gate)
node scripts/finish-task.mjs <TASK_ID>
```

### OCR provider modes (T-039)
The app separates OCR raw extraction, normalization/validation, and exam formatting. Remote Typhoon is the default. A local OpenAI-compatible server (Ollama or LM Studio) can be selected without changing parser code:

`powershell
# Remote (default)
# TYPHOON_OCR_BASE_URL=https://api.opentyphoon.ai/v1
# TYPHOON_OCR_MODEL=typhoon-ocr

# Local OpenAI-compatible endpoint
TYPHOON_OCR_BASE_URL=http://127.0.0.1:11434/v1
TYPHOON_OCR_MODEL=scb10x/typhoon-ocr1.5-3b
TYPHOON_OCR_CONCURRENCY=1
` 

OCR pages are processed with bounded concurrency and transient retry handling. Raw page output remains separate from validated exam items; incomplete structure stays in review state instead of becoming fabricated questions.

ล่าสุด: T-041/T-042 Done ในขอบเขตผลตรวจ PDF ตัวอย่างและการเรียกใช้ฉบับตรวจแก้ด้วย hash; gate ผ่านครบรวม CSS. ดู evidence/t042-completion.md. T-039 OCR สำหรับไฟล์ใหม่ และ T-017 OAuth ภายในแอปยังต้องตรวจต่อ.

T-043 optimization: shared FIFO OCR scheduling across uploads in each server process. Local default one slot, remote two, pending limit 32. Existing explicit .env.local concurrency=2 still opts into two; set 1 and restart the app to use the conservative notebook setting. No framework migration is needed for this change. Unknown-source accuracy and browser OAuth UAT remain separate open work.

T-045: header statistics button downloads this browser profile history (latest 200 imports) with grouped median timing. Trials record reviewed-reuse/file-text/OCR separately; timing begins after file parsing, so it excludes PDF rendering. Unknown image uploads invoke OCR; structurally incomplete output goes to raw text review. New files can be tried now; scanned OCR batches are limited to 10 pages and files to 50MB. Ground-truth accuracy, cross-device stats and failed-page-only retry remain open.

T-046 Google sign-in origin: use http://localhost:3000 for OAuth; APP_URL and registered callback are http://localhost:3000/api/google/callback. Auth from 127.0.0.1:3001 redirects to canonical host first. The 3001 preview is preserved but Google session cookies are host-specific. Restart Connect Google from canonical page; old copied callback is not reusable. Live app export remains unverified until user consent and folder selection.

T-047 clarification: scanned PDFs over ten pages no longer require manual splitting; client sends sequential batches of at most ten pages automatically and preserves source numbering. File size/rendering resource limits still apply. Transport failure messages are visible; raw OCR review is used only when source text is available. Persistent unknown-source reviewed reuse remains under T-044.

T-065: OCR upload batches now obey both the ten-page provider ceiling and a conservative serialized request-size ceiling. Large PNG batches are split automatically; non-JSON `413 Request Entity Too Large` responses are converted to an actionable Thai message instead of leaking `Unexpected token 'R'`. A skill specification copied from another repository is advisory only and must be reconciled with this repository's `AGENTS.md`, README, and Knowledge Vault before implementation.

T-048: source PDF pane now has numbered page navigation above the document, with current-page highlight and previous/next. Combined with T-047, users upload once, OCR is batched automatically, then inspect source pages directly.

T-049: active OCR shows scanning animation and actual batch count. Valid source structure autoformats. Otherwise edit raw OCR text on right, then click Convert to exam format on left or Check and format on right; both use corrected text and do not rerun image recognition. Source-side button is disabled while pending/incomplete/already formatted.

### Current workspace flow (T-050)
Right: original and crop. Left: raw OCR, click conversion, edit/style/image, export. Question-number navigation affects the left editor. Header filename-history icon lists latest 100 imports in this browser; it does not reopen files. See evidence/t050-verification.md.

### T-051 Compact source-left workspace
T-051 supersedes T-050 panel positions: original/capture LEFT, OCR/explicit conversion/edit/export RIGHT. Source is independent; question navigation affects editor only. Source magnify/crop and editor insert/copy/export actions use icons with accessible names/title hints and active/disabled states; compact one-row toolbar, 12 pt badge, shortened OCR heading, secondary guidance hidden from visual toolbar. Conversion stays explicit and prominent. Source recognition/answer rules unchanged. Requirement R-001 -> T-051 -> features/r-001-browser.md -> SplitDocumentEditor/RichTextToolbar -> evidence/t051-verification.md.

### T-052 Table-choice layout and source-answer directives
T-052: numbered stem steps retain explicit line breaks including the following prompt; editor renders BR so live snapshot exports real paragraphs. Flattened table choice label prefixes before colons are underlined without HTML injection; values/separators remain literal. Explicit source answer directives accept colon/fullwidth colon, reconcile explanation ahead of source asterisk, and conflicting explicit keys remain unresolved. Existing orange star and green source shading appear immediately when converting. No inferred answers from handwriting, table ticks, absent answers or invalid choice keys. R-002/R-004 -> T-052 -> features/r-002-feature.md -> lib/exam-parser.ts and SplitDocumentEditor.tsx -> evidence/t052-verification.md.

### อ่านเฉลยที่มีในต้นฉบับด้วย Gemini (T-057)
ตั้ง GEMINI_API_KEY ใน .env.local และเลือก GEMINI_ANSWER_MODEL=gemini-3.8-flash (ค่าเริ่มต้น) แล้วเริ่ม dev server ใหม่หากแก้ env หลังเปิดเซิร์ฟเวอร์ คีย์นี้แยกจาก Google Drive OAuth และ Google Picker เมื่อกดแปลงเป็นรูปแบบข้อสอบ ระบบอ่านเฉลยจากภาพทีละหน้า ไม่แก้โจทย์เพื่อเดาคำตอบ รักษาเฉลยข้อความเดิม และแสดงหลักฐานเฉลยใต้ข้อที่อ่านได้ ข้อที่กำกวมหรือไม่มีเครื่องหมายให้ตรวจต้นฉบับเอง รุ่น2.5อาจปรากฏใน models list แต่บัญชีใหม่เรียกจริงได้404; ต้องทดสอบ generateContent จริงก่อนรับรองการตั้งค่า
"# AI_ExamFormatter" 

### T-066 QuizFlow blueprint parity boundary
The supplied QuizFlow blueprint was compared against files that actually exist in this repository. T-066 ports only deterministic, source-preserving rules: conservative Thai OCR spacing/static repairs run before parsing, and explicit `คำตอบ`/`Answer` directives participate in answer reconciliation. Synthetic regression cases are marked in `evidence/t066-blueprint-parity.md`; the external QuizFlow golden corpus, Python builders, manifest schema, crop coordinates, and native Google Doc outputs are not present here, so parity is not claimed for those items.

### T-068 Image/PDF conversion reliability
Image and scanned-PDF imports now use repository-local pdf.js worker, cmap, and standard-font assets. This removes the external CDN dependency that caused valid documents to fall back to the upload screen when the worker could not load. OCR responses are written to the parsed-file raw content before review/conversion, so edited OCR text is the source for explicit formatting. The postinstall sync and `test-pdf-assets.cjs` guard keep the runtime assets present.

### T-069 80-question conversion fidelity
T-069 fixes the long-document parser boundary that confused numeric choices `1..4` with new question numbers. It now preserves sequential question numbers across page markers, supports mixed letter/numeric choices, and maps an OCR `[รูปต้องตรวจสอบ]` marker to the corresponding original page image with `[รูปโจทย์]` ownership. This does not fabricate missing answers: explicit source directives/asterisks remain authoritative, while teacher marks still require the configured Gemini Vision provider and quota.
