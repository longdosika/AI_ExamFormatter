# Weekly Audit — AI Exam Formatter

รอบตรวจบังคับ: ทุกวันจันทร์ เวลา 09:00 น. (Asia/Bangkok)

ไฟล์นี้เป็น checklist กลางสำหรับมนุษย์และ AI ทุกตัวที่เข้ามาอ่านหรือแก้โปรเจกต์ ห้ามสรุปว่า “ผ่าน” จาก README หรือเอกสารเดิมเพียงอย่างเดียว ต้องรันคำสั่ง ตรวจหลักฐานจริง และเพิ่มบันทึกรอบใหม่ต่อท้ายไฟล์นี้ทุกครั้ง

## กติกาการตรวจ

1. ตรวจ `AGENTS.md`, `README.md`, `documents/tasks.md` และรายการนี้ก่อนเริ่มงานทุกครั้ง
2. ทุกงาน Feature/Bug/Refactor/Security ต้องมี Task ID ก่อนแก้โค้ด สถานะต้องเป็น `In Progress` และมี owner, acceptance criteria, affected files, verification
3. งานต้องถูกแบ่งตามหน้าที่: product/requirements, parser/import, UI/UX/accessibility, integration/auth, performance, QA/release, knowledge governance ต้องระบุผู้รับผิดชอบและผู้ตรวจแยกกันเมื่อทำได้
4. ห้ามอ้างผลจาก agent อื่นโดยไม่มีไฟล์/คำสั่ง/ผลตรวจที่ตรวจซ้ำได้
5. ทุก behavior claim ต้องมี automated test หรือ browser/runtime evidence; build และ knowledge validator ไม่ใช่ UAT
6. ทุกการเปลี่ยนโค้ดต้องอัปเดต tasks, feature note, traceability, code-map และเอกสารด้าน architecture/decisions/memory ที่ได้รับผลกระทบ
7. ห้าม commit secret, token, `.env.local`, refresh token หรือข้อมูลส่วนตัว
8. งานที่ยังมี blocker ต้องเป็น `Ready`, `In Progress` หรือ `Verified` ตามจริง ห้ามเลื่อนเป็น `Done` เพื่อให้ dashboard ดูเรียบร้อย

## Checklist ทุกวันจันทร์

| # | ตรวจอะไร | หลักฐาน/คำสั่ง | Owner | ผล |
|---|---|---|---|---|
| 1 | Task intake/การแจกงานถูกคนถูกงาน และไม่มี task ที่โค้ดเปลี่ยนแต่ไม่ลงทะเบียน | `documents/tasks.md`, `documents/traceability.md`, `git status`, `scripts/check-knowledge-drift.mjs --require-git` | Governance lead | PENDING รอบถัดไป |
| 2 | Clone/git pull portability และไม่มี dependency หรือ path เฉพาะเครื่อง | `npm ci`, `npm run typecheck`, `npm run build`, `.env.example`, `documents/architecture.md` | Release/QA | PENDING รอบถัดไป |
| 3 | Knowledge Vault ไม่หลุดจากโค้ด | `node scripts/check-knowledge-vault.mjs`, `node scripts/check-knowledge-drift.mjs --require-git` | Governance lead | PENDING รอบถัดไป |
| 4 | Parser source fidelity: ไม่สร้างข้อสอบ/เฉลยปลอม, section reset, choices, DOCX/PDF/image errors | `npm test`, `scripts/test-parser.cjs` | Parser owner | PENDING รอบถัดไป |
| 5 | Performance/resource safety: cancel งานเก่า, revoke object URL, PDF pixel budget, worker/canvas cleanup, benchmark | `scripts/test-performance.cjs`, `npm run benchmark`, `evidence/performance-baseline.json` | Performance owner | PENDING รอบถัดไป |
| 6 | UI/UX/accessibility: mobile width, keyboard focus, labels, loading/error/empty state, edit/crop/reset behavior | `npm run test:e2e`, `evidence/qa-iteration-2/`, `evidence/ui-review.md` | UI/UX + QA | PENDING รอบถัดไป |
| 7 | Google OAuth/Drive: secure state/PKCE, scope least privilege, folder ID, export/readback; no false success | `.env.example`, `/api/google/*`, mocked integration tests, real Drive evidence | Integration owner | BLOCKED until OAuth credentials and live UAT |
| 8 | Security/dependency hygiene: no secrets, npm audit triage, CSRF/origin, token cookie, upload limits | `rg` secret patterns, `npm audit`, route tests | Security/QA | PENDING รอบถัดไป |
| 9 | Release gate and evidence handoff | `node scripts/finish-task.mjs <TASK_ID>`, evidence artifact, `documents/audit-log.md` | Release/QA | PENDING รอบถัดไป |
| 10 | Learning loop: every new case/defect becomes a feature note, decision, test fixture and memory entry | `documents/decisions.md`, `documents/memory.md`, `features/`, `scripts/` | Knowledge owner | PENDING รอบถัดไป |

