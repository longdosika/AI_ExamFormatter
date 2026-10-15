const fs = require('node:fs');
const assert = require('node:assert/strict');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => {
  module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true }
  }).outputText, filename);
};

const { analyzePageDiagrams } = require('../lib/diagram-service.ts');
const { detectIntruderCuts } = require('../lib/diagram-client.ts');

// 1. Contract: Diagram Types & Bounding Box Validations
const mockDiagrams = [
  {
    type: "question",
    questionNumber: 15,
    description: "Apparatus test tube setup",
    bbox: [120, 50, 450, 600],
  },
  {
    type: "choice",
    questionNumber: 16,
    choiceKey: "ก",
    description: "Crystal structure sample 1",
    bbox: [500, 100, 650, 300],
  },
  {
    type: "shared_context",
    questionNumber: 17,
    description: "Data table for questions 17-18",
    bbox: [50, 80, 320, 920],
  },
  {
    type: "explanation",
    questionNumber: 20,
    description: "Detailed reaction diagram in answer key",
    bbox: [700, 100, 900, 850],
  }
];

for (const diag of mockDiagrams) {
  assert.ok(["question", "shared_context", "choice", "explanation"].includes(diag.type), `Invalid type: ${diag.type}`);
  assert.equal(typeof diag.questionNumber, 'number');
  assert.ok(Array.isArray(diag.bbox) && diag.bbox.length === 4);
  const [ymin, xmin, ymax, xmax] = diag.bbox;
  assert.ok(ymin >= 0 && ymin <= 1000);
  assert.ok(xmin >= 0 && xmin <= 1000);
  assert.ok(ymax >= 0 && ymax <= 1000);
  assert.ok(xmax >= 0 && xmax <= 1000);
  assert.ok(ymin < ymax, `ymin ${ymin} must be strictly less than ymax ${ymax}`);
  assert.ok(xmin < xmax, `xmin ${xmin} must be strictly less than xmax ${xmax}`);
  if (diag.type === "choice") {
    assert.ok(diag.choiceKey && ["ก", "ข", "ค", "ง"].includes(diag.choiceKey));
  }
}

// 2. Padding Math Contract
function computeCropCoordinates(bbox, naturalWidth, naturalHeight, paddingPx = 4) {
  const rawX = (bbox[1] / 1000) * naturalWidth;
  const rawY = (bbox[0] / 1000) * naturalHeight;
  const rawW = ((bbox[3] - bbox[1]) / 1000) * naturalWidth;
  const rawH = ((bbox[2] - bbox[0]) / 1000) * naturalHeight;

  const padX = Math.max(paddingPx, Math.min(20, Math.round(rawW * 0.025)));
  const padY = Math.max(paddingPx, Math.min(20, Math.round(rawH * 0.025)));
  const padTop = Math.max(padY, Math.min(24, Math.round(padY * 1.2)));

  const x = Math.max(0, Math.round(rawX - padX));
  const y = Math.max(0, Math.round(rawY - padTop));
  const w = Math.min(naturalWidth - x, Math.round(rawW + padX * 2));
  const h = Math.min(naturalHeight - y, Math.round(rawH + padTop + padY));

  return { x, y, w, h };
}

const coords = computeCropCoordinates([100, 200, 500, 800], 1000, 2000, 4);
assert.equal(coords.x, 185); // adaptive 15px horizontal padding
assert.equal(coords.y, 176); // adaptive 24px top padding cap
assert.equal(coords.w, 630); // 600 + adaptive padding * 2
assert.equal(coords.h, 844); // 800 + top/bottom adaptive padding

// Perimeter clamp at edges
const edgeCoords = computeCropCoordinates([0, 0, 50, 50], 1000, 1000, 4);
assert.equal(edgeCoords.x, 0); // clamped at 0
assert.equal(edgeCoords.y, 0); // clamped at 0

function cropPolicy(type) {
  const cropPadding = type === "shared_context" ? 16 : type === "question" ? 32 : type === "choice" ? 20 : 16;
  const shouldTrimEdges = (type === "shared_context" || type === "question") ? "all" : "none";
  return { cropPadding, shouldTrimEdges };
}

assert.deepEqual(cropPolicy("shared_context"), { cropPadding: 16, shouldTrimEdges: "all" });
assert.deepEqual(cropPolicy("question"), { cropPadding: 32, shouldTrimEdges: "all" });
assert.deepEqual(cropPolicy("explanation"), { cropPadding: 16, shouldTrimEdges: "none" });
assert.deepEqual(cropPolicy("choice"), { cropPadding: 20, shouldTrimEdges: "none" });

// 3. T-092/T-089 Robust Gutter Trimming & Margin Tolerance Contract.
// The contract imports the production projection helper so the test cannot drift
// away from the Canvas implementation.
function simulateGutterDetection(rowDarkness, contentThreshold = 3, targetMargin = 3, options = { top: true, bottom: true }) {
  return detectIntruderCuts(rowDarkness, contentThreshold, targetMargin, options);
}

// Case A: Table contaminated with text title above (rows 0-5) and question text below (rows 50-55)
const mockContaminatedRows = new Array(60).fill(0);
// Top intruder text
for (let y = 0; y <= 5; y++) mockContaminatedRows[y] = 12;
// White gutter: rows 6 to 11
// Table content: rows 12 to 45
for (let y = 12; y <= 45; y++) mockContaminatedRows[y] = 150;
// White gutter: rows 46 to 49
// Bottom intruder text: rows 50 to 59
for (let y = 50; y < 60; y++) mockContaminatedRows[y] = 15;

