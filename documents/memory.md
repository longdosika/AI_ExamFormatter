# Memory
## Related
- [[00-index]]
- [[tasks]]
- [[decisions]]
## Project Snapshot
AI Exam Formatter is a web-app focused on Create a web app ที่แปลงเอกสาร .ยกด / รูปภาพ / doc / google doc / md file ให้ถูกแบ่งสัดส่วน จัดรูปแบบ ให้เข้า format ตามที่กำหนดไว้
## Decisions
- Primary audience: เราเอง ใช้ผ่าน internet
- Prompt pack level: standard
- Responsive mode: desktop-first
- Master Template URL: `https://docs.google.com/document/d/1uA8A1Q1lXCDIGRPtgBA0H77xYoMWCoo7thp5Hi0nvBQ/edit?tab=t.0`
- Master Design Constitution: `documents/design.md` คือคัมภีร์หลักการออกแบบและจัดรูปแบบทั้งหมดของระบบ
- Lessons Learned & Case Decision Log: ระบบต้องบันทึกและแสดงบทเรียน/การตัดสินใจของแต่ละ Feature/เคส (เช่น การ Crop รูป 3 กรณีแรก) พร้อมวันเวลาและเหตุผล ให้เปิดดูและแก้ไขได้
## Constraints
### Audit handoff — 2026-10-10
- T-014 audits evidence; T-015 removes fabricated parser output; T-016 fixes local case storage and misleading export status.
- T-004..T-013 historical Done claims require acceptance evidence; do not infer UAT from validator/build.
- Google target folder confirmed: 1bZeNZ7De9pxsoQH-Zo9ni3A3Rd6XmnuG (AI_ExamFormatter); connector access is separate from app OAuth.
- No OCR/AI solver, app export/auth/database or cross-device case synchronization verified. C-003/C-004 remain configuration dependencies.
- Repository has no initial commit and files are untracked; drift-gate success is not a meaningful baseline comparison.
- T-020 normal-access build/gate succeeds; sandbox Webpack alias resolution fails. next/font Google requires network. Missing ESLint warning is not lint acceptance. Browser tool localhost timed out, T-019 still open.
- Weekly governance: every Monday 09:00 (+07:00), read `Weekly_Audit.md` first and append a dated audit result. Keep ownership, clean-clone portability, source fidelity, performance, UI/UX/accessibility, security, Google integration, release evidence and learning-loop checks together.
- T-027 maximizes document viewport height by reducing header to an ultra-compact single row (~40px) when split view is active; unlinks/decouples left and right pane scroll synchronization so each side scrolls independently; removes hardcoded fallback questions to avoid document mismatch; and clears previous document state on import start.
- T-031 finding (2026-10-11): the supplied separation PDF is image-only (four pages; pypdf extracted zero characters). Flattened OCR text is unsafe because numeric lists inside stems look like question starts. OCR must emit page/question/stem-item/choice markers, parser must preserve them, and the UI must show page provenance. OCR success is valid only when every page succeeds and structured markers parse into increasing question boundaries.
- T-030 is reopened: its earlier “real OCR verified” note was not sufficient evidence for the supplied fixture. The live provider key and browser import remain unverified; do not treat the prior Done claim as acceptance.
- T-033 governance rule (2026-10-11): every handoff must use five ordered sections—diagnosed problem, completed work plus recorded learning, next work, requested user action, and verified access/testing link. Local real-PDF acceptance must precede Vercel preview.
- T-034 recovery lesson (2026-10-11): on Windows, Next SWC can remain locked after a failed `npm ci`. Preserve/rename `node_modules` and reinstall with `scripts/bootstrap-local.ps1`; do not delete source or `.env.local`, and do not kill unrelated Node processes.
- T-035 lesson (2026-10-11): dependency backup folders must be excluded from Knowledge Vault scans; otherwise third-party README bracket syntax is misclassified as broken project wikilinks. Pattern exclusions are limited to generated directories.

ดูแลง่าย เมื่อมีการแก้ไข ได้ผลลัพธ์แล้ว ต้องถูกบันทึกบทเรียนเสมอ เพื่อใช้เป็นการเรียนรู้หากพบรูปแบบเดิมอีก ต้องสามารถแก้ไขหรือสร้างรูปแบบที่เคยเจอมาก่อน และผ่านการตัดสินใจมาก่อนแล้วได้ ทำที่ไหน เครื่องใคร ตอนไหน ต้องได้ผลลัพธ์เดียวกัน ไม่ติดเรื่อง environment และการออกแบบ UX/UI ทุกข้อตกลงต้องระบุไว้ใน design.md เป็นคัมภีร์หลักการออกแบบของระบบ โดย UX/UI ต้องเรียบง่าย หลีกเลี่ยงรูปแบบที่ AI ชอบใช้ ไม่ใช้ข้อความเยอะ เน้น symbolic เป็นหลัก + icon ลายเส้น คุมโทน

