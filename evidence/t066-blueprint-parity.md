# T-066 QuizFlow Blueprint Parity Review

วันที่ตรวจ: 2026-10-13 (Asia/Bangkok)

เอกสารต้นทางคือ Blueprint ที่ผู้ใช้ส่งเข้ามาในแชต การตรวจนี้เทียบกับไฟล์ที่มีอยู่จริงใน `AI_ExamFormatter` เท่านั้น ไม่ถือว่ารายการ path ของ QuizFlow ใน Blueprint เป็นหลักฐานว่ามีไฟล์อยู่ใน repo นี้

## หลักฐานที่พบใน repo

- Parser หลัก: `lib/exam-parser.ts`
- OCR cleanup/provider boundary: `lib/ocr-service.ts`, `lib/ocr-client.ts`
- OCR/parser regression contracts: `scripts/test-ocr-contract.cjs`, `scripts/test-parser.cjs`
- Existing reviewed source/evidence: `evidence/261011-reviewed-separation.*`, `evidence/t041-*`, `evidence/t052-verification.md`
- QuizFlow source paths listed in the Blueprint (`skills/gdoc-exam-formatter/*`, `tmp/build_*.py`, `src/app/admin/import/page.tsx`, `outputs/gdoc-exam-formatter/*`) are not present as an equivalent golden corpus in this repository. The supplied external skill is advisory and cannot certify parity.

## Same rules (already evidenced or now covered)

| Blueprint rule | Current implementation/evidence |
|---|---|
| Parse numbered questions and guard numbered explanation steps | `lib/exam-parser.ts`; parser regression covers nested enumerations |
| Thai/Latin/numeric choice labels and inline source markers | parser and validation regressions |
| Explanation answer takes precedence; conflicting explicit keys remain unresolved | `reconcileAnswerKey`; T-052 regression |
| Preserve unknown replacement character instead of guessing | `normalizeThaiOcrText`; T-066 OCR contract regression |
| OCR is separated from later formatting/review | `lib/ocr-service.ts`, `app/page.tsx`, T-049/T-055 records |
| Question-owned image caption `[รูปโจทย์]` | T-056 browser/export evidence |

## Different or partial rules

| Blueprint rule | Current state | Decision |
|---|---|---|
| Thai diacritic/front-vowel spacing and static repairs | Previously split between OCR and parser; T-066 centralizes conservative repairs before parsing | Implemented only mappings proven by Blueprint examples; unresolved corruption remains visible |
| Answer labels include `คำตอบ` and `Answer` | Existing parser only covered `ตอบ`/`เฉลย` | T-066 adds both labels and regression coverage |
| Choice matrix becomes structured text | Current HTML/table flattening exists, but no proof of every QuizFlow matrix fixture | Keep existing behavior; add real fixture before claiming full parity |
| Media ownership/manifest/link registry | Current editor tracks embedded images and source pages, but no QuizFlow-compatible manifest schema or native Google Doc link registry | Do not invent a schema in this task; follow-up requires real output contract |
| 24 MB transport / 64 MB decoded payload and 60 s import route | Current app has a 50 MB file limit and OCR request-size/page batching; these are different boundaries | Keep local limits; port only with an explicit product decision |
| DOCX/Google Doc artifact pipeline | Current product exports browser/editor artifacts and has Drive OAuth/export paths; no imported QuizFlow Python builder | No code port without a permitted artifact fixture and readback evidence |

## Missing or unknown

- No permitted QuizFlow golden files, manifests, DOCX readbacks, or native Google Doc links are present in this repo.
- Formal `shared_context` range ownership and crop edge-sweep rules are not represented by a portable TypeScript contract here.
- Thai numeral normalization, equation normalization, exact page-count contract, and QuizFlow staging schema are unknown from current evidence.
- The Blueprint's expected 100-question / 37-media and science-set counts cannot be used as acceptance criteria until the corresponding inputs are supplied.

## Synthetic regression fixture provenance

The new T-066 cases in `evidence/t066-synthetic-fixtures.json`, `scripts/test-parser.cjs`, and `scripts/test-ocr-contract.cjs` are synthetic strings derived from the Blueprint's explicit examples (`เป ็ น`, `ป ี`, `ครึ่ ง`, `น้้า`, `เอท เนอล`, `คำตอบ`, `Answer`) plus existing parser contracts. A replacement-character case is intentionally preserved, not guessed. They are not QuizFlow golden fixtures and are labeled as such in the task/evidence.

## Porting boundary

Only deterministic, source-preserving rules were ported. Hard-coded paths, template IDs, crop coordinates, hidden reasoning, auto-solving, and unverified external output schemas were intentionally excluded.
