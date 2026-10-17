# AI Exam Formatter — AI Butler Dashboard

> 🛎️ **Executive Dashboard & Project Gateway:** เอกสารนี้ทำหน้าที่เป็นศูนย์รวมข้อมูลและสวิตช์บอร์ดประจำโปรเจกต์ นำเสนอสรุปสถานะสั้นกระชับ อ่านง่าย และเชื่อมโยงไปยังเอกสารเฉพาะทางใน Project Knowledge Vault เพื่อไม่ให้ไฟล์นี้ใหญ่เกินไป

> 📒 **อยากรู้ว่าแก้อะไรล่าสุด, เจอปัญหาอะไร, แก้แล้วหรือยัง, ซ้ำไหม, อยู่ build ไหน → อ่าน [release_log.md](release_log.md) ก่อนเสมอ** (มีทะเบียนปัญหา I-xxx, backlog B-01..B-40 และประวัติ build)

### อัปเดตล่าสุด 2026-10-17

**`T-132` Done / production build `261017-2046`** (localhost:3000, รวม T-131): รูปที่อยู่ข้างบรรทัดเลขข้อไม่ขาดด้านบน (ชุด 2 ข้อ 20/22) และกฎ capture ทุกข้อผูกกับโค้ดและ test ที่ถูกเรียกจริง ([documents/capture-rules.md](documents/capture-rules.md) หมวด ฉ., ตรวจโดย scripts/test-capture-rules.cjs ใน npm test)

**`T-130` Done / production build `261017-1907`** (localhost:3000): ข้อที่ตัวเลือกเป็นตารางไม่มีรูปตารางซ้ำเป็นรูปโจทย์แล้ว (กฎ C-36, ชุด 2 ข้อ 5/7/8/10), หัวแอปไม่มีข้อความสถานะ, ปุ่ม Drive/ส่งออกรวมเป็นปุ่มเดียว (กุญแจ → ส่งออก → เปิดใน Drive, เมนูมี ส่งออกใหม่/สำรองแบบร่าง/จัดการ Drive)

**`T-129` Done / production build `261017-1543`** (localhost:3000): หัวแอปเหลือ 4 ปุ่ม — คลังไฟล์, แบบร่าง/ประวัติ (แบบร่างและประวัติไฟล์นำเข้าเป็นรายการเดียว), เครื่องมือ (สถิติ / ดาวน์โหลดสถิติ / บันทึกปัญหา), แม่แบบ

**`T-128` Done / production build `261017-1521`** (localhost:3000): นำเข้าไฟล์ที่เคยนำเข้าแล้ว (ตรวจจากเนื้อไฟล์ เปลี่ยนชื่อก็จับได้) จะถามก่อน: ทำต่อจากแบบร่างเดิม / นำเข้าใหม่ / ยกเลิก, แบบร่างแสดงขั้นที่ทำถึง, หน้าแรกแสดง 4 แบบร่าง, ไฟล์บน Drive อยู่โฟลเดอร์ AI_ExamFormatter โฟลเดอร์เดียว ชื่อ `[ต้นฉบับ]` และ `[ต้นฉบับ]_[yymmdd-hhmm]`, สถานะ Drive ย้ายขึ้นหัวแอป หลักฐาน [T-128](evidence/t128/verification.md)

**`T-127` Done / production build `261017-1417`** (localhost:3000): เฉลยที่ผู้ใช้เลือกบนตัวเลือกที่เพิ่มเองไม่หาย * แล้ว (ช่อง * แก้ไม่ได้ พิมพ์ต่อท้ายได้ปลอดภัย) และ "แยกตัวเลือก" แสดงอักษร ง ถูกต้อง หลักฐาน [T-127](evidence/t127/verification.md)

**`T-126` Done / production build `261017-1342`** (localhost:3000): เฉลยได้หลายข้อ (ปุ่ม "ตอบได้หลายข้อ" และอ่านวงหลายวงจากต้นฉบับ เช่นข้อ 9 วง ก และ ง) ส่งออก * ทุกข้อตามแม่แบบหลัก และเพิ่ม/ลบ/แก้ตัวเลือกได้พร้อมเรียงอักษรใหม่ วิธีใช้ใน [คู่มือตรวจทาน](documents/conversion-review-guide.md) หลักฐาน [T-126](evidence/t126/verification.md)

