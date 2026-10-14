# Design
## Related
- [[00-index]]
- [[prd]]
- [[architecture]]
## Style Direction
minimalist
## Brand Tone
Clear, trustworthy, and modern ไม่เยิยเย้อ + ไม่ใช้ข้อความอธิบายเยอะ + โปร่งเบา
## Responsive Requirement
desktop-first
## Accessibility Needs
# คู่มือโครงสร้าง สถาปัตยกรรม และหลักเกณฑ์มาตรฐานฉบับสมบูรณ์ (Master Technical Manual & Skill Architecture Blueprint)
## Skill Package: `$gdoc-exam-formatter` (QuizFlow Document Engine)

เอกสารนี้จัดทำขึ้นเพื่อเป็น **แหล่งอ้างอิงเชิงลึกสูงสุด (Supreme Reference Specification)** สำหรับถ่ายทอดโครงสร้างการทำงาน หลักเกณฑ์ สถาปัตยกรรมซอฟต์แวร์ และเทคนิคความซับซ้อนทั้งหมดของ Skill `$gdoc-exam-formatter` เพื่อให้ AI เอเจนต์และวิศวกรซอฟต์แวร์เข้าใจ ปรับปรุง และปฏิบัติตามได้อย่างแม่นยำ 100% โดยไม่มีข้อผิดพลาด

---

## 1. ปรัชญาการออกแบบและสถาปัตยกรรม (Design Philosophy & Architecture)

### 1.1 คัมภีร์สูงสุด (Supreme Constitution)
การแปลงเอกสารข้อสอบทั้งหมดของระบบ **QuizFlow** ยึดถือโครงสร้างตามแม่แบบทางการ (Official QuizFlow Template) เป็น **กฎหมายสูงสุดที่ไม่สามารถละเมิดได้**:
* **URL อ้างอิงแม่แบบ:** `https://docs.google.com/document/d/1uA8A1Q1lXCDIGRPtgBA0H77xYoMWCoo7thp5Hi0nvBQ/edit?tab=t.0`

### 1.2 สัญญาการพกพาและการรันในสภาพแวดล้อมเฉพาะ (Portability & Localhost-Only Discipline)
1. **พกพาไปกับ Git Repository:** ตัว Skill ทั้งหมดจัดเก็บอยู่ที่ `skills/gdoc-exam-formatter/` ภายในโปรเจกต์ QuizFlow เพื่อให้ใช้งานได้ทันทีหลังรัน `git pull` ในทุกเครื่อง
2. **Preflight Guard (`scripts/ensure-gdoc-exam-formatter-project-local.ps1`):** ต้องรันสคริปต์ Preflight ตรวจสอบความสมบูรณ์ของไฟล์ใน Package และคำนวณ Fingerprint Hash (`SHA-256`) ก่อนเริ่มงานเสมอ หากพบว่าไฟล์ไม่ครบ Stale หรือดึงมาจากแคชภายนอก ระบบจะระงับการทำงานทันที
3. **Localhost-Only Rule:** ห้ามรันการตัดต่อ/ทดสอบขึ้นเซิร์ฟเวอร์ภายนอก ทำงานบน Local Environment (localhost:3000 / local script) 100%

---

## 2. โครงสร้างภายในของ Skill Package (Package Anatomy)

```text
skills/gdoc-exam-formatter/
├── SKILL.md                                  # ระบบคำสั่งหลัก กฎการสร้างเอกสาร และ Supreme Constitution
├── README.md                                 # วินัยการใช้งาน การรัน Preflight และนิยามความพร้อมพกพา
└── references/
    ├── image-crop-and-conversion-rules.md   # กฎการ Crop รูป การแยก Owner และการเคลียร์ขอบ 4 ด้าน
    ├── lessons-learned.md                    # บทเรียนถาวรจากการใช้งานจริง (Lesson 1 ถึง Lesson 41)
    └── media-contract.md                     # ข้อตกลง UAT Test Scenarios (UAT-IMP-01 ถึง UAT-IMP-41)
```

---

## 3. สรุปความสามารถหลัก (Core Capabilities)

