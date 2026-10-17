// Opt-in integration test: recorded OCR, real diagram endpoint, isolated unsaved browser context.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const replay = process.env.T123_REPLAY === '1';
const run = replay ? (process.env.T123_RESULT_RUN || 'live-replay') : 'live';
if (!/^[a-zA-Z0-9-]+$/.test(run)) throw new Error('Invalid evidence run name');
const out = path.join(root, 'evidence/t123', run);
const base = process.env.E2E_BASE_URL || 'http://localhost:3000';

async function main() {
  if (!replay && process.env.T123_LIVE !== '1') throw new Error('Owner authorization and T123_LIVE=1 required.');
  const set = Number(process.env.T123_SET || 4);
  if (![4, 5].includes(set)) throw new Error('Only authorized sets 4/5');
  fs.mkdirSync(out, { recursive: true });
  const resultPath = path.join(out, `set${set}-diagrams.json`);
  const recorded = replay ? JSON.parse(fs.readFileSync(path.join(root, `evidence/t123/live/set${set}-diagrams.json`), 'utf8')).responses : [];
  if (fs.existsSync(resultPath)) throw new Error('Refusing to overwrite live diagram evidence');
  const batches = JSON.parse(fs.readFileSync(path.join(root, `evidence/t121/set${set}/ocr-response.json`), 'utf8'));
  const sourcePages = batches.flatMap(batch => batch.text.split(/^\[PAGE \d+\]\s*\n/gm).filter(Boolean)
    .map((text, index) => ({ ...batch.pageResults[index], text })));
  const browser = await chromium.launch({ headless: true, channel: process.env.E2E_BROWSER_CHANNEL || 'msedge' });
  const responses = [], errors = [];
  let offset = 0, stopped = false;
  try {
    const page = await browser.newPage({ viewport: { width: 1912, height: 914 } });
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/api/google/session', route => route.fulfill({ json: { configured: true, connected: false, folderReady: false } }));
    await page.route('**/api/ocr', route => {
      const count = route.request().postDataJSON().images.length;
      const rows = sourcePages.slice(offset, offset + count); offset += count;
      return route.fulfill({ json: { success: true, allPagesSuccess: true, quality: 'ready', pageCount: count,
        text: rows.map((row, index) => `[PAGE ${index + 1}]\n${row.text}`).join('\n\n'),
        pageResults: rows.map((row, index) => ({ ...row, page: index + 1, success: true })) } });
    });
    await page.route('**/api/diagrams', async route => {
      if (stopped) return route.fulfill({ status: 429, json: { error: 'Test stopped after actual provider failure; this page was not sent live.' } });
      const body = route.request().postDataJSON();
      if (responses.length >= sourcePages.length) throw new Error('Live page budget exceeded');
      if (replay) {
        const saved = recorded.find(response => response.page === body.page);
        if (!saved || saved.http !== 200) throw new Error('Missing successful actual provider fixture');
        responses.push({ page: body.page, replay: true, originalAt: saved.at, raw: saved.raw });
        return route.fulfill({ json: saved.raw });
      }
      const started = Date.now();
      try {
        const response = await route.fetch({ timeout: 240000, maxRetries: 0 });
        const raw = await response.json();
        const result = { page: body.page, at: new Date().toISOString(), http: response.status(), durationMs: Date.now() - started, raw };
        responses.push(result);
        fs.writeFileSync(resultPath, JSON.stringify({ set, responses, partial: true }, null, 2));
        console.log(JSON.stringify({ set, page: body.page, http: result.http, model: raw.model, diagrams: raw.diagrams?.map(d => ({ number: d.questionNumber, type: d.type, choiceKey: d.choiceKey })), code: raw.code }));
        if (!response.ok()) stopped = true;
        return route.fulfill({ response, json: raw });
      } catch (error) {
        stopped = true;
        responses.push({ page: body.page, error: error.name, durationMs: Date.now() - started });
        fs.writeFileSync(resultPath, JSON.stringify({ set, responses, partial: true }, null, 2));
        return route.fulfill({ status: 502, json: { error: 'Live test transport failed; saved evidence and stopped further calls.' } });
      }
    });
    await page.goto(base);
    await page.locator('input[type=file]').setInputFiles(`C:/Users/natha/Downloads/บทที่ 7 ชุดที่ ${set} เรื่อง การแยกสาร.pdf`);
    await page.getByRole('button', { name: 'แปลงเป็นรูปแบบข้อสอบ', exact: true }).click();
    const editor = page.locator('[contenteditable=true]');
    await editor.locator('[data-item-id]').first().waitFor({ timeout: 120000 });
    assert.equal(await editor.locator('[data-item-id]').count(), set === 4 ? 28 : 22);
    await page.getByRole('button', { name: 'สกัดรูปประกอบ (AI)', exact: true }).click();
    await page.locator('[data-step="diagrams"]:not(:disabled)').waitFor({ timeout: 600000 });
    const html = await editor.innerHTML();
    fs.writeFileSync(path.join(out, `set${set}-editor.html`), html);
    const captures = await editor.locator('img').evaluateAll(nodes => nodes.map(image => ({
      item: image.closest('[data-item-id]')?.getAttribute('data-item-id'),
      questionNumber: Number(image.closest('[data-item-id]')?.querySelector('[data-question-text]')?.parentElement?.querySelector(':scope > span')?.textContent?.trim().match(/^\d+/)?.[0]),
      role: image.closest('[data-question-image]') ? 'question' : image.closest('[data-choice-key]') ? 'choice' : 'other',
      choice: image.closest('[data-choice-key]')?.getAttribute('data-choice-key'),
      bbox: image.getAttribute('data-source-bbox'), src: image.getAttribute('src')
    })));
    for (const [index, capture] of captures.entries()) {
      if (capture.src?.startsWith('data:image/png;base64,')) {
        capture.file = `set${set}-crop${index + 1}-q${capture.questionNumber || 'shared'}-${capture.role}.png`;
        fs.writeFileSync(path.join(out, capture.file), Buffer.from(capture.src.split(',')[1], 'base64'));
      }
      delete capture.src;
    }
    for (const sourcePage of set === 4 ? [1, 2, 3, 5, 11] : [1, 2, 3, 4, 5, 6]) {
      const src = await page.locator(`[data-source-page-target="${sourcePage}"] img`).getAttribute('src');
      if (src?.startsWith('data:image/png;base64,')) fs.writeFileSync(path.join(out, `set${set}-original-page${sourcePage}.png`), Buffer.from(src.split(',')[1], 'base64'));
    }
    await page.screenshot({ path: path.join(out, `set${set}-workspace.png`) });
    const quality = await page.getByLabel('คุณภาพการแปลง').innerText();
    if (replay && set === 4) {
      assert.ok(JSON.parse(captures.find(c => c.questionNumber === 4 && c.role === 'question').bbox)[2] < 360, 'Live Q4 provider fixture excludes following prose');
      assert.ok(JSON.parse(captures.find(c => c.questionNumber === 9 && c.role === 'question').bbox)[0] > 700, 'Live Q9 provider fixture cannot become Q7 grid');
    }
    const result = { set, at: new Date().toISOString(), base, sourcePageCount: sourcePages.length,
      scope: replay ? 'Recorded actual OCR and newly recorded live diagram responses; zero provider calls' : 'Recorded actual OCR; live diagram responses; Google mocked disconnected; no saved user draft, purchase or import',
      responses, allPagesLive: !replay && !stopped && responses.length === sourcePages.length,
      captures, quality, errors, partial: false,
      note: 'Provider 200 and image counts do not certify complete geometry; visually compare the saved original and each crop.' };
    fs.writeFileSync(resultPath, JSON.stringify(result, null, 2));
    console.log(JSON.stringify({ set, allPagesLive: result.allPagesLive, livePages: responses.length, images: captures.length, quality, errors }));
    assert.deepEqual(errors, []);
    if (stopped || responses.length !== sourcePages.length) process.exitCode = 1;
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
