require('./e2e-import-helper.cjs'); // T-128: answer the duplicate-import dialog with "นำเข้าใหม่"
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { chromium } = require('playwright');
const JSZip = require('jszip');
const root = path.resolve(__dirname, '..');
const table = ['ใช้ข้อมูลจากตารางต่อไปนี้ตอบคำถามข้อ 58-61',
  'สีตัวอย่าง สีที่แยกได้ ระยะทางที่สารเคลื่อนที่ ระยะทางที่ตัวทำละลาย',
  '(cm) เคลื่อนที่ (cm)', 'สีแดง 1 8.0 10', 'สี A สีน้ำเงิน 5.5 10', 'สีเหลือง 2.8 10', 'สีแดง 2 X20', 'สี B', 'สีม่วง 12 20'].join('\n');
const compile = file => ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;

(async () => {
  const browser = await chromium.launch({ headless: true, channel: process.env.E2E_BROWSER_CHANNEL || 'msedge' });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    await page.goto(process.env.E2E_BASE_URL || 'http://127.0.0.1:3000');
    const result = await page.evaluate(async ({ modules, table }) => {
      const loaded = {};
      const load = name => {
        if (loaded[name]) return loaded[name];
        const exports = {};
        new Function('require', 'exports', modules[name])(load, exports);
        loaded[name] = exports;
        return exports;
      };
      const { cleanCapturedTableElement } = load('./captured-table-editor');
      const { cropBboxFromImage } = load('./diagram-client');
      const fixture = document.createElement('div');
      fixture.innerHTML = `<b>${table.split('\n')[0]}</b><br><em>เมื่อนำสารมาทดลอง ให้คงข้อความนี้</em><br>` +
        table.split('\n').slice(1).map(line => `<span>${line}</span><br>`).join('');
      document.body.append(fixture);
      const bold = fixture.querySelector('b'), italic = fixture.querySelector('em');
      const cleaned = cleanCapturedTableElement(fixture);
      const formattingKept = bold.isConnected && italic.isConnected && italic.textContent.includes('ให้คงข้อความนี้');
      const duplicateGone = !fixture.textContent.includes('สีม่วง') && !fixture.textContent.includes('สีตัวอย่าง');
      const idempotent = !cleanCapturedTableElement(fixture);
      fixture.remove();
      const canvas = document.createElement('canvas');
      canvas.width = 400; canvas.height = 400;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 400, 400);
      ctx.fillStyle = '#000';
      ctx.fillRect(110, 50, 60, 2); // detached solvent-front guide
      ctx.fillRect(130, 110, 8, 12);
      ctx.fillRect(130, 230, 8, 12);
      ctx.fillRect(110, 340, 60, 2); // detached origin/baseline
      const imageUrl = await cropBboxFromImage(canvas.toDataURL(), [100, 250, 900, 450], 14, 3, 'all');
      const image = new Image(); image.src = imageUrl; await image.decode();
      const cropped = document.createElement('canvas'); cropped.width = image.width; cropped.height = image.height;
      const c = cropped.getContext('2d'); c.drawImage(image, 0, 0);
      const darkRows = [];
      for (let y = 0; y < image.height; y++) {
        const pixels = c.getImageData(0, y, image.width, 1).data;
        let dark = 0;
        for (let x = 0; x < image.width; x++) if (pixels[x * 4] < 100) dark++;
        if (dark >= 50) darkRows.push(y);
      }
      return { cleaned, formattingKept, duplicateGone, idempotent, imageUrl, darkRows, height: image.height };
    }, { table, modules: {
      './formatter-rules': compile('lib/formatter-rules.ts'),
      './text-normalization': compile('lib/text-normalization.ts'),
      './exam-parser': compile('lib/exam-parser.ts'),
      './captured-table-editor': compile('lib/captured-table-editor.ts'),
      './diagram-client': compile('lib/diagram-client.ts'),
    } });
    assert.ok(result.cleaned && result.formattingKept && result.duplicateGone && result.idempotent);
    assert.equal(result.darkRows.length, 4, 'Both two-pixel horizontal guide lines survive actual Canvas crop');
    assert.ok(result.darkRows.at(-1) - result.darkRows[0] >= 290);
    fs.writeFileSync(path.join(root, 'evidence/t114-guide-crop.png'), Buffer.from(result.imageUrl.split(',')[1], 'base64'));

    // Reopen a legacy DOM snapshot: cleanup must run without OCR/AI or losing bold prose.
    const items = Array.from({ length: 12 }, (_, index) => ({ id: index + 1, questionNumber: 58 + index,
      questionText: `Question ${58 + index}`, choices: ['ก', 'ข', 'ค', 'ง'].map(key => ({ key, text: 'Choice ' + key, isCorrect: false, shadingType: 'none' })), explanationText: '',
      isSharedContextStart: index === 0, sharedContextRange: index < 4 ? { start: 58, end: 61 } : undefined,
    }));
    const html = items.map((item, index) => `<div data-item-id="${item.id}" style="min-height:340px">${index ? '' :
      `<div data-shared-context-block="true"><div class="whitespace-pre-line"><b>${table.split('\n')[0]}</b>\n${table.split('\n').slice(1).join('\n')}</div><div data-shared-image="true"><span style="display:block">รูปโจทย์ร่วม:</span><div><img src="${result.imageUrl}" alt="Shared fixture"></div></div></div>`}
      <div><b>${item.questionNumber}.</b><span data-question-text="true" class="font-light">${item.questionText}</span></div>
      ${item.choices.map(choice => `<div data-choice-key="${choice.key}"><span class="font-light">${choice.text}</span></div>`).join('')}</div>`).join('');
    await page.evaluate(({ items, html }) => localStorage.setItem('exam-formatter-document-drafts-v1', JSON.stringify({ schemaVersion: 1, drafts: [{ id: 't114', docKey: 't114-capture.pdf-123', fileName: 't114-capture.pdf', fileBytes: 123, updatedAt: new Date().toISOString(), ocrText: '1. fixture', formattedItems: items, editorHtml: html, itemCount: items.length }] })), { items, html });
    await page.reload();
    await page.getByRole('button', { name: 'แบบร่างและแคช OCR', exact: true }).click();
    await page.getByRole('dialog').locator('li').filter({ hasText: 't114-capture.pdf' }).getByRole('button', { name: 'เปิดทำต่อ', exact: true }).click();
    const editor = page.locator('[contenteditable=true]');
    await editor.waitFor();
    assert.ok(!(await editor.innerText()).includes('สีม่วง 12 20'));
    assert.ok(await editor.locator('[data-shared-context-block] b').count());
    assert.equal(await editor.locator('[data-shared-image] img').count(), 1);
    const downloadEvent = page.waitForEvent('download');
    await page.getByRole('button', { name: 'ดาวน์โหลด DOCX', exact: true }).click();
    const zip = await JSZip.loadAsync(fs.readFileSync(await (await downloadEvent).path()));
    const xml = await zip.file('word/document.xml').async('string');
    assert.ok(!xml.includes('สีม่วง 12 20') && xml.includes('ใช้ข้อมูลจากตาราง'));
    assert.ok(Object.keys(zip.files).some(file => file.startsWith('word/media/')));
    await page.screenshot({ path: path.join(root, 'evidence/t114-restored-cleanup.png'), fullPage: true });
    await editor.locator('[data-item-id="2"] [data-question-text]').click();
    await page.getByLabel('เลือกไฟล์รูปเพื่อแทรก', { exact: true }).setInputFiles({ name: 'shared.png', mimeType: 'image/png', buffer: Buffer.from(result.imageUrl.split(',')[1], 'base64') });
    const dialog = page.getByRole('dialog', { name: 'แทรกรูปจากไฟล์' });
    await dialog.waitFor();
    assert.equal(await page.locator('#crop-target').inputValue(), '2', 'Suggest actual clicked item id, not displayed question number');
    await page.locator('#crop-role').selectOption('shared');
    await editor.evaluate(node => { node.scrollTop = node.scrollHeight; });
    await dialog.getByRole('button', { name: /^แทรกภาพ/ }).click();
    await page.waitForFunction(() => {
      const pane = document.querySelector('[contenteditable=true]'), image = pane?.querySelector('[data-item-id="1"] [data-shared-image] img');
      if (!image) return false;
      const r = image.getBoundingClientRect(), p = pane.getBoundingClientRect();
      return r.top >= p.top && r.top < p.bottom;
    });
    assert.equal(await editor.locator('[data-item-id="2"] img').count(), 0, 'Shared image belongs to range start, never a duplicate on another member');
    const sharedImage = editor.locator('[data-item-id="1"] [data-shared-image] img');
    await sharedImage.hover();
    const tools = page.getByRole('toolbar', { name: 'จัดการรูปภาพ' });
    await tools.waitFor();
    const toolBox = await tools.boundingBox(), paneBox = await page.locator('[data-workspace="conversion"]').boundingBox();
    assert.ok(toolBox.x >= paneBox.x && toolBox.x + toolBox.width <= paneBox.x + paneBox.width, 'Narrow-image controls stay entirely inside the editor pane');
    await page.screenshot({ path: path.join(root, 'evidence/t114-image-tools.png'), fullPage: true });
    await tools.getByRole('button', { name: 'ขนาดรูป 50%', exact: true }).click();
    assert.equal(await sharedImage.getAttribute('data-export-scale'), '0.5');
    await sharedImage.hover();
    const replacementChooser = page.waitForEvent('filechooser');
    await tools.getByRole('button', { name: 'เปลี่ยนรูปจากไฟล์', exact: true }).click();
    const picker = await replacementChooser;
    await page.mouse.move(1, 1);
    await page.waitForTimeout(400);
    await picker.setFiles({ name: 'replacement.png', mimeType: 'image/png', buffer: Buffer.from(result.imageUrl.split(',')[1], 'base64') });
    await page.getByRole('status').filter({ hasText: 'เปลี่ยนรูปแล้ว' }).waitFor();
    await page.setViewportSize({ width: 390, height: 844 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await page.screenshot({ path: path.join(root, 'evidence/t114-mobile.png'), fullPage: true });
    fs.writeFileSync(path.join(root, 'evidence/t114-capture-results.json'), JSON.stringify({ status: 'passed', synthetic: true, styledCleanup: true, idempotent: true, guideLineRows: result.darkRows.length, legacyDraftCleaned: true, actualDocxChecked: true, contextualUpload: true, sharedRangeOwner: true, resizedAndReplaced: true, mobileNoOverflow: true }, null, 2));
    console.log('PASS T-114 styled/legacy table cleanup, actual DOCX, complete crop pixels and mobile width');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
