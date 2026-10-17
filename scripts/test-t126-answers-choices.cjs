// T-126: multiple correct answers and add/delete choices on the real chapter-7 set-3 PDF (recorded responses,
// no provider calls). Owner screenshot: Q9's original circles both ก and ง.
// Usage: E2E_BASE_URL=http://localhost:3000 node scripts/test-t126-answers-choices.cjs
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const ts = require('typescript');
const JSZip = require('jszip');
const { chromium } = require('playwright');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText, filename);
const { validateDetectedDiagrams } = require('../lib/diagram-service.ts');
const base = process.env.E2E_BASE_URL || 'http://localhost:3000';
const pdf = process.env.T121_PDF || 'C:/Users/natha/Downloads/บทที่ 7 ชุดที่ 3 เรื่อง การแยกสาร.pdf';
const dir = path.join(__dirname, '..', 'evidence', 't121', 'audit-answers-fixed');
const out = path.join(__dirname, '..', 'evidence', 't126');
const read = name => JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8'));
(async () => {
  if (!fs.existsSync(pdf)) { console.log('SKIP source PDF not on this machine'); return; }
  fs.mkdirSync(out, { recursive: true });
  const ocr = read('ocr-response.json'), diagrams = read('diagrams-response.json'), answers = read('answers-response.json');
  const browser = await chromium.launch({ headless: true, channel: process.env.E2E_BROWSER_CHANNEL || 'msedge' });
  const page = await browser.newPage({ viewport: { width: 1912, height: 914 }, acceptDownloads: true });
  let ocrCall = 0;
  await page.route('**/api/ocr', route => route.fulfill({ json: ocr[Math.min(ocrCall++, ocr.length - 1)] }));
  await page.route('**/api/diagrams', route => { const body = route.request().postDataJSON(); const record = diagrams.find(entry => entry.page === body.page)?.body || { diagrams: [] }; route.fulfill({ json: { ...record, diagrams: validateDetectedDiagrams(record.diagrams, body.page) } }); });
  for (const kind of ['source-answers', 'ai-answers']) {
    await page.route(`**/api/${kind}`, route => {
      const body = route.request().postDataJSON();
      const record = answers.find(entry => entry.url === kind && entry.page === body.page)?.body || { answers: [] };
      let rows = record.answers || [];
      // Page 2 of the original circles both ก and ง for Q9 (owner screenshot).
      const q9 = (body.questions || []).find(question => question.questionNumber === 9);
      if (kind === 'source-answers' && q9) rows = [...rows.filter(row => row.id !== q9.id), ...['ก', 'ง'].map(key => ({ id: q9.id, key, confidence: 0.97, evidence: `วงกลมล้อมรอบตัวเลือก ${key}`, bbox: [470, 160, 500, 200], page: body.page }))];
      if (kind === 'ai-answers' && q9) rows = rows.filter(row => row.id !== q9.id);
      route.fulfill({ json: { ...record, answers: rows } });
    });
  }
  const editor = page.locator('[contenteditable="true"]');
  const item = number => editor.locator('[data-item-id]').filter({ hasText: new RegExp(`^\\s*${number}\\.`) }).first();
  const rows = number => item(number).evaluate(node => Array.from(node.querySelectorAll('[data-choice-key]')).map(row => ({
    key: row.dataset.choiceKey, origin: row.dataset.answerOrigin,
    visible: Array.from(row.querySelectorAll('span')).find(span => !span.closest('[data-export-ignore],[data-answer-marker]') && /^\s*[ก-จ]\.\s*$/.test(span.textContent || ''))?.textContent.trim(),
    text: (() => { const clone = row.cloneNode(true); clone.querySelectorAll('[data-export-ignore],[data-answer-marker],input,button').forEach(n => n.remove()); return clone.textContent.replace(/^\s*[ก-จ]\.\s*/, '').replace(/\u200b/g, '').trim(); })(),
    input: row.querySelector('input[data-answer-select]')?.type,
  })));
  await page.goto(base); await page.waitForLoadState('networkidle');
  await page.locator('input[type=file]').setInputFiles(pdf);
  await page.getByRole('button', { name: 'แปลงเป็นรูปแบบข้อสอบ', exact: true }).click();
  await editor.locator('[data-item-id]').first().waitFor({ timeout: 180_000 });
  await page.getByRole('button', { name: 'วิเคราะห์เฉลยจากต้นฉบับและ AI', exact: true }).click();
  await page.waitForFunction(() => document.querySelectorAll('[data-answer-origin="source_provided"]').length >= 11, null, { timeout: 180_000 });
  // 1. Two circled keys from the original: both are source answers and the question opens in multi mode.
  let q9 = await rows(9);
  assert.deepEqual(q9.filter(row => row.origin === 'source_provided').map(row => row.key), ['ก', 'ง'], 'Q9 keeps both circled answers');
  assert.equal(await item(9).locator('[data-multi-toggle]').getAttribute('aria-pressed'), 'true');
  assert.ok(q9.every(row => row.input === 'checkbox'), 'multi mode uses checkboxes');
  await item(9).scrollIntoViewIfNeeded();
  await item(9).screenshot({ path: path.join(out, 'q9-two-answers.png') });
  // 2. Manual multi answers on Q1 (the original circles ค): add ข, remove it again, add ง, then single mode keeps the first.
  assert.deepEqual((await rows(1)).filter(row => row.origin !== 'none').map(row => row.key), ['ค']);
  await item(1).locator('[data-multi-toggle]').click();
  await item(1).getByRole('checkbox', { name: 'เฉลยข้อ 1 ตัวเลือก ข', exact: true }).click();
  assert.deepEqual((await rows(1)).filter(row => row.origin === 'manual').map(row => row.key), ['ข', 'ค'], 'adding keeps the existing answer');
  await item(1).getByRole('checkbox', { name: 'เฉลยข้อ 1 ตัวเลือก ข', exact: true }).click();
  assert.deepEqual((await rows(1)).filter(row => row.origin === 'manual').map(row => row.key), ['ค'], 'click again removes one answer');
  await item(1).getByRole('checkbox', { name: 'เฉลยข้อ 1 ตัวเลือก ง', exact: true }).click();
  assert.deepEqual((await rows(1)).filter(row => row.origin === 'manual').map(row => row.key), ['ค', 'ง']);
  await item(1).locator('[data-multi-toggle]').click();
  assert.deepEqual((await rows(1)).filter(row => row.origin === 'manual').map(row => row.key), ['ค'], 'single mode keeps the first answer');
  assert.ok((await rows(1)).every(row => row.input === 'radio'));
  // 3. Delete ข of Q2: later rows move up and re-letter.
  const before = await rows(2);
  await item(2).locator('[data-choice-key="ข"]').hover();
  await item(2).getByRole('button', { name: 'ลบตัวเลือก ข ข้อ 2', exact: true }).click();
  let q2 = await rows(2);
  assert.deepEqual(q2.map(row => row.key), ['ก', 'ข', 'ค']);
  assert.deepEqual(q2.map(row => row.visible), ['ก.', 'ข.', 'ค.'], 'visible keys re-letter too');
  assert.deepEqual(q2.map(row => row.text), [before[0].text, before[2].text, before[3].text]);
  // 4. Add a choice and type its text.
  await item(2).getByRole('button', { name: 'เพิ่มตัวเลือกข้อ 2', exact: true }).click();
  await page.keyboard.type('ตัวเลือกที่เพิ่มเอง');
  q2 = await rows(2);
  assert.deepEqual(q2.map(row => row.key), ['ก', 'ข', 'ค', 'ง']);
  assert.deepEqual(q2.map(row => row.visible), ['ก.', 'ข.', 'ค.', 'ง.'], 'the added row shows its key');
  assert.equal(q2[3].text, 'ตัวเลือกที่เพิ่มเอง');
  await item(2).getByRole('radio', { name: 'เฉลยข้อ 2 ตัวเลือก ง', exact: true }).check();
  await page.screenshot({ path: path.join(out, 'q1-q2-edited.png'), clip: { x: 958, y: 180, width: 954, height: 730 } });
  // 5. Save, reload, resume: multi answers and edited choices persist.
  await page.getByRole('button', { name: 'บันทึกแบบร่าง', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('[data-draft-saved]')?.dataset.draftSaved === 'true');
  await page.reload();
  await page.getByRole('button', { name: `ทำต่อจากแบบร่าง ${path.basename(pdf)}`, exact: true }).click();
  await editor.locator('[data-item-id]').first().waitFor();
  q9 = await rows(9);
  assert.deepEqual(q9.filter(row => row.origin !== 'none').map(row => row.key), ['ก', 'ง'], 'Q9 multi answers survive reload');
  q2 = await rows(2);
  assert.deepEqual(q2.map(row => `${row.key}:${row.text}`).slice(-1), ['ง:ตัวเลือกที่เพิ่มเอง']);
  assert.equal(q2.find(row => row.key === 'ง').origin, 'manual');
  // 6. DOCX: every correct choice carries "*", edited choices are exported.
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'ดาวน์โหลด DOCX', exact: true }).click();
  const confirm = page.getByRole('button', { name: 'ส่งออกเลย', exact: true }); if (await confirm.isVisible().catch(() => false)) await confirm.click();
  const bytes = fs.readFileSync(await (await download).path());
  fs.writeFileSync(path.join(out, 'answers-choices.docx'), bytes);
  const xml = await (await JSZip.loadAsync(bytes)).file('word/document.xml').async('string');
  const lines = xml.split('</w:p>').map(p => p.replace(/<[^>]+>/g, '').trim()).filter(Boolean);
  const block = number => { const start = lines.findIndex(line => line.startsWith(`${number}. `)); const end = lines.findIndex((line, index) => index > start && /^\d+\.\s/.test(line)); return lines.slice(start, end); };
  const q9Choices = block(9).slice(block(9).indexOf('ตัวเลือก:') + 1);
  assert.equal(q9Choices.filter(line => /\*$/.test(line)).length, 2, `Q9 exports two starred choices: ${JSON.stringify(q9Choices)}`);
  const q2Choices = block(2).slice(block(2).indexOf('ตัวเลือก:') + 1);
  assert.equal(q2Choices.length, 4); assert.match(q2Choices[3], /^ตัวเลือกที่เพิ่มเอง\s*\*$/);
  await browser.close();
  console.log('T-126 multiple answers and choice editing passed: Q9 ก+ง from the original, manual multi/single, delete+relabel, add, save/reload, DOCX stars');
})().catch(error => { console.error(error); process.exit(1); });
