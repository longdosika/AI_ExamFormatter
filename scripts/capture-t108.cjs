// T-108 evidence: builds a representative exam in the real app (answers, question image, choice images,
// shared context with image), downloads the DOCX and saves it next to an editor screenshot.
// Usage: E2E_BASE_URL=http://127.0.0.1:3000 node scripts/capture-t108.cjs [out.docx]
const fs = require('node:fs');
const path = require('node:path');
let playwright;
try { playwright = require('playwright'); } catch { playwright = require('C:/Users/nathaphat/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'); }

const base = process.env.E2E_BASE_URL || 'http://localhost:3000';
const outFile = process.argv[2] || path.join(__dirname, '..', 'evidence', 't108-sample-export.docx');
const fixture = [
  '1. ในการเลือกวิธีแยกสารผสมควรพิจารณาจากสิ่งใด\nก. สถานะของสาร\nข. จุดเดือดและจุดหลอมเหลวของสาร\nค. ลักษณะเนื้อสาร *\nง. การละลายน้ำ',
  '2. รูปร่างของผลึกจุนสีเป็นตามข้อใด\nก. รูปแบบที่หนึ่ง *\nข. รูปแบบที่สอง\nค. รูปแบบที่สาม\nง. รูปแบบที่สี่',
  'ใช้ข้อมูลในตารางต่อไปนี้ตอบคำถามข้อ 3 - 4\nทำการทดลองที่อุณหภูมิห้อง โดยนำของแข็ง A, B และ C จำนวน 5 กรัม ใส่ในบีกเกอร์แต่ละใบ',
  '3. จากการทดลอง สารใดมีสภาพการละลายได้น้อยที่สุด\nก. สาร A\nข. สาร B *\nค. สาร C\nง. ทุกสารเท่ากัน',
  '4. ถ้าให้ความร้อนแก่สารทั้ง 3 ชนิด สารใดน่าจะตกผลึกเร็วที่สุด\nก. สาร A\nข. สาร B *\nค. สาร C\nง. ไม่มีสารใดตกผลึก',
  '5. การทดลองดังรูปเหมาะกับการแยกสารใด\nก. น้ำเชื่อม\nข. น้ำทะเล\nค. น้ำอัดลม *\nง. น้ำผสมเอทานอล',
].join('\n\n');

(async () => {
  const browser = await playwright.chromium.launch({ headless: true, channel: process.env.E2E_BROWSER_CHANNEL || 'msedge' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.goto(base);
  await page.locator('input[type=file]').setInputFiles({ name: 'บทที่ 7 ชุดที่ 1 เรื่อง การแยกสาร.md', mimeType: 'text/markdown', buffer: Buffer.from(fixture) });
  await page.getByRole('button', { name: 'แปลงเป็นรูปแบบข้อสอบ', exact: true }).click();
  const nav = page.getByRole('navigation', { name: 'เลือกข้อสอบ' });
  await nav.waitFor();
  const png = async (width, height, label) => Buffer.from((await page.evaluate(([w, h, text]) => {
    const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#28332d'; ctx.lineWidth = 3; ctx.strokeRect(4, 4, w - 8, h - 8);
    ctx.fillStyle = '#28332d'; ctx.font = '28px sans-serif'; ctx.fillText(text, 24, h / 2);
    return canvas.toDataURL('image/png');
  }, [width, height, label])).split(',')[1], 'base64');
  const insert = async (question, role, choiceKey, buffer) => {
    await nav.getByRole('button', { name: `ไปข้อ ${question}`, exact: true }).click();
    const chooser = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'แทรกรูป', exact: true }).click();
    await (await chooser).setFiles({ name: 'figure.png', mimeType: 'image/png', buffer });
    const dialog = page.getByRole('dialog', { name: 'แทรกรูปจากไฟล์' });
    await dialog.waitFor();
    await dialog.locator('#crop-target').selectOption(String(question));
    await dialog.locator('#crop-role').selectOption(role);
    if (choiceKey) await dialog.getByRole('button', { name: `ตัวเลือก ${choiceKey}`, exact: true }).click();
    await dialog.getByRole('button', { name: /^แทรกภาพ/ }).click();
  };
  for (const key of ['ก', 'ข', 'ค', 'ง']) await insert(2, 'choice', key, await png(400, 330, `ผลึกแบบ ${key}`));
  await insert(3, 'shared', null, await png(1100, 240, 'ตารางผลการทดลอง A B C'));
  await insert(5, 'question', null, await png(900, 670, 'รูปอุปกรณ์การทดลอง'));
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'ดาวน์โหลด DOCX', exact: true }).click();
  fs.copyFileSync(await (await download).path(), outFile);
  await page.screenshot({ path: outFile.replace(/\.docx$/, '-editor.png') });
  console.log(`saved ${outFile}`);
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
