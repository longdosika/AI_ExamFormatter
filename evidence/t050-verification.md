# T-050 verification

Implementation: explicit left raw-to-format workflow; stable right original/crop; question navigation; filename history capped 100; disabled formatted-only controls before conversion; mobile wrapping header.

Executed: npm run test:e2e passed (transport mocks prove batching/UI only, not OCR accuracy). node scripts/test-import-history.cjs passed persistence/order/cap/corrupt/quota cases. node evidence/t050-pdf-browser.cjs passed original supplied 4-page PDF, 25 questions/100 choices/5 original image groups; explicit source-page jump and actual right-side crop inserted into question 1 while original image src stayed unchanged. Exact reviewed hash reuse made zero provider calls.

Browser receipts: evidence/t050-result.json, evidence/t050-real-pdf-result.json, evidence/t050-workspace.png, evidence/t050-real-pdf-result.png. Access exercised: http://localhost:3000/. Live authenticated Google export is still T-017; unavailable export behavior is verified. Unknown-file OCR accuracy remains T-039. Final node scripts/finish-task.mjs T-050 passed exit 0: semantic/platform/drift, typecheck, lint (0 errors, 8 existing img warnings), complete unit/performance regressions, browser E2E, production build and CSS HTTP200. Verified checkpoint recorded before Done. Hooks cleanup captures the trigger element; keyboard focus cycles close/list; header wraps at 390px.