## Mandatory handoff report format

ทุกงานที่จบหรือส่งต่อ ต้องรายงานตามลำดับนี้:

1. ปัญหาที่พบและตรวจสอบเจอ
2. งานที่ทำไป ที่มีการบันทึกและบทเรียนที่ถูกบันทึกจริง
3. งานที่กำลังจะทำ
4. สิ่งที่จะให้ผู้ใช้ทำ
5. ลิงก์ และข้อมูลการเข้าถึงเพื่อทดสอบ

ห้ามออกลิงก์ preview จนกว่า local runtime, real-PDF import, OCR, E2E และ finish gate ผ่านจริง

## Portability contract

เครื่องใหม่ต้องเริ่มจาก `npm ci` และ `.env.example` เท่านั้น ห้ามพึ่ง `node_modules`, cache, browser profile, absolute path, local token หรือไฟล์ที่ไม่อยู่ใน Git การตรวจ portability ต้องทำใน checkout ใหม่หรือ environment ที่ล้าง cache และบันทึกคำสั่ง/ผลไว้ใต้ `evidence/` หากทำไม่ได้ให้สถานะเป็น BLOCKED

## Evidence rules

รอบตรวจแต่ละสัปดาห์ต้องเพิ่มหัวข้อรูปแบบนี้ต่อท้ายไฟล์:

```md
## Audit run — YYYY-MM-DD HH:mm (+07:00)
- Auditor / agents:
- Changed since previous run:
- PASS:
- FAIL:
- BLOCKED:
- New tasks / owners:
- Commands and evidence:
- Risks and next Monday:
```

## Audit run — 2026-10-11  (baseline before first Monday cycle)

- Auditor / agents: primary Codex; prior parser, workspace and QA work recorded in project evidence
- Changed since previous run: weekly governance rule and Monday automation added; OAuth/export and performance/UI work are still active
- PASS: folder metadata for `1bZeNZ7De9pxsoQH-Zo9ni3A3Rd6XmnuG` was previously verified; parser/case regression and prior completion gate evidence exist
- FAIL: no complete live import → edit → Google Doc readback; browser UAT and cross-device case sync are not proven
- BLOCKED: live Google export requires OAuth client configuration; OCR/AI provider is not selected; fresh-clone portability needs a clean checkout run
- New tasks / owners: T-025 governance/weekly audit (primary); T-021 UI/UX; T-022 performance; T-023 QA; T-024 integration
- Commands and evidence: `evidence/project-audit.md`, `evidence/completion-gate.txt`, `evidence/performance-baseline.json`, `evidence/ui-review.md`
- Risks and next Monday: verify current worktree tests/build, run browser QA, audit dependencies, and close/reopen tasks only from evidence

## Audit run — 2026-10-11 09:30 (+07:00)

