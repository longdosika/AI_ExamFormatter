const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {spawn} = require('node:child_process');
let playwright;
try { playwright = require('playwright'); } catch { playwright = require('C:/Users/nathaphat/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'); }
const root = path.resolve(__dirname,'..');
const port = Number(process.env.E2E_PORT || 3217);
let base = process.env.E2E_BASE_URL || `http://127.0.0.1:${port}`;
const e2eDistDir = `.next-e2e-${process.pid}`;
const evidence = path.join(root,'evidence','qa-iteration-2');
fs.mkdirSync(evidence,{recursive:true});
let server, browser;
const output=[];
const checks=[];
const errors=[];
const mark = name => { checks.push(name); console.log(`PASS ${name}`); };
const fixture = Buffer.from('1. Source question alpha\nก. first*\nข. second\nค. third\nง. fourth\nคำอธิบาย: ตอบ ก. source evidence\n2. Source question beta\nก. third\nข. fourth*\nค. fifth\nง. sixth\nเฉลย: ข');
async function ready() {
  const deadline=Date.now()+120000;
  while(Date.now()<deadline) {
    if(server && server.exitCode !== null) throw new Error(`Test server exited: ${output.join('')}`);
    try { if((await fetch(base,{signal:AbortSignal.timeout(2000)})).ok) return; } catch {}
    await new Promise(resolve=>setTimeout(resolve,500));
  }
  throw new Error('Local test server did not become ready');
}
(async()=>{
  let isReusing = false;
  if (!process.env.E2E_BASE_URL) {
    try {
      const ping = await fetch('http://127.0.0.1:3000', { signal: AbortSignal.timeout(1000) });
      if (ping.ok) {
        base = 'http://127.0.0.1:3000';
        isReusing = true;
      }
    } catch {}
  }
  if (!process.env.E2E_BASE_URL && !isReusing) {
    const next = require.resolve('next/dist/bin/next');
    server=spawn(process.execPath,[next,'dev','-p',String(port),'-H','127.0.0.1'],{cwd:root,windowsHide:true,stdio:['ignore','pipe','pipe'],env:{...process.env,NEXT_DIST_DIR:e2eDistDir}});
    server.on('error',error=>output.push(error.stack));
    server.stdout.on('data',data=>{output.push(data.toString());fs.writeFileSync(path.join(evidence,'server.log'),output.join(''));});
    server.stderr.on('data',data=>{output.push(data.toString());fs.writeFileSync(path.join(evidence,'server.log'),output.join(''));});
  }
  await ready();
  console.log('Local server ready; launching browser');
  browser=await playwright.chromium.launch({headless:true,channel:process.env.E2E_BROWSER_CHANNEL || 'msedge'});
  const context=await browser.newContext({viewport:{width:1440,height:1000}});
  const page=await context.newPage();
  // UI fixtures isolate the external answer provider; real Gemini evidence is t057-live.cjs.
  await page.route('**/api/source-answers', route => route.fulfill({status:200,json:{answers:[],model:'mock-ui-only'}}));
  console.log('Browser launched; opening app');
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(base);
  await page.getByRole('button', { name: 'เลือกไฟล์ข้อสอบ' }).waitFor();
  await page.locator('input[type=file]').setInputFiles({name:'source.md',mimeType:'text/markdown',buffer:fixture});
  const editor=page.locator('[contenteditable=true]');
  const formatRaw = async () => {
    await page.getByRole('textbox',{name:'ข้อความ OCR สำหรับตรวจแก้',exact:true}).waitFor();
    assert.equal(await editor.count(),0,'Import must show raw text before explicit conversion');
    assert.equal(await page.getByRole('button',{name:'ส่งออกเข้า Google Drive',exact:true}).count(),0);
    assert.equal(await page.getByRole('button',{name:'ตัวหนา',exact:true}).count(),0);
    await page.getByRole('button',{name:'แปลงเป็นรูปแบบข้อสอบ',exact:true}).click();
    await editor.waitFor();
    const tools=page.locator('[data-editor-tools]');assert.equal(await tools.count(),1);
    const header=await tools.evaluate(element=>element.parentElement.getBoundingClientRect().toJSON());const nav=await page.getByRole('navigation',{name:'เลือกข้อสอบ'}).boundingBox();assert.ok(header.bottom<=nav.y+1,'Tools belong to header above question navigation');
  };
  await formatRaw();
  const leftBox=await page.locator('[data-workspace="conversion"]').boundingBox();
  const rightBox=await page.locator('[data-workspace="source"]').boundingBox();
  assert.ok(rightBox.x < leftBox.x,'Source left and editor right');
  assert.equal(await editor.locator('[data-item-id]').count(),2);
  assert.match(await editor.innerText(),/Source question alpha/);
  assert.match(await editor.innerText(),/source evidence/);
  assert.match(await editor.innerText(),/Source question beta/);
  mark('MD source upload preserves two questions and explanation');
  await editor.click();
  await editor.locator('span.font-light').last().evaluate(element=>{const range=document.createRange();range.selectNodeContents(element);range.collapse(false);const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);});
  await page.keyboard.type(' EDIT_PRESERVED');
  const originalSource=await page.locator('[data-workspace="source"]').innerHTML();
  await editor.evaluate(element=>{
    const walker=document.createTreeWalker(element,NodeFilter.SHOW_TEXT);let node;
    while((node=walker.nextNode()))if(node.textContent.includes('EDIT_PRESERVED')){const range=document.createRange();range.selectNodeContents(node);const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);break;}
  });
  for(const label of ['ตัวหนา','ตัวเอียง','ขีดเส้นใต้'])await page.getByRole('button',{name:label,exact:true}).click();
  assert.ok(await editor.locator('b,strong').filter({hasText:'EDIT_PRESERVED'}).count());
  assert.ok(await editor.locator('i,em').filter({hasText:'EDIT_PRESERVED'}).count());
  assert.ok(await editor.locator('u').filter({hasText:'EDIT_PRESERVED'}).count());
  assert.equal(await page.locator('[data-workspace="source"]').innerHTML(),originalSource,'Source stays unchanged while editing/styles');
  mark('Explicit conversion, source-left/editor-right layout, source answers and bold/italic/underline preserve original');
  const exportButton=page.getByRole('button',{name:'ส่งออกเข้า Google Drive',exact:true});
  if(await exportButton.isDisabled()) {
    assert.ok(await exportButton.isDisabled());
    await page.getByRole('button',{name:/แว่นขยาย/}).click();
  } else {
    await exportButton.click();
    assert.match(await page.locator('body').innerText(),/ยังส่งออก Google Docs ไม่ได้|ยังไม่ได้เชื่อมต่อ|เชื่อมต่อ Google/);
  }
  assert.match(await editor.innerText(),/EDIT_PRESERVED/);
  mark('Editor edit survives action; unavailable export reports failure honestly');
  await page.screenshot({path:path.join(evidence,'desktop.png'),fullPage:true});
  await page.getByRole('button',{name:'เลือกไฟล์ใหม่',exact:true}).click();
  await page.locator('input[type=file]').setInputFiles({name:'source.md',mimeType:'text/markdown',buffer:fixture});
  await formatRaw();
  assert.doesNotMatch(await editor.innerText(),/EDIT_PRESERVED/);
  assert.equal(await editor.locator('[data-item-id]').count(),2);
  mark('Reset and same-file reupload clear prior editor content');
  await page.getByRole('button',{name:/Case Decision Engine|บันทึกปัญหาและวิธีแก้/}).click();
  await page.getByRole('button',{name:/บันทึกการตัดสินใจเคสใหม่|เพิ่มบันทึกปัญหา/}).click();
  const form=page.locator('form');
  await form.locator('input').nth(0).fill('QA reload case');
  await form.locator('textarea').nth(0).fill('Source issue');
  await form.locator('textarea').nth(1).fill('Source decision');
  await form.getByRole('button',{name:/^(บันทึกการตัดสินใจ|บันทึก)$/}).click();
  await page.getByRole('heading',{name:'QA reload case',exact:true}).waitFor();
  await page.reload();
  await page.getByRole('button',{name:/Case Decision Engine|บันทึกปัญหาและวิธีแก้/}).click();
  await page.getByRole('heading',{name:'QA reload case',exact:true}).waitFor();
  mark('Local case persists after reload');
  await page.getByRole('button',{name:/Case Decision Engine|บันทึกปัญหาและวิธีแก้/}).click();
  await page.getByRole('button',{name:'ประวัติไฟล์นำเข้า',exact:true}).click();
  const history=page.getByRole('dialog',{name:'ประวัติไฟล์นำเข้า',exact:true});
  await history.waitFor();
  assert.ok(await history.getByText('source.md',{exact:true}).count()>=2);
  await page.keyboard.press('Escape');
  assert.equal(await history.count(),0);
  mark('Filename import history persists across reload and Escape closes panel');
  await page.setViewportSize({width:390,height:844});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth <= window.innerWidth+1),'Mobile import page must not overflow horizontally');
  await page.locator('input[type=file]').setInputFiles({name:'source.md',mimeType:'text/markdown',buffer:fixture});
  await formatRaw();
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth <= window.innerWidth+1),'Mobile workspace must not overflow horizontally');
  await page.screenshot({path:path.join(evidence,'mobile.png'),fullPage:true});
  mark('390px import and editor layout stay inside viewport');
  await page.getByRole('button',{name:'เลือกไฟล์ใหม่',exact:true}).click();
  await page.locator('body').click({position:{x:2,y:2}});
  let uploadReachable=false;
  for(let i=0;i<15;i++) {
    await page.keyboard.press('Tab');
    if(await page.evaluate(()=>document.activeElement?.matches('input[type=file],button[aria-label*="ไฟล์"],button[aria-label*="file"]') || /เลือกไฟล์|นำเข้า|browse/i.test(document.activeElement?.textContent || ''))) {uploadReachable=true;break;}
  }
  assert.ok(uploadReachable,'Upload must be reachable by keyboard');
  mark('Keyboard navigation reaches upload control');
  await page.setViewportSize({width:1440,height:1000});
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j5N8AAAAASUVORK5CYII=','base64');
  const completeText = '1. New source fixture\nก. first\nข. second\nค. third\nง. fourth';
  let responseText = completeText;
  let ocrCalls = 0;
  let releaseOcr;
  await page.route('**/api/ocr', async route => {
    ocrCalls++;
    const payload = route.request().postDataJSON();
    assert.ok(payload.images[0].startsWith('data:image/png;base64,'),'OCR receives real image bytes, not a blob URL');
    if (ocrCalls === 1) await new Promise(resolve=>{releaseOcr=resolve;});
    await route.fulfill({json:{success:true,text:responseText,allPagesSuccess:true,quality:'ready',questionMarkers:1,pageResults:[{page:1,success:true,modelUsed:'fixture-transport'}]}});
  });
  await page.locator('input[type=file]').setInputFiles({name:'unknown.png',mimeType:'image/png',buffer:png});
  await page.getByRole('status',{name:'กำลังสแกน OCR',exact:true}).waitFor();
  assert.ok(await page.getByRole('button',{name:'แปลงเป็นรูปแบบข้อสอบ',exact:true}).isDisabled());
  assert.equal(await page.getByText('OCR อ่านข้อความแล้ว แต่ยังจัดโครงสร้างข้อสอบไม่ครบ',{exact:true}).count(),0);
  await page.emulateMedia({reducedMotion:'reduce'});
  assert.equal(await page.locator('.ocr-scan-line').evaluate(element=>getComputedStyle(element).animationName),'none');
  await page.screenshot({path:path.join(root,'evidence','t049-scanning.png'),fullPage:true});
  await page.emulateMedia({reducedMotion:'no-preference'});
  releaseOcr();
  await formatRaw();
  assert.match(await editor.innerText(),/New source fixture/);
  assert.equal(ocrCalls,1);
  mark('Unknown PNG enters real UI/API boundary with embedded image (mocked provider, not OCR accuracy proof)');
  await page.getByRole('button',{name:'เลือกไฟล์ใหม่',exact:true}).click();
  responseText = '1. Incomplete new source\nก. first\nข. second';
  await page.locator('input[type=file]').setInputFiles({name:'unknown-review.png',mimeType:'image/png',buffer:png});
  const rawOcr = page.getByRole('textbox',{name:'ข้อความ OCR สำหรับตรวจแก้'});
  await rawOcr.waitFor();
  assert.equal(await editor.count(),0,'Incomplete structure stays out of the exam editor');
  await rawOcr.fill(completeText);
  assert.equal(await page.getByRole('button',{name:'ตรวจสอบและจัดรูปแบบ',exact:true}).count(),0);
  await page.getByRole('button',{name:'แปลงเป็นรูปแบบข้อสอบ',exact:true}).click();
  await editor.waitFor();
  assert.equal(await editor.locator('[data-item-id]').count(),1);
  mark('Unknown image retains raw text and allows explicit reviewed reconversion');
  assert.ok(await page.getByRole('button',{name:'จัดรูปแบบแล้ว',exact:true}).isDisabled());
  fs.writeFileSync(path.join(root,'evidence','t049-result.json'),JSON.stringify({status:'passed',pendingScan:true,noPrematureWarning:true,pendingActionDisabled:true,reducedMotion:true,sourceActionUsesEditedText:true,formattedActionDisabled:true},null,2));
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button',{name:'ดาวน์โหลดสถิติการทดลอง',exact:true}).click();
  const download = await downloaded;
  const reportPath = path.join(root,'evidence','t045-experiments.json');
  await download.saveAs(reportPath);
  const report = JSON.parse(fs.readFileSync(reportPath,'utf8'));
  assert.ok(report.runs.some(run=>run.mode==='file-text'));
  assert.ok(report.runs.some(run=>run.mode==='ocr' && run.pages===1 && run.status==='structured'));
  assert.ok(report.runs.some(run=>run.mode==='ocr' && run.status==='needs-review'));
  assert.ok(report.runs.every(run=>run.semanticAccuracy===null));
  assert.ok(!JSON.stringify(report).includes('Incomplete new source'));
  await page.screenshot({path:path.join(root,'evidence','t045-statistics-browser.png'),fullPage:true});
  mark('Statistics download survives reload and separates file-text/OCR/review without source text');
  await page.getByRole('button',{name:'เลือกไฟล์ใหม่',exact:true}).click();
  await page.unroute('**/api/ocr');
  // Real PDF container with twelve blank rasterizable pages; provider is mocked.
  // This verifies import/render/orchestration, not the user's missing 12-page source.
  const objects=['<< /Type /Catalog /Pages 2 0 R >>'];
  objects.push(`<< /Type /Pages /Count 12 /Kids [${Array.from({length:12},(_,i)=>`${i+3} 0 R`).join(' ')}] >>`);
  for(let i=0;i<12;i++) objects.push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 120 120] /Resources << >> >>');
  let pdf='%PDF-1.4\n';const offsets=[0];
  objects.forEach((object,index)=>{offsets.push(Buffer.byteLength(pdf));pdf+=`${index+1} 0 obj\n${object}\nendobj\n`;});
  const xref=Buffer.byteLength(pdf);
  pdf+=`xref\n0 ${offsets.length}\n0000000000 65535 f \n${offsets.slice(1).map(offset=>String(offset).padStart(10,'0')+' 00000 n \n').join('')}trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  fs.writeFileSync(path.join(root,'evidence','t047-12-page-fixture.pdf'),pdf);
  const batchSizes=[];let pageNumber=0;
  await page.route('**/api/ocr',async route=>{
    const images=route.request().postDataJSON().images;batchSizes.push(images.length);
    assert.ok(images.length<=10);
    const text=images.map((_image,index)=>`[PAGE ${index+1}]\n${++pageNumber}. Batch source ${pageNumber}\nก. one\nข. two\nค. three\nง. four`).join('\n\n');
    await route.fulfill({json:{success:true,text,allPagesSuccess:true,quality:'ready',questionMarkers:images.length,pageResults:images.map((_image,index)=>({page:index+1,success:true,modelUsed:'fixture-transport'}))}});
  });
  await page.locator('input[type=file]').setInputFiles({name:'twelve-pages.pdf',mimeType:'application/pdf',buffer:Buffer.from(pdf)});
  await formatRaw();
  assert.equal(await editor.locator('[data-item-id]').count(),12);
  assert.deepEqual(batchSizes,[10,2]);
  const mappedPages=await editor.locator('[data-source-page]').evaluateAll(buttons=>buttons.map(button=>Number(button.dataset.sourcePage)));
  assert.deepEqual(mappedPages,Array.from({length:12},(_,i)=>i+1));
  fs.writeFileSync(path.join(root,'evidence','t047-batch-result.json'),JSON.stringify({status:'passed',fixture:'generated twelve-page blank PDF; mocked OCR transport',batchSizes,questions:12,mappedPages,semanticAccuracy:'not measured'},null,2));
  await page.screenshot({path:path.join(root,'evidence','t047-batch-browser.png'),fullPage:true});
  mark('Twelve-page PDF automatically splits 10+2 requests and preserves absolute source pages (mocked OCR)');
  const navigation=page.getByRole('navigation',{name:'เลือกข้อสอบ'});
  assert.equal(await navigation.getByRole('button',{name:/^ไปข้อ \d+$/}).count(),12);
  const sourceScrollBefore=await page.locator('[data-source-page-target="1"]').evaluate(element=>{let pane=element.parentElement;while(pane&&getComputedStyle(pane).overflowY!=='auto')pane=pane.parentElement;return pane.scrollTop;});
  await navigation.getByRole('button',{name:'ไปข้อ 12',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('nav[aria-label="เลือกข้อสอบ"] [aria-current="true"]')?.textContent==='12');
  const sourceScrollAfter=await page.locator('[data-source-page-target="1"]').evaluate(element=>{let pane=element.parentElement;while(pane&&getComputedStyle(pane).overflowY!=='auto')pane=pane.parentElement;return pane.scrollTop;});
  assert.equal(sourceScrollAfter,sourceScrollBefore,'Question jump must not move original');
  await navigation.getByRole('button',{name:'ไปข้อ 11',exact:true}).click();
  await navigation.getByRole('button',{name:'ไปข้อ 1',exact:true}).focus();
  await page.keyboard.press('Enter');
  await page.waitForFunction(()=>document.querySelector('nav[aria-label="เลือกข้อสอบ"] [aria-current="true"]')?.textContent==='1');
  await editor.evaluate(element=>{element.scrollTop=element.scrollHeight;});
  await page.waitForFunction(()=>document.querySelector('nav[aria-label="เลือกข้อสอบ"] [aria-current="true"]')?.textContent==='12');
  await page.setViewportSize({width:390,height:844});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1));
  await page.screenshot({path:path.join(root,'evidence','t050-question-navigation-mobile.png'),fullPage:true});
  await page.setViewportSize({width:1440,height:1000});
  await page.screenshot({path:path.join(root,'evidence','t050-question-navigation.png'),fullPage:true});
  fs.writeFileSync(path.join(root,'evidence','t051-result.json'),JSON.stringify({status:'passed',rawBeforeFormat:true,sourceLeftEditorRight:true,questionJump:true,stableSource:true,keyboardEnter:true,scrollHighlight:true,mobileNoOverflow:true,filenameHistory:true,textStyles:true},null,2));
  await page.screenshot({path:path.join(root,'evidence','t051-workspace.png'),fullPage:true});
  mark('Question numbered navigation, stable original, keyboard, scroll highlight and mobile width passed');
  await page.getByRole('button',{name:'เลือกไฟล์ใหม่',exact:true}).click();
  await page.unroute('**/api/ocr');
  await page.route('**/api/ocr',route=>route.fulfill({status:503,json:{success:false,error:'fixture provider unavailable'}}));
  await page.locator('input[type=file]').setInputFiles({name:'failed-provider.png',mimeType:'image/png',buffer:png});
  await page.getByText(/อ่าน OCR ไม่ครบ: fixture provider unavailable/).waitFor();
  mark('Provider HTTP failure is displayed instead of asking to edit nonexistent OCR text');
  assert.deepEqual(errors,[],'Browser runtime must have no uncaught errors');
  mark('No uncaught browser runtime errors');
  fs.writeFileSync(path.join(evidence,'results.json'),JSON.stringify({status:'passed',browser:'headless Microsoft Edge',checks,errors},null,2));
})().catch(error=>{
  fs.writeFileSync(path.join(evidence,'results.json'),JSON.stringify({status:'failed',checks,errors,failure:error.stack},null,2));
  console.error(error);process.exitCode=1;
}).finally(async()=>{
  if(browser) await browser.close();
  if(server) server.kill();
  try { fs.rmSync(path.join(root, e2eDistDir), { recursive: true, force: true }); } catch {}
  fs.writeFileSync(path.join(evidence,'server.log'),output.join(''));
});