| ความสามารถ (Capability)                 | รายละเอียดและการทำงาน                                                                                                                                                                                               |
| :-------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **1. Multi-Format Input Support**       | รองรับการอ่านไฟล์ต้นฉบับได้ 5 รูปแบบ: (1) PDF แสกน/เวกเตอร์ (2) Scanned OCR Images (3) Binary DOCX (Unpack XML) (4) Markdown `.md` (5) Google Doc HTML/TXT Export                                                   |
| **2. Full Boxed Frame Image Capture**   | Capture รูปโจทย์ ตารางโจทย์ แผนภาพ หรือกรอบสี่เหลี่ยม (`กรอบปิดสี่เหลี่ยม`) แบบสมบูรณ์ 100% รวมเส้นขอบทุกด้าน ป้องกันปัญหาตารางแตกข้ามหน้าใน Google Docs                                                            |
| **3. Clean Edge Sweeping Clearance**    | อัลกอริทึมสแกนพิกเซลขอบ 4 ด้าน (Top, Bottom, Left, Right) เพื่อรับประกันค่าความสว่าง Grayscale >= 240 (สีขาวบริสุทธิ์) พร้อมระยะเว้นขอบ 3px รอบรูป (`status=CLEAN`)                                                 |
| **4. Dual-Color Answer Shading**        | ไฮไลท์สีพื้นหลังของพารากราฟตัวเลือกที่ถูกต้องแบบ 2 ระดับ: <br>• **สีเขียวอ่อน (`#E6F4EA`)**: สำหรับ เฉลยจากต้นฉบับ (`source_provided`) <br>• **สีเหลืองอ่อน (`#FFF4CC`)**: สำหรับ เฉลยด้วย AI/Skill (`auto_solved`) |
| **5. Master Answer Key Reconciliation** | ระบบกระทบยอดเฉลยอัตโนมัติ หากดอกจันในโจทย์พิมพ์ผิด/ตกหลุม ระบบจะอ่านข้อความใน `คำอธิบาย:` (เช่น `ตอบ ข้อ ก.`) แล้วปรับปุ่มเฉลยให้ถูกต้อง 100%                                                                       |
| **6. Artifact Generation Suite**        | สร้างชุดไฟล์ผลลัพธ์ครบวงจร: ไฟล์ DOCX Native, Manifest JSON, Markdown Summary และ Link Registry (`links.json`)                                                                                                      |

---

## 4. หลักเกณฑ์มาตรฐานด้านการจัดรูปแบบ (Formatting Rules & Layout Standards)

### 4.1 กฎด้าน Typography และสี (Universal Styling Rules)
1. **Sarabun Font Size 12pt:** ทุกองค์ประกอบในเอกสาร (เลขข้อ, โจทย์, ตัวเลือก, คำอธิบาย, ป้ายกำกับรูป, ดอกจัน) ต้องใช้ขนาด **12pt (`Pt(12)`) บาง** เท่านั้น
2. **Unified Tone Orange (`#F2604D`):** ข้อความทุกอย่างที่เป็นสีส้ม ต้องใช้รหัสสี **`#F2604D`** และ **ต้องเป็นตัวหนาอัตโนมัติ (`bold=True`)** ได้แก่:
   - เลขข้อโจทย์: **`N. `**
   - เครื่องหมายดอกจันเฉลย: **` *`**
   - ป้ายกำกับรูปโจทย์: **`[รูปโจทย์]`**
3. **Stormy Teal (`#006D77`):** ป้ายกำกับหัวข้อสเปกตรัม ใช้สีฟ้าเข้มอมเขียว ตัวหนา 12pt ได้แก่:
   - ป้ายกำกับตัวเลือก: **`ตัวเลือก:`**
   - ป้ายกำกับคำอธิบาย: **`คำอธิบาย:`**
   - ป้ายกำกับโจทย์ร่วม: **`โจทย์ร่วม `** และ **`จบโจทย์ร่วม`**
4. **Pure Black (`#000000`):** ข้อความเนื้อหาโจทย์ ตัวเลือกปกติ และคำอธิบาย ใช้สีดำ 12pt ตัวบาง (`bold=False`)

### 4.2 ลำดับการจัดวางพารากราฟโจทย์ (Standard Question Layout Sequence)
สำหรับทุกๆ ข้อสอบในเอกสาร ต้องเรียงลำดับพารากราฟดังนี้:
1. `[เว้น 1 บรรทัดก่อนเริ่มข้อใหม่]`
2. **`N. `** (สีส้มหนา) + **เนื้อหาโจทย์ส่วนแรก** (สีดำบาง)
3. `[เว้น 1 บรรทัด]` (หากมีรูปภาพ)
4. **`[รูปโจทย์]`** (สีส้มหนา)
5. **รูปภาพ Image Crop** (จัดวางกลางหรือกึ่งกลางความกว้าง 3.2-5.2 นิ้ว)
6. **เนื้อหาโจทย์ส่วนหลังรูป** (ถ้ามี)
7. `[เว้น 1 บรรทัด]`
8. **`ตัวเลือก:`** (สี Teal หนา)
9. รายการตัวเลือก **`ก. `**, **`ข. `**, **`ค. `**, **`ง. `** (พร้อมแถบสี `#E6F4EA` หรือ `#FFF4CC` ในข้อที่ถูก)
10. `[เว้น 1 บรรทัด]`
11. **`คำอธิบาย:`** (สี Teal หนา)
12. **เนื้อหาคำอธิบาย** (สีดำบาง)

