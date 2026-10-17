// T-132: owner screenshots on 261017-1907 (chapter 7 set 2): Q22 crop lost the funnel top (labels 3, กรวย) and Q20
// the cylinder top. OCR merges "22. 3 จากรูป…" into one full-width line, and capture rule C-10 put the crop top under
// that line even though the figure starts beside it. A later live run gave Q20 a model box starting below the line
// (850 vs cylinder top ~808), so the crop also walks up over the figure's ink (figureReach / extendCropUpAcrossInk).
// Replays both real recordings (evidence/t121/t130-set2 and t132-set2-live) and saves every question crop to
// evidence/t132/<T132_LABEL or "after">-<fixture>/ for visual comparison.
// T-135: also checks that no teacher pen ink (red circle around choice ก.) enters the Q20 crop padding (rule C-18).
// Usage: E2E_BASE_URL=http://localhost:3000 node scripts/test-t132-crop-top.cjs   (T132_REPORT_ONLY=1 skips asserts)
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const ts = require('typescript');
const { chromium } = require('playwright');
const sharp = require('sharp');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText, filename);
const { validateDetectedDiagrams } = require('../lib/diagram-service.ts');
const base = process.env.E2E_BASE_URL || 'http://localhost:3000';
const pdf = process.env.T130_PDF || 'C:/Users/natha/Downloads/บทที่ 7 ชุดที่ 2 เรื่อง การแยกสาร.pdf';
const run = async fixture => {
  const dir = path.join(__dirname, '..', 'evidence', 't121', fixture);
  const out = path.join(__dirname, '..', 'evidence', 't132', `${process.env.T132_LABEL || 'after'}-${fixture}`);
  const read = name => JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8'));
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
  // For each question figure: size, source box, and how many dark pixels sit in the top 3 rows (ink cut at the edge).
  // Pixels are read in Node (sharp): reading every crop through page canvases crashed the renderer.
  const listed = await editor.evaluate(root => Array.from(root.querySelectorAll('[data-item-id]')).flatMap(item => {
    const images = Array.from(item.querySelectorAll(':scope > [data-question-image] img'));
    const number = item.textContent.trim().match(/^\d+/)[0];
    return images.map((image, index) => ({ key: images.length > 1 ? `${number}.${index + 1}` : number, id: item.dataset.itemId, index, bbox: JSON.parse(image.dataset.sourceBbox || 'null') }));
  }));
  const crops = {};
  for (const entry of listed) {
    const src = await editor.locator(`[data-item-id="${entry.id}"] > [data-question-image] img`).nth(entry.index).getAttribute('src');
    if (!src?.startsWith('data:image/png;base64,')) continue;
    const bytes = Buffer.from(src.split(',')[1], 'base64');
    fs.writeFileSync(path.join(out, `q${entry.key}.png`), bytes);
    const { data, info } = await sharp(bytes).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    let topInk = 0, pen = 0;
    for (let i = 0; i < Math.min(3, info.height) * info.width * info.channels; i += info.channels) if (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114 < 150) topInk++;
    // T-135 (C-18): pen ink = saturation > 60, or light pen tint (saturation > 25 and not dark). Printed ink is grey.
    for (let i = 0; i < data.length; i += info.channels) {
      const saturation = Math.max(data[i], data[i + 1], data[i + 2]) - Math.min(data[i], data[i + 1], data[i + 2]);
      if (saturation > 60 || (saturation > 25 && data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114 >= 150)) pen++;
    }
    crops[entry.key] = { width: info.width, height: info.height, bbox: entry.bbox, topInk, pen };
  }
  fs.writeFileSync(path.join(out, 'crops.json'), JSON.stringify(crops, null, 1));
  console.log(fixture, JSON.stringify(Object.fromEntries(Object.entries(crops).map(([n, c]) => [n, `${c.width}x${c.height} top=${c.bbox?.[0]?.toFixed(0)} topInk=${c.topInk} pen=${c.pen}`]))));
  await browser.close();
  if (process.env.T132_REPORT_ONLY) return;
  // Q22 (funnel) and Q20 (cylinder) start beside their question line: nothing is cut at the top edge and the whole
  // figure height is kept (cylinder ~130px, funnel+beaker ~135px at this render size), whatever the model box was.
  for (const number of ['20', '22']) assert.ok(crops[number].topInk <= 2, `${fixture}: Q${number} has no ink cut at the top edge (${crops[number].topInk})`);
  assert.ok(crops['20'].height >= 125, `${fixture}: Q20 keeps the whole cylinder (${crops['20'].height}px)`);
  assert.ok(crops['22'].height >= 130, `${fixture}: Q22 keeps funnel and beaker (${crops['22'].height}px)`);
  // T-135 (C-18, I-062): the red circle around choice ก. right of the Q20 cylinder lies in the crop padding only;
  // no pen ink may come in, while the cylinder itself is kept whole (checked above).
  assert.equal(crops['20'].pen, 0, `${fixture}: Q20 crop has no teacher pen ink at its edge (${crops['20'].pen} pixels)`);
  if (fixture !== 't130-set2') return;
  assert.ok(crops['22'].bbox[0] <= 212, `Q22 crop starts at the figure top, not under the question line (top ${crops['22'].bbox[0]})`);
  // The beside case must not pull the question number or stem text in: the box stays right of "22." and left of the stem.
  assert.ok(crops['22'].bbox[1] > 150 && crops['22'].bbox[3] < 480, `Q22 crop keeps clear of "22." and the stem (${crops['22'].bbox})`);
};
(async () => {
  if (!fs.existsSync(pdf)) { console.log('SKIP source PDF not on this machine'); return; }
  for (const fixture of ['t130-set2', 't132-set2-live']) await run(fixture);
  if (process.env.T132_REPORT_ONLY) { console.log('T-132 report only: crops saved, no checks run'); return; }
  console.log('T-132 crop top passed (recorded + live boxes): Q20/Q22 keep the whole figure beside the question line, nothing cut at the top edge');
})().catch(error => { console.error(error); process.exit(1); });
