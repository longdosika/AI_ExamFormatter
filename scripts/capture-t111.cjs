// T-111 evidence: header draft chip and folding notice, recent drafts on the upload screen, darkened crop frame,
// current-question pill and the clickable next step. Usage: E2E_BASE_URL=http://127.0.0.1:3000 node scripts/capture-t111.cjs
const fs = require('node:fs');
const path = require('node:path');
let playwright;
try { playwright = require('playwright'); } catch { playwright = require('C:/Users/nathaphat/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'); }

const base = process.env.E2E_BASE_URL || 'http://localhost:3000';
const out = name => path.join(__dirname, '..', 'evidence', name);
const fixture = Array.from({ length: 40 }, (_, i) => `${i + 1}. โจทย์การแยกสารข้อที่ ${i + 1}\nก. ตัวเลือกแรก${i % 3 === 0 ? ' *' : ''}\nข. ตัวเลือกที่สอง\nค. ตัวเลือกที่สาม\nง. ตัวเลือกที่สี่`).join('\n\n');
const pdfFixture = path.join(__dirname, '..', 'evidence', 't047-12-page-fixture.pdf');

(async () => {
  const browser = await playwright.chromium.launch({ headless: true, channel: process.env.E2E_BROWSER_CHANNEL || 'msedge' });
  const page = await browser.newPage({ viewport: { width: 1912, height: 914 } });
  await page.goto(base);
  const upload = async () => page.locator('input[type=file]').setInputFiles({ name: 'บทที่ 7 ชุดที่ 2 เรื่อง การแยกสาร.md', mimeType: 'text/markdown', buffer: Buffer.from(fixture) });
  await upload();
  await page.getByRole('button', { name: 'แปลงเป็นรูปแบบข้อสอบ', exact: true }).click();
  const nav = page.getByRole('navigation', { name: 'เลือกข้อสอบ' });
  await nav.waitFor();
  // Scroll the editor so the floating question pill appears.
  await page.locator('[role="textbox"][aria-label="ข้อสอบที่จัดรูปแบบแล้ว"]').evaluate(node => { node.scrollTop = 2400; node.dispatchEvent(new Event('scroll')); });
  await page.waitForTimeout(250);
  await page.screenshot({ path: out('t111-question-pill.png'), clip: { x: 958, y: 60, width: 954, height: 380 } });
  const nextStep = await page.locator('.ui-next-step').count();
  // Save happens automatically; reset and upload the same file to surface the draft chip.
  await page.waitForTimeout(1500);
  await page.getByRole('button', { name: 'เลือกไฟล์ใหม่', exact: true }).click();
  await page.getByRole('heading', { name: 'ทำต่อจากแบบร่างล่าสุด', exact: true }).waitFor();
  await page.waitForTimeout(400);
  await page.screenshot({ path: out('t111-recent-drafts.png') });
  await upload();
  await page.getByRole('group', { name: 'แบบร่างเดิมของไฟล์นี้' }).waitFor();
  await page.waitForTimeout(400);
  await page.screenshot({ path: out('t111-draft-chip.png'), clip: { x: 0, y: 0, width: 1912, height: 120 } });
  await page.waitForTimeout(6500);
  const folded = await page.evaluate(() => document.querySelector('[data-layout="compact-status"]')?.dataset.folded === 'true');
  await page.screenshot({ path: out('t111-notice-folded.png'), clip: { x: 0, y: 0, width: 1912, height: 120 } });

  // Crop dimming needs a visual original: the 12-page PDF fixture with mocked OCR.
  if (fs.existsSync(pdfFixture)) {
    let n = 0;
    await page.route('**/api/ocr', async route => {
      const images = route.request().postDataJSON().images;
      const text = images.map((_image, index) => `[PAGE ${index + 1}]\n${++n}. Source question ${n}\nก. one\nข. two\nค. three\nง. four`).join('\n\n');
      await route.fulfill({ json: { success: true, text, allPagesSuccess: true, quality: 'ready', questionMarkers: images.length, pageResults: images.map((_image, index) => ({ page: index + 1, success: true, modelUsed: 'fixture' })) } });
    });
    await page.getByRole('button', { name: 'เลือกไฟล์ใหม่', exact: true }).click();
    await page.locator('input[type=file]').setInputFiles({ name: 'twelve-pages.pdf', mimeType: 'application/pdf', buffer: fs.readFileSync(pdfFixture) });
    await page.getByRole('button', { name: 'แปลงเป็นรูปแบบข้อสอบ', exact: true }).click();
    await nav.waitFor();
    await page.getByRole('button', { name: 'แคปภาพเฉพาะจุด', exact: true }).click();
    const pageImage = await page.locator('[data-source-page-target="1"] img').boundingBox();
    await page.mouse.move(pageImage.x + 60, pageImage.y + 60);
    await page.mouse.down();
    await page.mouse.move(pageImage.x + 360, pageImage.y + 220, { steps: 6 });
    await page.screenshot({ path: out('t111-crop-dim.png'), clip: { x: 0, y: 60, width: 958, height: 500 } });
    await page.mouse.up();
  }
  console.log(JSON.stringify({ nextStepButton: nextStep, noticeFolded: folded }));
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
