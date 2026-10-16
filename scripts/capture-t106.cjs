// T-106 visual evidence: captures the redesigned workspace at desktop and phone widths.
// Usage: E2E_BASE_URL=http://localhost:3101 node scripts/capture-t106.cjs
const path = require('node:path');
let playwright;
try { playwright = require('playwright'); } catch { playwright = require('C:/Users/nathaphat/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'); }

const base = process.env.E2E_BASE_URL || 'http://localhost:3000';
const out = name => path.join(__dirname, '..', 'evidence', name);
const fixture = Array.from({ length: 30 }, (_, i) => {
  const q = i + 1;
  return `${q}. โจทย์ทดสอบการแยกสารข้อที่ ${q} ข้อใดถูกต้องที่สุดเกี่ยวกับวิธีโครมาโทกราฟี\nก. ตัวเลือกแรกของข้อ ${q}${q % 4 === 1 ? ' *' : ''}\nข. ตัวเลือกที่สองของข้อ ${q}\nค. ตัวเลือกที่สามของข้อ ${q}\nง. ตัวเลือกที่สี่ของข้อ ${q}`;
}).join('\n\n');

(async () => {
  const browser = await playwright.chromium.launch({ headless: true, channel: process.env.E2E_BROWSER_CHANNEL || 'msedge' });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await page.goto(base);
  await page.screenshot({ path: out('t106-upload.png') });
  await page.locator('input[type=file]').setInputFiles({ name: 't106-sample-30.md', mimeType: 'text/markdown', buffer: Buffer.from(fixture) });
  await page.getByRole('textbox', { name: 'ข้อความ OCR สำหรับตรวจแก้' }).waitFor();
  await page.waitForTimeout(700);
  await page.screenshot({ path: out('t106-raw-review.png') });
  await page.getByRole('button', { name: 'แปลงเป็นรูปแบบข้อสอบ', exact: true }).click();
  await page.getByRole('navigation', { name: 'เลือกข้อสอบ' }).waitFor();
  await page.waitForTimeout(700);
  await page.screenshot({ path: out('t106-workspace.png') });
  const gap = page.locator('[data-nav-gap="10"]');
  await gap.click();
  await page.waitForTimeout(450);
  await page.getByRole('button', { name: 'แบบร่างและแคช OCR' }).hover();
  await page.waitForTimeout(500);
  await page.screenshot({ path: out('t106-workspace-expanded.png') });
  const metrics = await page.evaluate(() => ({
    header: document.querySelector('main > header').getBoundingClientRect().height,
    nav: document.querySelector('nav[aria-label="เลือกข้อสอบ"]').getBoundingClientRect().height,
    smallestChip: Math.min(...[...document.querySelectorAll('nav[aria-label="เลือกข้อสอบ"] button[aria-label^="ไปข้อ"]')].filter(b => b.offsetParent).map(b => b.getBoundingClientRect().height)),
    overflowX: document.documentElement.scrollWidth > innerWidth + 1,
  }));
  await page.emulateMedia({ reducedMotion: "reduce" });
  const reducedMotion = await page.evaluate(() => [...document.querySelectorAll(".ui-halo, .ui-halo-teal, .ui-halo-amber, .ui-logo-scan, .ui-pane-in")].every(node => getComputedStyle(node).animationName === "none"));
  await page.emulateMedia({ reducedMotion: "no-preference" });
  if (!reducedMotion) throw new Error("T-106 animations must stop under prefers-reduced-motion");
  await page.setViewportSize({ width: 1912, height: 914 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: out('t106-workspace-1912.png') });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: out('t106-workspace-mobile.png'), fullPage: true });
  const mobileOverflowX = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
  console.log(JSON.stringify({ ...metrics, mobileOverflowX, reducedMotion }));
  if (metrics.overflowX || mobileOverflowX || metrics.smallestChip < 24 || metrics.nav > 90) throw new Error('T-106 layout bounds failed');
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
