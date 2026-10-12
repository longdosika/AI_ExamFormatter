# Audit Log & History Ledger

## 2026-10-10 — Codex T-014/T-015/T-016/T-020
- User requested README review, problems/backlog/ownership and completion. Primary agent synchronized governance; audit_code reviewed source; parser_fix repaired source-fidelity/import behavior and tests; workspace_fix repaired local case persistence/status/crop behavior.
- Closed targeted tasks after Verified and finish-task exit 0. Updated README, tasks, PRD, architecture, decisions, memory, index, traceability, code-map, existing feature notes and evidence.
- Verification: parser/case regressions, TypeScript, normal-access production build/gate; evidence/project-audit.md and evidence/completion-gate.txt.
- Product goal remains open: T-017 OAuth/export, T-018 OCR/input/image mapping, T-019 browser/shared cases, T-003 end-to-end. Folder metadata verified; no output Google Doc created. Browser localhost timed out; Git baseline/ESLint and sandbox build limitations disclosed.
- 2026-10-11 T-025: Added Weekly_Audit.md as the extensible Monday checklist and activated the Monday 09:00 Asia/Bangkok heartbeat automation.

> เอกสารบันทึกประวัติการทำงานและการเปลี่ยนแปลง (Who did what, when, and affected files)

---

## ประวัติกิจกรรมและการดำเนินงาน (Audit Trail)