**`T-125` / production build `261017-1214`** (localhost:3000): ถ้ามีแบบร่างของไฟล์เดิม ระบบจะไม่ใช้ข้อความ OCR เก่าที่ไม่มีตำแหน่งบรรทัดแล้ว และอ่านตำแหน่งก่อนสกัดรูปทุกครั้ง แก้รูปข้อ 6 ติดโจทย์ ตารางข้อ 21 ตัดขวา และแถวตารางค้าง กฎการครอบรูปและบันทึกการเรียนรู้อยู่ที่ [documents/capture-rules.md](documents/capture-rules.md)

**`T-124` Done / production build `261017-1152`** (localhost:3000): เปิดแบบร่างเก่าแล้วระบบล้างแถวตาราง/ป้ายในรูปที่ซ้ำในโจทย์ให้อัตโนมัติ และมีปุ่ม "ตัดใหม่จากต้นฉบับ" สำหรับรูปที่ครอบด้วยเวอร์ชันก่อน; รูปข้อ 8 ไม่ติดบรรทัดตัวเลือกแล้ว หลักฐาน [T-124](evidence/t124/verification.md), log ที่ [release_log.md](release_log.md)

**`T-123` / production build `261017-1101`**: ใช้โควตาเดิมทดสอบจริงตามเจ้าของอนุญาต **ไม่ซื้อแพ็กเกจ/ไม่เปลี่ยน billing** อ่านวงคำตอบชุด3 รอบแรกถูก11ข้อ รอบสอง1ข้อเมื่อ fallback ไป lite จึงยังไม่ผ่านเกณฑ์อย่างน้อย10ข้อครบ3รอบ จับรูป live ชุด4/5 ครบ18หน้าแล้วพบและแก้เพิ่ม: ข้อ4ติดข้อความใต้ตาราง และข้อ9หยิบตารางข้อ7ผิด (guardไม่รับเลข `9.` เดี่ยว) เพิ่ม regression ล้มก่อนแก้/ผ่านหลังแก้ รวม15ข้อ และ `finish-task T-123` exit0; ตรวจซ้ำบน localhost ด้วยผล live เดิมและ fidelityชุด25/80ข้อผ่าน ไม่ใช้โควตาเพิ่ม source/badgeตรง CSS200/63,737bytes

คงการรองรับ4–5ตัวเลือก/Save/ตัวเลือกจ/DOCX และการแก้ parser/OCR/หัวตารางร่วมจาก build1034 **T-123 ยัง In Progress**: ชุด4รูป/ตัวเลือกยังไม่ครบ และชุด5ข้อ21มีหลายตารางที่เขียนทับ/ตัดขาดแม้ตัวนับแจ้งรูปขาด0 (I-047) รวมถึง QuizFlow import ยังไม่ผ่าน ไม่ stage/commit/push ดู [T-123 verification](evidence/t123/verification.md), [คู่มือตรวจทาน](documents/conversion-review-guide.md), [release log](release_log.md).

**`T-121` ลำดับตามแม่แบบหลัก / production build `261017-0949`** (localhost:3000): "รูปโจทย์" อยู่ก่อนตัวเลือกแล้วทั้งในจอแก้ไขและ DOCX (แบบร่างเก่าถูกจัดใหม่ตอนเปิด/ส่งออก), แก้ข้อความตารางซ้ำหลังจับรูปที่ build 0911 ทำพัง, ตัดป้ายในรูปที่ติดท้ายโจทย์ (ข้อ8) และตัวเลือกที่เป็นรูปล้วนไม่หาย (ชุด1 ข้อ16) งานที่เหลือพร้อมหลักฐานและเกณฑ์ผ่านอยู่ที่ [release_log.md](release_log.md) หัวข้อ "งานรอจ่าย (Handoff)" / `T-123`

