const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const b = await chromium.launch({ headless: true, channel: 'msedge' });
  const p = await b.newPage();
  await p.setViewportSize({ width: 1440, height: 1100 });
  p.on('console', msg => console.log('PAGE_LOG:', msg.text()));

  await p.goto('http://localhost:3000');
  const pdfBuf = fs.readFileSync('C:/Users/nathaphat/.gemini/antigravity/brain/82ac165c-57d1-452c-ba17-cfd4425cb1c4/.user_uploaded/media_1791938569863_98eb2182.pdf');
  await p.locator('input[type=file]').setInputFiles({ name: 'chapter7.pdf', mimeType: 'application/pdf', buffer: pdfBuf });
  
  const convertBtn = p.getByRole('button', { name: 'แปลงเป็นรูปแบบข้อสอบ' });
  await convertBtn.waitFor({ state: 'visible', timeout: 50000 });
  await p.waitForFunction(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('แปลงเป็นรูปแบบข้อสอบ'));
    return btn && !btn.disabled;
  }, null, { timeout: 60000 });
  await convertBtn.click();

  await p.waitForTimeout(1000);
  const harvestBtn = p.getByRole('button', { name: /สกัดรูปประกอบ/ });
  await harvestBtn.waitFor({ timeout: 5000 });
  await harvestBtn.click();

  console.log('Harvest button clicked, waiting for harvest to complete (button becomes "สกัดรูปแล้ว")...');
  await p.waitForFunction(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('สกัดรูปแล้ว'));
    return Boolean(btn);
  }, null, { timeout: 90000 });
  console.log('Harvest completed successfully!');

  // Scroll to Q16
  await p.evaluate(() => {
    const q16 = document.querySelector('[data-item-id="16"]');
    if (q16) {
      q16.scrollIntoView({ behavior: 'instant', block: 'start' });
    }
  });
  await p.waitForTimeout(1500);

  // Inspect Q16
  const q16Data = await p.evaluate(() => {
    const q16 = document.querySelector('[data-item-id="16"]');
    if (!q16) return { found: false };
    const choices = Array.from(q16.querySelectorAll('[data-choice-key]')).map(c => ({
      key: c.getAttribute('data-choice-key'),
      hasImg: Boolean(c.querySelector('img')),
      imgSrc: c.querySelector('img')?.src?.slice(0, 45) || null
    }));
    return {
      found: true,
      questionText: q16.querySelector('.font-light')?.textContent?.trim()?.slice(0, 80),
      choicesCount: choices.length,
      choices
    };
  });
  console.log('Q16 Evaluation:', JSON.stringify(q16Data, null, 2));

  // Inspect Q17 & shared context
  const q17Data = await p.evaluate(() => {
    const q17 = document.querySelector('[data-item-id="17"]');
    if (!q17) return { found: false };
    const sharedBlock = q17.querySelector('[data-shared-context-block="true"]');
    const sharedImg = sharedBlock?.querySelector('[data-shared-image="true"] img');
    return {
      found: true,
      hasSharedBlock: Boolean(sharedBlock),
      hasSharedImg: Boolean(sharedImg),
      sharedImgSrc: sharedImg?.src?.slice(0, 45) || null
    };
  });
  console.log('Q17 Evaluation:', JSON.stringify(q17Data, null, 2));

  // Take screenshot of view
  await p.screenshot({ path: 'evidence/t076-q16-q17-verified.png' });
  console.log('Verified screenshot saved to evidence/t076-q16-q17-verified.png');

  // Also scroll slightly to capture Q17 shared context table completely
  await p.evaluate(() => {
    const q17 = document.querySelector('[data-item-id="17"]');
    if (q17) {
      q17.scrollIntoView({ behavior: 'instant', block: 'start' });
    }
  });
  await p.waitForTimeout(1000);
  await p.screenshot({ path: 'evidence/t076-q17-table-verified.png' });
  console.log('Verified screenshot saved to evidence/t076-q17-table-verified.png');

  await b.close();
})();