---

## 5. เจาะลึกความซับซ้อนในแต่ละ Feature (Deep Technical Feature Mechanics)

### Feature A: อัลกอริทึมตรวจจับขอบรูปภาพและการเคลียร์ขอบ 4 ด้าน (Auto-Trim & 4-Side Perimeter Sweeping)
* **ปัญหาที่พบ:** การ Crop รูปตารางหรือกรอบแผนภาพมักประสบปัญหา 2 แบบ: (1) เส้นขอบตารางถูกตัดขาดเนื่องจาก Crop แนบชิดเกินไป (2) ตัวหนังสือโจทย์ข้างเคียงหลุดเข้ามาในรูป
* **วิธีแก้และอัลกอริทึมเชิงลึก:**
  ```python
  # 1. แปลงรูปเป็น Grayscale และสร้าง Mask ตรวจจับพิกเซลเข้ม (RGB < 220)
  crop_sub = page_img.crop(search_bbox)
  arr = np.array(crop_sub.convert("L"))
  dark_mask = arr < 220

  # 2. หาขอบเขต Bounding Box จริงของตัววัตถุ/กรอบตาราง
  rows = np.any(dark_mask, axis=1)
  cols = np.any(dark_mask, axis=0)
  rmin, rmax = np.where(rows)[0][0], np.where(rows)[0][-1]
  cmin, cmax = np.where(cols)[0][0], np.where(cols)[0][-1]

  # 3. ตัดส่วนวัตถุและสร้าง Canvas สีขาวบริสุทธิ์ (255, 255, 255) ขยายออก 4px
  trimmed = crop_sub.crop((cmin, rmin, cmax + 1, rmax + 1))
  w, h = trimmed.size
  pad = 4
  final_crop = Image.new("RGB", (w + pad * 2, h + pad * 2), (255, 255, 255))
  final_crop.paste(trimmed, (pad, pad))

  # 4. ตรวจสอบ 4-Side Perimeter Clearance (ขอบพิกเซลรอบนอกสุดต้อง > 245 ทั้งหมด)
  carr = np.array(final_crop.convert("L"))
  t_clean = np.all(carr[0, :] > 245)
  b_clean = np.all(carr[-1, :] > 245)
  l_clean = np.all(carr[:, 0] > 245)
  r_clean = np.all(carr[:, -1] > 245)
  status = "CLEAN" if (t_clean and b_clean and l_clean and r_clean) else "DIRTY"
  ```
* **ผลลัพธ์:** ได้รูปภาพที่มีขอบตารางสมบูรณ์ ไม่ถูกตัดขาด มีพื้นที่สีขาวสะอาดรอบรูป 4px และผ่านการรับรอง `status=CLEAN` 100%

---

### Feature B: ระบบป้องกันโจทย์หลอกในการรีเซ็ตเลขข้อและการใส่เลขข้อย่อย (Multi-Set Restart Parser & Nested Number Guard)
* **ปัญหาที่พบ:** 
  1. เอกสารชุดใหญ่มักแบ่งเป็น "ชุดที่ 1 (ข้อ 1-50)" และ "ชุดที่ 2 (ข้อ 1-50)" ตัว Parser ทั่วไปจะเข้าใจผิดว่าข้อ 1 ของชุดที่ 2 เป็นเนื้อหาของข้อ 50 ในชุดแรก
  2. ในเนื้อหาคำอธิบาย มักมีการเขียนข้อความแบบรายการ เช่น `1. กลูโคส ... 2. ฟรุกโตส ...` ตัว Parser เดิมจะตัดแบ่งคำอธิบายหลุดออกมากลายเป็นข้อใหม่ที่ไม่มีตัวเลือก (เกิด Phantom ERROR Items)
* **วิธีแก้และอัลกอริทึมเชิงลึก:**
  - **State Machine tracking:** ติดตามสถานะ `isInsideExplanation` และ `lastQuestionNum`
  - **Section Reset Detector:** ตรวจจับบรรทัดหัวข้อด้วย Regex `/^\s*(?:ชุด|ตอน|แบบทดสอบ|ข้อสอบ)\s*(?:ที่)?\s*\d+/i` เพื่อรีเซ็ตค่า `lastQuestionNum = 0`
  - **Explanation Guard:** หากพบบรรทัดที่ขึ้นต้นด้วย `N.` ขณะที่ `isInsideExplanation == True` ระบบจะไม่ตัดเป็นข้อใหม่ เว้นแต่จะมีวงเล็บ `[ข้อที่ N]` ชัดเจน

---

