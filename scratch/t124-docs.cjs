const fs = require('fs');
function edit(file, pairs) {
  let s = fs.readFileSync(file, 'utf8'); const crlf = s.includes('\r\n'); s = s.replace(/\r\n/g, '\n');
  for (const [a, b] of pairs) { if (!s.includes(a)) throw new Error(`${file}: missing ${a.slice(0, 70)}`); s = s.replace(a, () => b); }
  for (let i = 0; i < 5; i++) { try { fs.writeFileSync(file, crlf ? s.replace(/\n/g, '\r\n') : s); return; } catch (e) { require('child_process').execSync('sleep 2'); } }
  throw new Error('write failed ' + file);
}
const firstIssue = fs.readFileSync('release_log.md', 'utf8').replace(/\r\n/g, '\n').match(/\n(\| I-0\d+ \|)/)[1];
edit('release_log.md', [[firstIssue, fs.readFileSync('scratch/t124-issues.md', 'utf8').trimEnd() + '\n' + firstIssue]]);
edit('documents/decisions.md', [['# Decisions\n', `# Decisions

### D-072 Stale Drafts: Clean Text Automatically, Re-crop on Request (T-124, 2026-10-17)
- Decision: when a draft opens, stem text that duplicates a captured figure is removed using the stored OCR line geometry and the figure's source page/box (whole lines, runs of two or more rows, short labels at the stem end only). Figures cropped by older versions are listed in the review bar and re-cropped from the original only when the user presses "ตัดใหม่จากต้นฉบับ"; new crops carry data-crop-version, manual captures are marked "manual".
- Why: owner screenshots on 261017-1101 showed problems that a fresh run no longer has; they lived in drafts saved earlier. Text cleanup is geometry-proven and reversible by editing; re-cropping replaces images and old drafts cannot tell harvested from manually captured figures, so it stays an explicit action. A choice line directly under a figure now bounds the crop (I-050).
`]]);
edit('documents/memory.md', [['# Memory\n', `# Memory

### T-124 Stale Drafts (2026-10-17)
A screenshot of an old problem on a new build may come from a reopened draft: editorHtml keeps old images and stem text. Compare with a fresh run (scripts/capture-t121-real.cjs) before changing the pipeline. lib/figure-text-cleanup.ts cleans stems on open; the review bar re-crops figures without data-crop-version. Test: scripts/test-t124-stale-draft.cjs.
`]]);
edit('documents/code-map.md', [['### T-121 Fidelity and T-113 Runtime\n', `### T-124 Stale Draft Repair
- \`lib/figure-text-cleanup.ts\`: cleanStemAgainstFigure, cleanFigureTextInEditor (called in the SplitDocumentEditor restore effect), staleFigures, CROP_VERSION. \`lib/diagram-client.ts\` recropFigure and the choice-below limit (choiceBelowFigureTop in \`lib/capture-geometry.ts\`). \`components/SplitDocumentEditor.tsx\` review item "รูปจากเวอร์ชันก่อน" + recropStaleFigures; \`lib/harvest-editor.ts\` stamps data-crop-version. Test \`scripts/test-t124-stale-draft.cjs\` (in test:e2e).

### T-121 Fidelity and T-113 Runtime
`]]);
edit('documents/traceability.md', [['# Traceability\n', `# Traceability

### T-124 Stale Draft Repair
Bug on existing R-001/R-003 behaviour (no new requirement) -> Task T-124 -> existing Feature Notes r-001-browser, r-003-google-doc-dirve -> lib/figure-text-cleanup.ts, lib/diagram-client.ts, lib/capture-geometry.ts, lib/harvest-editor.ts, components/SplitDocumentEditor.tsx -> scripts/test-t124-stale-draft.cjs, regression test-t121-fidelity (25/80), test-t121-order-dom -> evidence/t124/.
`]]);
console.log('docs ok');
