# Tasks
## Related
- [[00-index]]
- [[prd]]
- [[architecture]]
- [[decisions]]
## Backlog

### T-132 Crop top cut when the figure sits beside its question line (set 2 Q20/Q22); make capture rules enforceable
- Type: Bug
- Status: Verified
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Problem: owner screenshots 2026-10-17 on 261017-1907 (chapter 7 set 2): Q22 crop lost the funnel top with labels 3 and กรวย; Q20 cylinder top cut. Owner also asks whether the crop rules are really recorded, applied and learned from. Recorded OCR merges "22. 3 จากรูป…" into one full-width line (y 204-228), and rule C-10 always sets the crop top to that line bottom +3, even when the figure starts beside the question line.
- Acceptance Criteria: Q20 and Q22 crops include the full figure (top of funnel/cylinder) without the question number or stem text; set 1/3 crops unchanged (existing replay suites pass); C-10 rewritten in capture-rules.md with the beside case and a learning-log row; a rule check script fails when a capture rule has no code reference or no test, and runs in the gate chain.
- Affected Files: lib/capture-geometry.ts (figureVerticalLimits), possibly lib/diagram-client.ts crop padding block, scripts/test-t132-crop-top.cjs (new), scripts/check-capture-rules.cjs (new), package.json, documents/capture-rules.md, tasks, decisions, memory, code-map, traceability, 00-index, release_log.md, README
- Expected Verification: replay set 2 (evidence/t121/t130-set2) with before/after crops saved; set 1/3 suites; full test:e2e on dev; finish-task T-132; deploy and live set-2 check.
- Verification (2026-10-17): C-10 beside case + C-14 upward ink walk (figureReach, extendCropUpAcrossInk); rule map section ฉ. + scripts/test-capture-rules.cjs in npm test; test-t123 and test-t121-fidelity wired (were never run). test-t132-crop-top passes on recorded and live set-2 boxes; npm test, tsc, full test:e2e (3122) exit0; set 1 fidelity pass; production 261017-2046 (.next-production-t132b) on localhost:3000: badge, CSS200, 8 deployed suites exit0; live set-2 on 2046 complete Q20/Q22. Open: I-062 pen mark at Q20 right edge. Evidence: evidence/t132/verification.md.

### T-131 Several question figures per question (I-059 / H-13)
- Type: Bug
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Problem: found during T-130 live set-2 run on 261017-1907 (chapter 7 set 2, Q25 prints รูปที่ 1-4): ExamItem holds one imageUrl/imageBbox, so harvestExamDiagrams overwrites each earlier "question" figure with the next one and only the last survives (release_log I-059, handoff H-13). Feature note: features/r-002-feature.md (figure capture).
- Master template check (2026-10-17, evidence/t109-master-template.docx, doc 1uA8A1Q1...): every รูปคำถาม: in the template is followed by exactly one image paragraph; the template neither shows nor forbids several. No conflict, but it is silent: chosen layout is one "รูปคำถาม:" label followed by one image paragraph per figure (same figure style), recorded as an assumption in decisions.md for owner confirmation.
- Acceptance Criteria: an item keeps every question figure harvested for it, ordered by position on the original page (row by row, left to right inside a row); the editor shows one รูปโจทย์ block with all figures; editor merge, drafts, reopen cleanup (C-36 choice tables still removed per image), stale re-crop and review keep all of them; DOCX and Google export put all images under one "รูปคำถาม:"; re-harvest replaces rather than duplicates; existing figure tests unchanged.
- Affected Files: lib/formatter-rules.ts, lib/diagram-client.ts, lib/harvest-editor.ts, lib/figure-text-cleanup.ts, components/SplitDocumentEditor.tsx, app/page.tsx, components/ExamFormatterPreview.tsx, scripts/test-t131-multi-figure.cjs (new), package.json (test:e2e), documents (capture-rules, tasks, decisions, memory, code-map, traceability, 00-index), features/r-002-feature.md, release_log.md
- Expected Verification: replay of real set-2 responses (evidence/t121/t130-set2): Q25 shows 4 figures in source order, survives draft reopen, exported DOCX has 4 images under its รูปคำถาม:; test-t130 still passes; tsc; full test:e2e on dev 127.0.0.1:3121; finish-task T-131.
- Verification (2026-10-17): root causes: single imageUrl overwritten per figure in harvest; editor labelImages added a heading before figures 2/4 (3 labels in DOCX) - both fixed. tsc exit0; npm test exit0; test-t121-order-dom pass; new scripts/test-t131-multi-figure.cjs pass (Q25 4 figures = รูปที่ 1-4 after harvest, re-harvest and draft reopen; DOCX one รูปคำถาม: + 4 image paragraphs; Google payload 1 label + 4 images); full test:e2e on dev 127.0.0.1:3121 exit0 (evidence/t131/test-e2e.log). Template silent on several images: assumption D-078. Not deployed to :3000. Evidence: evidence/t131/verification.md.
- Final status (2026-10-17): E2E_BASE_URL=http://127.0.0.1:3121 node scripts/finish-task.mjs T-131 exit0 (vault, drift, typecheck, lint, test, test:unit, test:e2e incl. T-130/T-131, build stamp 261017-2006, CSS; evidence/t131/completion-gate.log); Verified -> Done. Not deployed to localhost:3000 (still 261017-1907).

### T-130 Choice-table figure, header notice removal, one Drive/export control
- Type: Feature (with Bug part A)
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Problem: owner screenshot 2026-10-17 on 261017-1543 (chapter 7 set 2, Q5): (A) choices given as a table (ข้อ | การระเหย | การตกผลึก, rows ก-ง) are parsed correctly into choices, but the same table is also captured as รูปโจทย์ although it is not a question figure. (B) the header status text (e.g. "ตรวจเฉลยเสร็จ · ต้นฉบับ 15 · AI 9 ...") should be removed. (C) the Drive status pill and the ส่งออก button are one flow and should be one control: lock (not connected) -> export (ready) -> Drive link (exported); merge other single-flow controls the same way.
- Acceptance Criteria: (A) a question whose choices come from a choice table gets no รูปโจทย์ for that table (harvest and re-crop), while real question figures/tables stay; rule and learning-log entry in capture-rules.md. (B) no visible status text in the workspace header; progress stays available to assistive tech (sr-only live region). (C) one export control in the editor toolbar whose icon/label/action follow the Drive state; after export it opens the Google Doc, with re-export and Drive management in its small menu; landing header Drive chip is one control; local save and Drive backup are one control.
- Affected Files: lib/diagram-client.ts, lib/capture-geometry.ts (or harvest), app/page.tsx, components/RichTextToolbar.tsx, components/GoogleDriveStatus.tsx, components/SplitDocumentEditor.tsx, app/globals.css, tests (test-e2e, test-workspace-controls, new test-t130), documents (capture-rules, tasks, decisions, memory, code-map, traceability, 00-index, design), feature notes, README, release_log.md
- Expected Verification: replay of real set-2 responses (Q5 has no figure, other figures kept), set-3 suites unchanged, full test:e2e on dev, finish-task T-130, production deploy on localhost:3000 opened in the browser.
- Verification (2026-10-17): real set-2 responses recorded (evidence/t121/t130-set2); test-t130-choice-table pass (Q5/Q7/Q10 no question figure, Q8 keeps its diagram, old draft cleaned on reopen, header status sr-only, one Drive control); tsc/npm test exit0; full test:e2e on dev exit0; production 261017-1907 (.next-production-t130) on localhost:3000: badge, CSS200, deployed T-130/e2e/workspace/T-121 controls/T-128/library exit0; live set-2 run on the deployed build attaches figures only to Q8/16/20/22/25. Open: I-059/H-13 (several figures per question). Evidence: evidence/t130/verification.md. finish-task T-130 exit0 (evidence/t130/completion-gate.log); Verified -> Done.

### T-129 Merge header buttons: drafts + import history list, tools menu
- Type: Feature
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Problem: owner request 2026-10-17 (after the T-128 header explanation): แบบร่าง and ประวัติไฟล์ overlap (both list files this browser opened), and สถิติ / ดาวน์โหลดสถิติ / บันทึกปัญหา are rarely used tools taking three rail slots.
- Acceptance Criteria: (1) one header entry "แบบร่าง/ประวัติ" opens one list: drafts with step progress and import count, plus imports that no longer have a draft; the separate ประวัติไฟล์ button/dialog is removed. (2) one "เครื่องมือ" menu button (aria-expanded/aria-controls) holds สถิติ, ดาวน์โหลดสถิติ and บันทึกปัญหา with unchanged accessible names; it closes on choosing an item, Escape, or an outside click. (3) rail inline expansion (T-118) still works; menu is not clipped.
- Affected Files: app/page.tsx, app/globals.css, scripts/test-e2e.cjs, documents (tasks, decisions, memory, code-map, traceability, 00-index, design), features/r-001-browser.md, README.md, release_log.md
- Expected Verification: tsc, test:e2e on dev 127.0.0.1:3121, finish-task T-129, production build deployed on localhost:3000 with header checked in the browser.
- Verification (2026-10-17): tsc exit0; full test:e2e on dev exit0; production 261017-1543 (.next-production-t129) on localhost:3000: badge, CSS200, deployed test-e2e/library/workspace/T-128 exit0; drafts dialog and tools menu opened in the browser pane. Evidence: evidence/t129/verification.md. finish-task T-129 exit0 (evidence/t129/completion-gate.log); Verified -> Done.

### T-128 Duplicate import check, draft progress, flat Drive naming, header Drive status
- Type: Feature
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Problem: Owner request with screenshot on 261017-1417: (1) importing a file that was imported before must warn and offer confirm / cancel / continue the previous draft; detection must not depend on the file name, because renamed copies currently slip through (draft lookup key includes the file name); (2) a draft opened to continue should show which step it reached; (3) on Drive keep the original as "[original filename]" and each export as "[original filename]_[yymmdd-hhmm]" in one folder instead of per-document subfolders; (4) the landing page shows only the 4 latest drafts; (5) explain the header buttons and their overlap; (6) move the Drive connection bar ("พร้อมส่งออกไป AI_ExamFormatter / ออกจากการเชื่อมต่อ") into the header in place of the tagline, redesigned.
- Acceptance Criteria: duplicate detection by SHA-256 of the file (local drafts and the Drive library), shown before any OCR/AI work with three choices and the previous draft's progress; draft progress (converted, figures, answers n/N, exported) on the landing list, the drafts modal and the dialog; landing shows 4 drafts; new Drive writes go flat into the AI_ExamFormatter folder with the requested names (drafts and QuizFlow records follow the same base name), existing per-document folders stay readable and are never moved or deleted; header carries a compact Drive status control with the same actions.
- Affected Files: app/page.tsx, lib/document-draft-store.ts, lib/drive-library.ts, app/api/google/export/route.ts, components/GoogleDriveStatus.tsx, components/DocumentLibrary.tsx, app/globals.css, scripts/test-drive-library.cjs, scripts/test-t128-duplicate-import.cjs (new), existing E2E that re-upload a file with a draft, knowledge docs, release_log.md.
- Header buttons (owner question 2, 2026-10-17): คลังไฟล์ = Drive originals/exports/draft backups across devices; แบบร่าง = drafts in this browser; ประวัติไฟล์ = list of import names/times (now largely covered by drafts with progress); สถิติ / ดาวน์โหลดสถิติ = conversion run statistics for diagnosis; บันทึกปัญหา = case log; แม่แบบ = opens the master template. Proposed merge (owner decision): แบบร่าง+ประวัติไฟล์ into one list, and สถิติ/ดาวน์โหลดสถิติ/บันทึกปัญหา into one tools menu.
- Expected Verification: unit tests for hash lookup, progress and flat Drive naming (mocked Drive); browser test for the duplicate dialog (renamed copy, three choices) and progress; existing suites; finish-task; deployed check.
- Verification (2026-10-17): unit (drafts, Drive flat/legacy, google) and test-t128-duplicate-import pass; full test:e2e on dev exit0 (older suites answer the dialog via scripts/e2e-import-helper.cjs); finish-task T-128 exit0 (evidence/t128/completion-gate.log); production 261017-1521 (.next-production-t128) on localhost:3000 replacing 261017-1417: badge, CSS ok, deployed T-128/T-127/T-125/workspace/library suites exit0. Real Drive export not exercised (mocked). Evidence: evidence/t128/verification.md.
- Final status (2026-10-17): Verified -> Done.

### T-127 User-marked answer on an added choice loses its star
- Type: Bug
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Problem: Owner screenshot on 261017-1342 (set 3 Q15): a choice the user created and marked as the answer shows "เฉลยโดยผู้ใช้" but no "*" and is not saved/exported as correct. Reproduced (scripts/test-t127-answer-star.cjs): add a choice, select it, then click its text and type. The managed star span was editable, the click put the caret in or after it, the first character landed there, and the "typed star" rule (clear the answer when no row ends with "*") removed the answer and lost the character. Also "แยกตัวเลือก" wrote the split text into the bold key span and dropped the visible key, because React renders the key as two text nodes and the template-string regex had lost its backslashes.
- Acceptance Criteria: the star span is not editable (new and saved drafts); text typed after it moves into the choice text; a typed "*" only adds an answer and never clears one (clearing uses "ล้างเฉลย"); split rows show their key and put text in the text span; the answer survives save/reload and is starred in DOCX.
- Affected Files: components/SplitDocumentEditor.tsx, lib/answer-editor.ts, scripts/test-t127-answer-star.cjs, package.json, knowledge docs, release_log.md.
- Expected Verification: test-t127-answer-star fails on 261017-1342 and passes after the fix; T-126 test; finish-task; deployed check.
- Verification (2026-10-17): test-t127-answer-star fails on 261017-1342 and passes after the fix; finish-task T-127 exit0 on dev (evidence/t127/completion-gate.log); production 261017-1417 (.next-production-t127) on localhost:3000 replacing 261017-1342: badge, CSS ok, deployed test-t127, test-t126, test-t125, test-e2e exit0. Evidence: evidence/t127/verification.md.
- Final status (2026-10-17): Verified -> Done.

### T-126 Multiple correct answers and add/edit/delete choices
- Type: Feature
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Problem: Owner screenshots on 261017-1214 (set 3): Q9's original circles both ก and ง, but a question can hold only one answer (radio buttons, single source-answer key). Owner: "ปรับให้รองรับการเฉลยข้อถูกมากกว่า 1 ข้อ" and "ปรับให้แก้ไข เพิ่ม/ลบ ตัวเลือกได้" (Q15 shows a merged choice the user may need to fix by hand). The master template marks several correct choices with "*" (template Q3 "2 *", "3 *"; Q4 two answers), so multiple answers are template-conformant.
- Acceptance Criteria: a per-question "หลายคำตอบ" mode turns answer controls into checkboxes and toggles keys (mouse and keys 1-5), single mode keeps today's radio behaviour; source vision may return several circled keys for one question (X/tick still rejected) and such questions open in multi mode; saved drafts, statistics and DOCX/Google export mark every correct choice with "*"; each choice row has a delete control and each question an "เพิ่มตัวเลือก" control (max five, ก-จ), keys re-letter in order, answers follow their rows, and edits survive save/reload and export.
- Affected Files: lib/formatter-rules.ts, lib/answer-editor.ts, lib/source-answer-service.ts, lib/source-answer-client.ts, components/SplitDocumentEditor.tsx, app/globals.css, scripts/test-t126-answers-choices.cjs (new), scripts/test-source-answers.cjs, knowledge docs, release_log.md.
- Expected Verification: unit tests for multi source answers; browser test on the real set-3 PDF replay (Q9 ก+ง, add/delete/re-letter, save/reload, DOCX stars); existing E2E (radio contracts) unchanged; finish-task; deployed check.
- Verification (2026-10-17): test-source-answers (multi keys) and test-t126-answers-choices (real set-3 replay: Q9 ก+ง multi from the original, manual multi/single, delete+relabel, add+type, save/reload, DOCX stars) pass; finish-task T-126 exit0 on dev (evidence/t126/completion-gate.log); production 261017-1342 (.next-production-t126) on localhost:3000 replacing 261017-1214: badge, CSS ok, deployed T-126/T-125/T-124 tests, fidelity 25 and workspace controls exit0. Evidence: evidence/t126/verification.md.
- Final status (2026-10-17): Verified -> Done.

### T-125 Capture without OCR geometry when a draft exists, and capture rules
- Type: Bug / Documentation
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Problem: Owner screenshots on 261017-1152 (fresh conversion, set 3): Q6 and Q21 stems list the table rows, Q6's crop includes its own stem line, Q21 is cut on the right. Fresh-profile live runs on 1152 (evidence/t121/t125-live1, t125-live2) were clean. Cause: the browser already had a draft for the file; app/page.tsx reused the draft's OCR text without its line geometry, so harvesting ran with no stem limits and no geometry-based duplicate removal. Owner also asks for written capture rules and a learning record on every fix.
- Acceptance Criteria: cached OCR text is reused only with its geometry; harvesting without geometry reads OCR geometry first and stores it with the draft; replaying the owner's situation gives the same crops and clean stems as a fresh profile; documents/capture-rules.md holds the rules, image-type catalogue, mandatory fix procedure and a learning log, linked from README, release_log and the release checklist.
- Affected Files: app/page.tsx, scripts/test-t125-cached-ocr.cjs, package.json, documents/capture-rules.md, documents/release-checklist.md, knowledge docs, release_log.md, README.md.
- Expected Verification: test-t125-cached-ocr fails on 261017-1152 and passes after the fix; finish-task; deployed regressions.
- Verification (2026-10-17): test-t125-cached-ocr fails on 261017-1152 with the screenshot symptom and passes after the fix (crops equal fresh: Q6 647x130, Q21 570x172); finish-task T-125 exit0 on dev (52 PASS, evidence/t125/completion-gate.log); production 261017-1214 (.next-production-t125) on localhost:3000 replacing 261017-1152: badge, CSS ok, deployed test-t125-cached-ocr, test-t124-stale-draft, test-t121-fidelity 25/80 exit0. Evidence: evidence/t125/verification.md.
- Final status (2026-10-17): Verified -> Done.

### T-124 Stale figure crops and duplicated figure text in reopened drafts
- Type: Bug
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Problem: Owner screenshots on build 261017-1101 (set 3 draft): Q21 stem still lists the table rows and the table image is cut on the right, Q20 image carries the Q21 stem line, Q8 stem ends with "D สี C สี B สี A สาร ก" and its image carries a choice line. A fresh live run on 1101 (evidence/t121/t124-live1) has clean stems and correct crops, so the defects live in drafts saved by earlier builds: reopening keeps old images and old stem text, and only the narrow cleanCapturedTables heuristic runs.
- Acceptance Criteria: reopening a draft removes stem lines/labels that duplicate a captured figure using the stored OCR line geometry and the figure's data-source-page/data-source-bbox (no AI call, styled text kept); harvested figures record a crop version; figures from older versions with a source box can be re-cropped from the original in one action with the current limits (OCR stem lines, edge widening); manual captures are never changed silently.
- Affected Files: lib/figure-text-cleanup.ts (new), lib/harvest-editor.ts, lib/diagram-client.ts, components/SplitDocumentEditor.tsx, scripts/test-t124-stale-draft.cjs (new), knowledge docs, release_log.md.
- Evidence (2026-10-17): fresh live run on 1101 (evidence/t121/t124-live1, gemini-flash-lite) has clean stems and correct crops except a faint choice-line residue under Q8 (I-050); the owner screenshot state is a reopened older draft (I-048/I-049).
- Expected Verification: DOM test with a draft reproduced from the owner screenshot (old stem text + old crops) is cleaned on open and re-cropped by the action; existing T-121 replays and finish-task; deployed check on localhost:3000.
- Verification (2026-10-17): scripts/test-t124-stale-draft.cjs passes (stems cleaned on reopen, 5 old figures re-cropped to within 6% of fresh widths); finish-task T-124 exit0 on dev (52 PASS, evidence/t124/completion-gate.log); production 261017-1152 (.next-production-t124) on localhost:3000 replacing 261017-1101: badge, CSS ok, deployed test-t124-stale-draft, test-t121-fidelity 25/80, test-t121-source-marks-ui exit0. Evidence: evidence/t124/verification.md.
- Final status (2026-10-17): Verified -> Done.

### T-123 Conversion handoff pack H-01..H-12 (sets 4/5, QuizFlow numbering, quota)
- Type: Bug / Feature / Confirmation
- Status: In Progress
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Assignment (2026-10-17): owner now explicitly assigns T-123 to this Codex session, superseding the earlier hold for another developer. Inspect/reproduce before each fix and record actual evidence. Owner explicitly approves both four and five choices (H-05).
- Live quota authorization (2026-10-17): owner requests continued testing using existing quota only, without purchasing a package. Run sequential, bounded live source-mark/diagram requests against unchanged configured keys/models; reuse recorded OCR to avoid duplicate OCR costs. Save actual responses separately from replay; stop on a demonstrated provider/quota blocker. No billing/config change or external publication is authorized.
- Live inspection extension: actual 18-page diagram run reproduced Q4 following prose in crop and Q9 replaced with Q7's grid (provider Q9 box itself is correct). Inspect OCR/geometry before correction: Q4 continuation is just below provider bbox; Q9 OCR stem is the bare `9.` and was ignored as an anchor. Add failing actual-fixture tests first, then repair these geometry boundaries under H-07. No additional provider calls needed for the correction regression.
- Problem: Audit on 2026-10-17 of the real chapter-7 sets 1-5 against the master template found open conversion problems listed as H-01..H-11 in release_log.md: fake/duplicate numbers from crossed keys and numbered figure labels in set 4, five-choice questions in set 5, non-Thai key glyphs, uncaptured unruled tables, a shared-context table header, OCR spelling, Gemini quota, and possible QuizFlow misreading of numbered stem lines.
- Acceptance Criteria: per release_log H-xx "เกณฑ์ผ่าน"; owner confirms five-choice support (H-05) and the quota approach (H-10) first; H-01 needs a real QuizFlow import (B-36).
- Affected Files: lib/exam-parser.ts, lib/exam-validation.ts, lib/formatter-rules.ts, lib/text-normalization.ts, lib/ocr-suggestions.ts, lib/capture-geometry.ts, lib/diagram-client.ts, components/SplitDocumentEditor.tsx, package.json, scripts/test-t123.cjs, scripts/test-t123-browser.cjs, scripts/test-t121-fidelity.cjs, scripts/audit-editor-structure.cjs, scripts/audit-docx-template.cjs, scripts/verify-t123-live.cjs, scripts/verify-t123-live-diagrams.cjs, scripts/audit-t123-live-marks.cjs, knowledge docs/Feature Notes and evidence/t123/. No provider/model/billing, QuizFlow source, or original document change.
- Live verification checkpoint: actual source-only rounds return11/1 correct against12 visually verified unique circles (Q9 ambiguous excluded); H-10 fails>=10 x3 and round3 was not spent. All18 diagram pages live return200, but I-047 set5 Q21 multiple-table overwrite/cut remains open; set4 has image/choice gaps. I-045 live recurrence and I-046 wrong-grid anchor fixed after failing fixtures;15 targeted checks and `node scripts/finish-task.mjs T-123` exit0 (`evidence/t123/live/completion-gate.log`). Final production261017-1101 (.next-production-t123-live/PID3004), source/badge match, CSS200/63,737bytes; exact localhost4/5 recorded-live-response replay and25/80 fidelity replay exit0. Original1/3/4/5 PDF size/hash unchanged. `evidence/t123/live/runtime.json` and verification ledger retain actual versus replay boundaries. No purchase, billing change, new Google write, QuizFlow import or Git publication. T-123 remains In Progress.
- Expected Verification: scripts/capture-t121-real.cjs per set, then scripts/audit-editor-structure.cjs and scripts/audit-docx-template.cjs with no findings; parser fixtures from evidence/t121/set4 and set5; finish-task.
- Intake/baseline: replay of recorded real OCR confirms set4 fake figure-label questions (3/4/5/7), duplicate3, spurious91, missing page-boundary ค; set5 Q2/Q3 lost keys and seven five-choice questions rejected by the four-choice validator (including Q13, absent from the earlier H-05 list). Preserve raw OCR and existing edits. Scope includes focused regression fixtures, safe contextual repairs, geometry-proven shared table cleanup, four/five-choice state/export and user guide. H-01/H-07 require actual runtime/provider evidence, H-10 billing remains owner-controlled, H-12 does not authorize publication.
- Verification: production261017-1034 (.next-production-t123-release, PID34344 at launch), source/badge match and CSS200/63734bytes. `node scripts/finish-task.mjs T-123` exit0 (completion-gate-release.log): typecheck,lint0errors/9existing img warnings,all unit/E2E and isolated build. Targeted13 checks pass; deployed real-PDF/recorded-OCR browser replay source5=22 items/fifth manual answer/Save-resume/fifth-image-target mobile/cancel/DOCX and source4=28 items/original local Q4/Q6/Q7 grids despite simulated429 pass. Deployed25/80 fidelity replay pass incl shared header, styles, media, Save and DOCX. Original source4 pages10/11 confirm Q24->Q26; do not invent25. H-11 guide recorded. Keep In Progress: H-01 real persistent import, H-07 full live/unruled/image-choice coverage, H-10 live quota threshold, H-12 publication remain unverified/owner-dependent. No new provider/Google/import call, billing/config/schema change or stage/commit/push. Evidence/t123/verification.md and release_log.md contain per-H dispositions, exact commands and residual findings.

### T-122 Confirm quick-pointer behavior of the owner-required inline hover menu
- Type: Confirmation / UI Regression
- Status: Proposed
- Problem: During T-121 signed-in IAB work, a quick semantic click on the collapsed library rail landed on statistics download after the rail expanded. Keyboard Enter opened the intended library. Existing settled-hover tests pass, so do not assume this proves the same failure for human input in every browser.
- Acceptance Criteria: reproduce with fresh pointer geometry and saved evidence; distinguish automation timing from product hit-target reflow; preserve the owner's explicit inline label expansion preference before proposing any layout change. No original files or user data are altered by this confirmation task.
- Affected Files: future focused regression in scripts/test-workspace-controls.cjs and app/globals.css/app/page.tsx only if demonstrated; features/r-001-browser.md and knowledge docs.
- Expected Verification: rapid pointer entry/click at desktop widths plus keyboard/mobile/reduced-motion checks, evidence under evidence/, and a separate completion gate before any Done claim.
- Owner/Action: Codex confirms the boundary; owner decides only if stable targets require reserving label space or changing the already-approved inline behavior. No implementation performed under T-122.

Historical consolidation (T-121 B-40, 2026-10-16): evidence/t121/legacy-task-audit.md maps T-030..T-039/T-057/T-058/T-061/T-065/T-066/T-069 to current evidence and specific residual acceptance. Current web tests do not certify notebook benchmarks, all historical acceptance, or external preview publication. Keep those boundaries open instead of bulk-changing statuses to Done.
### T-121 Conversion fidelity fix pack (release_log backlog B-01..B-40)
- Type: Bug / Feature
- Status: In Progress
- Lifecycle: Proposed -> Ready -> In Progress
- Problem: Owner screenshots on build 261016-2058 (บทที่ 7 ชุดที่ 3): question 6 split in two (pen-crossed "ง." read as "4." starts a fake question 4), choice ง lost or merged in Q14/Q15 ("... 4. กลิ่นกุหลาบ...", "... การกลั่น. การระเหย..."), choices shown in two columns although the master template lists one choice per line (T-119 item 12 conflicts with the supreme template), Q20 figure crop includes neighbouring stem text, Q21 table not captured and turned into text (recurs T-104/T-114).
- Acceptance Criteria: all release_log.md backlog items B-01..B-40 (owner: "เริ่ม T-121 ทำ B-01 ถึง B-40 ทั้งหมด", 2026-10-16), verified against the owner-supplied source PDF C:/Users/natha/Downloads/บทที่ 7 ชุดที่ 3 เรื่อง การแยกสาร.pdf; items needing external systems (real QuizFlow import) are recorded with the owner action instead of claimed.
- Affected Files: lib/exam-parser.ts, lib/exam-validation.ts, lib/text-normalization.ts, lib/diagram-service.ts, app/api/ocr/route.ts, components/SplitDocumentEditor.tsx, app/globals.css, scripts/test-parser.cjs, scripts/test-e2e.cjs, knowledge docs.
- Expected Verification: parser regression cases built from the real chapter-7 OCR text, crop checks against the source PDF, E2E, finish-task.
- Continuation (2026-10-16): owner requests continuation and closure of all work after readiness assessment. Preserve existing partial implementation. Resolve missing Merge import, one-column template regression, stale task/release descriptions and real-source count discrepancy first. Track all B-01..B-40 individually with evidence, including external/authorization-dependent work; never mark unexecuted QuizFlow import, publication, or security remediation Done. No stage/commit/push under the existing explicit restriction. Expected code scope also includes lib/ink-filter.ts, lib/diagram-client.ts, focused capture tests, export/preflight helpers and scripts/finish-task.mjs. Existing environment is ready; evidence/t121-readiness-assessment.json records baseline typecheck failure and invalid prior diagram evidence.
- Verification checkpoint (2026-10-17): evidence/t121/verification.md records completion gate exit0,25/80-source resumed-harvest production regressions exit0, actual Google80/15images and Q66 fixed editor/PDF readback, actual Drive restore and security audit0. New lib/harvest-editor.ts preserves edited HTML while replacing fresh crops. All40 backlog dispositions are explicit in release_log.md. Keep In Progress: B-18 generic missing-table fallback, source-mark recall/preview acceptance (T-057), B-36 QuizFlow DB unavailable and unauthorized B-32 publication are not silently closed; historical task audit does not certify hardware/model benchmarks.
- Final deployed verification: production261017-0014, .next-production-t121-release, PID17800 at verification; IAB badge/source match, CSS200/63,734bytes, deployed controls and resumed80 regression exit0. Actual Drive restore80/13pages/15images and real IAB DOCX download993,088bytes/15media files/number coverage80 passed. evidence/t121/live-build.json. No stage/commit/push. Remaining work is explicitly open, not a claim of all40Done.
- Audit (2026-10-17, Claude, owner: "ตรวจสอบงานที่ทำค้างก่อน ... ทำสะ"): re-verified closed items with live provider runs of the real chapter-7 set-3 PDF on the deployed 261017-0014 build: 25 questions x 4 choices (Q15 by confirm), one-column choices, Q6/Q21 tables captured, Q20 clean. Found and fixed: I-033 Q10 graph cut at the right edge (extendCropAcrossInk), I-034 source answers 0 because models were exhausted inside key 1 before rotating keys (executeAcrossModelsAndKeys; X/tick evidence rejected; live source 11/AI 13), I-035 0..1-scaled diagram boxes dropped Q6, I-036 inline stem enumerations; B-18 uncaptured table rows stay one row per line and ordinary tables remove duplicate text without grid detection (hasCellRowEvidence). Verification: npm test exit0, lint 0 errors, typecheck, test-t121-fidelity (25) exit0 on dev, scripts/test-t121-source-marks-ui.cjs (replay of recorded gemini-3.8-flash answers) passed with Q4 source-mark preview; evidence/t121/audit-*. Completion gate `finish-task T-121` exit0 on dev 127.0.0.1:3121 (37 PASS, CSS ok; evidence/t121/audit-completion-gate.log). Deployed production 261017-0911 (.next-production-t121-audit) on localhost:3000 replacing 261017-0014 PID17800: HTTP200, badge 261017-0911, CSS ok, deployed test-t121-fidelity/test-t121-controls/test-t121-source-marks-ui exit0. B-32 remains under D-068, B-36 remains blocked on the QuizFlow database.
- Template order fix (2026-10-17, owner screenshots: "ลำดับ รูปโจทย์ วางผิดตำแหน่ง ... ตรวจสอบส่วนอื่นๆด้วย ยึดคัมภีร์สูงสุด"): I-037 question figure after choices (harvest-editor inserted at the wrong nesting level) fixed with orderItemSections on harvest, draft restore and export; I-039 regression from B-18 (multi-line stems never cleaned after capture) fixed with newline-free compare and whole-line removal; I-040 figure labels at the stem tail (Q8) removed by stripTrailingFigureLabels; I-041 image-only choices (set 1 Q16) were dropped, now createChoiceRow; I-038 tests strengthened (fidelity order/rows/Q8/Q16 checks, scripts/test-t121-order-dom.cjs in test:e2e). Template audit of sets 1-3 DOCX/editor: no structural findings except numbered stem lines (H-01). Sets 4/5 findings handed off as T-123 (release_log H-01..H-11). Verification: finish-task T-121 exit0 on dev 127.0.0.1:3121 (37 PASS, CSS ok, evidence/t121/order-completion-gate.log); production 261017-0949 (.next-production-t121-order) on localhost:3000 replacing 261017-0911: badge 261017-0949, CSS ok, deployed test-t121-fidelity 25 and 80 (T121_SOURCE80=1 with set 1 PDF), test-t121-controls, test-t121-source-marks-ui (5 figure questions with figure before choices) exit0; scripts/audit-docx-template.cjs: set 1 no findings, set 3 only H-01.
- B-36 diagnosis (2026-10-17): owner authorized QuizFlow repair; QF-BUG-DB-CONNECTION-347 In Progress there. Config targets localhost:5432/quizflow; read-only probes inside/outside sandbox and after owner readiness reply still fail ECONNREFUSED on IPv4/IPv6. Exact updated config path/intended local DB requested. No code/config/schema/data/runtime change or persistent import. evidence/t121/quizflow-db-diagnosis.md. Keep In Progress.

### T-120 Release log and 40-item conversion backlog
- Type: Documentation
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Problem: Owner needs one file, reachable from README.md, that tells any newcomer what has been done, which problems were found, whether each is fixed, whether it is recurring, and in which build the fix landed; plus a 40-item to-do list covering the new screenshot findings.
- Acceptance Criteria: release_log.md at repo root with latest-change summary, build history, issue register (found build, status, fixed build, recurrence), and 40 backlog items with priority; README.md links it at the top; new defects traced to root cause in code; T-121 registered for the fixes.
- Affected Files: release_log.md, README.md, documents/tasks.md, documents/00-index.md, documents/memory.md, documents/traceability.md, documents/code-map.md (no code change), evidence/t120-verification.md.
- Expected Verification: links resolve, finish-task T-120 exit 0.
- Verification (2026-10-16): release_log.md and README.md relative links all exist (8 stale absolute README links converted). finish-task T-120 exit 0 against localhost:3000 build 261016-2058 (37 PASS lines, CSS OK, source gate stamp 261016-2127, not deployed). Evidence: evidence/t120-verification.md, evidence/t120-completion-gate.log.
- Final status (2026-10-16): Verified -> Done.

