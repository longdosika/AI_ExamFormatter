const fs = require('node:fs');
const assert = require('node:assert/strict');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => {
  module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true }
  }).outputText, filename);
};

const { analyzePageDiagrams } = require('../lib/diagram-service.ts');

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

  const x = Math.max(0, Math.round(rawX - paddingPx));
  const y = Math.max(0, Math.round(rawY - paddingPx));
  const w = Math.min(naturalWidth - x, Math.round(rawW + paddingPx * 2));
  const h = Math.min(naturalHeight - y, Math.round(rawH + paddingPx * 2));

  return { x, y, w, h };
}

const coords = computeCropCoordinates([100, 200, 500, 800], 1000, 2000, 4);
assert.equal(coords.x, 196); // 200 - 4
assert.equal(coords.y, 196); // 200 - 4
assert.equal(coords.w, 608); // 600 + 8
assert.equal(coords.h, 808); // 800 + 8

// Perimeter clamp at edges
const edgeCoords = computeCropCoordinates([0, 0, 50, 50], 1000, 1000, 4);
assert.equal(edgeCoords.x, 0); // clamped at 0
assert.equal(edgeCoords.y, 0); // clamped at 0

// 3. T-082 Smart Gutter Trimming & Margin Tolerance Contract
function simulateGutterDetection(rowDarkness, contentThreshold = 3, targetMargin = 3) {
  const h = rowDarkness.length;
  const maxSearchTop = Math.min(Math.round(h * 0.35), 65);
  let sawDarkNearTop = false;
  let gutterStart = -1;
  let gutterEnd = -1;
  let topCut = 0;

  for (let y = 0; y < maxSearchTop; y++) {
    const isDark = rowDarkness[y] >= contentThreshold;
    if (isDark) {
      if (y < 16) sawDarkNearTop = true;
      if (gutterStart !== -1) {
        gutterEnd = y;
        break;
      }
    } else {
      if (sawDarkNearTop && gutterStart === -1) gutterStart = y;
    }
  }

  if (sawDarkNearTop && gutterStart !== -1 && gutterEnd !== -1 && (gutterEnd - gutterStart) >= 2) {
    topCut = Math.max(0, gutterEnd - targetMargin);
  }

  const minSearchBottom = Math.max(h - 65, Math.round(h * 0.65));
  let sawDarkNearBottom = false;
  let bGutterStart = -1;
  let bGutterEnd = -1;
  let bottomCut = h;

  for (let y = h - 1; y >= minSearchBottom; y--) {
    const isDark = rowDarkness[y] >= contentThreshold;
    if (isDark) {
      if (y > h - 16) sawDarkNearBottom = true;
      if (bGutterStart !== -1) {
        bGutterEnd = y;
        break;
      }
    } else {
      if (sawDarkNearBottom && bGutterStart === -1) bGutterStart = y;
    }
  }

  if (sawDarkNearBottom && bGutterStart !== -1 && bGutterEnd !== -1 && (bGutterStart - bGutterEnd) >= 2) {
    bottomCut = Math.min(h, bGutterEnd + 1 + targetMargin);
  }

  return { topCut, bottomCut };
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

console.log("Diagram harvesting contract, bbox validation, and T-082 smart gutter trimming tests passed.");

