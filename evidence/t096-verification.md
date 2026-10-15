# T-096 Verification Evidence

- Date/time: 2026-10-15 (Asia/Bangkok)
- Scope: preserve a first-question navigation anchor while using active question windows

## Browser evidence

Command:

```powershell
$env:E2E_PORT='3238'
node scripts/test-e2e.cjs
```

Result: PASS, 17 browser checks. The deterministic browser fixture verified:

- 80-question initial window: `1..10, 20, 30, 40, 50, 60, 70, 80`
- active 10: `1, 10..20, 30, 40, 50, 60, 70, 80`
- active 20: `1, 10, 20..30, 40, 50, 60, 70, 80`
- active 60: `1, 10, 20, 30, 40, 50, 60..70, 80`
- offset fixture starting at question 21: first anchor `21` remains available and no hard-coded `1` is introduced
- short 12-question fixture remains fully visible and keyboard accessible

The browser flow was exercised against the temporary local runtime and closed after verification.

## Quality gate evidence

`node scripts/finish-task.mjs T-096` completed with exit code 0. The gate passed semantic validation, platform readiness, knowledge drift, typecheck, lint, all unit/contract suites, E2E, production build, and CSS delivery health.

- `npm test`: PASS
- `npm run build`: PASS, `APP_VERSION 261015-1257`
- `node scripts/check-knowledge-drift.mjs --require-git`: PASS
- lint: 0 errors, 8 existing `@next/next/no-img-element` warnings
- E2E: PASS, 17 checks

One completion-gate attempt encountered a transient Windows `UNKNOWN` error while writing `evidence/qa-iteration-2/results.json`; the authorized rerun completed all checks successfully.
