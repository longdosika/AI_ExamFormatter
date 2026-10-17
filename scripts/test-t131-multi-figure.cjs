// T-131 (I-059 / H-13): chapter 7 set 2 Q25 prints รูปที่ 1-4, but an item held one question image, so each later
// figure overwrote the previous one. Replays the recorded real responses (evidence/t121/t130-set2, no provider calls):
// Q25 keeps all 4 figures in source order through harvest, draft reopen and both exports (DOCX download and the
// Google export payload laid out by the server's DOCX writer), each image under one "รูปคำถาม:".
// Usage: E2E_BASE_URL=http://localhost:3000 node scripts/test-t131-multi-figure.cjs
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const ts = require('typescript');
const JSZip = require('jszip');
const { chromium } = require('playwright');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText, filename);
const { validateDetectedDiagrams } = require('../lib/diagram-service.ts');
const { sortFiguresBySource } = require('../lib/formatter-rules.ts');
const base = process.env.E2E_BASE_URL || 'http://localhost:3000';
const pdf = process.env.T130_PDF || 'C:/Users/natha/Downloads/บทที่ 7 ชุดที่ 2 เรื่อง การแยกสาร.pdf';
const dir = path.join(__dirname, '..', 'evidence', 't121', 't130-set2');
const out = path.join(__dirname, '..', 'evidence', 't131');
const read = name => JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8'));

// Unit: row-aware source order (two figures side by side, two more below), independent of input order.
const grid = [{ id: 4, bbox: [800, 320, 938, 440] }, { id: 2, bbox: [595, 550, 771, 888] }, { id: 3, bbox: [772, 150, 938, 252] }, { id: 1, bbox: [590, 106, 771, 512] }];
assert.deepEqual(sortFiguresBySource(grid).map(figure => figure.id), [1, 2, 3, 4], 'row by row, left to right');
assert.deepEqual(sortFiguresBySource([{ id: 1, bbox: [100, 600, 200, 900] }, { id: 2, bbox: [300, 0, 400, 300] }]).map(figure => figure.id), [1, 2], 'a lower row comes later even when it is further left');

/** Q25 figures in editor order, each with its source box. */
const q25Figures = editor => editor.evaluate(root => {
  const item = Array.from(root.querySelectorAll('[data-item-id]')).find(node => /^\s*25\./.test(node.textContent));
  const blocks = item ? item.querySelectorAll(':scope > [data-question-image]') : [];
  return { blocks: blocks.length, labels: item ? Array.from(item.querySelectorAll(':scope > [data-question-image] > :not([data-question-figure])')).filter(node => node.textContent.trim() === 'รูปโจทย์:').length : 0,
    figures: item ? Array.from(item.querySelectorAll(':scope > [data-question-image] img')).map(image => JSON.parse(image.dataset.sourceBbox || 'null')) : [] };
});
/** Paragraph texts and image counts of a DOCX body, then the block between Q25's "รูปคำถาม:" and "ตัวเลือก:". */
const docxQ25 = xml => {
  const paragraphs = xml.split('</w:p>').map(p => ({ text: p.replace(/<[^>]+>/g, '').trim(), images: (p.match(/<w:drawing>/g) || []).length }));
  const start = paragraphs.findIndex(p => /^25\.\s/.test(p.text));
  assert.ok(start >= 0, 'DOCX has question 25');
  const end = paragraphs.findIndex((p, index) => index > start && /^26\.\s/.test(p.text));
  const block = paragraphs.slice(start, end < 0 ? undefined : end);
  const label = block.findIndex(p => p.text === 'รูปคำถาม:');
  const choices = block.findIndex(p => p.text === 'ตัวเลือก:');
  return { labels: block.filter(p => p.text === 'รูปคำถาม:').length, label, choices,
    images: block.slice(label + 1, choices).reduce((sum, p) => sum + p.images, 0), imageParagraphs: block.slice(label + 1, choices).filter(p => p.images).length };
};
/** Nearest recorded provider box for each figure: the order must be รูปที่ 1, 2, 3, 4. */
const matchRecorded = (figures, recorded) => figures.map(box => {
  const center = b => [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2];
  const [y, x] = center(box);
  return recorded.map((entry, index) => ({ index, distance: Math.hypot(center(entry.bbox)[0] - y, center(entry.bbox)[1] - x) })).sort((a, b) => a.distance - b.distance)[0].index;
});