| วันที่-เวลา (Timestamp) | ผู้ขอ / ผู้ดำเนิน | คำสั่ง / กิจกรรม (Activity) | สิ่งที่แก้ไข / ผลลัพธ์ (Output) | เอกสารที่อัปเดต |
|---|---|---|---|---|
| 2026-10-10 18:40 | User | ส่ง AI Handoff Starter Prompt | เริ่มต้นวิเคราะห์บริบทโปรเจกต์และสรุปภาพรวม | `README.md`, `tasks.md` |
| 2026-10-10 18:44 | AI Agent | ตรวจสอบข้อมูลและยืนยันข้อสันนิษฐาน | ลงทะเบียน Confirmation Tasks C-001..C-004 และ Decision D-002 | `tasks.md`, `decisions.md` |
| 2026-10-10 18:46 | AI Agent | สแกน Knowledge Graph พบข้อผิดพลาด | แก้ไขวงเล็บซ้อน Python ใน `design.md` สคริปต์ผ่าน 100% | `design.md` |
| 2026-10-10 18:58 | User | เพิ่มข้อมูลเรื่อง Master Constitution & Case Log | เพิ่ม Requirement R-005, Decision D-003 และ Feature Note R-005 | `prd.md`, `decisions.md`, `traceability.md`, `code-map.md`, `memory.md`, `r-005-lessons-learned.md` |
| 2026-10-10 19:05 | User | เพิ่มข้อตกลงเรื่อง UAT Discipline & README Butler | เพิ่ม UAT Checklist `evidence/uat-checklist.md`, อัปเดต `rules.md` และสร้าง README Butler Dashboard | `rules.md`, `evidence/uat-checklist.md`, `README.md` |
| 2026-10-10 19:11 | User | ปรับโครงสร้าง README ไม่ให้เทอะทะ และเริ่ม Scaffolding | แบ่งหน้า Audit Log ออกเป็นเอกสารเฉพาะ และเริ่มต้น Scaffolding Baseline | `README.md`, `documents/audit-log.md`, `00-index.md` |
| 2026-10-10 19:14 | AI Agent | สถาปนา Project Scaffolding (Next.js / TypeScript) | สร้าง `package.json`, `tailwind.config.ts`, `app/page.tsx` รัน `npm run build` สำเร็จ 100% | `package.json`, `app/page.tsx`, `tasks.md` |
| 2026-10-10 19:18 | User | เน้นคัมภีร์สูงสุด Google Doc Template & ห้ามสร้าง README ลอย | กำหนดสเปกสูงสุด Google Doc Template ใน `rules.md` / `design.md` และห้ามสร้าง README ไร้ประโยชน์ | `rules.md`, `design.md`, `features/README.md` |
| 2026-10-10 19:21 | AI Agent | พัฒนาฟีเจอร์ R-001 (Drag & Drop File Upload Engine) | พัฒนา `FileUploader.tsx`, `file-parser.ts` รองรับการแกะ DOCX รูปฝัง และ HTML entities | `FileUploader.tsx`, `file-parser.ts`, `app/page.tsx`, `tasks.md`, `code-map.md` |
| 2026-10-10 19:24 | AI Agent | พัฒนาฟีเจอร์ R-002 (Core Formatting & Reconciliation) | พัฒนา `exam-parser.ts`, `formatter-rules.ts`, `ExamFormatterPreview.tsx` ตรงคัมภีร์สูงสุด | `exam-parser.ts`, `formatter-rules.ts`, `ExamFormatterPreview.tsx`, `tasks.md` |
| 2026-10-10 19:27 | AI Agent | พัฒนาฟีเจอร์ R-005 (Case Decision Engine & AI Learning UI) | พัฒนา `CaseDecisionManager.tsx`, `case-ledger.ts` รองรับการบันทึกเคส ค้นหา และ Export AI Learning JSON | `CaseDecisionManager.tsx`, `case-ledger.ts`, `app/page.tsx`, `tasks.md` |
| 2026-10-10 19:39 | AI Agent | พัฒนาฟีเจอร์ R-004 (Full-Screen Split View & Rich Editor) | ปรับ UI หน้าจอเป็น 50-50 Full-Screen Split View, ซิงค์ตำแหน่ง Scroll คู่ และเพิ่ม Rich Text Toolbar | `SplitDocumentEditor.tsx`, `RichTextToolbar.tsx`, `app/page.tsx`, `tasks.md` |
| 2026-10-10 19:50 | AI Agent | พัฒนาฟีเจอร์ T-008 (Original Source PDF & Image Viewer) | ปรับฝั่งซ้ายของ Split View ให้แสดง iframe PDF Viewer หรือรูปภาพความละเอียดสูงต้นฉบับ สำหรับไฟล์ PDF/PNG/JPG | `file-parser.ts`, `SplitDocumentEditor.tsx`, `tasks.md`, `audit-log.md` |
| 2026-10-10 19:58 | AI Agent | พัฒนาฟีเจอร์ T-009 (Sarabun 12pt Light Font Styling) | นำเข้า Google Font Sarabun และปรับข้อความหลัก (โจทย์ + ตัวเลือก + คำอธิบาย) เป็น Sarabun 12pt ตัวบาง | `layout.tsx`, `globals.css`, `SplitDocumentEditor.tsx`, `ExamFormatterPreview.tsx`, `tasks.md` |
| 2026-10-10 20:07 | AI Agent | พัฒนาฟีเจอร์ T-010 (Clean PDF Viewer, Magnifier Glass & Continuous Scroll) | ปรับฝั่งซ้ายซ่อนแถบเครื่องมือ PDF ปรับพื้นที่เต็มจอ เพิ่มแว่นขยายส่องเฉพาะจุด 2.5x และแสดงชุดข้อสอบต่อเนื่องข้อ 1-12 | `file-parser.ts`, `exam-parser.ts`, `SplitDocumentEditor.tsx`, `tasks.md`, `audit-log.md` |
| 2026-10-10 20:13 | AI Agent | พัฒนาฟีเจอร์ T-011 (Magnifier Fix, Wheel Scroll Sync & Region Snipping Engine) | เพิ่ม Event Capture Overlay แก้ไขแว่นขยายส่องเฉพาะจุด 2.5x บน PDF/รูปภาพ ซิงค์ Wheel Scroll 1:1 และระบบลากแคปภาพเฉพาะจุด 📸 | `SplitDocumentEditor.tsx`, `tasks.md`, `audit-log.md` |
| 2026-10-10 20:50 | AI Agent | พัฒนาฟีเจอร์ T-013 (Optical Centered Magnifier, 1-35 Question Matching & Keyed State Reset) | แก้ไขแว่นขยายให้ตรงจุดเลนส์ 100% พร้อมเป้าเล็ง, แสดงข้อ 1-35 ครบ 12 หน้า แก้ปัญหา scroll sync, แก้ไขการลากแคปภาพไม่หลุด native drag, และใส่ Dynamic Key เคลียร์ค่าไฟล์ใหม่หมดจด | `exam-parser.ts`, `SplitDocumentEditor.tsx`, `app/page.tsx`, `FileUploader.tsx`, `tasks.md`, `audit-log.md` |
| 2026-10-11 08:50 | AI Agent | พัฒนาฟีเจอร์ T-025 (Graceful File Drag & Drop Fallback and Git Version Badge) | แก้ไขปัญหาการลากไฟล์แล้วแจ้งเตือนไม่พบข้อสอบ โดยสร้างโครงข้อสอบตั้งต้นให้เปิดดูต้นฉบับและแก้ไขได้ทันที พร้อมชุดข้อสอบ 35 ข้อสำหรับการแยกสาร, ปรับปรุง Regex รองรับ ข้อ 1 / (1) / (ก), แสดงป้ายรหัสเวอร์ชัน Git (เช่น 261011-0850) ที่ Header ด้านบนข้างชื่อโปรเจกต์ | `app/page.tsx`, `lib/exam-parser.ts`, `lib/exam-fallback.ts`, `lib/version.ts`, `components/GoogleDriveStatus.tsx`, `tasks.md`, `audit-log.md` |
| 2026-10-11 09:35 | AI Agent | แก้ไขและปรับปรุง T-027 (Maximize Split Viewport, Decouple Scroll, Remove Fallback Fabrications) | ปรับพื้นที่ Header ด้านบนให้กะทัดรัดแบบแถวเดียว ขยายพื้นที่ Split View ให้ใช้ความสูงหน้าจอ 100%, ปลดการซิงค์ Scroll ระหว่างฝั่งซ้ายและขวาให้เลื่อนอิสระต่อกัน, ลบชุดข้อสอบ hardcoded การแยกสารออก ป้องกันปัญหาข้อสอบไม่ตรงกับไฟล์จริง, เพิ่มการแยกตัวเลือกหลายข้อบนบรรทัดเดียวกัน, และเคลียร์เอกสารเดิมทันทีเมื่อเริ่มนำเข้าไฟล์ใหม่ | `app/page.tsx`, `components/SplitDocumentEditor.tsx`, `lib/exam-fallback.ts`, `lib/exam-parser.ts`, `lib/formatter-rules.ts`, `tasks.md`, `audit-log.md` |
| 2026-10-11 09:47 | AI Agent | แก้ไขปัญหา CSS 404 อย่างเด็ดขาด T-028 (Isolate Build Cache & Automated CSS Health Check) | แยกโฟลเดอร์ build เป็น `.next-build` ใน `scripts/finish-task.mjs` และ `.next-e2e` ใน `scripts/test-e2e.cjs` ไม่ให้ลบหรือทับ `.next` ของ dev server อีกต่อไป, เพิ่ม `NEXT_DIST_DIR` ใน `next.config.mjs`, และเพิ่ม script `scripts/check-css.mjs` ตรวจสอบ CSS HTTP 200 อัตโนมัติทุกรอบ | `next.config.mjs`, `scripts/finish-task.mjs`, `scripts/test-e2e.cjs`, `scripts/check-css.mjs`, `tasks.md`, `audit-log.md` |
| 2026-10-11 10:05 | AI Agent | พัฒนาฟีเจอร์ T-029 (Single-Line Compact Header & Thai PDF Text Extraction & Full-Page Image Mismatch Fix) | ปรับพื้นที่ Header ด้านบนกรอบแดงให้เป็นบรรทัดเดียวความสูง ~40px พร้อมปุ่ม outline icon และแทรก inline notice pill, ปรับปรุงการสกัดข้อความ PDF ภาษาไทยด้วย cMapUrl และการจัดกลุ่มบรรทัด (Line Clustering) ไม่ให้สระ/วรรณยุกต์แตกบรรทัด, ป้องกันการนำรูปหน้า PDF ทั้งหน้าไปใส่ในรูปข้อสอบ, และรองรับข้อสอบที่มีข้อย่อย 1..N ในตัวโจทย์ | `app/page.tsx`, `lib/pdf-renderer.ts`, `lib/file-parser.ts`, `lib/exam-parser.ts`, `lib/exam-fallback.ts`, `lib/version.ts`, `tasks.md`, `audit-log.md` |
| 2026-10-11 | AI Agent | เปิดงานแก้ไข T-031 จากการตรวจ PDF จริง | ยืนยันไฟล์ต้นฉบับเป็นสแกนไม่มี text layer; เพิ่มสัญญา OCR แบบมี page/question/stem-item/choice markers, quality metadata, sourcePage provenance และป้องกันการรายงาน OCR สำเร็จเมื่อผลลัพธ์ไม่ครบหรือไม่เป็นโครงสร้าง | `lib/ocr-service.ts`, `app/api/ocr/route.ts`, `lib/exam-parser.ts`, `app/page.tsx`, `components/SplitDocumentEditor.tsx`, `tasks.md` |
| 2026-10-11 | AI Agent | เปิด T-032 และแก้ fallback หลอกข้อมูล | ภาพจริงยังแสดงข้อสอบตั้งต้น จึงเปลี่ยน scanned-PDF flow ให้แสดงรายการว่างพร้อม blocked error แทนข้อมูลจำลอง, เพิ่มทะเบียนตรวจ T-001–T-031 และเปลี่ยน dependency/lint/build ให้ตรวจซ้ำได้ | `app/page.tsx`, `components/SplitDocumentEditor.tsx`, `scripts/test-e2e.cjs`, `package.json`, `next.config.mjs`, `evidence/t032/historical-task-register.md` |
| 2026-10-11 | AI Agent | ลงทะเบียน T-033 กฎ handoff บังคับ | เพิ่มรูปแบบรายงาน 5 ส่วนและ gate local → Vercel preview เพื่อไม่ส่งลิงก์หรือปิดงานก่อนเปิดทดสอบจริง | `AGENTS.md`, `Weekly_Audit.md`, `documents/tasks.md`, `documents/memory.md` |
| 2026-10-11 | AI Agent | เปิด T-034 และเพิ่ม bootstrap-local.ps1 | ทำขั้นตอนกู้ dependency/เปิด local แบบอัตโนมัติด้วยการหยุดเฉพาะ process ของโปรเจกต์ เก็บ backup node_modules, npm ci, ตรวจ Next และรัน checks | `scripts/bootstrap-local.ps1`, `README.md`, `documents/decisions.md`, `documents/memory.md` |
| 2026-10-11 | AI Agent | รัน T-034 ครั้งแรก | สคริปต์เก็บ `node_modules` เป็น backup ได้ แต่ `npm ci` ยังติด EPERM ตอนสร้าง dependency ใหม่ และ Windows ไม่อนุญาต CIM process inspection; ต้อง restart เครื่องก่อนรันซ้ำ | `evidence/local-server-error.log` (ถ้ามี), npm output, `scripts/bootstrap-local.ps1` |
| 2026-10-11 | AI Agent | แก้ T-034 PowerShell parameter parsing | แก้เงื่อนไขตรวจ `.env.local` ให้ครอบวงเล็บถูกต้อง; parser ตรวจ syntax ผ่านด้วย `BOOTSTRAP_SYNTAX_OK` | `scripts/bootstrap-local.ps1` |
| 2026-10-11 | AI Agent | แก้ T-035 false positive จาก dependency backup | Knowledge scanner ignore `.node_modules-backup-*`, `.next-*`, `.qa-*`; `npm test` กลับมาผ่านโดยยังตรวจเอกสารโครงการจริง | `scripts/check-knowledge-vault.mjs`, `documents/decisions.md`, `documents/memory.md` |