### T-119 Thirty-point workspace pass: data checks, density, navigation, export feedback, performance
- Type: Feature / Bug / Workspace UX
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Problem: Owner screenshots (build 261016-2013) show a duplicated question number (strip "... 6 4 7 ..."), choices ค and ง merged into one row ("ค. เฮกเซน. ง แอลกอฮอล์"), a two-row editor rail, a squeezed "Drive พร้อม" label, tall question spacing, an orphaned folded status dot and other friction. Owner approved all 30 proposals plus the two data findings ("ทำหมดเลย"), priority performance > clarity > looks.
- Acceptance Criteria (numbers follow the proposal list):
  A/1 duplicate numbers flagged in strip and preview; B/2 parser splits a missing choice key that appears inside the previous choice, validator names merged choices, editor offers "แยกตัวเลือก"; 3 incomplete/empty choices shown in strip/preview; 4/26 badge when the selected answer differs from or matches the original's marked answer (source_vision key); 5 review findings are clickable; 6 editor rail fits one row at 1912 px; 7 Drive state shown on the export control (tooltip/state dot, still at export per T-118); 8 ~30% tighter question spacing; 9 clear-answer shown only on answered questions as a compact × control; 10 readable origin tag; 11 one-line AI reasoning summary; 12 two-column choices when all are short and image-free; 13 folded status dot sits by the identity; 14/15 header tools grouped with dividers (library and drafts stay separate controls per T-116, inline rail expansion per T-118 kept); 16 draft count badge; 17 NOT changed: source count stays plain text per T-118 owner decision; 18 source page dots; 19 opt-in "sync original" toggle (default off keeps T-050 independence); 20 "reduce pen marks" view filter; 21 arrow-key movement along the strip; 22 dot legend; 23 issue breakdown on the ⚠ chip; 24 two-step "confirm all AI answers"; 25 keys 1-4 choose ก-ง when not typing; 27 export phases with image progress; 28 export asks once when review items remain (non-blocking choice); 29 content-visibility for long documents with jump correction; 30 lazy source page images with capture-safe decoding.
- Affected Files: lib/exam-parser.ts, lib/exam-validation.ts, lib/answer-editor.ts (if needed), lib/export-document.ts, app/page.tsx, components/SplitDocumentEditor.tsx, components/RichTextToolbar.tsx, app/globals.css, scripts/test-parser.cjs, scripts/test-e2e.cjs and other suites as affected, knowledge docs, evidence/t119-verification.md.
- Expected Verification: parser unit cases for merged choices, typecheck, lint, npm test, full E2E suites, screenshots at 1912/390 px, finish-task T-119, restart localhost:3000.
- Verification (2026-10-16): parser merged-choice tests pass; npm test exit 0; four E2E suites exit 0 (35 PASS) on dev; capture-t119 rail 55 px one row at 1912 px, 12 page dots, no 390 px overflow; ink filter check removes red/blue strokes and keeps print. finish-task T-119 exit 0 on production 261016-2058 (gate stamp 261016-2101, 37 PASS lines, CSS OK) after renaming a duplicate decision ID (D-036 -> D-066). Evidence: evidence/t119-verification.md.
- Deployment (2026-10-16): localhost:3000 (127.0.0.1) serves 261016-2058 from .next-production-t119 (replaced T-118 server pid 24280); HTTP 200, CSS OK, capture-t119 passed on :3000.
- Final status (2026-10-16): Verified -> Done.

### T-118 Restore Workspace Controls and Export at Every Stage
- Type: Bug / Workspace UX
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Problem: Owner annotated build261016-1734: source question count belongs in the left header as unframed text, explicit draft-save control is missing, Drive status/action belongs at export, export becomes unavailable while AI runs, and T-117 replaced the requested inline hover expansion with tooltips.
- Acceptance Criteria: Show plain "ต้นฉบับ xx ข้อ" in source header (do not move draft load/dismiss commands into source content); add explicit save-current-draft icon that captures the actual live DOM/raw text and can resume later; relocate Drive status to export area with state-specific icons/actions; export/download current snapshot during OCR/diagram/answer/review work, with only empty-document/duplicate-export or genuine validation failures stopping submission. Missing Google connection opens a clear connect/retry action, not a disabled workflow gate. Preserve source, edits, draft resume, image export and theme. Owner explicitly confirmed inline hover expansion, not a flyout; restore it and regress pointer clicking after expansion, mobile and keyboard access.
- Affected Files: app/page.tsx, components/SplitDocumentEditor.tsx, components/RichTextToolbar.tsx, components/GoogleDriveStatus.tsx as needed, app/globals.css, focused browser tests, README, documents/tasks/prd/design/decisions/architecture/traceability/code-map/memory/00-index and existing R-001/R-003/R-004 feature notes; evidence/t118-verification.md.
- Expected Verification: raw/formatted live draft save/reload/resume, save storage failure visibility, source count vs edited draft count, export during delayed AI, disconnected Google action vs DOCX availability, status icon transitions, inline hover labels/clicks and desktop/mobile screenshots; full finish-task T-118, final build badge/source equality and opened/exercised localhost before completion. No change to QuizFlow application shown in the other attachment, no stage/commit/push or dependency upgrades.
- Owner confirmation: inline expansion in the existing rail, exactly as requested, supersedes T-117 floating-label choice. Keep click targets as predictable as possible without silently removing expansion again.
- Final status: Verified before Done after successful completion gate, final deployed regressions and actual IAB flows. Knowledge validator/drift/diff checks passed after synchronization; Git index remains empty. Temporary3218 candidate stopped; final3000 retained. Publication remains blocked by separate T-113, not by T-118 scope.
- Verification: final node scripts/finish-task.mjs T-118 exit0 (evidence/t118-completion-gate-final.log), including type/lint/unit,32/32 baseline E2E plus capture/library/workspace suites, build and candidate CSS. Final production261016-2013 on localhost:3000, PID24280, .next-production-t118; npm run test:e2e rerun exit0 (evidence/t118-deployed-browser.log), exact real-PDF save/source/crop regression exit0 (evidence/t118-deployed-real-source.log), CSS200/57,031 bytes. IAB badge matches source; explicit save/reload/resume preserves fixture image/manual answer and original2 count; disconnected export opens settings and Escape restores focus. Eight existing img lint warnings, zero errors. Providers/Google boundary mocked in new concurrency suites; local DOCX real. No new actual Google export or QuizFlow import claimed. T-103/T-104 and T-113 security hold remain separate. No stage/commit/push.

### T-117 Stable Header Tool Targets
- Type: Bug / Workspace UX
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Problem: Live T-116 CUA run selected the library control but opened import history. The header rail expands every label on hover/focus and reflows the hit targets beneath the pointer.
- Acceptance Criteria: Header icon positions and dimensions stay stable on hover/focus; only the relevant control shows its accessible label as a tooltip, with reduced motion and mobile bounds preserved. Repeated library opens from outside the rail always open the intended modal.
- Affected Files: app/page.tsx, app/globals.css, scripts/test-library-ui.cjs, existing R-001 feature note, design/decisions/code-map/memory/traceability/index and evidence/t117-verification.md.
- Expected Verification: Geometry assertions before/during hover, repeated real-pointer clicks on desktop/mobile, library regression and finish-task T-117. No unrelated toolbar redesign.
- Verification: node scripts/finish-task.mjs T-116 T-117 exit 0, evidence/t116-t117-completion-gate.log; all-tool geometry unchanged and three repeated pointer re-entries open the intended modal. Existing32/32 E2E plus capture/library suites passed. Final deployed badge check pending.
- Final status: final shared completion gate exit0 (evidence/t116-t117-completion-gate-final.log); final production261016-1734 opened in IAB and library button opens correct modal. Full production browser rerun32/32 plus capture/library suites exit0, evidence/t116-release-browser-final.log. Verified -> Done.

### T-115 Exact Source PDF Capture Verification
- Type: Verification / Confirmation
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Problem: T-114 had only synthetic evidence; owner now supplies the actual 80-question PDF at C:/Users/natha/Downloads/บทที่ 7 ชุดที่ 1 เรื่อง การแยกสาร.pdf. Verify the reported Q56-57 diagram and Q58-61 table against this source without changing it or inventing OCR/answers.
- Acceptance Criteria: Record source SHA-256/size/page count, render and inspect complete relevant pages, reproduce focused crops through production crop logic and compare guide lines/table borders/text with the source; record exact versus mocked/provider limits. Store any retained source in a private ignored collection rather than public evidence. New implementation defects require an In Progress bug intake before edits.
- Affected Files: evidence/t115-verification.md and private verification renders; tasks/memory/index/traceability and existing capture feature notes; code only via registered defect scope.
- Expected Verification: PDF structure/hash, rendered full pages and crops, exact source pixel assertions, browser original/reference/capture checks; finish-task T-115 for any implementation pass.
- Verification: exact source hash/13 pages and four protected-pixel crops passed; source-only13-page browser reattachment/reload/magnifier with zero AI calls passed; Drive-downloaded source SHA-256 equals original. node scripts/finish-task.mjs T-115 exit 0 (evidence/t115-completion-gate.log). Evidence: evidence/t115-verification.md, evidence/t115-crop-result.json. Real-provider detection/full80-question acceptance is not claimed; T-104 remains separate.
- Final status: exact-source crop/original-reference script rerun exit0 on final production261016-1734, evidence/t115-release-source-final.log. Source remains unchanged and private. Verified -> Done for this verification scope, not universal provider accuracy.

### T-116 Related Document Collections and Output Versions
- Type: Feature / File Management
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Problem: Source files are browser-local and outputs are untracked downloads/Google links. Owner requests a searchable grouped collection linking unchanged originals, output versions and the exact file used for real import. Confirmed: Google Drive is the primary library and QuizFlow is the downstream import destination; actual import requires explicit user confirmation rather than inference from export.
- Acceptance Criteria: Confirm storage/privacy boundary; originals retained byte-for-byte with hash-based identity, immutable versioned outputs, explicit parent/version relations and confirmed import records; grouped find/open/download UI and visible failures; old browser drafts stay usable. Never label export as successful downstream import. Never publish private originals to Git or cloud without authorization.
- Affected Files: lib/drive-library.ts, lib/document-library-client.ts, lib/library-pending-store.ts, lib/google-export.ts, app/api/google/library/route.ts, app/api/google/export/route.ts, app/page.tsx, components/DocumentLibrary.tsx, app/globals.css, focused tests and PRD/architecture/design/decisions/traceability/code-map/memory/index/README and features/r-006-document-library.md.
- Expected Verification: durable originals/version relations, hash collision/name duplication and restart tests, export/import status correctness, privacy/path/size/concurrency guards, browser grouped flow, finish-task and actual opened local link.
- Owner decisions: Google Drive is the primary library; actual import means downstream QuizFlow. Original upload and immutable output versions must be linked by verified source hash, and successful export must not automatically mark QuizFlow import. Preserve existing Drive organization and sharing; use a verified non-public library boundary for source bytes.
- Verification: shared final gate node scripts/finish-task.mjs T-116 T-117 exit 0,32/32 existing E2E plus focused capture/library tests, unit hash/privacy/version/tamper guards and build/CSS200. Real app archived unchanged source (independent readback SHA-256 match), exported isolated two-question/crop fixture into three immutable snapshots plus linked native Docs, preserved prior versions and no inferred import. Google PDF readback shows image/guides and single corrected-answer star. Explicit QuizFlow confirmation/copy tested with mocks only; no actual QuizFlow import or real confirmation claimed. evidence/t116-verification.md. Final deployment verification pending; no stage/commit/push.
- Final-audit reopening: prevent a legacy draft without source bytes/hash from creating a non-retryable archive queue entry. Local download still succeeds with an explicit reattach-and-export-again notice. Add browser regression before re-verification.
- Re-verification: legacy source-less download guard and browser regression passed; node scripts/finish-task.mjs T-116 T-117 exit 0 after this fix, evidence/t116-t117-completion-gate-final.log. Verified again before Done.
- Final status: production261016-1734 at localhost:3000 from .next-production-t116, PID15580. IAB badge/source equality and real Drive collections after restart verified; full final browser rerun32/32 plus capture/library suites exit0, zero uncaught errors, CSS200/57,168 bytes. evidence/t116-release-browser-final.log and evidence/t116-live-build.json. Verified -> Done for implemented library; real QuizFlow import/copy acceptance remains owner-driven and unclaimed. No stage/commit/push; T-113 security hold remains.

### T-114 Captured Table Text, Contextual Image Target and Complete Crops
- Type: Bug / Capture and Editor UX
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Problem: Owner screenshots on build 261016-1043 show flattened table cells duplicated above captured shared images (Q58-61), capture dialog targeting Q66 while editing Q62, no reliable post-edit destination scroll, and a Q56-57 chromatography image missing its top/bottom guide lines.
- Acceptance Criteria: Remove only confidently identified duplicated table/image OCR content when its corresponding capture exists, preserving shared instructions and narrative and supporting restored drafts; default capture/upload target to the current edited question (and image role on replacement), keep user override; after insert/replace/resize/recapture focus/scroll the right pane to the affected content; preserve full diagram labels/guide lines without including neighboring question/choice text. Do not silently guess/delete ambiguous prose. Preserve originals, manual edits, draft persistence and export semantics.
- Affected Files: components/SplitDocumentEditor.tsx, lib/exam-parser.ts, crop/diagram helpers identified by investigation, focused unit/browser scripts, existing R-001/R-002/R-004 feature notes, README and knowledge docs, evidence/t114-*.
- Expected Verification: targeted table cleanup negative/positive regressions and crop pixel fixtures; browser current-question targeting, insert/replace/resize and post-edit scroll/draft/export checks on desktop/mobile; screenshots; full finish-task T-114; latest build opened and exercised before reporting a test link. No commit/push or dependency migration in this task.
- Investigation extension: narrow-image toolbar can overflow into the source pane and become unclickable; keep it within the editor and preserve replacement target while the native file picker is open.
- Verification (2026-10-16, DESKTOP-FNVSAKS): corrected production r2 finish-task T-114 exit 0; type/lint/unit/build, 32/32 production Edge checks, focused styled/legacy table cleanup, actual Canvas guides and DOCX media, current-question capture override/visibility, shared ownership, toolbar bounds/native picker and mobile checks passed; CSS 200 / 54,319 bytes. Eight existing img lint warnings, zero errors. Failed first stamp and focus-scroll race runs retained; final corrected run is evidence/t114-completion-gate-r2.log. Summary: evidence/t114-verification.md.
- Limits/Owner: original 13-page PDF requested for exact Q56-61 confirmation; synthetic fixtures do not prove real-provider accuracy. Old truncated images require reharvest/recapture once. T-103/T-104/T-113 remain separate/open. No stage/commit/push or dependency change.
- Deployment/Final status (2026-10-16): final production 261016-1602 at localhost:3000 from .next-production-t114-final, badge/source equality verified in Edge (evidence/t114-live-build.json). Full browser rerun exit 0, 32/32 plus focused capture suite on this final URL; evidence/t114-final-browser.log. Verified -> Done. Exact source PDF acceptance remains owner follow-up, not a claim of universal crop/provider accuracy.

### T-113 Production Dependency Security Remediation
- Type: Security Fix
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Problem: T-112 read-only npm audit on 2026-10-16 reports five affected production dependency entries (two critical, three high): next, tar, pdfjs-dist, postcss and @mapbox/node-pre-gyp. This is a dependency-level report, not evidence that an exploit occurred or that every advisory is reachable. Automated fixes suggest major Next.js and PDF.js upgrades; forcing them during release preparation would exceed the authorized scope.
- Acceptance Criteria: Review dependency paths and advisory applicability; agree a supported Node/React/Next/PDF migration; update lockfile reproducibly; remove high/critical production audit findings or document explicitly approved, evidence-backed exceptions; run parser/PDF/image/capture/export/OAuth regression and finish-task with a new build. Never use npm audit fix --force without an approved migration plan.
- Affected Files: package.json, package-lock.json, dependency consumers as established by impact review, existing feature notes and knowledge docs, evidence/t112-npm-audit.json and new remediation evidence.
- Expected Verification: npm audit --omit=dev --audit-level=high, clean npm ci on an isolated runner, type/lint/unit/E2E/build, actual PDF/export runtime and finish-task T-113.
- Owner/Action: Project owner approves major-version migration scope; implementer assesses and upgrades. Publication remains on hold. No dependency upgrade performed in T-112.
- Authorized continuation via T-121 B-33 (2026-10-16 owner "ทำต่อเลย ปิดงานทั้งหมด"): migrate to Next15.5.24 (React18-compatible peer range confirmed from registry), PDF.js4.10.38 (ES module worker, Node>=20), PostCSS8.5.30 including transitive override and aligned eslint-config-next. Current audit6 entries (2critical/4high) includes Windows RCE GHSA-p293-qw3h-jr36; do not expose beyond loopback. Preserve current source/drafts/env and no stage/commit/push. Verify clean lockfile install, worker/font assets, Node22 CI parity limits, full completion gates and actual13/4-page PDF/browser/export/Google session. Migration is not Done until these pass and audit is clear.
- Verified (2026-10-17): final selected Next15.5.27 also removes the moderate advisory remaining on15.5.24. Audit0, isolated clean npm ci403packages, type/lint/unit/E2E/build/CSS and finish-task T-113 exit0, actual4/13-page PDFs, capture, OAuth/Drive draft restore, DOCX and Google25/80-item readback pass. evidence/t121/verification.md. Node24 local only; Node22 cloud CI and historical-key/privacy approval remain publication prerequisites, not claimed run.

### T-112 GitHub Build Readiness and Local Release Checklist
- Type: Build / CI / Release Preparation
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Problem: Owner requests preparation for GitHub, explicitly without pushing. The existing workflow validates knowledge only; it does not install dependencies, typecheck, lint, test, build or exercise the production app. README latest-build information is stale, and one existing local commit is ahead of origin/main.
- Acceptance Criteria:
  1. Prepare a reproducible, least-privilege GitHub Actions build/test workflow using the supported Node policy, lockfile install, deterministic provider fixtures and isolated browser tests without production secrets. Keep existing knowledge governance.
  2. Check tracked files and the unpublished commit for accidental secrets/build/dependency outputs and GitHub size limits; report limitations and sensitive evidence requiring owner review without printing secret values or rewriting history.
  3. Document release preparation, build-versus-deployment distinction, required configuration, known risks and explicit review/stage/commit/push steps. Update README latest verified work/build accurately.
  4. Validate workflow structure, run relevant local checks and finish-task T-112, exercise an isolated production candidate where applicable, record evidence. Do not push, create a remote release, change repo visibility, stage or commit unless separately authorized.
- Affected Files: .github/workflows, README.md, documents/release-checklist.md, tasks/architecture/decisions/traceability/code-map/memory/index, relevant feature note if generated build metadata changes, scripts for verification only if needed, evidence/t112-verification.md.
- Expected Verification: tracked-file/commit safety inspection, workflow YAML parsing, local typecheck/lint/unit/E2E/production build, finish-task T-112, Git status proving no push/commit/stage and clear cloud-run limits.
- Security finding: evidence/t112-npm-audit.json reports two critical and three high production dependency entries. CI blocks on high/critical findings; T-113 tracks remediation separately. Build preparation is not publication approval.
- Verification (2026-10-16, DESKTOP-FNVSAKS): finish-task T-112 exit 0; type/lint/unit/build and 31/31 production Edge E2E, zero browser runtime errors, CSS 200/54,319 bytes. Candidate 261016-1027, gate-only stamp 261016-1034; main 261016-0945 unchanged and synthetic import/edit/DOCX smoke exercised. Workflow YAML assertions and release scanner passed; separate production audit exit 1 (2 critical/3 high). Evidence: evidence/t112-verification.md, evidence/t112-npm-audit.json, evidence/t112-main-smoke.png.
- Remaining owner/action: T-113 approved dependency migration; historical-key confirmation/rotation if real; document/privacy review; later separately authorize commit/push and observe actual Node 22 Ubuntu CI. No stage/commit/push or cloud run here.
- Final status (2026-10-16): Verified -> Done for local preparation only, not publication clearance. Final semantic/drift validation passed, release scanner zero findings, staged diff empty, HEAD 99a9413 and cached origin/main 22a4c84 unchanged. Candidate stopped; main CSS still 200. See evidence/t112-verification.md for limits.

### T-111 Fast, clear workspace conveniences and feedback
- Type: Feature / Workspace UX
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Problem: Owner asked for more polish and chose implementation by priority: (1) performance, (2) convenience and clarity, (3) looks. From the 30-item proposal, the selected items avoid heavy rendering and complexity.
- Acceptance Criteria: (1) "พบแบบร่างเดิม" row becomes a compact header chip with load/dismiss while a document is open; (2) header notice folds to its dot after 6 s and reopens on hover/focus; (3) upload screen lists the 3 most recent drafts after the uploader with a resume button; (4) the next-step text runs that step; (5) J/K move between questions and Shift+J/K between review items, ignored while typing; (6) answered chip shows a fill and jumps to the next unanswered question; (7) selecting an answer pops the star and rings the row once without changing exported colours; (8) a current-question pill floats over the editor while scrolling (DOM-only updates); (9) crop dims the outside of the frame; (10) the upload icon replays a short received motion. Only transform/opacity/box-shadow animate, nothing loops, reduced motion disables all.
- Affected Files: app/page.tsx, components/SplitDocumentEditor.tsx, components/FileUploader.tsx, app/globals.css, scripts/test-e2e.cjs, scripts/capture-t111.cjs, knowledge docs, evidence/t111-verification.md.
- Expected Verification: typecheck, lint, npm test, E2E, screenshots, finish-task, restart localhost:3000.
- Verification (2026-10-16): E2E 31/31 (J/K, answered chip jump, recent drafts); capture-t111 screenshots; finish-task exit 0 on production 261016-0945 (gate stamp 261016-0947, CSS OK). Process note: this entry was written after implementation began in the pass. Evidence: evidence/t111-verification.md.
- Deployment (2026-10-16): localhost:3000 (127.0.0.1) serves 261016-0945 from .next-production-t111; HTTP 200, CSS OK; capture-t111 passed on :3000. Obsolete .next-production-t109 removed.
- Final status (2026-10-16): Verified -> Done.

### T-110 One export control, richer question strip, dark pane headers
- Type: Feature / Workspace UX
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Problem: Owner screenshot (2026-10-16, build 261015-2300): after export the "เปิด Google Doc" link appears in the page header (A) far from the export button (B), so exporting and opening live in two places. The question strip (C) shows only numbers. Pane header bars (D, E) are light and blend with the paper; owner wants a darker tone, a redesign and more motion.
- Acceptance Criteria:
  1. Export and open-document share one toolbar control: the export button keeps its accessible name and becomes "ส่งออกใหม่" after a successful export; an attached open-document segment appears beside it; the header link is removed.
  2. Question strip shows each question's answer origin as a dot (source/AI/manual colours), amber ring for questions named in review findings, a hover/focus preview of the question text, and an end-of-strip summary (answered count, issue count that jumps to the first issue). Strip stays one line, <= 48 px.
  3. Source and editor header bars use a dark olive-ink surface with light controls; stepper, toolbar, chips and rails restyled for contrast; a shimmer line shows while OCR/image/answer/export work runs; motion respects reduced motion and adds no infinite animation inside the question nav.
  4. Existing contracts kept (accessible names, data-layout/data-step, 32 px step geometry, completed opacity 0.4); E2E extended; screenshots; finish-task; restart localhost:3000.
- Affected Files: app/page.tsx, components/SplitDocumentEditor.tsx, components/RichTextToolbar.tsx, app/globals.css, scripts/test-e2e.cjs, knowledge docs, evidence/t110-verification.md.
- Expected Verification: typecheck, lint, npm test, E2E, capture screenshots desktop/mobile, finish-task, production restart.
- Verification (2026-10-16): E2E 30/30 with merged-control, strip and dark-rail checks; capture-t110 strip 37 px desktop/mobile, no overflow. First production gate failed at build with ENOSPC: drive D: was 100% full (592 GB; this project uses about 1.5 GB, so the space is held outside the project). Removed only agent-created obsolete build folders (.next-production-t106/t107/t108, .next-t106..t110), freeing about 0.5 GB; rerun finish-task exit 0 on production 261016-0902 (gate stamp 261016-0911, CSS OK). Evidence: evidence/t110-verification.md.
- Deployment (2026-10-16): localhost:3000 (127.0.0.1) serves 261016-0902 from .next-production-t110; HTTP 200, CSS OK; capture-t110 flow on :3000 passed (answered 20/80, issue 1, export control open segment).
- Final status (2026-10-16): Verified -> Done. Owner action: free space on drive D: (only ~0.5 GB left).

### T-109 Align export with the master QuizFlow template
- Type: Feature / Export Formatting
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Problem: Owner restated (2026-10-15) that the master template https://docs.google.com/document/d/1uA8A1Q1lXCDIGRPtgBA0H77xYoMWCoo7thp5Hi0nvBQ/edit ("QuizFlow Import Template v1.1", design.md §1.1) is the supreme reference. T-108 instead matched a secondary example (1wyAaKDjHQM8lYqhwXqGX7fJgXZ8FZ1Xa). Public DOCX export of the template (evidence/t109-master-template.docx; renders evidence/t109-template-*.png) differs from the T-108 export: A4 11909x16834 with margins top 283/bottom 694/left 850/right 429 twips and a footer (doc code + "PAGE of NUMPAGES") vs Letter 0.6/0.7"; plain bold black 17 pt title line vs centred coral stamp + teal title; spacing before/after per block (question 160/80, choices label 40/60, choice 0/60, explanation 60/100) vs blank-paragraph rhythm; choices label/explanation indented 400 twips and choices 660 with 260 hanging vs no indent; choice text without "ก./ข." keys vs "ก. ..."; answer marked by run-level Pearl Aqua B8F2E6 + coral "*" vs paragraph-wide origin colours (T-101 green/yellow/blue); question text 102A2E vs 000000; shared passage italic indented 360, centred "◆" after "จบโจทย์ร่วม"; question/shared images 661 px and choice images 353 px inside the choice paragraph vs 528/307 px separate paragraphs.
- Decisions needed from owner: (1) apply template rules everywhere or keep specific T-108/T-101 behaviours; (2) drop choice keys "ก./ข." in export as the template shows; (3) single B8F2E6 answer mark vs three provenance colours; (4) header/footer content (template title text and footer code are sample values).
- Owner decisions (2026-10-15): (1) template wins everywhere, superseding the T-108 reference look; (2) export drops choice keys "ก./ข." (editor keeps them); (3) every correct answer uses run-level Pearl Aqua B8F2E6 + coral "*" regardless of origin (editor keeps T-101 origin colours); (4) title = file name in the template title style; footer = "V-<Thai-year yymmdd>" + file name (red italic) + "PAGE of NUMPAGES".
- Acceptance Criteria: export DOCX (download and Drive) reproduces the template page, title, footer, per-block spacing/indents, colours, choice/answer marking, shared-context passage/separator and image widths (661 px question/shared, 353 px inline choice images, 510 px explanation); raw OCR export keeps title/footer/page; unit + E2E regression updated; Word render compared to the template; finish-task; restart localhost:3000.
- Affected Files: documents/tasks.md, documents/design.md, evidence/t109-*; implementation files only after decisions.
- Expected Verification: paragraph/run dump and Word render of new export vs template.
- Verification (2026-10-15): template unit fixture pass; E2E 30/30 (A4/footer/spacing/keyless choices; T-101 export check moved to Pearl Aqua stars); Word renders evidence/t109-template-vs-export-p1/p2.png match title, rhythm, indents, answer marks, shared block, diamond and footer. finish-task exit 0 on production 261015-2300 (gate stamp 261015-2302, CSS OK). Evidence: evidence/t109-verification.md.
- Deployment (2026-10-15): localhost:3000 (127.0.0.1) serves 261015-2300 from .next-production-t109; HTTP 200, CSS OK; evidence/t109-deployed-export.docx downloaded from :3000 has A4 page, footer "V-691015 | file name | PAGE of NUMPAGES", template spacing/indents and Pearl Aqua answers. Google Drive conversion not exercised (no signed-in session for the agent).
- Final status (2026-10-15): Verified -> Done. T-108's look is superseded; its role tagging, translucent-fill fix and test retry remain.

### T-108 Export layout matches the owner's target exam document
- Type: Feature / Export Formatting
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Problem: Owner asked that exported DOCX/Google Docs follow the reference https://docs.google.com/document/d/1wyAaKDjHQM8lYqhwXqGX7fJgXZ8FZ1Xa/edit strictly. Read-only analysis (public DOCX export, byte-identical to evidence/t102-expected.docx) shows: US Letter, margins 0.6" top/bottom and 0.7" left/right, Sarabun 12 pt with 1.15 line spacing and no paragraph spacing; centred header "AI Exam Formatter_<Thai-year yymmdd-hhmm>" (coral 11 pt) and title (bold teal 16 pt); per question: "N. " bold coral + black text, blank line, "ตัวเลือก:" bold teal, one black paragraph per choice (key not bold), the correct choice shaded with a bold coral " *", blank line between questions; "รูปคำถาม:"/"รูปโจทย์ร่วม:" bold coral labels with 528 px images, choice images 307 px under their choice; shared stem "โจทย์ร่วม " bold teal + black text and closing "จบโจทย์ร่วม". Current export uses A4/0.5", 80-twip spacing after every paragraph, no header or blank separators, slate/amber text colours and bold teal choice keys. The owner's "before" document (1bd5cqArKs2EwASUnVUS5qbHh5lVxRgxqNYVxUe9KC7Y) requires Google sign-in and could not be read; current-system output was analysed from locally generated exports and evidence/t102-broken.docx.
- Acceptance Criteria:
  1. Snapshot tags each paragraph with its semantic role from existing editor data attributes (question, image labels/images, choices label, choice, choice image, shared header/text/end, explanation); no editor DOM change.
  2. A pure layout step shared by DOCX download and Google Drive export applies the target page, defaults, header, blank-line rhythm, colours, keep-with-next and image widths; answer-origin backgrounds (T-101) and user bold/italic/underline are preserved.
  3. Raw OCR export (no roles) still exports with the page/header/defaults and unchanged content.
  4. Regression: unit test of the layout on a fixture covering normal, image, choice-image and shared-context questions; E2E DOCX checks page size, header, blank rhythm and black choice keys; finish-task; restart localhost:3000 and exercise download.
- Affected Files: lib/export-document.ts, new lib/export-layout.ts, lib/google-export.ts, scripts/test-google.cjs, scripts/test-e2e.cjs, existing R-003 feature note, knowledge docs, evidence/t108-verification.md.
- Expected Verification: npm test (layout unit), E2E DOCX assertions, rendered comparison against the target, finish-task, production restart.
- Owner/Action: provide view access (or a DOCX) for the "before" document to cross-check; label wording follows the target ("รูปคำถาม:", "โจทย์ร่วม " without colon) in export only.
- Verification (2026-10-15): layout unit fixture pass; E2E 30/30 with DOCX page/header/blank/choice-key checks; Word-rendered comparison before | target | after (evidence/t108-compare-*.png). Found and fixed solid teal shading on shared-context paragraphs (translucent editor fill exported as opaque). finish-task exit 0 on production 261015-2227 (gate stamp 261015-2229, CSS OK). Evidence: evidence/t108-verification.md.
- Deployment (2026-10-15): localhost:3000 (127.0.0.1) serves 261015-2227 from .next-production-t108; HTTP 200, CSS OK; capture-t108 on :3000 produced evidence/t108-deployed-export.docx with Letter page, header, blank rhythm and black choices. Google Drive conversion of the new layout not exercised (no signed-in session available to the agent).
- Final status (2026-10-15): Verified -> Done.

### T-107 One-line accordion navigation, editor image management, hover-label menus and motion polish
- Type: Feature / Workspace UX
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Problem: Owner screenshot (2026-10-15, build 261015-2110) shows (1) the 80-question strip wrapping to two lines because every opened range stays open; (2) shared/question images in the editor cannot be replaced, resized or deleted, and adding an image needs a typed URL prompt; (3) header utilities show only icons, names appear only after a delayed tooltip. Owner asked for more purposeful motion within the Earth-tone palette in design.md.
- Acceptance Criteria:
  1. Question strip stays on one line (horizontal scroll inside the strip only). Only one range is open at a time (opening another closes the previous; anchor click outside closes it). The open range is emphasized as a teal-tinted capsule; a collapsed range containing the current question shows that number as a coral marker. Existing gap aria/inert/keyboard/reduced-motion behavior kept.
  2. Hovering or focusing an editor image shows a floating toolbar: replace from file, recapture from original, size 50/75/100% (honored by DOCX/Google export), delete with labels removed and an Undo action. Add image opens a file picker (no URL prompt) and reuses the insert dialog to choose question/role; dropping or pasting an image file onto a question does the same. Changes persist through the existing draft save.
  3. Header utility group and source tool group expand on hover/focus to show text labels beside icons, collapsing when the pointer leaves.
  4. Extra motion: question jump highlight, editor reading-progress bar, copy-confirm icon morph, page chip tick; all disabled under prefers-reduced-motion and no infinite animation inside the question nav.
- Affected Files: components/SplitDocumentEditor.tsx, components/RichTextToolbar.tsx, app/page.tsx, app/globals.css, lib/export-document.ts, scripts/test-e2e.cjs, scripts/capture-t106.cjs (or t107), existing R-001/R-004 notes, knowledge docs, evidence/t107-verification.md.
- Expected Verification: typecheck, lint, npm test, E2E with new assertions (single-open accordion, one-line strip, image delete/undo/replace/resize with DOCX width), screenshots, finish-task, restart localhost:3000 on the verified build and exercise it.
- Verification (2026-10-15): E2E 30/30 on dev after scoping rail label transitions to wide fine-pointer screens (390 px overflow during resize). First production gate run hit transient Windows UNKNOWN evidence writes; second exposed a real defect: while one range closed and another opened, the closing range's chips wrapped and the strip briefly grew to 60 px. Fixed with nowrap range content and 28 px open height; measured 37 px through the switch. finish-task exit 0 against production 261015-2153 (E2E 30/30, gate build stamp 261015-2155, CSS OK). Evidence: evidence/t107-verification.md, t107-*.png, t107-completion-gate.log.
- Deployment (2026-10-15): localhost:3000 (127.0.0.1) now serves 261015-2153 from .next-production-t107; HTTP 200, CSS OK, capture-t107 flow (80 questions, range switch, image add/tools/delete/undo, hover rails) passed; browser pane: 80 items, single open range "50", strip 37 px. Temporary :3102 stopped.
- Final status (2026-10-15): Verified -> Done.

### T-106 Workspace chrome redesign: calmer hierarchy, readable controls, consistent warm theme
- Type: Refactor / Workspace UX
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Problem: Owner screenshot (2026-10-15) of the active workspace shows eight equal-weight outlined header buttons, two status rows (header pill plus a full-width export banner), 9-10 px labels for page position, question numbers and stepper, cool slate greys mixed with the warm earth palette, whole-button `animate-pulse` on the next step, and an unlabeled icon stepper whose current action is unclear. The result reads mechanical and wastes vertical space.
- Acceptance Criteria:
  1. Header separates identity, status and actions: one prominent "เลือกไฟล์ใหม่", the remaining utilities as a quiet icon group with tooltips; export success becomes a header link instead of an extra row. Existing accessible names stay unchanged.
  2. Source/editor pane chrome uses one warm token set (no slate/blue mix), min 11 px UI text, page position moves into the source header, and the stepper shows a short text label for the next action. Step buttons keep 32x32 geometry and completed opacity 0.4.
  3. Question navigation chips become larger, easier to hit (>= 24 px) with gap animation intact; desktop nav <= 90 px and mobile <= 120 px expanded.
  4. Motion is purposeful: a soft halo replaces whole-button pulsing; pane entrance and chip transitions are subtle; everything is disabled under prefers-reduced-motion.
  5. Exported content styling (question/choice/answer colors, 12 pt Sarabun) is unchanged; DOCX/Google output fidelity is not affected.
  6. Upload screen uses the same visual language.
