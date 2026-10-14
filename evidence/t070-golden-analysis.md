# T-070 QuizFlow Golden Output & Source Analysis (Chapter 7 Separation Exam)

## 1. Document Provenance & Evidence Check
- **Source PDF**: `media_1791938569863_98eb2182.pdf` ("บทที่ 7 ชุดที่ 1 เรื่อง การแยกสาร.pdf")
  - Page Count: 13 pages
  - File Size: 3,149,425 bytes
  - SHA-256: `4d46497721a7fd8e3edc0242e7b3cbb35ac08609b6ad46b7626d9ce80279a018`
  - Content Type: Scanned image PDF (digital embedded text characters = 0 on all 13 pages)
- **Expected Golden Output (QuizFlow Google Doc)**:
  - Source URL: `https://docs.google.com/document/d/1wyAaKDjHQM8lYqhwXqGX7fJgXZ8FZ1Xa/edit`
  - Exported Text: `evidence/golden-output-ch7.txt` (37,960 bytes, 747 lines)
  - Total Questions: 80 questions (Q1 to Q80)
  - Question Numbering: Strictly sequential 1 to 80 (monotonic sequence, zero missing numbers)
  - Parser Compatibility Test: `parseExamText` in `lib/exam-parser.ts` parsed 80/80 questions (100%), 0 missing choices, 80 correct choices identified.

## 2. Parity & Feature Analysis Matrix

| มิติการจัดรูปแบบ / คุณสมบัติ | ผลลัพธ์ QuizFlow (Golden Doc) | สถานะใน AI Exam Formatter ปัจจุบัน | ข้อสังเกตและแนวทางพัฒนาต่อยอด |
| :--- | :--- | :--- | :--- |
| **จำนวนข้อ (Question Count)** | 80 ข้อครบถ้วน (1 ถึง 80) | `lib/exam-parser.ts` รองรับ 80 ข้อครบถ้วนแล้ว (ทดสอบผ่าน 100%) | เอกสารขนาดยาวไม่ถูกตัดหรือยุบรวมเหลือ 25-27 ข้อ |
| **โครงสร้างข้อสอบ (Question Flow)** | ลำดับ 7 ส่วน: โจทย์ -> [รูปโจทย์] -> ตัวเลือก: -> ก-ง -> คำอธิบาย: | รองรับตามมาตรฐานเดียวกัน (Supreme Constitution) | มีการเว้นบรรทัด 1 บรรทัดระหว่างแต่ละส่วน เพื่อไม่ให้ Google Docs บีบชิด |
| **การเฉลยและสีไฮไลต์ (Dual-Color Shading)** | • `#E6F4EA` (เขียวอ่อน): เฉลยจากต้นฉบับ (`source_provided`)<br>• `#FFF4CC` (เหลืองอ่อน): เฉลยโดย AI (`auto_solved`) | รองรับทั้งใน DOCX generator และ UI preview | ดอกจัน `*` ท้ายตัวเลือกที่ถูกแสดงผลชัดเจน |
| **ภาพตัวเลือก (Choice Images)** | ข้อ 16: ตัวเลือก ก, ข, ค, ง เป็นรูปผลึกจุนสี 4 ภาพ | รองรับ choice-level image ใน parser | ระบบต้องตัดภาพผลึก 4 ชิ้นแยกเข้าแต่ละตัวเลือก ไม่ใส่ข้อความหลอก |
| **โจทย์ร่วม (Shared Contexts)** | มี 7 ช่วงโจทย์ร่วมชัดเจน:<br>• ข้อ 17-18: ตารางการละลาย A,B,C<br>• ข้อ 19-21: ตารางความสามารถในการละลาย NaCl, CuSO4<br>• ข้อ 28-29: เครื่องมือกลั่นธรรมดา<br>• ข้อ 56-57: โครมาโทกราฟีหมึกแดง<br>• ข้อ 58-61: ตารางสี A และ B<br>• ข้อ 62-64: ตารางระยะทางสาร A,B,C<br>• ข้อ 68-69: โครมาโทกราฟี 4 สี | รองรับการตรวจจับข้อความนำและช่วงข้อ | ใส่ป้าย `โจทย์ร่วม ` และ `จบโจทย์ร่วม` พร้อมภาพตาราง/ไดอะแกรม |
| **ภาพโจทย์เดี่ยว (Single Question Diagrams)** | • ข้อ 33: เครื่องมือกลั่นลำดับส่วน<br>• ข้อ 43: เครื่องมือกลั่นด้วยไอน้ำ<br>• ข้อ 66: ตารางการละลายและการดูดซับ<br>• ข้อ 80: กรวยแยกสาร | รองรับ `[รูปโจทย์]` เหนือภาพ | ต้องแคปกรอบภาพปิดสี่เหลี่ยมสมบูรณ์ (Full Boxed Frame) ไม่ตัดขอบหรือตัดสายยาง/ปลายหลอด |
| **ตารางตัวเลือก (Choice Matrix Tables)** | แปลงเป็นข้อความ `<b>หัวตาราง:</b> ค่าข้อมูล` คั่นด้วย `\t\t` | แปลงเป็น formatted text run ตามกฎ Quizflow | ป้องกันตาราง Word แตกหน้าเมื่อนำเข้าสู่ Google Docs |

## 3. Analysis: การใช้โมเดลครู (Teacher Model) รันสกัดข้อสอบ 2,000–5,000 หน้า
- **ความคุ้มค่า (ROI & Cost):**
  - ใช้ Gemini 1.5 Flash เป็น Teacher ดึงข้อสอบ 2,000 หน้า: ค่าใช้จ่าย API เพียง ~\$1.00 USD (~35 บาท)
  - ใช้ Gemini 1.5 Flash เป็น Teacher ดึงข้อสอบ 5,000 หน้า: ค่าใช้จ่าย API เพียง ~\$2.50 USD (~90 บาท)
  - ได้ Synthetic Dataset ที่มีโครงสร้างตรงตาม Schema ของ AI Exam Formatter ครบทั้งโจทย์ ตัวเลือก ก-ง เฉลย และกรอบ Bounding Box ของภาพ
- **อนาคตและความเป็นไปได้ (Future-Proof):**
  - ชุดข้อมูล 2,000 - 5,000 หน้า เป็นขนาดที่เหมาะอย่างยิ่งสำหรับการทำ LoRA Fine-Tuning บนโมเดลขนาดเล็ก เช่น Typhoon OCR 1.5 3B หรือ Qwen2-VL-2B
  - เมื่อ Fine-Tune แล้ว โมเดล Local 3B จะเข้าใจโครงสร้างข้อสอบไทยได้ในขั้นตอนเดียว (Single-pass parsing) โดยไม่ต้องพึ่งพา Cloud และไม่ต้องพึ่ง Regex ซับซ้อน
- **ข้อเสนอแนะในการปฏิบัติ:**
  - เฟส 1: ทำระบบ Fallback 4 ลำดับในแอปให้สมบูรณ์ (Digital PDF -> Cloud OCR -> Local OCR -> Starter Draft ทางเลือก A)
  - เฟส 2: เขียนสคริปต์ Background สกัดข้อสอบ 2,000-5,000 หน้าด้วย Gemini Flash / Typhoon เก็บเป็น Corpus ใน `evidence/golden-corpus/`
  - เฟส 3: รันการวัดผลความแม่นยำ (Benchmarking) และเตรียมชุดเทรน LoRA สำหรับ Typhoon OCR 3B