### Feature C: การ Unpack ไฟล์ Binary DOCX และถอดรหัสรูปภาพด้วย JSZip
* **ปัญหาที่พบ:** ไฟล์ `.docx` เป็นไฟล์บีบอัด zip หากอ่านไฟล์ตรงๆ ด้วย `readAsText()` จะได้ไบนารีขยะ (`PK\x03\x04...`) และรูปภาพภายในเอกสาร (`word/media/image1.png`) จะสูญหายทั้งหมด
* **วิธีแก้และอัลกอริทึมเชิงลึก:**
  1. ใช้ `JSZip` อ่านโครงสร้าง ZIP ภายในเบราว์เซอร์หรือ Node.js
  2. แกะข้อความจาก `word/document.xml`
  3. สแกนความสัมพันธ์ใน `word/_rels/document.xml.rels` เพื่อจับคู่ `r:embed="rIdX"` กับไฟล์รูปใน `word/media/*`
  4. แปลงไฟล์ไบนารีรูปภาพเป็น **Base64 Data URI** (`data:image/png;base64,...`) แล้วนำไปแทรกในข้อสอบตรงตำแหน่ง `<w:drawing>` หรือ `<v:imagedata>` อัตโนมัติ

---

### Feature D: อัลกอริทึมกระทบยอดเฉลยและตรวจสอบความถูกต้องของคำตอบ (Answer Key Auto-Reconciliation Guard)
* **ปัญหาที่พบ:** ดอกจันเฉลยในเอกสารต้นฉบับพิมพ์ผิดตำแหน่ง (เช่น พิมพ์ดอกจันไว้ที่ข้อ ข. แต่คำอธิบายพิมพ์ว่า `เฉลย: ตอบ ข้อ ก.`)
* **วิธีแก้และอัลกอริทึมเชิงลึก:**
  ```python
  # ตรวจหาตัวเลือกที่ระบุในข้อความคำอธิบาย
  match = re.search(r'(?:ตอบ|เฉลย)\s*(?:ข้อ)?\s*([ก-งA-D1-4])', explanation_text)
  if match:
      exp_answer_key = convert_to_standard_key(match.group(1))
      if exp_answer_key != choice_asterisk_key:
          # ทำการ Reconcile ปรับเฉลยให้ตรงกับคำอธิบายเชิงลึก
          final_answer_key = exp_answer_key
          provenance = "reconciled_from_explanation"
  ```

---

### Feature E: การถอดรหัสรหัสเอนทิตี HTML ภาษาไทย (Numeric HTML Entity Decoder)
* **ปัญหาที่พบ:** เมื่อทำการ Export เอกสารจาก Google Docs เป็น HTML (`/export?format=html`) ข้อความภาษาไทยและสัญลักษณ์พิเศษจะถูกแปลงเป็นรหัสตัวเลข decimal เช่น `&#3605;&#3633;&#3623;&#3648;&#3625;` (`ตัวเลือก:`) ทำให้ Regex ทั่วไปหาคำว่า "ตัวเลือก:" ไม่เจอ
* **วิธีแก้และอัลกอริทึมเชิงลึก:**
  ```javascript
  function decodeHtmlEntities(str) {
    return str
      .replace(/&#(\d+);/g, (match, dec) => {
        const code = parseInt(dec, 10);
        return code >= 0 && code <= 0x10ffff ? String.fromCodePoint(code) : match;
      })
      .replace(/&#x([0-9a-f]+);/gi, (match, hex) => {
        const code = parseInt(hex, 16);
        return code >= 0 && code <= 0x10ffff ? String.fromCodePoint(code) : match;
      });
  }
  ```

---

## 6. วงรอบการทำงานและการประกันคุณภาพ (Quality Assurance & Definition of Done)

กระบวนการแปลงเอกสารแต่ละ Pass จะไม่ถือว่าเสร็จสิ้น (Done) จนกว่าจะผ่านขั้นตอนประกันคุณภาพตามเกณฑ์ต่อไปนี้:

1. **Preflight Pass:** รัน `scripts/ensure-gdoc-exam-formatter-project-local.ps1` ผ่าน 100%
2. **Artifact Verification:** เกิดไฟล์ผลลัพธ์ครบ 4 รายการในระบบ:
   - ไฟล์ `.docx` ที่สร้างขึ้น
   - ไฟล์ `.manifest.json` ที่บันทึกโครงสร้างข้อสอบ
   - ไฟล์ `.md` ที่เป็นสรุปผลการแปลง
   - ไฟล์ `links.json` ที่อัปเดตลงทะเบียนลิงก์