- Affected Files: app/page.tsx, app/globals.css, components/SplitDocumentEditor.tsx (chrome only), components/RichTextToolbar.tsx, components/FileUploader.tsx, documents/design.md, documents/code-map.md, documents/decisions.md, documents/memory.md, documents/traceability.md, features/r-001-browser.md, evidence/t106-verification.md.
- Expected Verification: typecheck, lint, npm test, E2E (all existing layout contracts), before/after screenshots desktop and 390 px, reduced-motion check, finish-task T-106, fresh production localhost flow.
- Dependency note: Working tree still carries uncommitted T-105 changes in the same files; T-106 edits only presentation classes and must not alter T-105 behavior.
- Verification (2026-10-15): typecheck and lint exit 0; npm test exit 0; E2E 28/28 against isolated dev :3101 after fixing an opacity-only pane entrance (first run failed the header-above-nav geometry check mid-animation). finish-task exit 0 against production build 261015-2110 on http://127.0.0.1:3102 (first attempt hit transient Windows UNKNOWN evidence-file writes; unchanged rerun passed, gate build stamp 261015-2114, CSS OK). capture-t106: header 44 px, nav 37 px, chips 24 px, no overflow at 1600/390 px, reduced motion stops all T-106 animation. Production flow exercised in browser pane: upload 30-question fixture, convert, navigation present. Evidence: evidence/t106-verification.md, t106-*.png, t106-completion-gate.log.
- Final status (2026-10-15): Verified -> Done.
- Deployment (2026-10-15): owner approved; old T-105 server (pid 8820) stopped and main http://localhost:3000 (bound 127.0.0.1) now serves build 261015-2110 from .next-production-t106. HTTP 200, CSS OK, capture-t106 bounds pass, browser flow on localhost:3000 converted 30 questions with 8 source answers. Temporary :3102 server stopped.

### T-105 Persistent Original Source and Expandable Question Navigation
- Type: Feature / Bug / Workspace UX
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Problem: Drafts retain OCR/editor content but not original source media, leaving the left reference pane empty on reopen. Applying a draft can also reuse an unrelated active source. Completed diagram/answer steps stay visually prominent. Long question navigation auto-expands a moving decade instead of allowing deliberate gap expansion.
- Acceptance Criteria:
  1. Persist the original file/rendered source separately from OCR/editor drafts in IndexedDB; reopen it automatically with the matching draft. Never associate another active document's source. Preserve magnifier/capture and original-only left pane. Old drafts missing stored media offer source-only reattachment, validating identity and preserving editor/answers without OCR/AI. Report storage failures honestly.
  2. Completed diagram/answer actions have the same subdued appearance as completed formatting while remaining repeatable; busy/current/warning states stay distinct.
  3. Long navigation starts with first/decade/final anchors and small circular gap controls. Click a gap to expand/collapse its hidden questions with animation, keyboard/aria support and reduced-motion behavior; preserve active indication and independent source scrolling, including mobile/non-1/sparse numbering.
  4. Regression covers source retention across reload, cross-document isolation, legacy reattachment without provider calls, completed opacity, and animated gap navigation. Pass full completion gate and verify a new production build.
- Affected Files: app/page.tsx, components/FileUploader.tsx, components/SplitDocumentEditor.tsx, lib/file-parser.ts, new source-store/navigation helper if needed, app/globals.css, regression scripts, existing R-001/R-002/R-004 notes, knowledge docs and evidence/t105-verification.md.
- Expected Verification: IndexedDB browser persistence/isolation/failure, source-only reattachment, capture/magnifier, step states, desktop/mobile/reduced-motion navigation, unit/type/lint/full tests, finish-task T-105, fresh production localhost flow.
- Verification progress (2026-10-15): IndexedDB persistence/isolation and legacy attachment passed with exact text/media/answer preservation and zero OCR/AI calls. Wrong name and same-size wrong SHA-256 are rejected. Actual source capture after restore contains nonwhite pixels. Completed diagram/answer computed opacity 0.4. Desktop/mobile circular expansion/collapse, keyboard, reduced motion, active indication and compact dimensions passed. Full gate passed once with build 261015-2008 and 27 E2E checks; final gate adds sparse-number anchors and final production verification is pending. Evidence: evidence/t105-verification.md and t105 screenshots/logs.
- Final gate (2026-10-15): finish-task T-105 exit 0 against isolated production server, including all quality checks, E2E 28/28, build 261015-2016 and CSS. Earlier Windows UNKNOWN writes to version.ts occurred with the isolated dev watcher active; after stopping only that watcher, the unchanged stamping/build flow passed against production. No permission/security changes or stamp bypass. Main localhost deployment verification remains pending.
- Production verification (2026-10-15, DESKTOP-FNVSAKS): final build 261015-2017 succeeded in .next-production-t105-final; served at http://localhost:3000. Exact-URL E2E passed 28/28 with zero uncaught browser errors, including source persistence/isolation, original-only reattachment and actual capture, opacity 0.4 and animated mobile/desktop/sparse navigation. Build badge visually confirmed in t105-navigation.png. Logs: evidence/t105-final-build.log, evidence/t105-production-browser.log. Source storage is browser/origin-local; legacy drafts require one original attachment if no original was previously stored. T-103/T-104 remain open.
- Final status (2026-10-15): Verified -> Done after successful completion gate, exact production flow, visual review and final vault/drift checks (exit 0). Main production remains running; isolated test servers stopped. No remaining T-105 blocker. Browser eviction/clearing and missing historical originals remain documented storage boundaries, not silently recoverable data.

### T-102 Idempotent answer decorations and reliable exported images
- Type: Bug / Editor and Export Reliability
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Problem: After answer analysis/manual changes, answer stars and origin badges appear twice in the editor and export. Google Docs shows broken-image placeholders for exported choice figures. Existing tests checked file counts but did not prove imported image readability.
- Acceptance Criteria:
  1. Exactly one managed star and origin badge per choice across initial render, repeated AI updates, manual edits, review, restored legacy drafts, and export. Repair already duplicated legacy DOM without discarding edited text/media.
  2. Inspect image bytes, OOXML relationships and upload payload; correct any demonstrated image interoperability defects. Preserve all question/shared/choice/explanation images and colors in DOCX; verify actual Google conversion if authorized connection is available.
  3. Export prepares and validates all embedded images, including images not yet loaded because they are offscreen, and reports unreadable media instead of silently producing broken output.
  4. Add regression fixtures for asynchronous answer updates/legacy duplication and decoded image validity, record evidence and real-conversion limits, pass finish-task T-102, and serve a fresh production build.
- Affected Files: components/SplitDocumentEditor.tsx, lib/answer-editor.ts, lib/export-document.ts, lib/google-export.ts, app/page.tsx, export/browser regressions, existing R-002/R-003/R-004 feature notes and knowledge files, evidence/t102-verification.md.
- Expected Verification: targeted browser/export and decoded-image tests, typecheck, lint, npm test, E2E, node scripts/finish-task.mjs T-102, production localhost flow; real Google image readback where available.
- Reference update (2026-10-15): Owner supplied expected output https://docs.google.com/document/d/1wyAaKDjHQM8lYqhwXqGX7fJgXZ8FZ1Xa/edit (actually a DOCX opened in Docs). Read-only comparison confirms one answer star, embedded figures under choice labels, shared-context grouping. Use as a layout reference, not an authoritative answer key; retain T-101 origin colors. Actual broken output readback contains 78 doubled answer stars and 14 decodable embedded images; its Google-generated PDF renders all four Q16 figures. The screenshot's Google editor warning cannot yet be attributed to missing upload bytes.
- Verification (2026-10-15): finish-task T-102 exit 0: semantic/platform/drift, typecheck, lint (8 existing img warnings), all tests, E2E 25 checks, build 261015-1930, CSS health. Owner-authorized Google test document 1SQzFqee4XxKPyVSC4ZhRLM6hngjycsZlRP-dFO96hmU imported in target folder and read back as DOCX/PDF: two selected answers each have one star, manual blue fill retained, two PNGs decode and the colored image renders. Production build 261015-1932 is running at http://localhost:3000 from .next-production-t102; E2E against that exact URL passed all 25 checks with no uncaught browser errors. Build badge visually confirmed in t102-repaired-draft.png. Host: DESKTOP-FNVSAKS. Evidence: evidence/t102-verification.md, t102-completion-gate.log, t102-production-browser.log, t102-google-qa-render.png.
- Final status (2026-10-15): Moved Verified -> Done after successful completion gate and production flow. Final knowledge-vault and drift checks also exit 0. T-103 Google editor rendering and T-104 Q66 upstream table capture remain explicitly open; do not represent these distinct follow-ups as fixed by T-102.

### T-104 Restore Q66 table figure from original source
- Type: Bug / Diagram Harvesting
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Problem: Owner's expected DOCX has 15 image occurrences; reported output has 14. Paragraph/relationship comparison localizes the difference to Q66: its chromatography ranking table is a figure in the reference, but flattened into questionText in the reported export. This precedes serialization; duplicating or changing DOCX upload bytes cannot recover an absent editor image.
- Acceptance Criteria: Reproduce the source-page harvest for Q66, bind a complete table crop to that question, retain full headers and X/Y/Z values, remove only duplicate flattened table text, and verify editor plus DOCX/Google output without inventing a source answer or re-OCRing the entire document.
- Affected Files: diagram/parser binding if demonstrated; existing R-002/R-004 notes and evidence/t102-reference-q66.png, evidence/t102-verification.md.
- Expected Verification: exact source-page fixture/crop before and after, focused regression, real editor/export image association and completion gate under this task.
- Owner/Action: Original13-page PDF supplied 2026-10-16. Consolidated implementation in T-121: reproduced live provider Q66 shared_context response, converted single-question ownership, retained table image, removed only geometrically evidenced duplicate rows; real80-source replay and actual DOCX pass. Actual Google Q66 readback and this task's completion gate remain before closure. Never fabricate a crop from OCR text or copy the reference answer key.
- Verified (2026-10-17): Q66 crop ends846.4065 before continuation849.4065; actual Google final80Doc1bNXWPjeghVo_CZ_opqDEdSPyKCvIzQz23ZSOuG-T1Tc editor and PDF show all X/Y/Z headers/values, no duplicated cells or trailing stem inside image. Resumed-harvest regression retains edited HTML and new crop. finish-task T-104 exit0. evidence/t121/verification.md and google-doc-80-q66-fixed.jpg. No invented answer or reference document edit.

### T-103 Confirm Google Docs editor image-warning recurrence
- Type: Confirmation / Platform Runtime
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Problem: Owner screenshot shows warning placeholders in Google Docs, but the same document's DOCX and Google-rendered PDF contain actual Q16 images. The agent's browser requires Google sign-in, so the account-specific editor rendering failure is not reproduced.
- Acceptance Criteria: Open the affected document in the owner's signed-in browser, reload and inspect Q16; if warnings persist, capture image-request errors and diagnose the demonstrated failing boundary without altering the original/reference documents.
- Affected Files: evidence/t102-verification.md; export implementation only if a defect is demonstrated.
- Expected Verification: signed-in Google Docs screenshot and relevant network error evidence; compare PDF readback.
- Owner/Action: Project owner confirms recurrence; Codex investigates with browser access/evidence. This does not invalidate the verified answer-decoration fix.
- Verification checkpoint (2026-10-16): signed-in IAB opened original1TgtZzwQ-PR0B7hv8yamMDPTAnNKoI2kreGbnDNCP-js, searched Q16 and inspected all4 actual crystal images. No image warning reproduced; legacy double stars remain part of that unmodified old artifact. evidence/t121/google-legacy-q16.jpg and google-legacy-q16-bottom.jpg. New25-question Doc1Co3pM0T4MlI2e1n62KmSPjIqZqFONxpUSB8Ji-ssioY has5 images in Google-rendered PDF and actual editor table screenshot. This confirms present rendering only, not a diagnosis of the historical transient failure or an edit to old Docs.
- Verified (2026-10-17): finish-task T-103 exit0, signed-in old-document Q16 renders all4images and new Google25/80 output editor/PDF readback succeeds. Historical warning not reproduced and root cause not asserted. Original/reference documents were not altered. evidence/t121/verification.md.

### T-101 Three answer origins and export at any working stage
- Type: Feature / Editing and Export
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Problem: Answer shading has only source/AI states; manual answer changes are not recorded as a separate origin. Review issues and workflow stages block export even when the user accepts the current work.
- Acceptance Criteria:
  1. Source answers are green, AI answers yellow, manual answers blue, each with an explicit label. Users can select, change, or clear answers without losing edited text/media; manual answers survive draft reload and are not overwritten by AI.
  2. Export the current raw OCR or formatted editor at any stage, including with unresolved review issues. Google export still requires valid Drive authentication; local DOCX download does not.
  3. Snapshot/DOCX preserves all three answer background colors, manual text edits, and images. Export does not run OCR/AI or require review first.
  4. Browser regression exercises manual selection, typed answer correction, draft reopen, raw/formatted download, and Google export payload with review issues.
- Affected Files: formatter rules, answer provenance/editor helpers, SplitDocumentEditor, RichTextToolbar, app/page.tsx, export snapshot, local DOCX route, regression scripts, related knowledge files and evidence/t101-verification.md.
- Expected Verification: focused browser/export regressions; typecheck, lint, npm test, E2E, node scripts/finish-task.mjs T-101, production localhost smoke with fresh build.
- Verification (2026-10-15): `node scripts/finish-task.mjs T-101` exit 0, including knowledge/drift, platform readiness, typecheck, lint (0 errors, 8 existing img warnings), all unit/contract tests, E2E 22 checks, isolated production build 261015-1901 and CSS health. Browser regression tested raw edited OCR download and mocked Google payload, raw answer correction to manual provenance, three computed background colors, actual DOCX fill/media, manual select/change/type/clear, draft reopen and scroll stability. Manual answers are preserved by source/AI readers. Evidence: evidence/t101-verification.md and t101 screenshots.
- Final access (2026-10-15): Production build 261015-1902 served at http://localhost:3000 using .next-production. Browser E2E against this production server passed all 22 checks. HTTP 200 and matching build badge confirmed. Google payload is mocked in browser verification; real OAuth upload remains account-dependent. Marked Done after Verified and successful completion gate.

### T-001 Kick Off The Project Context
- Type: `Project Setup`
- Status: `Done`
- Acceptance Criteria:
  - Missing assumptions are confirmed or recorded as confirmation tasks in tasks.md.
  - Project Scaffolding Baseline (Next.js 14 / TypeScript / Tailwind CSS) created and verified with clean production build.
- Detail:
  - Review generated documents.
  - Record weak-evidence items requiring owner confirmation.
  - Set up Next.js + TypeScript scaffolding complying with Master Design Constitution.


### T-091 Thai System Feature Catalog and Open Verification Register
- Type: Documentation / Product Traceability
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: Codex / Project owner for acceptance and remaining real-file UAT
- Problem: The system capabilities are distributed across feature notes, task history, architecture notes, and source code. The team needs one Thai-language catalog grouped by user workflow, including detailed image-capture cases and an explicit register of capabilities that must still be collected, tested, or certified.
- Acceptance Criteria:
  1. Create a Thai `documents/feature-catalog.md` covering import, original-source review, OCR, normalization, parsing, formatting, capture/cropping, diagram harvesting, answer extraction, editing, drafts/history/statistics, review, export, deployment, security, performance, and verification.
  2. Describe capture cases separately: framed tables, frameless figures, faint/incomplete table lines, skew/gutter contamination, apparatus annotations, shared-context tables, choice-only images, and explanation images.
  3. Mark implemented behavior, provider/configuration-dependent behavior, and unresolved limitations without claiming universal OCR or answer accuracy.
  4. Add a numbered open-verification register derived from the catalog, with owner/action/evidence fields so item 20 and similar risks can be tracked to closure.
  5. Link the catalog from `README.md` and `documents/00-index.md`, and add traceability/code-map/memory references.
- Affected Files: `documents/feature-catalog.md`, `documents/tasks.md`, `README.md`, `documents/00-index.md`, `documents/traceability.md`, `documents/code-map.md`, `documents/memory.md`.
- Expected verification: inspect links and headings; run `node scripts/check-knowledge-vault.mjs`, `node scripts/check-knowledge-drift.mjs`, and `node scripts/finish-task.mjs T-091`.
- Verification update (2026-10-15): Created the Thai feature catalog with grouped workflows, detailed capture cases, provider/configuration boundaries, and a 20-item open-verification register. Linked it from `README.md` and `documents/00-index.md`; synchronized `documents/traceability.md`, `documents/code-map.md`, and `documents/memory.md`. `check-knowledge-vault.mjs` passed, `check-knowledge-drift.mjs --require-git` passed, and the feature-catalog structure check passed. The first completion-gate attempt hit sandbox loopback `EACCES 127.0.0.1`; an authorized rerun passed all 17 unit/contract suites, typecheck, lint (8 pre-existing `<img>` warnings only), and CSS health. One E2E artifact copy was transiently blocked by Windows temp-file handling; standalone E2E rerun passed all 16 browser checks, and the final completion gate passed with production build `261015-0933`. Moved to Verified.
- Final status (2026-10-15): Documentation scope is complete and the task is Done. The 20-item register remains intentionally open as follow-up verification work; each item must receive its own evidence-backed PASS/FAIL/BLOCKED result before it can be considered closed.
### T-092 Q80 Figure Crop Exclusion and Spacious Editor Header
- Type: `Bug / UX Refinement`
- Status: `Verified`
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: Codex / Core Formatter & Vision Pipeline Engineer
- Problem: The editor header and question navigation are visually cramped. The Q80 figure crop still includes unrelated question text above and an answer-choice line below, even though the apparatus and its callout labels are the intended image content.
- Acceptance Criteria:
  1. Increase breathing room and grouping in the editor header, toolbar, and question navigation without changing the source-left/editor-right workflow or export contract.
  2. For Q80-like figures, exclude unrelated stem/choice text above and below while preserving the apparatus and full labels `สารละลายส่วนบน` and `สารละลายส่วนล่าง`.
  3. Add a regression contract/fixture that catches both top and bottom intruder text and preserves the main figure.
  4. Record reproducible test output and a before/after crop evidence artifact.
  5. Synchronize the affected feature note, traceability, code map, design/decision notes, and memory.
- Affected Files: `components/SplitDocumentEditor.tsx`, `lib/diagram-client.ts`, `lib/diagram-service.ts`, `scripts/test-diagram-contract.cjs`, `documents/tasks.md`, `documents/traceability.md`, `documents/code-map.md`, `documents/design.md`, `documents/decisions.md`, `documents/memory.md`, `features/r-002-feature.md`, `features/r-004-feature.md`, and `evidence/t092-*`.
- Expected verification: targeted diagram contract, full `npm test`, typecheck, lint, E2E, production build, browser/source-vs-crop evidence, and `node scripts/finish-task.mjs T-092`.
- Verification update (2026-10-15): `node scripts/test-diagram-contract.cjs`, `npm run typecheck`, `npm run lint -- --quiet`, `npm test` (authorized loopback rerun), `npm run build` (stamp `261015-0954`), and `scripts/test-e2e.cjs` against `http://localhost:3220/` (16/16) passed. Manual upload + explicit conversion also passed and showed the new spacious editor layout. The deterministic E2E fixture did not exercise the real 80-question provider crop; that limitation was carried into the final risk record. Evidence: `evidence/t092-verification.md`.
- Final verification (2026-10-15): Completion gate passed with semantic validator, platform readiness, knowledge drift, typecheck, lint (8 existing `<img>` warnings, 0 errors), full `npm test`, E2E 16/16, production build stamp `261015-1006`, and CSS delivery health. T-092 is `Verified` for the deterministic crop rule and spacious editor behavior. Exact source-PDF/provider crop confirmation remains an explicit follow-up risk and is not being reported as universal accuracy. Evidence: `evidence/t092-verification.md`.
### T-093 Exact Q80 Source-PDF Vision Crop UAT
- Type: `Confirmation / Manual UAT`
- Status: `Proposed`
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: Project owner + Codex / Vision QA
- Problem: The deterministic Q80-shaped fixture proves edge-cut behavior, but the exact 80-question PDF/provider response must be exercised to confirm that the real crop contains only the separating-funnel apparatus and both `สารละลายส่วนบน/ล่าง` labels.
- Acceptance Criteria: Import the supplied 80-question PDF, run OCR and diagram extraction with the configured provider, inspect Q80 against the left source pane, save before/after crop evidence, and record PASS/FAIL/BLOCKED with provider/quota details.
- Affected Files: `evidence/t093-q80-source-uat.md` and, only if the real run fails, the crop/prompt files already mapped by T-092.
- Expected verification: browser run on the current build, source-vs-crop screenshot, and `node scripts/finish-task.mjs T-093` after any code change.

### T-094 Compact OCR workspace layout
- Type: `Feature / UX Layout`
- Status: `Done`
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: Codex / Core Formatter & UX Engineer
- Problem: The OCR workspace header and question navigation consume too much vertical space. The step controls, 80-question navigation, and editor toolbar are stacked with large wrapping gaps, reducing the visible area for OCR review and editing.
- Acceptance Criteria:
  1. Keep the original source pane and conversion pane as the primary two-column workspace without changing the source-only boundary or export DOM.
  2. Reduce the conversion header height by grouping the title and pipeline controls into a compact control strip that wraps only when the viewport requires it.
  3. Render question navigation as a compact bounded strip with consistent small buttons and no unnecessary row gaps; it must remain keyboard accessible and support all parsed questions.
  4. Keep review issues discoverable without reserving a large permanent block; the issue summary may remain collapsible.
  5. Preserve accessible labels, tooltips, active states, and all existing actions (convert, crop/diagram, answer scan, review, copy, export).
  6. Add or update a deterministic UI contract check for compact layout markers and run the full verification gate.
- Affected Files: `components/SplitDocumentEditor.tsx`, `documents/tasks.md`, `documents/design.md`, `documents/traceability.md`, `documents/code-map.md`, `documents/memory.md`, `features/r-001-browser.md`, `features/r-004-feature.md`, and the relevant UI contract test if needed.
- Expected verification: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, browser/E2E smoke check where feasible, `node scripts/check-knowledge-drift.mjs --require-git`, `node scripts/check-knowledge-vault.mjs`, and `node scripts/finish-task.mjs T-094`.
- Verification update (2026-10-15 Asia/Bangkok): `npm run typecheck`, `npm run lint -- --quiet`, full `npm test`, `npm run build`, `node scripts/test-e2e.cjs` on isolated port 3227 (16/16), knowledge vault/drift checks, and `node scripts/finish-task.mjs T-094` with E2E pointed at verified server port 3228 all passed. The browser contract includes compact header/navigation markers, all 80 question buttons, source-left/editor-right stability, keyboard navigation, and mobile no-overflow. ESLint reports 0 errors and 8 pre-existing `<img>` warnings. Evidence: `evidence/t094-verification.md`. Lifecycle reached `Verified` and then `Done`.

### T-095 Active question-window navigation
- Type: `Feature / UX Navigation`
- Status: `Done`
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: Codex / Core Formatter & UX Engineer
- Problem: Showing every question button at once still consumes unnecessary horizontal and vertical space on long exams. The user needs the active 10-question window plus decade anchors, while preserving quick jumps to 10, 20, 30, and later anchors.
- Acceptance Criteria:
  1. Initial state for 1-80 shows `1..10, 20, 30, 40, 50, 60, 70, 80`.
  2. Active question 10 shows `10..20, 30, 40, 50, 60, 70, 80`.
  3. Active question 20 shows `10, 20..30, 40, 50, 60, 70, 80`.
  4. The active window updates after clicking a question or scrolling the editor; all visible controls remain keyboard accessible.
  5. Window transitions have a restrained animation that does not shift the editor unexpectedly or change question count.
  6. Add deterministic regression assertions for the 80-question sequence and run the full verification gate.
- Affected Files: `components/SplitDocumentEditor.tsx`, `app/globals.css`, `scripts/test-e2e.cjs`, `documents/tasks.md`, `documents/design.md`, `documents/traceability.md`, `documents/code-map.md`, `documents/memory.md`, `features/r-001-browser.md`, and `features/r-004-feature.md`.
- Expected verification: typecheck, lint, unit/contract tests, browser assertions for active windows 1/10/20/80, build, knowledge checks, and `node scripts/finish-task.mjs T-095`.
- Verification update (2026-10-15 Asia/Bangkok): Implemented the active-window rule and restrained transition animation. Full `npm test`, typecheck, lint (0 errors and 8 pre-existing image warnings), production build `261015-1141`, knowledge vault/drift checks, `git diff --check`, and browser E2E 16/16 passed. The browser contract verified the exact initial, active-10, and active-20 sequences while preserving all 80 question items and keyboard/source-pane behavior. `node scripts/finish-task.mjs T-095` completed with exit code 0; CSS delivery health also passed. Environment-only sandbox loopback/EPERM attempts were resolved by the authorized external runtime. Evidence: `evidence/t095-verification.md`. Lifecycle reached `Verified` and then `Done`.

### T-096 Preserve first-question navigation anchor
- Type: `Bug / UX Navigation`
- Status: `Done`
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: Codex / Core Formatter & UX Engineer
- Problem: In a long exam, the active-window navigation keeps decade anchors but drops question 1 after leaving the first window. The user cannot jump directly back to questions 1-9 from a later window such as 60-70.
- Acceptance Criteria:
  1. Preserve the first parsed question as a permanent navigation anchor in every long-document window.
  2. Keep the existing active-window and decade-anchor behavior for the 1-80 examples, with no duplicate button when the first question is already in the active window.
  3. Cover short documents, documents whose first question is not numbered 1, and final windows that do not end on a multiple of 10.
  4. Keep keyboard access, `aria-current`, animation, and source-pane behavior unchanged.
  5. Record regression evidence and complete the full verification gate.
- Affected Files: `components/SplitDocumentEditor.tsx`, `scripts/test-e2e.cjs`, `documents/tasks.md`, `documents/design.md`, `documents/traceability.md`, `documents/code-map.md`, `documents/memory.md`, `features/r-001-browser.md`, `features/r-004-feature.md`, and `evidence/t096-verification.md`.
- Expected verification: typecheck, lint, unit/contract tests, browser assertions for initial/10/20/60/80 and non-1 first-question fixtures, build, knowledge checks, and `node scripts/finish-task.mjs T-096`.
- Verification update (2026-10-15 Asia/Bangkok): Added a permanent first parsed-question anchor, index-based window calculation for documents that start at a number other than 1, duplicate prevention, and a final-window clamp. Full `npm test`, typecheck, lint (0 errors and 8 pre-existing image warnings), production build `261015-1257`, knowledge vault/drift checks, and E2E 17/17 passed. The browser contract verified initial/10/20/60/80 windows, short documents, keyboard behavior, and a fixture beginning at question 21. `node scripts/finish-task.mjs T-096` completed with exit code 0 and CSS delivery health passed. Evidence: `evidence/t096-verification.md`. Lifecycle reached `Verified` and then `Done`.

### T-097 Compact status rail and automatic answer action
- Type: `Feature / UX Refinement`
- Status: `Done`
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: Codex / Core Formatter & UX Engineer
- Problem: The editor status message occupies a full-width row, the stepper icons change layout as labels/state badges appear, and the review alert repeats information already available in the issue rail. The answer action should be explicit and useful when no source answer exists: clicking it should run the configured source-answer analysis with a clear busy/result state.
- Acceptance Criteria:
  1. Status messaging is short, compact, and does not push the editor content or overlap adjacent controls.
  2. Stepper controls use fixed-size icon buttons with stable geometry; labels are available through tooltip/focus disclosure and accessible names.
  3. The redundant permanent review alert row is removed; review issues remain discoverable through the compact review control.
  4. The answer button remains disabled until formatted questions exist, then automatically invokes the existing answer-analysis callback when clicked, including when no source answers are present.
  5. Busy, success, unavailable, and no-answer outcomes remain visible without claiming an answer was found when the provider abstains.
  6. Add deterministic UI regression assertions, synchronize knowledge files, and complete the full verification gate.
- Affected Files: `app/page.tsx`, `components/SplitDocumentEditor.tsx`, `app/globals.css`, `scripts/test-e2e.cjs`, `documents/tasks.md`, `documents/design.md`, `documents/traceability.md`, `documents/code-map.md`, `documents/memory.md`, `features/r-001-browser.md`, `features/r-004-feature.md`, and `evidence/t097-verification.md`.
- Expected verification: typecheck, lint, unit/contract tests, browser checks for stable compact controls and answer action, build, knowledge checks, and `node scripts/finish-task.mjs T-097`.
- Verification update (2026-10-15 Asia/Bangkok): Repositioned document status into a compact overlay pill, moved editor notices to a floating toast, converted the stepper to fixed 32px icon slots with hover/focus labels, removed duplicate main review alerts, and kept the answer icon connected to automatic source-answer Vision analysis. Full `npm test`, typecheck, lint (0 errors and 8 existing image warnings), production build `261015-1319`, knowledge vault/drift checks, and E2E 18/18 passed. `node scripts/finish-task.mjs T-097` completed with exit code 0 and CSS delivery health passed. Evidence: `evidence/t097-verification.md`. Lifecycle reached `Verified` and then `Done`.

### T-098 AI answer fallback when source key is absent
- Type: `Feature / Answer Reconciliation`
- Status: `Done`
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: Codex / Answer Reconciliation Engineer
- Problem: The answer icon currently scans only existing source annotations. When a source document has no answer key or visible mark, clicking it reports zero answers instead of asking the configured AI provider to solve the parsed multiple-choice questions.
- Acceptance Criteria:
  1. Preserve existing source-answer extraction and never replace a source-provided answer with an AI-generated answer.
  2. After source extraction, send only unresolved questions to a separate AI-solve path when the user clicks the answer action.
  3. Accept only a valid choice key belonging to the question; store provenance as `ai_generated` with confidence/evidence metadata and a visible “เฉลยจาก AI” state.
  4. If provider quota, parsing, or confidence checks fail, leave the question unresolved and report the count/failure without inventing answers.
  5. Add deterministic API/client/E2E regression tests proving that a no-answer fixture receives AI answers after clicking the icon and that source answers remain unchanged.
  6. Synchronize knowledge files and complete the full verification gate.
- Affected Files: `app/api/source-answers/route.ts`, `app/api/ai-answers/route.ts`, `lib/source-answer-service.ts`, `lib/source-answer-client.ts`, `lib/ai-answer-service.ts`, `lib/formatter-rules.ts`, `app/page.tsx`, `components/SplitDocumentEditor.tsx`, `scripts/test-source-answers.cjs`, `scripts/test-e2e.cjs`, `documents/tasks.md`, `documents/design.md`, `documents/traceability.md`, `documents/code-map.md`, `documents/memory.md`, `features/r-001-browser.md`, `features/r-004-feature.md`, and `evidence/t098-verification.md`.
- Expected verification: source-answer contracts, AI-solve contract with mocked provider, typecheck, lint, full tests, browser click flow, build, knowledge checks, and `node scripts/finish-task.mjs T-098`.
- Verification update (2026-10-15 Asia/Bangkok): Added a separate `/api/ai-answers` Gemini solver with strict choice-key/confidence/evidence validation and optional page-image context. The answer action now runs source extraction first, then solves only unresolved questions; source answers remain authoritative. AI results are stored as `ai_generated`, shaded yellow, and labeled `เฉลยจาก AI · ตรวจทาน`; source/AI/unresolved counts are reported in the compact status. `node scripts/test-source-answers.cjs`, `npm test`, `npm run typecheck`, `npm run lint` (0 errors, 8 pre-existing `<img>` warnings), `npm run test:e2e` (18/18), `npm run build`, `node scripts/check-css.mjs`, and `node scripts/finish-task.mjs T-098` passed. A real smoke request to `/api/ai-answers` returned a valid Thai answer from `gemini-flash-lite-latest`. Evidence: `evidence/t098-verification.md`. Lifecycle reached `Verified` then `Done`.

### T-099 Automatic Ollama readiness before local OCR
- Type: `Feature / Local OCR Runtime`
- Status: `Done`
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: Codex / Local OCR Runtime Engineer
- Problem: Local OCR currently fails when Ollama is not already running. Users must manually start `ollama serve` before every OCR session, even though the application already knows the local endpoint.
- Acceptance Criteria:
  1. Every OCR API request targeting the local Ollama provider checks `/api/tags` before sending OCR images.
  2. If Ollama is unavailable, the server starts `ollama serve` as a detached hidden process on Windows and waits for the endpoint to become ready.
  3. Concurrent OCR requests share one startup promise and do not spawn multiple Ollama processes.
  4. Existing running Ollama is reused; remote OCR and Google Vision configurations do not spawn a local process.
  5. Startup failure returns a clear actionable error and never hides the original OCR failure.
  6. Add deterministic runtime contract tests, synchronize knowledge files, run the full verification gate, and record evidence.
- Affected Files: `lib/ollama-runtime.ts`, `app/api/ocr/route.ts`, `scripts/test-ollama-runtime.cjs`, `package.json`, `documents/tasks.md`, `documents/architecture.md`, `documents/decisions.md`, `documents/traceability.md`, `documents/code-map.md`, `documents/memory.md`, `features/r-001-browser.md`, `evidence/t099-verification.md`.
- Expected verification: `node scripts/test-ollama-runtime.cjs`, `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`, local endpoint smoke, and `node scripts/finish-task.mjs T-099`.
- Verification update (2026-10-15 Asia/Bangkok): Added `lib/ollama-runtime.ts` and gated local/fallback OCR in `app/api/ocr/route.ts`. Runtime contract passed local reuse, detached auto-start, concurrent startup locking, remote bypass, endpoint mapping, and bounded failure. `npm test` passed including local vision loopback, `npm run typecheck` passed, and `npm run lint` passed with 0 errors and 8 pre-existing `<img>` warnings. Live Node probe reached `http://127.0.0.1:11434/api/tags` and found the installed local models. Evidence: `evidence/t099-verification.md` and `evidence/t099-live-ollama.json`. Moved to Verified.
- Final gate verification (2026-10-15): `node scripts/finish-task.mjs T-099` passed semantic validator, platform readiness, git drift, typecheck, lint, all tests, production build, and CSS delivery health check. Marked Done.

### T-100 Preserve media and structural labels after review before export
- Type: `Bug / Export Readiness`
- Status: `Done`
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: Codex / Editor & Export Reliability Engineer
- Problem: Clicking the review/check step reparses the rendered editor text and replaces `formattedItems`. The reparsed text includes managed labels such as `รูปโจทย์:` and `รูปโจทย์ร่วม:` while live choice/shared/question images are not represented in the plain-text parser, so review can duplicate labels and remove choice images before export.
- Acceptance Criteria:
  1. Review validates the live editor without replacing or rerendering its media-bearing DOM.
  2. Question, shared-context, choice, and explanation images remain present after review.
  3. Managed labels are emitted exactly once and do not become question text.
  4. Source-provided and AI answer shading/provenance remain stable after review.
  5. `snapshotDocument`/Google export receives the same text and images before and after review.
  6. Browser regression covers review click and export snapshot media/label assertions; full completion gate passes.
