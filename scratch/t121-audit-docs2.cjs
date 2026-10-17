const fs = require('fs');
function edit(file, pairs) {
  let s = fs.readFileSync(file, 'utf8'); const crlf = s.includes('\r\n'); s = s.replace(/\r\n/g, '\n');
  for (const [from, to] of pairs) { if (!s.includes(from)) throw new Error(`${file}: missing ${from.slice(0, 70)}`); s = s.replace(from, () => to); }
  fs.writeFileSync(file, crlf ? s.replace(/\n/g, '\r\n') : s);
}
edit('documents/decisions.md', [['# Decisions\n', `# Decisions

### D-069 Model Before Key in Provider Fallback (T-121 audit, 2026-10-17)
- Decision: Gemini source answers, AI answers and diagram detection try the preferred model on every configured key before stepping down to the next model (executeAcrossModelsAndKeys). Source-answer evidence must describe a circle or written answer key; X/tick evidence is rejected on the server. Diagram boxes on a 0..1 scale are rescaled to 0..1000.
- Why: key 1 had no gemini-3.8-flash quota, so every request silently used flash-lite, which returned no circled answers (source 0) and once reported an X as the answer. Keys 2-3 had quota and read 11 circles on the real chapter-7 file.
- Tradeoff: when the preferred model is out of quota on all keys, requests make up to keys x models calls before lite answers; recall still depends on quota. The OCR ink filter stays opt-in (Codex decision; Claude's ink-on comparison removed half the key repairs but altered figure text "สี C").
`]]);
edit('documents/tasks.md', [['- B-36 diagnosis (2026-10-17):', `- Audit (2026-10-17, Claude, owner: "ตรวจสอบงานที่ทำค้างก่อน ... ทำสะ"): re-verified closed items with live provider runs of the real chapter-7 set-3 PDF on the deployed 261017-0014 build: 25 questions x 4 choices (Q15 by confirm), one-column choices, Q6/Q21 tables captured, Q20 clean. Found and fixed: I-033 Q10 graph cut at the right edge (extendCropAcrossInk), I-034 source answers 0 because models were exhausted inside key 1 before rotating keys (executeAcrossModelsAndKeys; X/tick evidence rejected; live source 11/AI 13), I-035 0..1-scaled diagram boxes dropped Q6, I-036 inline stem enumerations; B-18 uncaptured table rows stay one row per line and ordinary tables remove duplicate text without grid detection (hasCellRowEvidence). Verification: npm test exit0, lint 0 errors, typecheck, test-t121-fidelity (25) exit0 on dev, scripts/test-t121-source-marks-ui.cjs (replay of recorded gemini-3.8-flash answers) passed with Q4 source-mark preview; evidence/t121/audit-*. B-32 remains under D-068, B-36 remains blocked on the QuizFlow database.
- B-36 diagnosis (2026-10-17):`]]);
edit('documents/memory.md', [['# Memory\n', `# Memory

### T-121 Audit Lessons (2026-10-17)
Key rotation must wrap models, not the other way round: one exhausted key silently downgraded every Gemini call to flash-lite, which reads almost no answer circles. Newer Gemini models may return bbox on a 0..1 scale. Provider quota for gemini-3.8-flash runs out after a few full live runs of a 4-page file; replay recorded responses (scripts/test-t121-source-marks-ui.cjs, test-t121-fidelity.cjs) instead of repeating live calls. Another agent (Codex) works in this tree at the same time: check mtimes before editing shared docs.
`]]);
edit('documents/traceability.md', [['### T-121 Fidelity / T-113 Runtime\n', `### T-121 Fidelity / T-113 Runtime
Audit 2026-10-17: I-033..I-036 -> lib/diagram-client.ts (extendCropAcrossInk), lib/api-key-manager.ts (executeAcrossModelsAndKeys), lib/source-answer-service.ts (isSelectionEvidence), lib/ai-answer-service.ts, lib/diagram-service.ts (0..1 bbox), lib/capture-geometry.ts (hasCellRowEvidence, line-preserving removeCapturedGridText), lib/exam-parser.ts (isStemTableRow, splitInlineEnumerations) -> scripts/test-diagram-contract.cjs, test-provider-keys.cjs, test-source-answers.cjs, test-parser.cjs, test-t121-source-marks-ui.cjs, test-t121-fidelity.cjs -> evidence/t121/audit-*.
`]]);
edit('documents/code-map.md', [['### T-121 Fidelity and T-113 Runtime\n', `### T-121 Fidelity and T-113 Runtime
- Audit 2026-10-17: \`lib/api-key-manager.ts\` executeAcrossModelsAndKeys (model outer, key inner) used by source-answer-service, ai-answer-service and diagram-service; \`lib/source-answer-service.ts\` isSelectionEvidence; \`lib/diagram-service.ts\` rescales 0..1 boxes; \`lib/diagram-client.ts\` extendCropAcrossInk widens a crop whose printed ink touches the side; \`lib/capture-geometry.ts\` hasCellRowEvidence; \`lib/exam-parser.ts\` isStemTableRow and splitInlineEnumerations. Replay test \`scripts/test-t121-source-marks-ui.cjs\`; live capture helper \`scripts/capture-t121-real.cjs\` (T121_ANSWERS=1).
`]]);
console.log('docs updated');
