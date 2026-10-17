// T-132: capture rules must be used, not only written. Checks documents/capture-rules.md:
//  1. every rule C-xx has a row in "ฉ. กฎ → โค้ด → test" and every row names a real rule;
//  2. each `file#name` exists and the file contains that name;
//  3. each test file exists and is run by `npm test` or `npm run test:e2e`.
// Then unit-checks rules that had no direct test (C-10 beside/under, C-12, C-36) on recorded real OCR lines.
// Usage: node scripts/test-capture-rules.cjs
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText, filename);
const root = path.join(__dirname, '..');
const doc = fs.readFileSync(path.join(root, 'documents', 'capture-rules.md'), 'utf8').replace(/\r\n/g, '\n');
const mapStart = doc.indexOf('## ฉ.');
assert.ok(mapStart > 0, 'capture-rules.md has the rule -> code -> test section');
const mapEnd = doc.indexOf('\n## ', mapStart + 5);
const mapSection = doc.slice(mapStart, mapEnd < 0 ? undefined : mapEnd);
const logStart = doc.indexOf('## บันทึกการเรียนรู้');
const rulesText = doc.slice(0, mapStart) + (mapEnd > 0 && logStart > mapEnd ? doc.slice(mapEnd, logStart) : '');
const rules = Array.from(new Set(Array.from(rulesText.matchAll(/^\| (C-\d{2}) \|/gm), match => match[1])));
const rows = new Map(Array.from(mapSection.matchAll(/^\| (C-\d{2}) \| ([^|]+) \| ([^|]+) \|/gm), match => [match[1], { code: match[2].trim(), tests: match[3].trim() }]));
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const wired = `${pkg.scripts.test} ${pkg.scripts['test:e2e']}`;
const problems = [];
for (const rule of rules) if (!rows.has(rule)) problems.push(`${rule}: no row in "กฎ → โค้ด → test"`);
for (const [rule, row] of rows) {
  if (!rules.includes(rule)) problems.push(`${rule}: mapped but not defined as a rule`);
  for (const ref of row.code.split(/\s*;\s*/)) {
    const [file, name] = ref.split('#');
    const full = path.join(root, file);
    if (!fs.existsSync(full)) problems.push(`${rule}: code file ${file} is missing`);
    else if (!name || !fs.readFileSync(full, 'utf8').includes(name)) problems.push(`${rule}: ${file} does not contain "${name}"`);
  }
  for (const test of row.tests.split(/\s*;\s*/)) {
    if (!fs.existsSync(path.join(root, 'scripts', test))) problems.push(`${rule}: test scripts/${test} is missing`);
    else if (!wired.includes(`scripts/${test}`)) problems.push(`${rule}: scripts/${test} is not run by npm test or test:e2e`);
  }
}
assert.deepEqual(problems, [], `capture rules are not all enforced:\n${problems.join('\n')}`);

// Unit checks on recorded real OCR lines (chapter 7 set 2 / set 3).
const { figureVerticalLimits, choiceBelowFigureTop, isChoiceTableFigure } = require('../lib/capture-geometry.ts');
const set2 = JSON.parse(fs.readFileSync(path.join(root, 'evidence', 't121', 't130-set2', 'ocr-response.json'), 'utf8')).flatMap(batch => batch.pageResults);
const set3 = JSON.parse(fs.readFileSync(path.join(root, 'evidence', 't121', 'audit-answers-fixed', 'ocr-response.json'), 'utf8')).flatMap(batch => batch.pageResults);
const regions = (pages, page) => (pages.find(entry => entry.page === page) || pages[page - 1]).textRegions;
// C-10 beside: figure starts inside its question line's row -> top limit is that line's top, left stays clear of "22.".
const q22 = figureVerticalLimits(22, [22, 23, 24, 25], regions(set2.slice(3), 1), false, [212, 230, 308, 425]);
assert.ok(q22[0] <= 212 && q22[0] >= 195, `C-10 beside: Q22 top limit ${q22[0]} reaches the figure top`);
assert.equal(q22[1], 230, 'C-10 beside: left limit keeps the question number out');
assert.ok(q22[2] >= 308, 'C-11: Q22 bottom stays above question 23 only');
const q20 = figureVerticalLimits(20, [16, 17, 18, 19, 20], regions(set2, 3), false, [826, 162, 922, 292]);
assert.ok(q20[0] <= 826, `C-10 beside: Q20 top limit ${q20[0]}`);
// C-10 under: a figure below its stem keeps the limit under the question line (set 3 Q6, T-125).
const q6 = figureVerticalLimits(6, [1, 2, 3, 4, 5, 6, 7, 8], regions(set3, 1), true, [597, 145, 700, 600]);
assert.ok(q6[0] >= 590 && q6[1] === 0, `C-10 under: Q6 top limit ${q6[0]} stays below its question line`);
// C-12: a choice line directly under the figure bounds it; choices beside it do not.
const line = (text, bbox) => ({ text, bbox });
assert.equal(choiceBelowFigureTop([line('ก. คำตอบ', [520, 150, 535, 400])], [400, 150, 530, 400]), 520);
assert.equal(choiceBelowFigureTop([line('ก. คำตอบ', [450, 500, 465, 800])], [400, 150, 530, 400]), undefined);
// C-36: the set 2 Q5 choice table is not a question figure; the Q8 diagram is.
const q5Choices = ['การระเหย: ขั้นตอนที่ 1, 2; การตกผลึก: ขั้นตอนที่ 3', 'การระเหย: ขั้นตอนที่ 1, 2; การตกผลึก: ขั้นตอนที่ 2, 3', 'การระเหย: ทุกขั้นตอน; การตกผลึก: ขั้นตอนที่ 3', 'การระเหย: ทุกขั้นตอน; การตกผลึก: ขั้นตอนที่ 2, 3'].map(text => ({ text }));
assert.equal(isChoiceTableFigure(q5Choices, regions(set2, 1), [679, 134, 822, 531]), true);
const q8Choices = ['สาร A: ซูโครส; สาร B: น้ำปลา; สาร C: น้ำหมึก; สาร D: น้ำ', 'สาร A: กะทิ; สาร B: น้ำปลา; สาร C: น้ำเกลือ; สาร D: ซูโครส', 'สาร A: กะทิ; สาร B: น้ำเกลือ; สาร C: ซูโครส; สาร D: น้ำ', 'สาร A: น้ำเกลือ; สาร B: น้ำเกลือ; สาร C: น้ำเชื่อม; สาร D: ซูโครส'].map(text => ({ text }));
assert.equal(isChoiceTableFigure(q8Choices, regions(set2, 2), [338, 220, 464, 776]), false);
console.log(`Capture rules enforced: ${rules.length} rules mapped to code and wired tests; C-10 beside/under, C-12 and C-36 unit checks pass`);