**`T-121` ตรวจทาน / production build `261017-0911`** (localhost:3000): ตรวจงานที่ปิดไว้ซ้ำด้วย PDF จริงชุด3 แล้วแก้ I-033 รูปกราฟข้อ10ตัดขวา, I-034 เฉลยต้นฉบับได้0เพราะลำดับ key/model (ตอนนี้อ่านวงได้11ข้อ และไม่นับกากบาท), I-035 กรอบสเกล0..1 ทำตารางข้อ6หาย, I-036 เลขข้อย่อยติดบรรทัดเดียว และ B-18 ตารางที่ capture ไม่ได้เก็บเป็นแถวละบรรทัด ผ่าน `finish-task T-121` และ deployed regressions; B-32 (commit) รอเจ้าของตาม D-068, B-36 (QuizFlow import) ติดฐานข้อมูล QuizFlow ดู [release_log.md](release_log.md)\n']])

**`T-121` ยัง In Progress / production `261017-0014`**: แก้ key ง/4 และข้อปลอม, แยกตัวเลือกที่ต้องยืนยัน, คืนตัวเลือกบรรทัดละข้อ, ใช้พิกัด OCR ครอบรูป/ตาราง, ไม่ขึ้น CLEAN เอง, เพิ่มตรวจรูปทั้งหมดและคำแนะนำแก้ OCR, บันทึก/เปิดแบบร่างเก่าไม่กลับมาซ้ำ และสำรองแบบร่างแต่ละเวอร์ชันบน Drive พร้อมกู้ต้นฉบับด้วย SHA-256 โดยไม่ OCR ใหม่ ทดสอบ PDF จริงชุด3 **25ข้อ/4หน้า** และชุด1 **80ข้อ/13หน้า**; Google จริง25ข้อ/5รูปและ80ข้อ/15รูป ผ่านการเปิด editor/PDF, Q66 ขอบถูก/ข้อความไม่ซ้ำ, Drive restore80ข้อ/13หน้า/15รูป และดาวน์โหลด DOCXจริงผ่านแล้ว รายข้อ B-01..B-40 ดู [release_log.md](release_log.md); ผล/ข้อจำกัด [T-121 verification](evidence/t121/verification.md)

**ปิด `T-103 / T-104 / T-113` แล้วหลัง Verified และ completion gate exit0.** Next.js15.5.27 / PDF.js4.10.38 / PostCSS8.5.30, production `npm audit` **0 รายการ**, isolated clean `npm ci` ผ่าน. **ยังไม่ปิดทั้งหมด:** QuizFlow3001 เชื่อมฐานข้อมูลจริงไม่ได้, ความแม่นยำวงเฉลย/ตารางที่จับไม่ได้ยังต้องตรวจต้นฉบับ, งาน benchmark/hardware เก่ายังแยกติดตาม ไม่มี stage/commit/push; ต้องตรวจ credential history/ความเป็นส่วนตัวและ Node22 CI ก่อนเผยแพร่

### ประวัติ T-120 / T-119

**`T-120` Done** (เอกสารอย่างเดียว, gate exit 0): สร้าง [release_log.md](release_log.md) และ backlog 40 ข้อจากภาพเจ้าของ (ข้อ 6 ถูกแบ่งเพราะ ง. อ่านเป็น 4., ง หาย/รวมในข้อ 14–15, ตัวเลือก 2 คอลัมน์ขัดแม่แบบหลัก, ข้อ 20 ครอบเกิน, ข้อ 21/6 ตารางกลายเป็นข้อความ) งานแก้รอ `T-121`

**`T-119` Done / production build `261016-2058`** (localhost:3000): ปรับ workspace 30 จุด ตรวจเลขซ้ำ/แยกตัวเลือกรวม แถบเครื่องมือแถวเดียว จุดเลือกหน้า ซิงก์ต้นฉบับ ลดรอยปากกา ปุ่มลัด 1–4 ยืนยันเฉลย AI ทั้งหมด และขั้นตอนส่งออก ผ่าน `finish-task T-119` exit 0 หลักฐาน [T-119](evidence/t119-verification.md); การแสดงตัวเลือก 2 คอลัมน์ขัดแม่แบบหลัก (I-029) จะเอาออกใน T-121

