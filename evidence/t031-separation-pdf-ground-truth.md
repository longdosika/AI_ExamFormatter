# T-031 ground truth: บทที่ 7 ชุดที่ 2 เรื่อง การแยกสาร.pdf

- Source: `D:/0-Project/10-Obsidian/quizflow/tmp/บทที่ 7 ชุดที่ 2 เรื่อง การแยกสาร.pdf`
- Visual inspection: rendered pages 1–4 with Poppler; page 1 contains Thai exam questions, horizontal choices, and a numbered list (1–6) inside question 3.
- Text-layer check: `pypdf` returned zero extracted characters on all four pages. This is an image-only document and requires OCR.
- Observed defect: the previous right pane promoted the list `1. การกรอง ... 6. การระเหยจนแห้ง` into question-like boundaries and omitted/misordered choices.
- Expected contract: OCR retains page markers and distinguishes `[QUESTION]`, `[STEM_ITEM]`, and `[CHOICE]`; parsed items stay in source order and expose `sourcePage`.
- Acceptance fixture: the T-031 structured OCR case in `scripts/test-parser.cjs` asserts questions `[1, 3]`, page `[1, 1]`, four choices for question 3, all six stem items, and no fabricated question 2.