3. **Knowledge Vault Sync:** อัปเดตเอกสารองค์ความรู้ในโปรเจกต์ QuizFlow ให้ตรงกัน:
   - `documents/tasks.md` (เลื่อนสถานะเป็น Done)
   - `documents/decisions.md` (บันทึก Decision ID ใหม่)
   - `documents/memory.md` (บันทึก Durable Context)
   - `documents/code-map.md` และ `documents/traceability.md`
4. **Completion Gate:** รันสคริปต์ `node scripts/finish-task.mjs <TASK_ID>` และได้รับสถานะ exit code 0 โดยไม่มีข้อผิดพลาด Lint, Typecheck หรือ Unit Tests ตกแม้แต่รายการเดียว
## T-039 OCR workflow UX
- The import flow is treated as three visible states: OCR raw, review/validate, and format/edit.
- Raw OCR is evidence and must remain inspectable; formatting success is only shown after structural validation.
- Incomplete questions or choices use a review state and never become fabricated placeholder content.

### OCR intermediate review stage (T-040)
Scanned documents move through two visible stages: (1) provider OCR returns raw page text, which remains reviewable in the right pane even when structural validation fails; (2) only validated question items enter the formatted editor and export path. This keeps OCR evidence inspectable while preserving fail-closed behavior.

## Source-faithful OCR review (T-039/T-040)
- Raw OCR is edited in a dedicated textarea; explicit re-conversion runs shared validation. Missing/duplicate choices and ambiguous labels are reported by question number. Review text cannot enter Drive export.
- lib/exam-validation.ts checks structure only; four choices do not prove text accuracy. No X/handwritten mark is inferred as an answer. Table context remains review-required.
- Parser expands explicitly labeled table rows, preserving cell data; A/B/C measurement tables stay stem data. No synthetic fallback questions are created for unparseable imports.
- Stale OCR responses are ignored after changing/resetting the source document. Editing/re-conversion does not call OCR again, reducing latency and provider usage.
- Verification: scripts/test-ocr-contract.cjs regression tests; evidence/t040-review-browser.png browser PDF import and rejected re-conversion. Full PDF source fidelity/media mapping remains open.

T-039 OCR reliability: batches over 10 pages reject before provider invocation; request timeout is 120s remote/300s local per attempt; concurrency is finite integer 1-2; truncated text remains available for review but cannot mark all pages successful. Review conversion cannot bypass incomplete page coverage. Owner Codex. Regression: scripts/test-ocr-contract.cjs.

T-041: source-verified 25-question artifact, explicit inline Markdown/data-image ownership and sparse question-N media. Existing R-002/R-004 Feature Notes apply. Figure descriptions remain review markers until original media is attached; checked boxes do not imply answers. Tables preserve column labels. Source-page buttons are excluded from export. Snapshot scaling preserves image aspect ratio. Evidence: evidence/t041-browser-result.json, evidence/t041-media-manifest.json, evidence/t041-source-review.html. Automatic OCR still requires review for overwritten labels/spelling.

T-041/T-042 final verification: original PDF import -> exact SHA-256 reviewed corpus -> 25 questions/100 choices/5 source-owned media -> editor -> source-page navigation -> live DOM snapshot -> native Google Docs. Source page is captured when each question starts, preventing prior-page questions shifting forward. Unknown/changed files use ordinary OCR; no approximate filename match or learned answer inference. Corpus is data under public/reviewed and includes reviewer, source hash/page count and text. Live PDF import: 3.577s, zero OCR calls. Remote OCR baseline: 13.8s, recognition defects retained for review. All seven native PDF pages visually checked after grouped pagination repair. Readback: evidence/t041-gdoc-readback.json. Browser: evidence/t042-real-pdf-result.json. Google URL: https://docs.google.com/document/d/1r5CWTFdiQE98JAmSgRMNnNh1WKLIuJzqI4vVwZOCfIY .

T-045 UX: header statistics button downloads JSON with raw run metadata and grouped medians; accessible icon-only at small widths. Storage failure is visible without breaking import or erasing history. New unknown image: upload -> OCR -> validated editor OR editable raw text -> explicit check/format. No new mandatory step before trying files.

T-046: failed OAuth shows actionable recovery for missing/expired/mismatched state, cancellation, scope and exchange errors. User starts again via Connect Google on canonical origin in same browser; pasted callback is not a login entrypoint.

T-047 UX: user imports once even above ten pages; automatic OCR batch progress appears in status notice. Actual HTTP/provider error is shown instead of instructions to edit nonexistent raw text. Successful structure still requires source review. A failed page prevents readiness and retains available text.

T-048: source navigation row lives between original-file toolbar and document pane; numbered buttons, current page/count and previous/next remain visible. Numbers scroll horizontally within pane on narrow screens; aria-current=page and accessible button names support keyboard use. Existing question source-page buttons call the same navigation.

