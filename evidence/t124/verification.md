# T-124 Stale Draft Repair Verification (Claude, 2026-10-17)

Owner screenshots on build 261017-1101 (set 3 draft): Q21 stem lists the table rows and the table is cut on the right; Q20 image carries the Q21 stem line; Q8 stem ends with "D สี C สี B สี A สาร ก" and its image carries a choice line. Owner: "การ crop ยังไม่แม่นยำ บางตำแหน่ง เอาข้อความในรูป/ตาราง มาใส่ในโจทย์ ซ้ำซ้อน ตรวจสอบ ลง log + แล้วแก้ไขเองเลย".

## Diagnosis
- Fresh live run of the same PDF on 1101 (`evidence/t121/t124-live1`, gemini-flash-lite because gemini-3.8-flash quota was exhausted): clean stems for Q6/Q8/Q10/Q20/Q21 and correct crops, except a faint choice-line residue under Q8.
- The screenshot state therefore came from a draft saved by an earlier build: `editorHtml` keeps old images and stem text, and opening a draft only ran the text-pattern cleanup (`cleanCapturedTables`), which does not use OCR geometry (I-048, I-049).
- Q8 residue: the bottom limit was the next question stem only; 32 px padding reached the choice "ก." line printed under the figure (I-050). Pixel rows on the real page: border at y≈270/1000, choice text from y≈289, OCR line top 283.4, so a limit at 280.4 is inside the blank gap.

## Changes
- `lib/figure-text-cleanup.ts`: on draft open, remove stem lines / runs of two or more table rows / trailing figure labels that lie inside the figure's stored source box (OCR geometry kept in the draft); single words are never removed.
- `lib/capture-geometry.ts` choiceBelowFigureTop + `lib/diagram-client.ts` (harvest and new recropFigure): a choice line directly under and overlapping the figure bounds the crop; choices beside a figure (Q10/Q20) are ignored.
- Crop version: harvested/rendered figures get `data-crop-version="2"`, manual captures `manual`. Figures without a version but with a source box are listed in the review bar ("รูปจากเวอร์ชันก่อน N รูป") with "ตัดใหม่จากต้นฉบับ", which re-crops from the original page with the current limits, no AI call.

## Verification
- `scripts/test-t124-stale-draft.cjs` (recorded real responses, no provider calls): fresh harvest -> draft altered to the screenshot state (Q8 labels, Q21 rows, Q6 flattened rows, versions removed, Q21 cut to 70%) -> save -> reload -> resume. Stems cleaned on open; review lists 5 old figures; re-crop gives widths within 6% of a fresh crop (Q21 570 px again). Images: `recropped-q6/8/10/20/21.png`, `stale-draft-review.png`.
- `node scripts/finish-task.mjs T-124` exit 0 on dev 127.0.0.1:3121, 52 PASS lines (`completion-gate.log`); first attempts stopped at the B-39 release_log row check and at test-t121-order-dom (module import inlined in the test).
- Production 261017-1152 (`.next-production-t124`) on localhost:3000 replacing 261017-1101 (PID 3004): badge 261017-1152, CSS ok; deployed test-t124-stale-draft, test-t121-fidelity 25 and 80, test-t121-source-marks-ui exit 0.

## Boundaries
- Re-cropping is an explicit action, because old drafts cannot tell harvested figures from manual captures.
- Figures in old drafts without a stored source box cannot be cleaned or re-cropped automatically; use "ตัดใหม่จากต้นฉบับ" on the image.
- Gemini quota for gemini-3.8-flash was exhausted during this pass (H-10).
