// T-130: owner screenshot on 261017-1543 (chapter 7 set 2, Q5): choices printed as a table are rebuilt as choice text,
// but the same table was also attached as the question figure (Q8 even lost its real diagram to it). Replays recorded
// real responses (evidence/t121/t130-set2, no provider calls). Also checks the header has no visible status text and
// the one Drive/export control (locked -> ready with menu).
// Usage: E2E_BASE_URL=http://localhost:3000 node scripts/test-t130-choice-table.cjs
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const ts = require('typescript');
const { chromium } = require('playwright');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText, filename);
const { validateDetectedDiagrams } = require('../lib/diagram-service.ts');
const base = process.env.E2E_BASE_URL || 'http://localhost:3000';
const pdf = process.env.T130_PDF || 'C:/Users/natha/Downloads/บทที่ 7 ชุดที่ 2 เรื่อง การแยกสาร.pdf';
const dir = path.join(__dirname, '..', 'evidence', 't121', 't130-set2');
const out = path.join(__dirname, '..', 'evidence', 't130');
const read = name => JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8'));
const figures = editor => editor.evaluate(root => Object.fromEntries(Array.from(root.querySelectorAll('[data-item-id]')).flatMap(item => {
  const image = item.querySelector(':scope > [data-question-image] img');
  return image ? [[item.textContent.trim().match(/^\d+/)[0], JSON.parse(image.dataset.sourceBbox || 'null')]] : [];
})));
(async () => {
  if (!fs.existsSync(pdf)) { console.log('SKIP source PDF not on this machine'); return; }
  fs.mkdirSync(out, { recursive: true });
  const ocr = read('ocr-response.json'), diagrams = read('diagrams-response.json');
  const browser = await chromium.launch({ headless: true, channel: process.env.E2E_BROWSER_CHANNEL || 'msedge' });
  const page = await browser.newPage({ viewport: { width: 1912, height: 914 } });
  await page.route('**/api/ocr', route => { const count = route.request().postDataJSON().images.length; route.fulfill({ json: ocr.find(entry => entry.pageCount === count) || ocr[0] }); });
  await page.route('**/api/diagrams', route => { const body = route.request().postDataJSON(); const record = diagrams.find(entry => entry.page === body.page)?.body || { diagrams: [] }; route.fulfill({ json: { ...record, diagrams: validateDetectedDiagrams(record.diagrams, body.page) } }); });
  const editor = page.locator('[contenteditable="true"]');
  await page.goto(base); await page.waitForLoadState('networkidle');
  await page.locator('input[type=file]').setInputFiles(pdf);
  await page.getByRole('button', { name: 'แปลงเป็นรูปแบบข้อสอบ', exact: true }).click();
  await editor.locator('[data-item-id]').first().waitFor({ timeout: 180_000 });
  await page.getByRole('button', { name: 'สกัดรูปประกอบ (AI)', exact: true }).click();
  await page.getByRole('button', { name: 'สกัดรูปแล้ว (สกัดซ้ำได้)', exact: true }).waitFor({ timeout: 180_000 });
  await page.waitForTimeout(1000);
  // A. Choice tables are not question figures; real figures stay (Q8 keeps its diagram, not its choice table).
  const result = await figures(editor);
  assert.equal(result['5'], undefined, `Q5 choice table is not a question figure: ${JSON.stringify(result['5'])}`);
  assert.ok(result['8'] && result['8'][0] < 470, `Q8 keeps its diagram (top ${result['8']?.[0]}), not the choice table at 504`);
  // Q7 and Q10 print their choices as tables too (ธาตุ | สารประกอบ ..., เกณฑ์ | ตัวอย่างสาร).
  for (const number of ['7', '10']) assert.equal(result[number], undefined, `Q${number} choice table is not a question figure`);
  for (const number of ['16', '20', '22']) assert.ok(result[number], `Q${number} keeps its figure`);
  const q5 = editor.locator('[data-item-id]').filter({ hasText: /^\s*5\./ }).first();
  assert.equal(await q5.locator('[data-choice-key]').count(), 4, 'Q5 keeps four table-built choices');
  assert.match(await q5.locator('[data-choice-key="ก"]').innerText(), /การระเหย: ขั้นตอนที่ 1, 2; การตกผลึก: ขั้นตอนที่ 3/);
  await q5.scrollIntoViewIfNeeded(); await q5.screenshot({ path: path.join(out, 'q5-no-table-figure.png') });
  const q8 = editor.locator('[data-item-id]').filter({ hasText: /^\s*8\./ }).first();
  await q8.scrollIntoViewIfNeeded(); await q8.screenshot({ path: path.join(out, 'q8-diagram-kept.png') });
  // B. No visible status text in the header; the message stays in an sr-only live region.
  const status = page.locator('[data-layout="compact-status"]');
  assert.match(await status.getAttribute('aria-label'), /สกัดรูปประกอบ/);
  assert.equal(await status.evaluate(node => node.getBoundingClientRect().width <= 1), true, 'status text is not visible');
  assert.equal(await page.locator('.ui-notice').count(), 0);
  // C. Not connected: the one Drive control is locked, has no menu, and opens Drive setup.
  const control = page.locator('[data-export-control]');
  await page.waitForFunction(() => ['locked', 'checking'].includes(document.querySelector('[data-export-control]')?.dataset.exportStep || ''));
  assert.equal(await page.getByRole('button', { name: 'ตัวเลือก Google Drive', exact: true }).count(), 0, 'no menu before Drive is ready');
  assert.equal(await page.getByRole('button', { name: 'จัดการการเชื่อมต่อ Google Drive', exact: true }).isVisible(), false, 'no separate Drive status pill');
  await page.locator('header').screenshot({ path: path.join(out, 'header-locked.png') });
  // D. Draft saved by an older build with the choice table as Q5 figure: reopening removes it.
  await editor.evaluate(root => {
    const item = number => Array.from(root.querySelectorAll('[data-item-id]')).find(node => node.textContent.trim().startsWith(`${number}.`));
    const figure = item(16).querySelector(':scope > [data-question-image]').cloneNode(true);
    const image = figure.querySelector('img'); image.dataset.sourcePage = '1'; image.dataset.sourceBbox = JSON.stringify([679, 134, 822, 531]);
    const q5 = item(5); let host = q5.querySelector('[data-question-text]');
    while (host.parentElement !== q5) host = host.parentElement;
    host.after(figure);
  });
  assert.ok((await figures(editor))['5'], 'old-style Q5 figure injected');
  await page.getByRole('button', { name: 'บันทึกแบบร่าง', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('[data-draft-saved]')?.dataset.draftSaved === 'true');
  await page.reload();
  await page.getByRole('button', { name: `ทำต่อจากแบบร่าง ${path.basename(pdf)}`, exact: true }).click();
  await editor.locator('[data-item-id]').first().waitFor();
  await page.waitForTimeout(1500);
  const reopened = await figures(editor);
  assert.equal(reopened['5'], undefined, 'reopening an old draft removes the choice-table figure');
  assert.ok(reopened['8'] && reopened['16'], 'other figures stay after reopening');
  // E. Drive ready: the control exports, and its menu holds backup and Drive settings.
  await page.route('**/api/google/session', route => route.fulfill({ json: { configured: true, connected: true, folderReady: true, folderId: 'fixture' } }));
  await page.reload();
  await page.getByRole('button', { name: `ทำต่อจากแบบร่าง ${path.basename(pdf)}`, exact: true }).click();
  await editor.locator('[data-item-id]').first().waitFor();
  await page.waitForFunction(() => document.querySelector('[data-export-control]')?.dataset.exportStep === 'ready', null, { timeout: 15_000 });
  await page.getByRole('button', { name: 'ตัวเลือก Google Drive', exact: true }).click();
  const menu = page.getByRole('group', { name: 'เมนู Google Drive' });
  await menu.getByRole('button', { name: 'สำรองแบบร่างบน Drive', exact: true }).waitFor();
  await menu.getByRole('button', { name: 'จัดการการเชื่อมต่อ Google Drive', exact: true }).waitFor();
  assert.equal(await page.getByRole('button', { name: 'สำรองแบบร่างบน Drive', exact: true }).count(), 1, 'backup appears once (menu only)');
  await page.screenshot({ path: path.join(out, 'drive-menu-ready.png'), clip: { x: 958, y: 50, width: 954, height: 260 } });
  await page.keyboard.press('Escape');
  await menu.waitFor({ state: 'hidden' });
  await control.screenshot({ path: path.join(out, 'export-ready.png') });
  await browser.close();
  console.log(`T-130 passed: Q5 choice table not captured, Q8 keeps its diagram, old draft cleaned on reopen, header status hidden, one Drive control (locked/ready+menu). Figures ${JSON.stringify(Object.keys(result))}`);
})().catch(error => { console.error(error); process.exit(1); });