T-049: animated scan card appears only while OCR is pending, with actual batch completion count; no premature needs-review warning. Original-side action bar offers Convert to exam format using edited right-side raw text, disabled pending/incomplete/no-text/already formatted. Right review button retains same validation and explains it does not reread images. After valid OCR automatic format, source action says already formatted; user edits right editor then exports.

### T-050 Explicit conversion workspace
T-050: left raw OCR/text -> explicit conversion -> editable formatted questions/style/images -> export; right original stays read-only and independent, with crop tools. Small question-number navigation scrolls left only. Import-history icon stores the latest 100 filenames/times/sizes locally; no source contents or reopen storage, no reconstruction of older anonymous statistics.
Requirement: R-001 / R-002 -> Task: T-050 -> Feature Note: features/r-001-browser.md and features/r-002-feature.md -> Code Map: app/page.tsx, components/SplitDocumentEditor.tsx, components/RichTextToolbar.tsx, lib/import-history.ts -> Verification: evidence/t050-verification.md.
This explicit user flow supersedes T-049 automatic formatting and T-048 main page-number navigation. Source page references remain available for explicit comparison. Only answers actually supplied by the source are preserved; T-039 semantic OCR fidelity and T-044 resumable raw-page storage remain open.

### T-051 Compact source-left workspace
T-051 supersedes T-050 panel positions: original/capture LEFT, OCR/explicit conversion/edit/export RIGHT. Source is independent; question navigation affects editor only. Source magnify/crop and editor insert/copy/export actions use icons with accessible names/title hints and active/disabled states; compact one-row toolbar, 12 pt badge, shortened OCR heading, secondary guidance hidden from visual toolbar. Conversion stays explicit and prominent. Source recognition/answer rules unchanged. Requirement R-001 -> T-051 -> features/r-001-browser.md -> SplitDocumentEditor/RichTextToolbar -> evidence/t051-verification.md.

### T-052 Table-choice layout and source-answer directives
T-052: numbered stem steps retain explicit line breaks including the following prompt; editor renders BR so live snapshot exports real paragraphs. Flattened table choice label prefixes before colons are underlined without HTML injection; values/separators remain literal. Explicit source answer directives accept colon/fullwidth colon, reconcile explanation ahead of source asterisk, and conflicting explicit keys remain unresolved. Existing orange star and green source shading appear immediately when converting. No inferred answers from handwriting, table ticks, absent answers or invalid choice keys. R-002/R-004 -> T-052 -> features/r-002-feature.md -> lib/exam-parser.ts and SplitDocumentEditor.tsx -> evidence/t052-verification.md.

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

### Local comparison T-058
Pilot compares qwen3-vl2b/4b locally without changing production. Existing source PNGs page1/page3 visually reviewed; truth labels are visible red annotation selections, NOT verified subject-answer correctness. Page1 truth1ก2ก3ง4ค5ง6ง; page3 truth11ง12ง13unmarked14ก15ข16ก17ข18ง19ค20ก. Sixteen unique questions with15 marked and1 abstention control; cold page1, warm page3, repeated warm page1 per model. Same source hashes/prompt/settings; precision/recall/wrong/missing/false-positive reported separately before and after existing0.95/bbox guards. Ollama /api/ps model residency and VRAM counters are sampled, not total process/system peak RAM. Evidence and raw responses retained under evidence/t058-local; scripts/benchmark-local-vision.cjs owns evaluation. Model downloads authorized by user; benchmark pending downloads. R-002/R-004 -> T-058 -> features/r-002-feature.md -> benchmark script -> actual local result files and comparison report. Pilot cannot certify production readiness, full-document conversion or general Thai OCR accuracy. T-057 Gemini still unchanged.

T-058 clarification: project owner directly confirmed on2026-10-12 that the tested red marks are teacher answers rechecked for correctness. For these fixture hashes only, the benchmark truth is a visually transcribed, teacher-verified key. Previous annotation-only caveat is superseded for this source, not for arbitrary future imports. Both candidate prompts use this same confirmation and still forbid solving or inventing answers. Independent auditor reviewed evaluator/comparison fairness; completeness, invalid rows, shared fingerprint, error exit and unobserved-memory guards now covered by tests. New evaluator wired into npm test. Model inference results still pending download; never report a winning model without actual matching-condition results.

T-058 final pre-inference dataset: expanded from2pages/16questions to3pages/20questions before any candidate inference, specifically including previously difficult table/diagram page2. Ground truth:19 teacher-marked answers and1 no-unique-choice control (Q13 Free). Pages1,2,3 plus repeated page1 for warm timing;4 runs/model. Both models receive actual reviewed question stems/keys matching production request fields, with no truth key leaked in requests. Preflight: node scripts/benchmark-local-vision.cjs qwen3-vl:2b --preflight passed20questions19marked; fixtures.json captures image hashes and owner confirmation. Completeness and denominators derive from manifest, not hardcoded reduced counts. This supersedes earlier16-question design notes. Await both downloads before timing; no production switch.

