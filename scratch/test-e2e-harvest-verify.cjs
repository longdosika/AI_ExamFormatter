const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const b = await chromium.launch({ headless: true, channel: 'msedge' });
  const p = await b.newPage();
  p.on('console', msg => console.log('PAGE_LOG:', msg.text()));
  p.on('pageerror', err => console.log('PAGE_ERROR:', err.message));
  p.on('response', async res => {
    if (res.url().includes('/api/diagrams')) {
      console.log('DIAGRAM_API:', res.status());
      try {
        const text = await res.text();
        console.log('DATA:', text.slice(0, 150));
      } catch(e) {}
    }
  });

  await p.goto('http://localhost:3000');
  const pdfBuf = fs.readFileSync('C:/Users/nathaphat/.gemini/antigravity/brain/82ac165c-57d1-452c-ba17-cfd4425cb1c4/.user_uploaded/media_1791938569863_98eb2182.pdf');
  await p.locator('input[type=file]').setInputFiles({ name: 'chapter7.pdf', mimeType: 'application/pdf', buffer: pdfBuf });
  
  console.log('Waiting for convert button...');
  const convertBtn = p.getByRole('button', { name: 'แปลงเป็นรูปแบบข้อสอบ' });
  await convertBtn.waitFor({ timeout: 25000 });
  await convertBtn.click();
  console.log('Clicked convert button!');

  await p.waitForTimeout(1500);
  const harvestBtn = p.getByRole('button', { name: /สกัดรูปประกอบ/ });
  await harvestBtn.waitFor({ timeout: 5000 });
  console.log('Clicking harvest diagrams button...');
  await harvestBtn.click();

  // Wait for harvest notice or finish
  console.log('Waiting for diagram harvesting to process pages (up to 90s)...');
  await p.waitForFunction(() => {
    const text = document.body.textContent || '';
    return text.includes('สกัดรูปประกอบสำเร็จ');
  }, { timeout: 90000 });

  console.log('Harvest finished! Inspecting Q16 and Q17 in editor...');
  await p.waitForTimeout(2000);

  // Jump to Q16
  const q16Btn = p.getByRole('button', { name: 'ไปข้อ 16' });
  if (await q16Btn.count()) {
    await q16Btn.click();
    await p.waitForTimeout(1000);
  }

  // Check Q16 choice images count
  const q16ChoiceImages = await p.evaluate(() => {
    const q16 = document.querySelector('[data-item-id="16"]');
    if (!q16) return { found: false };
    const choiceImgs = Array.from(q16.querySelectorAll('[data-choice-image] img')).map(img => img.src.slice(0, 40));
    return { found: true, choiceImgsCount: choiceImgs.length, choiceImgs };
  });
  console.log('Q16 Result:', JSON.stringify(q16ChoiceImages));

  // Check Q17 shared context image
  const q17SharedImage = await p.evaluate(() => {
    const q17 = document.querySelector('[data-item-id="17"]');
    if (!q17) return { found: false };
    const sharedImg = q17.querySelector('[data-shared-image] img');
    return { found: true, hasSharedImage: Boolean(sharedImg), src: sharedImg ? sharedImg.src.slice(0, 40) : null };
  });
  console.log('Q17 Result:', JSON.stringify(q17SharedImage));

  await p.screenshot({ path: 'evidence/t076-harvested-q16-q17.png', fullPage: true });
  console.log('Screenshot saved to evidence/t076-harvested-q16-q17.png');

  await b.close();
})();
