# T-039 continued reliability audit — 2026-10-11

## Verified defects and fixes
- Non-finite/fractional OCR concurrency could produce zero workers or an unintended count. Configuration now normalizes to an integer 1–2 with a safe default.
- API silently sliced batches to 10 pages. It now rejects batches above 10 before provider invocation.
- Provider finish_reason=length was accepted as success. Partial text is now retained, with failure status and a review warning.
- Reviewed text could bypass missing or truncated source pages. Conversion now requires successful OCR coverage for all pages.
- Provider requests now have per-attempt deadlines: remote 120 seconds, local 300 seconds. Retries can increase total elapsed time.

## Source inspection
Page 4 of the supplied separation PDF visually includes a diagram in question 22 and four equipment figures in question 25. Plain OCR text cannot certify their preservation. Evidence source: evidence/t038-real-4.png. Full PDF acceptance remains open until semantic media ownership and source wording are verified.

## Verification
npm test passed including mocked provider truncation, AbortSignal, invalid concurrency and fractional concurrency checks. Typecheck passed. Lint: zero errors, eight existing image warnings. Browser/build completion results are recorded separately by the gate.

## Remaining scope
T-039/T-040 remain In Progress. This audit verifies reliability guards, not full exam accuracy or Google Docs export fidelity.