- Auditor / agents: primary Codex; parser/performance, UI/UX and QA workstreams
- Changed since previous run: added T-021 UI/UX, T-022 performance/resource controls, T-023 quality checks, T-024 OAuth/Drive export foundation; added Google APIs and scheduled audit rule
- PASS: `npm test` passed knowledge, parser, case, resource and Google auth/export unit tests; `npm run typecheck` passed; knowledge validator passed; performance resource assertions passed
- PASS: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, `npm run test:quality` and `npm run test:e2e` now run; E2E passed desktop/mobile, edit/reset, case reload, keyboard and no uncaught browser errors. Build has image optimization warnings only.
- FAIL: no live OAuth/Google Doc readback; clean clone portability and Monday automation run remain unverified in this cycle
- BLOCKED: live export until owner configures OAuth Client ID/secret/session secret/Picker key/project number in `.env.local`; OCR provider remains unselected; clean clone portability and Monday cron run need fresh environment evidence
- New tasks / owners: T-026 Weekly Audit governance (primary); T-021 UI/UX (UI); T-022 performance (parser/performance); T-023 quality (QA); T-024 integration (primary)
- Commands and evidence: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`, `npm run test:quality`, `npm run test:e2e`, `node scripts/benchmark-parser.cjs`, `evidence/performance-baseline.json`, `evidence/qa-iteration-2/`, `evidence/ui-review.md`, `scripts/test-google.cjs`
- Risks and next Monday: run `npm ci` in a clean checkout, rerun E2E with one isolated port, resolve lint dependency behavior, verify OAuth callback/folder readback, and record memory/LCP measurements

## Audit run — 2026-10-11 14:30 (+07:00)

- Auditor / agents: primary Codex; conversion contract, UI/UX provenance, QA/performance ownership recorded in T-031.
- Changed since previous run: verified the supplied four-page scanned PDF has no text layer; added page-aware OCR markers, quality metadata, stem-item parsing, source-page badges, offline font/build portability, fixture regression, and T-031 evidence.
- PASS: `npm test`, `npm run typecheck`, `npm run lint` (0 errors), `node scripts/test-quality.cjs`, and `node scripts/test-performance.cjs`; structured fixture proves questions `[1,3]`, six stem items, four choices, and page provenance.
- FAIL: browser E2E server did not become ready in this worktree; no live Typhoon key is configured, so real OCR cannot be exercised here.
- BLOCKED: `node scripts/finish-task.mjs T-031` remains blocked by the local Next dev server/EPERM cache state and missing OCR provider key; T-031 stays `In Progress`.
- New tasks / owners: T-031 conversion contract (OCR/parser); UI/UX source mapping; QA/release rerun E2E and finish gate in a clean clone with an OCR key.
- Commands and evidence: `evidence/t031-separation-pdf-ground-truth.md`, `scripts/test-parser.cjs`, `evidence/performance-baseline.json`, `evidence/qa-iteration-2/`.
- Risks and next Monday: run `npm ci` in a clean checkout, run E2E on an isolated port, provide `TYPHOON_OCR_API_KEY`, import the supplied PDF, and compare every right-pane item/page against the rendered source.

## Audit run — 2026-10-11 16:00 (+07:00)

- Auditor / agents: primary Codex; historical release audit T-032.
- Changed since previous run: registered T-001 through T-031 for evidence re-check; corrected scanned-PDF behavior so empty OCR cannot display fabricated question slots; added historical register under `evidence/t032/`.
- PASS: parser/OCR contract, `npm test`, typecheck, lint (0 errors), performance, and knowledge validation.
- FAIL: real UI import still cannot produce source text without an OCR provider key; local Next runtime is not serving because the worktree has stale process/cache port conflicts and Next dependency verification is incomplete.
- BLOCKED: T-032 remains `In Progress`; no public/access link is issued until a reachable runtime and real-PDF OCR result are verified.
- Next action: clean clone, `npm ci --offline`/network-enabled install, isolated port, `TYPHOON_OCR_API_KEY`, browser import, then finish gate.

## 2026-10-11 — T-036 follow-up
- [x] Reproduced Windows async realpath EPERM and recorded evidence in task T-036.
- [x] Added narrowly scoped Next runtime fallback and verified dev readiness, tests, typecheck, and lint.
- [ ] Verify production build output creation after releasing file locks/antivirus handles; do not close T-036 until build and finish gate pass.

- [ ] Completion gate currently blocked by platform-readiness Electron expectations on this Next web app; register a follow-up governance task before release closure.

## 2026-10-11 — T-038 initial audit
- [x] Registered browser-to-OCR audit before code changes.
- [x] Verified key presence without revealing secret.
- [x] Synthetic Typhoon request returned HTTP 200.
- [ ] Real supplied PDF OCR transmission and browser flow require explicit user approval and remain pending.

- [x] T-038 provider smoke with approved real PDF page returned HTTP 200 and produced five parsed ordered questions after normalization.
- [x] Added regression test for escaped Markdown OCR handoff.
- [ ] Full four-page browser UAT and finish gate remain pending.

- [x] Four-page approved Typhoon run completed with HTTP 200 evidence.
- [x] Build/knowledge/quality checks rerun after OCR normalization.
- [ ] Browser localhost UAT and full source-fidelity review remain pending; do not mark T-038 Done.

## 2026-10-11 — T-039 staged OCR pipeline
- [x] OCR provider configuration is separated from parser code.
- [x] Page concurrency is bounded and transient retries are explicit.
- [x] Architecture/design/decision/memory/audit records updated.
- [ ] Browser UAT and local Ollama/LM Studio benchmark remain pending.

## 2026-10-11 — Local OCR setup
- [x] Ollama service and Typhoon OCR local model installed.
- [x] Local OpenAI-compatible endpoint synthetic smoke passed.
- [ ] CPU real-page benchmark and browser UAT remain pending; keep remote API as safer default for production until measured.

- [x] User verified bootstrap LOCAL_READY and local model inventory.
- [ ] Local real-PDF request remains CPU-bound/pending; remote fallback or GPU benchmark required before local default.

## T-040 weekly audit entry — 2026-10-11
- [x] Provider switch was followed by a clean Next restart.
- [x] Port owner was inspected before stopping a process.
- [x] Browser imported the supplied four-page PDF on `http://127.0.0.1:3001/`.
- [x] `/api/ocr` returned HTTP 200 without exposing the API key.
- [ ] OCR output still fails structural question/choice validation; keep T-040 In Progress and do not publish a completion claim.
- [ ] Re-run after parser/OCR reconstruction fixes and attach successful evidence before moving to Verified.

