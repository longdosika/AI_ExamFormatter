const fs = require('fs');
function edit(file, fn) {
  let s = fs.readFileSync(file, 'utf8'); const crlf = s.includes('\r\n'); s = s.replace(/\r\n/g, '\n');
  const next = fn(s); if (next === s) throw new Error('no change ' + file);
  for (let i = 0; i < 5; i++) { try { fs.writeFileSync(file, crlf ? next.replace(/\n/g, '\r\n') : next); return; } catch { require('child_process').execSync('sleep 2'); } }
  throw new Error('write failed ' + file);
}
const must = (s, a) => { if (!s.includes(a)) throw new Error('missing ' + a.slice(0, 60)); return a; };
edit('release_log.md', s => {
  s = s.replace(must(s, '## ประวัติ build (ใหม่สุดอยู่บน)\n\n| Build | งาน | สิ่งที่เปลี่ยน | สถานะ |\n|---|---|---|---|\n'), m => m + '| **T128_BUILD** | T-128 | เตือนไฟล์ที่เคยนำเข้า (ตรวจจากเนื้อไฟล์ เปลี่ยนชื่อก็จับได้) เลือก ทำต่อ/นำเข้าใหม่/ยกเลิก, แบบร่างแสดงขั้นที่ทำถึง, หน้าแรกแสดง 4 แบบร่าง, ไฟล์บน Drive อยู่โฟลเดอร์เดียวชื่อ [ต้นฉบับ] และ [ต้นฉบับ]_[yymmdd-hhmm], สถานะ Drive ย้ายขึ้นหัวแอป | Verified -> Done เมื่อ gate และ deploy ผ่าน |\n');
  const first = s.match(/\n(\| I-0\d+ \|)/)[1];
  s = s.replace(first, () => '| I-055 | นำเข้าไฟล์ที่เคยนำเข้าแล้วโดยไม่รู้ตัว (โดยเฉพาะเมื่อเปลี่ยนชื่อไฟล์) และไม่รู้ว่าแบบร่างทำถึงขั้นไหน | 261017-1417 (คำขอเจ้าของ) | การค้นแบบร่างใช้ชื่อไฟล์+ขนาด+hash รวมกัน ไฟล์ที่เปลี่ยนชื่อจึงหาไม่เจอ และไม่มีการถามก่อนนำเข้า; แบบร่างไม่เก็บว่าส่งออกแล้ว และค่า "สกัดรูปแล้ว" หายเมื่อบันทึกโดยไม่ส่งค่ามา | แก้แล้ว: ค้นด้วย SHA-256 ก่อน ถามก่อนเริ่ม OCR (ทำต่อ/นำเข้าใหม่/ยกเลิก หรือเปิดจากคลัง Drive), บันทึกเวลาส่งออก, เก็บขั้นที่ทำแล้ว | T128_BUILD | ไม่ |\n' + first);
  return s;
});
edit('documents/tasks.md', s => {
  const i = s.indexOf('### T-128'), j = s.indexOf('### T-127');
  let seg = s.slice(i, j);
  seg = seg.replace('- Expected Verification:', '- Header buttons (owner question 2, 2026-10-17): คลังไฟล์ = Drive originals/exports/draft backups across devices; แบบร่าง = drafts in this browser; ประวัติไฟล์ = list of import names/times (now largely covered by drafts with progress); สถิติ / ดาวน์โหลดสถิติ = conversion run statistics for diagnosis; บันทึกปัญหา = case log; แม่แบบ = opens the master template. Proposed merge (owner decision): แบบร่าง+ประวัติไฟล์ into one list, and สถิติ/ดาวน์โหลดสถิติ/บันทึกปัญหา into one tools menu.\n- Expected Verification:');
  return s.slice(0, i) + seg + s.slice(j);
});
edit('documents/decisions.md', s => s.replace(must(s, '# Decisions\n'), m => m + `
### D-075 Flat Drive Folder and Hash-First Duplicate Check (T-128, 2026-10-17)
- Decision: new Drive files go directly into the AI_ExamFormatter folder: the original keeps its name, each export is "[original]_[yymmdd-hhmm]" (DOCX and Google Doc), draft backups "[original]_แบบร่าง_[stamp].json", confirmed QuizFlow imports "[original]_QuizFlow_[stamp]". Files of one document are tied by the SHA-256 property, not by folders; pre-T-128 per-document folders stay readable, are listed, and are reused for the same bytes (never moved or deleted). Importing a file whose bytes match a local draft or a Drive original asks before any OCR/AI work: continue the draft, import anew, cancel (or open from the Drive library).
- Why: owner request — one place sorted by name is easier to browse, and renamed copies must not slip through.
- Tradeoff: one folder grows long; names keep each document's files adjacent when sorted by name. Legacy documents get their new exports in the flat folder, so one document can have files in both places (the library view merges them).
`));
edit('documents/memory.md', s => s.replace(must(s, '# Memory\n'), m => m + `
### T-128 Imports and Drive Layout (2026-10-17)
Draft lookup must use the file's SHA-256 first (draftsForSource); the old docKey mixes in the file name. saveDocumentDraft keeps diagramsHarvested/exportedAt when a save omits them. Drive writes are flat in TARGET_FOLDER with names from lib/export-naming.ts; legacy collection folders are still read. Landing shows 4 drafts. Tests: scripts/test-t128-duplicate-import.cjs, test-drive-library.cjs (flat + legacy), test-document-drafts.cjs.
`));
edit('documents/code-map.md', s => s.replace(must(s, '### T-127 Answer Star Integrity\n'), m => '### T-128 Imports and Drive Layout\n- `lib/document-draft-store.ts` draftsForSource, markDraftExported, draftProgress; `components/DraftProgress.tsx`; `app/page.tsx` duplicate dialog in handleFileParsed, four landing drafts, export marks, header Drive slot (portal); `components/GoogleDriveStatus.tsx` compact variant; `lib/drive-library.ts` flat layout + findByHash + legacy reads; `lib/export-naming.ts`; `app/api/google/library/route.ts` ?hash=; `lib/google-export.ts` Google Doc name. Test `scripts/test-t128-duplicate-import.cjs`.\n\n' + m));
edit('documents/traceability.md', s => s.replace(must(s, '### T-127 Answer Star Integrity\n'), m => '### T-128 Imports and Drive Layout\nFeature on R-001 import and R-003 Google Drive -> Task T-128 -> Feature Notes r-001-browser, r-003-google-doc-dirve, r-006-document-library -> app/page.tsx, lib/document-draft-store.ts, lib/drive-library.ts, lib/export-naming.ts, components/DraftProgress.tsx, components/GoogleDriveStatus.tsx -> scripts/test-t128-duplicate-import.cjs, test-drive-library.cjs, test-document-drafts.cjs -> evidence/t128/.\n\n' + m));
edit('features/r-001-browser.md', s => s + '- T-128 (2026-10-17): importing a file seen before (same SHA-256, any name) asks: continue the draft / import anew / cancel; drafts show their progress; the landing page lists 4 drafts; the Drive connection sits in the header. Regression scripts/test-t128-duplicate-import.cjs.\n');
edit('features/r-006-document-library.md', s => s + '\n- T-128 (2026-10-17): new files are stored flat in AI_ExamFormatter: "[original]", "[original]_[yymmdd-hhmm]" (DOCX + Google Doc), "[original]_แบบร่าง_[stamp].json", "[original]_QuizFlow_[stamp]", tied by SHA-256; older per-document folders remain readable and are reused for identical bytes.\n');
console.log('docs ok');
