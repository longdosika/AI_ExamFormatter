# T-120 Release Log Verification

Date: 2026-10-16, Asia/Bangkok. No code change; main build stays 261016-2058 on localhost:3000.

## Findings traced (owner screenshots on build 261016-2058, file บทที่ 7 ชุดที่ 3)
- Q6 split / fake Q4: `numbered` in lib/exam-parser.ts accepts any "N." line as a new question, even when N goes backwards; OCR read the pen-crossed "ง." as "4." (I-026).
- Q14 "ค. … 4. กลิ่นกุหลาบ…": `mergedChoicePattern` (T-119) only knows the literal next key "ง", not the OCR digit "4" (I-027).
- Q15 "ค. การระเหยและการกลั่น. การระเหยและการตกผลึก": key ง missing entirely; no inference exists (I-028).
- Two-column choices: `data-compact-choices` in components/SplitDocumentEditor.tsx and app/globals.css (T-119 item 12) conflict with the master template; lib/export-layout.ts still exports one choice per paragraph (I-029).
- Q20 crop includes Q20/Q21 stem lines while the edge status says CLEAN: detection bbox is not trimmed against OCR text lines (I-030).
- Q21 and Q6 tables not captured; table cells flattened into the stem: no fallback when table-like text has no figure (I-031, recurrence of T-104).
- Q13 "ก. / น้ำมันดีเซล": pen tick read as text (I-032).

## Output
- release_log.md: latest summary, issue register I-001..I-032 (found build, cause, status, fixed build, recurrence), backlog B-01..B-40 with priority, build history from T-025 to T-119.
- README.md: release_log link placed first; T-119/T-120 latest entries.
- tasks.md: T-120 (this task), T-121 Proposed fix pack.

## Verification
- Relative links in release_log.md and README.md checked to exist on disk (scripted check below in the task log).
- `node scripts/finish-task.mjs T-120`: see tasks.md T-120.
- Links: release_log.md 4/4 exist; README.md 25 relative links exist after converting 8 stale absolute file:///d:/0-Project/... links to relative paths.
- finish-task T-120: exit 0 (37 PASS lines, CSS OK, gate stamp 261016-2127; main server still 261016-2058). Log: evidence/t120-completion-gate.log.
