# T-109 Export Follows the Master QuizFlow Template Verification

Date: 2026-10-15, Asia/Bangkok. Host: DESKTOP-FNVSAKS.

## Inputs
- Master template https://docs.google.com/document/d/1uA8A1Q1lXCDIGRPtgBA0H77xYoMWCoo7thp5Hi0nvBQ/edit (public DOCX export HTTP 200, saved as evidence/t109-master-template.docx), declared supreme in design.md §1.1.
- T-108 had followed a secondary example (1wyAaKDjHQM8lYqhwXqGX7fJgXZ8FZ1Xa); comparison: evidence/t109-template-vs-t108-p1.png, evidence/t109-template-p2-p3.png.
- Owner decisions: template wins everywhere; drop "ก./ข." keys in export; Pearl Aqua answer mark for every origin; title = file name, footer = "V-date | file name | page X of Y".

## Measured template rules
A4 11909x16834; margins 283/694/850/429; title 17 pt bold black; question 160/80, number #F25F4D bold, text #102A2E; spacer (line 276) before "ตัวเลือก:" (teal bold, indent 400, 40/60); choices indent 660 hanging 260, 0/60, no keys; answer run shading #B8F2E6 + coral "*"; "คำอธิบาย:" teal bold + #102A2E, indent 400, 60/100; "รูปคำถาม:" coral bold indent 400 with 661 px images; choice images inline 353 px; shared stem teal label + #102A2E, italic passage indent 360, "รูปโจทย์ร่วม:" indent 360, "จบโจทย์ร่วม" then centred "◆"; italic footer "V-671109 | Eng(ปิดเล่ม)-BKP_D4 (red) | PAGE of NUMPAGES" starting 567 twips left of the margin.

## Verification
- `node scripts/test-google.cjs`: template fixture checks block order (title, gap, question, image label/figure, spacer, choices label, keyless choices with inline image + Pearl Aqua star, shared header/passage/label/figure, explanation, shared end, diamond), colours, spacing/indent values, 353/600/661 image widths, no paragraph shading, footer data, A4/margins/footerReference, hanging indent, run shading XML, absence of choice keys, footer part, content type and relationship: pass.
- E2E on dev :3101 (evidence/t109-e2e.log): 30/30 PASS. Updated assertions: A4 page with footer, 160/80 question spacing, spacer before choices, hanging indent, keyless choices; T-101 export check now asserts three Pearl Aqua stars and no origin fills in DOCX (editor still shows origin colours; Drive payload keeps them pre-layout). Runs interrupted by transient Windows UNKNOWN on Playwright download.saveAs led to a copyFile retry in the E2E wrapper; one unrelated 30 s wait after reload did not reproduce.
- Representative export from the app (scripts/capture-t108.cjs -> evidence/t109-sample-export.docx, Word PDF evidence/t109-sample-export-word.pdf); renders evidence/t109-template-vs-export-p1.png and -p2.png show matching title, rhythm, indents, answer marks, shared block, diamond and footer.

## Gate and deployment
- `finish-task` exit 0 against production 261015-2300 on :3102 (E2E 30/30, gate stamp 261015-2302, CSS health) on the first attempt (evidence/t109-completion-gate.log).
- localhost:3000 (127.0.0.1) now serves 261015-2300; HTTP 200, CSS OK; capture-t108 against :3000 produced evidence/t109-deployed-export.docx with A4 page, template footer and layout.

## Boundaries
- Template title and footer values are sample text; export uses the file name and date code as decided.
- Google Drive conversion of the new DOCX was not exercised (no signed-in Google session available to the agent); Drive uploads the same DOCX bytes as the download.