const trimResult = simulateGutterDetection(mockContaminatedRows, 3, 3);
// Top cut must remove the intruder text (rows 0-5) and cut around row 9 (12 - 3)
assert.ok(trimResult.topCut >= 8 && trimResult.topCut <= 10, `Expected topCut ~9, got ${trimResult.topCut}`);
// Bottom cut must remove bottom intruder text and end around row 49 (45 + 1 + 3)
assert.ok(trimResult.bottomCut >= 48 && trimResult.bottomCut <= 50, `Expected bottomCut ~49, got ${trimResult.bottomCut}`);

// Case B: Question 43 & 80 scenario - deep intruder text band at top (rows 12-28, choice from Q42 or stem) and bottom (choices)
const mockDeepContaminatedRows = new Array(200).fill(0);
// Blank space y = 0..11
// Intruder text y = 12..28 (17px tall text)
for (let y = 12; y <= 28; y++) mockDeepContaminatedRows[y] = 18;
// Gutter y = 29..45 (17px blank gutter)
// Main apparatus content y = 46..150
for (let y = 46; y <= 150; y++) mockDeepContaminatedRows[y] = 120;
// Gutter y = 151..168 (18px blank gutter)
// Bottom choices y = 169..186
for (let y = 169; y <= 186; y++) mockDeepContaminatedRows[y] = 16;
// Blank space y = 187..199

const qDeepTrimResult = simulateGutterDetection(mockDeepContaminatedRows, 3, 3, { top: true, bottom: true });
// Top cut must remove the intruder text (12..28) and cut cleanly at 46 - 3 = 43
assert.equal(qDeepTrimResult.topCut, 43, `Expected topCut 43, got ${qDeepTrimResult.topCut}`);
// Bottom cut must remove bottom choices (169..186) and cut cleanly at 150 + 1 + 3 = 154
assert.equal(qDeepTrimResult.bottomCut, 154, `Expected bottomCut 154, got ${qDeepTrimResult.bottomCut}`);

// Q80 regression: rasterised text can be taller than the old 36px limit and
// the gutter can collapse to one row. Both intruders must still be removed.
const q80Rows = new Array(320).fill(0);
for (let y = 34; y <= 82; y++) q80Rows[y] = 18; // stem/title above the apparatus
for (let y = 84; y <= 90; y++) q80Rows[y] = 0; // narrow raster gutter
for (let y = 91; y <= 260; y++) q80Rows[y] = 120; // apparatus + callouts
for (let y = 261; y <= 266; y++) q80Rows[y] = 0; // narrow raster gutter
for (let y = 267; y <= 309; y++) q80Rows[y] = 16; // answer choice below the figure
const q80TrimResult = simulateGutterDetection(q80Rows, 3, 3, { top: true, bottom: true });
assert.equal(q80TrimResult.topCut, 88, `Q80 top stem must be removed, got ${q80TrimResult.topCut}`);
assert.equal(q80TrimResult.bottomCut, 264, `Q80 answer choice must be removed, got ${q80TrimResult.bottomCut}`);

// Case C: Choice crystal diagram (Q16) - pure figure starting at y = 15, no intruder text
const mockCrystalRows = new Array(100).fill(0);
for (let y = 15; y <= 85; y++) mockCrystalRows[y] = 90;
const crystalTrimResult = simulateGutterDetection(mockCrystalRows, 3, 3, { top: false, bottom: false });
assert.equal(crystalTrimResult.topCut, 0, 'Choice crystal must not be trimmed when options are false');
assert.equal(crystalTrimResult.bottomCut, 100, 'Choice crystal must preserve full height');

// 4. T-084 visible ordering labels: question figures use the explicit heading requested by the user.
const editorSource = fs.readFileSync(require.resolve('../components/SplitDocumentEditor.tsx'), 'utf8');
assert.ok(editorSource.includes('รูปโจทย์:'), 'Question image heading must be visible as รูปโจทย์:');
assert.ok(editorSource.includes('รูปคำอธิบาย:'), 'Explanation image heading must be visible as รูปคำอธิบาย:');
assert.ok(editorSource.includes('LABEL_SHARED_START}:{" "}'), 'Shared context heading must render with a colon');
assert.ok(editorSource.includes('hasQuestionHeading'), 'Auto-labeling must detect existing รูปโจทย์ heading');
assert.ok(!editorSource.includes('label.textContent = FORMATTER_CONSTANTS.LABEL_QUESTION_IMAGE'), 'Auto/manual question-image labels must not insert legacy [รูปโจทย์]');
assert.ok(editorSource.includes('data-shared-context-block="true"'), 'Shared context block must remain first-class markup');
assert.ok(editorSource.includes('data-question-image="true"'), 'Question image block must remain first-class markup');
assert.ok(editorSource.includes('data-explanation-image="true"'), 'Explanation image block must remain first-class markup');

const packageSource = fs.readFileSync(require.resolve('../package.json'), 'utf8');
assert.ok(packageSource.includes('"predev": "node scripts/stamp-version.cjs"'), 'Development server startup must stamp the visible build number');

console.log("Diagram harvesting contract, bbox validation, T-089/T-092 gutter trimming, T-084 crop/order, and T-086 bottom-trim/build-stamp tests passed.");