### ประวัติ T-118

**`T-118` Done หลัง Verified / production build `261016-2013`**: คืนเมนู hover ให้กางชื่อในแถบเดิมตามเจ้าของยืนยัน ย้ายจำนวนเป็นข้อความไม่มีกรอบ **ต้นฉบับ xx ข้อ** ในหัวฝั่งซ้าย เพิ่มไอคอนบันทึกแบบร่างจากข้อความ/รูป/เฉลยที่แก้จริง เปิดทำต่อได้ และย้ายสถานะ/การจัดการ Drive ไปข้างส่งออกพร้อมไอคอนตามสถานะ ส่งออกฉบับปัจจุบันได้ระหว่างวิเคราะห์ AI/สกัดรูป โดย DOCX ไม่ถูกล็อคตาม Google; ถ้ายังไม่เชื่อม Google ปุ่มเปิดการเชื่อมต่อแทนการปิดใช้งาน ยังตรวจสิทธิ์/รูป/ข้อมูลจริงก่อนส่ง ไม่แก้แอป QuizFlow ในภาพอ้างอิง

ผ่าน `finish-task T-118` exit0 และทดสอบซ้ำบน production localhost **32/32** พร้อม capture/library/workspace suite, บันทึกแล้วเปิดต้นฉบับ PDF จริงครบ13หน้า, badge/sourceตรงและ CSS200 เปิด localhost และลอง Save/reload/resume/จัดการ Drive ใน IAB แล้ว หลักฐาน [T-118](evidence/t118-verification.md). ชุดส่งออกระหว่าง AI จำลอง Google/provider แต่สร้าง DOCX จริง; รอบนี้ไม่อ้าง Google export ใหม่หรือนำเข้า QuizFlow จริง แบบร่างยังเก็บเฉพาะเบราว์เซอร์ ไม่ใช่ backup บน Drive อัตโนมัติ T-103/T-104 และ T-113 security hold ยังเปิด ไม่มี stage/commit/push

### ประวัติ T-115 / T-116 / T-117

**`T-115 / T-116 / T-117` Done / production build `261016-1734`**: เพิ่ม **คลังไฟล์บน Drive** เชื่อมต้นฉบับเดิมด้วย SHA-256, output DOCX แต่ละเวอร์ชัน และ Google Doc ของเวอร์ชันนั้น โดยไม่ย้ายไฟล์เก่าจากการเดาชื่อ ไม่เขียนทับต้นฉบับ/เวอร์ชันเดิม และไม่ปรับสิทธิ์แชร์ การกดยืนยันนำเข้า QuizFlow เป็นรายการแยกที่ผู้ใช้ต้องยืนยันหลังนำเข้าจริง ไม่ถือว่า export คือ import แล้ว ดาวน์โหลดได้แม้ไม่เชื่อม Google พร้อมคิวส่ง Drive ซ้ำที่อยู่ต่อหลังรีเฟรช; แบบร่างเก่าที่ไม่มีต้นฉบับยังดาวน์โหลดได้ แต่ต้องแนบต้นฉบับและ export ใหม่ก่อนผูกคลัง ปุ่มเครื่องมือด้านบนไม่เลื่อนตำแหน่งตอน hover แล้ว

