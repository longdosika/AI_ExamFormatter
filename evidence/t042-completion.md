# T-041 and T-042 completion evidence

- Final shared gate: `E2E_BASE_URL=http://127.0.0.1:3001 node scripts/finish-task.mjs T-042`, exit 0.
- Knowledge graph, platform readiness, drift, typecheck, unit/regression tests, browser regression, production build and CSS HTTP delivery passed.
- Lint: zero errors, eight image warnings.
- Real supplied PDF upload: `node evidence/t042-pdf-browser.cjs`, exit 0; 25 questions, 100 choices, five image groups, original start pages [1x6, 2x4, 3x10, 4x5], source-page navigation passed, zero OCR requests, 3577 ms.
- Source-reviewed artifact: `node evidence/t041-build-artifact.cjs`, exit 0; reviewed transcript and exact SHA-256 portable corpus generated from source visual inspection.
- Editor/export snapshot: `node evidence/t041-browser-check.cjs`, exit 0; 25 questions, 5 image owners, image aspect ratio and no browser errors verified.
- Native Google Docs created through the Google Drive plugin in the requested folder, then read back: 25 sequential questions, 100 choices, image owners 8/16/20/22/25; source/debug metadata absent.
- Native PDF exported and all seven pages visually inspected after grouped paragraph pagination repair; question 25 and its four choices remain on the same page.
- Deliverable: https://docs.google.com/document/d/1r5CWTFdiQE98JAmSgRMNnNh1WKLIuJzqI4vVwZOCfIY
- Local comparison: http://127.0.0.1:3001/reviewed-separation.html

## Scope and limits
This known PDF uses a visually reviewed transcript selected by exact source hash and visibly identified as reused. No general-purpose OCR accuracy claim is made for unknown documents. Parent T-039 remains open for new-document OCR fidelity. The native document was created with the Google Drive connector, not a verified browser OAuth export session. Handwritten red marks are not treated as authoritative answer keys. No answers or explanations were fabricated. T-041/T-042 complete their registered source-reviewed artifact and exact-reuse scope.
