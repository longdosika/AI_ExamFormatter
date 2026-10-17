# Related Drive Document Library

### T-121 Immutable Cloud Draft Versions
Actual signed-in app backup/restore25questions with original4pages and full80questions/13pages/15images succeeded without OCR. Snapshot versions are present beside the immutable original and versioned DOCX/native Docs. evidence/t121/verification.md separates actual cloud work from the mocked failure/sanitization regression. No QuizFlow import confirmation was made during this pass.
CloudUpload saves edited model/HTML/OCR metadata as a separate private draft JSON version. Restore validates collection role, size, checksums and source identity, fetches the original bytes, sanitizes active/remote markup and writes a strict local snapshot without OCR. Existing source/output/import lineage and access permissions are unchanged. Mocked UI roundtrip plus backend tamper/idempotency/source checks are distinct from actual connected Drive acceptance.

## Traceability
- Requirement: R-006 in [[documents/prd]]
- Task: T-116 in [[documents/tasks]]
- Decisions: D-038 in [[documents/decisions]]
- Traceability Matrix: [[documents/traceability]]

## Behavior
The existing private Drive target contains a library root and SHA-256 source collections. Each collection has original, versioned output and explicitly confirmed QuizFlow-import sections. Originals are uploaded without native conversion, output snapshots are immutable binary DOCX, and editable Google Docs are related views rather than the exact import artifact. Existing unrelated Drive files remain untouched. The modal searches collection names and opens observed Drive links. Source archival does not call OCR. Download works offline; its pending snapshot/source/UUID is retained in IndexedDB and retried explicitly after connection. Import confirmation is user-reported, not API-verified QuizFlow success.

## Code
- Entry points: components/DocumentLibrary.tsx, app/page.tsx, app/api/google/library/route.ts, app/api/google/export/route.ts.
- Supporting files: lib/drive-library.ts, lib/document-library-client.ts, lib/library-pending-store.ts, lib/google-export.ts, app/globals.css.
- Data or integrations: existing sealed Google session and drive.file scope; no widened permissions, public sharing, deletes or automatic historical migration.

## Verification
- Final status: T-116 Done, final production261016-1734. Completion gate and final32/32 existing E2E plus capture/library suites passed; real Drive source readback hash and native Doc/PDF media/answer output verified. Real QuizFlow import/copy is deliberately not claimed.
- Automated tests: scripts/test-drive-library.cjs; browser checks in scripts/test-library-ui.cjs; existing Google/export/E2E regressions.
- Manual/runtime checks: evidence/t116-verification.md records actual OAuth/Drive checks separately from mocked tests. Completion gate required before Done.

## Known Risks
Legacy drafts lacking source bytes/hash can download locally, but are not added to an impossible-to-retry queue; attach the original and export again to establish a verified relation. Historical Drive documents are not auto-linked by name.
Single-process serialization reduces duplicate creates, but concurrent multi-instance Drive clients are not a distributed transaction. External edits/deletes/ACL changes can invalidate metadata and must be reported rather than repaired destructively. Browser-local pending storage can fail under quota or be cleared by the user. drive.file visibility is limited to files granted to this OAuth app. Imported copies are user-confirmed DOCX snapshots, not proof of QuizFlow execution; manually edited Google Docs must be exported as a new exact snapshot before reporting an import. Existing legacy drafts without originals still need identity-checked source reattachment.

- T-128 (2026-10-17): new files are stored flat in AI_ExamFormatter: "[original]", "[original]_[yymmdd-hhmm]" (DOCX + Google Doc), "[original]_แบบร่าง_[stamp].json", "[original]_QuizFlow_[stamp]", tied by SHA-256; older per-document folders remain readable and are reused for identical bytes.
