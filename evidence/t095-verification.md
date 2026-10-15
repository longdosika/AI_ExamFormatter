# T-095 Verification Evidence

- Date/time: 2026-10-15 (Asia/Bangkok)
- Scope: active question-window navigation for long exams

## Browser evidence

Command:

```powershell
$env:E2E_BASE_URL='http://127.0.0.1:3235'
npm run test:e2e
```

Result: PASS, 16/16 browser checks. The long 80-question fixture verified:

- initial: `1..10, 20, 30, 40, 50, 60, 70, 80`
- active 10: `10..20, 30, 40, 50, 60, 70, 80`
- active 20: `10, 20..30, 40, 50, 60, 70, 80`
- all 80 question items remain reachable; source pane and keyboard navigation remain stable

The browser was exercised against the temporary local server at `http://127.0.0.1:3235` and stopped after verification.

## Quality gate evidence

`node scripts/finish-task.mjs T-095` completed with exit code 0 against the same server. The gate passed semantic validation, platform readiness, knowledge drift, typecheck, lint, the complete unit/contract suite, E2E 16/16, production build, and CSS delivery health.

- `npm test`: PASS (all suites)
- `npm run build`: PASS, `APP_VERSION 261015-1141`
- `node scripts/check-knowledge-drift.mjs --require-git`: PASS
- `git diff --check`: PASS (only normal CRLF conversion warnings)
- lint: 0 errors, 8 pre-existing `@next/next/no-img-element` warnings

## Environment note

The first sandbox-only attempts failed at loopback access (`EACCES`) and one build attempt failed creating `.next` (`EPERM`). Re-running with the project-authorized external runtime resolved both environment restrictions; no implementation assertion failed.
