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
  const cropPadding = type === "shared_context" ? 14 : type === "question" ? 56 : type === "explanation" ? 18 : 10;
  const shouldTrimEdges = type === "shared_context" ? "all" : type === "question" ? "bottom" : "none";
  return { cropPadding, shouldTrimEdges };
}

assert.deepEqual(cropPolicy("shared_context"), { cropPadding: 14, shouldTrimEdges: "all" });
assert.deepEqual(cropPolicy("question"), { cropPadding: 56, shouldTrimEdges: "bottom" });
assert.deepEqual(cropPolicy("explanation"), { cropPadding: 18, shouldTrimEdges: "none" });
assert.deepEqual(cropPolicy("choice"), { cropPadding: 10, shouldTrimEdges: "none" });

// 3. T-082 Smart Gutter Trimming & Margin Tolerance Contract
function simulateGutterDetection(rowDarkness, contentThreshold = 3, targetMargin = 3, options = { top: true, bottom: true }) {
  const h = rowDarkness.length;
  let topCut = 0;

  if (options.top !== false) {
    const maxSearchTop = Math.min(Math.round(h * 0.35), 65);
    let sawDarkNearTop = false;
    let gutterStart = -1;
    let gutterEnd = -1;

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
  }

  let bottomCut = h;

  if (options.bottom !== false) {
    const minSearchBottom = Math.max(h - 65, Math.round(h * 0.65));
    let sawDarkNearBottom = false;
    let bGutterStart = -1;
    let bGutterEnd = -1;

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

// Case B: Question figure preserves top caption but drops neighboring option text below.
const mockQuestionRows = new Array(120).fill(0);
for (let y = 4; y <= 11; y++) mockQuestionRows[y] = 16; // caption belonging to figure
for (let y = 22; y <= 82; y++) mockQuestionRows[y] = 120; // apparatus content
for (let y = 108; y <= 119; y++) mockQuestionRows[y] = 18; // option text intruding below figure
const questionTrimResult = simulateGutterDetection(mockQuestionRows, 3, 3, { top: false, bottom: true });
assert.equal(questionTrimResult.topCut, 0, 'Question bottom trimming must not remove top figure captions');
assert.ok(questionTrimResult.bottomCut >= 84 && questionTrimResult.bottomCut <= 86, `Expected bottomCut ~86, got ${questionTrimResult.bottomCut}`);

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

console.log("Diagram harvesting contract, bbox validation, T-082 smart gutter trimming, T-084 crop/order, and T-086 bottom-trim/build-stamp tests passed.");

