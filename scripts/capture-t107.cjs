// T-107 visual evidence: one-line accordion strip, hover rail labels and editor image tools.
// Usage: E2E_BASE_URL=http://127.0.0.1:3000 node scripts/capture-t107.cjs
const path = require('node:path');
let playwright;
try { playwright = require('playwright'); } catch { playwright = require('C:/Users/nathaphat/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'); }

const base = process.env.E2E_BASE_URL || 'http://localhost:3000';
const out = name => path.join(__dirname, '..', 'evidence', name);
const fixture = Array.from({ length: 80 }, (_, i) => {
  const q = i + 1;
  return `${q}. โจทย์ทดสอบการแยกสารข้อที่ ${q} ข้อใดถูกต้องที่สุด\nก. ตัวเลือกแรกของข้อ ${q}${q % 4 === 1 ? ' *' : ''}\nข. ตัวเลือกที่สองของข้อ ${q}\nค. ตัวเลือกที่สามของข้อ ${q}\nง. ตัวเลือกที่สี่ของข้อ ${q}`;
}).join('\n\n');

(async () => {
  const browser = await playwright.chromium.launch({ headless: true, channel: process.env.E2E_BROWSER_CHANNEL || 'msedge' });
  const page = await browser.newPage({ viewport: { width: 1912, height: 914 } });
  await page.goto(base);
  await page.locator('input[type=file]').setInputFiles({ name: 't107-sample-80.md', mimeType: 'text/markdown', buffer: Buffer.from(fixture) });
  await page.getByRole('button', { name: 'แปลงเป็นรูปแบบข้อสอบ', exact: true }).click();
  const nav = page.getByRole('navigation', { name: 'เลือกข้อสอบ' });
  await nav.waitFor();
  await nav.getByRole('button', { name: 'ไปข้อ 10', exact: true }).click();
  await nav.locator('[data-nav-gap="10"]').click();
  await nav.getByRole('button', { name: 'ไปข้อ 16', exact: true }).click();
  await nav.locator('[data-nav-gap="60"]').click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: out('t107-nav-open-range.png'), clip: { x: 960, y: 60, width: 952, height: 120 } });
  await nav.locator('[data-nav-gap="60"]').click();
  await page.waitForTimeout(450);
  await page.screenshot({ path: out('t107-nav-marker.png'), clip: { x: 960, y: 60, width: 952, height: 120 } });

  const png = Buffer.from((await page.evaluate(() => { const c = document.createElement('canvas'); c.width = 420; c.height = 180; const x = c.getContext('2d'); x.fillStyle = '#ffffff'; x.fillRect(0, 0, 420, 180); x.strokeStyle = '#28332d'; x.lineWidth = 2; for (let r = 0; r <= 3; r++) { x.beginPath(); x.moveTo(10, 10 + r * 53); x.lineTo(410, 10 + r * 53); x.stroke(); } for (const col of [10, 150, 410]) { x.beginPath(); x.moveTo(col, 10); x.lineTo(col, 169); x.stroke(); } x.fillStyle = '#28332d'; x.font = '20px sans-serif'; ['A', 'B', 'C'].forEach((t, i) => x.fillText(t, 70, 45 + i * 53)); return c.toDataURL('image/png'); })).split(',')[1], 'base64');
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'แทรกรูป', exact: true }).click();
  await (await chooser).setFiles({ name: 'table.png', mimeType: 'image/png', buffer: png });
  const dialog = page.getByRole('dialog', { name: 'แทรกรูปจากไฟล์' });
  await dialog.waitFor();
  await page.waitForTimeout(300);
  await page.screenshot({ path: out('t107-upload-dialog.png') });
  await dialog.getByRole('button', { name: /^แทรกภาพ/ }).click();
  const image = page.locator('[data-question-image] img').first();
  await image.scrollIntoViewIfNeeded();
  await image.hover();
  await page.getByRole('toolbar', { name: 'จัดการรูปภาพ' }).waitFor();
  await page.waitForTimeout(400);
  await page.screenshot({ path: out('t107-image-tools.png') });
  await page.getByRole('toolbar', { name: 'จัดการรูปภาพ' }).getByRole('button', { name: 'ลบรูป', exact: true }).click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: out('t107-image-undo.png') });
  await page.getByRole('button', { name: 'เลิกทำ', exact: true }).click();

  await page.getByRole('group', { name: 'เครื่องมือเสริม' }).hover();
  await page.waitForTimeout(600);
  await page.screenshot({ path: out('t107-header-rail.png'), clip: { x: 0, y: 0, width: 1912, height: 120 } });
  await page.getByRole('group', { name: 'เครื่องมือต้นฉบับ' }).hover();
  await page.waitForTimeout(600);
  await page.screenshot({ path: out('t107-source-rail.png'), clip: { x: 0, y: 50, width: 960, height: 90 } });
  await page.mouse.move(400, 600);
  await page.waitForTimeout(500);
  await page.screenshot({ path: out('t107-workspace.png') });

  const navHeight = (await nav.boundingBox()).height;
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(400);
  const mobile = await page.evaluate(() => ({ overflowX: document.documentElement.scrollWidth > innerWidth + 1, nav: document.querySelector('nav[aria-label="เลือกข้อสอบ"]').getBoundingClientRect().height }));
  await page.screenshot({ path: out('t107-mobile.png') });
  console.log(JSON.stringify({ navHeight, mobile }));
  if (navHeight > 48 || mobile.nav > 48 || mobile.overflowX) throw new Error('T-107 one-line strip bounds failed');
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