ตรวจ PDF จริง13หน้าและ crop4กลุ่มผ่าน เก็บเส้น/ขอบ/ข้อความในกรอบที่ตรวจด้วยตาครบ ดาวน์โหลดต้นฉบับกลับจาก Drive แล้ว hash ตรงทั้งไฟล์ ทดสอบ export จริงด้วยชุดจำลอง2ข้อเป็น3เวอร์ชันพร้อมรูป/เฉลย และเปิด Google Docs/อ่าน PDF ปลายทางแล้ว ไม่ใช่ output ฉบับเต็ม80ข้อและยังไม่ได้ทดสอบนำเข้า QuizFlow จริง ผ่าน completion gate, final production E2E **32/32** พร้อม capture/library suite, source/badgeตรงและ CSS200 หลักฐาน: [T-115](evidence/t115-verification.md), [T-116](evidence/t116-verification.md), [T-117](evidence/t117-verification.md). คลัง Google Drive เป็นหลัก ส่วนแบบร่างและคิวรอส่งยังอยู่เฉพาะเบราว์เซอร์นี้ T-104 ตรวจจับรูปด้วย provider จริงและ T-113 security hold ยังแยกติดตาม ไม่มี stage/commit/push

### ประวัติ T-114 (build ก่อนหน้า)

**`T-114` Done / production build `261016-1602`**: แก้ข้อความเซลล์/หัวตารางซ้ำกับรูป capture ทั้งโจทย์และโจทย์ร่วม รวมแบบร่างเก่า โดยคงข้อความบรรยายและรูปแบบตัวหนา/เอียง แนะนำข้อและตำแหน่งรูปจากจุดที่กำลังแก้ (ยังเปลี่ยนเองได้), แทรก/เปลี่ยน/ย่อขยายแล้วฝั่งขวาเลื่อนไปตรวจรูปนั้น และแก้แถบเครื่องมือรูปแคบที่ยื่นไปฝั่งซ้าย การครอบภาพเก็บเส้น/label ภายในกรอบตรวจจับไว้ ไม่ตัดเส้นบน–ล่างของโครมาโทกราฟีเพียงเพราะมีช่องว่าง ผ่าน completion gate exit 0 และทดสอบซ้ำบน final production localhost E2E **32/32** พร้อมชุด capture/Canvas/DOCX; เลข build บนหน้าจอตรงกับ source และ CSS ผ่าน หลักฐาน: [evidence/t114-verification.md](evidence/t114-verification.md). รูปเก่าที่ขาดต้อง capture/สกัดใหม่เฉพาะรูปนั้นจากต้นฉบับหนึ่งครั้ง; ยังรอ PDF จริงเพื่อยืนยันข้อ 56–61 ไม่รับรองความแม่นยำ AI ทุกเอกสารจาก fixture งาน T-103/T-104/T-113 ยังเปิดอยู่ ไม่มีการ stage/commit/push ในรอบนี้

### ประวัติ ณจบ T-112 (ไม่ใช่ deployment ปัจจุบัน)

งานล่าสุด **`T-112` เตรียม build สำหรับ GitHub โดยยังไม่ push**: เพิ่ม workflow Node 22 สำหรับติดตั้งจาก lockfile, ตรวจไฟล์ลับ/ขนาดไฟล์, typecheck/lint/test/build, Chromium E2E และ audit dependency พร้อม [release checklist](documents/release-checklist.md). สร้าง production candidate **`261016-1027`** แยกจากระบบหลัก ผ่าน completion gate exit 0 และ Edge E2E **31/31**; build ตรวจใน gate อัปเดต source stamp ล่าสุดเป็น **`261016-1034`** แต่ไม่ได้ deploy และปิด candidate หลังทดสอบแล้ว ผลและข้อจำกัด: [evidence/t112-verification.md](evidence/t112-verification.md). ไม่มีการ stage, commit หรือ push ในรอบนี้

**ยังไม่พร้อมเผยแพร่:** production dependency audit พบ critical 2 / high 3 รายการ ติดตามใน **`T-113`**; CI จะไม่ผ่าน security gate จนแก้ไข ต้องตรวจคีย์ลักษณะ credential ที่เคยอยู่ในประวัติ Git และความเป็นส่วนตัวของ PDF/DOCX/ภาพหลักฐานด้วย ห้ามใช้ `npm audit fix --force` โดยไม่มีแผนอัปเกรด รายงาน: [evidence/t112-npm-audit.json](evidence/t112-npm-audit.json)

