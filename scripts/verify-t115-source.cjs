const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const ts = require('typescript');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const source = process.argv[2];
if (!source) throw new Error('Pass the exact source PDF path; private renders must already exist in tmp/pdfs/t115.');
const hash = crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex');
assert.equal(hash, '4d46497721a7fd8e3edc0242e7b3cbb35ac08609b6ad46b7626d9ce80279a018');
const fixtures = [
  { name: 'q56-57-guides', page: 9, bbox: [680, 465, 820, 550] },
  { name: 'q58-61-table', page: 10, bbox: [266, 66, 478, 890] },
  { name: 'q62-64-table', page: 11, bbox: [192, 264, 330, 775] },
  { name: 'q66-table', page: 11, bbox: [694, 205, 845, 830] },
];
(async () => {
  const browser = await chromium.launch({ headless: true, channel: process.env.E2E_BROWSER_CHANNEL || 'msedge' });
  try {
    const page = await browser.newPage();
    await page.goto(process.env.E2E_BASE_URL || 'http://127.0.0.1:3000');
    const moduleCode = ts.transpileModule(fs.readFileSync(path.join(root, 'lib/diagram-client.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
    const results = [];
    for (const fixture of fixtures) {
      const image = 'data:image/png;base64,' + fs.readFileSync(path.join(root, `tmp/pdfs/t115/source-${String(fixture.page).padStart(2, '0')}.png`)).toString('base64');
      const result = await page.evaluate(async ({ moduleCode, image, bbox }) => {
        const exports = {}; new Function('require', 'exports', moduleCode)(() => ({}), exports);
        const output = await exports.cropBboxFromImage(image, bbox, 14, 3, 'all');
        const original = new Image(), cropped = new Image(); original.src = image; cropped.src = output; await Promise.all([original.decode(), cropped.decode()]);
        const canvas = document.createElement('canvas'); canvas.width = cropped.width; canvas.height = cropped.height; const ctx = canvas.getContext('2d'); ctx.drawImage(cropped, 0, 0);
        // The full protected box must survive trimming. At identical raster scale,
        // every source pixel of the box must exist verbatim in the output.
        const rawX = bbox[1] / 1000 * original.width, rawY = bbox[0] / 1000 * original.height;
        const rawW = (bbox[3] - bbox[1]) / 1000 * original.width, rawH = (bbox[2] - bbox[0]) / 1000 * original.height;
        const padX = Math.max(14, Math.min(36, Math.round(rawW * .035)));
        const x = Math.max(0, Math.round(rawX - padX));
        const source = document.createElement('canvas'); source.width = original.width; source.height = original.height;
        const sourceCtx = source.getContext('2d'); sourceCtx.drawImage(original, 0, 0);
        const sx = Math.ceil(rawX), sy = Math.ceil(rawY), w = Math.floor(rawW) - 1, h = Math.floor(rawH) - 1;
        const expected = sourceCtx.getImageData(sx, sy, w, h).data;
        let matched = false, offset = -1;
        for (let y = 0; y + h <= cropped.height; y++) {
          const actual = ctx.getImageData(sx - x, y, w, h).data;
          let same = true;
          for (let i = 0; i < expected.length; i++) if (expected[i] !== actual[i]) { same = false; break; }
          if (same) { matched = true; offset = y; break; }
        }
        return { output, matched, offset, width: cropped.width, height: cropped.height };
      }, { moduleCode, image, bbox: fixture.bbox });
      assert.equal(result.matched, true, fixture.name + ': all protected source pixels retained');
      fs.writeFileSync(path.join(root, `tmp/pdfs/t115/${fixture.name}.png`), Buffer.from(result.output.split(',')[1], 'base64'));
      results.push({ ...fixture, matched: result.matched, offset: result.offset, width: result.width, height: result.height });
    }
    let providerCalls = 0;
    for (const api of ['ocr', 'diagrams', 'source-answers', 'ai-answers']) await page.route(`**/api/${api}`, route => { providerCalls++; return route.abort(); });
    const fileName = path.basename(source), size = fs.statSync(source).size;
    const item = { id: 56, questionNumber: 56, sourcePage: 9, questionText: 'T-115 source-reference verification only', choices: ['ก', 'ข', 'ค', 'ง'].map(key => ({ key, text: 'Verification option', isCorrect: false, shadingType: 'none' })), explanationText: '' };
    await page.evaluate(({ fileName, size, hash, item }) => localStorage.setItem('exam-formatter-document-drafts-v1', JSON.stringify({ schemaVersion: 1, drafts: [{ id: 't115-source', docKey: 't115-source-only', fileName, fileBytes: size, sourceHash: hash, updatedAt: new Date().toISOString(), ocrText: '', formattedItems: [item], itemCount: 1 }] })), { fileName, size, hash, item });
    await page.reload();
    const resume = async () => {
      await page.getByRole('button', { name: 'แบบร่างและแคช OCR', exact: true }).click();
      await page.getByRole('dialog').locator('li').filter({ hasText: fileName }).getByRole('button', { name: 'เปิดทำต่อ', exact: true }).click();
      await page.locator('[contenteditable=true]').waitFor();
    };
    await resume();
    await page.getByLabel('แนบไฟล์ต้นฉบับเดิม', { exact: true }).setInputFiles(source);
    await page.locator('[data-source-page-target="13"] img').waitFor({ timeout: 120000 });
    assert.equal(await page.locator('[data-source-page-target]').count(), 13);
    const editor = page.locator('[contenteditable=true]');
    const editedText = await editor.innerText();
    await page.getByRole('button', { name: 'บันทึกแบบร่าง', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('[data-draft-saved]')?.dataset.draftSaved === 'true');
    await page.reload(); await resume();
    await page.locator('[data-source-page-target="13"] img').waitFor();
    assert.equal(await editor.innerText(), editedText);
    await page.getByRole('button', { name: 'แว่นขยายส่องเฉพาะจุด', exact: true }).click();
    assert.equal(await page.getByRole('button', { name: 'แว่นขยายส่องเฉพาะจุด', exact: true }).getAttribute('aria-pressed'), 'true');
    await page.getByRole('button', { name: 'แว่นขยายส่องเฉพาะจุด', exact: true }).click();
    await page.locator('[data-source-page-target="9"] img').evaluate(image => image.scrollIntoView({ block: 'center' }));
    await page.screenshot({ path: path.join(root, 'tmp/pdfs/t115/original-resumed.png'), fullPage: true });
    assert.equal(providerCalls, 0, 'source-only reattachment/resume does not invoke OCR/AI');
    fs.writeFileSync(path.join(root, 'evidence/t115-crop-result.json'), JSON.stringify({ hash, bytes: size, providerCalled: false, bounds: 'manually verified; not AI detection', results, browser: { originalPages: 13, retainedAfterReload: true, editedTextPreserved: true, magnifierEnabled: true, providerCalls } }, null, 2));
    console.log('Exact source crop checks passed; protected source pixels retained for all four figures. Provider detection NOT tested.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