T-058 ROI verification checkpoint (2026-10-12): owner confirms teacher-rechecked red circles/crosses for this fixture. Visually inspected all three QA contact sheets: 20 question-owned original-pixel crops,19 marked keys and Q13 Free/no unique choice. QA labels are excluded from inference images. Experimental native loopback HTTP NDJSON transport added (scripts/local-vision-http.cjs); guards tested for UTF8, final metadata, incomplete stream, provider error and loopback-only scope. Metrics now match case IDs rather than first matching page, preventing repeated-page ROI truth contamination. Initial cropped 2B response completed in63.348s but captured empty content; preserved evidence/t058-roi/initial-stream-empty.json, no accuracy certification. Raw stream capture added for diagnosis. Both full-page failed baselines remain in evidence/t058-local. T-058 remains In Progress; production Gemini provider unchanged. Final actual comparison and finish-task gate pending.
T-058 runtime diagnosis: actual stream evidence shows schema JSON wholly in message.thinking with empty content despite thinkfalse. Diagnostic fallback is strictly JSON-only and experiment-only; preserve channel/chunks, never integrate as production response. First diagnostic2B q1 selected ข incorrectly with confidence0.95 (teacher truth ก); confidence alone unsafe. Transport tests passed. Evidence diagnostic-thinking-channel.json, ROI outputs. Full20case comparison ongoing.

---

## 5. กฎและมาตรฐานการออกแบบ UI ธีม Earth Tone (Earth-Tone Design System - Rose Benedict Reference)

เพื่อรักษาความสอดคล้องด้านการออกแบบและการพัฒนาในอนาคต (Consistency & Maintainability) ระบบ AI Exam Formatter กำหนดใช้โทนสีและหลักการออกแบบตามแนวคิด Earthy Tones (อ้างอิง: Rose Benedict Design - `https://rosebenedictdesign.com/`):

### 5.1 จานสีหลัก (Core Color Palette Tokens)
1. **Deep Olive Green (`#496053`):**
   - **บทบาท:** สีหลักของระบบ (Primary Brand / Dominant Action)
   - **การใช้งาน:** ปุ่มแอ็กชันหลัก (Primary Actions เช่น จัดรูปแบบ, แปลงเป็นข้อสอบ), แถบหัวข้อสำคัญ, ไอคอนและองค์ประกอบเด่น
   - **ความรู้สึก:** สุขุม หนักแน่น เป็นธรรมชาติ สะท้อนความน่าเชื่อถือระดับมืออาชีพ
2. **Warm Terracotta / Ocher / Muted Gold (`#b3996a`):**
   - **บทบาท:** สีรองและสีเน้นจุดสนใจ (Secondary Accent / High-Priority Indicator)
   - **การใช้งาน:** ปุ่มกู้คืนด่วน (เช่น "สร้างแบบร่างข้อสอบทันที"), กรอบแว่นขยาย Optical Lens, ป้ายไฮไลท์สำคัญ, สถานะกำลังรอ/แจ้งเตือนพิเศษ
   - **ความรู้สึก:** อบอุ่น มีมิติ สร้างความโดดเด่นแต่กลมกลืนกับธรรมชาติ ไม่ฉูดฉาดแบบสีนีออน
3. **Warm Beige / Soft Sand / Cream Alabaster (`#eae8e1` / `#f7f6f2`):**
   - **บทบาท:** สีพื้นหลังและแผ่นรอง (Surface & Canvas Neutrals)
   - **การใช้งาน:** พื้นหลังหลักของหน้าเว็บ (`--background: #f7f6f2`), กรอบการ์ดข้อมูล, แถบสถานะย่อย, และพื้นที่พักสายตา
   - **ความรู้สึก:** สบายตา ไม่สว่างจ้าหรือขาวบริสุทธิ์แบบกระดาษขาว ช่วยลดความล้าของสายตาเมื่อตรวจข้อสอบนานๆ
4. **Deep Charcoal / Earth Olive Dark (`#28332d` / `#1f2723`):**
   - **บทบาท:** สีตัวอักษรหลัก (Primary Typography)
   - **การใช้งาน:** หัวข้อ, ข้อความโจทย์, ตัวหนังสือทั่วไป
   - **ความรู้สึก:** คมชัด อ่านง่าย มีคอนทราสต์ที่ผ่านเกณฑ์ WCAG AA แต่ไม่กระด้างเท่าสีดำสนิท (`#000000`)
