// T-121: DOM-level checks for master-template order repair and image-only choice rows (lib/harvest-editor.ts),
// run in a real browser so the DOM APIs match the editor.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const ts = require('typescript');
const { chromium } = require('playwright');
// The module runs in the page without a bundler: inline its one runtime import (CROP_VERSION, T-124).
const harvestSource = fs.readFileSync(path.join(__dirname, '..', 'lib', 'harvest-editor.ts'), 'utf8')
  .replace(/^import \{ CROP_VERSION \} from "\.\/figure-text-cleanup";\r?$/m, 'const CROP_VERSION = "2";');
const source = ts.transpileModule(harvestSource, { compilerOptions: { module: ts.ModuleKind.None, target: ts.ScriptTarget.ES2020 } }).outputText
  .replace(/^import[^\n]*\n/gm, '').replace(/^export /gm, '').replace(/Object\.defineProperty\(exports[^\n]*\n/g, '').replace(/^exports\.[^\n]*\n/gm, '');
const item = (id, figureAfter) => `<div data-item-id="${id}"><p>${id}. <span data-question-text="true">stem ${id}</span></p>
  ${figureAfter ? '' : '<div data-question-image="true"><p>รูปโจทย์:</p><img alt="q"></div>'}
  <div class="choices"><div>ตัวเลือก:</div><div class="list">${['ก', 'ข'].map(key => `<div data-choice-key="${key}" data-answer-origin="none"><span>${key}. </span><span>text ${key}</span><span data-answer-marker="true"></span><input data-answer-select="${key}" aria-label="เลือกเฉลยข้อ ${id} ตัวเลือก ${key}"></div>`).join('')}</div></div>
  ${figureAfter ? '<div data-question-image="true"><p>รูปโจทย์:</p><img alt="q"></div>' : ''}</div>`;
(async () => {
  const browser = await chromium.launch({ headless: true, channel: process.env.E2E_BROWSER_CHANNEL || 'msedge' });
  const page = await browser.newPage();
  await page.setContent(`<div id="root">${item(1, true)}${item(2, false)}<div data-item-id="3"><p>3. <span data-question-text="true">ภาพ</span></p><div class="choices"><div>ตัวเลือก:</div><div class="list"></div></div></div><div data-item-id="4"><p>4. <span data-question-text="true">ไม่มีส่วนตัวเลือก</span></p></div></div>`);
  const result = await page.evaluate(code => {
    eval(code + ';window.orderItemSections=orderItemSections;window.mergeHarvestedEditor=mergeHarvestedEditor;');
    const root = document.getElementById('root');
    const order = id => Array.from(root.querySelector(`[data-item-id="${id}"]`).children).map(child => child.hasAttribute('data-question-image') ? 'figure' : child.classList.contains('choices') ? 'choices' : 'stem');
    const moved = window.orderItemSections(root);
    const again = window.orderItemSections(root);
    const html = window.mergeHarvestedEditor(root, [], [{ id: 2, questionText: 'stem 2', choices: [{ key: 'ก', text: 'text ก' }, { key: 'ข', text: 'text ข' }, { key: 'ค', text: '', imageUrl: 'data:image/png;base64,AA==' }] },
      { id: 3, questionText: 'ภาพ', choices: ['ก', 'ข', 'ค', 'ง'].map(key => ({ key, text: '', imageUrl: 'data:image/png;base64,AA==' })) },
      { id: 4, questionText: 'ไม่มีส่วนตัวเลือก', choices: ['ก', 'ข'].map(key => ({ key, text: '', imageUrl: 'data:image/png;base64,AA==' })) }]);
    const merged = document.createElement('div'); merged.innerHTML = html;
    const keys = id => Array.from(merged.querySelectorAll(`[data-item-id="${id}"] [data-choice-key]`)).map(row => row.dataset.choiceKey + (row.querySelector('[data-choice-image] img') ? '+img' : '') + ':' + (row.textContent || '').trim());
    const labels = id => Array.from(merged.querySelectorAll(`[data-item-id="${id}"] div`)).filter(div => div.childElementCount === 0 && div.textContent.trim() === 'ตัวเลือก:').length;
    return { moved, again, first: order(1), second: order(2), keys2: keys(2), keys3: keys(3), keys4: keys(4), labels3: labels(3), labels4: labels(4) };
  }, source);
  assert.equal(result.moved, 1, 'old draft figure after choices is moved once');
  assert.equal(result.again, 0, 'idempotent');
  assert.deepEqual(result.first, ['stem', 'figure', 'choices']);
  assert.deepEqual(result.second, ['stem', 'figure', 'choices']);
  assert.deepEqual(result.keys2, ['ก:ก. text ก', 'ข:ข. text ข', 'ค+img:ค.']);
  assert.deepEqual(result.keys3, ['ก+img:ก.', 'ข+img:ข.', 'ค+img:ค.', 'ง+img:ง.'], 'a question without choice rows gets a choices section with four image rows');
  assert.equal(result.labels3, 1, 'an existing empty choices section is reused, not duplicated');
  assert.equal(result.labels4, 1, 'a question without a choices section gets exactly one');
  assert.deepEqual(result.keys4, ['ก+img:ก.', 'ข+img:ข.']);
  await browser.close();
  console.log('T-121 template order repair and image-only choice rows passed');
})().catch(error => { console.error(error); process.exit(1); });