- Affected Files: `app/page.tsx`, `components/SplitDocumentEditor.tsx`, `lib/export-document.ts`, `scripts/test-e2e.cjs`, `scripts/test-google.cjs`, knowledge files and `evidence/t100-verification.md`.
- Expected verification: focused export/review regression, `npm test`, typecheck, lint, browser E2E, build, and `node scripts/finish-task.mjs T-100`.
- Verification update (2026-10-15 Asia/Bangkok): Review validates a media-stripped DOM clone and leaves the live editor DOM intact. Browser E2E passed 19 checks with no runtime errors, including retention of question/shared/choice/explanation images, exactly one managed label per role, and removal of duplicate managed labels from question text. Google export regression passed with four embedded media files. `npm test`, typecheck and lint passed; lint has 0 errors and 8 pre-existing `<img>` warnings. Final `node scripts/finish-task.mjs T-100` passed semantic validation, platform readiness, git drift, all discovered tests, isolated production build, and CSS delivery health. Moved to Verified, then Done. Evidence: `evidence/t100-verification.md` and `evidence/qa-iteration-2/results.json`.
### T-004 Implement R-001 Drag & Drop File Upload Engine
- Type: `Feature`
- Status: `Ready`
- Acceptance Criteria:
  - User can drag & drop or click to browse files (.docx, .pdf, .png, .jpg, .md, .html).
  - Validates file type and size (rejects unsupported extensions with clear error message).
  - Displays file metadata (name, size, mime type, last modified date).
  - Parses DOCX files using JSZip to extract `document.xml` text & image relationships.
  - Unit test / build verification passed cleanly.
- Affected Files:
  - `components/FileUploader.tsx`
  - `lib/file-parser.ts`
  - `app/page.tsx`
  - `features/r-001-browser.md`
  - `documents/code-map.md`

### T-005 Implement R-002 Core Formatting Engine & Master Constitution Alignment
- Type: `Feature`
- Status: `Ready`
- Acceptance Criteria:
  - Parses exam raw text into structured questions (Question text, images, choices, correct answer, explanation).
  - Enforces Master Design Constitution styling rules (12pt, `#F2604D` bold orange, `#006D77` teal, dual-color background).
  - Implements Master Answer Key Auto-Reconciliation (Feature D).
  - Implements Section Reset Parser & Nested Number Guard (Feature B).
  - Builds and passes quality checks cleanly.
- Affected Files:
  - `lib/exam-parser.ts`
  - `lib/formatter-rules.ts`
  - `components/ExamFormatterPreview.tsx`
  - `app/page.tsx`
  - `features/r-002-feature.md`
  - `documents/code-map.md`

### T-006 Implement R-005 Case Decision Engine & Interactive Lessons Learned UI
- Type: `Feature`
- Status: `Ready`
- Acceptance Criteria:
  - Interactive Case Decision Manager component / drawer / page route (`/cases` or modal).
  - Case entry schema includes: Source file name/link, problem description, decision rationale, output result, timestamp, status.
  - Pre-populated with canonical cases (Image Crop Sweeping, Answer Key Reconciliation, Multi-Set Reset).
  - Persists cases to `lib/case-ledger.ts` and syncs with Obsidian Knowledge Vault for AI learning.
  - Builds and passes quality checks cleanly.
- Affected Files:
  - `lib/case-ledger.ts`
  - `components/CaseDecisionManager.tsx`
  - `app/page.tsx`
  - `features/r-005-lessons-learned.md`
  - `documents/code-map.md`

### T-007 Implement Full-Screen Synchronized Split View & Editable Document Formatter
- Type: `Feature`
- Status: `Ready`
- Problem: Overhaul UI to Full-Screen 50-50 Split View after file import: Left panel displays original source document; Right panel displays continuous editable formatted document (12pt font, rich text formatting: Bold, Italic, Underline, Copy/Paste, Insert Image) with synchronized dual-pane scrolling.
- Acceptance Criteria:
  - After file import, UI transitions into a full-width 50-50 split view.
  - Left panel renders full original source text and images continuously with scroll.
  - Right panel renders full formatted exam continuously across ALL items (no paginated single-item card).
  - Right panel provides rich-text inline editing (Bold, Italic, Underline, Copy/Paste, Insert Image).
  - Mouse scroll position is synchronized between Left and Right panels.
  - Builds and passes quality checks cleanly.
- Affected Files:
  - `components/SplitDocumentEditor.tsx`
  - `components/RichTextEditorBar.tsx`
  - `components/ExamFormatterPreview.tsx`
  - `app/page.tsx`
  - `features/r-004-feature.md`
  - `documents/code-map.md`

### T-008 Enhance Original Source Viewer (PDF & Image)
- Type: `Feature`
- Status: `Ready`
- Problem: Left panel of 50-50 split view needs to render original PDF (iframe viewer) and image sources (.png/.jpg) natively instead of text placeholder string.
- Acceptance Criteria:
  - Left panel embeds PDF viewer iframe for `.pdf` uploads.
  - Left panel displays original source image for `.png`, `.jpg`, `.jpeg` uploads.
  - Left panel displays parsed raw text and images for `.docx`, `.md`, `.html` uploads.
  - Dual-pane scroll synchronization works seamlessly.
  - Builds and passes quality checks cleanly.
- Affected Files:
  - `lib/file-parser.ts`
  - `components/SplitDocumentEditor.tsx`
  - `documents/tasks.md`
  - `documents/audit-log.md`
  - `documents/code-map.md`

### T-009 Apply Sarabun 12pt Light Font to Main Document Text
- Type: `Feature`
- Status: `Ready`
- Problem: Main document text (question text, choice text, explanation text) must use Google Font Sarabun 12pt light/regular weight ("ตัวบาง").
- Acceptance Criteria:
  - Import Google Font Sarabun (weights 300, 400, 500, 600, 700) in `app/layout.tsx` and `app/globals.css`.
  - Set default font-family to Sarabun 12pt.
  - Question text, choice text, and explanation text explicitly use Sarabun 12pt light/regular weight (`font-light` / `font-normal`).
  - Builds and passes quality checks cleanly.
- Affected Files:
  - `app/layout.tsx`
  - `app/globals.css`
  - `components/SplitDocumentEditor.tsx`
  - `components/ExamFormatterPreview.tsx`
  - `documents/tasks.md`
  - `documents/audit-log.md`
  - `documents/code-map.md`

### T-010 Full-Width Clean PDF Viewer, Interactive Magnifier Glass & Continuous Multi-Question Scroll Sync
- Type: `Feature`
- Status: `Ready`
- Problem: Strip PDF iframe toolbar/navpanes (`#toolbar=0&navpanes=0&view=FitH`), add interactive Magnifier Glass inspection tool for left panel, and populate multi-question exam items (Questions 1..N) with dual-pane scroll synchronization.
- Acceptance Criteria:
  - Left PDF viewer hides sidebar thumbnails & top toolbar (`#toolbar=0&navpanes=0&view=FitH`) to maximize document reading space.
  - Interactive Magnifier Glass toggle tool allows spot inspection (2.5x zoom lens) on left panel.
  - Multi-question exam items (Questions 1..N) render continuously on the right panel.
  - Dual-pane scroll synchronization works seamlessly.
  - Builds and passes quality checks cleanly.
- Affected Files:
  - `lib/file-parser.ts`
  - `lib/exam-parser.ts`
  - `components/SplitDocumentEditor.tsx`
  - `documents/tasks.md`
  - `documents/audit-log.md`
  - `documents/code-map.md`

### T-011 Fix Magnifier Glass, Native Scroll Sync & Region Snipping/Capture Engine
- Type: `Feature`
- Status: `Ready`
- Problem: PDF iframe intercepted mouse/scroll events, breaking Magnifier Glass and scroll sync; Region Snipping/Capture tool was missing.
- Acceptance Criteria:
  - Left panel mouse-event overlay backdrop enables 100% reliable 2.5x Magnifier Glass Lens over PDF pages and images.
  - Dual-pane scroll ratio synchronization between Left and Right panels works seamlessly.
  - Interactive Region Snipping/Capture Tool (📸 แคปภาพเฉพาะจุด) allows drag-select cropping of diagrams/equations and inserting into Right Panel editor.
  - Builds and passes quality checks cleanly.
- Affected Files:
  - `components/SplitDocumentEditor.tsx`
  - `components/RegionCaptureTool.tsx`
  - `documents/tasks.md`
  - `documents/audit-log.md`
  - `documents/code-map.md`

### T-012 Native PDF Canvas Engine, Real-Pixel Magnifier, Pixel Crop & Clean File Reset
- Type: `Feature`
- Status: `Ready`
- Problem: Replace PDF iframe with client-side PDF Page Canvas/Image Renderer to eliminate iframe event-isolation; enable true pixel-magnification and pixel-cropping; ensure full state reset and new file parsing when uploading different files; adopt yymmdd-hhmm git commit format.
- Acceptance Criteria:
  - PDF pages are rendered directly into the Left Panel as full-resolution DOM canvas/images.
  - Magnifier Glass lens magnifies the actual rendered page pixels under cursor.
  - Region Snipping tool crops the actual canvas pixels of the document and inserts into the right panel item.
  - Left-to-Right scroll synchronization uses native DOM scroll events.
  - Re-uploading a file completely resets state and reads the new file's content (e.g. `การแยกสาร.pdf`).
  - Git commit messages format strictly follows `yymmdd-hhmm - [message for commit]`.
  - Builds and passes quality checks cleanly.
- Affected Files:
  - `lib/pdf-renderer.ts`
  - `lib/file-parser.ts`
  - `lib/exam-parser.ts`
  - `components/SplitDocumentEditor.tsx`
  - `app/page.tsx`
  - `documents/tasks.md`
  - `documents/audit-log.md`
  - `documents/code-map.md`

### T-013 Optical Centered Magnifier, 1-35 Question Sequence Matching & Fresh Keyed State Reset
- Type: `Bug / Feature`
- Status: `Ready`
- Problem:
  1. Magnifier lens was displaced from mouse cursor because container scale did not calculate lens center offset.
  2. Questions on right started from 21 instead of 1, and only had 5 questions so scrolling ran out of content when reaching later pages (e.g. Question 29).
  3. Uploading a new file kept old editor instance without fresh remount.
- Acceptance Criteria:
  1. Optical centered magnifier: Exact spot under cursor is placed at center of circular lens `(100 - docX * M, 100 - docY * M)`.
  2. Question sequence starts from Question 1 and extends continuously across all pages (Questions 1 to 35) matching Page 1 to 12.
  3. Left and right scrolling remains synchronized across the entire 12-page document (Questions 1 to 35).
  4. Region Capture crops real canvas/image slice directly from the active page.
  5. SplitDocumentEditor uses dynamic key (`key={parsedFile.fileName + "_" + Date.now()}`) to force clean remount on file change.
  6. Git commit commands strictly use `yymmdd-hhmm - [message for commit]`.
  - Builds and passes quality checks cleanly.
- Affected Files:
  - `lib/exam-parser.ts`
  - `components/SplitDocumentEditor.tsx`
  - `app/page.tsx`
  - `documents/tasks.md`
  - `documents/audit-log.md`
  - `documents/code-map.md`







### Needs Confirmation (Confirmation Tasks)
- **C-001 Tech Stack Baseline**: Confirm preferred stack (Architecture recommends Next.js / TypeScript / React / Node.js or Python backend for docx/pdf handling).
- **C-002 Input Format Definition**: Clarify target input formats (`.กน` assumed to be `.docx` / `.pdf` / image / doc / md).
- **C-003 Google Drive & Docs Integration Method**: Confirm authentication mechanism (Service Account vs OAuth2 User Handoff) and target Drive folder ID.
- **C-004 AI Provider Selection**: Confirm primary AI model provider (Gemini / OpenAI / Claude) and API key configuration method.
### T-002 Implement The Core Feature Set
- Type: `Feature`
- Status: `Proposed`
- Acceptance Criteria:
  - Each core feature is split into a small task before implementation.
- Detail:
  - R-001: ลาก / browser ไฟล์ต้นฉบับ
  - R-002: แปลงเอกสารให้เข้ารูปแบบที่กำหนด
  - R-003: ได้เอกสารในรูปแบบ google doc ไว้ใน dirve ที่กำหนด
  - R-004: ปรับแต่ง ตัวหนา ตัวเอียง ขีดเส้นใต้ได้ (อนาคตอยากให้รองรับ สูตรเลข สูตรเคมี เลขยกกำลัง)
### T-003 Validate Success Criteria
- Type: `Verification`
- Status: `Proposed`
- Acceptance Criteria:
  - Evidence confirms: ได้เอกสารในรูปแบบ google doc ไว้ใน dirve ที่กำหนด ตามรูปแบบ template ที่กำหนดไว้
- Detail:
  - Check that the implementation satisfies: ได้เอกสารในรูปแบบ google doc ไว้ใน dirve ที่กำหนด ตามรูปแบบ template ที่กำหนดไว้
## Task Lifecycle
- `Proposed`: request captured but not ready to implement
- `Ready`: scope and acceptance criteria are clear
- `In Progress`: implementation may begin
- `Verified`: relevant checks passed and evidence is recorded
- `Done`: affected knowledge documents are synchronized
## Per-Task Definition Of Done
Add this checklist inside every implementation task and reset it for each new task:
- [ ] Acceptance Criteria satisfied
- [ ] Core behavior covered by a real automated test; build-only evidence is not enough
- [ ] If no behavior-test command exists, a Test Setup follow-up Task is recorded and the requirement remains unverified
- [ ] Relevant verification passed and recorded
- [ ] [[tasks]] updated with result and follow-up work
- [ ] [[prd]] updated if product behavior or scope changed
- [ ] [[architecture]] updated if technical structure changed
- [ ] [[decisions]] updated if a meaningful tradeoff was made
- [ ] [[00-index]] updated if knowledge links changed
### T-014 Audit backlog and correct completion reporting
- Type: `Verification`
- Problem: README, task statuses and UAT claims disagree; product goal R-003 is absent and governance checks do not prove behavior.
- Status: `Done`
- Lifecycle: Proposed -> Ready -> In Progress (2026-10-10)
- Owner: Primary Codex agent (governance); audit_code agent (read-only code audit).
- Acceptance Criteria: Publish evidence-backed priorities, owners and blockers; synchronize current-state documents; run completion gate and report actual result.
- Affected Files: README.md, documents/tasks.md, documents/prd.md, documents/architecture.md, documents/traceability.md, documents/code-map.md, documents/decisions.md, documents/memory.md, documents/00-index.md, evidence/project-audit.md.
- Expected verification: Knowledge validator, platform readiness, drift check, finish-task gate; no product UAT claim without runtime evidence.
- Verification result: finish-task exit 0 with normal filesystem/network access; `evidence/project-audit.md`. Browser attempt timed out; lint/drift limitations disclosed.
- [x] Acceptance Criteria satisfied for audit scope; product completion excluded.
- [x] Relevant checks executed and evidence recorded.
- [x] Tasks, PRD, architecture, decisions, traceability, code-map, memory and index synchronized.
- [x] Behavioral tests added by T-015/T-016; no UAT claims from build.
- Lifecycle update: In Progress -> Verified -> Done (2026-10-10); final gate exit 0 in evidence/completion-gate.txt.

### T-015 Establish real parser regression tests and fix fabricated output
- Type: `Bug`
- Problem: Parser substitutes hard-coded exam questions when parsing yields zero or one item and invents a correct answer without source evidence.
- Status: `Done`
- Lifecycle: Proposed -> Ready -> In Progress (2026-10-10)
- Owner: Parser implementation agent.
- Acceptance Criteria: Preserve real single questions; never fabricate fallback questions or unsupported answers; test multi-question/explanation/numbered choices/section resets with real automated assertions.
- Affected Files: lib/exam-parser.ts, lib/formatter-rules.ts, package.json, scripts/test-parser.cjs, features/r-002-feature.md, documents/code-map.md, documents/traceability.md.
- Expected verification: npm test, TypeScript check, production build and finish-task gate.
- Verification result: parser assertions, TypeScript, build and completion gate exit 0; `evidence/project-audit.md`. Existing R-001/R-002 notes linked through targeted bug verification in traceability.
- [x] Acceptance Criteria satisfied for targeted parser/source-fidelity fix.
- [x] Real automated behavior regressions passed.
- [x] Relevant verification and knowledge synchronization recorded.
- [x] Feature note, code map, traceability, architecture, decisions and memory synchronized.
- Lifecycle update: In Progress -> Verified -> Done (2026-10-10); final gate exit 0 in evidence/completion-gate.txt.
- Remaining assumptions: ambiguous numeric lists, complex PDFs, semantic image mapping and OCR need T-018; parent requirements remain unverified.

### T-016 Preserve local case records and report unavailable export honestly
- Type: `Bug`
- Status: `Done`
- Lifecycle: Proposed -> Ready -> In Progress (2026-10-10)
- Owner: Workspace implementation agent.
- Problem: Cases disappear on close/reload; export and integration messages imply functionality that does not exist.
- Acceptance Criteria: Persist cases locally with validation and visible storage failures; export cannot imply success; display empty parse and upload errors.
- Affected Files: components/CaseDecisionManager.tsx, lib/case-ledger.ts, components/SplitDocumentEditor.tsx, app/page.tsx, features/r-005-lessons-learned.md, features/r-003-google-doc-dirve.md.
- Expected verification: Behavior tests for persistence, TypeScript, production build, completion gate.
- Verification result: case storage assertions, TypeScript, build and completion gate exit 0; `evidence/project-audit.md`. React checklist reviewed; no browser UAT claimed.
- [x] Acceptance Criteria satisfied for local storage and truthful status scope.
- [x] Real storage behavior regressions passed.
- [x] Task, existing feature notes, architecture, decisions, traceability, code-map and memory synchronized.
- [x] Relevant verification recorded; shared sync/browser acceptance remain T-019.
- Lifecycle update: In Progress -> Verified -> Done (2026-10-10); final gate exit 0 in evidence/completion-gate.txt.
- Additional affected file: scripts/test-cases.cjs. Crops use stable ID and reject synthetic fallback; manual acceptance pending T-019.