## Zero Regression Protocol & Master Change Log
| รหัส | รายละเอียดปัญหา | แนวทางแก้ไข | สถานะปัจจุบัน |
| --- | --- | --- | --- |
| 001 | แว่นขยายส่องเฉพาะจุด เลนส์ไม่ตรงจุด / iframe PDF ดักจับ mouse event ทำให้เลนส์ไม่ขยับ | เพิ่ม Event Capture Overlay บน PDF/รูปภาพ และปรับคำนวณ Optical Center เลนส์ 2.5x พร้อมเป้าเล็ง | Passed |
| 002 | เครื่องมือแคปภาพเฉพาะจุด (Region Snipping Tool) หลุด native browser drag / ใช้งานไม่ได้ | เพิ่มระบบ `onMouseDown` / `onMouseMove` Drag-box Selection และใส่ canvas snapshot แทนที่ native drag | Passed |
| 003 | ลากไฟล์แล้วระบบแจ้งเตือน error ล็อคหน้าจอเนื่องจากไม่มีชุดข้อสอบตั้งต้นเมื่อ OCR ว่างเปล่า | เพิ่ม Graceful Starter Fallback สร้างช่องข้อสอบตั้งต้นให้เปิดเอกสารต้นฉบับและพิมพ์/ครอปได้ทันที | Passed |
| 004 | รหัสเวอร์ชัน Git (yymmdd-hhmm) ไม่แสดงบนหน้าเว็บเพื่อระบุเวอร์ชันของโค้ด | นำ `APP_VERSION` ใน `lib/version.ts` มาแสดงเป็น Badge ข้างชื่อ AI Exam Formatter ใน Header | Passed |
| 005 | หน้าจอด้านบนกินพื้นที่เยอะ บีบพื้นที่ Split View ให้แคบ และ Scroll สองฝั่งผูกติดกัน (Coupled Scroll) | ยุบความสูง Header, แยกการ Scroll ฝั่งซ้ายและขวาให้เป็นอิสระต่อกัน (Decoupled Scroll 100%) | Passed |
| 006 | การนำเข้าไฟล์ใหม่มีข้อสอบ hardcoded การแยกสารค้างมาจากระบบ fallback เดิม | ลบชุดข้อสอบจำลองออกทั้งหมด, เคลียร์ State ทันทีที่เริ่มอัปโหลดไฟล์ใหม่ และแยกตัวเลือกหลายข้อบนบรรทัดเดียวกัน | Passed |
| 007 | หน้าเว็บหลุด CSS กลายเป็นหน้า HTML ดิบ (CSS 404) จากการที่ build/e2e ลบโฟลเดอร์ `.next` ทับ dev server | แยก Build Dir ด้วย `distDir: process.env.NEXT_DIST_DIR`, e2e ใช้ `.next-e2e`, build ใช้ `.next-build`, เพิ่มสคริปต์ตรวจ CSS HTTP 200 | Passed |
| 008 | ส่วนบน (กรอบแดง) ปรับและจัดระเบียบให้เหลือบรรทัดเดียว (~40px) พร้อม Outline Icons และย้าย Notice เป็น Inline Pill | ยุบความสูง Header เป็น `h-10`, ปรับปุ่มเป็น Outline Icons พร้อม Tooltip, นำแถบสีเขียวมาไว้แถวเดียวกับ Header ไม่กินพื้นที่จอ | Passed |
| 009 | เอกสารซ้าย-ขวาไม่ตรงกัน (ฝั่งขวาโจทย์ไม่ตรง ตัวเลือกไม่มา รูปภาพไม่ถูก cap ไม่ทำงานกับไฟล์ต้นฉบับฝั่งซ้ายเมื่อเป็น PDF ภาพสแกน) | เชื่อมต่อระบบ Typhoon OCR API (`/api/ocr`) สกัดข้อความภาษาไทยจริงจากภาพหน้า PDF และเพิ่ม Markdown & Premise List parser สกัดโจทย์และตัวเลือกจริง | Passed |
| 010 | การอ่านหน้าเอกสารหลายหน้า (Grouped Pagination) เกิน 10 หน้าชนขีดจำกัดหน่วยความจำและ timeout | จัดระบบแบทช์ส่งครั้งละไม่เกิน 10 หน้า พร้อมการคำนวณหมายเลขหน้าสัมบูรณ์แบบต่อเนื่อง | Passed |
| 011 | ตัวเลือกแบบตาราง (Choice Matrix Table) สับสนกับตัวเลือกปกติ | เพิ่มตรรกะตรวจจับตารางตัวเลือก แยกคอลัมน์กึ่งตารางและเก็บความสัมพันธ์หัวตาราง | Passed |
| 012 | ป้ายกำกับภาพ [รูปโจทย์] ขาดหายเมื่อแทรกภาพผ่าน Toolbar หรือ Rich Text DOM | บังคับสร้างข้อความ `[รูปโจทย์]` เหนือภาพทุกภาพที่แทรกเข้าสู่ DOM เสมอ | Passed |
| 013 | โควต้า Gemini Vision 429 เกิดขึ้นเมื่อส่งคำขอตรวจเฉลยพร้อมกันหลายหน้า | จำกัดคำขอทีละหน้าอย่างเคร่งครัด พร้อมระบบ Early Stop เมื่อเจอ Quota Error เพื่อไม่ให้หน้าต่อไปล้มเหลวซ้ำ | Passed |
| 014 | Local Vision Inference ตอบกลับข้อมูลในแท็กคิด (thinking) ทำให้เนื้อหาคำตอบว่างเปล่า | เพิ่ม Diagnostic Parser รองรับการอ่าน JSON ในช่อง thinking อย่างรัดกุมและแยกช่องทดลองออกจากระบบผลิต | Passed |
| 015 | Typhoon OCR API Connection Reset (`fetch failed`) จากเครือข่ายภายนอก บล็อคการทำงานและหน้าจอฝั่งขวาว่างเปล่า | ตรวจจับข้อผิดพลาดการเชื่อมต่อ แสดงข้อความแจ้งเตือนที่ชัดเจน และคงสภาพหน้าต้นฉบับฝั่งซ้ายให้เปิดดูได้ปกติ | Passed |
| 016 | ความต้องการเริ่มทำงานทันทีโดยไม่พึ่งพา OCR ภายนอก (ทางเลือก A เน้นความเร็ว) | เพิ่มปุ่ม 1-Click 'สร้างแบบร่างข้อสอบทันที (เน้นความเร็ว)' ใน Alert และแผงฝั่งขวา สร้างชุดข้อสอบ 25 ข้อพร้อม ก-ง และ [รูปโจทย์] ให้แคปภาพและแก้ไขได้ทันที | Passed |
| 017 | การจัดลำดับ Fallback แบบ Cascade 4 ชั้น (Digital PDF -> Cloud OCR -> Local OCR -> Manual Starter Draft) และการปรับ UI Theme เป็น Earth Tone ตามเรฟ Rose Benedict Design | เชื่อมระบบลำดับ Cascade ใน app/page.tsx และ ocr-service.ts พร้อมอัปเดตโทนสี Deep Olive Green (#496053), Warm Terracotta/Ocher (#b3996a), Warm Beige (#eae8e1), Charcoal (#28332d) และบันทึกกฎใน design.md | Passed |
| 018 | การนำโปรเจกต์ขึ้น Git และเชื่อมต่อ Vercel: ตรวจพบไฟล์ไบนารี node addon ขนาดใหญ่ (135.8 MB) ในแคชแบ็กอัปเก่าติดเข้ามาใน git history เสี่ยงถูก GitHub ปฏิเสธตามกฎ GH001 (ห้ามเกิน 100 MB) และยังไม่พบคลัง Git ปลายทางบน GitHub | ปรับปรุง .gitignore คลุมแคชบิลด์/แบ็กอัป, ทำความสะอาด Git index ให้เบาสบายปราศจากขยะและไฟล์เกิน 100 MB (ไฟล์ใหญ่สุดเหลือเพียง 5.5 MB) รันผ่านเกณฑ์ finish-task และ push ขึ้น GitHub (https://github.com/longdosika/AI_ExamFormatter) สำเร็จเรียบร้อย | Passed |
| 019 | Google Drive บน Vercel แจ้ง 'ยังส่งออก Google Docs ไม่ได้ · รอตั้งค่าการเชื่อมต่อ' แม้ตั้งค่า Env บน Dashboard แล้ว | เพิ่มการตัด trailing slash ของ APP_URL อัตโนมัติ, เพิ่ม diagnostic แสดงฟิลด์คอนฟิกที่ขาดใน /api/google/session และแสดงข้อความชัดเจนบน UI เพื่อให้ตรวจเช็คได้ทันทีโดยไม่ปิดบังสาเหตุ | Passed |


- T-036 lesson (2026-10-11): Windows worktrees can return EPERM from fs.promises.realpath while synchronous realpath succeeds; a narrowly scoped preload fallback restores Next startup. Build output creation remains a separate filesystem/locking check.

- Completion gate lesson (2026-10-11): finish-task.mjs currently includes a platform-readiness Electron check that blocks this Next web app; preserve the failure as governance evidence rather than weakening the checker or claiming completion.

- T-038 lesson (2026-10-11): a configured key alone is insufficient. The UI gates success on all pages, question markers, and parser monotonicity. Safe synthetic provider smoke returned HTTP 200, so the remaining fault is likely real-image payload/contract/parser/browser-path and must be traced with evidence.

- T-038 confirmed lesson (2026-10-11): provider contract prompts are advisory. Typhoon may return escaped Markdown (1\\.) without custom markers. Normalize safe Markdown escapes before parsing and accept plain numbered-question evidence only after parser monotonicity validation; never synthesize missing choices.

- Four-page OCR lesson: HTTP 200 does not prove source fidelity. Pages can contain bullets/tables, missing choice labels, and OCR hallucinations; the UI must fail closed or mark review when structure is incomplete. Keep raw response for audit and never infer answer content silently.

- T-038 release lesson: complete OCR normalization and provider evidence can pass code tests while real browser UAT remains unresolved; keep task In Progress until the actual import path is opened and source/choice fidelity is visually verified.

- T-039 lesson (2026-10-11): separate provider output from canonical exam JSON. Provider prompts are not schemas; normalize and validate before formatting. Configure local/remote endpoints behind one adapter and cap concurrency at two.

- Local Typhoon lesson (2026-10-11): Ollama model install succeeds, but this notebook runs the 3.8B quantized vision model on CPU only; tiny smoke is fast while real scanned-page OCR is much slower. Benchmark real pages before switching default from remote API.

- Live local lesson: successful Ollama health/model checks do not imply interactive OCR speed. A real four-page request can keep the UI in loading while CPU inference remains active; add timeout/progress/fallback before making local the default.

- Runtime lesson: stopping Ollama requires switching TYPHOON_OCR_BASE_URL/TYPHOON_OCR_MODEL back to remote or the app has no provider. Bootstrap readiness alone does not validate OCR provider availability.

## 2026-10-11 — T-040 UAT lesson
- `ollama stop` is expected when switching back to remote OCR; do not run `ollama serve` unless the local provider is selected.
- Next must be restarted after every `.env.local` provider change. If the port is busy, inspect `Get-NetTCPConnection` and the owning process command line, then stop only the project PID.
- The restarted remote path was exercised through the browser with the supplied PDF. Provider response succeeded, but structural validation correctly blocked incomplete OCR output. This is a parser/OCR-quality blocker, not a missing-key blocker.

## 2026-10-11 — OCR intermediate text stage
- The right pane must show raw OCR output when conversion validation fails, so users can distinguish “OCR unavailable” from “OCR succeeded but parser needs review”.
- Raw OCR is review-only until question numbers, choices, and page coverage pass validation; this prevents fabricated output while keeping the primary conversion work inspectable.

## Source-faithful OCR review (T-039/T-040)
- Raw OCR is edited in a dedicated textarea; explicit re-conversion runs shared validation. Missing/duplicate choices and ambiguous labels are reported by question number. Review text cannot enter Drive export.
- lib/exam-validation.ts checks structure only; four choices do not prove text accuracy. No X/handwritten mark is inferred as an answer. Table context remains review-required.
- Parser expands explicitly labeled table rows, preserving cell data; A/B/C measurement tables stay stem data. No synthetic fallback questions are created for unparseable imports.
- Stale OCR responses are ignored after changing/resetting the source document. Editing/re-conversion does not call OCR again, reducing latency and provider usage.
- Verification: scripts/test-ocr-contract.cjs regression tests; evidence/t040-review-browser.png browser PDF import and rejected re-conversion. Full PDF source fidelity/media mapping remains open.

Review baseline: preserve original OCR question numbers independently of editable text, so repeated invalid edits cannot reset missing-question detection. Structural pass does not certify spelling, tables or diagram fidelity.

T-039 OCR reliability: batches over 10 pages reject before provider invocation; request timeout is 120s remote/300s local per attempt; concurrency is finite integer 1-2; truncated text remains available for review but cannot mark all pages successful. Review conversion cannot bypass incomplete page coverage. Owner Codex. Regression: scripts/test-ocr-contract.cjs.

T-041: source-verified 25-question artifact, explicit inline Markdown/data-image ownership and sparse question-N media. Existing R-002/R-004 Feature Notes apply. Figure descriptions remain review markers until original media is attached; checked boxes do not imply answers. Tables preserve column labels. Source-page buttons are excluded from export. Snapshot scaling preserves image aspect ratio. Evidence: evidence/t041-browser-result.json, evidence/t041-media-manifest.json, evidence/t041-source-review.html. Automatic OCR still requires review for overwritten labels/spelling.

T-041/T-042 final verification: original PDF import -> exact SHA-256 reviewed corpus -> 25 questions/100 choices/5 source-owned media -> editor -> source-page navigation -> live DOM snapshot -> native Google Docs. Source page is captured when each question starts, preventing prior-page questions shifting forward. Unknown/changed files use ordinary OCR; no approximate filename match or learned answer inference. Corpus is data under public/reviewed and includes reviewer, source hash/page count and text. Live PDF import: 3.577s, zero OCR calls. Remote OCR baseline: 13.8s, recognition defects retained for review. All seven native PDF pages visually checked after grouped pagination repair. Readback: evidence/t041-gdoc-readback.json. Browser: evidence/t042-real-pdf-result.json. Google URL: https://docs.google.com/document/d/1r5CWTFdiQE98JAmSgRMNnNh1WKLIuJzqI4vVwZOCfIY .

T-043 lesson: per-document workers do not cap combined requests from multiple users. Shared per-endpoint scheduling is needed even for 2-3 users. Keep retry inside its slot and release in finally. Reviewed corpus proves only the exact checked source; parallelism does not improve recognition accuracy. Parent T-039 remains open.

T-045 lesson: file image placeholder text prevented old empty-content detection from invoking OCR; provider cannot dereference browser-local blob URLs. Always send embedded source image bytes. Timing must name its boundaries and path: reviewed reuse speed is not OCR speed. Browser-local retention needs explicit download for portability; source accuracy requires human checked ground truth.

T-046 lesson: APP_URL/registered redirect may correctly match each other yet callback fails because that port has no server. localhost and 127.0.0.1 are different cookie hosts. Normalize before starting OAuth, keep configured listener available, and restart login rather than replay authorization codes.

T-047 lesson: per-request page cap must not become manual document splitting when the client can schedule batches. Generic review messages must not hide transport errors when no OCR text exists. More pages do not prove transcription quality; keep source-review acceptance separate.

T-048 lesson: continuous PDF scrolling needs explicit source-page navigation for long exams. Page controls belong above original pane, with scroll-current feedback and scoped horizontal overflow, never inside learner exam content.

T-049 lesson: empty formatted items do not imply OCR has completed. Track pending state explicitly; never show post-OCR warnings during request. A format button processes edited transcription and existing validation, not source image recognition. Do not overwrite current loading state when older response completes.

### T-050 Explicit conversion workspace
T-050: left raw OCR/text -> explicit conversion -> editable formatted questions/style/images -> export; right original stays read-only and independent, with crop tools. Small question-number navigation scrolls left only. Import-history icon stores the latest 100 filenames/times/sizes locally; no source contents or reopen storage, no reconstruction of older anonymous statistics.
Requirement: R-001 / R-002 -> Task: T-050 -> Feature Note: features/r-001-browser.md and features/r-002-feature.md -> Code Map: app/page.tsx, components/SplitDocumentEditor.tsx, components/RichTextToolbar.tsx, lib/import-history.ts -> Verification: evidence/t050-verification.md.
This explicit user flow supersedes T-049 automatic formatting and T-048 main page-number navigation. Source page references remain available for explicit comparison. Only answers actually supplied by the source are preserved; T-039 semantic OCR fidelity and T-044 resumable raw-page storage remain open.

### T-051 Compact source-left workspace
T-051 supersedes T-050 panel positions: original/capture LEFT, OCR/explicit conversion/edit/export RIGHT. Source is independent; question navigation affects editor only. Source magnify/crop and editor insert/copy/export actions use icons with accessible names/title hints and active/disabled states; compact one-row toolbar, 12 pt badge, shortened OCR heading, secondary guidance hidden from visual toolbar. Conversion stays explicit and prominent. Source recognition/answer rules unchanged. Requirement R-001 -> T-051 -> features/r-001-browser.md -> SplitDocumentEditor/RichTextToolbar -> evidence/t051-verification.md.

### T-052 Table-choice layout and source-answer directives
T-052: numbered stem steps retain explicit line breaks including the following prompt; editor renders BR so live snapshot exports real paragraphs. Flattened table choice label prefixes before colons are underlined without HTML injection; values/separators remain literal. Explicit source answer directives accept colon/fullwidth colon, reconcile explanation ahead of source asterisk, and conflicting explicit keys remain unresolved. Existing orange star and green source shading appear immediately when converting. No inferred answers from handwriting, table ticks, absent answers or invalid choice keys. R-002/R-004 -> T-052 -> features/r-002-feature.md -> lib/exam-parser.ts and SplitDocumentEditor.tsx -> evidence/t052-verification.md.

## บทเรียนล่าสุด 2026-10-11 — T-050 ถึง T-053
- ข้อกำหนดล่าสุดใช้ T-051: ต้นฉบับซ้าย / OCR-จัดรูปแบบ-แก้ไข-ส่งออกขวา; T-050 เป็นประวัติ ไม่ใช่คำสั่งสลับกลับ อ้างอิง evidence/t051-verification.md
- การรักษา newline ใน parser ไม่เพียงพอ: HTML จะยุบช่องว่าง จึงต้องใช้ BR และตรวจ snapshot ว่าแปลงเป็นย่อหน้าจริง หลักฐาน evidence/t052-table-snapshot.json
- ตารางตัวเลือกต้องรักษาหัวคอลัมน์คู่กับค่า: ขีดเส้นใต้เฉพาะ label ก่อน colon ไม่เปลี่ยนค่าหรือใช้ HTML ดิบจาก OCR หลักฐาน evidence/t052-table-format.png
- เฉลยถูกละเพราะ regex ไม่รองรับ colon: รองรับ เฉลย: ง / ตอบ ข้อ ก. ทันทีตอนแปลง ใช้ดอกจันและเขียวตาม source provenance; ถ้า explicit keys ขัดกัน ไม่เลือกคำตอบเอง หลักฐาน evidence/t052-answer-snapshot.json
- รอยเขียน/วงกลม/กากบาทไม่เท่ากับเฉลยที่รับรอง ไม่มีการเดาคำตอบ; คำอธิบายที่ระบุชัดมีลำดับเหนือดอกจันตามกฎ reconciliation เดิม
- ไอคอนต้องมี accessible name/title และสถานะ active/disabled; ตรวจ 390px และคีย์บอร์ดทุกครั้งที่ปรับ toolbar
- ผล mock พิสูจน์ UI/transport/snapshot เท่านั้น; PDF ที่ตรง SHA-256 ใช้ฉบับตรวจแก้ได้ ไม่พิสูจน์ OCR ของไฟล์ใหม่หรือ live Google export
- ประวัติชื่อไฟล์ล่าสุด100รายการอยู่ใน browser; แยกจากสถิติ200ครั้งซึ่งไม่เก็บชื่อ/ข้อความ ไม่รับประกันเปิดไฟล์เก่าซ้ำ

### T-054 Merged stage-aware controls
T-054: tools absent during raw/loading/failed-conversion stage; after success RichTextToolbar is nested in conversion header above question navigation, no independent toolbar row. Icon names/title/disabled state retained. Validation count means issues, not distinct questions. E2E selection explicitly targets plain text: center-click plus Control+End is layout-dependent and can land inside bold heading, falsely testing bold toggle. Keep tests about intended edit operation, not accidental caret location.
R-001 -> T-054 -> features/r-001-browser.md -> SplitDocumentEditor/RichTextToolbar -> scripts/test-e2e.cjs -> evidence/t054-verification.md.

### T-055 Editable draft and crop handoff
T-055 changes readiness: structural issues no longer prevent an editable parsed draft; zero parsed questions still cannot create invented slots. Raw crop selector uses parsed navigation items; insertion first converts to draft then attaches to chosen live DOM after commit. Single top convert action replaces duplicate bottom action. Draft warnings remain outside editable/export content; export unavailable until live review passes. Review snapshot parses current edited text and checks actual attached images, source completeness and original-number retention without rerendering editor from stale items. Manual edits and inserted crops survive review. No missing choices or answers are synthesized.
R-001/R-002 -> T-055 -> browser/OCR feature -> app/page.tsx, SplitDocumentEditor.tsx -> evidence/t055-verification.md.

### T-056 / T-057 Source image captions and Gemini answer extraction
T-056: every inserted question image has [รูปโจทย์] above it, including toolbar and rich-text DOM paste; explicit user requirement supersedes the older caption-free skill rule. Capture/source DOM stays independent. Export snapshots include the caption.
T-057: Gemini is separate from fixed Typhoon OCR. Server-only GEMINI_API_KEY; configurable GEMINI_ANSWER_MODEL defaults gemini-3.8-flash. One bounded page request at a time per process; timeout 90 seconds, one bounded retry for Google503 or local429 after 1.5 seconds; failed pages reported without blocking later pages, no solving. Match source page, question id, stem, actual choice key; reject duplicate/conflicting candidates, confidence below 0.95, missing evidence or invalid normalized bbox. Preserve explicit parsed answers; render source-vision evidence outside export text. Analyze a fresh parse before publishing editable DOM, ignore stale upload/conversion responses, allow draft despite provider failure. Confidence is model-reported, not an accuracy certificate; handwritten X marks may be ambiguous and stay unanswered.
Lesson: models list HTTP200 does not prove generateContent works. Actual request returned404 for gemini-2.5-flash despite discovery listing it; Google restricts it for new users. Verify real generation before declaring provider ready. Evidence: evidence/t057-live-result.json; scripts/test-source-answers.cjs. Live completion gate still pending.
Requirement R-002/R-004 -> Task T-057 -> features/r-002-feature.md -> lib/source-answer-service.ts, lib/source-answer-client.ts, app/api/source-answers/route.ts, app/page.tsx, lib/formatter-rules.ts -> source-answer guards and live browser evidence. Bug T-056 -> existing browser feature -> components/SplitDocumentEditor.tsx -> caption/browser/export regressions.

Final 2026-10-11 handoff: T-056 Done; current shared completion gate exit0 and actual crop/link/DOM-paste/export-snapshot evidence/t056-result.json passed. T-057 In Progress: successful live fixture run21/25 source answers across4 pages retained in evidence/t057-live-result.json; latest recheck Google429 recorded in evidence/t057-provider-recheck.json. Do not overwrite success evidence with failure or claim stable provider readiness. Quota errors now stop all further page requests immediately, preserve already applied answers, and show Usage/Rate limits action; regression verifies one request only. Final feature gate covers code/UI/build, not quota availability or general handwriting accuracy. UI fixture Gemini mocks isolated from real-provider checks. Test selectors use accessible name ไปข้อ N or explicit editor caret, not bare visible digit. No new Google export/deployment certification.

2026-10-12 T-057 quota investigation: screenshot shows historical token/request usage, not configured quota ceilings. Single small text probe of gemini-3.8-flash returned HTTP200 (4 input tokens); this does not certify image requests. Localhost was stopped (ERR_CONNECTION_REFUSED); bootstrap-local.ps1 -Port3000 -SkipTests restarted hidden dev server successfully. Actual4-page browser attempt stopped at page1 after Google429; only1 source-answers request sent, later pages were not sent. Evidence: evidence/t057-quota-probe-20261012.json and evidence/t057-quota-image-20261012.json. No source code changed; T-057 remains In Progress. Owner/action: project owner checks same API-key project, Gemini3.8Flash RPM/TPM/RPD at https://aistudio.google.com/rate-limit; graph peak is not remaining quota and HTTP200 tiny request is not proof of image capacity. Codex rechecks one image only after relevant quota confirmed. Prior successful21/25 answers remain separately recorded; do not substitute that old result for current failed recheck.

2026-10-12 T-057 local feasibility investigation: actual hardware Intel Core i5-1235U,15.7GB RAM,Intel Iris Xe. Ollama lists Typhoon OCR1.5 3B, Qwen2.5 coder1.5B and text Llama3.2; no separate source-answer vision model installed. User asks whether local inference removes Google quota: yes for requests actually handled locally; Gemini endpoint itself remains hosted and must be replaced by a local vision model. Candidate comparison qwen3-vl:2b (1.9GB model download) versus4b (3.3GB); runtime memory exceeds download size, no measured speed or Thai handwriting accuracy yet. Current source-answer implementation supports Gemini only, so changing .env alone does not switch this feature. No model downloaded, no provider switched. Proposed next evaluation: one page at a time, unload OCR model before answer vision, compare annotation precision/recall/unresolved count/time/peak RAM against prior fixture evidence. Evidence: evidence/t057-local-feasibility-20261012.json. T-057 stays In Progress.

### Local comparison T-058
Pilot compares qwen3-vl2b/4b locally without changing production. Existing source PNGs page1/page3 visually reviewed; truth labels are visible red annotation selections, NOT verified subject-answer correctness. Page1 truth1ก2ก3ง4ค5ง6ง; page3 truth11ง12ง13unmarked14ก15ข16ก17ข18ง19ค20ก. Sixteen unique questions with15 marked and1 abstention control; cold page1, warm page3, repeated warm page1 per model. Same source hashes/prompt/settings; precision/recall/wrong/missing/false-positive reported separately before and after existing0.95/bbox guards. Ollama /api/ps model residency and VRAM counters are sampled, not total process/system peak RAM. Evidence and raw responses retained under evidence/t058-local; scripts/benchmark-local-vision.cjs owns evaluation. Model downloads authorized by user; benchmark pending downloads. R-002/R-004 -> T-058 -> features/r-002-feature.md -> benchmark script -> actual local result files and comparison report. Pilot cannot certify production readiness, full-document conversion or general Thai OCR accuracy. T-057 Gemini still unchanged.

T-058 user confirmation (2026-10-12): source red circles/crosses are teacher answers checked again, directly confirmed by project owner. For this fixture, visually transcribed marks are the teacher-verified answer key; this supersedes earlier annotation-only caveat. Do not generalize to other imported files without provenance. Prompt updated identically for both candidates before inference began. Independent audit found reduced-denominator reporting on failed runs, malformed raw IDs, missing same-conditions guard, and unobserved memory shown as0. Added completeness/prompt-settings-runtime-source-hash guards, invalid row count, explicit failure state and unobserved-memory label; evaluator regressions passed. Additional artifact: scripts/report-local-vision.cjs. Download still in progress, no model accuracy result yet.

T-058 final pre-inference dataset: expanded from2pages/16questions to3pages/20questions before any candidate inference, specifically including previously difficult table/diagram page2. Ground truth:19 teacher-marked answers and1 no-unique-choice control (Q13 Free). Pages1,2,3 plus repeated page1 for warm timing;4 runs/model. Both models receive actual reviewed question stems/keys matching production request fields, with no truth key leaked in requests. Preflight: node scripts/benchmark-local-vision.cjs qwen3-vl:2b --preflight passed20questions19marked; fixtures.json captures image hashes and owner confirmation. Completeness and denominators derive from manifest, not hardcoded reduced counts. This supersedes earlier16-question design notes. Await both downloads before timing; no production switch.

### T-059 QuizFlow Technique Deep Dive and Architecture Insights
- QuizFlow Source of Truth: `D:\0-Project\10-Obsidian\quizflow\skills\gdoc-exam-formatter\`
- Three Core Pillars Discovered:
  1. Answer Provenance & Reconciliation:
     - Master Key Reconciliation: When an explicit key exists at the end of the document, cross-reference it against asterisks and explanation texts (`คำอธิบาย: ตอบ ข้อ ก.`) with precedence to explanation over accidental asterisks.
     - Dual-Color Shading: `#E6F4EA` (Light Green) for verified `source_provided` keys vs `#FFF4CC` (Light Yellow) for `auto_solved` keys.
  2. Text Normalization & Choice Matrix Table Conversion:
     - Automatic Thai OCR Repair Engine: Explicit dictionary mappings for fractured vowels and tone marks (`น้้า`/`น้า` -> `น้ำ`, `เป ็ น` -> `เป็น`, `ป ี` -> `ปี`, `ครึ่ ง` -> `ครึ่ง`).
     - Choice Matrix Tables: Multi-column choices (e.g. table with headers 'การระเหย', 'การตกผลึก' and rows ก-ง) are converted into structured text runs (`<b>หัวตาราง:</b> ค่า \t\t <b>หัวถัดไป:</b> ค่า`) instead of raster images, keeping documents responsive and preventing page breaks.
  3. Semantic Crop & Complete Box Frame Capture:
     - Complete Outer Box Frame: For bordered prompts/tables, capture the entire outer rectangular stroke with 1-2px outside white clearance, never crop inside.
     - 4-Side Automated Pixel Edge Sweep: Inspect perimeter pixel intensity (grayscale >= 240); expand bbox if edge cuts into dark strokes (< 200).
     - Sparse Diagram Awareness: For branching/tree diagrams, capture semantic bounds (labels A, B, C, D and endpoints), not just dense pixel centers.


T-058 ROI verification checkpoint (2026-10-12): owner confirms teacher-rechecked red circles/crosses for this fixture. Visually inspected all three QA contact sheets: 20 question-owned original-pixel crops,19 marked keys and Q13 Free/no unique choice. QA labels are excluded from inference images. Experimental native loopback HTTP NDJSON transport added (scripts/local-vision-http.cjs); guards tested for UTF8, final metadata, incomplete stream, provider error and loopback-only scope. Metrics now match case IDs rather than first matching page, preventing repeated-page ROI truth contamination. Initial cropped 2B response completed in63.348s but captured empty content; preserved evidence/t058-roi/initial-stream-empty.json, no accuracy certification. Raw stream capture added for diagnosis. Both full-page failed baselines remain in evidence/t058-local. T-058 remains In Progress; production Gemini provider unchanged. Final actual comparison and finish-task gate pending.
T-058 runtime diagnosis: actual stream evidence shows schema JSON wholly in message.thinking with empty content despite thinkfalse. Diagnostic fallback is strictly JSON-only and experiment-only; preserve channel/chunks, never integrate as production response. First diagnostic2B q1 selected ข incorrectly with confidence0.95 (teacher truth ก); confidence alone unsafe. Transport tests passed. Evidence diagnostic-thinking-channel.json, ROI outputs. Full20case comparison ongoing.
- 2026-10-13 T-065: A 10-page OCR limit alone is insufficient for Base64 PNG uploads because request body size varies by rendered page. `lib/ocr-client.ts` now chooses batches by both page count and serialized request bytes (3 MB ceiling), preserves absolute page mapping, and parses plain-text 413 responses into an actionable message. Imported skills from another repository can provide heuristics, but repository-local AGENTS.md, README, architecture, and tests remain authoritative.

T-066 lesson (2026-10-13): A conversion blueprint is a rule inventory, not proof that the source implementation or golden outputs exist locally. Porting should begin with a parity matrix and synthetic tests for deterministic rules. Thai OCR cleanup must precede parsing, while unknown replacement characters and conflicting answer evidence stay visible/unresolved. External QuizFlow paths, templates, crop coordinates, and output counts require real permitted fixtures before adoption.

### T-068 durable lesson
A browser PDF worker failure can look like an OCR failure because the import pipeline never reaches the OCR boundary. Keep pdf.js runtime assets local and test their presence. Also persist the successful OCR response on the parsed-file record, not only React state; otherwise image fallback conversion can see the original placeholder instead of the reviewed OCR text.

### T-069 durable lesson
A parser that handles ordinary letter choices can still collapse a long scan when OCR emits numeric choices. Test transitions after numeric choice blocks and across page markers, not only the first page. Full-page images are a safe fallback for explicit figure markers; they must remain visibly labeled and reviewable rather than silently presented as text.

T-069 update (2026-10-13 15:57:11 +07:00): The browser fixture exposed a real edge case missed by the first long fixture: after numeric choices 1..4, a following 5. was treated as a fifth choice. The parser now caps numeric choices at four and only treats 5. as the next question when its next line begins a letter-choice block; otherwise it remains a stem enumeration. This preserves 80/80 question navigation without changing source text. Fresh E2E passed 16 checks. Gemini source-answer requests remain externally blocked by recorded HTTP 429 evidence; unresolved answers are intentional and provenance-safe.

T-071 environment lesson (2026-10-13): A successful clone is not a ready runtime. The reproducible boundary is the committed lockfile plus `npm ci`; secrets and provider choices stay in a new `.env.local`. Run `npm run env:check:record` before starting so Node/npm/Git, dependencies, OCR mode, Ollama/model, optional Gemini/Google settings, and port conflicts are visible without exposing keys. A local Ollama health response does not prove the configured model is installed; the doctor checks `/api/tags` when local OCR is selected.
