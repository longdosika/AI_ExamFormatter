// T-110 evidence: dark pane rails, merged export control (before/during/after export) and the richer question strip.
// Usage: E2E_BASE_URL=http://127.0.0.1:3000 node scripts/capture-t110.cjs
const path = require('node:path');
let playwright;
try { playwright = require('playwright'); } catch { playwright = require('C:/Users/nathaphat/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'); }

const base = process.env.E2E_BASE_URL || 'http://localhost:3000';
const out = name => path.join(__dirname, '..', 'evidence', name);
// Question 12 has only three choices so review flags it; every fourth question carries a source answer.
const fixture = Array.from({ length: 80 }, (_, i) => {
  const q = i + 1;
  const choices = ['ก', 'ข', 'ค', 'ง'].slice(0, q === 12 ? 3 : 4).map((key, index) => `${key}. ตัวเลือก${key}ของข้อ ${q}${index === 0 && q % 4 === 1 ? ' *' : ''}`);
  return `${q}. โจทย์การแยกสารข้อที่ ${q} วิธีใดเหมาะสมที่สุดสำหรับการแยกสารผสมชนิดนี้\n${choices.join('\n')}`;
}).join('\n\n');

(async () => {
  const browser = await playwright.chromium.launch({ headless: true, channel: process.env.E2E_BROWSER_CHANNEL || 'msedge' });
  const page = await browser.newPage({ viewport: { width: 1912, height: 914 } });
  // Drive is mocked so the export flow can be shown without a Google account.
  await page.route('**/api/google/session', route => route.fulfill({ json: { configured: true, connected: true, folderReady: true, folderId: 'fixture' } }));
  let releaseExport;
  await page.route('**/api/google/export', route => new Promise(resolve => { releaseExport = () => resolve(route.fulfill({ json: { url: 'https://docs.google.com/document/d/fixture-t110' } })); }));
  await page.goto(base);
  await page.locator('input[type=file]').setInputFiles({ name: 'บทที่ 7 ชุดที่ 1 เรื่อง การแยกสาร.md', mimeType: 'text/markdown', buffer: Buffer.from(fixture) });
  await page.getByRole('button', { name: 'แปลงเป็นรูปแบบข้อสอบ', exact: true }).click();
  const nav = page.getByRole('navigation', { name: 'เลือกข้อสอบ' });
  await nav.waitFor();
  await nav.getByRole('button', { name: 'ไปข้อ 10', exact: true }).click();
  await nav.locator('[data-nav-gap="10"]').click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: out('t110-workspace.png') });
  await nav.getByRole('button', { name: 'ไปข้อ 13', exact: true }).hover();
  await page.getByRole('tooltip').waitFor();
  await page.waitForTimeout(250);
  await page.screenshot({ path: out('t110-strip-preview.png'), clip: { x: 958, y: 60, width: 954, height: 260 } });
  await page.mouse.move(400, 600);
  const exportButton = page.locator('[data-export-control]').getByRole('button', { name: 'ส่งออกเข้า Google Drive', exact: true });
  await exportButton.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: out('t110-rail-busy.png'), clip: { x: 958, y: 60, width: 954, height: 120 } });
  releaseExport();
  await page.locator('[data-export-control] a').waitFor();
  await page.waitForTimeout(500);
  await page.screenshot({ path: out('t110-rail-exported.png'), clip: { x: 958, y: 60, width: 954, height: 120 } });
  await page.screenshot({ path: out('t110-source-rail.png'), clip: { x: 0, y: 60, width: 958, height: 120 } });
  const metrics = await page.evaluate(() => ({
    nav: document.querySelector('nav[aria-label="เลือกข้อสอบ"]').getBoundingClientRect().height,
    headerLinks: [...document.querySelectorAll('header a')].map(a => a.getAttribute('aria-label')),
    answered: document.querySelector('[data-nav-summary] .nav-summary')?.textContent,
    issues: document.querySelector('.nav-summary-issue')?.textContent,
  }));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(400);
  const mobile = await page.evaluate(() => ({ overflowX: document.documentElement.scrollWidth > innerWidth + 1, nav: document.querySelector('nav[aria-label="เลือกข้อสอบ"]').getBoundingClientRect().height }));
  await page.screenshot({ path: out('t110-mobile.png') });
  console.log(JSON.stringify({ ...metrics, mobile }));
  if (metrics.nav > 48 || mobile.nav > 48 || mobile.overflowX) throw new Error('T-110 strip bounds failed');
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