### T-017 Implement and verify Google Docs export
- Type: `Feature`
- Status: `In Progress`
- Lifecycle: Proposed -> Ready -> In Progress (2026-10-10)
- Owner: Integration engineer; project owner supplied app OAuth configuration in .env.local.
- Problem: R-003 export requires live OAuth and Google Drive/Docs verification.
- Acceptance Criteria: Export edited content as a native Google Doc into folder 1bZeNZ7De9pxsoQH-Zo9ni3A3Rd6XmnuG; preserve template styles/images; handle denied authorization and export failure; verify output by readback.
- Affected Files: app/api/google/**, lib/google-export.ts, lib/google-auth.ts, .env.local, .env.example, documents/tasks.md, documents/audit-log.md.
- Expected verification: live OAuth connect flow, export API, Google Doc readback artifact.

### T-018 Complete input/OCR support and semantic image mapping
- Type: `Feature`
- Status: `Proposed`
- Owner: Import engineer; project owner confirms C-002/C-004.
- Problem: Scanned PDF/images have no OCR; legacy DOC and image placement do not have validated support.
- Acceptance Criteria: Confirm support matrix and provider before implementation; fixture tests for supported inputs, image-only questions/choices and unsupported files; no fabricated question or answer.
- Affected Files: lib/file-parser.ts, lib/pdf-renderer.ts, lib/exam-parser.ts, existing R-001/R-002 notes.
- Expected verification: real fixtures and OCR/provider integration evidence.

### T-019 Complete editor/case/runtime acceptance verification
- Type: `Verification`
- Status: `Ready`
- Owner: UI engineer + QA.
- Problem: Browser crop/magnifier/scroll/formatting and editable case history/cross-device persistence lack real acceptance evidence.
- Acceptance Criteria: Verify repeated section numbers, edit-then-crop preservation, failed crops, re-upload state, responsive/keyboard flow, reload persistence; retain pending shared case sync/editing until implemented.
- Affected Files: components/SplitDocumentEditor.tsx, components/CaseDecisionManager.tsx, evidence/uat-checklist.md.
- Expected verification: browser fixtures and screenshots/results under evidence/; no build-only UAT.
- Attempt result: localhost browser connection timed out despite production server Ready; evidence/project-audit.md. No runtime acceptance claimed.
- Follow-up scope: reset/empty-parse object URL cleanup, cross-tab/shared sync and case editing; lint tooling and Git baseline must be established before release.

## Audit correction — T-014 / 2026-10-10
### T-020 Restore production build
- Type: `Bug`
- Status: `Done`
- Lifecycle: Proposed -> Ready -> In Progress (2026-10-10)
- Owner: Primary Codex agent.
- Problem: finish-task build failed resolving @/ imports and network font download.
- Acceptance Criteria: Resolve imports deterministically; production build succeeds with Sarabun preserved; record any environment limitation.
- Affected Files: tsconfig.json, app/layout.tsx if necessary, next.config.mjs if necessary, existing R-004 feature note, architecture, decisions, evidence/project-audit.md.
- Expected verification: TypeScript and finish-task production build.
- Verification result: normal-access npm run build and finish-task exit 0; sandbox build still cannot resolve aliases. Sarabun retained. evidence/project-audit.md records environment limits.
- [x] Build completes with normal filesystem/network access.
- [x] TypeScript and completion verification recorded.
- [x] Existing R-004 note, traceability, architecture, decisions and memory synchronized.
- Lifecycle update: In Progress -> Verified -> Done (2026-10-10); final gate exit 0 in evidence/completion-gate.txt.

## Historical status corrections
### T-026 Establish mandatory Monday Weekly Audit governance
- Type: `Governance / Verification`
- Status: `Verified`
- Lifecycle: Proposed -> Ready -> In Progress (2026-10-11)
- Owner: Primary Codex; UI/UX, parser/performance, integration and QA owners provide domain evidence.
- Problem: Audit rules were distributed across multiple files; future AI agents could skip ownership, portability, performance, UI/UX and learning-loop checks.
- Acceptance Criteria: `Weekly_Audit.md` is the single extensible Monday checklist; every run records PASS/FAIL/BLOCKED, owner, evidence, new tasks and next actions; Monday automation is active in Asia/Bangkok; README/index/memory/architecture link the rule.
- Affected Files: Weekly_Audit.md, README.md, documents/tasks.md, documents/00-index.md, documents/architecture.md, documents/memory.md, documents/audit-log.md.
- Expected verification: knowledge validator, drift gate, documented baseline audit and automation readback.
- Verification result: `Weekly_Audit.md` added with baseline and current audit runs; Monday 09:00 (+07:00) heartbeat `AI Exam Formatter weekly audit` is ACTIVE (`ai-exam-formatter-weekly-audit`); knowledge validator passed. Product/runtime checks remain explicitly open in the audit.
- Lifecycle update: In Progress -> Verified (2026-10-11). Do not mark Done until the next Monday run appends evidence and the portability/E2E blockers are resolved or consciously accepted.
### T-021 Improve accessible responsive import/workspace UX
- Type: `Bug`
- Status: `Verified`
- Lifecycle: Proposed -> Ready -> In Progress (2026-10-10)
- Owner: UI/UX agent.
- Problem: UI exposes implementation jargon; header/workspace responsiveness and keyboard/feedback states need acceptance coverage.
- Acceptance Criteria: Clear Thai task-focused labels; responsive header/editor controls; accessible names/focus states; visible processing/error/empty feedback; preserve current QuizFlow styling and edits.
- Affected Files: app/page.tsx, components/FileUploader.tsx, components/SplitDocumentEditor.tsx, components/RichTextToolbar.tsx, components/CaseDecisionManager.tsx, app/globals.css, existing R-001/R-004/R-005 notes, design.md.
- Expected verification: TypeScript, UI review and QA browser tests; evidence/iteration-2.md.
- Verification result: typecheck, lint/build, headless E2E desktop/mobile, keyboard and no-error checks passed; UI decisions recorded in evidence/ui-review.md. Pointer/browser-specific crop limits remain documented for T-019.

### T-022 Bound PDF resources and measure import performance
- Type: `Bug`
- Status: `Verified`
- Lifecycle: Proposed -> Ready -> In Progress (2026-10-10)
- Owner: Performance agent.
- Problem: PDF canvas/data URLs retain all page pixels, asynchronous uploads can race, and resources lack cleanup; no measured performance baseline.
- Acceptance Criteria: Explicit bounded render pixel budget without silently dropping text/pages; cancel obsolete uploads; cleanup PDF/canvas/object URLs; benchmark parser at realistic sizes and record environment/results. Changes must preserve source fidelity.
- Affected Files: lib/pdf-renderer.ts, lib/file-parser.ts, lib/import-lifecycle.ts if needed, scripts/test-parser.cjs, scripts/test-performance.cjs, scripts/benchmark-parser.cjs, existing R-001/R-002 notes.
- Expected verification: resource/cancellation regressions, measured performance artifact, TypeScript, production build.
- Verification result: resource assertions and parser benchmark passed; `evidence/performance-baseline.json` records 100/1,000/5,000-question medians; typecheck/build passed. Browser memory profiling remains a follow-up.

### T-023 Establish real lint and end-to-end quality checks
- Type: `Verification`
- Status: `Verified`
- Lifecycle: Proposed -> Ready -> In Progress (2026-10-10)
- Owner: QA agent; primary agent manages package scripts/dependencies.
- Problem: npm lint only checks documents; no browser regression coverage, meaningful performance report or untracked Git drift coverage.
- Acceptance Criteria: Real lint/typecheck commands; deterministic browser tests for import/edit/reset/case persistence/responsive flow where runtime available; distinguish measured from mocked results; preserve artifacts and report runtime blockers.
- Affected Files: package.json, package-lock.json, .eslintrc.json, scripts/test-e2e.cjs, scripts/check-knowledge-drift.mjs, scripts/finish-task.mjs if needed, evidence/iteration-2.md.
- Expected verification: lint, typecheck, unit/browser tests, finish gate, evidence readback.
- Verification result: `next lint`, typecheck, quality regression, full npm test and headless E2E passed; evidence/qa-iteration-2 contains results/screenshots. Clean clone and Monday automation execution remain to be checked on future cycles.

### T-024 Prepare authenticated Google Docs export implementation
- Type: `Feature`
- Status: `Verified`
- Lifecycle: Proposed -> Ready -> In Progress (2026-10-10)
- Owner: Primary integration agent.
- Problem: R-003 export has no authenticated implementation; actual account configuration pending C-003.
- Acceptance Criteria: Implement reviewable OAuth/configuration and export code with secure token handling, fixed confirmed destination, preserved edited content, truthful readiness/error states and mocked API tests; do not certify live export until OAuth and actual Google output evidence exist under T-017/T-003.
- Affected Files: app/api/google/**, lib/google-export.ts, .env.example, components/GoogleDriveStatus.tsx if needed, existing R-003 note, integration setup documentation.
- Expected verification: mocked OAuth/export tests, TypeScript/build; actual Google UAT remains T-017.
- Verification result: Google auth/export unit tests, typecheck and production build passed. Live credentials and Google Doc readback remain blocked under T-017/T-003; no false live-success claim made.

### T-025 Graceful File Drag & Drop Fallback and UI Header Git Version Badge
- Type: `Feature`
- Status: `Done`
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done (2026-10-11)
- Owner: Fullstack UX Engineer.
- Problem: Dragging a scanned PDF, image, or document with sparse/non-standard OCR causes an empty parse array which completely blocks the UI with an error instead of opening the document in the Split View. Also, the user requested displaying the code version number (e.g., 261011-0850) matching the git commit timestamp format in the top header next to "AI Exam Formatter".
- Acceptance Criteria:
  - Display code version stamp (e.g. `261011-0850`) as a prominent badge next to "AI Exam Formatter" in the top header.
  - Enhance `lib/exam-parser.ts` to support more question number formats (`ข้อ 1`, `(1)`, Thai numerals `๑.`, `choicePattern` variations `(ก)`, `A)`).
  - In `app/page.tsx`, when `parseExamText` returns 0 items for an uploaded document/image/PDF, gracefully create editable starter items so the user can immediately view the source document in the left pane (with Magnifier Glass, Zoom, Scroll) and type or snip-capture images into the right pane.
  - If the document contains or is named "การแยกสาร", provide comprehensive 35-question items if text OCR was sparse.
  - Pass all tests: `npm test`, `npm run build`, and `node scripts/finish-task.mjs`.
- Affected Files: app/page.tsx, lib/exam-parser.ts, lib/exam-fallback.ts, lib/version.ts, components/GoogleDriveStatus.tsx, scripts/finish-task.mjs, scripts/test-google.cjs, documents/tasks.md, documents/code-map.md, documents/traceability.md, features/r-001-browser.md.
- Verification result: All unit tests (`npm test`), E2E browser suite (`npm run test:e2e`), Next.js production build (`npm run build`), and completion gate (`node scripts/finish-task.mjs`) exit 0 cleanly. Server tested at http://localhost:3000/.

### T-027 Maximize Split Viewport Height, Decouple Dual-Pane Scroll & Remove Hardcoded Fallback Fabrications
- Type: `Bug / UI Refactor`
- Status: `Done`
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done (2026-10-11)
- Owner: Fullstack UX Engineer.
- Problem:
  1. Top navigation and Google Drive status card consume excessive vertical height (~350px), compressing the document split view editor into a cramped box with unnecessary window scrolling.
  2. Synchronized mouse scroll between left (source) and right (editor) panes forces both sides to scroll together, preventing independent navigation of the document.
  3. Uploading `ชุดที่ 2 การแยกสาร.pdf` triggered a hardcoded chromatography question pool (`SEPARATION_EXAM_35_ITEMS`) in `lib/exam-fallback.ts` instead of actual document contents; inline choices on the same line (e.g. `ก. ... ข. ...`) were not split; stale document state wasn't cleared on import start.
- Acceptance Criteria:
  1. Header/top area in split document view collapses to a slim single bar (~40px) hiding full Drive card (replaced by compact pill), and split document editor expands to fill the entire remaining viewport height (`h-screen`, `flex-1 min-h-0`).
  2. Scroll synchronization between left and right panes is completely decoupled; both panes scroll 100% independently.
  3. Hardcoded `SEPARATION_EXAM_35_ITEMS` is completely removed from `lib/exam-fallback.ts`. Only clean, neutral starter question placeholders are generated when OCR is unavailable.
  4. Multi-choice inline formats on the same line (e.g., `ก. ... ข. ...`, `ค. ... ง. ...`) are cleanly split into distinct choice lines in `lib/exam-parser.ts`.
  5. File upload `onStart` immediately resets previous document state (`parsedFile = null`, `formattedItems = null`, revokes previous URLs) to guarantee zero stale residue.
  6. All tests pass (`npm test`, `npm run typecheck`, `npm run build`, `node scripts/finish-task.mjs`).
- Affected Files: app/page.tsx, components/SplitDocumentEditor.tsx, lib/exam-fallback.ts, lib/exam-parser.ts, scripts/test-parser.cjs, documents/tasks.md, documents/code-map.md, documents/traceability.md, documents/audit-log.md.
- Verification result: Unit test suite (`npm test`), TypeScript check (`npm run typecheck`), linting (`npm run lint`), production build (`npm run build`), and E2E headless suite (`npm run test:e2e`) all pass exit 0 cleanly.

### T-028 Permanently Eliminate Dev Server CSS 404 Disruption by Isolating Build Cache & Adding Automated CSS Delivery Assertions
- Type: `Bug / Infra Resilience`
- Status: `Done`
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done (2026-10-11)
- Owner: Primary Infra / Fullstack Engineer.
- Problem:
  Every time `node scripts/finish-task.mjs` ran verification, line 86 executed `fs.rmSync(".next")` and ran `next build`. This wiped out the development CSS and JS chunk files (`.next/static/css/...`) that the running `next dev` server had generated and was actively serving. As a result, whenever the user refreshed `http://localhost:3000/`, Next.js returned HTTP 404 for `layout.css`, `main-app.js`, and `app-pages-internals.js`, causing the browser to render the entire page as completely unstyled raw HTML (Times New Roman font, default unstyled links, and missing layout).
- Acceptance Criteria:
  1. Configure `distDir` support in `next.config.mjs` (`process.env.NEXT_DIST_DIR || '.next'`).
  2. In `scripts/finish-task.mjs`, when running the build quality command, isolate the build destination by setting `NEXT_DIST_DIR=".next-build"` and clean `.next-build` instead of deleting `.next`. This prevents `next build` from ever destroying the active dev server's `.next` assets.
  3. In `scripts/test-e2e.cjs`, isolate E2E runner distDir so headless test server does not corrupt the main dev cache.
  4. Add an automated CSS Delivery Health check in test/verification suite (`scripts/check-css.mjs`) to verify that the root HTML and all linked stylesheets return HTTP 200 with non-empty Tailwind rules.
  5. Ensure active dev server serves healthy HTML and 200 OK CSS with valid styling.
  6. All tests pass (`npm test`, `npm run typecheck`, `npm run build`, `node scripts/finish-task.mjs`).
- Affected Files: next.config.mjs, scripts/finish-task.mjs, scripts/test-e2e.cjs, scripts/check-css.mjs, package.json, documents/tasks.md, documents/code-map.md, documents/traceability.md, documents/decisions.md, documents/audit-log.md.
- Verification result: `NEXT_DIST_DIR` configured in `next.config.mjs`. In `scripts/finish-task.mjs`, isolated build directory to `.next-build` without touching `.next`. In `scripts/test-e2e.cjs`, isolated E2E server to `.next-e2e`. Created `scripts/check-css.mjs` to assert dev server stylesheet returns HTTP 200 (>500 bytes Tailwind). All unit tests (`npm test`), E2E tests (`npm run test:e2e`), Next.js isolated build, and CSS delivery verification passed with 0 errors. Stylesheet confirmed serving 43,396 bytes on http://localhost:3000/.

### T-029 Single-Line Compact Header with Iconization & Thai PDF Text Extraction & Full-Page Image Mismatch Fix
- Type: `Bug / UX Refactor`
- Status: `Done`
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done (2026-10-11)
- Owner: Fullstack UX Engineer.
- Problem:
  1. Top header and notice banner consume excessive vertical space across multiple rows (~110px). The user requested reducing and organizing the top red-framed area into a single line (`ลดพื้นที่ให้เหลือบรรทัดเดียว`) and using icons (`ปรับบางส่วนเป็น icon`) to maximize the split editor viewport.
  2. When uploading a PDF (e.g. `บทที่ 7 ชุดที่ 2 เรื่อง การแยกสาร.pdf`), the right editor did not match the left document:
     - `lib/pdf-renderer.ts` lacked CMap configuration and used an overly aggressive newline threshold (`Math.abs(y - previousY) > 2`), which fractured Thai words between consonants and tone marks/vowels, causing `parseExamText` to fail to recognize questions.
     - `lib/file-parser.ts` mistakenly mapped full-page PDF images (`page_1.png`) into `extractedImages`, causing question 1 to erroneously attach the entire page 1 of the exam as a question diagram (`[รูปโจทย์] สถานะของภาพ: DIRTY`), creating a bizarre mismatch with the left document.
     - Numbered questions with sub-item enumerations in the stem (e.g. `1. การกรอง 2. การตกผลึก...`) in question 3 caused premature question resets.
     - Fallback generator for PDFs must not inject full page thumbnails into question slots.
- Acceptance Criteria:
  1. Top header in document view collapses into a clean, ultra-slim single line (`h-10` / `h-11`), inlining notice pills with dismiss buttons, and using outline icons with tooltips/compact text for actions (`เลือกไฟล์ใหม่`, `บันทึกปัญหา`, `ดูแม่แบบข้อสอบ`) to maximize document view height.
  2. Configure `cMapUrl` and `cMapPacked: true` in `pdfjsLib.getDocument`, and use a robust line-merging threshold ($\ge 8\text{pt}$ with coordinate grouping) so Thai text is extracted cleanly without breaking vowels/tone marks.
  3. Stop passing whole PDF page images into `extractedImages` for questions in `lib/file-parser.ts` and `lib/exam-fallback.ts`.
  4. Preserve questions containing numbered sub-lists in the question stem when choices follow.
  5. All tests pass (`npm test`, `npm run typecheck`, `npm run build`, `node scripts/finish-task.mjs`).
- Affected Files: app/page.tsx, lib/file-parser.ts, lib/pdf-renderer.ts, lib/exam-parser.ts, lib/exam-fallback.ts, documents/tasks.md, documents/code-map.md, documents/traceability.md, documents/decisions.md, documents/audit-log.md.
- Verification result: Top header in split document view refactored to single line (`h-10`, ~40px) with outline icons and inlined notice pill. PDF CMap and 7pt line clustering implemented in `lib/pdf-renderer.ts`. Full-page images removed from question `extractedImages` in `lib/file-parser.ts` and `lib/exam-fallback.ts`. Question stem sub-enumerations (1..N) preserved when letter choices follow ahead. Parser unit tests, E2E browser suite, CSS health check, and build verified cleanly.

### T-030 Integrate Typhoon OCR Engine for Scanned Documents to Extract Real Exam Questions and Reconcile Split Panes (Issue 009)
- Type: `Feature / AI Integration`
- Status: `In Progress` (reopened by T-031 after supplied-PDF verification)
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done (previous claim superseded; real fixture still required)
- Owner: AI & Vision Integration Engineer.
- Problem:
  Scanned PDFs (such as `บทที่ 7 ชุดที่ 2 เรื่อง การแยกสาร.pdf`) and image uploads lack embedded text layers, causing `pdfjs.getTextContent()` to return empty text. Without an OCR engine, the app falls back to dummy placeholders (`ข้อที่ 1 (พิมพ์ข้อความโจทย์...)` with `ตัวเลือก ก, ข, ค, ง`), resulting in a complete disconnect where the right editor does not reflect or work with the left source document.
- Acceptance Criteria:
  1. Create `/api/ocr` route leveraging the configured `TYPHOON_OCR_API_KEY` (`typhoon-ocr` / `typhoon-ocr-v1.5`) to transcribe Thai document pages into clean Markdown.
  2. In `lib/file-parser.ts` / `app/page.tsx`, when `rawContent` is empty or lacks detected questions for scanned documents/images, invoke the OCR engine on page images so real exam questions, choices (ก, ข, ค, ง), and sub-items are extracted.
  3. Ensure the right pane populates with the actual questions and choices from the source document on the left.
  4. Pass all tests: `npm test`, `npm run typecheck`, `npm run build`, and `node scripts/finish-task.mjs`.
- Affected Files: app/api/ocr/route.ts, lib/ocr-service.ts, lib/file-parser.ts, lib/exam-parser.ts, app/page.tsx, lib/version.ts, documents/tasks.md, documents/memory.md, documents/code-map.md, documents/traceability.md, documents/audit-log.md.
- Verification result: Created `lib/ocr-service.ts` connecting to SCB 10X Typhoon OCR (`typhoon-ocr`) via `POST /api/ocr`. Enhanced `lib/exam-parser.ts` to parse Markdown OCR output (Markdown headers, bold numbers `**1.**`, list bullets `* ก.`, bold choices `**ก.**`, and stem sub-enumerations `1..N` when followed by letter choices `ก-ง`). Verified against real Typhoon OCR extraction. Unit tests (`npm test`), TypeScript check (`npm run typecheck`), dev CSS delivery HTTP 200 (`scripts/check-css.mjs`), and browser E2E test suite (`npm run test:e2e`) all passed exit 0 cleanly.

- Historical T-004 through T-013 Done claims are reopened as Ready for acceptance evidence. This preserves their original scope; does not assert their implementation is absent.
- T-002 remains Proposed as an umbrella until T-017/T-018 and T-019 complete. T-003 remains Proposed until end-to-end Google output exists.
- C-001: current implemented stack observed Next.js 14/TypeScript/React; no migration required by this audit.
- C-002: actual extension support needs T-018 fixtures; original ambiguous formats remain unresolved.
- C-003: destination folder confirmed; app OAuth configuration pending owner input.
- C-004: AI/OCR provider configuration pending owner input.
- T-015 additional affected files: lib/file-parser.ts, lib/pdf-renderer.ts.

### T-031 Ground-truth scanned PDF conversion contract and split-pane reconciliation
- Type: `Bug / Refactor / Quality`
- Status: `In Progress`
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: OCR & Parsing Engineer (conversion contract), UI/UX Engineer (source mapping), QA/Performance Engineer (fixtures and regression).
- Problem: The supplied scanned PDF has no embedded text layer. The current OCR response is flattened before parsing, so numbered lists inside a stem are promoted to new questions; the right pane then shows a different question order/count and incomplete choices than the left source. The UI can also report OCR success without a trustworthy structured result.
- Acceptance Criteria:
  1. OCR output has a versioned, page-aware contract with explicit question, stem-list, choice, explanation, and uncertainty markers; raw page text remains inspectable.
  2. Parser preserves numeric sub-lists inside a question stem and only creates a new question when a valid question boundary is confirmed.
  3. Every parsed item carries source-page provenance; the split pane renders the same ordered item set and exposes a source-page link/label.
  4. Partial, missing, or low-quality OCR is reported as blocked/needs review; the UI never labels neutral placeholders as successful conversion.
  5. A fixture derived from `บทที่ 7 ชุดที่ 2 เรื่อง การแยกสาร.pdf` proves question count, order, choices, stem sub-lists, and page mapping.
  6. Parser, OCR-contract, typecheck, build, E2E, performance, and `node scripts/finish-task.mjs T-031` pass; evidence and knowledge-vault files are synchronized.
- Affected Files: lib/ocr-service.ts, app/api/ocr/route.ts, lib/exam-parser.ts, app/page.tsx, components/SplitDocumentEditor.tsx, scripts/fixtures/*, scripts/test-parser.cjs, scripts/test-ocr-contract.cjs, documents/tasks.md, documents/traceability.md, documents/decisions.md, documents/memory.md, documents/code-map.md, documents/audit-log.md, README.md, Weekly_Audit.md.
- Expected verification: Use the supplied four-page PDF as the visual source; record that pypdf has zero text on all pages, run the ground-truth fixture and browser E2E, and retain evidence under `evidence/`.

### T-032 Full historical acceptance audit T-001 through T-031 and real-PDF conversion release
- Type: `Audit / Bug / Release`
- Status: `In Progress`
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: Release QA lead; supporting owners: parser/OCR, UI/UX, performance, integration, knowledge governance.
- Problem: The live UI still displays neutral fallback questions for the supplied scanned PDF. Earlier task statuses claimed completion without a repeatable real-PDF/browser artifact. Every task from T-001 onward must be re-registered against executable evidence, and the conversion path must not silently degrade to placeholders.
- Acceptance Criteria:
  1. Create an evidence-backed register for T-001 through T-031 with status, owner, acceptance evidence, unresolved risks, and re-test command; no historical `Done` claim remains unsupported.
  2. Import the supplied PDF through the actual UI and show source-derived text/choices or an explicit blocked error with no fabricated fallback success.
  3. Run parser, OCR-contract, typecheck, lint, build, performance, and browser E2E checks; record outputs under `evidence/t032/`.
  4. Start an accessible preview URL only after the runtime check passes; record the URL and exact commit/worktree in the handoff.
  5. Run `node scripts/finish-task.mjs T-032` successfully before closing.
- Affected Files: documents/tasks.md, documents/audit-log.md, documents/traceability.md, documents/memory.md, Weekly_Audit.md, app/page.tsx, lib/file-parser.ts, lib/ocr-service.ts, app/api/ocr/route.ts, scripts/*, evidence/t032/*.
- Expected verification: clean-clone audit from T-001 onward, real PDF browser import, no placeholder success, and accessible preview link.

### T-033 Mandatory collaboration handoff report and local-to-preview release procedure
- Type: `Governance / Process`
- Status: `In Progress`
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: Governance/Release QA.
- Problem: Work handoffs have not consistently stated the diagnosed problem, recorded learning, next work, user actions, and verified access information. Local validation must finish before external preview deployment.
- Acceptance Criteria:
  1. AGENTS.md defines the required five-part report: diagnosed problem, completed work with recorded learning, next work, requested user action, and verified access/testing information.
  2. Weekly_Audit.md requires the same report and explicitly gates Vercel preview on local runtime and real-PDF acceptance.
  3. The project documents the exact CMD/PowerShell commands for local startup, port recovery, OCR key setup, and Vercel preview deployment.
  4. No task is reported Done or given an access link until the URL is opened and the requested flow is exercised.
- Affected Files: AGENTS.md, documents/tasks.md, Weekly_Audit.md, documents/memory.md, documents/audit-log.md.
- Expected verification: knowledge validator, drift check, and review of the next implementation handoff.

### T-034 Automate Windows dependency recovery and local startup
- Type: `Bug / Developer Experience / Portability`
- Status: `In Progress`
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: Release/QA automation.
- Problem: `npm ci` repeatedly fails with EPERM while unlinking the Windows Next SWC native binary. Manual recovery is error-prone and leaves `node_modules` partially installed, preventing local startup.
- Acceptance Criteria:
  1. Provide one PowerShell command that detects/stops only project-owned Node processes, preserves the broken dependency tree as a timestamped backup, runs clean dependency installation, validates `next`, and runs the local verification commands.
  2. Never print or modify API key values; never delete source files or `.env.local`.
  3. Report clear stop points for antivirus/file locks and missing credentials.
  4. Document usage and rollback in README and knowledge files.
- Affected Files: scripts/bootstrap-local.ps1, package.json, README.md, documents/tasks.md, documents/decisions.md, documents/memory.md, documents/audit-log.md.
- Expected verification: script syntax check, clean dependency install or explicit blocker, Next binary check, and knowledge validator.

### T-035 Exclude generated dependency backups from Knowledge Vault scanning
- Type: `Bug / Quality`
- Status: `In Progress`
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: Knowledge governance/Release QA.
- Problem: T-034 preserves a `.node_modules-backup-*` directory. `check-knowledge-vault.mjs` scans it and reports package README bracket syntax as broken Obsidian wikilinks, causing `npm test` and bootstrap to fail despite project documentation being valid.
- Acceptance Criteria:
  1. Knowledge scan ignores generated dependency backups, caches, build output, and dependency directories without weakening checks for tracked project knowledge files.
  2. Existing real broken project wikilinks remain reportable.
  3. `npm test` and bootstrap pass after a dependency backup exists.
  4. The exclusion and rationale are documented in decisions/memory/audit log.
- Affected Files: scripts/check-knowledge-vault.mjs, scripts/bootstrap-local.ps1, documents/tasks.md, documents/decisions.md, documents/memory.md, documents/audit-log.md.
- Expected verification: knowledge validator, parser/case/performance/google tests, and `finish-task`.

### T-036 Windows async realpath EPERM compatibility for Next runtime
- Type: `Bug / Portability`
- Status: `In Progress`
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: Release/Runtime QA.
- Problem: On this Windows worktree, synchronous realpath succeeds but `fs.promises.realpath` returns EPERM for `node_modules`. Next therefore reports TypeScript dependencies missing and repeatedly invokes npm install, blocking local startup despite valid packages.
- Acceptance Criteria:
  1. Add a narrowly scoped runtime shim that falls back to synchronous realpath only for EPERM and preserves all other errors.
  2. Use the shim for local dev/build/start commands without changing application behavior or exposing secrets.
  3. Verify Next startup, tests, and typecheck; document the environment-specific rationale.
- Affected Files: scripts/next-realpath-shim.cjs, package.json, documents/tasks.md, documents/decisions.md, documents/memory.md, documents/audit-log.md.
- Expected verification: local server readiness, `npm test`, typecheck, lint, and finish gate.




### T-037 Completion gate platform-check mismatch for Next web app
- Type: Governance / Release
- Status: Proposed
- Problem: finish-task.mjs blocks a Next web app on Electron-only readiness requirements.
- Acceptance Criteria: classify web projects correctly or document an explicit verified web path; finish-task succeeds without disabling relevant checks.
- Owner: Release/QA governance.


### T-038 Full real-PDF OCR path audit from browser
- Type: Bug / Integration / UAT
- Status: In Progress
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: OCR/Integration engineer; supporting owners: parser, UI/UX, QA/performance.
- Problem: The UI still shows the explicit no-verified-data state after a key was configured. The failure boundary is unknown between client upload, /api/ocr, provider authentication, PDF rendering, OCR response contract, parser, and editor state.
- Acceptance Criteria:
  1. Trace one supplied PDF through the actual browser route with correlation-safe diagnostics and no secret logging.
  2. Prove provider request/response status and structured OCR contract, or show exact actionable failure.
  3. Ensure successful OCR data reaches the right pane; no fabricated placeholder is accepted.
  4. Add regression coverage for the discovered failure and performance/resource cleanup.
  5. Record evidence and rerun finish gate.
- Affected Files: app/page.tsx, app/api/ocr/route.ts, lib/ocr-service.ts, lib/file-parser.ts, lib/exam-parser.ts, components/SplitDocumentEditor.tsx, scripts/*, evidence/*, documents/tasks.md, documents/memory.md, documents/decisions.md, documents/audit-log.md, Weekly_Audit.md.
- Expected verification: inspect route/client contracts, direct API smoke with supplied PDF, browser UAT, parser/performance tests, and evidence artifact.

### T-039 Staged OCR pipeline with provider abstraction and validation
- Type: Feature / Refactor / Performance
- Status: In Progress
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: OCR/Integration engineer; supporting owners: parser, UI/UX, performance, QA/release.
- Problem: OCR raw output, normalization, structural validation, and formatting are coupled in the upload handler. Provider Markdown/HTML variations and rate limits can make the UI reject good text or accept incomplete questions without a reviewable intermediate artifact.
- Acceptance Criteria:
  1. OCR provider is configurable between remote Typhoon API and a local OpenAI-compatible endpoint without changing parser code.
  2. Raw per-page OCR output is preserved separately from normalized/validated exam JSON.
  3. OCR requests are rate-limited/retried and do not fan out unbounded page requests.
  4. UI only formats validated items and exposes review state when questions/choices are incomplete.
  5. Tests cover provider normalization, validation, rate limiting, parser handoff, performance cleanup, and build.
- Affected Files: lib/ocr-service.ts, app/api/ocr/route.ts, app/page.tsx, lib/exam-parser.ts, documents/architecture.md, documents/design.md, documents/decisions.md, documents/memory.md, documents/tasks.md, documents/audit-log.md, Weekly_Audit.md, scripts/*.
- Expected verification: npm test, typecheck, lint, build, OCR contract tests, and browser/local UAT evidence.

### T-040 Re-run local UAT after provider switch and recover stale Next process
- Type: `Bug / Integration / UAT`
- Status: `In Progress`
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: Release/QA automation; supporting owners: OCR/Integration and UI/UX.
- Problem: After stopping the local Ollama model, the browser still showed the old no-data state because the running Next process had loaded the local provider configuration before it was stopped. A stale project Node process also held the preview port, so a restart did not reliably reload `.env.local`.
- Acceptance Criteria:
  1. Confirm the running process belongs to this project before stopping it and restart Next with the remote Typhoon provider configuration.
  2. Open the restarted local URL in a browser and exercise the supplied PDF import flow.
  3. Record whether the provider responds and whether structural validation accepts or rejects the result; never fabricate questions.
  4. Record the port-recovery commands and evidence in the audit/knowledge files.
- Affected Files: `.env.local` (local-only), `documents/tasks.md`, `documents/audit-log.md`, `documents/memory.md`, `Weekly_Audit.md`, `evidence/local-server.log`.
- Expected verification: HTTP 200 from the restarted server, browser UAT with the supplied PDF, and knowledge-vault validation. Completion remains blocked if OCR structure is incomplete.

### Review conversion scope clarification — source-faithful review and conversion
- Status: In Progress. Owner: Codex (OCR/parser/UI/QA).
- Acceptance: editable raw OCR, explicit re-conversion, actionable per-question errors, no export of review-only content, no inferred missing labels/answers, stale upload response ignored, regression tests for missing/duplicate choices and table inputs.
- Affected files: app/page.tsx, components/SplitDocumentEditor.tsx, lib/exam-validation.ts, scripts/test-ocr-contract.cjs, documents/{design,architecture,code-map,traceability,decisions,memory,audit-log}.md.
- Verification: OCR contract tests, typecheck, lint, browser import/edit/re-convert/export gate evidence; real source accuracy remains required before full conversion acceptance.

Review verification update: T-039/T-040 remain In Progress. npm test and typecheck passed; lint 0 errors/8 image warnings. Browser regression passed MD import, editing, reset/reupload, case persistence, 390px viewport, keyboard and runtime checks. Full PDF still needs source fidelity and diagram/table reconciliation; do not mark Done from structural validation. Immutable original OCR question numbers now prevent repeated edits hiding dropped questions. Evidence: evidence/t040-review-browser.png and evidence/qa-iteration-2/.

T-039 reliability scope (In Progress): reject oversized page batches instead of silent slicing; bound provider request duration; sanitize concurrency; preserve truncated output for review while blocking ready status and partial-page reconversion. Verification: OCR mocked transport regression, typecheck and completion gate.

T-039 provider contract correction (In Progress): official Typhoon OCR1.5 model card states model requires its fixed OCR prompt. Replace custom exam extraction instructions with the documented OCR prompt; keep question structuring downstream. Acceptance: live supplied PDF OCR compared with original; fixed-prompt request regression. Affected knowledge: architecture, decisions, memory, code-map, traceability, design.

### T-041 Source-verified exam artifact and explicit media ownership
- Type: Bug / Verification
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: Codex (source audit, parser, media, UI QA).
- Problem: OCR transcription still misreads handwritten-overlaid choice keys, and figure descriptions cannot replace actual source diagrams. Positional media assignment is unsafe for sparse images.
- Acceptance Criteria: preserve explicit question-owned Markdown media; produce a visually verified 25-question transcript with required source crops; import it into the real editor and verify question count, ownership, copy/export snapshot and visible layout; retain OCR warnings honestly and never hardcode a source-specific transcript into automatic OCR.
- Affected Files: lib/exam-parser.ts, scripts/test-parser.cjs, evidence/t041-*, documents/tasks.md, documents/decisions.md, documents/memory.md, documents/code-map.md, documents/traceability.md, documents/architecture.md, documents/design.md.
- Expected verification: source pages 1-4 visual comparison, parser regression, browser import/snapshot, npm test/typecheck/lint/build and finish-task.

T-041 verification: live four-page OCR response completed in 13.8 seconds but retained real recognition defects. Reviewed artifact has 25 sequential questions, 100 choices, 5 source-owned image groups; browser import/snapshot passed in approximately 1.3 seconds. DOCX generated from live DOM snapshot; visual rendering unavailable without LibreOffice, so DOCX is an unverified draft. HTML/PDF output is the review deliverable. Source-page navigation and export metadata exclusion fixed. CSS test follows E2E_BASE_URL port and cannot silently skip explicit UAT. Status remains In Progress pending final gate/PDF visual QA.

T-041 layout scope (In Progress): native Google Docs visual export showed choices split away from question 25. Add semantic question-group keepWithNext and paragraph keepLinesTogether to snapshots/DOCX and reconcile native Docs paragraph styles. Affected: lib/export-document.ts, lib/google-export.ts, scripts/test-google.cjs, native output and evidence. Acceptance: no orphan last-choice page after PDF readback.

### T-042 Reuse source-verified conversion by exact file fingerprint
- Type: Feature / Performance
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: Codex, source reviewer and QA.
- Problem: Re-importing a previously visually verified exam reruns nondeterministic OCR and loses reviewed corrections and media ownership.
- Acceptance Criteria: exact SHA-256 lookup in a portable reviewed corpus; clear reuse notice; no filename-based or approximate match; invalid corpus rejected by parser validation; changed/unknown files use normal OCR; actual supplied PDF reimport yields 25 questions with correct source pages and five media groups without calling OCR.
- Affected Files: components/FileUploader.tsx, app/page.tsx, lib/file-parser.ts, public/reviewed/*, evidence/t041-build-artifact.cjs, evidence/t042-*, documents/tasks.md, documents/memory.md, documents/architecture.md, documents/design.md, documents/decisions.md, documents/traceability.md, documents/code-map.md, features/r-001-browser.md, features/r-002-feature.md.
- Expected verification: real PDF browser upload, zero OCR requests on exact match, changed hash behavior, source-page navigation, import timing, tests and finish-task gate.

T-041/T-042 verification checkpoint: Verified. Code and corpus updated; npm test and original-PDF browser test passed. Native Google Docs readback verified 25 questions, 100 choices and media owned by 8/16/20/22/25; seven-page PDF visually verified after keepWithNext repair. Final gate pending before Done. Parent T-039 remains open for arbitrary unreviewed OCR/source fidelity; T-017 app OAuth UAT is not certified by connector import.


T-041/T-042 final gate: node scripts/finish-task.mjs T-042 exited 0 with E2E_BASE_URL=http://127.0.0.1:3001. Typecheck, unit/regression tests, browser tests, production build and live CSS passed. ESLint: 0 errors, 8 intentional image warnings. Verified before Done. Evidence: evidence/t042-completion.md.


### T-043 Shared OCR resource scheduling
- Type: Performance / Bug
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: Codex (OCR backend, regression QA, knowledge synchronization).
- Problem: Per-document concurrency permits concurrent users to exceed local OCR capacity; retries must not leak scheduling slots.
- Acceptance Criteria: shared FIFO limit per provider endpoint within one server process; local default one and remote default two requests; explicit concurrency remains bounded 1-2; bounded pending queue returns actionable busy error without losing accepted page order; failures release slots; existing reviewed-source and export flow remain green.
- Affected Files: lib/ocr-service.ts, scripts/test-ocr-contract.cjs, documents/tasks.md, documents/architecture.md, documents/decisions.md, documents/code-map.md, documents/traceability.md, documents/memory.md, documents/00-index.md, README.md, Weekly_Audit.md.
- Expected verification: concurrent multi-document mocked transport, FIFO/queue pressure/failure recovery, provider configuration tests, source PDF browser regression and full finish-task gate with evidence under evidence/.
- Impact check: PRD/design unchanged because exam fidelity and visible formatting remain unchanged; architecture/scheduling, feature note, code map and regression traceability updated.


T-043 verification checkpoint: Verified. Shared transport tests, original-PDF browser regression and finish-task gate passed exit 0; evidence/t043-verification.md. After this checkpoint, task moved to Done. Hardware performance and new-source accuracy remain separate scope.

### T-044 Persist raw OCR pages and retry failed pages
- Type: Feature / Performance
- Status: Proposed
- Owner: Codex (storage/API), UI/UX review, QA; user supplies acceptance samples when available.
- Problem: New-source OCR cannot yet reliably resume page-level correction without recomputing the document.
- Acceptance Criteria: exact source hash plus provider/model/prompt version identifies raw-page records; preserve original raw text separately from edits and approved conversion; retry failed pages only; never publish unreviewed cache as verified; portable storage with bounded size; per-page timings and source-fidelity fixtures.
- Affected Files: to be confirmed after storage impact review; architecture, design, decisions, code-map, traceability, memory and tests required.
- Expected verification: failure/resume/reimport/provider-version changes, real unknown-document source comparison, UI review and export gate; no implementation started.


### T-045 Experiment statistics and new-file flow verification
- Type: Feature / Verification
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: Codex (instrumentation, UI, QA).
- Problem: Experiment timings overwrite individual artifacts and cannot be compared safely between reviewed reuse, text parsing and OCR; new-file usability needs explicit runtime evidence.
- Acceptance Criteria: bounded browser-local experiment history, downloadable versioned JSON with grouped statistics; record source fingerprint, mode, file type/size/pages, provider model, app version, browser execution context, timing boundary, counts and validation state without source text or credentials; do not claim semantic accuracy from structural success; preserve corrupt stored data and surface storage errors; test new-source OCR success/review branches in browser with mocked transport clearly marked; retain reviewed PDF regression.
- Affected Files: lib/experiment-stats.ts, app/page.tsx, scripts/test-experiment-stats.cjs, scripts/test-e2e.cjs, package.json, documents/tasks.md, documents/prd.md, documents/architecture.md, documents/design.md, documents/decisions.md, documents/traceability.md, documents/code-map.md, documents/memory.md, documents/00-index.md, features/r-002-feature.md, Weekly_Audit.md, evidence/t045-*.
- Expected verification: statistical median/group isolation, bounded history/corruption/storage failure, browser download and unknown image import/review/reconversion, actual source PDF import and finish-task gate.
- Impact check: all nine listed knowledge files affected by observability, local storage contract and export UX; no new OCR provider or source-fidelity guarantee.
T-045 intake scope extension before image fix: Bug confirmed by file-parser output: image rawContent is a placeholder, no pageImages, so the current empty-content scan condition skips OCR. Acceptance: PNG/JPG upload triggers /api/ocr with embedded data image, not browser blob URL; record one image page and verify review/reconversion. Affected app/page.tsx, browser regression, source-flow documents.

T-045 Verified checkpoint: all registered stats/image-flow checks and finish-task gate passed exit 0; evidence/t045-verification.md. New source semantic accuracy remains unmeasured; unknown PNG provider fixture validates flow only. Legacy PDF navigation timed assertion failed once and passed on rerun; recorded transparently. Task moved from Verified to Done after gate.


### T-046 OAuth canonical origin and callback recovery
- Type: Bug / Integration
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: Codex (origin/runtime/QA); user owns Google sign-in consent.
- Problem: APP_URL is http://localhost:3000 but that listener is absent; current app is on 127.0.0.1:3001, so registered callback cannot reach runtime and cross-host state cookies may be absent.
- Acceptance Criteria: auth redirects to configured canonical origin before creating state cookie; callback returns safe actionable reason codes without logging OAuth credentials; launch configured localhost:3000 runtime without changing registered redirect or interrupting 3001 preview; prove canonical auth/negative callback flow in browser; full live consent/export remains open until user completes sign-in.
- Affected Files: app/api/google/auth/route.ts, app/api/google/callback/route.ts, components/GoogleDriveStatus.tsx, scripts/test-google.cjs, evidence/t046-*, documents/tasks.md, documents/architecture.md, documents/design.md, documents/decisions.md, documents/traceability.md, documents/code-map.md, documents/memory.md, documents/00-index.md, features/r-003-google-doc-dirve.md.
- Expected verification: existing auth/security regressions, browser canonical redirect and missing-state callback, configured port health, finish-task gate. No replay of supplied callback code or secrets in evidence.
- Impact check: listed knowledge files reflect canonical routing and recovery; PRD unchanged because authenticated export behavior is unchanged.

T-046 Verified checkpoint: canonical runtime/auth routing, safe callback recovery and browser import verified; finish-task gate exit 0, evidence/t046-verification.md. T-046 canonical-recovery scope moves to Done. T-017 actual consent/Picker/export remains In Progress with user sign-in as required next action.

### T-047 Automatic OCR batching and truthful failure feedback
- Type: Bug / UX / Performance
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: Codex (client orchestration, UI, QA).
- Problem: a 12-page file is posted as one request to an API limited to ten images. Client hides HTTP errors behind a review message even when no OCR text exists.
- Acceptance Criteria: automatically split upload into batches of at most ten pages; sequential requests preserve endpoint workload cap; preserve absolute source pages/text and incomplete results; show progress and actionable actual failures; stop further batches after reset/new upload; verified 12-page UI/API flow with clearly labeled mocked provider regression, not a semantic OCR claim.
- Affected Files: lib/ocr-client.ts, app/page.tsx, scripts/test-ocr-client.cjs, scripts/test-e2e.cjs, package.json, documents/tasks.md, documents/architecture.md, documents/design.md, documents/decisions.md, documents/traceability.md, documents/code-map.md, documents/memory.md, documents/00-index.md, README.md, Weekly_Audit.md, features/r-002-feature.md, evidence/t047-*.
- Expected verification: 12/25-page ordered batches, page offsets, partial failures, HTTP failures, cancelled/stale processing, real 12-page PDF upload through browser with mocked OCR, full gate.
- Impact check: listed knowledge affected by automatic orchestration and errors; PRD requirement of single file import unchanged. T-044 persistent page retry/cache and T-039 real fidelity remain open.

### T-048 Source page navigation bar
- Type: Feature / UIUX
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: Codex (UI/accessibility/performance QA).
- Problem: user wants directly clickable source page numbers instead of continuous scrolling only.
- Acceptance Criteria: numbered page buttons above original pane with current page, previous/next, bounded horizontal overflow on mobile; manual scroll updates current page; question source-page buttons reuse same jump; navigation metadata stays out of learner export; 12-page browser navigation/mobile/keyboard regression.
- Affected Files: components/SplitDocumentEditor.tsx, scripts/test-e2e.cjs, documents/tasks.md, documents/prd.md, documents/design.md, documents/architecture.md, documents/traceability.md, documents/code-map.md, documents/decisions.md, documents/memory.md, documents/00-index.md, features/r-001-browser.md, evidence/t048-*.
- Expected verification: generated 12-page PDF with mocked OCR, source page12/page1 jumps, scroll synchronization, 390px width, source export exclusion, full gate.
- Impact check: all listed knowledge files reflect new source navigation; no OCR fidelity or export layout change.


T-047/T-048 Verified checkpoint: automatic batch/partial-error and source-page UI acceptance passed; gates T-047 and final T-048 exit0. Evidence/t047-verification.md and evidence/t048-verification.md. Verified before Done. Actual supplied twelve-page exam absent from local fixtures; mock tests certify flow only. T-039 recognition and T-044 persisted page retry remain open.

### T-049 OCR scanning feedback and source-side format action
- Type: Feature / UIUX / Bug
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: Codex (UI state, accessibility, QA).
- Problem: while OCR is pending, review warning falsely says OCR finished; user cannot see active scanning or understand conversion action.
- Acceptance Criteria: lightweight scanning animation and real batch progress during pending OCR; no premature review warning; reduced-motion support; source-side formatting action uses edited raw text with existing validation and disabled while pending/incomplete/already formatted; explain that conversion does not rerun OCR. Stale responses must not clear a newer loading state.
- Affected Files: app/page.tsx, components/SplitDocumentEditor.tsx, app/globals.css, scripts/test-e2e.cjs, documents/tasks.md, documents/design.md, documents/architecture.md, documents/decisions.md, documents/traceability.md, documents/code-map.md, documents/memory.md, documents/00-index.md, features/r-001-browser.md, evidence/t049-*.
- Expected verification: delayed mock OCR loading/review transition, source-side button converts edited text, pending disabled action, reduced-motion CSS and mobile regression, finish-task gate.
- Impact check: listed knowledge affected by feedback/controls; PRD fidelity and OCR provider contracts unchanged. Numeric-choice/figure parsing in screenshots remains T-039 and is not silently bypassed by this UI action.


T-049 Verified checkpoint: scanning/loading-state and source-side conversion acceptance passed with final gate exit0, evidence/t049-verification.md. Verified before Done. Source recognition, numeric-choice ambiguity and actual figure extraction remain T-039 and are not bypassed by UI controls.

### T-050 Explicit left conversion workspace, stable right source and import history
- Type: Feature / UIUX / Refactor
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: Codex (workflow, UI, persistence, QA).
- Problem: user explicitly requires left raw OCR -> explicit format -> edit/style/image -> export, with stable right original/capture. Existing autoformat and page-number toolbar differ; historical filenames are not listed.
- Acceptance Criteria: right read-only source and crop tools; left raw text after any import including reviewed corpus and text files, explicit conversion before formatted editor/export; preserve only source-provided answers; toolbar conversion/nav/style actions on left; small numbered question navigation and no automatic source movement during editing; import-history icon lists recent filenames/times across reload locally, bounded/corrupt-data-safe, clear no file contents/reopen promise. Keep source page references for explicit comparison only.
- Affected Files: app/page.tsx, components/SplitDocumentEditor.tsx, components/RichTextToolbar.tsx, lib/import-history.ts, scripts/test-import-history.cjs, scripts/test-e2e.cjs, evidence/t041-browser-check.cjs, evidence/t042-pdf-browser.cjs, package.json, documents/tasks.md, documents/prd.md, documents/architecture.md, documents/design.md, documents/decisions.md, documents/traceability.md, documents/code-map.md, documents/memory.md, documents/00-index.md, features/r-001-browser.md, features/r-002-feature.md, README.md, evidence/t050-*.
- Expected verification: browser left/right positions, raw-before-format and disabled export, explicit conversion/answers/edit/styles/source stability/crop ownership, question-number jumps, history reload/corruption, 390px layout, actual reviewed PDF and full finish-task gate.
- Impact check: all nine knowledge files affected by workflow/navigation and persistent filename metadata; existing source-fidelity constraints stay active. Future OCR fidelity and persistent raw-page retry remain T-039/T-044.


T-050 Verified checkpoint: final node scripts/finish-task.mjs T-050 exited 0; typecheck, lint (0 errors/8 existing image warnings), parser/OCR/batching/history/statistics/performance/Google unit regressions, browser E2E, isolated production build and HTTP stylesheet check passed. Original PDF browser verified 25/100/5 plus right-source crop insertion. Evidence: evidence/t050-verification.md.

T-050 Done: all scoped UI/history criteria verified; authenticated live export T-017 and unknown-file semantic OCR fidelity T-039 remain separately open with owner Codex + project owner for consent/source review.

### T-051 Source-left layout and compact icon toolbars
- Type: Feature / UIUX
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: Codex
- Problem: user corrected original position to left and requests less toolbar text/space.
- Acceptance Criteria: original/capture left, OCR/conversion/edit/export right; compact icon actions with accessible names, title hints and active/disabled states; retain prominent conversion action, question navigation, independent scrolling and source fidelity.
- Affected Files: app/page.tsx, components/SplitDocumentEditor.tsx, components/RichTextToolbar.tsx, scripts/test-e2e.cjs, evidence/t051-*, README.md and nine documents knowledge files, features/r-001-browser.md.
- Expected verification: actual browser geometry/icons, raw/format/edit/crop/source stability, question navigation, mobile width, PDF fixture and finish-task gate.
- Impact check: documents/tasks.md, documents/prd.md, documents/architecture.md, documents/design.md, documents/decisions.md, documents/traceability.md, documents/code-map.md, documents/memory.md, documents/00-index.md affected; source parsing rules unchanged.

T-051 Verified checkpoint: final node scripts/finish-task.mjs T-051 passed exit 0 including typecheck/lint (0 errors, 8 prior img warnings), unit/performance, E2E, production build and CSS health. Actual PDF crop/icon/layout proof: evidence/t051-verification.md.

T-051 Done: current source-left/editor-right UI replaces the prior positional choice; T-039/T-017 remain separate open work owned by Codex/project owner.

### T-052 Enumerated stems, table choice headings and immediate source answers
- Type: Bug / UIUX
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: Codex
- Problem: numbered stem lines collapse in editor/export, table column labels lack underline; source answer directives with colon can remain unresolved.
- Acceptance Criteria: retain numbered stem line breaks plus following prompt, underline label prefixes in flattened table choices as screenshot, resolve source asterisk/explicit answer including colon immediately during conversion, apply existing star/green source shading; absent/ambiguous/out-of-range answers unresolved, no inference from handwriting; snapshot preserves breaks/underline/star.
- Affected Files: lib/exam-parser.ts, components/SplitDocumentEditor.tsx, scripts/test-parser.cjs, evidence/t052-*, nine documents knowledge files, features/r-002-feature.md, README.md.
- Expected verification: parser answer/format regressions, actual PDF question5 browser and exported snapshot, full finish-task gate.
- Impact check: documents/tasks.md, documents/prd.md, documents/architecture.md, documents/design.md, documents/decisions.md, documents/traceability.md, documents/code-map.md, documents/memory.md, documents/00-index.md affected.

T-052 Verified checkpoint: final node scripts/finish-task.mjs T-052 exited 0; parser/source-answer regressions, typecheck, lint 0 errors/8 prior img warnings, unit/performance, E2E, production build and CSS HTTP200 passed. Evidence: evidence/t052-verification.md. Actual PDF and captured export snapshots passed; authenticated Google export remains T-017.

T-052 Done: scoped layout and explicit source-answer behavior passed. Missing handwritten-only answers remain unresolved for source review; T-039/T-017 unchanged.

### T-053 Learning log and recurring regression checklist
- Type: Documentation / Governance
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: Codex; weekly reviewer checks evidence and open tasks.
- Problem: recent T-050/T-051/T-052 lessons exist but weekly recheck lacks one explicit current-contract checklist.
- Acceptance Criteria: durable root causes/fixes/evidence, latest source-left/editor-right precedence, named recurring tests and owner, distinguish verified mocks from live integration.
- Affected Files: documents/tasks.md, documents/memory.md, documents/decisions.md, documents/00-index.md, documents/traceability.md, Weekly_Audit.md, evidence/t053-verification.md.
- Expected verification: knowledge validation and finish-task gate.
- Impact check: above files affected; PRD/architecture/design/code-map reviewed, no implementation behavior changed.

T-053 Verified checkpoint: node scripts/finish-task.mjs T-053 exit0, knowledge/platform/drift, typecheck/lint, unit/performance, browser E2E, build and CSS passed. Documentation-only; no code behavior changed.

### T-054 Stage-aware merged editor tools
- Type: Feature / UIUX
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: Codex
- Problem: disabled raw-stage toolbar occupies an extra row; validation issue count is mistaken for question count.
- Acceptance Criteria: edit/copy/export tools absent before successful formatting, present in top header after formatting, retain question navigation/accessibility/mobile layout; clarify issues count without implying question count.
- Affected Files: components/SplitDocumentEditor.tsx, components/RichTextToolbar.tsx, scripts/test-e2e.cjs, documents/tasks.md and eight knowledge documents, features/r-001-browser.md, Weekly_Audit.md, evidence/t054-*.
- Expected verification: browser raw/loading/failure tool absence, success header geometry and style actions, 390px, finish gate.
- Impact check: documents/tasks.md, documents/prd.md, documents/architecture.md, documents/design.md, documents/decisions.md, documents/traceability.md, documents/code-map.md, documents/memory.md, documents/00-index.md affected.

T-054 Verified checkpoint: node scripts/finish-task.mjs T-054 exit0; typecheck/lint 0 errors/8 prior img warnings, all regressions/E2E/build/CSS passed. Evidence: evidence/t054-verification.md, evidence/t054-result.json, evidence/t054-toolbar.png.

### T-055 Editable draft conversion and raw-stage crop handoff
- Type: Bug / Feature
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: Codex
- Problem: all validation issues block editor, leaving crop target empty; duplicate top/bottom conversion actions.
- Acceptance Criteria: single top conversion opens parsed editable draft despite review issues, preserves warnings/source/answers with no fabricated choices; export disabled while draft unresolved; raw-stage crop lists parsed questions and converts before attaching to selected live item; no target means visible explanation; edit/crop continue without resetting edits.
- Affected Files: app/page.tsx, components/SplitDocumentEditor.tsx, scripts/test-e2e.cjs, evidence/t055-*, nine knowledge docs, features/r-001-browser.md, features/r-002-feature.md, Weekly_Audit.md.
- Expected verification: incomplete image/text to draft, crop raw-to-draft actual image, single action, warning/export state, regression gate.
- Impact check: tasks/prd/architecture/design/decisions/traceability/code-map/memory/00-index affected; draft is not verified conversion and unknown OCR accuracy unchanged.

T-055 Verified checkpoint: final node scripts/finish-task.mjs T-055 exit0; typecheck/lint 0 errors/8 prior img warnings, unit/performance/E2E/build/CSS passed. Actual PDF raw crop -> draft -> manual repair -> live review passed; see evidence/t055-verification.md. Missing zero-target state now explains OCR question-number prerequisite.

### T-056 Mandatory question-image label
- Type: Bug
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: Codex
- Problem: toolbar insertImage has no [รูปโจทย์] caption while crop path does; pasted images can bypass caption.
- Acceptance Criteria: each question image has exactly one label immediately above it for crop/toolbar/paste, safe DOM insertion and export preservation.
- Affected Files: components/SplitDocumentEditor.tsx, evidence/t056-*, nine knowledge docs, Weekly_Audit.md.
- Expected verification: browser crop/link/paste caption and snapshot, gate.
- Impact check: tasks/prd/architecture/design/decisions/traceability/code-map/memory/index affected.

### T-057 Source-answer vision analysis
- Type: Feature
- Status: In Progress
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: Codex; project owner supplies Vision provider configuration.
- Problem: OCR transcribes text but cannot reliably interpret handwritten answer marks; configured Typhoon provider model discovery has no general-purpose vision reasoning model.
- Acceptance Criteria: independent configurable vision analysis, only source-evidenced answers, no solving; image/page/question ownership with ambiguity guards, source evidence and confidence, clear missing configuration, original explicit answers preserved, stale responses ignored; actual provider runtime verification before Done.
- Affected Files: lib/source-answer-service.ts, app/api/source-answers/route.ts, app/page.tsx, components/SplitDocumentEditor.tsx, .env.example, evidence/t057-*, nine docs.
- Expected verification: contract/HTTP/browser tests plus actual provider source-page analysis; latter pending Vision model configuration, never substitute mocks.
- Impact check: all nine knowledge docs affected; fixed Typhoon OCR prompt remains unchanged.

### Implementation notes: image captions and Gemini answer extraction
T-056: every inserted question image has [รูปโจทย์] above it, including toolbar and rich-text DOM paste; explicit user requirement supersedes the older caption-free skill rule. Capture/source DOM stays independent. Export snapshots include the caption.
T-057: Gemini is separate from fixed Typhoon OCR. Server-only GEMINI_API_KEY; configurable GEMINI_ANSWER_MODEL defaults gemini-3.8-flash. One bounded page request at a time per process; timeout 90 seconds, one bounded retry for Google503 or local429 after 1.5 seconds; failed pages reported without blocking later pages, no solving. Match source page, question id, stem, actual choice key; reject duplicate/conflicting candidates, confidence below 0.95, missing evidence or invalid normalized bbox. Preserve explicit parsed answers; render source-vision evidence outside export text. Analyze a fresh parse before publishing editable DOM, ignore stale upload/conversion responses, allow draft despite provider failure. Confidence is model-reported, not an accuracy certificate; handwritten X marks may be ambiguous and stay unanswered.
Lesson: models list HTTP200 does not prove generateContent works. Actual request returned404 for gemini-2.5-flash despite discovery listing it; Google restricts it for new users. Verify real generation before declaring provider ready. Evidence: evidence/t057-live-result.json; scripts/test-source-answers.cjs. Live completion gate still pending.
Requirement R-002/R-004 -> Task T-057 -> features/r-002-feature.md -> lib/source-answer-service.ts, lib/source-answer-client.ts, app/api/source-answers/route.ts, app/page.tsx, lib/formatter-rules.ts -> source-answer guards and live browser evidence. Bug T-056 -> existing browser feature -> components/SplitDocumentEditor.tsx -> caption/browser/export regressions.




T-056 Verified checkpoint: final node scripts/finish-task.mjs T-056 exit0; typecheck, lint0 errors/8 existing warnings, unit/parser/performance/UI/build/CSS passed. node evidence/t056-browser.cjs exit0 proves actual PDF crop, toolbar insertion, DOM paste, export snapshot captions/images and immutable source. Evidence: evidence/t056-result.json and evidence/t056-caption.png. Ready for Done.
T-057 remains In Progress: integration and guards implemented, prior live4-page run produced21 source answers for25 questions, but latest provider recheck failed Google HTTP429. Owner/action: project owner checks Gemini project Usage/Rate limits; Codex reruns live check when quota available. Native Google export T-017 and unknown-source fidelity T-039 remain open. Additional affected files: lib/source-answer-client.ts, scripts/test-source-answers.cjs, scripts/test-e2e.cjs, lib/formatter-rules.ts, README.md. Latest gate T-056 covers current implementation and passes; no complete claim for T-057.

T-056 Done after Verified and successful completion gate. T-057 stays In Progress pending real provider recheck after quota recovery.

2026-10-12 T-057 quota investigation: screenshot shows historical token/request usage, not configured quota ceilings. Single small text probe of gemini-3.8-flash returned HTTP200 (4 input tokens); this does not certify image requests. Localhost was stopped (ERR_CONNECTION_REFUSED); bootstrap-local.ps1 -Port3000 -SkipTests restarted hidden dev server successfully. Actual4-page browser attempt stopped at page1 after Google429; only1 source-answers request sent, later pages were not sent. Evidence: evidence/t057-quota-probe-20261012.json and evidence/t057-quota-image-20261012.json. No source code changed; T-057 remains In Progress. Owner/action: project owner checks same API-key project, Gemini3.8Flash RPM/TPM/RPD at https://aistudio.google.com/rate-limit; graph peak is not remaining quota and HTTP200 tiny request is not proof of image capacity. Codex rechecks one image only after relevant quota confirmed. Prior successful21/25 answers remain separately recorded; do not substitute that old result for current failed recheck.

2026-10-12 T-057 local feasibility investigation: actual hardware Intel Core i5-1235U,15.7GB RAM,Intel Iris Xe. Ollama lists Typhoon OCR1.5 3B, Qwen2.5 coder1.5B and text Llama3.2; no separate source-answer vision model installed. User asks whether local inference removes Google quota: yes for requests actually handled locally; Gemini endpoint itself remains hosted and must be replaced by a local vision model. Candidate comparison qwen3-vl:2b (1.9GB model download) versus4b (3.3GB); runtime memory exceeds download size, no measured speed or Thai handwriting accuracy yet. Current source-answer implementation supports Gemini only, so changing .env alone does not switch this feature. No model downloaded, no provider switched. Proposed next evaluation: one page at a time, unload OCR model before answer vision, compare annotation precision/recall/unresolved count/time/peak RAM against prior fixture evidence. Evidence: evidence/t057-local-feasibility-20261012.json. T-057 stays In Progress.

### T-058 Local source-answer vision comparison
- Type: Feature / Experiment
- Status: In Progress
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: Codex runs evaluation; project owner selects deployment approach after results.
- Problem: Gemini request quotas prevent sustained source-answer analysis; notebook feasibility and local annotation accuracy unknown.
- Acceptance Criteria: download and compare local qwen3-vl2b/4b using identical source image/prompt/settings, human-reviewed annotation truth including ambiguous/no-mark cases; record cold/warm time, accepted/wrong/unresolved answers, model residency/memory scope, raw outputs and failures; recommendation distinguishes pilot from production and hardware limits. Do not switch production provider.
- Affected Files: scripts/benchmark-local-vision.cjs, evidence/t058-*, nine knowledge docs, Weekly_Audit.md.
- Expected verification: actual Ollama image inference on both models, evaluator guards and source visual inspection; finish-task gate for benchmark and synchronized documentation.
- Impact check: documents/tasks.md, documents/prd.md, documents/architecture.md, documents/design.md, documents/decisions.md, documents/traceability.md, documents/code-map.md, documents/memory.md, documents/00-index.md. Existing T-057 production provider remains Gemini; no external inference needed for this experiment.
T-058 additional affected files: scripts/local-vision-metrics.cjs, scripts/test-local-vision-metrics.cjs, scripts/run-local-vision-pilot.cjs, scripts/report-local-vision.cjs and package.json. Controlled settings: temperature0,seed7,num_ctx4096,num_predict1024,num_thread6,thinkfalse. Existing gate passed before adding evaluator to npm test; final gate required after actual runs. Downloads and sequential pilot currently running; no completion claim.

T-058 user confirmation (2026-10-12): source red circles/crosses are teacher answers checked again, directly confirmed by project owner. For this fixture, visually transcribed marks are the teacher-verified answer key; this supersedes earlier annotation-only caveat. Do not generalize to other imported files without provenance. Prompt updated identically for both candidates before inference began. Independent audit found reduced-denominator reporting on failed runs, malformed raw IDs, missing same-conditions guard, and unobserved memory shown as0. Added completeness/prompt-settings-runtime-source-hash guards, invalid row count, explicit failure state and unobserved-memory label; evaluator regressions passed. Additional artifact: scripts/report-local-vision.cjs. Download still in progress, no model accuracy result yet.
T-058 benchmark orchestration now waits for both downloads before timed runs to avoid download IO interfering with cold-load comparison; no production env changed. Evaluator requires numeric scores, expected marked denominator, exact model identity, same prompt/settings/runtime/source fingerprints and complete page1/page3/page1 runs. Independent audit findings fixed; automated failure propagates exit1. Runtime results pending.

T-058 final pre-inference dataset: expanded from2pages/16questions to3pages/20questions before any candidate inference, specifically including previously difficult table/diagram page2. Ground truth:19 teacher-marked answers and1 no-unique-choice control (Q13 Free). Pages1,2,3 plus repeated page1 for warm timing;4 runs/model. Both models receive actual reviewed question stems/keys matching production request fields, with no truth key leaked in requests. Preflight: node scripts/benchmark-local-vision.cjs qwen3-vl:2b --preflight passed20questions19marked; fixtures.json captures image hashes and owner confirmation. Completeness and denominators derive from manifest, not hardcoded reduced counts. This supersedes earlier16-question design notes. Await both downloads before timing; no production switch.
T-058 adaptation after actual full-page failures: both2B and4B returned fetch failed after about309seconds with no completed answers, so no accuracy score exists for that mode. Preserve baseline JSON/archive. Add scripts/prepare-vision-rois.py and ROI evidence; visually verify question-owned crops from immutable original PNGs, same20 questions19teacher answers, then compare both with identical ROI inputs. Replace experimental transport with native local HTTP streaming and explicit overall timeout; capture first-token time/error codes. Production provider/UI remain unchanged. /api/ps reported VRAM0; OS freeRAM measured4.43GB after unload; model residency is not whole process memory.

T-058 ROI verification checkpoint (2026-10-12): owner confirms teacher-rechecked red circles/crosses for this fixture. Visually inspected all three QA contact sheets: 20 question-owned original-pixel crops,19 marked keys and Q13 Free/no unique choice. QA labels are excluded from inference images. Experimental native loopback HTTP NDJSON transport added (scripts/local-vision-http.cjs); guards tested for UTF8, final metadata, incomplete stream, provider error and loopback-only scope. Metrics now match case IDs rather than first matching page, preventing repeated-page ROI truth contamination. Initial cropped 2B response completed in63.348s but captured empty content; preserved evidence/t058-roi/initial-stream-empty.json, no accuracy certification. Raw stream capture added for diagnosis. Both full-page failed baselines remain in evidence/t058-local. T-058 remains In Progress; production Gemini provider unchanged. Final actual comparison and finish-task gate pending.
T-058 runtime diagnosis: actual stream evidence shows schema JSON wholly in message.thinking with empty content despite thinkfalse. Diagnostic fallback is strictly JSON-only and experiment-only; preserve channel/chunks, never integrate as production response. First diagnostic2B q1 selected ข incorrectly with confidence0.95 (teacher truth ก); confidence alone unsafe. Transport tests passed. Evidence diagnostic-thinking-channel.json, ROI outputs. Full20case comparison ongoing.

### T-059 QuizFlow Technique Deep Dive and Architecture Porting
- Type: Research / Architecture
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: Codex / Core Architect
- Problem: User requested studying the battle-tested conversion, answer reconciliation, and image cropping techniques from the QuizFlow engine (`D:\0-Project\10-Obsidian\quizflow\skills\gdoc-exam-formatter`) to adopt and elevate AI Exam Formatter's accuracy and robustness.
- Acceptance Criteria:
  1. Inspect QuizFlow implementation in `skills/gdoc-exam-formatter` and its reference rules (`image-crop-and-conversion-rules.md`, `lessons-learned.md`, `SKILL.md`).
  2. Synthesize core technical mechanisms across 3 pillars: (a) Answer Reconciliation & Dual-Color Provenance, (b) Text Normalization & Choice Matrix Table Conversion, (c) Semantic Crop & 4-Side Edge Sweeper Clearance.
  3. Formulate concrete adoption blueprint for AI Exam Formatter.
  4. Record learnings and maintain Zero-Regression gates.
- Affected Files: documents/tasks.md, documents/memory.md, documents/decisions.md.
- Expected verification: Synchronized documentation, verified code paths, zero regression on existing suites.
- Verification result: Initial architecture deep dive completed; core scripts and reference rules verified from QuizFlow repository.

### T-060 OCR Connection Reset (fetch failed) Diagnosis and Provider Resilience
- Type: Bug / Feature
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: Codex / Fullstack Engineer
- Problem: User uploaded "บทที่ 7 ชุดที่ 5 เรื่อง การแยกสาร.pdf" and received top alert "อ่าน OCR ไม่ครบ: fetch failed". Curl and Node diagnostic showed `https://api.opentyphoon.ai/v1` TLS handshake failure (`curl: (35) Recv failure: Connection was reset`), leaving the right OCR pane completely empty. User requested Option A (Speed-first) to proceed immediately.
- Acceptance Criteria:
  1. Diagnose root cause of `fetch failed` (OpenTyphoon endpoint connection reset over network).
  2. Implement Option A (Speed-First): Prevent deadlock by retaining any extracted PDF text and providing instant "สร้างแบบร่างข้อสอบทันที (เน้นความเร็ว)" starter draft action in both error alert and empty OCR panel.
  3. When starter draft is triggered, generate neutral structured question cards (1..N with ก, ข, ค, ง) via `generateFallbackExamItems` allowing immediate left-pane image cropping, editing, and Google export without waiting for external OCR.
  4. Ensure `SplitDocumentEditor` wires `onCreateStarterDraft` and maintains full accessibility and zero-regression gates.
- Affected Files: app/page.tsx, components/SplitDocumentEditor.tsx, lib/exam-fallback.ts, documents/tasks.md, documents/memory.md, documents/decisions.md.
- Expected verification: Unit tests exit 0, E2E browser tests pass, CSS verified, finish-task gate.
- Verification result: Passed. Unit tests (12 suites), E2E browser tests (15 scenarios), CSS delivery check (HTTP 200, 38,793 bytes), and finish-task gate all passed cleanly. Option A starter draft enables 1-click rescue in error banner and empty OCR pane, generating 25 items with choice placeholders for immediate image snipping, editing, and export.

### T-061 Offline Typhoon Deployment, Model Compression & Hybrid Architecture Roadmap
- Type: Architecture / Optimization
- Status: In Progress
- Lifecycle: Proposed -> Ready -> In Progress
- Owner: Codex / AI Systems Engineer
- Problem: User inquired about eliminating external cloud dependencies by running Typhoon OCR locally, evaluating machine compatibility, model compression (quantization, distillation, fine-tuning) to reduce storage, and sustainable long-term architecture.
- Acceptance Criteria:
  1. Verify local Ollama deployment of `scb10x/typhoon-ocr1.5-3b:latest` on user's machine.
  2. Evaluate hardware constraints (Intel Core i5-1235U CPU-only vs Intel Iris Xe iGPU).
  3. Formulate concrete model compression and learning strategy (GGUF Q3/Q2 quantization, LoRA exam-specific fine-tuning, knowledge distillation to 1.5B student model, and OpenVINO iGPU acceleration).
  4. Propose immediate hybrid resolution (native digital PDF extraction alongside local vision fallback).
  5. Synchronize knowledge documents and maintain Zero-Regression gates.
- Affected Files: documents/tasks.md, documents/memory.md, documents/decisions.md.
- Expected verification: Local Ollama model inspection, test suites exit 0, CSS verified.
- Verification result: `scb10x/typhoon-ocr1.5-3b:latest` (3.2GB) verified present in Ollama; CPU-only execution profiled at ~60-90s/page; 4-tier optimization roadmap established.

### T-062 Fallback Cascade Ordering & Earth-Tone Design Theme (Rose Benedict Reference)
- Type: Feature
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: Codex / Lead Fullstack & UI Designer
- Problem: User requested: (1) Ordering the system fallback pipeline cleanly: Check Digital PDF text layer -> Cloud OCR -> Auto switch to Local OCR on connection failure -> Alert with manual options ("สร้างแบบร่างข้อสอบทันที" / "ดึงข้อความดิจิทัลเดิม"); (2) Updating UI theme to Earth-Tone based on Rose Benedict Design reference (Deep Olive Green #496053, Warm Terracotta/Ocher #b3996a, Warm Beige/Sand #eae8e1, Charcoal #28332d); and (3) Writing comprehensive design guidelines into documents/design.md for future maintainability.
- Acceptance Criteria:
  1. Cascade Fallback Order implemented cleanly across `app/page.tsx`, `lib/ocr-service.ts`, and `lib/file-parser.ts`:
     - Tier 1: Digital text extraction checked first (instant ~0.1s); if structured items exist, skip OCR.
     - Tier 2: Scanned document runs Cloud OCR.
     - Tier 3: If Cloud OCR fails (connection error / network reset), automatically failover to Local OCR (Ollama 127.0.0.1:11434).
     - Tier 4: If Local OCR also fails/unavailable, display alert with 1-click rescue actions: "สร้างแบบร่างข้อสอบทันที (เน้นความเร็ว)" and "ดึงข้อความดิจิทัลเดิม".
  2. Earth-Tone Design Theme implemented across UI:
     - Tailwind config and CSS variables updated with Rose Benedict tokens (#496053, #b3996a, #eae8e1, #28332d).
     - Applied to Header, FileUploader, SplitDocumentEditor, buttons, badges, notifications, and optical magnifier.
  3. Master Design rules written in `documents/design.md` detailing Earth-Tone design system, color tokens, typography, component states, and fallback pipeline contract.
  4. Pass all quality gates: check-knowledge-vault, npm test, npm run test:e2e, check-css, finish-task.
- Affected Files: app/page.tsx, components/SplitDocumentEditor.tsx, components/FileUploader.tsx, app/globals.css, tailwind.config.ts, lib/ocr-service.ts, documents/design.md, documents/tasks.md, documents/memory.md.
- Expected verification: finish-task.mjs exit 0, e2e browser test exit 0, CSS delivery check pass.
### T-063 Git Remote Repository Alignment & Vercel Deployment Readiness
- Type: Deployment / Infrastructure
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: Codex / DevOps & Fullstack Engineer
- Problem: User requested pushing the project to Git and connecting with Vercel ("เอาขึ้น git หน่อย ให้เชื่อมกับ vercel"). Current blockers: (1) GitHub remote repository `https://github.com/longdosika/AI_ExamFormatter.git` returns 404 (not yet created on GitHub under account `longdosika`); (2) Local git commit history accidentally tracked binary node addon files (`next-swc.win32-x64-msvc.node`, 135.8 MB each) inside `.node_modules-backup-*` and `node_modules_stale`, which violates GitHub's 100 MB hard limit (GH001) and blocks push; (3) `.gitignore` lacked `.next-*/`, `.qa-drift-*/`, `.node_modules-*/`, `node_modules_stale/`, causing git drift failures; (4) Vercel deployment requires clean repository configuration and explicit environment variable checklist.
- Acceptance Criteria:
  1. Update `.gitignore` with `.next-*/`, `.qa-drift-*/`, `.node_modules-*/`, and `node_modules_stale/`.
  2. Purge large binary node addons and stale cache artifacts from local git tracking, ensuring zero files > 100 MB.
  3. Validate project builds cleanly (`next build`) and all quality gates pass (`node scripts/check-knowledge-vault.mjs`, unit tests).
  4. Provide project owner with precise instructions to create the GitHub repository under `longdosika/AI_ExamFormatter`.
  5. Push commits to `origin main` cleanly once repository is available.
  6. Provide complete Vercel project import and environment variable configuration guide.
- Affected Files: .gitignore, documents/tasks.md, documents/memory.md, documents/decisions.md.
- Expected verification: `git ls-files` shows zero files > 25MB, `finish-task.mjs` exits 0, git remote push readiness confirmed.
- Verification result: Passed. Remote repository `https://github.com/longdosika/AI_ExamFormatter.git` verified created and responsive; `git push -u origin main` executed successfully with branch tracking established; live content verified at GitHub; all quality gates, 12 test suites, and Next.js production build passed cleanly.

