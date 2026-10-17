const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { combinedOcrText } = require('./t121-dump-parse.cjs');
const { parseExamText, stripCapturedTableText } = require('../lib/exam-parser.ts');
const { validateExamItems } = require('../lib/exam-validation.ts');
const { normalizeThaiOcrText } = require('../lib/text-normalization.ts');
const { suggestOcrWords } = require('../lib/ocr-suggestions.ts');
const { removeCapturedFigureEnumerations, tableContinuationTop, figureVerticalLimits } = require('../lib/capture-geometry.ts');
const results = [];
function check(name, run) {
  try { run(); results.push({ name, passed: true }); console.log('PASS', name); }
  catch (error) { results.push({ name, passed: false, error: error.message }); console.error('FAIL', name, error.message); }
}
const fixture = set => combinedOcrText(path.join(__dirname, `../evidence/t121/set${set}/ocr-response.json`));
const four = 'ก. first\nข. second\nค. third\nง. fourth';
check('H-02 crossed numeric key before repeated real question', () => {
  const items = parseExamText(`2. source\nก. a\nข. b\nค. c\n3. rejected-key shape\n3. real question\n${four}`);
  assert.deepEqual(items.map(item => item.questionNumber), [2, 3]);
  assert.equal(items[0].choices[3].key, 'ง');
  assert.equal(items[0].choices[3].keyInferred, true);
  assert.equal(items[1].choices.length, 4);
});
check('H-03 actual set4 figure enumeration and decimal are not fake questions', () => {
  const items = parseExamText(fixture(4));
  assert.deepEqual(items.filter(item => item.sourcePage === 1).map(item => item.questionNumber), [1, 2, 3]);
  assert.equal(items.find(item => item.questionNumber === 2).choices.length, 4);
  assert.ok(items.find(item => item.questionNumber === 2).questionText.includes('กาแลกโตส'), 'Keep labels until an image is actually captured');
  assert.ok(!items.some(item => item.questionNumber === 91));
  assert.ok(items.find(item => item.questionNumber === 9).questionText.includes('91.5'), 'Preserve the original decimal table value');
});
check('H-03 normal numbered stems and real next boundaries stay intact', () => {
  const items = parseExamText(`2. พิจารณารูปดังนี้\n1. label one\n2. label two\n${four}\n3. real next\n${four}\n4. decimal 91.5 remains`);
  assert.deepEqual(items.map(item => item.questionNumber), [2, 3, 4]);
  assert.ok(items[0].questionText.includes('2. label two'));
});
check('H-03 captured geometry removes labels only after actual capture', () => {
  const regions = JSON.parse(fs.readFileSync(path.join(__dirname, '../evidence/t121/set4/ocr-response.json')))[0].pageResults[0].textRegions;
  const item = parseExamText(fixture(4)).find(item => item.questionNumber === 2);
  const cleaned = removeCapturedFigureEnumerations(item.questionText, regions, [470, 120, 642, 830]);
  assert.ok(!cleaned.includes('กาแลกโตส') && !cleaned.includes('จุดเริ่มต้น'));
  assert.ok(cleaned.includes('ข้อสรุปต่อไปนี้ข้อใดถูกต้อง'));
  assert.equal(removeCapturedFigureEnumerations(item.questionText, regions, [0, 0, 50, 50]), item.questionText);
});
check('H-03 figure legend with a real question number cannot truncate its capture', () => {
  const regions = JSON.parse(fs.readFileSync(path.join(__dirname, '../evidence/t121/set4/ocr-response.json')))[0].pageResults[0].textRegions;
  const page = parseExamText(fixture(4)).filter(item => item.sourcePage === 1);
  const questions = page.map(item => ({ questionNumber: item.questionNumber, stem: item.questionText }));
  const limits = figureVerticalLimits(2, [1, 2, 3], regions, false, [470, 120, 642, 830], questions);
  assert.ok(limits[2] > 780, 'The following real stem starts at787, not the figure label at526');
  const next = figureVerticalLimits(3, [1, 2, 3], regions, false, undefined, questions);
  assert.ok(next[0] > 810, 'Question3 starts at its real sentence, not the legend');
});
check('H-07 live provider Q4 box must constrain padding before its following sentence', () => {
  const regions = JSON.parse(fs.readFileSync(path.join(__dirname, '../evidence/t121/set4/ocr-response.json')))[0].pageResults[1].textRegions;
  // Actual live box ended at359; prose begins at360.534, outside the provider box but inside later padding/grid search.
  const continuation = tableContinuationTop(regions, [205, 143, 359, 622], 396);
  assert.ok(continuation > 360 && continuation < 361);
  assert.equal(tableContinuationTop(regions, [205, 143, 359, 622], 355), undefined, 'Never search beyond a known next boundary');
});
check('H-07 bare actual Q9 stem anchors its own table instead of the first grid on page', () => {
  const regions = JSON.parse(fs.readFileSync(path.join(__dirname, '../evidence/t121/set4/ocr-response.json')))[0].pageResults[2].textRegions;
  const page = parseExamText(fixture(4)).filter(item => item.sourcePage === 3);
  const questions = page.map(item => ({ questionNumber: item.questionNumber, stem: item.questionText }));
  const limits = figureVerticalLimits(9, [7, 8, 9], regions, true, [727, 113, 930, 891], questions);
  assert.ok(limits[0] > 700 && limits[0] < 730, 'Bare 9. is a real known question anchor; Q7 is above117 and excluded');
});
check('H-04 actual page-boundary choice has an explicit reviewable split', () => {
  const item = parseExamText(fixture(4)).find(item => item.questionNumber === 3 && item.choices.length);
  assert.equal(item.choices.map(choice => choice.key).join(''), 'กขคง');
  assert.equal(item.choices[2].keyInferred, true);
  assert.ok(item.choices[2].text.startsWith('อัตราการเคลื่อนที่'));
  assert.ok(!item.choices[1].text.includes('คลอไรด์ข้น'));
  assert.ok(validateExamItems([item]).some(issue => issue.includes('กู้คืน')));
});
check('H-04 ambiguous ordinary page continuation is retained, not guessed', () => {
  const item = parseExamText(`[PAGE 1]\n1. source\nก. one\nข. two\n[PAGE 2]\ncontinues two\nค. three\nง. four`)[0];
  assert.equal(item.choices[1].text, 'two continues two');
  assert.ok(!item.choices.some(choice => choice.keyInferred));
});
check('H-05 all seven actual five-choice questions validate without count errors', () => {
  const items = parseExamText(fixture(5));
  assert.deepEqual(items.filter(item => item.choices.length === 5).map(item => item.questionNumber), [5, 6, 7, 8, 13, 14, 19]);
  for (const item of items.filter(item => item.choices.length === 5)) {
    assert.ok(!validateExamItems([item]).some(issue => issue.includes('ครบและไม่ซ้ำ')));
    assert.equal(item.choices[4].key, 'จ');
  }
  const bad = parseExamText(`1. source\n${four}\nง. duplicate`)[0];
  assert.ok(validateExamItems([bad]).some(issue => issue.includes('ครบและไม่ซ้ำ')));
});
check('H-06 actual set5 confused Chinese and Thai keys recover only in sequence', () => {
  const items = parseExamText(fixture(5));
  for (const number of [2, 3]) {
    const item = items.find(item => item.questionNumber === number);
    assert.equal(item.choices.map(choice => choice.key).join(''), 'กขคง');
    assert.ok(item.choices.some(choice => choice.keyInferred));
  }
  const item = parseExamText(`1. source\nก. บริษัท ช. จำกัด\nข. สัญลักษณ์ 炅 ในข้อความ\nค. third\nง. fourth`)[0];
  assert.ok(item.choices[0].text.includes('ช. จำกัด'));
  assert.ok(item.choices[1].text.includes('炅'));
});
check('H-08 captured shared header is removed but experiment narrative stays', () => {
  const text = 'ใช้ข้อมูลต่อไปนี้ตอบคำถามข้อ 17-18\nทำการทดลองโดยเติมน้ำลงในสาร A\nสาร ผลการทดลอง\nA ได้ของเหลวใส ไม่มีสี\nB ได้ของเหลวสีฟ้า\nC ได้ของเหลวสีเหลือง';
  assert.equal(stripCapturedTableText(text), 'ใช้ข้อมูลต่อไปนี้ตอบคำถามข้อ 17-18\nทำการทดลองโดยเติมน้ำลงในสาร A');
  assert.equal(stripCapturedTableText('สาร ผลการทดลองต้องตรวจอีกครั้ง'), 'สาร ผลการทดลองต้องตรวจอีกครั้ง');
  assert.equal(stripCapturedTableText('intro\nสาร ผลการทดลองต้องตรวจอีกครั้ง'), 'intro\nสาร ผลการทดลองต้องตรวจอีกครั้ง', 'Match the actual header, not a narrative prefix');
});
check('H-07 actual table crops stop before the following question sentence', () => {
  const regions = JSON.parse(fs.readFileSync(path.join(__dirname, '../evidence/t121/set4/ocr-response.json')))[0].pageResults[1].textRegions;
  assert.equal(tableContinuationTop(regions, [204, 137, 385, 756]), regions.find(row => row.text.startsWith('สารใดที่')).bbox[0]);
  assert.equal(tableContinuationTop(regions, [599, 140, 840, 918]), regions.find(row => row.text.startsWith('เมื่อนำ สารละลาย')).bbox[0]);
});
check('H-06 Thai choices naming parenthesized samples do not duplicate rows', () => {
  const item = parseExamText('7. สารผสม\nก. (A) คือ Na2S2O3 + HCl ข. (B) คือ Na3PO4 + CaCl2\nค. (C) คือ KNO3 + BaCl2 ง. (C) คือ NaHCO3 + CH3COOH')[0];
  assert.equal(item.choices.map(choice => choice.key).join(''), 'กขคง');
  assert.ok(item.choices[0].text.startsWith('(A)'));
  const items = parseExamText(fixture(4));
  assert.equal(items.find(row => row.questionNumber === 7).choices.length, 4);
  for (const number of [20, 27]) assert.equal(items.find(row => row.questionNumber === number).choices.map(choice => choice.key).join(''), 'กขคง', 'Inline บ. is an evidenced misread ข.');
});
check('H-09 decomposed sara-am is canonical, semantic repairs are suggestions only', () => {
  assert.equal(normalizeThaiOcrText('นํ้าหอม น้ํา นําไป ทํา'), 'น้ำหอม น้ำ นำไป ทำ');
  assert.equal(normalizeThaiOcrText('กําลัง\nกํ\nาลัง'), 'กำลัง\nกํ\nาลัง');
  assert.equal(normalizeThaiOcrText('น่ามันเบนซิน ละลายนา'), 'น่ามันเบนซิน ละลายนา');
  assert.ok(suggestOcrWords('น่ามันเบนซิน ละลายนา').some(row => row.from === 'น่ามันเบนซิน' && row.to === 'น้ำมันเบนซิน'));
  assert.ok(suggestOcrWords('น่ามันเบนซิน ละลายนา').some(row => row.from === 'ละลายนา' && row.to === 'ละลายน้ำ'));
  assert.deepEqual(suggestOcrWords('ของเทค R₁₂'), [{ from: 'ของเทค', to: 'ของเหลว' }, { from: 'R₁₂', to: 'Rf' }]);
  assert.equal(normalizeThaiOcrText('ของเทค R₁₂'), 'ของเทค R₁₂', 'Source-checked semantic changes still require explicit confirmation');
});
if (process.env.T123_RESULT) fs.writeFileSync(process.env.T123_RESULT, JSON.stringify({ results, passed: results.every(row => row.passed) }, null, 2));
if (results.some(row => !row.passed)) process.exitCode = 1;