ระบบหลักยังเป็น production **`261016-0945` / `T-111`**: ปรับประสิทธิภาพและความชัดเจนของ workspace, chip แบบร่าง, ข้อความสถานะพับได้, แบบร่างล่าสุด, J/K เลื่อนข้อ, ข้ามไปข้อที่ยังไม่ตอบ และ feedback การแก้เฉลย ผ่าน E2E **31/31** ตาม [หลักฐาน T-111](evidence/t111-verification.md). ก่อนหน้านี้ `T-109` ปรับ export ตามแม่แบบหลัก และ `T-110` รวมส่งออก/เปิดเอกสารในจุดเดียวพร้อมแถบเลขข้อใหม่ เลข stamp ใน source ที่ถูกอัปเดตโดย gate ไม่ใช่การ deploy ระบบหลักหรือการรัน CI บน GitHub

### ประวัติก่อนหน้า 2026-10-15

Build ล่าสุด **`261015-2017`** / งาน **`T-105`**: เก็บไฟล์ต้นฉบับแยกจากแบบร่างใน IndexedDB เพื่อเปิดอ้างอิง จับภาพ และใช้แว่นขยายต่อได้หลังรีเฟรช แบบร่างเก่าที่ไม่เคยเก็บต้นฉบับให้แนบไฟล์เดิมผ่านปุ่มคลิปหนีบเพียงครั้งเดียว ไม่เรียก OCR/AI และไม่ล้างงานแก้ไข สถานะสกัดรูป/วิเคราะห์เฉลยที่ทำแล้วจางลง ส่วนแถบเลขใช้วงกลมกาง/ยุบช่วงที่ซ่อน พร้อม animation และ reduced motion ผ่าน completion gate และ E2E บน production localhost **28/28** รายการ รายละเอียด: [evidence/t105-verification.md](evidence/t105-verification.md). ข้อมูลต้นฉบับอยู่เฉพาะเบราว์เซอร์/ที่อยู่นี้ ไม่ใช่ cloud backup; งาน T-103/T-104 ยังเปิดอยู่

ก่อนหน้า Build `261015-1932` / งาน `T-102`: แก้ดาวเฉลยและป้ายที่มาซ้ำหลัง AI/เปิดแบบร่างเก่า เพิ่มการตรวจโหลดรูปก่อนส่งออก DOCX/Google และรักษาสัดส่วนรูป ผ่าน completion gate และ E2E 25 รายการบน production localhost แล้ว ตรวจ Google conversion จริงด้วยเอกสารทดสอบแยก รายละเอียดและข้อจำกัด: [evidence/t102-verification.md](evidence/t102-verification.md). อาการรูปเตือนเฉพาะหน้า Google Docs ยังติดตามใน `T-103`; PDF ที่ Google สร้างจากไฟล์เดิมแสดงรูปข้อ 16 ครบ ส่วนตารางข้อ 66 ถูกถอดเป็นข้อความแทนรูปก่อนส่งออก ติดตามการจับภาพจากต้นฉบับใน `T-104` ไม่แก้ไฟล์อ้างอิงของผู้ใช้

### แผนผังความสามารถระบบฉบับภาษาไทย

ดูรายละเอียดความสามารถตามกลุ่มการใช้งาน กรณี capture รูป/ตาราง เงื่อนไข OCR การอ่านเฉลย และทะเบียนข้อจำกัดที่ต้องตรวจจากไฟล์จริงได้ที่ [documents/feature-catalog.md](documents/feature-catalog.md) งานทะเบียนและการปิดหลักฐานอยู่ใน `T-091`.

---

## 1. 📊 สรุปสถานะโปรเจกต์ (Executive Summary)

