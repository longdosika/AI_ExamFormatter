### T-124 Stale figure crops and duplicated figure text in reopened drafts
- Type: Bug
- Status: In Progress
- Lifecycle: Proposed -> Ready -> In Progress -> Verified -> Done
- Problem: Owner screenshots on build 261017-1101 (set 3 draft): Q21 stem still lists the table rows and the table image is cut on the right, Q20 image carries the Q21 stem line, Q8 stem ends with "D สี C สี B สี A สาร ก" and its image carries a choice line. A fresh live run on 1101 (evidence/t121/t124-live1) has clean stems and correct crops, so the defects live in drafts saved by earlier builds: reopening keeps old images and old stem text, and only the narrow cleanCapturedTables heuristic runs.
- Acceptance Criteria: reopening a draft removes stem lines/labels that duplicate a captured figure using the stored OCR line geometry and the figure's data-source-page/data-source-bbox (no AI call, styled text kept); harvested figures record a crop version; figures from older versions with a source box can be re-cropped from the original in one action with the current limits (OCR stem lines, edge widening); manual captures are never changed silently.
- Affected Files: lib/figure-text-cleanup.ts (new), lib/harvest-editor.ts, lib/diagram-client.ts, components/SplitDocumentEditor.tsx, scripts/test-t124-stale-draft.cjs (new), knowledge docs, release_log.md.
- Expected Verification: DOM test with a draft reproduced from the owner screenshot (old stem text + old crops) is cleaned on open and re-cropped by the action; existing T-121 replays and finish-task; deployed check on localhost:3000.

