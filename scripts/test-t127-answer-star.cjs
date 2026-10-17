// T-127: owner screenshot on 261017-1342 — a choice the user added and marked as the answer had no "*" and was not
// saved as correct. Reproduced: add a choice, select it first, then click its text and type -> the first character
// went into the editable star span, the "typed star" rule cleared the answer and the letter was lost. Also checks
// "แยกตัวเลือก" keeps the new key visible and the text out of the bold key span.
// Usage: E2E_BASE_URL=http://localhost:3000 node scripts/test-t127-answer-star.cjs
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
const out = path.join(__dirname, '..', 'evidence', 't127');
const read = name => JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8'));
(async () => {
  if (!fs.existsSync(pdf)) { console.log('SKIP source PDF not on this machine'); return; }
  fs.mkdirSync(out, { recursive: true });
  const ocr = read('ocr-response.json'), diagrams = read('diagrams-response.json'), answers = read('answers-response.json');
  const browser = await chromium.launch({ headless: true, channel: process.env.E2E_BROWSER_CHANNEL || 'msedge' });
  const page = await browser.newPage({ viewport: { width: 1912, height: 914 }, acceptDownloads: true });
  let ocrCall = 0;
  await page.route('**/api/ocr', route => route.fulfill({ json: ocr[Math.min(ocrCall++, ocr.length - 1)] }));
  await page.route('**/api/diagrams', route => { const body = route.request().postDataJSON(); const record = diagrams.find(e => e.page === body.page)?.body || { diagrams: [] }; route.fulfill({ json: { ...record, diagrams: validateDetectedDiagrams(record.diagrams, body.page) } }); });
  for (const kind of ['source-answers', 'ai-answers']) await page.route(`**/api/${kind}`, route => { const body = route.request().postDataJSON(); route.fulfill({ json: answers.find(e => e.url === kind && e.page === body.page)?.body || { answers: [] } }); });
  const editor = page.locator('[contenteditable="true"]');
  const item = n => editor.locator('[data-item-id]').filter({ hasText: new RegExp(`^\\s*${n}\\.`) }).first();
  const rows = n => item(n).evaluate(node => Array.from(node.querySelectorAll('[data-choice-key]')).map(row => {
    const key = Array.from(row.querySelectorAll('span')).find(span => !span.closest('[data-export-ignore],[data-answer-marker]') && /^\s*[ก-จ]\.\s*$/.test(span.textContent || ''));
    const clone = row.cloneNode(true); clone.querySelectorAll('[data-export-ignore],[data-answer-marker],input,button').forEach(n => n.remove());
    return { key: row.dataset.choiceKey, visibleKey: key?.textContent.trim(), keyBold: Boolean(key), origin: row.dataset.answerOrigin, star: row.querySelector('[data-answer-marker]')?.textContent || '', text: clone.textContent.replace(/^\s*[ก-จ]\.\s*/, '').replace(/\u200b/g, '').trim() };
  }));
  await page.goto(base); await page.waitForLoadState('networkidle');
  await page.locator('input[type=file]').setInputFiles(pdf);
  await page.getByRole('button', { name: 'แปลงเป็นรูปแบบข้อสอบ', exact: true }).click();
  await editor.locator('[data-item-id]').first().waitFor({ timeout: 180_000 });
  // 1. The owner's order on Q14: add a choice, select it, then click its text and type.
  await item(14).getByRole('button', { name: 'เพิ่มตัวเลือกข้อ 14', exact: true }).click();
  await item(14).getByRole('radio', { name: 'เฉลยข้อ 14 ตัวเลือก จ', exact: true }).check();
  const box = await item(14).locator('[data-choice-key="จ"]').boundingBox();
  await page.mouse.click(box.x + box.width - 140, box.y + box.height / 2);
  await page.keyboard.type('ตัวเลือกที่เพิ่มเป็นเฉลย');
  await page.mouse.click(20, 400);
  const q14 = await rows(14);
  assert.deepEqual(q14.at(-1), { key: 'จ', visibleKey: 'จ.', keyBold: true, origin: 'manual', star: ' *', text: 'ตัวเลือกที่เพิ่มเป็นเฉลย' }, `typed after selecting keeps the answer and its star: ${JSON.stringify(q14.at(-1))}`);
  await item(14).screenshot({ path: path.join(out, 'q14-added-answer.png') });
  // 2. "แยกตัวเลือก" on Q15: the new ง shows its key, its text is not in the bold key span, and it can be the answer.
  await page.getByRole('button', { name: 'แยกตัวเลือก ค และ ง ข้อ 15', exact: true }).click();
  await item(15).getByRole('radio', { name: 'เฉลยข้อ 15 ตัวเลือก ง', exact: true }).check();
  const q15 = await rows(15);
  assert.deepEqual(q15.slice(-2).map(row => [row.visibleKey, row.text, row.origin, row.star]), [['ค.', 'การระเหยและการกลั่น', 'none', ''], ['ง.', 'การระเหยและการตกผลึก', 'manual', ' *']]);
  assert.equal(await item(15).locator('[data-choice-key="ง"] span.font-bold').first().textContent(), 'ง. ', 'split text stays out of the key span');
  await item(15).screenshot({ path: path.join(out, 'q15-split-answer.png') });
  // 3. Save, reload and export: the answer is stored and exported with "*".
  await page.getByRole('button', { name: 'บันทึกแบบร่าง', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('[data-draft-saved]')?.dataset.draftSaved === 'true');
  await page.reload();
  await page.getByRole('button', { name: `ทำต่อจากแบบร่าง ${path.basename(pdf)}`, exact: true }).click();
  await editor.locator('[data-item-id]').first().waitFor();
  for (const [number, key] of [[14, 'จ'], [15, 'ง']]) { const row = (await rows(number)).find(entry => entry.key === key); assert.equal(row.origin, 'manual', `Q${number} answer survives reload`); assert.equal(row.star, ' *'); }
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'ดาวน์โหลด DOCX', exact: true }).click();
  const confirm = page.getByRole('button', { name: 'ส่งออกเลย', exact: true }); if (await confirm.isVisible().catch(() => false)) await confirm.click();
  const xml = await (await JSZip.loadAsync(fs.readFileSync(await (await download).path()))).file('word/document.xml').async('string');
  const lines = xml.split('</w:p>').map(p => p.replace(/<[^>]+>/g, '').trim()).filter(Boolean);
  const choicesOf = number => { const start = lines.findIndex(line => line.startsWith(`${number}. `)); return lines.slice(lines.indexOf('ตัวเลือก:', start) + 1, lines.findIndex((line, index) => index > start && /^\d+\.\s/.test(line))); };
  assert.match(choicesOf(14).at(-1), /^ตัวเลือกที่เพิ่มเป็นเฉลย\s+\*$/, `DOCX marks the added answer: ${JSON.stringify(choicesOf(14))}`);
  assert.match(choicesOf(15).at(-1), /^การระเหยและการตกผลึก\s+\*$/, `DOCX marks the split answer: ${JSON.stringify(choicesOf(15))}`);
  await browser.close();
  console.log('T-127 added choice answer keeps its star through typing, save/reload and DOCX');
})().catch(error => { console.error(error); process.exit(1); });
