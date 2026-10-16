# T-105 Workspace Source and Navigation Verification

Date: 2026-10-15, Asia/Bangkok. Host: DESKTOP-FNVSAKS.

## Findings
- LocalStorage draft schema retained OCR/items/edited HTML but no original pages or file Blob. Reopening without an active file therefore produced an empty source pane.
- Draft application reused any active file, even when it belonged to another draft.
- Completed repeatable diagram/answer buttons kept full visual emphasis. Long navigation expanded a moving decade implicitly.
- Browser verification exposed an existing header notice overlay intercepting the draft button; status now uses normal flex layout.

## Changes
- New original-source IndexedDB store; import saves original file/immutable text/page renders before OCR changes rawContent. Reopen checks identity and reconstructs object URLs. Explicit draft deletion removes its stored source.
- Missing legacy originals support source-only reattachment (name/size, SHA-256 if known). No OCR/AI calls, no editor remount. Storage errors remain visible and live original remains usable for that session.
- Completed step controls share subdued styling and remain repeatable. Circular gap controls expand/collapse hidden questions with keyboard/aria/inert support, animation and reduced-motion/mobile behavior.

## Verification
- `npm run typecheck`: passed, including original-source store and ref-based native inert support.
- `npm run lint -- --quiet`: exit 0.
- `node scripts/test-document-drafts.cjs`: exit 0, including source identity and unavailable IndexedDB rejection.
- Browser runs found a test setup incorrectly expecting an uncompleted diagram step to be muted; corrected test exercises diagram completion first. Another run encountered transient Windows evidence-file UNKNOWN locking. Errors are printed before evidence writes so the primary failure remains visible. Source-button disabled attributes legitimately change after reattachment; content-preservation comparisons exclude that availability attribute while checking all edited text/media/answers.
- Expanded browser suite passed 27 checks, including IndexedDB source persistence, original raw text, cross-draft isolation, wrong filename/hash rejection, source-only reattachment with identical edited content and zero provider reprocessing, repeat reload, restored source-page jump and real nonwhite crop pixels. Completed diagram/answer computed opacity is 0.4. Storage unavailable reports an alert while the live original remains visible.
- Visual QA caught excessive collapsed-gap height: replaced intrinsic grid layout with bounded width/height animation. Final desktop/mobile screenshots t105-navigation.png and t105-navigation-mobile.png show compact wrapping (tested nav height <=90px desktop, <=120px mobile), no horizontal overflow, with keyboard expansion/collapse, active item and reduced motion checked. t105-original-restored.png shows actual colored source pages retained with edited answers. Provider outputs are mocked; PDF rendering/source pixels/storage/capture are real.
- First complete `node scripts/finish-task.mjs T-105`: exit 0, all quality stages passed with build 261015-2008. The later sparse-numbering suite passed 28 E2E checks, but two gate reruns failed when Windows rejected opening lib/version.ts for writing (UNKNOWN). ACL permits Modify and file is not read-only. Stopping only the verified isolated Next dev watcher (20344/9952) allowed the unchanged stamp script to succeed (261015-2014). Final verification will use an isolated production server instead of the source watcher; no blanket Node process kill, permissions change or stamping bypass was used.
- Final `node scripts/finish-task.mjs T-105` against isolated production on 3218: exit 0. Vault/platform/drift, typecheck, lint (0 errors; 8 existing img warnings), all unit/contract tests, E2E 28/28, build 261015-2016 and CSS delivery passed. Log: t105-completion-gate.log. Browser errors: none. Sparse fixture uses actual 21/31/41/51/61/69 anchors, exposes 23/25/27/29 without inventing nonexistent numbers.
- Final production `NEXT_DIST_DIR=.next-production-t105-final npm run build`: exit 0, stamp 261015-2017. Verified and replaced only the old Next listener on 3000; new hidden detached production process is 8820. Exact URL http://localhost:3000 exercised via E2E: 28/28 passed, zero uncaught errors. Logs: t105-final-build.log, t105-production-browser.log. Build badge visually confirmed in t105-navigation.png. The isolated production test server on 3218 is no longer needed.
- Knowledge files updated: tasks, PRD, architecture, design, decisions D-029, traceability, code-map, memory, index; R-001/R-002/R-004 feature notes; README latest build. No original/reference Google document was changed in this task.
- Final knowledge-vault and drift checks exited 0 after handoff documentation. Task transitioned In Progress -> Verified -> Done. Isolated dev and production test servers stopped; main production 8820 remains running for the user.

## Boundaries
- Provider outputs in browser tests are mocked; original parsing/rendering, IndexedDB persistence, attachment and DOCX generation are real.
- Existing originals never stored by old builds cannot be reconstructed from OCR. Attach the same original file once; future opens in the same browser/origin restore it automatically if storage remains available.
- IndexedDB is not permanent backup, cross-device sync or cloud storage. Browser clearing/eviction/quota or profile/origin changes can make originals unavailable; report that honestly.
- T-103 Google editor warning and T-104 Q66 harvest/table reconstruction remain outside this task.
