require('./e2e-import-helper.cjs'); // T-128: answer the duplicate-import dialog with "นำเข้าใหม่"
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const JSZip = require('jszip');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'evidence/t123');
const base = process.env.E2E_BASE_URL || 'http://localhost:3111';

async function replayOcr(page, set) {
  const batches = JSON.parse(fs.readFileSync(path.join(root, `evidence/t121/set${set}/ocr-response.json`)));
  const pages = batches.flatMap(batch => batch.text.split(/^\[PAGE \d+\]\s*\n/gm).filter(Boolean)
    .map((text, index) => ({ ...batch.pageResults[index], text })));
  let offset = 0;
  await page.route('**/api/ocr', route => {
    const count = route.request().postDataJSON().images.length;
    const rows = pages.slice(offset, offset + count); offset += count;
    return route.fulfill({ json: { success: true, allPagesSuccess: true, quality: 'ready', pageCount: count,
      text: rows.map((row, index) => `[PAGE ${index + 1}]\n${row.text}`).join('\n\n'),
      pageResults: rows.map((row, index) => ({ ...row, page: index + 1, success: true })) } });
  });
}
async function download(page, set) {
  const result = page.waitForEvent('download');
  await page.getByRole('button', { name: 'ดาวน์โหลด DOCX', exact: true }).click();
  const confirm = page.getByRole('button', { name: 'ส่งออกเลย', exact: true });
  if (await confirm.isVisible()) await confirm.click();
  const bytes = fs.readFileSync(await (await result).path());
  fs.mkdirSync(path.join(root, 'tmp/pdfs'), { recursive: true });
  const file = path.join(root, `tmp/pdfs/t123-set${set}.docx`);
  fs.writeFileSync(file, bytes);
  const zip = await JSZip.loadAsync(bytes);
  const xml = await zip.file('word/document.xml').async('string');
  return { file, bytes: bytes.length, images: Object.keys(zip.files).filter(name => name.startsWith('word/media/') && !zip.files[name].dir).length, xml };
}
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ headless: true, channel: process.env.E2E_BROWSER_CHANNEL || 'msedge' });
  const results = [];
  try {
    for (const set of [5, 4]) {
      const context = await browser.newContext({ viewport: { width: 1912, height: 914 } });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.route('**/api/google/session', route => route.fulfill({ json: { configured: true, connected: false, folderReady: false } }));
      await replayOcr(page, set);
      let diagramCalls = 0;
      // Simulate exhausted quota: prove the on-device grid fallback uses the original PDF, not invented boxes.
      await page.route('**/api/diagrams', route => { diagramCalls++; return route.fulfill({ status: 429, json: { error: 'T123 simulated provider quota; original-raster fallback only' } }); });
      await page.goto(base);
      await page.locator('input[type=file]').setInputFiles(`C:/Users/natha/Downloads/บทที่ 7 ชุดที่ ${set} เรื่อง การแยกสาร.pdf`);
      await page.getByRole('button', { name: 'แปลงเป็นรูปแบบข้อสอบ', exact: true }).click();
      const editor = page.locator('[contenteditable=true]');
      await editor.locator('[data-item-id]').first().waitFor({ timeout: 120000 });
      assert.equal(await editor.locator('[data-item-id]').count(), set === 5 ? 22 : 28);
      const rows = number => editor.locator(`[data-item-id="${number}"] [data-choice-key]`);
      if (set === 5) {
        for (const number of [5, 6, 7, 8, 13, 14, 19]) assert.equal(await rows(number).count(), 5);
        assert.ok((await page.getByLabel('คุณภาพการแปลง').innerText()).includes('ตัวเลือกไม่ครบ 0'));
        await rows(5).filter({ has: page.locator('[data-answer-select="จ"]') }).locator('[data-answer-select]').check();
        assert.equal(await rows(5).filter({ has: page.locator('[data-answer-select="จ"]') }).getAttribute('data-answer-origin'), 'manual');
        await page.getByRole('button', { name: 'บันทึกแบบร่าง', exact: true }).click();
        await page.waitForFunction(() => document.querySelector('[data-draft-saved]')?.dataset.draftSaved === 'true');
        await page.reload();
        await page.getByRole('button', { name: `ทำต่อจากแบบร่าง บทที่ 7 ชุดที่ ${set} เรื่อง การแยกสาร.pdf`, exact: true }).click();
        await editor.locator('[data-item-id]').first().waitFor();
        assert.equal(await rows(5).count(), 5);
        assert.equal(await editor.locator('[data-item-id="5"] [data-choice-key="จ"]').getAttribute('data-answer-origin'), 'manual');
        await editor.locator('[data-item-id="5"]').scrollIntoViewIfNeeded();
        await page.screenshot({ path: path.join(out, 'set5-five-choice-desktop.png') });
        await page.setViewportSize({ width: 390, height: 844 });
        await editor.locator('[data-item-id="5"] [data-choice-key="จ"]').scrollIntoViewIfNeeded();
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
        await page.screenshot({ path: path.join(out, 'set5-five-choice-mobile.png') });
        await page.setViewportSize({ width: 1912, height: 914 });
        await editor.locator('[data-item-id="5"] [data-question-text]').click();
        await page.getByLabel('เลือกไฟล์รูปเพื่อแทรก', { exact: true }).setInputFiles({ name: 't123-test-only.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=', 'base64') });
        const dialog = page.getByRole('dialog', { name: 'แทรกรูปจากไฟล์' });
        await dialog.waitFor();
        assert.equal(await page.locator('#crop-target').inputValue(), '5');
        await page.locator('#crop-role').selectOption('choice');
        await dialog.getByRole('button', { name: 'ตัวเลือก จ', exact: true }).click();
        await page.setViewportSize({ width: 390, height: 844 });
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
        await page.screenshot({ path: path.join(out, 'set5-fifth-image-target-mobile.png') });
        await dialog.getByRole('button', { name: 'ยกเลิก', exact: true }).click();
        await dialog.waitFor({ state: 'hidden' });
        assert.equal(await editor.locator('[data-item-id="5"] img').count(), 0, 'Cancelled test-only image never enters the user-source export');
        await page.setViewportSize({ width: 1912, height: 914 });
      } else {
        for (const sourcePage of [10, 11]) {
          const original = await page.locator(`[data-source-page-target="${sourcePage}"] img`).getAttribute('src');
          if (original?.startsWith('data:image/png;base64,')) fs.writeFileSync(path.join(out, `set4-source-page${sourcePage}.png`), Buffer.from(original.split(',')[1], 'base64'));
        }
        const numbers = await editor.locator('[data-item-id]').evaluateAll(nodes => nodes.map(node => Number(node.querySelector('[data-question-number]')?.textContent?.replace(/\D/g, '') || node.dataset.itemId)));
        assert.ok(!numbers.includes(91));
        assert.equal(await rows(2).count(), 4);
        assert.equal(await rows(3).count(), 4);
        await page.getByRole('button', { name: 'สกัดรูปประกอบ (AI)', exact: true }).click();
        await page.locator('[data-step="diagrams"]:not(:disabled)').waitFor({ timeout: 180000 });
        const captured = [];
        for (const number of [4, 6, 7]) {
          const image = editor.locator(`[data-item-id="${number}"] [data-question-image] img`);
          if (await image.count()) {
            const bbox = JSON.parse(await image.getAttribute('data-source-bbox'));
            if (number === 4) assert.ok(bbox[2] < 360, 'Q4 excludes its following sentence');
            if (number === 6) assert.ok(bbox[2] < 758, 'Q6 excludes its following paragraph');
            const src = await image.getAttribute('src');
            fs.writeFileSync(path.join(out, `set4-q${number}-local-grid.png`), Buffer.from(src.split(',')[1], 'base64'));
            captured.push({ number, bbox });
            const stem = await editor.locator(`[data-item-id="${number}"] [data-question-text]`).textContent();
            if (number === 4) assert.ok(stem.includes('สารใดที่สามารถถูกแยก'), 'Q4 narrative remains editable outside its crop');
            if (number === 6) assert.ok(stem.includes('เมื่อนำ สารละลายผสม'), 'Q6 narrative remains editable outside its crop');
            assert.ok(!(await image.locator('..').textContent()).includes('CLEAN'));
          }
        }
        assert.ok(captured.length > 0, 'At least one original-raster ruled table survives provider quota failure');
        await editor.locator('[data-item-id="4"]').scrollIntoViewIfNeeded();
        await page.screenshot({ path: path.join(out, 'set4-local-grid-desktop.png') });
        results.push({ set, captured, diagramCalls, provider: 'simulated429; no provider request', scope: 'Only unique ruled grids; unruled/uncertain diagrams remain flagged' });
      }
      let exportSnapshot;
      page.on('request', request => { if (request.url().endsWith('/api/export/docx')) exportSnapshot = request.postDataJSON(); });
      const docx = await download(page, set);
      if (set === 5) {
        assert.ok(docx.xml.includes('สารสีฟ้ากับสารสีม่วง'), 'Fifth choice text survives actual DOCX');
        const doc = exportSnapshot.document || exportSnapshot;
        assert.equal(doc.paragraphs.filter(paragraph => paragraph.item === 5 && paragraph.role === 'choice').length, 5);
      }
      assert.deepEqual(errors, []);
      const html = await editor.innerHTML();
      fs.writeFileSync(path.join(out, `set${set}-editor.html`), html);
      results.push({ set, editorItems: await editor.locator('[data-item-id]').count(), docx: { file: docx.file, bytes: docx.bytes, images: docx.images }, errors });
      await context.close();
    }
    fs.writeFileSync(path.join(out, 'browser-results.json'), JSON.stringify({ passed: true, results, note: 'Recorded actual OCR; no new OCR/Gemini/Google or QuizFlow import call' }, null, 2));
    console.log('T123 real-PDF replay passed', JSON.stringify(results));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