## T-040 audit update — intermediate OCR stage
- [x] Right pane now exposes raw OCR text when structured conversion is rejected.
- [x] Fail-closed export behavior remains active.
- [ ] Structured parser still needs reconstruction for OCR inline choices/tables before task can move to Verified.

- [ ] Verify editable OCR/re-conversion, missing and duplicate labels, measurement table context, stale import results, and export disabled while review is incomplete (T-039/T-040).

- [ ] Reimport each visually reviewed corpus fixture: SHA-256 exact match, reviewer provenance, unchanged question/choice counts, original media ownership and original start-page mapping. Changed files must never reuse an unrelated correction. Verify actual Google PDF pagination and absence of source/debug metadata in exported text.

- T-043: verify total OCR concurrency across simultaneous uploads, local single-slot default, bounded queue pressure, retry/failure slot release, and ordered page results. Never describe process-local control as global across cloud instances; rerun hardware timing before increasing local concurrency.

- T-045: verify experiment recording/download, 200-entry retention, corrupt-history preservation, no source text/secrets in stats, same-cohort comparisons and null unmeasured accuracy. Test unknown PNG/JPG invokes OCR with embedded data; do not call mocked transport a source-fidelity benchmark.

- T-047: test >10-page import splits automatically, absolute page mapping, progress, actual HTTP error display, partial-page readiness block and no further batches after reset. Keep OCR fidelity and batch transport claims separate.

