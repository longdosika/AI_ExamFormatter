# T-128 Duplicate Import, Draft Progress, Flat Drive Naming, Header Drive Status (Claude, 2026-10-17)

Owner request (screenshot on 261017-1417): warn on re-imports with confirm / cancel / continue; show the step a draft reached; Drive names "[original filename]" and "[original filename]_[yymmdd-hhmm]" in one folder; catch renamed copies; landing shows 4 drafts; explain the header buttons; move the Drive bar into the header and redesign it.

## Findings before the change
- Draft lookup key = file name + size + hash, so a renamed copy of the same file was not recognised; no prompt before importing.
- `diagramsHarvested` reset to false on saves that did not pass it; exports were not recorded on drafts.
- Drive library: one folder per document with numbered sub-folders; outputs named "<ISO time>_<version>_<title>.docx".

## Changes
- Hash-first lookup (`draftsForSource`), duplicate dialog before any OCR/AI work (continue draft / import anew / cancel, or open from the Drive library when only Drive has it; Drive asked via `/api/google/library?hash=`).
- `draftProgress` + `components/DraftProgress.tsx` on landing, drafts modal and dialog; `markDraftExported`; saves keep reached steps; landing lists 4 drafts.
- `lib/drive-library.ts` flat layout in AI_ExamFormatter with `lib/export-naming.ts` names; legacy collections listed, read and reused for identical bytes; `findByHash`. Browser DOCX download and Google Doc use the same "[original]_[yymmdd-hhmm]" name.
- `GoogleDriveStatus` compact variant rendered in the header (portal) in place of the tagline; document-mode dialog unchanged.
- Older E2E suites answer the dialog through `scripts/e2e-import-helper.cjs`.

## Verification
- Unit: test-document-drafts (renamed copy by hash, kept steps, export mark, storage format), test-drive-library (flat names `source.pdf`, `source_[0-9]{6}-[0-9]{4}.docx`, `source_แบบร่าง_….json`, `source_QuizFlow_…`, no folders, findByHash, legacy collection listed/reused/merged), test-google.
- Browser: test-t128-duplicate-import (header chip, first import without prompt, download name, renamed copy → dialog with progress, cancel/continue/import anew, 4 drafts with steps). Screens: `header.png`, `duplicate-dialog.png`, `landing.png`.
- Full `npm run test:e2e` on dev exit 0; `node scripts/finish-task.mjs T-128` exit 0 (`completion-gate.log`).
- Production 261017-1521 (`.next-production-t128`) on localhost:3000: badge, CSS ok; deployed T-128, T-127, T-125, workspace-controls and library-ui suites exit 0.

## Boundaries
- Drive behaviour verified with the mocked Drive in unit tests and mocked session in the browser; no real Drive export was made in this pass (browser pane not signed in). Owner should export once and look at AI_ExamFormatter.
- Identical content is detected; a re-scan of the same paper (different bytes) is not.