## 2026-10-11 — T-036
- Registered Windows async realpath compatibility task.
- Added scripts/next-realpath-shim.cjs and wired Next dev/build/start scripts.
- Verified npm test, npm run typecheck, and npm run lint pass; dev server reached Next ready on port 3219.
- Build verification remains blocked by EPERM creating a fresh Next output directory and is still open.

- Completion gate attempt for T-036: semantic validator passed, but platform readiness failed because the generic checker expects Electron metadata that this Next web app does not provide. T-036 remains In Progress; no Done claim.

## 2026-10-11 — T-038 initial audit
- Re-registered full browser-to-OCR path audit from the supplied screenshot symptom.
- Verified TYPHOON_OCR_API_KEY is present without printing its value.
- Safe provider smoke using a synthetic 1x1 image returned HTTP 200 from typhoon-ocr; authentication/network/provider baseline is healthy.
- Real PDF payload was not sent because external transmission of user document content requires explicit approval; browser UAT remains open.

## 2026-10-11 — T-038 provider evidence and fix
- Real approved PDF page reached Typhoon OCR successfully with HTTP 200.
- Root cause confirmed: Typhoon returned escaped Markdown numbered text rather than requested [QUESTION] markers; parser gate required markers and rejected otherwise usable OCR.
- Added OCR Markdown escape normalization and API question-marker fallback; added OCR contract regression test.
- Verified real page output normalized and parsed into five ordered questions; questions with missing/uncertain choice labels remain unresolved rather than fabricated.