## Current regression checklist — T-053 (ตรวจทุกวันจันทร์และก่อนปิดงานที่เกี่ยวข้อง)
รายการต่อไปนี้ต้องลงผลใหม่ทุกครั้ง ไม่ถือว่า checkbox เก่ารับรองโค้ดปัจจุบัน Owner: Codex/QA; ผู้ใช้ยืนยันเฉลยต้นฉบับที่ไม่ชัดและ consent Google. รายการประวัติด้านบนคงไว้เพื่อ audit; ตำแหน่ง UI ล่าสุดยึด T-051.
- [ ] ซ้ายต้นฉบับ / ขวา OCR -> กดแปลง -> edit/export; ก่อนแปลง export disabled
- [ ] เลื่อน/แก้ไข/จัดสไตล์/กดเลขข้อ ไม่ขยับหรือแก้ต้นฉบับ; source-page jump เกิดเฉพาะกดตรวจเทียบ
- [ ] แคปจากซ้ายแล้วรูปเข้าข้อที่เลือกและต้นฉบับไม่เปลี่ยน
- [ ] ไอคอน accessible name/title, keyboard focus, loading/reduced-motion, 390px ไม่ล้น
- [ ] ประวัติ100รายการ/สถิติ200รายการ reload/corrupt/quota; ไม่ปนข้อมูลความลับหรือเนื้อหาเข้า stats
- [ ] โจทย์ย่อย1..N และคำถามต่อท้ายแยกบรรทัด; numeric choices ไม่กลายเป็นโจทย์ใหม่
- [ ] ตารางตัวเลือกหัวข้อขีดเส้นใต้และค่าเดิมครบ; snapshot แยกย่อหน้า/underline ถูกต้อง
- [ ] เฉลย: colon/fullwidth colon, asterisk, explanation precedence, duplicate/conflicting/absent/out-of-range keys; star/green ทันที ไม่เดาจาก handwriting
- [ ] นำเข้า PDF จริงที่ตรวจแล้ว25ข้อ100ตัวเลือก5กลุ่มภาพ exact hash; ไฟล์เปลี่ยนไม่reuseผิดตัว
- [ ] OCR >10หน้าแบ่งล็อต ลำดับหน้า/partial errors/cancel/stale/concurrency ไม่ถดถอย
- [ ] Live Google consent/ปลายทาง/export ยังต้องหลักฐานจริงแยก T-017; unknown OCR fidelity แยก T-039 ไม่ใช้ mock ปิดงาน
คำสั่ง: node scripts/test-parser.cjs; npm test; E2E_BASE_URL=http://localhost:3000 npm run test:e2e (ตั้ง env ตาม shell); node evidence/t052-pdf-browser.cjs; node scripts/finish-task.mjs TASK_ID. Receipt ของแต่ละรอบอยู่ evidence/ พร้อมวัน รุ่นโค้ด คำสั่ง ผล PASS/FAIL/BLOCKED เจ้าของและ next action. ถ้าไม่รันให้ลง NOT RUN พร้อมเหตุผล ห้ามรายงานผ่าน. ผลเริ่มต้น T-051/T-052: gate exit0 ดู evidence/t051-verification.md และ evidence/t052-verification.md; checklist ข้างบนเป็นรายการสำหรับรอบถัดไป.

- [ ] T-054 recheck: edit/copy/export absent before successful format, present in header above question nav after success; reset/failure/loading restore raw state; test style toggle with explicit plain-text selection; issue count is not question count.

- [ ] T-055: incomplete structure opens editable draft with warnings; only one conversion action; crop raw selector nonempty from real parsed questions, insert after draft mounts, manual edit/image retained after live review; absent questions remain honest; unresolved export blocked until real structure review.

### T-056 / T-057 Source image captions and Gemini answer extraction
T-056: every inserted question image has [รูปโจทย์] above it, including toolbar and rich-text DOM paste; explicit user requirement supersedes the older caption-free skill rule. Capture/source DOM stays independent. Export snapshots include the caption.
T-057: Gemini is separate from fixed Typhoon OCR. Server-only GEMINI_API_KEY; configurable GEMINI_ANSWER_MODEL defaults gemini-3.8-flash. One bounded page request at a time per process; timeout 90 seconds, one bounded retry for Google503 or local429 after 1.5 seconds; failed pages reported without blocking later pages, no solving. Match source page, question id, stem, actual choice key; reject duplicate/conflicting candidates, confidence below 0.95, missing evidence or invalid normalized bbox. Preserve explicit parsed answers; render source-vision evidence outside export text. Analyze a fresh parse before publishing editable DOM, ignore stale upload/conversion responses, allow draft despite provider failure. Confidence is model-reported, not an accuracy certificate; handwritten X marks may be ambiguous and stay unanswered.
Lesson: models list HTTP200 does not prove generateContent works. Actual request returned404 for gemini-2.5-flash despite discovery listing it; Google restricts it for new users. Verify real generation before declaring provider ready. Evidence: evidence/t057-live-result.json; scripts/test-source-answers.cjs. Live completion gate still pending.
Requirement R-002/R-004 -> Task T-057 -> features/r-002-feature.md -> lib/source-answer-service.ts, lib/source-answer-client.ts, app/api/source-answers/route.ts, app/page.tsx, lib/formatter-rules.ts -> source-answer guards and live browser evidence. Bug T-056 -> existing browser feature -> components/SplitDocumentEditor.tsx -> caption/browser/export regressions.
Monday recheck: image caption crop/link/paste/export, Gemini real generateContent (not just models discovery), ambiguous/no-mark/duplicate marks remain unanswered, explicit answers not overwritten, stale upload guards and original-source immutability. Owner: weekly reviewer. Commands: node scripts/test-source-answers.cjs; node evidence/t057-live.cjs; node scripts/finish-task.mjs T-057. Never certify source fidelity with mocks.