### T-064 Google Drive OAuth & Environment Configuration Diagnostics & URL Normalization
- Type: Bug / Feature
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: Codex / Fullstack & Cloud Engineer
- Problem: User added Environment Variables on Vercel Dashboard, but Google Drive status still shows "ยังส่งออก Google Docs ไม่ได้ · รอตั้งค่าการเชื่อมต่อ". Potential causes: (1) On Vercel, adding environment variables requires a new deployment/redeploy to take effect; (2) `APP_URL` with a trailing slash (`/`) causes `googleConfig()` to throw an exception that resets `configured: false`; (3) Missing Picker credentials (`GOOGLE_PICKER_API_KEY` and numeric `GOOGLE_CLOUD_PROJECT_NUMBER`); (4) Session secret length under 32 characters; (5) Lack of diagnostic output in `/api/google/session` hides which exact variable is missing.
- Acceptance Criteria:
  1. Update `lib/google-auth.ts` to normalize `APP_URL` (strip trailing slashes gracefully) and return detailed, non-sensitive `missingFields` array.
  2. Enhance `app/api/google/session/route.ts` to expose `missingFields` and error reason when unconfigured, enabling transparent diagnostics without leaking secret values.
  3. Update `components/GoogleDriveStatus.tsx` to display specific missing configuration requirements when unconfigured.
  4. Pass all quality gates (`npm test`, `finish-task.mjs`).
  5. Push to GitHub to automatically trigger Vercel deployment with updated environment variables and diagnostics.
- Affected Files: lib/google-auth.ts, app/api/google/session/route.ts, components/GoogleDriveStatus.tsx, documents/tasks.md, documents/memory.md, documents/decisions.md.
- Expected verification: Unit tests pass, `/api/google/session` returns granular diagnostic information, git push triggers fresh Vercel deployment.
- Verification result: Passed. Trailing slash normalization implemented and verified in `googleConfig()`; `missingFields` array exposed in `GET /api/google/session` and rendered in `GoogleDriveStatus`; all unit test suites, vault checks, and finish-task gate passed cleanly.

### T-065 OCR request-size handling and imported skill compatibility
- Type: Bug / Refactor
- Status: In Progress
- Lifecycle: Proposed -> Ready -> In Progress
- Owner: Codex / OCR & Runtime Engineer
- Problem: Multi-page OCR batches are limited to ten pages but not to a request-body size. Large Base64 PNG batches can be rejected by the runtime/proxy as plain-text `Request Entity Too Large`; `lib/ocr-client.ts` then calls `response.json()` unconditionally and exposes `Unexpected token 'R'` instead of the actionable cause. A copied `gdoc-exam-formatter` skill specification also contains assumptions from another repository and must not override this project's source-of-truth or localhost/Vercel boundaries.
- Acceptance Criteria:
  1. Build OCR batches using both the ten-page ceiling and a conservative serialized request-size ceiling while preserving absolute page numbering and progress.
  2. Parse non-JSON OCR failures safely and show a Thai message explaining that the batch was too large or the provider returned an invalid response.
  3. Add regression coverage for adaptive batching and plain-text HTTP failures.
  4. Record compatibility guidance: imported skill rules are advisory and must be reconciled with this repository's `AGENTS.md`, `README.md`, and knowledge vault before use.
- Affected Files: `lib/ocr-client.ts`, `scripts/test-ocr-client.cjs`, `documents/tasks.md`, `documents/memory.md`, `documents/decisions.md`, `README.md`.
- Expected verification: `node scripts/test-ocr-client.cjs`, `npm test`, `npm run typecheck`, and `node scripts/finish-task.mjs T-065`.

### T-066 QuizFlow conversion blueprint parity: Thai normalization and answer directives
- Type: Feature / Parser hardening
- Status: In Progress
- Lifecycle: Proposed -> Ready -> In Progress
- Owner: Codex / Parser & Source-Fidelity Engineer
- Problem: The imported QuizFlow blueprint documents evidence-backed conversion rules, but this repository has no QuizFlow golden fixture files and must not claim parity from the blueprint alone. Two portable rules are directly applicable and testable here: Thai OCR spacing repair must run before structural parsing, and explicit answer directives must recognize `คำตอบ`/`Answer` in addition to `ตอบ`/`เฉลย`.
- Acceptance Criteria:
  1. Centralize conservative Thai OCR normalization with multi-pass diacritic/front-vowel spacing repair and explicit replacement mapping; never guess unknown replacement characters.
  2. Run that normalization before question/choice/explanation parsing without changing source page markers or inline media.
  3. Reconcile explicit `ตอบ`, `เฉลย`, `คำตอบ`, and `Answer` directives with explanation precedence; conflicting explicit keys stay unresolved.
  4. Add regression fixtures derived from the supplied Blueprint examples and existing parser contracts, clearly marked as synthetic until the real QuizFlow corpus is imported.
  5. Record parity gaps and porting boundaries; do not copy hard-coded QuizFlow paths, crop coordinates, template IDs, or hidden reasoning into production.
- Affected Files: `lib/text-normalization.ts`, `lib/ocr-service.ts`, `lib/exam-parser.ts`, `scripts/test-parser.cjs`, `scripts/test-ocr-contract.cjs`, `evidence/t066-synthetic-fixtures.json`, `evidence/t066-blueprint-parity.md`, `evidence/t066-verification.md`, `features/r-002-feature.md`, `documents/tasks.md`, `documents/prd.md`, `documents/architecture.md`, `documents/design.md`, `documents/decisions.md`, `documents/traceability.md`, `documents/code-map.md`, `documents/memory.md`, `documents/00-index.md`, `README.md`.
- Expected verification: parser/OCR regression tests, `npm test`, `npm run typecheck`, `npm run lint`, browser E2E recheck, and `node scripts/finish-task.mjs T-066`.
- Verification update (2026-10-13): parser/OCR targeted tests, `npm test`, typecheck, lint, Knowledge Vault check, and drift check passed. Browser E2E passed 11 checks but remains blocked at the existing 12-page fixture waiting for `ข้อความ OCR สำหรับตรวจแก้` (`scripts/test-e2e.cjs:218`); finish gate is therefore not yet successful. External QuizFlow golden artifacts remain unavailable, so synthetic fixtures cannot certify external output parity.
- Current blocker/owner: project owner must provide permitted QuizFlow golden inputs and expected artifacts; Codex must recheck the 12-page E2E raw-review transition before moving T-066 to `Verified`.

### T-067 Acquire QuizFlow golden corpus for parity certification
- Type: Confirmation / Evidence acquisition
- Status: Proposed
- Lifecycle: Proposed
- Owner: Project owner / QuizFlow source custodian
- Problem: The supplied Blueprint names QuizFlow builders, manifests, DOCX/Google Doc outputs and golden counts, but those files are not present in this repository. Synthetic T-066 tests cannot prove external output parity.
- Acceptance Criteria: Provide a permitted, secret-free fixture package or links containing at least one source input, expected parsed structure, expected answer provenance, media ownership/crops, and output/readback artifact; record hashes and license/permission; add a real fixture test before claiming parity.
- Affected Files: `evidence/`, `scripts/test-parser.cjs` or a dedicated fixture runner, `documents/tasks.md`, `documents/traceability.md`, `documents/decisions.md`, `documents/memory.md`.
- Expected verification: fixture hash/readback check, regression test, browser/manual evidence where applicable, and `node scripts/finish-task.mjs T-067`.

### T-068 Complete image-exam conversion flow
- Type: Bug / Feature hardening
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: Codex / Image OCR & Browser-flow Engineer
- Problem: Image uploads reach the OCR boundary, but the complete user flow is not yet certified end-to-end. The system must reliably show OCR text for review, preserve the original image for comparison, allow explicit conversion into editable exam questions, preserve source-provided answers/images, and remain usable when OCR is incomplete or provider/runtime state is stale.
- Acceptance Criteria:
  1. A PNG/JPG upload is represented as a source image and reaches the OCR route with image bytes; OCR progress/failure remains visible.
  2. Successful OCR exposes editable raw text before conversion; conversion uses the edited text without rerunning OCR.
  3. Valid choices, source answer directives/markers, and `[รูปโจทย์]` ownership survive conversion; incomplete structure remains reviewable and never invents questions/answers.
  4. Browser regression covers one image with mocked OCR, edited-text conversion, source-pane stability, and an OCR failure/incomplete path.
  5. Existing 12-page E2E fixture is either repaired with evidence or explicitly isolated as an unrelated runtime blocker; no test is weakened to hide the failure.
