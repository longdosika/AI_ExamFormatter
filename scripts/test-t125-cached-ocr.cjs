// T-125: owner screenshots on 261017-1152 showed Q6/Q21 table rows in the stem, Q6's crop including its stem line and
// Q21 cut on the right, while fresh-profile runs were clean. Cause: a saved draft for the same file supplied OCR text
// without line geometry, so harvesting ran without stem limits and without duplicate-text removal.
// This test replays recorded real responses (evidence/t121/t125-live1, gemini-flash-lite) in that situation.
// Usage: E2E_BASE_URL=http://localhost:3000 node scripts/test-t125-cached-ocr.cjs
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const ts = require('typescript');
const { chromium } = require('playwright');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText, filename);
const { validateDetectedDiagrams } = require('../lib/diagram-service.ts');
const base = process.env.E2E_BASE_URL || 'http://localhost:3000';
const pdf = process.env.T121_PDF || 'C:/Users/natha/Downloads/บทที่ 7 ชุดที่ 3 เรื่อง การแยกสาร.pdf';
const dir = path.join(__dirname, '..', 'evidence', 't121', 't125-live1');
const out = path.join(__dirname, '..', 'evidence', 't125');
const read = name => JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8'));
const figures = editor => editor.evaluate(root => Object.fromEntries(Array.from(root.querySelectorAll('[data-item-id]')).flatMap(item => {
  const image = item.querySelector(':scope > [data-question-image] img');
  return image ? [[item.textContent.trim().match(/^\d+/)[0], { width: image.naturalWidth, height: image.naturalHeight, stem: item.querySelector('[data-question-text]')?.innerText || '' }]] : [];
})));
(async () => {
  if (!fs.existsSync(pdf)) { console.log('SKIP source PDF not on this machine'); return; }
  fs.mkdirSync(out, { recursive: true });
  const ocr = read('ocr-response.json'), diagrams = read('diagrams-response.json');
  const browser = await chromium.launch({ headless: true, channel: process.env.E2E_BROWSER_CHANNEL || 'msedge' });
  const page = await browser.newPage({ viewport: { width: 1912, height: 914 } });
  let ocrCalls = 0;
  await page.route('**/api/ocr', route => { const count = route.request().postDataJSON().images.length; const batch = ocr.find(entry => entry.pageCount === count) || ocr[0]; ocrCalls++; route.fulfill({ json: batch }); });
  await page.route('**/api/diagrams', route => { const body = route.request().postDataJSON(); const record = diagrams.find(entry => entry.page === body.page)?.body || { diagrams: [] }; route.fulfill({ json: { ...record, diagrams: validateDetectedDiagrams(record.diagrams, body.page) } }); });
  const editor = page.locator('[contenteditable="true"]');
  // T-128: a second import of the same file asks first; this path re-imports on purpose.
  const duplicate = page.getByRole('alertdialog', { name: 'ไฟล์นี้เคยนำเข้าแล้ว' });
  const convert = async () => {
    await page.locator('input[type=file]').setInputFiles(pdf);
    const convertButton = page.getByRole('button', { name: 'แปลงเป็นรูปแบบข้อสอบ', exact: true });
    await Promise.race([duplicate.waitFor(), convertButton.waitFor()]);
    if (await duplicate.isVisible()) await duplicate.getByRole('button', { name: 'นำเข้าใหม่', exact: true }).click();
    await convertButton.click();
    await editor.locator('[data-item-id]').first().waitFor({ timeout: 180_000 });
  };
  const harvest = async () => {
    const button = page.getByRole('button', { name: /^สกัดรูปประกอบ \(AI\)$|^สกัดรูปแล้ว \(สกัดซ้ำได้\)$/ }).first();
    await button.click();
    await page.getByRole('button', { name: 'สกัดรูปแล้ว (สกัดซ้ำได้)', exact: true }).waitFor({ timeout: 180_000 });
    await page.waitForTimeout(1500);
  };
  const checkClean = (label, result, fresh) => {
    for (const number of ['6', '21']) {
      assert.ok(result[number], `${label}: Q${number} has a figure`);
      assert.ok(!/ของแข็ง|ของเทค|825|218|สารประกอบ สถาน/.test(result[number].stem), `${label}: Q${number} stem has no table rows: ${JSON.stringify(result[number].stem)}`);
    }
    for (const [number, entry] of Object.entries(fresh)) {
      assert.ok(Math.abs(result[number].width - entry.width) <= Math.max(12, entry.width * 0.06) && Math.abs(result[number].height - entry.height) <= Math.max(12, entry.height * 0.08),
        `${label}: Q${number} crop ${result[number].width}x${result[number].height} matches the fresh crop ${entry.width}x${entry.height}`);
    }
  };
  // 1. Fresh profile: OCR with geometry, harvest, save. This is the reference result.
  await page.goto(base); await page.waitForLoadState('networkidle');
  await convert(); await harvest();
  const fresh = await figures(editor);
  checkClean('fresh', fresh, {});
  await page.getByRole('button', { name: 'บันทึกแบบร่าง', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('[data-draft-saved]')?.dataset.draftSaved === 'true');
  // 2. Make the saved draft look like one written before OCR geometry was stored.
  await page.evaluate(() => {
    const key = 'exam-formatter-document-drafts-v1';
    const drafts = JSON.parse(localStorage.getItem(key) || '[]');
    for (const draft of Array.isArray(drafts) ? drafts : drafts.drafts || []) delete draft.ocrTextRegions;
    localStorage.setItem(key, JSON.stringify(drafts));
  });
  // A. Convert the same file again (the owner's path): OCR must run again for geometry.
  await page.reload(); await page.waitForLoadState('networkidle');
  const before = ocrCalls;
  await convert(); await harvest();
  if (!process.env.T125_SHOW_SYMPTOM) assert.ok(ocrCalls > before, 'cached OCR text without geometry is not reused');
  checkClean('reconvert', await figures(editor), fresh);
  // B. Resume the old draft and harvest again: geometry is fetched before capture.
  await page.evaluate(() => {
    const key = 'exam-formatter-document-drafts-v1';
    const drafts = JSON.parse(localStorage.getItem(key) || '[]');
    for (const draft of Array.isArray(drafts) ? drafts : drafts.drafts || []) delete draft.ocrTextRegions;
    localStorage.setItem(key, JSON.stringify(drafts));
  });
  await page.reload(); await page.waitForLoadState('networkidle');
  await page.locator('input[type=file]').setInputFiles(pdf);
  await duplicate.getByRole('button', { name: 'ทำต่อจากแบบร่างเดิม', exact: true }).click();
  await editor.locator('[data-item-id]').first().waitFor({ timeout: 60_000 });
  const beforeResume = ocrCalls;
  await harvest();
  assert.ok(ocrCalls > beforeResume, 'geometry is read before harvesting a draft without it');
  const resumed = await figures(editor);
  checkClean('resumed', resumed, fresh);
  for (const [number, entry] of Object.entries(await editor.evaluate(root => Object.fromEntries(Array.from(root.querySelectorAll('[data-item-id]')).flatMap(item => { const image = item.querySelector(':scope > [data-question-image] img'); return image ? [[item.textContent.trim().match(/^\d+/)[0], image.src]] : []; }))))) {
    if (entry.startsWith('data:image/png;base64,')) fs.writeFileSync(path.join(out, `resumed-q${number}.png`), Buffer.from(entry.split(',')[1], 'base64'));
  }
  await browser.close();
  console.log(`T-125 cached OCR without geometry passed: reconvert and resumed harvest match fresh crops ${JSON.stringify(Object.fromEntries(Object.entries(resumed).map(([n, e]) => [n, `${e.width}x${e.height}`])))}`);
})().catch(error => { console.error(error); process.exit(1); });