Final 2026-10-11 handoff: T-056 Done; current shared completion gate exit0 and actual crop/link/DOM-paste/export-snapshot evidence/t056-result.json passed. T-057 In Progress: successful live fixture run21/25 source answers across4 pages retained in evidence/t057-live-result.json; latest recheck Google429 recorded in evidence/t057-provider-recheck.json. Do not overwrite success evidence with failure or claim stable provider readiness. Quota errors now stop all further page requests immediately, preserve already applied answers, and show Usage/Rate limits action; regression verifies one request only. Final feature gate covers code/UI/build, not quota availability or general handwriting accuracy. UI fixture Gemini mocks isolated from real-provider checks. Test selectors use accessible name ไปข้อ N or explicit editor caret, not bare visible digit. No new Google export/deployment certification.

2026-10-12 T-057 quota investigation: screenshot shows historical token/request usage, not configured quota ceilings. Single small text probe of gemini-3.8-flash returned HTTP200 (4 input tokens); this does not certify image requests. Localhost was stopped (ERR_CONNECTION_REFUSED); bootstrap-local.ps1 -Port3000 -SkipTests restarted hidden dev server successfully. Actual4-page browser attempt stopped at page1 after Google429; only1 source-answers request sent, later pages were not sent. Evidence: evidence/t057-quota-probe-20261012.json and evidence/t057-quota-image-20261012.json. No source code changed; T-057 remains In Progress. Owner/action: project owner checks same API-key project, Gemini3.8Flash RPM/TPM/RPD at https://aistudio.google.com/rate-limit; graph peak is not remaining quota and HTTP200 tiny request is not proof of image capacity. Codex rechecks one image only after relevant quota confirmed. Prior successful21/25 answers remain separately recorded; do not substitute that old result for current failed recheck.

### Local comparison T-058
Pilot compares qwen3-vl2b/4b locally without changing production. Existing source PNGs page1/page3 visually reviewed; truth labels are visible red annotation selections, NOT verified subject-answer correctness. Page1 truth1ก2ก3ง4ค5ง6ง; page3 truth11ง12ง13unmarked14ก15ข16ก17ข18ง19ค20ก. Sixteen unique questions with15 marked and1 abstention control; cold page1, warm page3, repeated warm page1 per model. Same source hashes/prompt/settings; precision/recall/wrong/missing/false-positive reported separately before and after existing0.95/bbox guards. Ollama /api/ps model residency and VRAM counters are sampled, not total process/system peak RAM. Evidence and raw responses retained under evidence/t058-local; scripts/benchmark-local-vision.cjs owns evaluation. Model downloads authorized by user; benchmark pending downloads. R-002/R-004 -> T-058 -> features/r-002-feature.md -> benchmark script -> actual local result files and comparison report. Pilot cannot certify production readiness, full-document conversion or general Thai OCR accuracy. T-057 Gemini still unchanged.

T-058 clarification: project owner directly confirmed on2026-10-12 that the tested red marks are teacher answers rechecked for correctness. For these fixture hashes only, the benchmark truth is a visually transcribed, teacher-verified key. Previous annotation-only caveat is superseded for this source, not for arbitrary future imports. Both candidate prompts use this same confirmation and still forbid solving or inventing answers. Independent auditor reviewed evaluator/comparison fairness; completeness, invalid rows, shared fingerprint, error exit and unobserved-memory guards now covered by tests. New evaluator wired into npm test. Model inference results still pending download; never report a winning model without actual matching-condition results.

T-058 final pre-inference dataset: expanded from2pages/16questions to3pages/20questions before any candidate inference, specifically including previously difficult table/diagram page2. Ground truth:19 teacher-marked answers and1 no-unique-choice control (Q13 Free). Pages1,2,3 plus repeated page1 for warm timing;4 runs/model. Both models receive actual reviewed question stems/keys matching production request fields, with no truth key leaked in requests. Preflight: node scripts/benchmark-local-vision.cjs qwen3-vl:2b --preflight passed20questions19marked; fixtures.json captures image hashes and owner confirmation. Completeness and denominators derive from manifest, not hardcoded reduced counts. This supersedes earlier16-question design notes. Await both downloads before timing; no production switch.

