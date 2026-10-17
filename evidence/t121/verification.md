# T-121 / T-113 / T-103 / T-104 Verification

Machine: DESKTOP-FNVSAKS. Work: 2026-10-16 through2026-10-17, Asia/Bangkok. No stage, commit or push.

Final deployed runtime:261017-0014, .next-production-t121-release, PID17800 at verification; source/IAB badge match, CSS200/63,734bytes. Deployed controls and resumed80 fidelity both exit0 (deployed-controls.log/deployed-fidelity80.log). Actual IAB reopened80items/13source pages/15images and downloaded DOCX993,088bytes with15media files, number coverage80 and no synthetic test marker. Browser download wait completed at01:09; this was not an application-latency benchmark. live-build.json records the observed handoff state.

## Diagnosed and Changed
- Missing Merge icon import blocked typecheck. Old compact-choice CSS contradicted the master template. Contextual key repairs plus explicit missing-key confirmation avoid fake questions and invented text.
- Live source3 is25 questions/4 pages, not26. Google OCR line geometry now travels through API/client/draft into capture. A unique full ruled grid can refine provider bounds; uncertain images never claim CLEAN.
- Q66 was misclassified shared_context for one question. It now binds to that question, keeps the original table image and removes only evidenced OCR table rows. Its following question-continuation line now bounds both crop and padding. Final actual crop bottom846.4065 precedes the OCR line top849.4065.
- Manual split created a live clone that React could duplicate after harvest. Revised rendering and lib/harvest-editor.ts preserve confirmed split rows, edited text/styles and new image bytes on resumed HTML, including automatic persistence.
- Real Drive restore exposed a missing client SHA-256. The fetched original is now hashed, checked, stored and reopened without OCR. The mocked regression now requires successful modal closure rather than matching an old success toast. Remote/executable HTML is stripped before restore.
- Next15.5.27/React18, PDF4.10.38 module worker and PostCSS8.5.30 replace vulnerable dependencies. No audit fix --force or access-permission changes.
- Export errors remain visible until dismissed/retried instead of vanishing after six seconds.

## Executed Verification
- `node scripts/finish-task.mjs T-121 T-113 T-103 T-104`: exit0, evidence/t121/completion-gate-final-snapshot.log. Includes typecheck, lint, unit contracts,37 PASS lines plus capture/library/workspace/legacy-cloud suites, isolated build and CSS200. Lint:0errors/9image warnings. This is local Node24/Windows, not Node22 cloud CI.
- `npm audit --omit=dev --audit-level=high --json --cache .cache/npm`: exit0, zero vulnerabilities of any severity; npm-audit-release.json.
- Isolated clean lockfile `npm ci --prefix .cache/t113-clean-install --no-audit --no-fund --cache .cache/npm`: exit0,403packages and postinstall PDF assets; clean-install.log. In-use node_modules was not deleted.
- Actual OCR/diagram provider runs on owner source3 and source1 recorded in continuation-r2/ and source80-live/. Earlier Origin rejection/502/network failures remain failures, not passing accuracy evidence. Later IAB source80 reharvest returned15figures successfully.
- `node scripts/test-t121-fidelity.cjs` on stable production, default source3 and T121_SOURCE80=1/source1: both exit0; resumed25-verified.log and resumed80-verified.log. These replay recorded real-provider responses, not additional provider calls. Verify25/80items, visible media, full columns, Q20/Q66 bounds, image max661px, explicit Q15 split, save/reload/resumed harvest, retained strong formatting, automatically persisted media snapshot, actual DOCX and390px layout.
- `node scripts/test-t121-controls.cjs`: legacy fake-question merge/save/reload, explicit spelling, mocked Drive backup/restore with original, sanitizer and durable export error. Backend Drive tests separately cover immutable versions, idempotency, byte hashes and tamper rejection.
- `node scripts/check-release-readiness.mjs`: exit0,781files/68,430,769bytes,0findings/0warnings at that scan; release-readiness.json. This is not full-history, binary privacy or live-credential clearance.
- B-38 offline dark-ink experiment removed488pixels while protecting84,657darkpixels across33text/figure regions; dark-ink-experiment.json. It is NOT deployed: the OCR protection mask can also contain handwriting and miss printed glyphs.

## Actual Connected Browser / Google
- Signed-in IAB verified existing account; only ordinary existing-account sign-in renewed an expired session. No cookies/tokens copied to command-line tools, no new scopes/ACLs.
- Drive original+draft backup and restore25items/4original pages, including Q15 four choices and5images, exercised through the app. Full80-item draft also backed up AND restored with13original pages/15images without OCR; drive-restored80.jpg. Originals/output/draft/import remain distinct.
- Actual25-item Google Doc: https://docs.google.com/document/d/1Co3pM0T4MlI2e1n62KmSPjIqZqFONxpUSB8Ji-ssioY/edit ; editor table visible and Google PDF8pages/5images.
- Before-fix80-item Google Doc:1a1HLoaxrcAcQP7GbLVKW1hwfkI_lCCN-dQRKai7P230. Preserved as a prior version, not overwritten; its Q66 bottom-line contamination is documented.
- Final80-item Google Doc: https://docs.google.com/document/d/1bNXWPjeghVo_CZ_opqDEdSPyKCvIzQz23ZSOuG-T1Tc/edit . Opened actual editor Q66 and inspected Google PDF:23pages/15images; question-number coverage1..80, no missing numbers, Q66 heading once. Complete X/Y/Z headers/rows, no following question line inside image, no repeated flattened table cells. google-doc-80-q66-fixed.jpg is the actual editor screenshot. PDF inspection temporary artifacts remain under ignored tmp/pdfs/.
- Original reported Google Doc1TgtZzwQ-PR0B7hv8yamMDPTAnNKoI2kreGbnDNCP-js: Q16 all4crystal images now render in signed-in editor, no warning reproduced. google-legacy-q16*.jpg. Historical rendering cause remains unproven; original/reference Docs unchanged.

## Explicit Remaining Work
- T-122 Proposed confirmation: one quick IAB library click landed on statistics download during inline rail expansion; keyboard Enter and settled-hover regressions work. Reproduce with fresh pointer geometry before changing the owner's explicit inline-hover design. This is not blanket browser certification.
- T-121 is not blanket Done. B-18 generic uncaptured-table fallback retains raw OCR plus a placeholder; arbitrary table reconstruction/deletion is not certified. B-25/B-27 source-mark recall remains T-057: actual IAB source3 returned source0/AI24/unresolved1. Separate source-only page1 diagnostic HTTP200 correctly accepted Q2/Q4, abstained Q1/Q6 and returned no unsupported X selections. This is not corpus-wide correctness or a reason to relabel AI as source answers.
- B-36 actual QuizFlow import is blocked: localhost3001/admin/import says database unavailable after retry and falls back to temporary in-memory mode. No actual bank import, no false confirmation in Drive and no QuizFlow code/database settings changed. Owner action was requested.
- B-32 no-stage/no-commit/no-push restriction remains. Historical credential confirmation/rotation if real, source-derived evidence privacy review and actual Node22 GitHub CI remain before publication.
- B-40 audit/consolidation map is legacy-task-audit.md, not a retrospective Done claim for all16older tasks. Notebook/model benchmarks and hardware UAT remain separate.
- Google output is an editable, unreviewed test export, not a certified answer key or evidence of successful QuizFlow import. Provider geometry/ink recognition still requires source comparison.
