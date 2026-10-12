# Execution plan — 2026-10-10

## Goal and ownership
Deliver a trustworthy import → edit → native Google Docs workflow into folder `1bZeNZ7De9pxsoQH-Zo9ni3A3Rd6XmnuG`, with usable UI, bounded resources and evidence-backed acceptance.

| Order | Workstream | Owner | Task | Dependency / exit |
|---|---|---|---|---|
| 1 parallel | Responsive accessible UI/UX | UI agent | T-021 | preserve design constitution; browser evidence |
| 1 parallel | Import performance/resources | Performance agent | T-022 | cancellation, budgets, cleanup, benchmark |
| 1 parallel | Quality gates/browser regression | QA agent | T-023 | lint/typecheck/real runtime test evidence |
| 1 parallel | Google authentication/export code | Primary integration agent | T-024 | secure config-ready implementation and API tests |
| 2 | Live Google acceptance | Integration + project owner | T-017/T-003 | OAuth client setup and real output/template evidence |
| 2 | OCR/provider and semantic images | Import + project owner | T-018 | provider/support confirmation, image/scanned fixtures |
| 3 | Shared case/history and final browser release checks | UI + QA | T-019 | shared-storage decision, full runtime acceptance |

## Performance acceptance
- Parser benchmark covers 100/1,000/5,000 questions, records timings/counts/environment; results are a local baseline, not universal SLA.
- PDF renderer has an explicit decoded-pixel/resource budget, preserves full text or fails clearly; cancellation and cleanup have regression assertions.
- Browser checks distinguish small-screen fit, keyboard access, error states and editing fidelity from production build success. First-load bundle recorded from build; LCP/INP/memory claims require measured browser data.

## Configuration still required
- Prefer user OAuth for this personal web app; OAuth client configuration remains owner input. No credentials in chat.
- OCR/AI provider and shared case database are not selected without confirmation. Existing tasks retain their acceptance scope.
- Never mark T-003 or R-003 complete without an actual native Google Doc readback in the confirmed folder and template verification.