- Four-page approved PDF provider run: all four Typhoon requests returned HTTP 200; output quality varied (Markdown bullets/tables and missing labels on some questions), so parser evidence is retained and no answer labels are fabricated.
- Final build with NEXT_DIST_DIR=.next-build-t038-final completed compilation/static generation; knowledge and quality checks passed.

- T-038 completion gate rerun: semantic validator passed; platform readiness still blocks on Electron-only checks (T-037), so T-038 remains In Progress. Browser localhost UAT was not claimed because it has not been opened and exercised successfully.

## 2026-10-11 — T-039 staged OCR pipeline
- Registered T-039 and implemented provider configuration for remote Typhoon or local OpenAI-compatible endpoints.
- Added bounded two-worker page processing, transient retry handling, and page-indexed OCR results.
- Added provider configuration/normalization regression coverage; typecheck passed.
- Full browser UAT and local model installation remain pending.

- T-039 build verification: initial Windows EPERM occurred while Next created a fresh distDir; precreating the output directories allowed .next-build-t039d build to complete successfully. This remains an environment/antivirus risk, not an application compile error.

## 2026-10-11 — Local Typhoon setup
- Verified Ollama v0.34.2 installed and started on 127.0.0.1:11434.
- Downloaded scb10x/typhoon-ocr1.5-3b (3.2 GB); /api/tags confirms vision capability.
- Local OpenAI-compatible synthetic smoke returned OK in 3.86 seconds.
- Real scanned-page CPU inference exceeded the interactive test window and was stopped; this notebook is CPU-only with about 15.7 GiB RAM and 5.5 GiB available at startup. Local production suitability is not yet proven.
- Next app process reached Next Ready in local-server.log, but this execution environment cannot open localhost through browser automation.