(async () => {
  if (!fs.existsSync(pdf)) { console.log('SKIP source PDF not on this machine'); return; }
  fs.mkdirSync(out, { recursive: true });
  const ocr = read('ocr-response.json'), diagrams = read('diagrams-response.json');
  const recorded = diagrams.flatMap(entry => entry.body.diagrams || []).filter(diag => diag.type === 'question' && diag.questionNumber === 25);
  assert.equal(recorded.length, 4, 'recorded set-2 response has 4 question figures for Q25');
  const browser = await chromium.launch({ headless: true, channel: process.env.E2E_BROWSER_CHANNEL || 'msedge' });
  const page = await browser.newPage({ viewport: { width: 1912, height: 914 } });
  await page.route('**/api/ocr', route => { const count = route.request().postDataJSON().images.length; route.fulfill({ json: ocr.find(entry => entry.pageCount === count) || ocr[0] }); });
  let diagramCalls = 0;
  await page.route('**/api/diagrams', route => { diagramCalls++; const body = route.request().postDataJSON(); const record = diagrams.find(entry => entry.page === body.page)?.body || { diagrams: [] }; route.fulfill({ json: { ...record, diagrams: validateDetectedDiagrams(record.diagrams, body.page) } }); });
  const editor = page.locator('[contenteditable="true"]');
  await page.goto(base); await page.waitForLoadState('networkidle');
  await page.locator('input[type=file]').setInputFiles(pdf);
  await page.getByRole('button', { name: 'แปลงเป็นรูปแบบข้อสอบ', exact: true }).click();
  await editor.locator('[data-item-id]').first().waitFor({ timeout: 180_000 });
  await page.getByRole('button', { name: 'สกัดรูปประกอบ (AI)', exact: true }).click();
  await page.getByRole('button', { name: 'สกัดรูปแล้ว (สกัดซ้ำได้)', exact: true }).waitFor({ timeout: 180_000 });
  await page.waitForTimeout(1000);

  // A. Harvest: one รูปโจทย์ block with all four figures, in source order.
  const dump = async stage => fs.writeFileSync(path.join(out, `q25-editor-${stage}.html`), (await editor.locator('[data-item-id]').filter({ hasText: /^\s*25\./ }).first().evaluate(node => node.outerHTML)).replace(/src="data:[^"]{40}[^"]*"/g, 'src="data:…"'));
  await dump('harvested');
  const harvested = await q25Figures(editor);
  assert.equal(harvested.blocks, 1, 'Q25 has one question-figure block');
  assert.equal(harvested.labels, 1, 'Q25 has one รูปโจทย์: label');
  assert.equal(harvested.figures.length, 4, `Q25 keeps 4 figures: ${JSON.stringify(harvested.figures)}`);
  assert.deepEqual(matchRecorded(harvested.figures, recorded), [0, 1, 2, 3], `Q25 figures follow รูปที่ 1-4: ${JSON.stringify(harvested.figures)}`);
  const q25 = editor.locator('[data-item-id]').filter({ hasText: /^\s*25\./ }).first();
  await q25.scrollIntoViewIfNeeded(); await q25.screenshot({ path: path.join(out, 'q25-four-figures.png') });
  // C-36 still holds next to it: Q5's choice table is not a figure, single-figure questions keep exactly one.
  const counts = await editor.evaluate(root => Object.fromEntries(Array.from(root.querySelectorAll('[data-item-id]')).map(item => [item.textContent.trim().match(/^\d+/)?.[0], item.querySelectorAll(':scope > [data-question-image] img').length]).filter(([, count]) => count)));
  assert.equal(counts['5'], undefined, 'Q5 choice table is still not a question figure');
  for (const number of ['8', '16', '20', '22']) assert.equal(counts[number], 1, `Q${number} keeps its one figure`);

  // B. Re-harvest replaces the figures instead of appending duplicates.
  const calls = diagramCalls;
  await page.getByRole('button', { name: 'สกัดรูปแล้ว (สกัดซ้ำได้)', exact: true }).click();
  await page.waitForFunction(() => !document.querySelector('[aria-label="กำลังสกัดรูป…"]'), null, { timeout: 180_000 });
  await page.getByRole('button', { name: 'สกัดรูปแล้ว (สกัดซ้ำได้)', exact: true }).waitFor({ timeout: 180_000 });
  assert.ok(diagramCalls > calls, 'second harvest asked for the figures again');
  await page.waitForTimeout(1000);
  await dump('reharvested');
  assert.equal((await q25Figures(editor)).figures.length, 4, 'a second harvest still leaves 4 figures');

  // C. Draft: saved, reloaded and reopened (reopen cleanup + stale check run) keeps all four in order.
  await page.getByRole('button', { name: 'บันทึกแบบร่าง', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('[data-draft-saved]')?.dataset.draftSaved === 'true');
  await page.route('**/api/google/session', route => route.fulfill({ json: { configured: true, connected: true, folderReady: true, folderId: 'fixture' } }));
  await page.reload();
  await page.getByRole('button', { name: `ทำต่อจากแบบร่าง ${path.basename(pdf)}`, exact: true }).click();
  await editor.locator('[data-item-id]').first().waitFor();
  await page.waitForTimeout(1500);
  const reopened = await q25Figures(editor);
  assert.deepEqual(reopened.figures, harvested.figures, 'reopened draft keeps the 4 figures in order');

  await dump('reopened');
  // D. DOCX download: 4 image paragraphs between Q25's one "รูปคำถาม:" and "ตัวเลือก:".
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'ดาวน์โหลด DOCX', exact: true }).click();
  const confirm = page.getByRole('button', { name: 'ส่งออกเลย', exact: true }); if (await confirm.isVisible().catch(() => false)) await confirm.click();
  const docxPath = path.join(out, 'q25-export.docx');
  fs.copyFileSync(await (await download).path(), docxPath);
  const docx = docxQ25(await (await JSZip.loadAsync(fs.readFileSync(docxPath))).file('word/document.xml').async('string'));
  assert.equal(docx.labels, 1, 'DOCX: one รูปคำถาม: for Q25');
  assert.ok(docx.label >= 0 && docx.choices > docx.label, 'DOCX: stem -> รูปคำถาม: -> ตัวเลือก:');
  assert.equal(docx.images, 4, 'DOCX: 4 images under Q25 รูปคำถาม:');
  assert.equal(docx.imageParagraphs, 4, 'DOCX: one paragraph per figure');

  // E. Google export: the payload carries one label and 4 image paragraphs for Q25, and the server's writer keeps them.
  let payload;
  await page.route('**/api/google/library*', route => route.fulfill({ json: { collection: { id: 'fixture_collection_t131' }, source: { id: 'fixture_source_t131' }, output: { id: 'fixture_output_t131' }, collections: [], files: [] } }));
  await page.route('**/api/google/export', route => { payload = route.request().postDataJSON(); return route.fulfill({ json: { url: 'https://docs.google.com/document/d/fixture-t131' } }); });
  await page.waitForFunction(() => document.querySelector('[data-export-control]')?.dataset.exportStep === 'ready', null, { timeout: 15_000 });
  const exported = page.waitForResponse('**/api/google/export');
  await page.getByRole('button', { name: 'ส่งออกเข้า Google Drive', exact: true }).click();
  // Open review findings make export ask once (T-119); the user may still send.
  const sendAnyway = page.getByRole('dialog', { name: 'ยืนยันการส่งออก' }).getByRole('button', { name: 'ส่งออกเลย', exact: true });
  await Promise.race([exported, sendAnyway.waitFor({ timeout: 10_000 }).then(() => sendAnyway.click()).catch(() => {})]);
  await exported;
  assert.ok(payload, 'Google export payload sent');
  const id = await q25.getAttribute('data-item-id');
  const roles = payload.paragraphs.filter(paragraph => String(paragraph.item) === id).map(paragraph => paragraph.role);
  assert.equal(roles.filter(role => role === 'questionImageLabel').length, 1, 'Google payload: one question-figure label');
  assert.equal(roles.filter(role => role === 'questionImage').length, 4, `Google payload: 4 question images (${roles.join(',')})`);
  const { createExportDocx } = require('../lib/google-export.ts');
  const google = docxQ25(await (await JSZip.loadAsync(await createExportDocx(payload))).file('word/document.xml').async('string'));
  assert.equal(google.images, 4, 'Google Doc source DOCX: 4 images under Q25 รูปคำถาม:');
  await browser.close();
  fs.writeFileSync(path.join(out, 'replay-result.json'), JSON.stringify({ harvested: harvested.figures, reopened: reopened.figures, docx, google, roles }, null, 2));
  console.log(`T-131 passed: Q25 keeps 4 figures in source order (harvest, re-harvest, draft reopen), DOCX and Google export have 4 images under one รูปคำถาม:. ${JSON.stringify(harvested.figures)}`);
})().catch(error => { console.error(error); process.exit(1); });
