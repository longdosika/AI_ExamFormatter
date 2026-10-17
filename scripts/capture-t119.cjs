// T-119 evidence: one-row rail, header groups/badge, Drive pill, export confirm, strip legend/duplicate marks,
// two-column choices, page dots and ink filter. Usage: E2E_BASE_URL=http://127.0.0.1:3000 node scripts/capture-t119.cjs
const fs = require('node:fs');
const path = require('node:path');
let playwright;
try { playwright = require('playwright'); } catch { playwright = require('C:/Users/nathaphat/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'); }

const base = process.env.E2E_BASE_URL || 'http://localhost:3000';
const out = name => path.join(__dirname, '..', 'evidence', name);
const questions = Array.from({ length: 26 }, (_, i) => {
  const q = i + 1;
  const number = q === 7 ? 6 : q; // duplicated number, as in the owner's screenshot
  return `${number}. โจทย์การแยกสารข้อที่ ${q} สารใดเหมาะสมที่สุด\nก. น้ำเกลือ${q % 3 === 0 ? ' *' : ''}\nข. น้ำเชื่อม\nค. น้ำมันดิบ\nง. น้ำทะเล`;
});
const fixture = questions.join('\n\n');
const pdfFixture = path.join(__dirname, '..', 'evidence', 't047-12-page-fixture.pdf');

(async () => {
  const browser = await playwright.chromium.launch({ headless: true, channel: process.env.E2E_BROWSER_CHANNEL || 'msedge' });
  const page = await browser.newPage({ viewport: { width: 1912, height: 914 } });
  await page.route('**/api/google/session', route => route.fulfill({ json: { configured: true, connected: true, folderReady: true, folderId: 'fixture' } }));
  await page.route('**/api/google/export', route => route.fulfill({ json: { url: 'https://docs.google.com/document/d/fixture-t119' } }));
  await page.goto(base);
  await page.waitForLoadState('networkidle');
  await page.locator('input[type=file]').setInputFiles({ name: 'บทที่ 7 ชุดที่ 3 เรื่อง การแยกสาร.md', mimeType: 'text/markdown', buffer: Buffer.from(fixture) });
  await page.getByRole('button', { name: 'แปลงเป็นรูปแบบข้อสอบ', exact: true }).click();
  const nav = page.getByRole('navigation', { name: 'เลือกข้อสอบ' });
  await nav.waitFor();
  await page.waitForTimeout(600);
  const railHeight = await page.locator('[data-layout="compact-conversion-header"]').evaluate(node => node.getBoundingClientRect().height);
  await page.screenshot({ path: out('t119-workspace.png') });
  await page.locator('.nav-legend-anchor').hover();
  await page.waitForTimeout(300);
  await page.screenshot({ path: out('t119-strip-legend.png'), clip: { x: 958, y: 60, width: 954, height: 320 } });
  await page.mouse.move(300, 600);
  await page.locator('[data-export-control] button').first().click();
  await page.getByRole('dialog', { name: 'ยืนยันการส่งออก' }).waitFor();
  await page.waitForTimeout(250);
  await page.screenshot({ path: out('t119-export-confirm.png'), clip: { x: 958, y: 60, width: 954, height: 260 } });
  await page.keyboard.press('Escape');
  await page.getByRole('group', { name: 'เครื่องมือเสริม' }).hover();
  await page.waitForTimeout(500);
  await page.screenshot({ path: out('t119-header.png'), clip: { x: 0, y: 0, width: 1912, height: 70 } });
  await page.mouse.move(300, 600);

  let pageDots = 0;
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
    pageDots = await page.locator('.source-page-dots button').count();
    await page.getByRole('button', { name: 'ลดรอยปากกาบนต้นฉบับ', exact: true }).click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: out('t119-source-dots-ink.png'), clip: { x: 0, y: 60, width: 958, height: 600 } });
  }
  const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mobilePage.goto(base);
  await mobilePage.waitForLoadState('networkidle');
  await mobilePage.locator('input[type=file]').setInputFiles({ name: 'mobile.md', mimeType: 'text/markdown', buffer: Buffer.from(fixture) });
  await mobilePage.getByRole('button', { name: 'แปลงเป็นรูปแบบข้อสอบ', exact: true }).click();
  await mobilePage.getByRole('navigation', { name: 'เลือกข้อสอบ' }).waitFor();
  const mobileOverflow = await mobilePage.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
  await mobilePage.screenshot({ path: out('t119-mobile.png') });
  console.log(JSON.stringify({ railHeight, pageDots, mobileOverflow }));
  if (railHeight > 64 || mobileOverflow) throw new Error('T-119 layout bounds failed');
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
