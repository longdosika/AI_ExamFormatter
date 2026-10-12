# บันทึกและดูบทเรียน/ข้อตัดสินใจของแต่ละเคส (Lessons Learned & Case Decision Log Viewer)

Status: `In Progress`

## Traceability

- Requirement: R-005 in [[documents/prd]]
- Task: T-006 in [[documents/tasks]]
- Persistence and truthful status fixes: T-016 in [[documents/tasks]]
- Thai labels, responsive controls, accessible case fields and empty search: T-021 in [[documents/tasks]]
- Decisions: D-003 in [[documents/decisions]]
- Traceability Matrix: [[documents/traceability]]

## Behavior

User can view, search, and record topic-based case decisions (e.g. image crop perimeter sweeping, answer reconciliation, section reset parser). Each case records: Source filename/link, problem sample, decision rationale, output result, and timestamp. Supports Export to JSON for AI context learning. Entries persist in versioned browser localStorage after validation. Corrupt or inaccessible stored data is left untouched; the UI reports the error and blocks additions. Failed writes preserve the form for retry. New user entries start as NEEDS_REVIEW; sample cases are labeled as examples.

## Code

- Entry points: `components/CaseDecisionManager.tsx`, `app/page.tsx`
- Supporting files: `lib/case-ledger.ts`
- Data or integrations: browser localStorage (device/browser scoped) and JSON Export. No automatic vault synchronization or server storage.

## Verification

- Acceptance checks: Case entry creation, search filtering, JSON export for AI learning.
- Automated tests: `scripts/test-cases.cjs` covers round-trip persistence, invalid schema, duplicate IDs, corrupt-data preservation, version mismatch, read/write exceptions, and empty saved ledgers. `npx tsc --noEmit` passes.
- Manual checks: UAT scenario `UAT-LES-001` in [[evidence/uat-checklist]]
- UI implementation decisions: [[evidence/ui-review]] (not a completed browser UAT claim).
- Runtime checks: Interactive Case Decision Manager component verification

## Known Risks

- Browser storage can be cleared and does not synchronize across devices or simultaneous tabs. Export JSON for backups. UI reload/storage UAT remains pending; automated tests exercise the storage contract.
