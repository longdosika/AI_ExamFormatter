# T-119 Thirty-Point Workspace Pass Verification

Date: 2026-10-16, Asia/Bangkok. Host: DESKTOP-FNVSAKS.

## Findings (owner screenshots, build 261016-2013)
- Duplicate question number in the strip ("... 6 4 7 ...") and choices ค/ง merged into one row ("ค. เฮกเซน. ง แอลกอฮอล์", question with 3 choices).
- Editor rail wrapped to two rows; "Drive พร้อม" squeezed under export; tall question spacing; orphaned folded status dot.
- Parallel work: another agent completed T-112..T-118 today (build 261016-2013). T-119 built on that code and kept its owner decisions (plain source count, inline rail expansion, Drive state at export, separate library/drafts).

## Changes
See documents/tasks.md T-119 and design.md. Items 1-30 and A/B implemented; item 17 intentionally unchanged per T-118; item 19 opt-in per T-050.

## Defects found during the pass
- Code insertion via String.replace turned "$`" into the text before the match (one corrupted line); restored the backup and re-applied with a function replacer.
- Parser regex lost its backslashes inside a template literal; fixed with String.raw.
- Bulk AI confirmation made reopened drafts show the answer step as not done; user-confirmed answers now count as completed.
- Pre-existing edge: in a short document, jumping to question 1 scrolled 16 px to the bottom, so scroll detection reported the last question; a 600 ms jump lock keeps the deliberate target.
- Ink filter first blackened coloured strokes (SVG filters default to linearRGB); fixed with sRGB interpolation and a red+blue mix (evidence/t119-ink-filter-check.png: pen strokes removed, print kept).

## Verification
- `node scripts/test-parser.cjs`: merged-choice split, complete choices unchanged, Thai words containing ง not split, validator message: pass.
- `npm test`: exit 0 (evidence/t119-npm-test.log).
- `npm run test:e2e` (four suites) on dev :3101: exit 0, 35 PASS lines (evidence/t119-e2e.log) including new checks: AI two-step confirmation, duplicate flags, merged-choice split in the editor, key 2 selects ข, compact choices, clear chip hidden until answered, export confirm before sending with review items.
- capture-t119 at 1912x914: editor rail 55 px (one row), 12 page dots, no overflow at 390 px. Screenshots: t119-workspace.png, t119-strip-legend.png, t119-export-confirm.png, t119-header.png, t119-source-dots-ink.png, t119-mobile.png.
- Production gate: first run stopped at the knowledge validator (duplicate decision ID D-036, also used by the parallel agent); renamed to D-066. Rerun `finish-task T-119` exit 0 on production 261016-2058 at :3102 (all suites, gate stamp 261016-2101, CSS health) (evidence/t119-completion-gate.log).
- Deployment: localhost:3000 (127.0.0.1) serves 261016-2058 from `.next-production-t119`; HTTP 200, CSS OK; capture-t119 against :3000 passed (rail 55 px, 12 page dots, mobile no overflow).

## Boundaries
- The ink filter is view-only and threshold-based; very dark pen colours (navy/black ink) are indistinguishable from print and stay visible.
- Source-mark comparison uses answers read by source vision (reconciliationProvenance source_vision); documents without vision-read marks show no comparison.
- Google export is mocked in tests.
