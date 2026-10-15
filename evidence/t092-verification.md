# T-092 Verification Evidence

วันที่ตรวจ: 2026-10-15 (Asia/Bangkok)

## Automated

- `node scripts/test-diagram-contract.cjs` — PASS. The contract now imports `detectIntruderCuts` from production code and covers table, deep-band, choice-preservation, and Q80-like top/bottom intruders.
- `npm run typecheck` — PASS.
- `npm run lint -- --quiet` — PASS.
- `npm test` — PASS after the loopback-enabled rerun. All parser, OCR, local vision, diagram, provider-key, draft, statistics, history, case, performance, Google, and PDF asset suites passed.
- `npm run build` — PASS. Intermediate build stamp: `261015-0954`; completion-gate build stamp: `261015-1006`.

## Browser/manual

- Opened `http://localhost:3220/` against the post-change dev server.
- Uploaded `evidence/t092-upload.md` through the real file picker, observed the raw OCR editor, clicked `แปลงเป็นรูปแบบข้อสอบ`, and observed the source-left/editor-right layout.
- The converted editor showed a spaced header/stepper, toolbar above navigation, question buttons, and readable vertical rhythm. The source pane remained a stable original-only placeholder for a text-only fixture.
- `scripts/test-e2e.cjs` rerun against the same server (`E2E_BASE_URL=http://localhost:3220`) passed all 16 browser checks, including 80-question navigation, source-left/editor-right layout, mobile width, and no uncaught browser errors.
- The 80-question source crop itself was not re-run through the provider in this browser pass because the deterministic E2E fixture does not include the source PDF or a real diagram response. This remains an explicit follow-up before universal Q80 crop accuracy is marked PASS.

## Failed/retry evidence

- The first `npm test` attempt was blocked by sandbox loopback `EACCES 127.0.0.1`; the authorized rerun passed.
- An isolated-server E2E attempt timed out while waiting for the OCR review textbox; rerunning against the already-ready dev server passed all 16 checks. The transient attempt is retained here as diagnostic evidence, not counted as a product failure.