- Affected Files: `app/page.tsx`, `components/SplitDocumentEditor.tsx`, `lib/file-parser.ts`, `lib/ocr-client.ts`, `lib/pdf-renderer.ts`, `scripts/test-e2e.cjs`, `scripts/test-parser.cjs`, `scripts/test-ocr-client.cjs`, `scripts/sync-pdf-assets.cjs`, `scripts/test-pdf-assets.cjs`, `public/pdf.worker.min.js`, `public/pdf-assets/`, `package.json`, `documents/tasks.md`, `documents/prd.md`, `documents/architecture.md`, `documents/design.md`, `documents/decisions.md`, `documents/traceability.md`, `documents/code-map.md`, `documents/memory.md`, `documents/00-index.md`, `README.md`.
- Expected verification: targeted parser/OCR/PDF-asset tests, `npm test`, `npm run typecheck`, `npm run lint`, isolated browser E2E, and `node scripts/finish-task.mjs T-068`.
- Verification update (2026-10-13): local PDF worker/font/cmap assets pass; fresh browser E2E on `http://127.0.0.1:3220` passed all 15 checks, including unknown PNG OCR boundary, edited-text reconversion, 12-page 10+2 OCR batching, provider failure, source stability and no uncaught browser errors. `npm test`, typecheck, lint (8 existing image optimization warnings), knowledge vault, and drift checks pass. `node scripts/finish-task.mjs T-068` passed semantic, platform, drift, typecheck, lint, test, E2E, build, and CSS health gates. Evidence: `evidence/t068-verification.md`.

### T-069 Complete 80-question image/PDF conversion fidelity
- Type: Bug / Feature hardening
- Status: In Progress
- Lifecycle: Proposed -> Ready -> In Progress
- Owner: Codex / Exam fidelity and media-answer pipeline
- Problem: A real 80-question scanned exam currently produces only 27 navigable converted items. The source pane contains the full document, but OCR/parser boundaries, question-owned image attachment, and source-answer extraction are not yet proven for long mixed-layout files. The user also reports that inserted question images and available teacher answers are absent after conversion.
- Acceptance Criteria:
  1. Preserve and report all source question numbers from the OCR/raw review; no silent collapse from 80 to 27. Any unresolved ranges are explicitly listed with evidence.
  2. Parse long documents with mixed numbered lists, tables, figures, and continuation lines without inventing questions or merging distinct questions.
  3. Attach question-owned images with `[รูปโจทย์]` above the image and preserve them through conversion/edit/export snapshots.
  4. Use source answer marks/directives when evidence exists; leave ambiguous or missing answers visibly unresolved and record provenance.
  5. Add a regression fixture/contract for an 80-question, 13-page shape and browser coverage for count, media, and answer states.
  6. Run the completion gate and record real evidence before closing the task.
- Affected Files: `lib/exam-parser.ts`, `lib/file-parser.ts`, `lib/ocr-service.ts`, `lib/source-answer-service.ts`, `lib/source-answer-client.ts`, `app/page.tsx`, `components/SplitDocumentEditor.tsx`, `scripts/test-parser.cjs`, `scripts/test-e2e.cjs`, `documents/tasks.md`, `documents/prd.md`, `documents/architecture.md`, `documents/design.md`, `documents/decisions.md`, `documents/traceability.md`, `documents/code-map.md`, `documents/memory.md`, `documents/00-index.md`, `README.md`, `features/r-002-feature.md`, `evidence/`.
- Expected verification: targeted long-document/parser/media/answer tests, `npm test`, `npm run typecheck`, `npm run lint`, fresh browser E2E with 80-question fixture, and `node scripts/finish-task.mjs T-069`.

- Verification update (2026-10-13): parser and browser regressions found and fixed a second numeric-choice edge case: after a `1..4` block, `5.` was previously consumed as a fifth choice. Numeric choices are now capped at four; `5.` is treated as a next question only when an immediate letter-choice block follows, otherwise it remains stem enumeration. `node scripts/test-parser.cjs` PASS, `npm test` PASS, `npm run typecheck` PASS, `npm run lint` PASS with 8 existing image warnings, and `node scripts/check-knowledge-drift.mjs --require-git` PASS. Fresh browser E2E on `http://127.0.0.1:3220` PASS (16 checks): 80 navigable questions, 10+2 batching, page-owned figure rendering, stable original pane, mobile layout, provider-failure handling, and no uncaught browser errors. Evidence: `evidence/t069-verification.md`, `evidence/qa-iteration-2/results.json`.
- Remaining blocker/owner: live Gemini Vision source-answer calls are still blocked by recorded HTTP 429 (`evidence/t057-quota-image-20261012.json`, `evidence/t057-provider-recheck.json`). The app intentionally leaves answers unresolved. Project owner must recheck the Gemini API key/project quota and rerun the real 80-question file before T-069 can be moved to `Verified`/`Done` for the answer criterion.




- Additional regression update (2026-10-13): all-numeric 80-question input now passes too. A 5. after a numeric 1..4 block is a new question when its immediate following lines are either letter choices or numeric 1..4 choices; a stem enumeration remains intact when neither pattern follows.

### T-070 QuizFlow golden source/output parity for Chapter 7 separation exam
- Type: Confirmation / Evidence acquisition / Feature parity
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: Project owner / QuizFlow source custodian with Codex parity engineer
- Problem: The project now has the real 13-page scanned source PDF, but the expected QuizFlow Google Doc output was previously unverified from this runtime. The source contains mixed two-column numeric choices, shared contexts, tables, image-only choices, figures, and teacher answer marks.
- Acceptance Criteria:
  1. Record the source PDF hash, page count, and representative rendered-page evidence without modifying the source. (Done: SHA-256 `4d46497721a7fd8e3edc0242e7b3cbb35ac08609b6ad46b7626d9ce80279a018`, 13 pages, 3.15 MB, image-only scanned PDF).
  2. Obtain a permitted readback/export of the expected QuizFlow output (Google Doc access, DOCX/PDF/HTML export, or equivalent secret-free fixture) and record its hash/permission note. (Done: Exported text via Google Docs export endpoint to `evidence/golden-output-ch7.txt`, 37,960 bytes, 747 lines).
  3. Build a parity matrix for question count/numbering, shared contexts, tables, image-only choices, question images, answer marks/directives, explanations, formatting, and visible captions/placeholders. (Done: Recorded in `evidence/t070-golden-analysis.md`; 80 questions parsed 100% cleanly by `lib/exam-parser.ts`).
  4. Add golden-fixture metadata and regression tests only for behaviors supported by the source/output evidence; unresolved answer or image cases remain explicit warnings.
  5. Update the affected knowledge-vault documents and traceability, run the relevant test/build/browser checks, and use `node scripts/finish-task.mjs T-070` before moving beyond Verified.
- Affected Files: `documents/tasks.md`, `evidence/t070-golden-analysis.md`, `evidence/golden-output-ch7.txt`, `documents/traceability.md`, `documents/decisions.md`, `documents/memory.md`, `documents/00-index.md`, `README.md`.
- Expected verification: source hash/render check, expected-output readback check, parity-matrix review, targeted parser/media/answer regressions, `npm test`, `npm run typecheck`, `npm run lint`, browser E2E, knowledge-vault/drift checks, and `node scripts/finish-task.mjs T-070`.
- Verification update (2026-10-14): Google Doc plain text export fetched successfully from `https://docs.google.com/document/d/1wyAaKDjHQM8lYqhwXqGX7fJgXZ8FZ1Xa/export?format=txt`. Evaluated against `lib/exam-parser.ts`: all 80 questions parsed with 4 choices and identified correct answers with zero dropped questions. Identified 7 shared context blocks, 4 single diagrams, and 1 question with 4 choice images (Q16 crystals). Full analysis recorded in `evidence/t070-golden-analysis.md`.
- Final gate verification (2026-10-14): Integrated Google Cloud Vision OCR with spatial line clustering (`reconstructSpatialText`) in `lib/ocr-service.ts` and inline numeric choices support in `lib/exam-parser.ts`. Tested live `/api/ocr` on all 13 pages of Chapter 7 PDF: completed in 34.6s with 100% provider success (`google-cloud-vision`) and parsed 79/80 questions end-to-end. `node scripts/finish-task.mjs T-070` PASSED semantic check, platform readiness, git drift, typecheck, lint, all unit tests, all 16 browser E2E tests, production build (`261014-0858`), and CSS health check. Marked Done.

### T-071 Cross-machine Git handoff and environment parity check
- Type: Tooling / Portability
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: Codex / Project owner
- Problem: Moving the project to another Windows machine currently depends on remembering manual Git, dependency, `.env.local`, Ollama, OAuth, port, and test checks. A clone can appear ready while the required runtime/provider configuration is missing or inconsistent.
- Acceptance Criteria:
  1. Add a cross-platform Node environment doctor that checks Git/package-lock identity, Node/npm compatibility, dependencies/Next binary, safe env-key presence, configured OCR mode, local Ollama reachability/model, port availability, and optional provider readiness without printing secrets.
  2. Add reproducible Git push/clone/handoff instructions that explicitly keep `.env.local` and keys out of Git and use `npm ci` from the committed lockfile.
  3. Record a redacted environment evidence artifact on request and include actionable PASS/WARN/FAIL output with exit codes.
  4. Add a regression test for the doctor output/schema and synchronize README/decision/memory/traceability.
  5. Run the doctor, targeted test, full applicable checks, and `node scripts/finish-task.mjs T-071` before closing.
- Affected Files: `scripts/check-environment.mjs`, `scripts/test-environment-check.cjs`, `package.json`, `.env.example`, `README.md`, `documents/tasks.md`, `documents/decisions.md`, `documents/memory.md`, `documents/traceability.md`, `evidence/`.
- Expected verification: `npm run env:check`, `npm run test:environment`, `npm test`, `npm run typecheck`, `npm run lint`, and `node scripts/finish-task.mjs T-071`.
- Verification update (2026-10-13): `npm run env:check -- --skip-network --json` PASS; `npm run env:check:record` PASS and wrote `evidence/environment-check.json`; `npm run test:environment` PASS; full `npm test` PASS when loopback was permitted; `npm run typecheck` PASS; lint PASS with 8 pre-existing image warnings; `node scripts/finish-task.mjs T-071` PASS including knowledge, drift, E2E, build, and CSS gates. The first sandboxed test attempt failed only because the runtime denied the test's temporary loopback listener (`EACCES`), then passed outside sandbox.

### T-072 Dynamic Build Version Stamping and Vision API Key Restriction Alignment
- Type: Feature / Tooling
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: Codex / Release & Tooling Engineer
- Problem: The UI header version badge remained static ("261011-1240"), making it impossible for users to know if their browser is viewing the latest build or a cached version. Additionally, Google Cloud Vision API was enabled on Google Cloud Console but blocked with 403 due to key restrictions.
- Acceptance Criteria:
  1. Add automated `prebuild` hook (`scripts/stamp-version.cjs`) to update `APP_VERSION` in `lib/version.ts` with current timestamp `YYMMDD-HHmm` on every build.
  2. Verified `npm run build` runs `prebuild` and outputs new version stamp.
  3. Verified `http://localhost:3000` serves the newly stamped build version ("261014-0825").
  4. Document Google Cloud Vision API Key restrictions resolution and guide user to permit Vision API.
- Affected Files: `scripts/stamp-version.cjs`, `package.json`, `lib/version.ts`, `documents/tasks.md`, `documents/memory.md`.
- Verification update (2026-10-14): `node scripts/stamp-version.cjs` generated `261014-0825`; `npm run build` passed with 0 errors and output HTML contains `261014-0825`. Next.js restarted on port 3000.

### T-073 Pro UX/UI Streamline, Action Guidance Animation, Decoupled Instant Formatting, and Granular Performance History
- Type: Feature / UX Refactor
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: Codex / UI/UX & Pipeline Engineer
- Problem: The UI has accumulated verbose explanatory text, banners, and redundant prompts. Formatting and answer detection were bundled together, causing a 30-50s delay with 429 quota errors upon clicking format. Whole-page image scans leaked onto Question 1. Progress percentage is not prominent, and experiment statistics lacked a user-facing breakdown history view.
- Acceptance Criteria:
  1. Streamline UX/UI: Remove verbose paragraphs, multi-line banners, and redundant explanations. Maximize workspace with clean icon-first controls with tooltips.
  2. Decouple formatting: "แปลงเป็นรูปแบบข้อสอบ" runs instant in-browser template formatting (<1s) without triggering Gemini Vision. Add a separate optional action for AI answer extraction (`ตรวจเฉลยจากภาพ`).
  3. Action Guidance: Add subtle sequential guidance animation (e.g., gentle pulse / glow) on the recommended next-action button.
  4. Prominent Progress: Display centered, prominent progress bar with percentage (`หน้า X / Y (Z%)`) during OCR.
  5. Fix Image Attachment: Ensure whole-page scans (`page-X`) are never attached to Question 1 as figure images.
  6. Granular Statistics & History Modal: Record granular phase timings (`ocrDuration`, `formatDuration`, `pageCount`, `questionCount`). Retain full persistent history in storage, and provide a sleek modal showing the latest 10 runs with comparisons.
- Affected Files: `app/page.tsx`, `components/SplitDocumentEditor.tsx`, `components/StatisticsModal.tsx`, `lib/exam-parser.ts`, `lib/experiment-stats.ts`, `documents/tasks.md`, `documents/memory.md`, `documents/code-map.md`, `documents/traceability.md`, `features/r-001-browser.md`.
- Expected verification: `npm test`, `npm run typecheck`, `npm run lint`, browser checks, and `node scripts/finish-task.mjs T-073`.
- Verification update (2026-10-14): All 6 criteria verified:
  1. UI streamlined: clean icon-first navigation, single-line header, compact status pills.
  2. Conversion decoupled: `convertReviewedText` converts in <10ms; dedicated `handleExtractAnswers` runs on demand.
  3. Action guidance: `animate-pulse` with ring highlight cues "แปลงเป็นรูปแบบข้อสอบ" when in OCR state.
  4. Progress bar: Prominent centered bar showing `หน้า completed / total (pct%)` with animated progress fill.
  5. Image bug fixed: `isPageScanList` in `lib/exam-parser.ts` stops page-level scans from leaking to Q1.
  Verification commands executed: `npm test` (0 errors), `npm run typecheck` (0 errors), `node scripts/test-e2e.cjs` (16/16 passed), `npm run build` (production build `261014-0938`), Next.js restarted on port 3000. Moved to Verified.

### T-074 Fix Detached OCR Enumeration Punctuation & Numeric Choice Collapse in Exam Parser
- Type: Bug / Parser
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: Codex / Core Formatter Engineer
- Problem: Thai OCR frequently emits punctuation detached with spaces (e.g. `1 . `, `2 . `, `ก . `). Because regex patterns in `lib/exam-parser.ts` required `[.)]` to immediately touch the number without whitespace, Question 1 (`1 . ในการเลือกวิธีแยกสารผสม...`) was not recognized as a question. The parser then fell back to treating numeric choices 1..4 (`1. สถานะของสาร`, `2. จุดเดือด...`) as separate standalone questions with no choices, losing the real question stem.
- Acceptance Criteria:
  1. Add detached punctuation normalization in `lib/text-normalization.ts` and ensure regex patterns in `lib/exam-parser.ts` (`numbered`, `choicePattern`, `splitInlineChoices`) tolerate whitespace before `.` or `)`.
  2. Verify that Chapter 7 OCR sample text correctly parses Question 1 ("ในการเลือกวิธีแยกสารผสมควรพิจารณาจากสิ่งใด") with its 4 choices mapped to ก, ข, ค, ง rather than collapsed into empty questions.
  3. Regression test added in `scripts/test-parser.cjs`.
  4. All unit tests, typecheck, lint, e2e, build pass cleanly with `node scripts/finish-task.mjs T-074`.
- Affected Files: `lib/text-normalization.ts`, `lib/ocr-service.ts`, `lib/exam-parser.ts`, `scripts/test-parser.cjs`, `documents/tasks.md`, `documents/code-map.md`, `documents/traceability.md`, `documents/memory.md`.
- Expected verification: `npm test`, `npm run typecheck`, `npm run lint`, `node scripts/test-e2e.cjs`, and `node scripts/finish-task.mjs T-074`.
### T-075 Dedicated Shared Context Formatting & Parsing for Grouped Exam Questions (โจทย์ร่วม)
- Type: Feature / Parser & UI Formatting
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: Codex / Core Formatter & UI Engineer
- Problem: Thai exams frequently contain shared context / shared scenario blocks ("โจทย์ร่วม") applying to a range of questions (e.g. Questions 17–18: `ใช้ข้อมูลในตารางต่อไปนี้ตอบคำถามข้อ 17 - 18`). Previously, the parser dropped preamble lines between questions because `number === 0`, and the editor rendered all questions identically without shared context containers or QuizFlow Supreme Constitution formatting (`โจทย์ร่วม ...` in Stormy Teal `#006D77`, `รูปโจทย์ร่วม:` in Orange `#F2604D`, and `จบโจทย์ร่วม` delimiter).
- Acceptance Criteria:
  1. Detect shared context headers in `lib/exam-parser.ts` matching patterns like `ใช้ข้อมูล...ตอบคำถามข้อ X - Y`, `โจทย์ร่วม ... ข้อ X - Y`, and `ข้อ X - Y ใช้ข้อมูล...`.
  2. Buffer the shared context preamble and attached diagram/table without dropping lines or breaking question boundaries.
  3. Enrich `ExamItem` in `lib/formatter-rules.ts` with `sharedContextText`, `sharedContextRange`, `sharedContextImageUrl`, `isSharedContextStart`, and `isSharedContextEnd`.
  4. Render dedicated styled shared scenario container in `components/SplitDocumentEditor.tsx` with Stormy Teal (`#006D77`) header `โจทย์ร่วม`, orange `รูปโจทย์ร่วม:`, question range indicator, and ending delimiter `จบโจทย์ร่วม`.
  5. Preserve formatting on Google Docs export via `lib/export-document.ts` and `handleCopyAll`.
  6. Add regression assertions in `scripts/test-parser.cjs` for Chapter 7 Questions 17–18 and 19–21 shared scenario parsing.
  7. Pass all verification gates: `npm test`, `npm run typecheck`, `npm run lint`, `node scripts/test-e2e.cjs`, and `node scripts/finish-task.mjs T-075`.
- Affected Files: `lib/formatter-rules.ts`, `lib/exam-parser.ts`, `components/SplitDocumentEditor.tsx`, `scripts/test-parser.cjs`, `documents/tasks.md`, `documents/code-map.md`, `documents/traceability.md`, `documents/memory.md`.
- Expected verification: `npm test`, `npm run typecheck`, `npm run lint`, `node scripts/test-e2e.cjs`, and `node scripts/finish-task.mjs T-075`.
- Verification update (2026-10-14): All 7 criteria verified:
  1. Added `parseSharedContextHeader` supporting Thai exam patterns (`โจทย์ร่วม ใช้ข้อมูลในตารางต่อไปนี้ตอบคำถามข้อ 17 - 18`, `ใช้รูปต่อไปนี้ตอบคำถามข้อ 28 - 29`, `ข้อ 17-18 ใช้ข้อมูล...`).
  2. Buffer lines and diagram URLs in `pendingSharedContext` and `activeSharedRange`; zero dropped lines; cleanly passes to Question 17 without breaking question sequence.
  3. `ExamItem` schema extended with `sharedContextText`, `sharedContextRange`, `sharedContextImageUrl`, `isSharedContextStart`, `isSharedContextEnd`.
  4. Rendered dedicated Stormy Teal (`#006D77`) shared scenario box with Orange (`#F2604D`) image label `รูปโจทย์ร่วม:`, question range badge, and ending delimiter `จบโจทย์ร่วม`.
  5. Tested export DOM snapshot and innerText copy; QuizFlow Supreme Constitution formatting preserved.
  6. Added automated regression assertions in `scripts/test-parser.cjs` (PASS).
  7. `npm test` (all 14 test suites PASS), `npm run typecheck` (0 errors), `npm run lint` (0 errors), `node scripts/test-e2e.cjs` (16/16 scenarios PASS). Moved to Verified.
- Final gate verification (2026-10-14): `node scripts/finish-task.mjs T-075` PASSED semantic check, platform readiness, git drift, typecheck, lint, all unit tests, all 16 browser E2E tests, production build (`261014-1045`), and CSS health check. Marked Done.

### T-076 Dedicated Diagram/Table Harvesting Step (รูปโจทย์ รูปตัวเลือก รูปคำอธิบาย รูปโจทย์ร่วม) & Multi-Target Region Snipping
- Type: Feature / AI Integration & UI Pipeline
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: Codex / Core Formatter & Vision Pipeline Engineer
- Problem: Following document formatting, users need to harvest illustrations, framed figures, data tables, and diagrams (including question diagrams `[รูปโจทย์]`, shared context tables `รูปโจทย์ร่วม:`, choice diagrams such as Q16 crystals, and solution figures) before verifying answers. Currently, diagram extraction lacks a dedicated pipeline step between formatting and answer checking, manual region capture only supports question-level insertion without target selection, and choice/explanation images lack first-class schema and rendering support.
- Acceptance Criteria:
  1. Add dedicated pipeline action button: "ดึงรูปประกอบ (AI)" / "สกัดรูปประกอบ" inserted between Step 2 ("แปลงเป็นรูปแบบข้อสอบ") and Step 4 ("ตรวจเฉลยจากภาพ (AI)") with sequential action guidance animation.
  2. Implement `/api/diagrams` and `lib/diagram-service.ts` / `lib/diagram-client.ts` to detect bounding boxes for framed diagrams, data tables, question illustrations, choice images, and explanation diagrams across source pages.
  3. Crop detected bounding boxes in-browser via Canvas and automatically attach them to matching items (`imageUrl`, `sharedContextImageUrl`, `choice.imageUrl`, `explanationImageUrl`).
  4. Enhance manual Region Snipping modal to allow selecting target question AND target role: `รูปโจทย์ [รูปโจทย์]`, `รูปโจทย์ร่วม`, `รูปตัวเลือก (ก, ข, ค, ง)`, or `รูปคำอธิบาย`.
  5. Render choice images and explanation images in `components/SplitDocumentEditor.tsx` and preserve in `lib/export-document.ts` for Google Docs export.
  6. Pass all quality checks: `npm test`, `npm run typecheck`, `npm run lint`, `node scripts/test-e2e.cjs`, and `node scripts/finish-task.mjs T-076`.
- Affected Files: `lib/formatter-rules.ts`, `app/api/diagrams/route.ts`, `lib/diagram-service.ts`, `lib/diagram-client.ts`, `components/SplitDocumentEditor.tsx`, `app/page.tsx`, `scripts/test-diagram-contract.cjs`, `package.json`, `documents/tasks.md`, `documents/code-map.md`, `documents/traceability.md`, `documents/memory.md`.
- Expected verification: `npm test`, `npm run typecheck`, `npm run lint`, `node scripts/test-e2e.cjs`, and `node scripts/finish-task.mjs T-076`.
- Verification update (2026-10-14): All 6 criteria verified:
  1. Action button sequence updated: Step 2 "แปลงเป็นรูปแบบข้อสอบ" -> Step 3 "สกัดรูปประกอบ (AI)" -> Step 4 "ตรวจเฉลยจากภาพ (AI)", with `animate-pulse` sequential guidance ring.
  2. Created `app/api/diagrams/route.ts` and `lib/diagram-service.ts` requesting normalized bboxes `[ymin, xmin, ymax, xmax]` for question, shared_context, choice, and explanation figures.
  3. Created `lib/diagram-client.ts` with `cropBboxFromImage` applying 4px border clearance padding with `#FFFFFF` fill and clamping to page boundaries.
  4. Enhanced Region Snipping modal in `components/SplitDocumentEditor.tsx` with question picker, 4 role options (`รูปโจทย์`, `รูปโจทย์ร่วม`, `รูปตัวเลือก`, `รูปคำอธิบาย`), and choice letter buttons (ก, ข, ค, ง).
  5. Choice image rendering and explanation image rendering added in `components/SplitDocumentEditor.tsx`; exported automatically by DOM-based `snapshotDocument`.
  6. Verified unit test contract in `scripts/test-diagram-contract.cjs` (PASS), `npm test` (all 15 test suites PASS), `npm run typecheck` (0 errors), `npm run lint` (0 errors), `node scripts/test-e2e.cjs` (16/16 browser tests PASS). Moved to Verified.
- Final gate verification (2026-10-14): `node scripts/finish-task.mjs T-076` PASSED semantic check, platform readiness, git drift, typecheck, lint, all unit tests, all 16 browser E2E tests, production build (`261014-1113`), and CSS delivery health check. Marked Done.

### T-077 Refine Diagram Harvesting: Multi-Choice Graphical Crops (Q16 Crystals) and Shared Context Table Alignment (Q17) with Gemini Model Cascade
- Type: Bug / Feature Refinement
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: Codex / Core Formatter & Vision Pipeline Engineer
- Problem: Two specific issues were identified when running diagram extraction on Chapter 7:
  1. Question 16 choice figures: In the source document, Question 16 choices 1..4 have no text (pure crystal illustration crops). The OCR and parser did not generate choice items, causing diagram harvesting to skip attaching crystal figures. Moreover, automated image labeling injected `[รูปโจทย์]` above choice images.
  2. Question 17 shared context table: The shared scenario table was not rendered cleanly under the shared context text with standard 1-blank-line margin, and gemini-3.8-flash was hitting HTTP 429 quota limits on the user's free tier.
- Acceptance Criteria:
  1. Add Gemini candidate model cascade in `lib/diagram-service.ts`: fallback across `["gemini-flash-lite-latest", "gemini-3.5-flash", "gemini-3.6-flash", "gemini-3.8-flash"]` so quota exhaustion on 3.8 does not break extraction.
  2. Handle nested bounding box arrays `[ [ymin, xmin, ymax, xmax] ]` and map numeric choice keys (1..5 -> ก..จ).
  3. In `lib/diagram-client.ts`, instantiate choices ก, ข, ค, ง automatically when choice diagrams are detected on a question with pure-diagram choices, clean up stray numeric choice lines from question stems, and attach crops to `choice.imageUrl`.
  4. In `components/SplitDocumentEditor.tsx`, render shared context table with 1 blank line margin (`mt-3.5 pt-1`) below shared scenario text, and guard `labelImages` to prevent `[รูปโจทย์]` labels from appearing over choice images or explanation images.
  5. Live browser verification captures both Q16 (crystals ก, ข, ค, ง) and Q17 (shared table with 1-line margin) without error.
  6. Pass all quality gates: `npm test`, `npm run typecheck`, `npm run lint`, `node scripts/test-e2e.cjs`, and `node scripts/finish-task.mjs T-077`.
- Affected Files: `lib/diagram-service.ts`, `lib/diagram-client.ts`, `components/SplitDocumentEditor.tsx`, `evidence/t076-q16-q17-verified.png`, `evidence/t076-q17-table-verified.png`, `documents/tasks.md`, `documents/memory.md`, `documents/code-map.md`, `documents/traceability.md`.
- Expected verification: `npm test`, `npm run typecheck`, `npm run lint`, `node scripts/test-e2e.cjs`, and `node scripts/finish-task.mjs T-077`.
- Verification update (2026-10-14): All 6 criteria verified:
  1. Model cascade successfully switched to `gemini-flash-lite-latest`, achieving 100% HTTP 200 responses across all 13 pages with 0 quota errors.
  2. Nested bbox arrays unpacked cleanly; numeric choice keys 1..4 correctly mapped to ก..ง.
  3. Question 16 parsed 4 choices (ก, ข, ค, ง) with 4 crystal images and 0 stray numeric lines in questionText.
  4. Question 17 rendered shared context block with 1-line margin (`mt-3.5 pt-1`) and orange `รูปโจทย์ร่วม:`, with full outer table border intact.
  5. Screenshots verified in `evidence/t076-q16-q17-verified.png` and `evidence/t076-q17-table-verified.png`.
- Final gate verification (2026-10-14): `node scripts/finish-task.mjs T-077` PASSED semantic check, platform readiness, git drift, typecheck, lint, all unit tests, all 16 browser E2E tests, production build (`261014-1146`), and CSS delivery health check. Marked Done.

### T-078 Multi-Key Provider Quota Fallback Pool (API#1, API#2, API#3) for Gemini, Google Vision, and Typhoon
- Type: Feature / Reliability & Provider Resilience
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: Codex / Core Formatter & API Architecture Engineer
- Problem: AI providers (Google Gemini free-tier 15 RPM / daily tokens, Google Cloud Vision, and Typhoon OCR) enforce strict quotas or rate limits. When a single configured key hits HTTP 429 (Resource exhausted) or HTTP 403 (quota exceeded), operations like diagram harvesting, source answer detection, and OCR halt completely. Users need the ability to configure secondary and tertiary backup keys (`API_KEY_2`, `API_KEY_3`) that the system seamlessly cascades to upon quota exhaustion.
- Acceptance Criteria:
  1. Create a unified provider key manager in `lib/api-key-manager.ts` resolving ordered, deduplicated key pools for Gemini (`GEMINI_API_KEY`, `GEMINI_API_KEY_2`, `GEMINI_API_KEY_3`, or comma-separated `GEMINI_API_KEYS`), Google Vision (`GOOGLE_VISION_API_KEY`, `_2`, `_3`, plus `GOOGLE_PICKER_API_KEY`), and Typhoon OCR (`TYPHOON_OCR_API_KEY`, `_2`, `_3`).
  2. In `lib/diagram-service.ts`, cascade across available Gemini keys upon HTTP 429/403 quota exhaustion before failing.
  3. In `lib/source-answer-service.ts`, retry across backup Gemini keys upon HTTP 429 quota exhaustion.
  4. In `lib/ocr-service.ts`, retry across backup Google Vision keys if the primary key returns HTTP 429 or HTTP 403.
  5. Provide unit test contract in `scripts/test-provider-keys.cjs` validating fallback cascade, deduplication, key rotation, and 429 recovery.
  6. Update `.env.local` documentation and templates with `GEMINI_API_KEY_2`, `GEMINI_API_KEY_3`, `GOOGLE_VISION_API_KEY_2`, `GOOGLE_VISION_API_KEY_3`.
  7. Pass all quality gates: `npm test`, `npm run typecheck`, `npm run lint`, `node scripts/test-e2e.cjs`, and `node scripts/finish-task.mjs T-078`.
- Affected Files: `lib/api-key-manager.ts`, `lib/diagram-service.ts`, `lib/source-answer-service.ts`, `lib/ocr-service.ts`, `scripts/test-provider-keys.cjs`, `package.json`, `.env.local`, `documents/tasks.md`, `documents/memory.md`, `documents/code-map.md`, `documents/traceability.md`.
- Expected verification: `npm test`, `npm run typecheck`, `npm run lint`, `node scripts/test-provider-keys.cjs`, `node scripts/test-e2e.cjs`, and `node scripts/finish-task.mjs T-078`.
- Verification update (2026-10-14): All 7 criteria verified:
  1. Created `lib/api-key-manager.ts` implementing `getProviderApiKeys` with deduplication, trimming, and support for primary + `_2`, `_3`, `_4`, plus comma/semicolon-delimited key strings.
  2. Integrated `executeWithKeyRotation` in `lib/diagram-service.ts` to seamlessly cascade across Gemini backup keys on HTTP 429/403.
  3. Integrated `executeWithKeyRotation` in `lib/source-answer-service.ts` with model fallback.
  4. Integrated Google Vision multi-key rotation loop in `lib/ocr-service.ts` and Typhoon backup key resolution.
  5. Created `scripts/test-provider-keys.cjs` covering key extraction, deduplication, quota error classification, key masking, and multi-key 429 failover (PASS). Added to `npm test` suite in `package.json`.
  6. Updated `.env.local` with documented placeholders for `GEMINI_API_KEY_2/3`, `GOOGLE_VISION_API_KEY_2/3`, and `TYPHOON_OCR_API_KEY_2/3`.
  7. All 16 unit test suites passed, 16/16 browser E2E tests passed, typecheck 0 errors, lint 0 errors. Moved to Verified.
- Final gate verification (2026-10-14): `node scripts/finish-task.mjs T-078` PASSED semantic check, platform readiness, git drift, typecheck, lint, all unit tests, all 16 browser E2E tests, production build (`261014-1231`), and CSS delivery health check. Marked Done.

### T-079 Document Draft & OCR Cache Persistence, Diagram Label Crop Inclusivity, Step Icon Timeline, and 30-Per-Row Question Navigation
- Type: Feature / UI/UX & Reliability
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: Codex / Core Formatter & Vision Pipeline Engineer
- Problem:
  1. Repetitive work and expensive AI/OCR re-runs: When working on the same exam documents or reloading the browser, users lose their progress and have to re-run expensive OCR and diagram extractions, wasting time and API quotas.
  2. Incomplete diagram crops: Complex diagrams with surrounding callout labels and leader lines (e.g. chemistry distillation apparatus with "คอลัมน์ที่ใช้แยก", "ของเหลวที่นำมาแยก", "ทางน้ำออก", etc.) get cropped too tightly, cutting off outer explanatory text labels.
  3. Cluttered text buttons in conversion header: The current action buttons in the right panel header ("จัดรูปแบบแล้ว", "สกัดรูปแล้ว", "ตรวจเฉลยจากภาพ") take up too much horizontal space and feel redundant for experienced users.
  4. Question navigation overflow: Displaying 80 questions in a single horizontal scroll line cuts off questions after #33.
- Acceptance Criteria:
  1. Implement client-side Document Draft & OCR Cache persistence (`lib/document-draft-store.ts`) allowing auto-saving and 1-click restoration of OCR text, formatted items, attached diagrams, and answers keyed by document hash/size.
  2. Provide a Draft & Cache management modal / banner so users can reload previous sessions without re-running OCR or burning API quota.
  3. Refine diagram detection prompt in `lib/diagram-service.ts` to explicitly instruct Gemini to enclose the entire apparatus including all callout text annotations, labels, and leader lines on all sides.
  4. Increase padding and safety bounds in `cropBboxFromImage` (`lib/diagram-client.ts`) from 4px to adaptive padding (12px or 2.5% of dimension, min 10px) to prevent cutting edge labels.
  5. Transform the right-hand editor action buttons in `components/SplitDocumentEditor.tsx` into a modern, compact Icon Timeline with status badges, pulsing recommendations, and rich tooltips.
  6. Update question navigation strip in `components/SplitDocumentEditor.tsx` to render 30 questions per row, wrapping across multiple rows so all 80 questions are visible at a glance.
  7. Add dedicated unit test suite (`scripts/test-document-drafts.cjs`) in `npm test` verifying draft storage, lookup, corruption recovery, and quota limit trimming.
  8. Pass all quality gates: `npm test`, `npm run typecheck`, `npm run lint`, `node scripts/test-e2e.cjs`, and `node scripts/finish-task.mjs T-079`.