* **เป้าหมายโปรเจกต์:** พัฒนา Web Application สำหรับแปลงไฟล์ข้อสอบหลายรูปแบบให้ถูกจัดสัดส่วน สี รูปแบบ และส่งออกเป็น Google Doc เข้า Google Drive ตามแม่แบบมาตรฐาน
* **งานล่าสุด:** `T-123` production `261017-1101`; liveโควตาเดิมไม่ซื้อแพ็กเกจ, อ่านวง11/1ข้อและจับรูป18หน้า พบ/แก้geometryเพิ่ม แต่ T-123/T-121 ยัง In Progress โดย I-047/รูปที่ไม่ครบ/ความแม่นยำเฉลยและ QuizFlow import ยังไม่ผ่าน
* **เงื่อนไขก่อนเผยแพร่:** production audit ปัจจุบัน0 (T-113); ยังต้องตรวจ credential ในประวัติ/ความเป็นส่วนตัว, ขออนุญาต commit/push และตรวจ Node22 CI จริง ไม่ใช้ผล local Windows แทน cloud CI
* **งานเปิด:** `T-017` Google export/OAuth, `T-018` OCR/input/image mapping, `T-019` browser UAT/shared cases และ `T-003` end-to-end acceptance
* **งานแก้ไขเร่งด่วน:** `T-031` กำหนดสัญญา OCR แบบมีหน้า/ข้อ/ข้อย่อย/ตัวเลือก เพื่อให้ PDF สแกนแปลงตรงต้นฉบับและฝั่งซ้าย-ขวาตรวจสอบย้อนกลับได้
* **สัญญาการออกแบบ (Master Design Constitution):** [documents/design.md](documents/design.md) (ยึดถือแม่แบบ [Official QuizFlow Template](https://docs.google.com/document/d/1uA8A1Q1lXCDIGRPtgBA0H77xYoMWCoo7thp5Hi0nvBQ/edit?tab=t.0))
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

ข้อจำกัดปัจจุบัน: Git มี baseline แล้ว (`99a9413` อยู่ก่อนเริ่ม T-112 และ ahead cached origin/main 1 commit); ดู lint/quality ผลจริงในหลักฐานรอบล่าสุด ไม่อนุมานจากรายงานเก่า การทดสอบ provider จำลองไม่รับรองความแม่นยำ OCR ของเอกสารใหม่หรือ Google OAuth จริง งาน T-103/T-104 ยังเปิดอยู่ และมี security hold ตาม T-113

---

## 2. 🗂️ การแบ่งหน้าที่เอกสาร (Knowledge Vault Matrix)

เอกสารแต่ละส่วนถูกแบ่งหน้าที่อย่างชัดเจนเพื่อความเป็นสัดส่วน:

| เอกสาร | หน้าที่และภาระการทำงาน (Domain Responsibility) |
|---|---|
| 📌 **[README.md](README.md)** | **Executive Butler Dashboard:** สรุปภาพรวม สถานะปัจจุบัน ลิงก์ดรรชนี และคำสั่งรันงาน |
| 📋 **[documents/tasks.md](documents/tasks.md)** | **Task Backlog & Intake:** รายการงาน สถานะ (`In Progress`, `Done`) และประเด็นรอการยืนยัน |
| 🎨 **[documents/design.md](documents/design.md)** | **Master Design Constitution:** กฎหมายการออกแบบ ฟอนต์ สี แถบไฮไลท์ และการ Crop รูป |
| 🏗️ **[documents/architecture.md](documents/architecture.md)** | **Architecture Blueprint:** โครงสร้างทางเทคนิค Stack, Auth, APIs และ Database |
| 📜 **[documents/audit-log.md](documents/audit-log.md)** | **Audit Trail & History Ledger:** บันทึกว่าใครสั่ง ใครทำ เมื่อไร แก้ไฟล์ใด และปัญหาที่พบ |
| 🧪 **[evidence/uat-checklist.md](evidence/uat-checklist.md)** | **UAT & Regression Ledger:** ตารางทดสอบระบบ UAT และบันทึกประวัติการแก้ Defect |
| 💡 **[documents/decisions.md](documents/decisions.md)** | **Decision Log:** บันทึกข้อตัดสินใจทางเทคนิคและสถาปัตยกรรม (D-001..D-003) |
| 🗺️ **[documents/00-index.md](documents/00-index.md)** | **Knowledge Map Index:** แผนที่ความรู้หลักสำหรับ Obsidian Vault |

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