T-058 ROI verification checkpoint (2026-10-12): owner confirms teacher-rechecked red circles/crosses for this fixture. Visually inspected all three QA contact sheets: 20 question-owned original-pixel crops,19 marked keys and Q13 Free/no unique choice. QA labels are excluded from inference images. Experimental native loopback HTTP NDJSON transport added (scripts/local-vision-http.cjs); guards tested for UTF8, final metadata, incomplete stream, provider error and loopback-only scope. Metrics now match case IDs rather than first matching page, preventing repeated-page ROI truth contamination. Initial cropped 2B response completed in63.348s but captured empty content; preserved evidence/t058-roi/initial-stream-empty.json, no accuracy certification. Raw stream capture added for diagnosis. Both full-page failed baselines remain in evidence/t058-local. T-058 remains In Progress; production Gemini provider unchanged. Final actual comparison and finish-task gate pending.
T-058 runtime diagnosis: actual stream evidence shows schema JSON wholly in message.thinking with empty content despite thinkfalse. Diagnostic fallback is strictly JSON-only and experiment-only; preserve channel/chunks, never integrate as production response. First diagnostic2B q1 selected ข incorrectly with confidence0.95 (teacher truth ก); confidence alone unsafe. Transport tests passed. Evidence diagnostic-thinking-channel.json, ROI outputs. Full20case comparison ongoing.

## Audit run — 2026-10-12 11:00 (+07:00)
- Auditor / agents: Codex (Primary Governance & System Engineering)
- Changed since previous run: 
  - Verified T-056 mandatory [รูปโจทย์] caption above every cropped and inserted image.
  - T-057 Gemini Vision answer analysis diagnosed with Google HTTP 429 quota limit; single-request guard verified.
  - T-058 Local Ollama Vision benchmark setup completed; qwen3-vl:2b/4b downloaded; CPU latency (>300s timeout on i5-1235U) and diagnostic thinking-channel evidence recorded.
  - Re-verified all 12 test suites, Semantic Validator, platform readiness, CSS delivery HTTP 200, and 15 browser E2E test suites.
- PASS: 
  - `npm test` (all 12 unit test suites passed).
  - Platform readiness (`check-platform-readiness.mjs` passed).
  - Knowledge graph validation (`check-knowledge-vault.mjs` passed).
  - Knowledge drift check (`check-knowledge-drift.mjs` passed).
  - CSS delivery (`check-css.mjs` HTTP 200, 37,985 bytes).
  - Browser E2E suite (`test-e2e.cjs` all 15 scenarios passed).
  - Dev server running healthy on http://localhost:3000/.
- FAIL: None in current code and test suite.
- BLOCKED:
  - T-017 Live Google Drive export blocked pending user consent/Picker in live app.
  - T-057 Gemini Vision batch analysis blocked by Google API quota (HTTP 429).
  - T-058 Interactive local vision blocked by notebook CPU performance limitations (>300s/page on i5-1235U).
- New tasks / owners:
  - Stream 1 (Governance): Codex — maintain Weekly Audit and completion gates.
  - Stream 2 (AI Vision): AI Vision Engineer — resolve T-057 Gemini quota & document T-058 local CPU architectural limit in decisions.md.
  - Stream 3 (Google Integration): Integration Engineer — execute T-017 live OAuth export UAT.
  - Stream 4 (OCR & Editor): Import/UI Engineer — manage T-039/T-044 multi-page retry and unknown PDF OCR accuracy.
- Commands and evidence:
  - `npm test`
  - `node scripts/check-css.mjs`
  - `node scripts/check-platform-readiness.mjs`
  - `node scripts/check-knowledge-drift.mjs`
  - `node scripts/test-e2e.cjs`
  - `evidence/t056-result.json`, `evidence/t057-verification.md`, `evidence/t058-local/`
- Risks and next Monday:
  - Gemini API quota exhaustion prevents automatic answer marking without manual key upgrade.
  - Local CPU inference is too slow for real-time interactive user experience without dedicated GPU.
  - Drive export requires owner to perform live Google consent.

