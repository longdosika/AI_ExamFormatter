// T-124: a draft saved by an older build (owner screenshots on 261017-1101) keeps table rows / figure labels in
// stems and old crops. Reopening must clean the stems from stored OCR geometry, and the review bar must offer to
// re-crop the old figures from the original. Replays the recorded real chapter-7 set-3 responses (no provider calls).
// Usage: E2E_BASE_URL=http://localhost:3000 node scripts/test-t124-stale-draft.cjs
require('./e2e-import-helper.cjs'); // T-128: answer the duplicate-import dialog with "นำเข้าใหม่"
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const ts = require('typescript');
const { chromium } = require('playwright');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText, filename);
const { validateDetectedDiagrams } = require('../lib/diagram-service.ts');
const { validTextRegions } = require('../lib/capture-geometry.ts');
const { normalizeThaiOcrText } = require('../lib/text-normalization.ts');
const base = process.env.E2E_BASE_URL || 'http://localhost:3000';
const pdf = process.env.T121_PDF || 'C:/Users/natha/Downloads/บทที่ 7 ชุดที่ 3 เรื่อง การแยกสาร.pdf';
const dir = path.join(__dirname, '..', 'evidence', 't121', 'audit-answers-fixed');
const out = path.join(__dirname, '..', 'evidence', 't124');
const read = name => JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8'));
(async () => {
  if (!fs.existsSync(pdf)) { console.log('SKIP source PDF not on this machine'); return; }
  fs.mkdirSync(out, { recursive: true });
  const ocr = read('ocr-response.json'), diagrams = read('diagrams-response.json');
  // Q6 table rows as an old build flattened them into the stem (exact OCR lines inside the Q6 box).
  const q6Box = validateDetectedDiagrams(diagrams.find(entry => entry.page === 1).body.diagrams, 1).find(entry => entry.questionNumber === 6).bbox;
  const q6Rows = validTextRegions(ocr[0].pageResults[0].textRegions).filter(row => row.bbox[0] >= q6Box[0] && row.bbox[1] >= q6Box[1] && row.bbox[2] <= q6Box[2] && row.bbox[3] <= q6Box[3])
    .sort((a, b) => a.bbox[0] - b.bbox[0]).map(row => normalizeThaiOcrText(row.text).trim());
  const browser = await chromium.launch({ headless: true, channel: process.env.E2E_BROWSER_CHANNEL || 'msedge' });
  const page = await browser.newPage({ viewport: { width: 1912, height: 914 } });
  let ocrCall = 0;
  await page.route('**/api/ocr', route => route.fulfill({ json: ocr[Math.min(ocrCall++, ocr.length - 1)] }));
  await page.route('**/api/diagrams', route => { const body = route.request().postDataJSON(); const record = diagrams.find(entry => entry.page === body.page)?.body || { diagrams: [] }; route.fulfill({ json: { ...record, diagrams: validateDetectedDiagrams(record.diagrams, body.page) } }); });
  await page.goto(base);
  await page.waitForLoadState('networkidle');
  await page.locator('input[type=file]').setInputFiles(pdf);
  await page.getByRole('button', { name: 'แปลงเป็นรูปแบบข้อสอบ', exact: true }).click();
  const editor = page.locator('[contenteditable="true"]');
  await editor.locator('[data-item-id]').first().waitFor({ timeout: 180_000 });
  await page.getByRole('button', { name: 'สกัดรูปประกอบ (AI)', exact: true }).click();
  await page.getByRole('button', { name: 'สกัดรูปแล้ว (สกัดซ้ำได้)', exact: true }).waitFor({ timeout: 180_000 });
  const fresh = await editor.evaluate(root => Object.fromEntries(Array.from(root.querySelectorAll('[data-item-id]')).flatMap(item => {
    const image = item.querySelector(':scope > [data-question-image] img');
    return image ? [[item.textContent.trim().match(/^\d+/)[0], image.naturalWidth]] : [];
  })));
  // Turn the fresh result into a draft as older builds saved it.
  await editor.evaluate((root, q6Rows) => {
    const item = number => Array.from(root.querySelectorAll('[data-item-id]')).find(node => node.textContent.trim().startsWith(`${number}.`));
    const stem = number => item(number).querySelector('[data-question-text]');
    stem(8).append(' D สี C สี B สี A สาร ก');
    const q21 = stem(21), first = q21.firstChild;
    for (const row of ['สาร สถานะ การละลาย จุดเดือด (°C)', 'เอทานอล', 'A ของแข็ง ไม่ละลาย ไม่ละลาย 825', 'B ของแข็ง ไม่ละลาย ละลาย 218'].reverse()) { first.after(document.createElement('br'), row); }
    const q6 = stem(6); q6.firstChild.textContent += ' ' + q6Rows.join(' ');
    root.querySelectorAll('[data-question-image] img, [data-shared-image] img').forEach(image => image.removeAttribute('data-crop-version'));
    // Old Q21 crop cut off on the right.
    const image = item(21).querySelector('[data-question-image] img'), canvas = document.createElement('canvas');
    canvas.width = Math.round(image.naturalWidth * 0.7); canvas.height = image.naturalHeight;
    canvas.getContext('2d').drawImage(image, 0, 0); image.src = canvas.toDataURL('image/png');
  }, q6Rows);
  await page.getByRole('button', { name: 'บันทึกแบบร่าง', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('[data-draft-saved]')?.dataset.draftSaved === 'true');
  await page.reload();
  await page.getByRole('button', { name: `ทำต่อจากแบบร่าง ${path.basename(pdf)}`, exact: true }).click();
  await editor.locator('[data-item-id]').first().waitFor();
  await page.waitForTimeout(1500);
  const stems = await editor.evaluate(root => Object.fromEntries(Array.from(root.querySelectorAll('[data-item-id]')).map(item => [item.textContent.trim().match(/^\d+/)[0], item.querySelector('[data-question-text]')?.innerText || ''])));
  assert.match(stems[8], /ข้อสรุปใดถูกต้อง$/, 'Q8 figure labels removed on reopen');
  assert.ok(!/825|218|เอทานอล\n/.test(stems[21]) && /วิธีการแยกสารเนื้อผสม/.test(stems[21]), `Q21 table rows removed, question kept: ${JSON.stringify(stems[21])}`);
  assert.ok(!stems[6].includes('ของเทค') && /ออกจากน้ำได้ด้วยวิธีการใด/.test(stems[6]), `Q6 flattened rows removed: ${JSON.stringify(stems[6])}`);
  const action = page.getByRole('button', { name: /^ตัดรูปใหม่จากต้นฉบับ \d+ รูป$/ });
  const review = page.locator('details', { has: page.locator('summary', { hasText: 'ต้องตรวจแก้' }) });
  if (!(await review.evaluate(node => node.open))) await review.locator('summary').click();
  await action.waitFor({ timeout: 10_000 });
  const stale = Number((await action.getAttribute('aria-label')).match(/\d+/)[0]);
  assert.ok(stale >= 5, `old figures listed: ${stale}`);
  await page.screenshot({ path: path.join(out, 'stale-draft-review.png'), clip: { x: 958, y: 60, width: 954, height: 300 } });
  await action.click();
  await page.waitForFunction(() => !document.querySelector('[aria-label^="ตัดรูปใหม่จากต้นฉบับ"]'), null, { timeout: 60_000 });
  const after = await editor.evaluate(root => Object.fromEntries(Array.from(root.querySelectorAll('[data-item-id]')).flatMap(item => {
    const image = item.querySelector(':scope > [data-question-image] img');
    return image ? [[item.textContent.trim().match(/^\d+/)[0], { width: image.naturalWidth, version: image.dataset.cropVersion }]] : [];
  })));
  for (const [number, entry] of Object.entries(after)) {
    assert.equal(entry.version, '2', `Q${number} re-cropped`);
    assert.ok(Math.abs(entry.width - fresh[number]) <= Math.max(12, fresh[number] * 0.06), `Q${number} width ${entry.width} close to a fresh crop ${fresh[number]}`);
  }
  for (const [number, src] of Object.entries(await editor.evaluate(root => Object.fromEntries(Array.from(root.querySelectorAll('[data-item-id]')).flatMap(item => { const image = item.querySelector(':scope > [data-question-image] img'); return image ? [[item.textContent.trim().match(/^\d+/)[0], image.src]] : []; }))))) {
    if (src.startsWith('data:image/png;base64,')) fs.writeFileSync(path.join(out, `recropped-q${number}.png`), Buffer.from(src.split(',')[1], 'base64'));
  }
  await browser.close();
  console.log(`T-124 stale draft passed: stems cleaned on reopen, ${stale} old figures re-cropped (${JSON.stringify(after)})`);
})().catch(error => { console.error(error); process.exit(1); });