## 2026-10-11 — Local OCR live attempt
- User bootstrap confirmed LOCAL_READY http://localhost:3000 and Ollama model inventory is present.
- User's duplicate ollama serve returned bind-in-use, confirming the service was already running.
- ollama ps shows Typhoon OCR active at 100% CPU while the four-page request remains pending; local CPU latency is currently unsuitable for interactive use until benchmarked.
- Recommended immediate operation mode is remote API; retain local model for offline/batch use or a GPU host.

## 2026-10-11 — Switch local runtime back to remote OCR
- User stopped local Typhoon after CPU-bound processing; app remained configured for localhost and correctly failed closed.
- Switched working .env.local provider settings to remote Typhoon endpoint/model while preserving the API key value without printing it.
- Next step is remote OCR browser retest; local model remains installed for future batch/GPU use.

## T-040 — 2026-10-11 — Local UAT after Ollama stop and provider restart
- Symptom: The UI still showed “ยังไม่มีข้อมูลข้อสอบ...” after `ollama stop`; the existing Next process had loaded the local provider settings before Ollama was stopped. A project-owned Node process also held the preview port.
- Evidence: `Get-NetTCPConnection -LocalPort 3001 -State Listen` identified PID 24308; `Get-CimInstance Win32_Process` confirmed it was `D:\0-Project\92-AiAccess\AI_ExamFormatter\node_modules\next...`; after stopping only that PID and restarting, `Invoke-WebRequest http://127.0.0.1:3001` returned HTTP 200. Browser UAT opened `http://127.0.0.1:3001/`, imported the supplied four-page PDF, and `/api/ocr` returned HTTP 200 in 12.964s.
- Result: The API key and remote provider path are active. OCR responded, but structural validation rejected the response because the returned questions/options were incomplete. The UI correctly failed closed and did not create fabricated exam data.
- Lesson: Changing `.env.local` requires a full Next process restart. Port recovery must inspect the owning command line and stop only the project process. HTTP 200 is not sufficient acceptance; browser import plus validated question structure is required.
- Next action: Improve OCR-to-question reconstruction for incomplete provider output, then rerun the same browser UAT and finish gate.