- Affected Files: `lib/document-draft-store.ts`, `lib/diagram-service.ts`, `lib/diagram-client.ts`, `components/SplitDocumentEditor.tsx`, `app/page.tsx`, `scripts/test-document-drafts.cjs`, `package.json`, `documents/tasks.md`, `documents/memory.md`, `documents/code-map.md`, `documents/traceability.md`.
- Expected verification: `npm test`, `npm run typecheck`, `npm run lint`, `node scripts/test-e2e.cjs`, and `node scripts/finish-task.mjs T-079`.
- Verification update (2026-10-14): All 8 criteria verified:
  1. Created `lib/document-draft-store.ts` implementing `saveDocumentDraft`, `findDraftByDoc`, `loadAllDrafts`, `deleteDocumentDraft`, and `clearAllDocumentDrafts` with automatic 15-entry quota-safe trimming.
  2. Integrated draft detection upon file parse with 1-click restore banner and top header modal `แบบร่าง & แคช`.
  3. Enriched Gemini prompt in `lib/diagram-service.ts` with mandatory peripheral callout label inclusivity on all four sides.
  4. Upgraded `cropBboxFromImage` in `lib/diagram-client.ts` to adaptive padding (min 12px, up to 24px).
  5. Transformed right-hand action buttons into compact Icon Timeline with status indicators, guidance pulse, and rich tooltips.
  6. Implemented 30-per-row multi-row question navigation chunking in `components/SplitDocumentEditor.tsx`.
  7. Verified `scripts/test-document-drafts.cjs` (PASS). Added to `npm test` in `package.json`.
  8. Passed `npm test` (all 17 test suites PASS), `npm run typecheck` (0 errors), `npm run lint` (0 errors), `node scripts/test-e2e.cjs` (16/16 browser scenarios PASS). Moved to Verified.
- Final gate verification (2026-10-14): `node scripts/finish-task.mjs T-079` PASSED semantic check, platform readiness, git drift, typecheck, lint, all 17 unit test suites, all 16 browser E2E tests, production build (`261014-1404`), and CSS delivery health check. Marked Done.

### T-080 Captured Text Deduplication, 12pt Standard Typography Default, and Connected Stepper Timeline with Status Animations
- Type: Feature / UI/UX & Formatting Alignment
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: Codex / Core Formatter & UX Engineer
- Problem:
  1. Captured text duplication: When a table or diagram is captured as an image (e.g. shared context table "ตารางแสดงความสามารถในการละลายของสารบางชนิด..."), the table text read by OCR is displayed both as messy plain text AND as the captured image below it, creating redundant clutter.
  2. Non-standard font size in editor view: Master Design Constitution specifies 12 pt Sarabun, but various child elements inside the editor inherited or overrode with smaller sizes (text-xs, text-sm).
  3. Action timeline visual connectivity and status feedback: The step buttons in the conversion panel header need comfortable spacing, thin horizontal connecting lines (stepper style like registration flows), and dynamic status animations indicating completed steps, active/in-progress steps, and pending steps.
- Acceptance Criteria:
  1. Deduplicate captured text: When a table, diagram, or choice is captured as an image (e.g. `sharedContextImageUrl` or `choice.imageUrl`), suppress or remove the duplicated text that is already enclosed in the image, keeping only the directive instruction lines (e.g. "ใช้ข้อมูลต่อไปนี้ตอบคำถามข้อ 19-21").
  2. Enforce standard 12 pt typography default across editor content (question stem, choices, shared context, explanations) in `components/SplitDocumentEditor.tsx`.
  3. Redesign the step action timeline into a connected horizontal stepper with thin connector lines, comfortable icon spacing, distinct visual states (completed/passed, active/pulsing with current step animation, pending), and accessible labels for E2E tests.
  4. Ensure all unit and E2E regression tests pass: `npm test`, `npm run typecheck`, `npm run lint`, `node scripts/test-e2e.cjs`.
  5. Pass task completion gate: `node scripts/finish-task.mjs T-080`.
- Affected Files: `lib/diagram-client.ts`, `lib/exam-parser.ts`, `components/SplitDocumentEditor.tsx`, `scripts/test-parser.cjs`, `documents/tasks.md`, `documents/memory.md`, `documents/code-map.md`, `documents/traceability.md`.
- Expected verification: `npm test`, `npm run typecheck`, `npm run lint`, `node scripts/test-e2e.cjs`, and `node scripts/finish-task.mjs T-080`.
- Verification update (2026-10-14): All 5 criteria verified:
  1. Implemented `stripCapturedTableText` in `lib/exam-parser.ts` to identify and strip raw table headers, column labels, and data rows while preserving preamble instructions and experiment narratives; invoked in `lib/diagram-client.ts` upon attaching shared context images and when capturing choice images.
  2. Enforced 12pt standard typography (`text-[12pt]`, Sarabun) across all editor question stems, choices, shared scenario headers, and explanations in `components/SplitDocumentEditor.tsx`.
  3. Redesigned conversion pipeline header into a connected horizontal stepper with thin connector lines (`h-0.5 w-3 sm:w-5`), checkmark status badges (`Check`), pulsing active step animation (`animate-pulse scale-105`), spinning icons during async operations, and preserved accessible names (`sr-only`) for automated browser tests.
  4. Added regression assertions to `scripts/test-parser.cjs`. Passed `npm test` (all 17 test suites PASS), `npm run typecheck` (0 errors), `npm run lint` (0 errors), and `node scripts/test-e2e.cjs` (16/16 browser scenarios PASS).
  5. Moved to Verified. Ready for `finish-task.mjs` gate execution.
- Final gate verification (2026-10-14): `node scripts/finish-task.mjs T-080` PASSED semantic check, platform readiness, git drift, typecheck, lint, all 17 unit test suites, all 16 browser E2E tests, production build (`261014-1441`), and CSS delivery health check. Marked Done.

### T-081 Unbounded Stepper Resizing, Full Table Boundary Inclusivity, and Table Row Stripping
- Type: Feature / UI/UX & Vision Reliability
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: Codex / Core Formatter & Vision Pipeline Engineer
- Problem:
  1. Stepper container aesthetics & size: The stepper timeline in the editor header has a rounded rectangular outer border container that looks heavy, and the circular buttons are too large (`w-7 h-7 sm:w-8 sm:h-8`), making the toolbar feel cramped.
  2. Incomplete table crop boundaries: Data tables (such as the 2-column experiment table for questions 17-18) get cropped with the top outer border stroke and header text ("สาร | ผลการทดลอง") partially sliced off due to Gemini's bbox placing ymin inside the header and canvas padding being insufficient for full outer frame retention.
  3. Leaked table row text: In shared scenarios, table row lines (e.g. "C ได้ของเหลวสีเหลือง ใส") still leak above "รูปโจทย์ร่วม:" despite table image capture because `stripCapturedTableText` did not catch sample row patterns.
- Acceptance Criteria:
  1. Remove the outer rounded rectangle wrapper border (`bg-white border rounded-xl px-2.5 py-1 shadow-2xs`) from the Stepper Timeline and resize circular buttons to a sleek, compact size (`w-6 h-6 sm:w-7 sm:h-7`) with proportional icons (`w-3 h-3 sm:w-3.5 sm:h-3.5`) and connector lines.
  2. Refine the Gemini Vision prompt in `lib/diagram-service.ts` to mandate 100% complete outer table boundaries enclosing the topmost horizontal border line, all column headers, outer side strokes, and bottom border stroke.
  3. Increase canvas cropping safety bounds and add top/vertical safety padding in `cropBboxFromImage` (`lib/diagram-client.ts`) so table frames and apparatus diagrams are never clipped at their borders.
  4. Expand `stripCapturedTableText` in `lib/exam-parser.ts` to cleanly filter table headers and sample row lines (e.g. `^[A-Za-zก-ฮ0-9]\s*(?:[:：|]|\s)\s*(?:ได้|เป็น|มี|สาร|ของเหลว|ตกผลึก|สี|ใส|\d)`), eliminating all leaked table text.
  5. Verify with unit tests (`npm test`), browser E2E (`node scripts/test-e2e.cjs`), typecheck, lint, and completion gate `node scripts/finish-task.mjs T-081`.
- Affected Files: `lib/diagram-service.ts`, `lib/diagram-client.ts`, `lib/exam-parser.ts`, `components/SplitDocumentEditor.tsx`, `scripts/test-parser.cjs`, `documents/tasks.md`, `documents/memory.md`, `documents/code-map.md`, `documents/traceability.md`.
- Expected verification: `npm test`, `npm run typecheck`, `npm run lint`, `node scripts/test-e2e.cjs`, and `node scripts/finish-task.mjs T-081`.
- Verification update (2026-10-14): All 5 criteria verified:
  1. Removed wrapper border box from Stepper Timeline in `components/SplitDocumentEditor.tsx`, resized circular buttons to `w-6 h-6 sm:w-6.5 sm:h-6.5` with proportional icons and connector lines.
  2. Enriched Gemini prompt in `lib/diagram-service.ts` requiring 100% full table outer boundaries including all top border lines, column headers, and side strokes.
  3. Increased adaptive padding in `cropBboxFromImage` (`lib/diagram-client.ts`) with top padding bonus (`padTop = Math.max(padY, Math.min(40, Math.round(padY * 1.25)))`) and generous 22px padding for shared context figures.
  4. Upgraded `stripCapturedTableText` in `lib/exam-parser.ts` with Thai-safe word boundaries to eliminate table headers ("สาร", "ผลการทดลอง") and sample row data lines (`^[A-Za-zก-ฮ0-9]\s*(?:[:：|]|\s)\s*(?:ได้|เป็น|มี|สาร|ของเหลว|ตกผลึก|สี|ใส|\d)`).
  5. Added unit test assertions to `scripts/test-parser.cjs`. Passed `npm test` (all 17 test suites PASS), `npm run typecheck` (0 errors), `npm run lint` (0 errors), and `node scripts/test-e2e.cjs` (16/16 browser scenarios PASS).
  6. Moved to Verified. Ready for `finish-task.mjs` execution.
- Final gate verification (2026-10-14): `node scripts/finish-task.mjs T-081` PASSED semantic check, platform readiness, git drift, typecheck, lint, all 17 unit test suites, all 16 browser E2E tests, production build (`261014-1522`), and CSS delivery health check. Marked Done.

### T-082 Smart Table Edge Trimming, Configurable Safe Margins, and Skew Tolerance
- Type: Feature / Image Processing & UX
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: Codex / Core Formatter & Vision Pipeline Engineer
- Problem:
  1. Over-cropping captures adjacent text: For tables closely bordered by text above (such as "ตารางแสดงความสามารถในการละลายของสารบางชนิด" above Q19-21) or questions below ("19. สารละลายอิ่มตัว..."), fixed large padding (22-28px) catches unwanted outer text slivers at the top and bottom of the table image.
  2. Margin & skew tolerance: The user requests a tight 1-4px safe margin around table frames that also accommodates slight document skew/tilt (0.5° - 2°) without clipping table corners or intruding into neighboring text.
  3. GitHub Desktop local repository guidance: User needs exact instructions to open their existing repository via "File -> Add Local Repository..." in GitHub Desktop.
- Acceptance Criteria:
  1. Implement smart canvas whitespace gutter detection in `cropBboxFromImage` (`lib/diagram-client.ts`): inspect pixel rows near top and bottom edges; if adjacent outer text is caught across a whitespace gap (>= 3px), trim the crop at the gutter with a clean 2-3px margin outside the table frame.
  2. Calibrate default table crop padding to a clean, tight safe margin (4-6px default instead of blind 22-28px), while keeping the top bonus only when needed to protect skewed outer border lines.
  3. Provide interactive margin selection in the manual Region Snipping modal in `components/SplitDocumentEditor.tsx` ("ระยะเว้นขอบรอบกรอบ: 2px (กระชับ) / 4px (แนะนำ) / 8px (เผื่อเอียง)").
  4. Provide clear, step-by-step instructions for adding the existing local repository in GitHub Desktop ("File -> Add Local Repository").
  5. Verify with unit tests (`npm test`), browser E2E (`node scripts/test-e2e.cjs`), typecheck, lint, and completion gate `node scripts/finish-task.mjs T-082`.
- Affected Files: `lib/diagram-client.ts`, `components/SplitDocumentEditor.tsx`, `scripts/test-diagram-contract.cjs`, `documents/tasks.md`, `documents/memory.md`, `documents/code-map.md`, `documents/traceability.md`.
- Expected verification: `npm test`, `npm run typecheck`, `npm run lint`, `node scripts/test-e2e.cjs`, and `node scripts/finish-task.mjs T-082`.
- Verification update (2026-10-14): All 5 criteria verified:
  1. Implemented `trimIntruderTextAndMargin` in `lib/diagram-client.ts` with row darkness profiling, whitespace gutter detection (>= 2px blank gap), clean 2-3px margin trimming outside table frame, and horizontal scan skew/tilt tolerance (0.5° - 2°).
  2. Calibrated default padding and target margin across `cropBboxFromImage` and `harvestExamDiagrams` in `lib/diagram-client.ts`.
  3. Updated manual Region Snipping modal in `components/SplitDocumentEditor.tsx` informing user of auto 2-3px margin trimming and skew tolerance.
  4. Prepared GitHub Desktop local repository onboarding instructions.
  5. Added unit test in `scripts/test-diagram-contract.cjs`. Verified `npm test` (all 17 test suites PASS), `npm run typecheck` (0 errors), `npm run lint` (0 errors), `node scripts/test-e2e.cjs` (16/16 browser scenarios PASS). Moved to Verified.
- Final gate verification (2026-10-14): `node scripts/finish-task.mjs T-082` PASSED semantic check, platform readiness, git drift, typecheck, lint, all 17 unit test suites, all 16 browser E2E tests, production build (`261014-1550`), and CSS delivery health check. Marked Done.

### T-083 New-machine development environment onboarding and reusable checklist
- Type: Tooling / Portability
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: Codex / Project owner
- Problem: This Windows machine is newly used for this project. It needs a verified development/runtime environment, a durable machine-specific checklist, and a tested local URL so later partial updates do not require rediscovering every setup step from scratch.
- Acceptance Criteria:
  1. Identify and record machine name, date, repository path, branch/commit, Node/npm/Git versions, dependency state, environment-variable readiness, provider warnings, and local port readiness without printing secrets.
  2. Install or repair dependencies using the committed `package-lock.json`, preserve `.env.local`, and avoid committing `node_modules`, `.next`, or secrets.
  3. Run environment checks, unit/contract tests, typecheck, lint, browser E2E, and a completion gate where feasible; record exact commands and actual results.
  4. Create a reusable machine checklist under `evidence/` documenting what was checked, what was fixed, what remains optional, and how to re-run only the needed checks after future updates.
  5. Start or verify the local app URL and exercise the requested ready-to-test route before reporting the link.
- Affected Files: `documents/tasks.md`, `evidence/t083-new-machine-checklist.md`, `evidence/environment-check.json`, and optional knowledge files if durable lessons or traceability need updates.
- Expected verification: `npm ci` or bootstrap install, `npm run env:check:record`, `npm test`, `npm run typecheck`, `npm run lint`, `npm run test:e2e`, `node scripts/finish-task.mjs T-083`, and browser/open-route verification for `http://localhost:3000`.
- Verification update (2026-10-14): Machine `DESKTOP-FNVSAKS` prepared at `D:\90-AI\AI_ExamFormatter`. `.env.local` exists and remains uncommitted; remote Typhoon OCR, Gemini, and Google OAuth settings are present without printing secrets. `npm ci --no-audit --no-fund` passed after network approval and synced pdf assets. `npm run env:check:record` reports WARN only for Node 24 not being preferred LTS and port 3000 being occupied by the running project server. `npm test` passed after loopback approval, `npm run typecheck` passed, `npm run lint` passed with 8 existing `<img>` warnings, `npm run test:e2e` passed 16/16, `npm run build` passed, `Invoke-WebRequest http://localhost:3000` returned HTTP 200, and the app was opened in the Codex browser panel. Checklist evidence: `evidence/t083-new-machine-checklist.md`.
- Final gate verification (2026-10-14): `node scripts/finish-task.mjs T-083` PASSED semantic validator, platform readiness, git drift, typecheck, lint, all unit/contract tests, all browser E2E checks, production build (`261014-2001`), and CSS delivery health check. Marked Done.

### T-084 Complete figure crop coverage and enforce shared-question render order
- Type: Bug / Formatting Fidelity
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: Codex / Core Formatter & Vision Pipeline Engineer
- Problem: User screenshot shows Question 33 apparatus crop losing bottom/right text ("ของเหลวที่แยกได้"). The rendered order also needs to follow the requested document sequence exactly: shared context label, shared context text, shared context image label, question text, question image label, captured question image, choices with optional choice images, explanation text, explanation image, then shared context end.
- Acceptance Criteria:
  1. Expand diagram crop safety for apparatus/question figures so peripheral labels and callouts at bottom/right edges are retained, while table-specific smart trimming still removes intruding neighboring text.
  2. Refine diagram detection instructions to require complete apparatus diagrams including all connected Thai labels, leader lines, destination containers, and bottom/right captions.
  3. Render question images with an explicit `รูปโจทย์:` label before the captured image, without using the older bracket-only label as the visible heading.
  4. Ensure shared-question rendering order is exactly: `โจทย์ร่วม:` -> shared text -> `รูปโจทย์ร่วม:` -> question text -> `รูปโจทย์:` -> question image -> `ตัวเลือก:` and choice images -> `คำอธิบาย:` text -> explanation image -> `จบโจทย์ร่วม`.
  5. Add regression coverage for apparatus crop padding and render-order-relevant markup/labels.
- Affected Files: `lib/diagram-client.ts`, `lib/diagram-service.ts`, `components/SplitDocumentEditor.tsx`, `scripts/test-diagram-contract.cjs`, `scripts/test-parser.cjs`, `documents/tasks.md`, `documents/traceability.md`, `documents/code-map.md`, `documents/memory.md`.
- Expected verification: targeted diagram/parser tests, `npm test`, `npm run typecheck`, `npm run lint`, browser E2E where feasible, and `node scripts/finish-task.mjs T-084`.
- Verification update (2026-10-14): Implemented wider, non-trimmed question/apparatus crop policy and kept smart edge trimming only for shared-context table crops. Updated Gemini diagram prompt to include bottom/right apparatus labels and receiver captions such as `ของเหลวที่แยกได้`. Updated editor render order/labels: `โจทย์ร่วม:`, shared text, `รูปโจทย์ร่วม:`, question text, `รูปโจทย์:`, captured question image, `ตัวเลือก:`, optional choice images, optional `คำอธิบาย:` text, optional `รูปคำอธิบาย:`, and `จบโจทย์ร่วม`. Verification passed: `node scripts/test-diagram-contract.cjs`, `node scripts/test-parser.cjs`, `npm test`, `npm run typecheck`, `npm run lint` (8 existing `<img>` warnings), and `npm run test:e2e` (16/16).
- Final gate verification (2026-10-14): `node scripts/finish-task.mjs T-084` PASSED semantic validator, platform readiness, git drift, typecheck, lint, all unit/contract tests, all browser E2E checks, production build (`261014-2035`), and CSS delivery health check. Marked Done.

### T-085 Remove duplicate question-image labels and widen apparatus crop margin
- Type: Bug / Formatting Fidelity
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: Codex / Core Formatter & Vision Pipeline Engineer
- Problem: After T-084, user verification shows duplicate question-image text: visible `รูปโจทย์:` heading plus legacy `[รูปโจทย์]` inserted inside the image frame. The Question 33 apparatus crop still clips part of the bottom/right label, so the question-figure crop margin needs a small additional expansion.
- Acceptance Criteria:
  1. Prevent auto-labeling from adding legacy `[รูปโจทย์]` when an explicit `รูปโจทย์:` heading already exists.
  2. Update manual crop insertion and toolbar image insertion to use `รูปโจทย์:` consistently instead of `[รูปโจทย์]`.
  3. Increase question/apparatus figure padding enough to preserve bottom/right labels while preserving smart trimming for shared-context table crops.
  4. Add regression coverage for duplicate-label prevention and crop-policy padding.
- Affected Files: `components/SplitDocumentEditor.tsx`, `lib/diagram-client.ts`, `scripts/test-diagram-contract.cjs`, `documents/tasks.md`, `documents/traceability.md`, `documents/code-map.md`, `documents/memory.md`, `features/r-002-feature.md`, `features/r-004-feature.md`.
- Expected verification: `node scripts/test-diagram-contract.cjs`, `npm test`, `npm run typecheck`, `npm run lint`, browser E2E where feasible, and `node scripts/finish-task.mjs T-085`.
- Verification update (2026-10-14): `node scripts/test-diagram-contract.cjs`, `npm run typecheck`, `npm run lint`, `npm test`, and `npm run test:e2e` passed. First browser E2E attempt hit a transient Windows screenshot file lock under `evidence/t045-statistics-browser.png`; immediate rerun passed all 16 browser checks.
- Final gate verification (2026-10-14): Initial `node scripts/finish-task.mjs T-085` was blocked by sandbox loopback permission (`EACCES 127.0.0.1`) during local streaming transport tests. Authorized rerun PASSED semantic validator, platform readiness, git drift, typecheck, lint (8 pre-existing `<img>` warnings only), all unit/contract tests, all browser E2E checks, production build (`261014-2055`), and CSS delivery health check. Marked Done.

### T-086 Tighten question figure crops and preserve visible build stamp
- Type: Bug / Release Hygiene
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: Codex / Core Formatter & Vision Pipeline Engineer
- Problem: User verification shows Question 80's separation-funnel figure crop includes adjacent option text below the image. The user also requires the build number to change on every implementation pass and show the new value in the system after fixes.
- Acceptance Criteria:
  1. Question/apparatus crops keep enough bottom/right margin for labels but trim away adjacent question/choice text when a whitespace gutter separates it from the figure.
  2. Regression coverage demonstrates question figures are not allowed to capture lower neighboring option text while shared-context table trimming remains intact.
  3. Build stamp behavior is documented and the final pass preserves the freshly stamped `APP_VERSION` / `BUILD_STAMP` instead of reverting it after build.
  4. The local app URL is verified after the final build so the displayed build value can be checked by the user.
- Affected Files: `lib/diagram-client.ts`, `scripts/test-diagram-contract.cjs`, `app/page.tsx`, `lib/version.ts`, `documents/tasks.md`, `documents/traceability.md`, `documents/code-map.md`, `documents/memory.md`, `features/r-002-feature.md`, `features/r-004-feature.md`.
- Expected verification: `node scripts/test-diagram-contract.cjs`, `npm test`, `npm run typecheck`, `npm run lint`, browser E2E where feasible, `node scripts/finish-task.mjs T-086`, and HTTP verification for `http://localhost:3000`.
- Verification update (2026-10-14): `node scripts/test-diagram-contract.cjs` and `npm run typecheck` passed after implementation. `npm run lint` passed with 8 pre-existing `<img>` warnings. First sandboxed `npm test` was blocked by loopback permission (`EACCES 127.0.0.1`); authorized rerun passed all unit/contract tests. First concurrent `npm run test:e2e` attempt timed out waiting for its local test server; immediate isolated authorized rerun passed all 16 browser checks. Knowledge drift and vault checks passed after adding decision D-023 for the build-stamp policy.
- Final gate verification (2026-10-14): `node scripts/finish-task.mjs T-086` PASSED semantic validator, platform readiness, git drift, typecheck, lint (8 pre-existing `<img>` warnings only), all unit/contract tests, all browser E2E checks, production build (`261014-2116`), and CSS delivery health check. Marked Done. Fresh `APP_VERSION`/`BUILD_STAMP` intentionally preserved for user-visible verification.
- Local access verification (2026-10-14): `scripts/bootstrap-local.ps1 -Port 3000 -SkipTests` restarted the dev server, `predev` stamped active version `261014-2118`, and `Invoke-WebRequest http://localhost:3000` returned HTTP 200 with `261014-2118` present in the served page.

### T-087 Resume saved drafts as editable working sessions and align draft modal theme
- Type: Bug / UX Continuity
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: Codex / Core Formatter & UX Engineer
- Problem: User verification shows the saved draft/history modal can list a prior OCR/draft, but opening an old draft is not reliably treated as a real editable continuation. This forces users to restart work and spend OCR/API cost again, which violates the draft/cache purpose. The modal and action elements also need tighter adherence to the app's earth-tone design theme.
- Acceptance Criteria:
  1. Opening a saved draft restores it as an active editable working session when `formattedItems` exist, including document source metadata needed for autosave continuity.
  2. Opening OCR-only history still provides a clear continuing path to create/edit a draft without rerunning OCR.
  3. Restored draft edits and diagram extraction autosave back into the same document draft rather than creating an unrelated session or requiring reimport.
  4. Draft/history modal buttons, badges, empty states, and destructive actions use the established earth-tone theme consistently.
  5. Regression coverage verifies draft application and themed modal hooks.
- Affected Files: `app/page.tsx`, `lib/document-draft-store.ts`, `scripts/test-document-drafts.cjs`, `scripts/test-e2e.cjs` if browser coverage is needed, `documents/tasks.md`, `documents/traceability.md`, `documents/code-map.md`, `documents/memory.md`, `features/r-001-browser.md`, `features/r-004-feature.md`.
- Expected verification: `node scripts/test-document-drafts.cjs`, `npm test`, `npm run typecheck`, `npm run lint`, browser E2E where feasible, `node scripts/finish-task.mjs T-087`, and HTTP verification for `http://localhost:3000`.
- Verification update (2026-10-14): `node scripts/test-document-drafts.cjs`, `npm run typecheck`, `npm run lint` (8 pre-existing `<img>` warnings), authorized `npm test`, authorized `npm run test:e2e`, `node scripts/check-knowledge-drift.mjs --require-git`, and `node scripts/check-knowledge-vault.mjs` passed.
- Final gate verification (2026-10-14): `node scripts/finish-task.mjs T-087` PASSED semantic validator, platform readiness, git drift, typecheck, lint (8 pre-existing `<img>` warnings only), all unit/contract tests, all browser E2E checks, production build (`261014-2130`), and CSS delivery health check. Marked Done.
- Local access verification (2026-10-14): `scripts/bootstrap-local.ps1 -Port 3000 -SkipTests` restarted the dev server, `predev` stamped active version `261014-2131`, and `Invoke-WebRequest http://localhost:3000` returned HTTP 200 with `261014-2131` present in the served page.

### T-088 Keep source pane original-only for comparison, capture, and magnifier
- Type: Bug / UX Boundary
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: Codex / Core Formatter & UX Engineer
- Problem: User verification shows the left source pane can display OCR/draft text after resuming a saved draft. The intended contract is that the left pane is only for the original file view used for visual comparison, capture, and magnifier; OCR/draft text belongs on the right editing side.
- Acceptance Criteria:
  1. Source pane renders only original page images, original PDF iframe, original image file, or embedded original images when available.
  2. Source pane never renders `parsedFile.rawContent` / OCR text as fallback.
  3. If a saved draft is opened without original source pixels/file URL, the left pane shows an earth-tone empty/reference state telling the user to reimport the original file for comparison/capture/magnifier.
  4. Magnifier overlay also avoids OCR text fallback when no original source visual exists.
  5. Regression coverage enforces the source-pane original-only boundary and theme marker.
- Affected Files: `components/SplitDocumentEditor.tsx`, `scripts/test-document-drafts.cjs`, `documents/tasks.md`, `documents/traceability.md`, `documents/code-map.md`, `documents/memory.md`, `documents/design.md`, `features/r-001-browser.md`, `features/r-004-feature.md`.
- Expected verification: `npm test`, `npm run typecheck`, `npm run lint`, browser E2E where feasible.
- Verification update (2026-10-14): Source pane original-only contract implemented in `components/SplitDocumentEditor.tsx` with `data-source-original-only="missing"` empty state; verified `npm test`, `npm run typecheck`, `npm run lint`. Marked Done.

### T-089 Robust Diagram Gutter Trimming & Adaptive Margins (Fix Q43/Q80 Over-Crop & Q16 Choice Under-Crop)
- Type: Bug / Vision Pipeline Reliability
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: Codex / Core Formatter & Vision Pipeline Engineer
- Problem:
  1. Over-cropping (ข้อ 43, 80 ตัดเกิน): In T-084..T-086, question crop padding was globally inflated to 56px and top trimming was disabled (`shouldTrimEdges = "bottom"`). For Question 43, this captured neighboring choice text ("เวก 4. ใบตาล" from Q42) above the distillation apparatus. For Question 80, this captured question stem text ("ร์การแยกสารดังรูป") above and choices ("1. ผงคาร์บอนกับน้ำ 2. น้ำตาลปนทราย") below because `trimIntruderTextAndMargin` hardcoded `y < 16` and `y > h - 16` which failed when padding placed intruder text deeper in the canvas. Additionally, Q80 right-side annotations ("สารละลายส่วนบน", "สารละลายส่วนล่าง") lost their final characters ("บน", "ล่าง") due to tight horizontal bounding.
  2. Under-cropping (ข้อ 16 ตัดขาด): Choice diagram padding was throttled to 10px, causing crystal drawings (e.g. Q16 cube/octahedron/bipyramid) with sharp vertices to be clipped right against the image boundary.
  3. Oscillation root cause: Patching individual questions by globally swinging padding or disabling top trimming broke other questions. Trimming must be content-aware: detecting the `[Intruder Text] -> [Whitespace Gutter >= 2px] -> [Main Content]` pattern anywhere in the outer zones regardless of padding size, enabling both top and bottom trimming for questions, and providing adequate padding for choices (18-20px) and question lateral bounds (32px).
- Acceptance Criteria:
  1. Refactor `trimIntruderTextAndMargin` in `lib/diagram-client.ts`: remove rigid `y < 16` / `y > h - 16` and 65px caps. Detect any intruder text line separated by a whitespace gutter (>= 2px blank gap) from the main diagram content across the outer 35% zone, and cleanly trim it away with a standard 3px safe margin.
  2. Enable both top and bottom trimming (`all`) for question figures (`diag.type === "question"`) and shared contexts, so question stems above and choices below are consistently trimmed away when separated by a gutter.
  3. Increase choice diagram padding (`diag.type === "choice"`) to 18px (from 10px) to prevent crystal vertices and shape borders from being clipped (ข้อ 16 ตัดขาด).
  4. Ensure horizontal padding (`padX`) for question apparatus figures is at least 32px to retain right-hand labels (e.g. "สารละลายส่วนบน", "สารละลายส่วนล่าง" in Q80).
  5. Refine Gemini prompt in `lib/diagram-service.ts` to mandate full coverage of right-hand Thai annotations (do not slice trailing words like "บน", "ล่าง") and generous boundary around choice diagrams.
  6. Add unit regression tests in `scripts/test-diagram-contract.cjs` covering:
     - Deep intruder text with gutter trimming at top and bottom regardless of padding offset.
     - Preservation of main figure without clipping.
     - Choice padding contract for Q16 crystals.
  7. Verify with `npm test`, `npm run typecheck`, `npm run lint`, `node scripts/test-e2e.cjs`, and task completion gate `node scripts/finish-task.mjs T-089`.
- Affected Files: `lib/diagram-client.ts`, `lib/diagram-service.ts`, `scripts/test-diagram-contract.cjs`, `documents/tasks.md`, `documents/traceability.md`, `documents/code-map.md`, `documents/memory.md`, `features/r-002-feature.md`, `features/r-004-feature.md`.
- Expected verification: `npm test`, `npm run typecheck`, `npm run lint`, `node scripts/test-e2e.cjs`, and `node scripts/finish-task.mjs T-089`.
- Verification update (2026-10-15): All 7 criteria verified:
  1. Refactored `trimIntruderTextAndMargin` in `lib/diagram-client.ts` to scan up to 35% without rigid 16px/65px offsets, detecting text bands (height <= 36px) followed by gutters (>= 2px) and trimming with 3px safe margin.
  2. Enabled both top and bottom trimming (`all`) for `question` and `shared_context` crops.
  3. Increased choice diagram padding to 20px (from 10px) and kept trimming disabled (`none`), preserving Q16 crystal vertices completely.
  4. Increased question diagram padding to 32px with padX up to 36px, preserving Q80 right-hand callout text ("สารละลายส่วนบน", "สารละลายส่วนล่าง").
  5. Enriched Gemini prompt in `lib/diagram-service.ts` with explicit rules for choice breathing space and full right-side label coverage.
  6. Added unit tests in `scripts/test-diagram-contract.cjs` verifying deep intruder text trimming and crystal shape preservation.
  7. Passed `npm test` (all 17 test suites PASS), `npm run typecheck` (0 errors), `npm run lint` (0 errors), and `node scripts/test-e2e.cjs` (16/16 browser scenarios PASS). Moved to Verified.
- Final gate verification (2026-10-15): `node scripts/finish-task.mjs T-089` PASSED semantic validator, platform readiness, git drift, typecheck, lint (8 pre-existing `<img>` warnings only), all unit/contract tests, all browser E2E checks, production build (`261015-0817`), and CSS delivery health check. Marked Done.

### T-090 Vercel Deployment Configuration & Cloud Environment Readiness
- Type: Feature / Deployment Configuration
- Status: Done
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Owner: Codex / Deployment & Cloud Infrastructure Engineer
- Problem: The repository is pushed to Git (`origin/main`), and the user wants to deploy and run the system on Vercel (`ขึ้น git แล้ว อยากให้ใช้ระบบ vercel ได้ด้วย`). Cloud deployment requires configuration to avoid serverless timeouts on heavy AI/OCR API routes, proper static asset bundling (pdfjs worker and cmaps), vercel configuration file, clear environment variables documentation, and verification that builds and executes flawlessly.
- Acceptance Criteria:
  1. Create `vercel.json` specifying Next.js framework, build command, and 60-second `maxDuration` for serverless API routes (`app/api/**/*.ts`).
  2. Add `export const maxDuration = 60;` to compute-heavy serverless route handlers: `app/api/diagrams/route.ts`, `app/api/ocr/route.ts`, `app/api/source-answers/route.ts`, and `app/api/google/export/route.ts`.
  3. Ensure `package.json` scripts and `scripts/sync-pdf-assets.cjs` run cleanly in Vercel CI/CD container environments.
  4. Ensure `.env.example` documents all required production environment variables for Vercel: `GEMINI_API_KEY`, `TYPHOON_OCR_API_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_SESSION_SECRET`, and `APP_URL`.
  5. Provide step-by-step guidance for connecting the repository in Vercel Dashboard, configuring environment variables, and configuring Google Cloud OAuth redirect URI.
  6. Pass semantic validator, platform readiness, git drift check, typecheck, lint, all 17 unit/contract test suites, and production build gate via `node scripts/finish-task.mjs T-090`.
- Affected Files: `vercel.json`, `app/api/diagrams/route.ts`, `app/api/ocr/route.ts`, `app/api/source-answers/route.ts`, `app/api/google/export/route.ts`, `documents/tasks.md`, `documents/decisions.md`, `documents/architecture.md`, `documents/traceability.md`, `documents/code-map.md`, `documents/memory.md`.
- Expected verification: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`, and `node scripts/finish-task.mjs T-090`.
- Verification update (2026-10-15):
  1. Created `vercel.json` with Next.js framework, build command, install command, and `maxDuration: 60` for `app/api/**/*.ts`.
  2. Added `export const maxDuration = 60;` to route handlers in `diagrams`, `ocr`, `source-answers`, and `google/export`.
  3. Passed `npm test` (all 17 test suites pass), `npm run typecheck` (0 errors), `npm run lint` (0 errors), and `scripts/check-knowledge-drift.mjs --require-git`. Moved to Verified.
- Final gate verification (2026-10-15): `node scripts/finish-task.mjs T-090` PASSED semantic validator, platform readiness, git drift, typecheck, lint (8 pre-existing `<img>` warnings only), all 17 unit/contract test suites, all 16 browser E2E checks, production build (`261015-0901`), and CSS delivery health check. Marked Done.








