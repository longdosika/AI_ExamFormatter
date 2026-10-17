# T-125 Capture Geometry Guarantee Verification (Claude, 2026-10-17)

Owner screenshots on 261017-1152 (set 3, fresh conversion in the owner's browser): Q6/Q21 stems list the table rows, Q6's crop includes its stem line "6. จากตาราง…", Q21's table is cut on the right. Owner also asked for written capture rules and a learning record on every fix.

## Diagnosis
- Two fresh-profile live runs on 1152 (`evidence/t121/t125-live1`, `t125-live2`, gemini-flash-lite) were clean, so the owner's browser state differed.
- `app/page.tsx`: when a draft for the same file exists, its OCR text replaced OCR, but its `ocrTextRegions` were not copied (older drafts have none). Harvesting then ran with no stem/choice limits and no geometry-based duplicate removal.
- `scripts/test-t125-cached-ocr.cjs` reproduces it on 1152: with the draft's geometry removed, re-converting gives the exact screenshot symptom (Q6 stem keeps "สารประกอบ สถาน … / A ของแข็ง 90 … / B ของเทค 40 …").

## Fix
- Cached OCR text is reused only together with its geometry (otherwise OCR runs again).
- Harvest reads OCR geometry first when the session has none (also for resumed drafts) and saves it with the draft.
- `documents/capture-rules.md`: capture rules C-01..C-35, image-type catalogue, mandatory fix procedure (fresh profile + profile with a draft) and a learning log; linked from README, release_log, release checklist and 00-index.

## Verification
- `test-t125-cached-ocr.cjs`: fails on 261017-1152, passes on the fix (reconvert and resumed harvest crops equal the fresh crops: Q6 647x130, Q21 570x172; stems without table rows). Images `resumed-q6.png`, `resumed-q21.png`.
- `node scripts/finish-task.mjs T-125` exit 0 on dev 127.0.0.1:3121, 52 PASS (`completion-gate.log`).
- Production 261017-1214 (`.next-production-t125`) on localhost:3000 replacing 261017-1152: badge 261017-1214, CSS ok; deployed test-t125-cached-ocr, test-t124-stale-draft, test-t121-fidelity 25 and 80 exit 0.

## Boundaries
- Re-converting a file whose old draft lacks geometry costs one extra OCR pass.
- Gemini diagram detection is on flash-lite while gemini-3.8-flash quota is exhausted (H-10); crops are bounded by geometry either way.