5. **Warm Border & Divider (`#dedad0` / `#d2cdbf`):**
   - **บทบาท:** เส้นขอบและการแบ่งสัดส่วน (Subtle Framing)
   - **การใช้งาน:** เส้นแบ่งระหว่าง Split View, ขอบแผงเครื่องมือ, ขอบการ์ด

### 5.2 กฎการออกแบบ UI Components & Interaction
1. **ความโค้งมน (Border Radius):** ใช้ความโค้งมนระดับมนปานกลาง (`rounded-lg` ถึง `rounded-xl`) ให้ความรู้สึกเป็นมิตรและเป็นธรรมชาติ
2. **เงาและมิติ (Elevation & Shadows):** ใช้เงาที่โปร่งแสงและนุ่มนวล (`shadow-xs` ถึง `shadow-sm` ผสมโทนสีดิน) หลีกเลี่ยงเงาดำเข้ม
3. **โฟกัสและการตอบสนอง (Focus Rings):** ทุกปุ่มและอินพุตเมื่อถูกโฟกัสด้วยคีย์บอร์ด (`focus-visible`) ต้องแสดงเส้นขอบสี `#b3996a` หรือ `#496053` ที่คมชัด 2-3px เพื่อมาตรฐาน Accessibility

### 5.3 กฎการประมวลผลและการจัดลำดับ Cascade Fallback (Processing Contract)
ระบบประมวลผลเอกสารต้องยึดถือลำดับ 4 ขั้นตอนอย่างเคร่งครัด:
1. **Tier 1 - Digital PDF First (0.1s):** หากไฟล์มีข้อความดิจิทัลที่สกัดได้และมีโจทย์ครบถ้วน ให้เปิดใช้งานทันที ไม่เรียก OCR
2. **Tier 2 - Cloud OCR:** หากเป็นภาพสแกนหรือไม่มีข้อความ ให้เรียกใช้ Cloud OCR (Typhoon/Gemini)
3. **Tier 3 - Auto Local OCR Failover:** หาก Cloud OCR ขัดข้อง (`fetch failed`, Connection reset) ให้สลับไปเรียก Local OCR (Ollama ในเครื่อง) อัตโนมัติ
4. **Tier 4 - Graceful Manual Fallback:** หาก Local OCR ไม่พร้อม ให้แสดงกล่องเตือนสี Earth-Tone พร้อมปุ่ม 1-Click "สร้างแบบร่างข้อสอบทันที (เน้นความเร็ว)" และ "ดึงข้อความดิจิทัลเดิม" เพื่อให้ผู้ใช้ทำงานได้เสมอโดยไม่มี Deadlock

### 5.4 กฎธีมสำหรับ Modal และ Draft/Cache Controls
- Modal, drawer, และ history surfaces ต้องใช้พื้น `#fdfdfc` หรือ `#f7f6f2`, border `#dedad0`, และข้อความหลัก `#28332d`; หลีกเลี่ยง white/slate-only panels ที่ดูหลุดจากระบบ
- Primary action ใน modal ใช้ Deep Olive `#496053`; destructive/clear actions ใช้ Terracotta `#F2604D` แบบ restrained พร้อมพื้นโปร่ง ไม่ใช้ red/rose palette ลอย ๆ
- Badge สถานะสำเร็จหรือพร้อมใช้งานใช้ olive-tinted surface (`#eef5f2`, `#496053`) แทน emerald generic เว้นแต่เป็น semantic state ที่ต้องคงความหมายด้าน accessibility
- Draft/cache controls ต้องสื่อว่า “เปิดทำต่อ” เป็น continuation ของงาน ไม่ใช่ import ใหม่หรือ OCR ใหม่


### T-066 Blueprint parity notes
OCR text is normalized before question parsing so diacritic/front-vowel spacing repairs cannot change question boundaries. Repairs are conservative and preserve unknown `�` corruption for review. `คำตอบ:` and `Answer:` are visible answer evidence but do not override conflicting explicit keys. Matrix-table rendering, shared-context ownership, crop edge clearance, and QuizFlow output manifests remain partial/unknown until real source fixtures are available. See `evidence/t066-blueprint-parity.md`.

### T-068 image/PDF flow
The source pane remains the stable reference image/PDF. Import can render scanned PDFs locally, OCR is reviewed as editable raw text, then explicit conversion creates editable questions. The browser must never silently treat a worker-load failure as an OCR accuracy failure; local pdf.js assets and visible error state keep this boundary diagnosable.

### T-069 long scanned exam layout
Long scanned documents keep the original page pane independent while the editor navigation reflects every parsed source question. A figure marker is converted to a page-owned `[รูปโจทย์]` image when a page image is available. Answer state remains explicit: source text/asterisk is shown as source evidence; ambiguous handwriting or unavailable Vision responses remain unresolved.
