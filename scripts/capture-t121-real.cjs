// T-121: run the owner's real chapter-7 PDF through live OCR + diagram harvest and keep the raw responses as a fixture.
// Usage: E2E_BASE_URL=http://127.0.0.1:3000 T121_PDF="C:/path/file.pdf" node scripts/capture-t121-real.cjs
const fs = require('node:fs');
const path = require('node:path');
let playwright;
try { playwright = require('playwright'); } catch { playwright = require('C:/Users/nathaphat/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'); }
const base = process.env.E2E_BASE_URL || 'http://localhost:3000';
const pdf = process.env.T121_PDF;
const outDir = path.join(__dirname, '..', 'evidence', 't121', process.env.T121_RUN || '');
const skipDiagrams = process.env.T121_SKIP_DIAGRAMS === '1';
(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await playwright.chromium.launch({ headless: true, channel: process.env.E2E_BROWSER_CHANNEL || 'msedge' });
  const page = await browser.newPage({ viewport: { width: 1912, height: 914 } });
  const diagrams = []; const ocr = []; const answers = [];
  page.on('response', async response => {
    const url = response.url();
    try {
      if (url.endsWith('/api/ocr')) { ocr.push(await response.json()); fs.writeFileSync(path.join(outDir, 'ocr-response.json'), JSON.stringify(ocr, null, 1)); }
      if (/(source|ai)-answers$/.test(url)) { const request = response.request().postDataJSON(); answers.push({ url: url.split('/').pop(), page: request.page, status: response.status(), body: await response.json() }); fs.writeFileSync(path.join(outDir, 'answers-response.json'), JSON.stringify(answers, null, 1)); }
      if (url.endsWith('/api/diagrams')) { const request = response.request().postDataJSON(); diagrams.push({ page: request.page ?? request.pageNumber, status:response.status(), body: await response.json() }); fs.writeFileSync(path.join(outDir,'diagrams-response.json'),JSON.stringify(diagrams,null,1)); }
    } catch (error) { console.error('capture', url, error.message); }
  });
  await page.goto(base);
  await page.waitForLoadState('networkidle');
  if (process.env.T121_INK === 'off') { await page.evaluate(() => localStorage.setItem('exam-formatter-ocr-ink-filter', 'off')); await page.reload(); await page.waitForLoadState('networkidle'); }
  await page.locator('input[type=file]').setInputFiles(pdf);
  await page.getByRole('button', { name: 'แปลงเป็นรูปแบบข้อสอบ', exact: true }).click();
  await page.getByRole('navigation', { name: 'เลือกข้อสอบ' }).waitFor({ timeout: 600_000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(outDir, 'converted.png') });
  if (!skipDiagrams) {
    await page.getByRole('button', { name: 'สกัดรูปประกอบ (AI)', exact: true }).click();
    await page.locator('[data-step="diagrams"]:not(:disabled)').waitFor({ timeout: 900_000 });
    await page.waitForTimeout(1500);
    fs.writeFileSync(path.join(outDir, 'diagrams-response.json'), JSON.stringify(diagrams, null, 1));
  }
  if (process.env.T121_ANSWERS === '1') {
    await page.getByRole('button', { name: 'วิเคราะห์เฉลยจากต้นฉบับและ AI', exact: true }).click();
    await page.waitForFunction(() => !document.querySelector('[aria-label="กำลังวิเคราะห์เฉลย…"]'), null, { timeout: 900_000 });
    await page.waitForTimeout(2000);
    // B-27: hovering a source-answered chip shows the crop of the original mark.
    const nav = page.getByRole('navigation', { name: 'เลือกข้อสอบ' });
    await nav.getByRole('button', { name: 'ไปข้อ 4', exact: true }).hover();
    await page.waitForTimeout(1500);
    const mark = page.getByAltText('รอยวงคำตอบในต้นฉบับ');
    console.log('source-mark-preview', await mark.count());
    await page.screenshot({ path: path.join(outDir, 'source-mark-preview.png'), clip: { x: 958, y: 60, width: 954, height: 420 } });
  }
  const html = await page.locator('[contenteditable="true"]').first().innerHTML();
  fs.writeFileSync(path.join(outDir, 'editor.html'), html);
  const text = await page.locator('[contenteditable="true"]').first().innerText();
  fs.writeFileSync(path.join(outDir, 'editor.txt'), text);
  await page.screenshot({ path: path.join(outDir, 'harvested.png') });
  console.log(JSON.stringify({ diagrams: diagrams.length, textChars: text.length }));
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