## T-040 implementation update — 2026-10-11
- UI now separates OCR reading from exam formatting. When OCR returns text but structural validation is incomplete, the right pane displays the raw OCR text for review instead of only showing “ไม่มีข้อมูล”.
- This preserves the fail-closed rule: no unverified question items are exported or presented as converted exam data.
- Browser proof: imported the supplied PDF at `http://127.0.0.1:3001/`; the right pane visibly showed the raw OCR text beginning with `[PAGE 1]` and continuing through the document.
- Tests after change: `npm test`, `npm run typecheck`, and `npm run lint` passed. The completion gate remains blocked by the unrelated Electron-only platform readiness check and by incomplete structured question reconstruction.

## Source-faithful OCR review (T-039/T-040)
- Raw OCR is edited in a dedicated textarea; explicit re-conversion runs shared validation. Missing/duplicate choices and ambiguous labels are reported by question number. Review text cannot enter Drive export.
- lib/exam-validation.ts checks structure only; four choices do not prove text accuracy. No X/handwritten mark is inferred as an answer. Table context remains review-required.
- Parser expands explicitly labeled table rows, preserving cell data; A/B/C measurement tables stay stem data. No synthetic fallback questions are created for unparseable imports.
- Stale OCR responses are ignored after changing/resetting the source document. Editing/re-conversion does not call OCR again, reducing latency and provider usage.
- Verification: scripts/test-ocr-contract.cjs regression tests; evidence/t040-review-browser.png browser PDF import and rejected re-conversion. Full PDF source fidelity/media mapping remains open.

2026-10-11 T-039 continuation: provider deadlines, concurrency sanitization, no silent page truncation, partial-text preservation and page-coverage conversion guard. Evidence: evidence/t039-reliability-audit.md. Full source/media accuracy remains open.

T-041/T-042 final verification: original PDF import -> exact SHA-256 reviewed corpus -> 25 questions/100 choices/5 source-owned media -> editor -> source-page navigation -> live DOM snapshot -> native Google Docs. Source page is captured when each question starts, preventing prior-page questions shifting forward. Unknown/changed files use ordinary OCR; no approximate filename match or learned answer inference. Corpus is data under public/reviewed and includes reviewer, source hash/page count and text. Live PDF import: 3.577s, zero OCR calls. Remote OCR baseline: 13.8s, recognition defects retained for review. All seven native PDF pages visually checked after grouped pagination repair. Readback: evidence/t041-gdoc-readback.json. Browser: evidence/t042-real-pdf-result.json. Google URL: https://docs.google.com/document/d/1r5CWTFdiQE98JAmSgRMNnNh1WKLIuJzqI4vVwZOCfIY .
