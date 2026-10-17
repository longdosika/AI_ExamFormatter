// T-128: duplicate-import dialog (renamed copies found by SHA-256), draft progress, four latest drafts, export
// file name "[original]_[yymmdd-hhmm].docx" and the compact Drive status in the header. Recorded responses only.
// Usage: E2E_BASE_URL=http://localhost:3000 node scripts/test-t128-duplicate-import.cjs
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const ts = require('typescript');
const { chromium } = require('playwright');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText, filename);
const { validateDetectedDiagrams } = require('../lib/diagram-service.ts');
const base = process.env.E2E_BASE_URL || 'http://localhost:3000';
const pdf = process.env.T121_PDF || 'C:/Users/natha/Downloads/บทที่ 7 ชุดที่ 3 เรื่อง การแยกสาร.pdf';
const dir = path.join(__dirname, '..', 'evidence', 't121', 'audit-answers-fixed');
const out = path.join(__dirname, '..', 'evidence', 't128');
const read = name => JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8'));
(async () => {
  if (!fs.existsSync(pdf)) { console.log('SKIP source PDF not on this machine'); return; }
  fs.mkdirSync(out, { recursive: true });
  const ocr = read('ocr-response.json'), diagrams = read('diagrams-response.json');
  const bytes = fs.readFileSync(pdf);
  const browser = await chromium.launch({ headless: true, channel: process.env.E2E_BROWSER_CHANNEL || 'msedge' });
  const page = await browser.newPage({ viewport: { width: 1912, height: 914 }, acceptDownloads: true });
  let ocrCall = 0, hashLookups = 0;
  await page.route('**/api/google/session', route => route.fulfill({ json: { configured: true, connected: true, folderReady: true, folderId: 'fixture' } }));
  await page.route('**/api/google/library?hash=*', route => { hashLookups++; route.fulfill({ json: { collection: null } }); });
  await page.route('**/api/ocr', route => route.fulfill({ json: ocr[Math.min(ocrCall++, ocr.length - 1)] }));
  await page.route('**/api/diagrams', route => { const body = route.request().postDataJSON(); const record = diagrams.find(e => e.page === body.page)?.body || { diagrams: [] }; route.fulfill({ json: { ...record, diagrams: validateDetectedDiagrams(record.diagrams, body.page) } }); });
  const editor = page.locator('[contenteditable="true"]');
  const dialog = page.getByRole('alertdialog', { name: 'ไฟล์นี้เคยนำเข้าแล้ว' });
  const upload = name => page.locator('input[type=file]').setInputFiles({ name, mimeType: 'application/pdf', buffer: bytes });
  await page.goto(base); await page.waitForLoadState('networkidle');
  // Header: compact Drive status replaces the tagline; no separate connection card.
  const chip = page.locator('header').getByRole('group', { name: 'การเชื่อมต่อ Google Drive' });
  await chip.waitFor();
  await chip.getByText('Drive · AI_ExamFormatter').waitFor({ timeout: 15_000 });
  assert.equal(await page.locator('section[aria-label="การเชื่อมต่อ Google Drive"]').count(), 0, 'no separate Drive card on the import screen');
  await page.screenshot({ path: path.join(out, 'header.png'), clip: { x: 0, y: 0, width: 1912, height: 120 } });
  // 1. First import: no dialog; convert, capture figures, save, export (download name).
  await upload(path.basename(pdf));
  await page.getByRole('button', { name: 'แปลงเป็นรูปแบบข้อสอบ', exact: true }).click();
  await editor.locator('[data-item-id]').first().waitFor({ timeout: 180_000 });
  assert.equal(await dialog.count(), 0, 'a new file imports without a prompt');
  await page.getByRole('button', { name: 'สกัดรูปประกอบ (AI)', exact: true }).click();
  await page.getByRole('button', { name: 'สกัดรูปแล้ว (สกัดซ้ำได้)', exact: true }).waitFor({ timeout: 180_000 });
  await page.getByRole('button', { name: 'บันทึกแบบร่าง', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('[data-draft-saved]')?.dataset.draftSaved === 'true');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'ดาวน์โหลด DOCX', exact: true }).click();
  const confirm = page.getByRole('button', { name: 'ส่งออกเลย', exact: true }); if (await confirm.isVisible().catch(() => false)) await confirm.click();
  assert.match((await download).suggestedFilename(), /^บทที่ 7 ชุดที่ 3 เรื่อง การแยกสาร_\d{6}-\d{4}\.docx$/, 'export is [original]_[yymmdd-hhmm].docx');
  // 2. A renamed copy (same bytes) is recognised: the dialog shows the draft's progress; cancel keeps the import screen.
  await page.goto(base); await page.waitForLoadState('networkidle');
  await upload('สำเนาเปลี่ยนชื่อ.pdf');
  await dialog.waitFor();
  const dialogText = await dialog.innerText();
  assert.match(dialogText, /สำเนาเปลี่ยนชื่อ\.pdf/);
  assert.match(dialogText, /แปลงแล้ว/); assert.match(dialogText, /สกัดรูปแล้ว/); assert.match(dialogText, /เฉลย \d+\/25/); assert.match(dialogText, /ส่งออกแล้ว/);
  assert.ok(hashLookups > 0, 'the Drive library is asked by hash');
  await page.screenshot({ path: path.join(out, 'duplicate-dialog.png') });
  await dialog.getByRole('button', { name: 'ยกเลิก', exact: true }).click();
  await dialog.waitFor({ state: 'detached' });
  assert.equal(await editor.count(), 0, 'cancel imports nothing');
  // 3. Continue the previous draft.
  await upload('สำเนาเปลี่ยนชื่อ.pdf');
  await dialog.getByRole('button', { name: 'ทำต่อจากแบบร่างเดิม', exact: true }).click();
  await editor.locator('[data-item-id]').first().waitFor({ timeout: 60_000 });
  assert.equal(await editor.locator('[data-item-id]').count(), 25, 'the saved draft opens');
  // 4. Import anew.
  await page.goto(base); await page.waitForLoadState('networkidle');
  await upload(path.basename(pdf));
  await dialog.getByRole('button', { name: 'นำเข้าใหม่', exact: true }).click();
  await page.getByRole('button', { name: 'แปลงเป็นรูปแบบข้อสอบ', exact: true }).waitFor({ timeout: 60_000 });
  // 5. Landing shows at most four drafts, each with progress.
  await page.evaluate(() => {
    const key = 'exam-formatter-document-drafts-v1', parsed = JSON.parse(localStorage.getItem(key));
    for (let index = 0; index < 4; index++) parsed.drafts.push({ ...parsed.drafts[0], editorHtml: '', formattedItems: [], ocrText: '1. extra', ocrTextRegions: undefined, id: `draft-extra-${index}`, docKey: `extra-${index}`, fileName: `extra-${index}.pdf`, sourceHash: null, updatedAt: new Date(Date.now() - (index + 1) * 60000).toISOString() });
    localStorage.setItem(key, JSON.stringify(parsed));
  });
  await page.goto(base); await page.waitForLoadState('networkidle');
  const recent = page.locator('section[aria-labelledby="recent-drafts-title"] > ul > li');
  await recent.first().waitFor();
  assert.equal(await recent.count(), 4, 'four latest drafts');
  assert.equal(await recent.first().locator('.draft-progress li').count(), 4, 'each draft shows its steps');
  await page.screenshot({ path: path.join(out, 'landing.png') });
  await browser.close();
  console.log('T-128 duplicate import (renamed copy, cancel/resume/new), draft progress, four drafts, export name and header Drive status passed');
})().catch(error => { console.error(error); process.exit(1); });
