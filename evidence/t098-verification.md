# T-098 Verification — AI answer fallback

วันที่: 2026-10-15 (Asia/Bangkok)

## Scope

ตรวจว่าปุ่มวิเคราะห์เฉลยอ่านคำตอบจากต้นฉบับก่อน และส่งเฉพาะข้อที่ยังไม่มีเฉลยไปยัง AI solver โดยไม่เขียนทับคำตอบจากต้นฉบับ

## Evidence

- `node scripts/test-source-answers.cjs`: PASS; contract covers valid AI keys, confidence/evidence guards, no-image fallback, and source-answer ownership.
- `node scripts/test-e2e.cjs` (completion gate on `http://127.0.0.1:3000`): PASS, 18 browser checks; mocked empty source-answer response followed by mocked AI answers, visible `เฉลยจาก AI` label, and no browser errors.
- `npm test`: PASS; all parser, OCR, diagram, provider, draft, statistics, import-history, Google, and PDF asset suites passed.
- `npm run typecheck`: PASS. `npm run lint`: PASS with 8 pre-existing `<img>` performance warnings and 0 errors.
- `npm run build`: PASS; route table includes dynamic `/api/ai-answers`.
- `node scripts/check-css.mjs`: PASS, HTTP 200 stylesheet, 46,988 bytes.
- `node scripts/finish-task.mjs T-098`: PASS; semantic validator, platform readiness, knowledge drift, tests, E2E, build, and CSS delivery health all green.
- Real provider smoke: `POST http://127.0.0.1:3000/api/ai-answers` with one Thai science question returned key `ข`, confidence `0.95`, Thai evidence, and model `gemini-flash-lite-latest`.

## Limitations

Provider-backed answer quality still requires a real Gemini request and human review against the source. AI-generated answers are deliberately labeled as suggestions and are not evidence that a source mark existed.
The environment doctor still reports Ollama unavailable at `127.0.0.1:11434`; this blocks OCR ingestion until Ollama is started, but does not block the text-only Gemini answer fallback demonstrated above.
