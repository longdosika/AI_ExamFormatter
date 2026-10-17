require('./e2e-import-helper.cjs'); // T-128: answer the duplicate-import dialog with "นำเข้าใหม่"
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const base = process.env.E2E_BASE_URL || 'http://127.0.0.1:3000';
const root = path.resolve(__dirname, '..');

(async () => {
  const browser = await chromium.launch({ headless: true, channel: process.env.E2E_BROWSER_CHANNEL || 'msedge' });
  try {
    const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
    let connected = false, failure = false, sourceWrites = 0, outputWrites = 0, imports = 0;
    const collection = { id: 'fixture_collection', name: 'Library fixture [abc12345]', mimeType: 'application/vnd.google-apps.folder', properties: { aefHash: 'a'.repeat(64) } };
    const files = [{ id: 'fixture_source', name: 'original.pdf', size: '123', properties: { aefRole: 'source' } }, { id: 'fixture_output', name: 'Version one.docx', createdTime: '2026-10-16T09:00:00Z', webViewLink: 'https://drive.google.com/file/d/fixture_output/view', properties: { aefRole: 'output', aefBuild: 'fixture-1' } }];
    await page.route('**/api/google/session', route => route.fulfill({ json: { configured: true, connected, folderReady: connected } }));
    await page.route('**/api/google/library*', async route => {
      const request = route.request(), action = request.headers()['x-library-action'];
      if (request.method() === 'GET') return route.fulfill({ json: new URL(request.url()).searchParams.has('collection') ? { collection, files } : { collections: [collection] } });
      if (failure) return route.fulfill({ status: 503, json: { error: 'Fixture archive unavailable' } });
      if (action === 'source') { sourceWrites++; return route.fulfill({ json: { collection, source: files[0] } }); }
      if (action === 'output') { outputWrites++; return route.fulfill({ json: { output: files[1] } }); }
      if (action === 'import') {
        const value = request.postDataJSON(); assert.equal(value.confirmed, true); assert.equal(value.outputId, 'fixture_output');
        imports++; files.push({ id: 'fixture_import', name: 'QuizFlow copied snapshot.docx', properties: { aefRole: 'quizflow-import', aefOutputId: value.outputId, aefImportedAt: 'fixture-date' } });
        return route.fulfill({ json: { imported: files.at(-1) } });
      }
      throw new Error('Unexpected library action ' + action);
    });
    await page.goto(base);
    const libraryButton = page.getByRole('button', { name: 'คลังไฟล์บน Drive', exact: true });
    const toolPositions = () => page.getByRole('group', { name: 'เครื่องมือเสริม' }).boundingBox();
    await page.getByRole('button', { name: 'เลือกไฟล์ข้อสอบ', exact: true }).hover();
    const beforeHover = await toolPositions();
    await libraryButton.hover();
    await page.waitForTimeout(500);
    assert.ok((await toolPositions()).width > beforeHover.width, 'T-118 owner explicitly restored inline expansion');
    assert.equal(await libraryButton.locator('.ui-rail-label').evaluate(node => getComputedStyle(node).position), 'static', 'Labels expand inline, not as a flyout');
    for (let attempt = 0; attempt < 3; attempt++) {
      await page.getByRole('button', { name: 'เลือกไฟล์ข้อสอบ', exact: true }).hover();
      await page.getByRole('group', { name: 'เครื่องมือเสริม' }).hover();
      await page.waitForTimeout(180);
      await libraryButton.click();
      await page.getByRole('dialog', { name: 'คลังไฟล์บน Drive' }).waitFor();
      await page.getByRole('button', { name: 'ปิดคลังไฟล์', exact: true }).click();
    }
    await page.getByRole('button', { name: 'คลังไฟล์บน Drive', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'คลังไฟล์บน Drive' });
    await dialog.getByRole('button', { name: /Library fixture/ }).waitFor();
    await dialog.getByRole('textbox', { name: 'ค้นหาชุดเอกสาร' }).fill('missing');
    assert.equal(await dialog.getByRole('button', { name: /Library fixture/ }).count(), 0);
    await dialog.getByRole('textbox', { name: 'ค้นหาชุดเอกสาร' }).fill('Library');
    await dialog.getByRole('button', { name: /Library fixture/ }).click();
    await dialog.getByRole('button', { name: 'บันทึกว่านำเข้า QuizFlow แล้ว' }).click();
    assert.equal(imports, 0);
    assert.equal(await dialog.getByRole('button', { name: 'ยืนยันและเก็บสำเนา' }).isEnabled(), false);
    await dialog.getByRole('checkbox').check();
    await dialog.getByRole('button', { name: 'ยืนยันและเก็บสำเนา' }).click();
    await dialog.getByText(/^QuizFlow copied snapshot\.docx/).waitFor();
    assert.equal(imports, 1);
    await page.screenshot({ path: path.join(root, 'evidence/t116-library-desktop.png'), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await dialog.evaluate(node => node.scrollWidth <= node.clientWidth), true, 'mobile modal does not overflow');
    await page.screenshot({ path: path.join(root, 'evidence/t116-library-mobile.png'), fullPage: true });
    await dialog.getByRole('button', { name: 'ปิดคลังไฟล์' }).click();
    await page.setViewportSize({ width: 1366, height: 900 });
    await page.locator('input[type=file]').setInputFiles({ name: 'queued.md', mimeType: 'text/markdown', buffer: Buffer.from('1. Source question\nก. First*\nข. Second\nค. Third\nง. Fourth') });
    await page.getByRole('button', { name: 'แปลงเป็นรูปแบบข้อสอบ', exact: true }).click();
    await page.locator('[contenteditable=true]').waitFor();
    const downloading = page.waitForEvent('download');
    await page.getByRole('button', { name: 'ดาวน์โหลด DOCX', exact: true }).click();
    assert.ok(fs.statSync(await (await downloading).path()).size > 0);
    await page.getByText(/output ยังรอเก็บ Drive/).waitFor();
    assert.equal(sourceWrites + outputWrites, 0, 'offline download does not require Drive writes');
    connected = true; failure = true;
    await page.reload();
    await page.getByRole('button', { name: 'คลังไฟล์บน Drive', exact: true }).click();
    await dialog.getByRole('button', { name: 'ส่ง output ที่ค้าง (1)' }).waitFor();
    await dialog.getByRole('button', { name: 'ส่ง output ที่ค้าง (1)' }).click();
    await dialog.getByRole('alert').getByText('Fixture archive unavailable', { exact: true }).waitFor();
    failure = false;
    await dialog.getByRole('button', { name: 'ส่ง output ที่ค้าง (1)' }).click();
    await dialog.getByText('ส่ง output ที่ค้างแล้ว', { exact: true }).waitFor();
    assert.equal(outputWrites, 1);
    assert.equal(imports, 1, 'retry/archive never adds import confirmations');
    await page.reload();
    await page.getByRole('button', { name: 'คลังไฟล์บน Drive', exact: true }).click();
    await dialog.getByRole('button', { name: /Library fixture/ }).waitFor();
    assert.equal(await dialog.getByRole('button', { name: /ส่ง output ที่ค้าง/ }).count(), 0, 'successful queue removal persists across reload');
    await dialog.getByRole('button', { name: 'ปิดคลังไฟล์' }).press('Escape');
    assert.equal(await dialog.count(), 0);
    assert.equal(await page.getByRole('button', { name: 'คลังไฟล์บน Drive', exact: true }).evaluate(node => document.activeElement === node), true);
    await page.evaluate(() => localStorage.setItem('exam-formatter-document-drafts-v1', JSON.stringify({ schemaVersion: 1, drafts: [{ id: 'legacy-no-original', docKey: 'legacy-no-original', fileName: 'legacy-no-original.pdf', fileBytes: 100, updatedAt: new Date().toISOString(), ocrText: '1. Legacy', itemCount: 1, formattedItems: [{ id: 1, questionNumber: 1, questionText: 'Legacy without source', choices: [], explanationText: '' }] }] })));
    await page.reload();
    await page.getByRole('button', { name: 'ทำต่อจากแบบร่าง legacy-no-original.pdf', exact: true }).click();
    const legacyDownload = page.waitForEvent('download');
    await page.getByRole('button', { name: 'ดาวน์โหลด DOCX', exact: true }).click();
    assert.ok(fs.statSync(await (await legacyDownload).path()).size > 0);
    await page.getByText(/ไม่ได้เพิ่มรายการนี้เข้าคิว Drive/).waitFor();
    await page.getByRole('button', { name: 'คลังไฟล์บน Drive', exact: true }).click();
    await dialog.getByRole('button', { name: /Library fixture/ }).waitFor();
    assert.equal(await dialog.getByRole('button', { name: /ส่ง output ที่ค้าง/ }).count(), 0, 'legacy source-less download never creates an unrecoverable archive entry');
    fs.writeFileSync(path.join(root, 'evidence/t116-ui-result.json'), JSON.stringify({ passed: true, sourceWrites, outputWrites, imports, cloud: 'mocked', browser: process.env.E2E_BROWSER_CHANNEL || 'msedge', checks: ['search/group', 'explicit confirmation', 'desktop/mobile', 'offline download', 'durable queue/reload', 'failed retry retains snapshot', 'successful retry removes queue', 'Escape/focus'] }, null, 2));
    console.log('Library browser regressions passed (mocked Drive; real downloaded DOCX and IndexedDB queue).');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
