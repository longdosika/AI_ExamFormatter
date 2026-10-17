// T-121 (B-25/B-27): replay the real chapter-7 set-3 responses recorded on 2026-10-17 with gemini-3.8-flash
// (evidence/t121/audit-answers-fixed) through the app without provider calls, then check that source-read
// answers are labelled as source answers and that the chip preview shows the crop of the original mark.
// Usage: E2E_BASE_URL=http://localhost:3121 node scripts/test-t121-source-marks-ui.cjs
require('./e2e-import-helper.cjs'); // T-128: answer the duplicate-import dialog with "นำเข้าใหม่"
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, filename);
// Recorded bodies pass through the current server validator, as a live /api/diagrams response would.
const { validateDetectedDiagrams } = require('../lib/diagram-service.ts');
const base = process.env.E2E_BASE_URL || 'http://localhost:3000';
const pdf = process.env.T121_PDF || 'C:/Users/natha/Downloads/บทที่ 7 ชุดที่ 3 เรื่อง การแยกสาร.pdf';
const dir = path.join(__dirname, '..', 'evidence', 't121', 'audit-answers-fixed');
const read = name => JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8'));
(async () => {
  if (!fs.existsSync(pdf)) { console.log('SKIP source PDF not on this machine'); return; }
  const ocr = read('ocr-response.json'), diagrams = read('diagrams-response.json'), answers = read('answers-response.json');
  const browser = await chromium.launch({ headless: true, channel: process.env.E2E_BROWSER_CHANNEL || 'msedge' });
  const page = await browser.newPage({ viewport: { width: 1912, height: 914 } });
  let ocrCall = 0;
  await page.route('**/api/ocr', route => route.fulfill({ json: ocr[Math.min(ocrCall++, ocr.length - 1)] }));
  await page.route('**/api/diagrams', route => { const body = route.request().postDataJSON(); const record = diagrams.find(entry => entry.page === (body.page ?? body.pageNumber))?.body || { diagrams: [] }; route.fulfill({ json: { ...record, diagrams: validateDetectedDiagrams(record.diagrams, body.page) } }); });
  for (const kind of ['source-answers', 'ai-answers']) {
    await page.route(`**/api/${kind}`, route => { const body = route.request().postDataJSON(); route.fulfill({ json: answers.find(entry => entry.url === kind && entry.page === body.page)?.body || { answers: [] } }); });
  }
  await page.goto(base);
  await page.waitForLoadState('networkidle');
  await page.locator('input[type=file]').setInputFiles(pdf);
  await page.getByRole('button', { name: 'แปลงเป็นรูปแบบข้อสอบ', exact: true }).click();
  const nav = page.getByRole('navigation', { name: 'เลือกข้อสอบ' });
  await nav.waitFor({ timeout: 180_000 });
  await page.getByRole('button', { name: 'สกัดรูปประกอบ (AI)', exact: true }).click();
  await page.getByRole('button', { name: 'สกัดรูปแล้ว (สกัดซ้ำได้)', exact: true }).waitFor({ timeout: 180_000 }).catch(async error => { await page.screenshot({ path: path.join(dir, 'replay-failure.png') }); throw error; });
  await page.getByRole('button', { name: 'วิเคราะห์เฉลยจากต้นฉบับและ AI', exact: true }).click();
  await page.waitForFunction(() => document.querySelectorAll('[data-answer-origin="source_provided"]').length >= 11, null, { timeout: 180_000 });
  const origins = await page.$$eval('[data-answer-origin]', rows => rows.reduce((counts, row) => ({ ...counts, [row.dataset.answerOrigin]: (counts[row.dataset.answerOrigin] || 0) + 1 }), {}));
  assert.equal(origins.source_provided, 11, 'eleven circled keys read from the original');
  await nav.locator('[data-nav-gap="1"][aria-expanded="false"]').click();
  await page.waitForTimeout(500);
  const chip = nav.getByRole('button', { name: 'ไปข้อ 4', exact: true });
  await chip.hover();
  const mark = page.getByAltText('รอยวงคำตอบในต้นฉบับ');
  await mark.waitFor({ timeout: 10_000 });
  const size = await mark.evaluate(image => [image.naturalWidth, image.naturalHeight]);
  assert.ok(size[0] > 8 && size[1] > 8, 'mark crop is an image of the original');
  await page.screenshot({ path: path.join(dir, 'source-mark-preview.png'), clip: { x: 958, y: 60, width: 954, height: 420 } });
  // Master-template order in the editor: stem -> figure -> choices for every question with a figure (owner screenshot 2026-10-17).
  const order = await page.$$eval('[contenteditable="true"] [data-item-id]', items => items.filter(item => item.querySelector(':scope > [data-question-image] img')).map(item => {
    const figure = item.querySelector(':scope > [data-question-image]');
    const choice = item.querySelector('[data-choice-key]');
    return { text: item.textContent.trim().slice(0, 4), figureFirst: Boolean(choice && (figure.compareDocumentPosition(choice) & Node.DOCUMENT_POSITION_FOLLOWING)) };
  }));
  assert.ok(order.length >= 5 && order.every(entry => entry.figureFirst), `figures precede choices: ${JSON.stringify(order)}`);
  for (const number of [6, 8]) {
    await page.mouse.move(10, 10);
    await nav.getByRole('button', { name: `ไปข้อ ${number}`, exact: true }).click();
    await page.waitForTimeout(700);
    await page.screenshot({ path: path.join(dir, `template-order-q${number}.png`), clip: { x: 958, y: 180, width: 954, height: 730 } });
  }
  await browser.close();
  console.log(`T-121 template order: ${order.length} figure questions, figure before choices`);
  console.log(`T-121 source-mark replay passed: ${JSON.stringify(origins)}, Q4 preview ${size.join('x')}`);
})().catch(error => { console.error(error); process.exit(1); });
