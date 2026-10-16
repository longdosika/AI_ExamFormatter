const assert = require('node:assert/strict');
const JSZip = require('jszip');
const fs = require('node:fs');
const path = require('node:path');
const {spawn} = require('node:child_process');
// T-108: on this Windows host another process briefly holds freshly written evidence files
// (open fails with errno -4094 UNKNOWN, file is writable moments later). Retry evidence writes
// only for those transient codes; assertion failures are never retried.
const TRANSIENT_WRITE = new Set(['UNKNOWN','EBUSY','EPERM','EACCES']);
const pause = ms => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,ms);
const writeFileSyncOnce = fs.writeFileSync.bind(fs);
fs.writeFileSync = (file,...rest) => { for (let attempt = 1; ; attempt++) { try { return writeFileSyncOnce(file,...rest); } catch (error) { if (!TRANSIENT_WRITE.has(error.code) || attempt >= 8) throw error; pause(150 * attempt); } } };
const writeFileOnce = fs.promises.writeFile.bind(fs.promises);
fs.promises.writeFile = async (file,...rest) => { for (let attempt = 1; ; attempt++) { try { return await writeFileOnce(file,...rest); } catch (error) { if (!TRANSIENT_WRITE.has(error.code) || attempt >= 8) throw error; await new Promise(resolve => setTimeout(resolve,150 * attempt)); } } };
// Playwright download.saveAs copies the artifact into evidence/, so copies need the same transient retry.
const copyFileOnce = fs.promises.copyFile.bind(fs.promises);
fs.promises.copyFile = async (...args) => { for (let attempt = 1; ; attempt++) { try { return await copyFileOnce(...args); } catch (error) { if (!TRANSIENT_WRITE.has(error.code) || attempt >= 8) throw error; await new Promise(resolve => setTimeout(resolve,150 * attempt)); } } };
const copyFileSyncOnce = fs.copyFileSync.bind(fs);
fs.copyFileSync = (...args) => { for (let attempt = 1; ; attempt++) { try { return copyFileSyncOnce(...args); } catch (error) { if (!TRANSIENT_WRITE.has(error.code) || attempt >= 8) throw error; pause(150 * attempt); } } };
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
    // Use the same Windows realpath shim as the supported npm dev command.
    // Directly spawning Next can exit before readiness on this workspace.
    server=spawn(process.execPath,['-r',path.join(root,'scripts','next-realpath-shim.cjs'),next,'dev','-p',String(port),'-H','127.0.0.1'],{cwd:root,windowsHide:true,stdio:['ignore','pipe','pipe'],env:{...process.env,NEXT_DIST_DIR:e2eDistDir}});
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
  let sourceAnswerCalls=0;
  await page.route('**/api/source-answers', route => { sourceAnswerCalls++; return route.fulfill({status:200,json:{answers:[],model:'mock-ui-only'}}); });
  let aiAnswerCalls=0;
  await page.route('**/api/ai-answers', route => {
    aiAnswerCalls++;
    const body=route.request().postDataJSON();
    return route.fulfill({status:200,json:{answers:(body.questions || []).map(question=>({id:question.id,key:question.keys[0],confidence:0.92,evidence:'mocked AI reasoning for deterministic browser verification'})),model:'mock-ai-solver'}});
  });
  console.log('Browser launched; opening app');
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(base);
  await page.getByRole('button', { name: 'เลือกไฟล์ข้อสอบ' }).waitFor();
  await page.locator('input[type=file]').setInputFiles({name:'source.md',mimeType:'text/markdown',buffer:fixture});
  const editor=page.locator('[contenteditable=true]');
  const formatRaw = async () => {
    try {
      await page.getByRole('textbox',{name:'ข้อความ OCR สำหรับตรวจแก้',exact:true}).waitFor();
    } catch (error) {
      console.error('formatRaw diagnostic body:', (await page.locator('body').innerText()).slice(-5000));
      await page.screenshot({path:path.join(root,'evidence','t068-format-raw-timeout.png'),fullPage:true});
      throw error;
    }
    assert.equal(await editor.count(),0,'Import must show raw text before explicit conversion');
    assert.equal(await page.getByRole('button',{name:'ส่งออกเข้า Google Drive',exact:true}).count(),1,'Raw OCR can be exported before conversion');
    assert.equal(await page.getByRole('button',{name:'ตัวหนา',exact:true}).count(),0);
    await page.getByRole('button',{name:'แปลงเป็นรูปแบบข้อสอบ',exact:true}).click();
    await editor.waitFor();
    const tools=page.locator('[data-editor-tools]');assert.equal(await tools.count(),1);
    assert.equal(await page.locator('[data-layout="compact-conversion-header"]').count(),1,'Conversion header must use the compact layout contract');
    assert.equal(await page.locator('[data-layout="compact-question-nav"]').count(),1,'Question navigation must use the compact layout contract');
    const header=await tools.evaluate(element=>element.parentElement.getBoundingClientRect().toJSON());const nav=await page.getByRole('navigation',{name:'เลือกข้อสอบ'}).boundingBox();assert.ok(header.bottom<=nav.y+1,'Tools belong to header above question navigation');
  };
  await formatRaw();
  const iconStepper=page.locator('[data-layout="icon-stepper"]');
  assert.equal(await iconStepper.count(),1);
  assert.equal(await iconStepper.locator('[data-step="format"], [data-step="diagrams"], [data-step="answers"], [data-step="review"]').count(),4,'Stepper keeps four stable icon slots');
  assert.equal(await page.locator('[data-layout="editor-toast"]').count(),0,'Editor notices do not reserve a layout row');
  assert.equal(await page.locator('main > div[role="alert"]').count(),0,'Review findings are not duplicated as a full-width alert');
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
    assert.ok(await page.getByRole('button',{name:/แว่นขยาย/}).isDisabled(),'Image magnifier is unavailable for a plain-text original');
    await page.getByRole('navigation',{name:'เลือกข้อสอบ'}).getByRole('button',{name:'ไปข้อ 1',exact:true}).click();
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
  await rawOcr.fill(responseText);
  assert.equal(await page.getByRole('button',{name:'ตรวจสอบและจัดรูปแบบ',exact:true}).count(),0);
  await page.getByRole('button',{name:'แปลงเป็นรูปแบบข้อสอบ',exact:true}).click();
  await editor.waitFor();
  assert.equal(await editor.locator('[data-item-id]').count(),1);
  mark('Unknown image retains raw text and allows explicit reviewed reconversion');
  // Review must validate the live DOM without rebuilding it from parser text.
  // Inject all managed media roles into an intentionally incomplete draft and
  // confirm the review click preserves them and their single labels.
  const reviewFixtureImage = 'data:image/png;base64,' + png.toString('base64');
  await editor.evaluate((root, imageUrl) => {
    const item = root.querySelector('[data-item-id]');
    if (!item) throw new Error('review fixture item missing');
    const questionText = item.querySelector('.text-slate-900');
    if (questionText) questionText.textContent += ' รูปโจทย์: รูปโจทย์:';
    const question = document.createElement('div');
    question.dataset.questionImage = 'true';
    question.innerHTML = `<span>รูปโจทย์:</span><img src="${imageUrl}" alt="รูปโจทย์">`;
    item.appendChild(question);
    const shared = document.createElement('div');
    shared.dataset.sharedContextBlock = 'true';
    shared.innerHTML = `<div data-shared-image="true"><span>รูปโจทย์ร่วม:</span><img src="${imageUrl}" alt="รูปโจทย์ร่วม"></div>`;
    item.appendChild(shared);
    const choice = item.querySelector('[data-choice-key="ก"]');
    if (!choice) throw new Error('review fixture choice missing');
    const choiceImage = document.createElement('div');
    choiceImage.dataset.choiceImage = 'true';
    choiceImage.innerHTML = `<img src="${imageUrl}" alt="รูปตัวเลือก ก">`;
    choice.appendChild(choiceImage);
    const explanation = document.createElement('div');
    explanation.dataset.explanationImage = 'true';
    explanation.innerHTML = `<span>รูปคำอธิบาย:</span><img src="${imageUrl}" alt="รูปคำอธิบาย">`;
    item.appendChild(explanation);
    root.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText' }));
  }, reviewFixtureImage);
  const reviewButton = page.getByRole('button',{name:'ตรวจสอบฉบับแก้ไข',exact:true});
  await reviewButton.waitFor();
  assert.equal(await reviewButton.isDisabled(),false);
  const mediaBeforeReview = {
    question: await editor.locator('[data-item-id]').first().locator('[data-question-image] img').count(),
    shared: await editor.locator('[data-item-id]').first().locator('[data-shared-image="true"] img').count(),
    choice: await editor.locator('[data-item-id]').first().locator('[data-choice-image="true"] img').count(),
    explanation: await editor.locator('[data-item-id]').first().locator('[data-explanation-image="true"] img').count(),
  };
  await reviewButton.click();
  await page.waitForTimeout(100);
  const reviewedItem = editor.locator('[data-item-id]').first();
  assert.equal(await reviewedItem.locator('[data-question-image] img').count(),mediaBeforeReview.question);
  assert.equal(await reviewedItem.locator('[data-shared-image="true"] img').count(),mediaBeforeReview.shared);
  assert.equal(await reviewedItem.locator('[data-choice-image="true"] img').count(),mediaBeforeReview.choice);
  assert.equal(await reviewedItem.locator('[data-explanation-image="true"] img').count(),mediaBeforeReview.explanation);
  assert.ok(mediaBeforeReview.question > 0 && mediaBeforeReview.shared > 0 && mediaBeforeReview.choice > 0 && mediaBeforeReview.explanation > 0);
  assert.equal(await reviewedItem.locator('[data-question-image]').evaluateAll(nodes => nodes.every(node => Array.from(node.querySelectorAll('span,p')).filter(label => label.textContent?.trim() === 'รูปโจทย์:').length === 1)),true);
  assert.equal(await reviewedItem.locator('[data-shared-image="true"]').evaluateAll(nodes => nodes.every(node => Array.from(node.querySelectorAll('span,p')).filter(label => label.textContent?.trim() === 'รูปโจทย์ร่วม:').length === 1)),true);
  assert.equal(await reviewedItem.locator('[data-explanation-image="true"]').evaluateAll(nodes => nodes.every(node => Array.from(node.querySelectorAll('span,p')).filter(label => label.textContent?.trim() === 'รูปคำอธิบาย:').length === 1)),true);
  assert.equal(await reviewedItem.locator('.text-slate-900').evaluateAll(nodes => nodes.every(node => !/(?:รูปโจทย์:|รูปโจทย์ร่วม:)/u.test(node.textContent || ''))),true,'Managed image labels must not remain in question text');
  mark('Review preserves question/shared/choice/explanation images and managed labels');
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
  for(let i=0;i<12;i++) objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 120 120] /Resources << >> /Contents ${15+i} 0 R >>`);
  for(let i=0;i<12;i++) {
    const content=`q 0.9 0.9 0.9 rg 8 8 104 104 re f 0 0.43 0.47 rg 20 20 80 80 re f 0.95 0.38 0.3 rg ${28+i} 35 24 48 re f Q`;
    objects.push(`<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`);
  }
  let pdf='%PDF-1.4\n';const offsets=[0];
  objects.forEach((object,index)=>{offsets.push(Buffer.byteLength(pdf));pdf+=`${index+1} 0 obj\n${object}\nendobj\n`;});
  const xref=Buffer.byteLength(pdf);
  pdf+=`xref\n0 ${offsets.length}\n0000000000 65535 f \n${offsets.slice(1).map(offset=>String(offset).padStart(10,'0')+' 00000 n \n').join('')}trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  fs.writeFileSync(path.join(root,'evidence','t047-12-page-fixture.pdf'),pdf);
  const batchSizes=[];let pageNumber=0;
  await page.route('**/api/ocr',async route=>{
    const images=route.request().postDataJSON().images;batchSizes.push(images.length);
    assert.ok(images.length<=10);
    const text=images.map((_image,index)=>`[PAGE ${index+1}]\n${++pageNumber}. Batch source ${pageNumber}${pageNumber === 1 ? ' [รูปต้องตรวจสอบ]' : ''}\nก. one\nข. two\nค. three\nง. four`).join('\n\n');
    await route.fulfill({json:{success:true,text,allPagesSuccess:true,quality:'ready',questionMarkers:images.length,pageResults:images.map((_image,index)=>({page:index+1,success:true,modelUsed:'fixture-transport'}))}});
  });
  await page.locator('input[type=file]').setInputFiles({name:'twelve-pages.pdf',mimeType:'application/pdf',buffer:Buffer.from(pdf)});
  await formatRaw();
  const answerStep=page.locator('[data-layout="icon-stepper"] [data-step="answers"]');
  const answerBox=await answerStep.boundingBox();
  assert.ok(answerBox && answerBox.width === 32 && answerBox.height === 32,'Answer action keeps fixed icon geometry');
  await answerStep.click();
  await page.waitForFunction(()=>document.querySelector('[data-layout="compact-status"]')?.getAttribute('aria-label')?.includes('ตรวจเฉลยเสร็จ'));
  assert.ok(sourceAnswerCalls > 0,'Answer icon invokes automatic source-answer analysis');
  assert.ok(aiAnswerCalls > 0,'Answer icon invokes AI fallback when source answers are absent');
  assert.ok((await editor.innerText()).includes('เฉลยจาก AI'),'AI answer provenance is visible after fallback');
  const assertSingleAnswers = async () => {
    const rows = await editor.locator('[data-choice-key]').evaluateAll(nodes => nodes.map(row => ({
      markers: row.querySelectorAll('[data-answer-marker]').length,
      badges: row.querySelectorAll('[data-answer-badge]').length,
      stars: (row.textContent.match(/\*/g) || []).length,
      selected: row.dataset.answerOrigin !== 'none',
      labels: (row.textContent.match(/เฉลย(?:จากต้นฉบับ|จาก AI|โดยผู้ใช้)/g) || []).length,
    })));
    for (const row of rows) {
      assert.equal(row.markers, 1); assert.equal(row.badges, 1);
      assert.equal(row.stars, row.selected ? 1 : 0);
      assert.equal(row.labels, row.selected ? 1 : 0);
    }
  };
  await assertSingleAnswers();
  await answerStep.click();
  await page.waitForFunction(()=>document.querySelector('[data-layout="compact-status"]')?.getAttribute('aria-label')?.includes('ตรวจเฉลยเสร็จ'));
  await assertSingleAnswers();
  mark('Asynchronous and repeated AI answer updates render exactly one star and origin badge');
  mark('Compact icon rail reads source marks then solves unresolved questions with visible AI provenance');
  assert.equal(await editor.locator('[data-item-id]').count(),12);
  assert.deepEqual(batchSizes,[10,2]);
  const mappedPages=await editor.locator('[data-source-page]').evaluateAll(buttons=>buttons.map(button=>Number(button.dataset.sourcePage)));
  assert.deepEqual(mappedPages,Array.from({length:12},(_,i)=>i+1));
  assert.equal(await editor.locator('[data-item-id="1"] [data-question-image="true"]').count(),1,'Page-owned figure must render in the converted question');
  assert.match(await editor.locator('[data-item-id="1"] [data-question-image="true"] img').getAttribute('src'),/^data:image\/png;base64,/);
  fs.writeFileSync(path.join(root,'evidence','t047-batch-result.json'),JSON.stringify({status:'passed',fixture:'generated twelve-page colored PDF; mocked OCR transport',batchSizes,questions:12,mappedPages,semanticAccuracy:'not measured'},null,2));
  await page.screenshot({path:path.join(root,'evidence','t047-batch-browser.png'),fullPage:true});
  mark('Twelve-page PDF splits 10+2 requests, preserves source pages, and renders page-owned figure media (mocked OCR)');
  const navigation=page.getByRole('navigation',{name:'เลือกข้อสอบ'});
  assert.equal(await navigation.getByRole('button',{name:/^ไปข้อ \d+$/}).count(),12);
  const sourceScrollBefore=await page.locator('[data-source-page-target="1"]').evaluate(element=>{let pane=element.parentElement;while(pane&&getComputedStyle(pane).overflowY!=='auto')pane=pane.parentElement;return pane.scrollTop;});
  await navigation.getByRole('button',{name:'ไปข้อ 12',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('nav[aria-label="เลือกข้อสอบ"] [aria-current="true"]')?.textContent==='12');
  const sourceScrollAfter=await page.locator('[data-source-page-target="1"]').evaluate(element=>{let pane=element.parentElement;while(pane&&getComputedStyle(pane).overflowY!=='auto')pane=pane.parentElement;return pane.scrollTop;});
  assert.equal(sourceScrollAfter,sourceScrollBefore,'Question jump must not move original');
  await navigation.getByRole('button',{name:'ไปข้อ 11',exact:true}).click();
  await navigation.getByRole('button',{name:'ไปข้อ 10',exact:true}).focus();
  await page.keyboard.press('Enter');
  await page.waitForFunction(()=>document.querySelector('nav[aria-label="เลือกข้อสอบ"] [aria-current="true"]')?.textContent==='10');
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
  await page.route('**/api/diagrams',route=>route.fulfill({json:{diagrams:[]}}));
  await page.locator('[data-step="diagrams"]').click();
  await page.getByRole('button',{name:'สกัดรูปแล้ว (สกัดซ้ำได้)',exact:true}).waitFor();
  await page.mouse.move(5,5);
  const originalPageSrc=await page.locator('[data-source-page-target="1"] img').getAttribute('src');
  const callsBeforeRestore={source:sourceAnswerCalls,ai:aiAnswerCalls,ocr:batchSizes.length};
  const openNamedDraft=async name=>{
    await page.getByRole('button',{name:'แบบร่างและแคช OCR',exact:true}).click();
    await page.getByRole('dialog').locator('li').filter({hasText:name}).getByRole('button',{name:'เปิดทำต่อ',exact:true}).click();
    await page.getByRole('dialog').waitFor({state:'hidden'});
    await editor.waitFor();
  };
  await page.reload();await openNamedDraft('twelve-pages.pdf');
  assert.equal(await page.locator('[data-source-page-target]').count(),12);
  assert.equal(await page.locator('[data-source-page-target="1"] img').getAttribute('src'),originalPageSrc);
  assert.equal(await page.locator('[data-step="diagrams"]').evaluate(node=>getComputedStyle(node).opacity),'0.4');
  assert.equal(await page.locator('[data-step="answers"]').evaluate(node=>getComputedStyle(node).opacity),'0.4');
  await page.getByRole('button',{name:'แว่นขยายส่องเฉพาะจุด',exact:true}).click();
  assert.equal(await page.getByRole('button',{name:'แว่นขยายส่องเฉพาะจุด',exact:true}).getAttribute('aria-pressed'),'true');
  await page.getByRole('button',{name:'แว่นขยายส่องเฉพาะจุด',exact:true}).click();
  await openNamedDraft('source.md');
  assert.equal(await page.locator('[data-source-page-target]').count(),0,'Opening another draft never reuses PDF media');
  assert.match(await page.locator('[data-source-original-only="text"]').innerText(),/Source question alpha/);
  await openNamedDraft('twelve-pages.pdf');
  assert.equal(await page.locator('[data-source-page-target]').count(),12);
  assert.deepEqual({source:sourceAnswerCalls,ai:aiAnswerCalls,ocr:batchSizes.length},callsBeforeRestore);
  await page.evaluate(async()=>{
    await new Promise((resolve,reject)=>{const request=indexedDB.open('exam-formatter-originals-v1',1);request.onerror=()=>reject(request.error);request.onsuccess=()=>{const db=request.result;const tx=db.transaction('sources','readwrite');const store=tx.objectStore('sources');const all=store.getAll();all.onsuccess=()=>all.result.filter(entry=>entry.source.fileName==='twelve-pages.pdf').forEach(entry=>store.delete(entry.key));tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>reject(tx.error);};});
  });
  await page.reload();await openNamedDraft('twelve-pages.pdf');
  await page.locator('[data-source-original-only="missing"]').waitFor();
  const stableEditorHtml=()=>editor.evaluate(node=>{const clone=node.cloneNode(true);clone.querySelectorAll('[data-source-page]').forEach(button=>button.removeAttribute('disabled'));return clone.innerHTML;});
  const existingEditedHtml=await stableEditorHtml();
  const sourceAttachInput=page.getByLabel('แนบไฟล์ต้นฉบับเดิม',{exact:true});
  await sourceAttachInput.setInputFiles({name:'wrong.pdf',mimeType:'application/pdf',buffer:Buffer.from(pdf)});
  await page.getByRole('status').filter({hasText:'ไฟล์ไม่ตรงกับแบบร่าง'}).waitFor();
  assert.equal(await stableEditorHtml(),existingEditedHtml);
  const wrongContent=Buffer.from(pdf.replace('120 120','121 120'));
  await sourceAttachInput.setInputFiles({name:'twelve-pages.pdf',mimeType:'application/pdf',buffer:wrongContent});
  await page.getByRole('status').filter({hasText:'SHA-256'}).waitFor();
  await sourceAttachInput.setInputFiles({name:'twelve-pages.pdf',mimeType:'application/pdf',buffer:Buffer.from(pdf)});
  await page.locator('[data-source-page-target="1"] img').waitFor();
  assert.equal(await stableEditorHtml(),existingEditedHtml,'Source-only attachment preserves edited text/media/answers (source jump availability may change)');
  assert.deepEqual({source:sourceAnswerCalls,ai:aiAnswerCalls,ocr:batchSizes.length},callsBeforeRestore);
  await page.screenshot({path:path.join(root,'evidence','t105-original-restored.png'),fullPage:true});
  await page.reload();await openNamedDraft('twelve-pages.pdf');
  assert.equal(await page.locator('[data-source-page-target]').count(),12,'Reattached source survives a second reload');
  await editor.locator('[data-source-page="2"]').click();
  await page.waitForFunction(()=>document.querySelector('[data-workspace="source"]')?.textContent.includes('ต้นฉบับหน้า 2/12'));
  await page.getByRole('button',{name:'แคปภาพเฉพาะจุด',exact:true}).click();
  const restoredSourceImage=await page.locator('[data-source-page-target="2"] img').boundingBox();
  await page.mouse.move(restoredSourceImage.x+30,restoredSourceImage.y+30);await page.mouse.down();await page.mouse.move(restoredSourceImage.x+100,restoredSourceImage.y+100,{steps:6});await page.mouse.up();
  await page.getByRole('dialog',{name:'แทรกภาพที่ตัดจากต้นฉบับ'}).waitFor();
  assert.match(await page.getByAltText('ภาพที่ตัดจากต้นฉบับ').getAttribute('src'),/^data:image\/png;base64,/);
  const capturedInk=await page.getByAltText('ภาพที่ตัดจากต้นฉบับ').evaluate(async image=>{await image.decode();const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);return Array.from(ctx.getImageData(0,0,canvas.width,canvas.height).data).some((value,index)=>index%4!==3&&value<250);});
  assert.ok(capturedInk,'Capture from restored original contains actual nonwhite source pixels');
  await page.getByRole('button',{name:'ปิดหน้าต่างแทรกภาพ',exact:true}).click();
  mark('Original pages persist, isolate across drafts and reattach legacy sources without rerunning OCR/AI or changing edits');
  // Long mixed-layout regression: numeric choice blocks must not be counted as
  // new questions. This mirrors the reported 80-question scan while keeping
  // the browser test deterministic and provider-independent.
  await page.getByRole('button',{name:'เลือกไฟล์ใหม่',exact:true}).click();
  const longFixture = Buffer.from(Array.from({length:80},(_,index)=>{
    const q=index+1;
    const choices = q % 2 === 0
      ? `1. ตัวเลือกหนึ่งของข้อ ${q}\n2. ตัวเลือกสองของข้อ ${q}\n3. ตัวเลือกสามของข้อ ${q}\n4. ตัวเลือกสี่ของข้อ ${q}`
      : `ก. ตัวเลือก ก ของข้อ ${q}\nข. ตัวเลือก ข ของข้อ ${q}\nค. ตัวเลือก ค ของข้อ ${q}\nง. ตัวเลือก ง ของข้อ ${q}`;
    return `${q}. โจทย์ทดสอบข้อ ${q}\n${choices}`;
  }).join('\n\n'));
  await page.locator('input[type=file]').setInputFiles({name:'eighty-questions.md',mimeType:'text/markdown',buffer:longFixture});
  await formatRaw();
  const longNumbers = await editor.locator('[data-item-id]').evaluateAll(elements=>elements.map(element=>Number(element.getAttribute('data-item-id'))));
  assert.equal(longNumbers.length,80,`Long source must expose all 80 questions; got ${longNumbers.join(',')}`);
  assert.deepEqual(longNumbers,Array.from({length:80},(_,index)=>index+1));
  const longNavigation=page.getByRole('navigation',{name:'เลือกข้อสอบ'});
  const visibleNavigationNumbers=()=>longNavigation.getByRole('button',{name:/^ไปข้อ \d+$/}).evaluateAll(buttons=>buttons.map(button=>Number(button.textContent)));
  assert.deepEqual(await visibleNavigationNumbers(),[1,10,20,30,40,50,60,70,80]);
  assert.equal(await longNavigation.locator('[data-nav-gap]').count(),8);
  await longNavigation.getByRole('button',{name:'ไปข้อ 10',exact:true}).click();
  assert.deepEqual(await visibleNavigationNumbers(),[1,10,20,30,40,50,60,70,80],'Anchor click does not unexpectedly expand a gap');
  const gap60=longNavigation.locator('[data-nav-gap="60"]');
  await gap60.focus();await page.keyboard.press('Enter');
  assert.equal(await gap60.getAttribute('aria-expanded'),'true');
  assert.deepEqual(await visibleNavigationNumbers(),[1,10,20,30,40,50,60,61,62,63,64,65,66,67,68,69,70,80]);
  assert.equal(await longNavigation.getByRole('button',{name:/^ไปข้อ \d+$/}).count(),18);
  await longNavigation.getByRole('button',{name:'ไปข้อ 66',exact:true}).click();
  await gap60.click();
  assert.equal(await gap60.getAttribute('aria-expanded'),'false');
  assert.equal(await longNavigation.locator('[aria-current="true"]').getAttribute('aria-label'),'ไปข้อ 66');
  // T-107: the collapsed range shows the current question as a marker; only one range opens at a time; strip stays one line.
  assert.equal((await longNavigation.locator('[data-nav-gap="60"] .nav-gap-marker').textContent()).trim(),'66','Collapsed range marks the current question');
  const gap20=longNavigation.locator('[data-nav-gap="20"]'), gap40=longNavigation.locator('[data-nav-gap="40"]');
  await gap20.click();
  await gap40.click();
  assert.equal(await gap20.getAttribute('aria-expanded'),'false','Opening a range closes the previous one');
  assert.equal(await gap40.getAttribute('aria-expanded'),'true');
  assert.equal(await longNavigation.locator('[data-nav-gap][aria-expanded="true"]').count(),1,'Exactly one range is open');
  await longNavigation.getByRole('button',{name:'ไปข้อ 80',exact:true}).click();
  assert.equal(await gap40.getAttribute('aria-expanded'),'false','Jumping outside the open range closes it');
  assert.ok((await longNavigation.boundingBox()).height<=48,'Question strip stays on one line');
  await gap60.click();
  await page.setViewportSize({width:390,height:844});
  await longNavigation.locator('[data-nav-gap="1"]').click();
  await longNavigation.evaluate(async nav=>{await Promise.all(nav.getAnimations({subtree:true}).map(animation=>animation.finished));});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  assert.equal(await gap60.getAttribute('aria-expanded'),'false','Mobile accordion also keeps a single open range');
  assert.ok((await longNavigation.boundingBox()).height<=48,'Mobile question strip stays on one line');
  assert.ok((await longNavigation.boundingBox()).height<=120,'Expanded mobile navigation stays compact');
  await page.screenshot({path:path.join(root,'evidence','t105-navigation-mobile.png'),fullPage:true});
  await page.emulateMedia({reducedMotion:'reduce'});
  assert.ok(Number.parseFloat(await longNavigation.locator('.nav-gap-region').first().evaluate(node=>getComputedStyle(node).transitionDuration))<0.001);
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.setViewportSize({width:1440,height:1000});
  assert.ok((await longNavigation.boundingBox()).height<=90,'Expanded desktop navigation stays compact');
  await page.screenshot({path:path.join(root,'evidence','t105-navigation.png'),fullPage:true});
  mark('80-question circular gaps expand/collapse by click and keyboard, preserve active item and fit mobile/reduced motion');
  mark('Question strip is one line with a single open range and a current-question marker');
  // T-107 image management: add from file via the insert dialog, resize (honored in DOCX), delete and undo.
  const figurePng = Buffer.from((await page.evaluate(()=>{const canvas=document.createElement('canvas');canvas.width=240;canvas.height=120;const ctx=canvas.getContext('2d');ctx.fillStyle='#006D77';ctx.fillRect(0,0,240,120);ctx.fillStyle='#F2604D';ctx.fillRect(20,20,80,80);return canvas.toDataURL('image/png');})).split(',')[1],'base64');
  await longNavigation.getByRole('button',{name:'ไปข้อ 1',exact:true}).click();
  const chooser=page.waitForEvent('filechooser');
  await page.getByRole('button',{name:'แทรกรูป',exact:true}).click();
  await (await chooser).setFiles({name:'figure.png',mimeType:'image/png',buffer:figurePng});
  const uploadDialog=page.getByRole('dialog',{name:'แทรกรูปจากไฟล์'});
  await uploadDialog.waitFor();
  await uploadDialog.getByRole('button',{name:/^แทรกภาพ/}).click();
  const addedImage=editor.locator('[data-item-id="1"] [data-question-image] img');
  assert.equal(await addedImage.count(),1,'Uploaded image is inserted into the selected question');
  await addedImage.hover();
  const imageTools=page.getByRole('toolbar',{name:'จัดการรูปภาพ'});
  await imageTools.waitFor();
  await imageTools.getByRole('button',{name:'ขนาดรูป 50%',exact:true}).click();
  assert.equal(await addedImage.getAttribute('data-export-scale'),'0.5');
  const sizedDownload=page.waitForEvent('download');
  await page.getByRole('button',{name:'ดาวน์โหลด DOCX',exact:true}).click();
  const sizedXml=await (await JSZip.loadAsync(fs.readFileSync(await (await sizedDownload).path()))).file('word/document.xml').async('string');
  assert.ok(sizedXml.includes('<wp:extent cx="1143000" cy="571500"/>'),'50% preset exports a 120x60 px image');
  // T-109 master template layout from the live editor snapshot: A4 + footer, spacer before choices, keyless indented choices.
  assert.match(sizedXml,/<w:footerReference w:type="default" r:id="footer1"\/><w:pgSz w:w="11909" w:h="16834"/,'Export uses the template A4 page with footer');
  assert.ok(sizedXml.includes('<w:spacing w:before="160" w:after="80" w:lineRule="auto"/>'),'Question paragraphs use template 160/80 spacing');
  const sizedParagraphs=sizedXml.split('<w:p>').slice(1);
  const firstChoicesLabel=sizedParagraphs.findIndex(paragraph=>paragraph.includes('>ตัวเลือก:<'));
  assert.ok(firstChoicesLabel>0 && !/<w:t[ >]/.test(sizedParagraphs[firstChoicesLabel-1]),'A spacer paragraph precedes the choices label');
  assert.ok(sizedXml.includes('<w:ind w:left="660" w:hanging="260"/>'),'Choices use the template hanging indent');
  assert.ok(sizedXml.includes('>ตัวเลือก ก ของข้อ 1<') && !sizedXml.includes('>ก. ตัวเลือก'),'Choice keys are dropped in export only');
  await addedImage.hover();
  await imageTools.getByRole('button',{name:'ลบรูป',exact:true}).click();
  assert.equal(await editor.locator('[data-item-id="1"] [data-question-image]').count(),0,'Delete removes the figure and its label');
  await page.getByRole('button',{name:'เลิกทำ',exact:true}).click();
  assert.equal(await editor.locator('[data-item-id="1"] [data-question-image] img').count(),1,'Undo restores the figure');
  mark('Editor images can be added from file, resized for export, deleted and restored');
  await page.getByRole('button',{name:'เลือกไฟล์ใหม่',exact:true}).click();
  const offsetFixture = Buffer.from(Array.from({length:25},(_,index)=>{
    const q=index+21;
    return `${q}. แบบทดสอบข้อ ${q}\nก. ตัวเลือก ก\nข. ตัวเลือก ข\nค. ตัวเลือก ค\nง. ตัวเลือก ง`;
  }).join('\n\n'));
  await page.locator('input[type=file]').setInputFiles({name:'offset-questions.md',mimeType:'text/markdown',buffer:offsetFixture});
  await formatRaw();
  const offsetNavigation=page.getByRole('navigation',{name:'เลือกข้อสอบ'});
  const offsetNumbers=()=>offsetNavigation.getByRole('button',{name:/^ไปข้อ \d+$/}).evaluateAll(buttons=>buttons.map(button=>Number(button.textContent)));
  assert.deepEqual(await offsetNumbers(),[21,30,40,45]);
  await offsetNavigation.locator('[data-nav-gap="30"]').click();
  assert.deepEqual(await offsetNumbers(),[21,30,31,32,33,34,35,36,37,38,39,40,45]);
  mark('non-1 first-question navigation keeps the parsed first anchor without hard-coded question 1');
  await page.getByRole('button',{name:'เลือกไฟล์ใหม่',exact:true}).click();
  const sparseFixture=Buffer.from(Array.from({length:25},(_,index)=>`${21+index*2}. Sparse question\nก. first\nข. second\nค. third\nง. fourth`).join('\n\n'));
  await page.locator('input[type=file]').setInputFiles({name:'sparse.md',mimeType:'text/markdown',buffer:sparseFixture});
  await formatRaw();
  const sparseNav=page.getByRole('navigation',{name:'เลือกข้อสอบ'});
  assert.deepEqual(await sparseNav.getByRole('button',{name:/^ไปข้อ \d+$/}).evaluateAll(buttons=>buttons.map(button=>Number(button.textContent))),[21,31,41,51,61,69]);
  await sparseNav.locator('[data-nav-gap="21"]').click();
  assert.deepEqual(await sparseNav.getByRole('button',{name:/^ไปข้อ \d+$/}).evaluateAll(buttons=>buttons.map(button=>Number(button.textContent))),[21,23,25,27,29,31,41,51,61,69]);
  mark('Sparse numbering uses real decade anchors without inventing missing question numbers');
  await page.getByRole('button',{name:'เลือกไฟล์ใหม่',exact:true}).click();
  await page.unroute('**/api/ocr');
  await page.route('**/api/ocr',route=>route.fulfill({status:503,json:{success:false,error:'fixture provider unavailable'}}));
  await page.locator('input[type=file]').setInputFiles({name:'failed-provider.png',mimeType:'image/png',buffer:png});
  await page.getByText(/อ่าน OCR ไม่ครบ: fixture provider unavailable/).waitFor();
  mark('Provider HTTP failure is displayed instead of asking to edit nonexistent OCR text');
  // T-101: export the current raw text, then resume an old mixed-origin draft.
  await page.getByRole('button',{name:'เลือกไฟล์ใหม่',exact:true}).click();
  await page.route('**/api/google/session',route=>route.fulfill({json:{configured:true,connected:true,folderReady:true,folderId:'fixture'}}));
  await page.reload();
  let exportedPayload;
  await page.route('**/api/google/export',route=>{exportedPayload=route.request().postDataJSON();return route.fulfill({json:{url:'https://docs.google.com/document/d/fixture-t101'}});});
  await page.locator('input[type=file]').setInputFiles({name:'t101-raw.md',mimeType:'text/markdown',buffer:Buffer.from('1. Raw export stage\nก. Only one choice')});
  const raw = page.getByRole('textbox',{name:'ข้อความ OCR สำหรับตรวจแก้'});
  await raw.waitFor();
  await raw.fill('1. Raw export stage edited\nก. Only one choice');
  const rawDownloadEvent=page.waitForEvent('download');
  await page.getByRole('button',{name:'ดาวน์โหลด DOCX',exact:true}).click();
  const rawDownload=await rawDownloadEvent;
  const rawZip=await JSZip.loadAsync(fs.readFileSync(await rawDownload.path()));
  assert.match(await rawZip.file('word/document.xml').async('text'),/Raw export stage edited/);
  await page.getByRole('button',{name:'ส่งออกเข้า Google Drive',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('a[href="https://docs.google.com/document/d/fixture-t101"]'));
  assert.ok(JSON.stringify(exportedPayload).includes('Raw export stage edited'));
  await raw.fill('1. Raw export stage edited\nก. Only one choice *');
  await page.getByRole('button',{name:'แปลงเป็นรูปแบบข้อสอบ',exact:true}).click();
  await editor.locator('[data-choice-key="ก"][data-answer-origin="manual"]').waitFor();
  mark('Raw OCR exports current edited text as real DOCX and Google payload before conversion');
  const mixedItems=[1,2,3].map((n)=>({id:n,questionNumber:n,questionText:`Origin fixture ${n}`,choices:['ก','ข','ค','ง'].slice(0,n===3?2:4).map((key,index)=>({key,text:`Choice ${key}`,isCorrect:n<3&&index===0,shadingType:n===1&&index===0?'source_provided':n===2&&index===0?'auto_solved':'none'})),explanationText:'',reconciledAnswerKey:n<3?'ก':undefined,reconciliationProvenance:n===1?'source_asterisk':n===2?'ai_generated':'unresolved',imageUrl:n===1?`data:image/png;base64,${png.toString('base64')}`:undefined}));
  await page.evaluate(items=>{
    const key='exam-formatter-document-drafts-v1';
    localStorage.setItem(key,JSON.stringify({schemaVersion:1,drafts:[{id:'t101',docKey:'t101-provenance.pdf-123',fileName:'t101-provenance.pdf',fileBytes:123,updatedAt:new Date().toISOString(),ocrText:'1. fixture',formattedItems:items,itemCount:3}]}));
  },mixedItems);
  await page.reload();
  const openOriginDraft=async()=>{
    await page.getByRole('button',{name:'แบบร่างและแคช OCR',exact:true}).click();
    await page.getByRole('dialog').locator('li').filter({hasText:'t101-provenance.pdf'}).getByRole('button',{name:'เปิดทำต่อ',exact:true}).click();
    await editor.waitFor();
  };
  await openOriginDraft();
  await page.getByRole('radio',{name:'เฉลยข้อ 3 ตัวเลือก ข',exact:true}).check();
  await assertSingleAnswers();
  const colorOf=async n=>{
    await page.waitForFunction(number=>{
      const row=document.querySelector(`[data-item-id="${number}"] [data-answer-origin]:not([data-answer-origin="none"])`);
      if(!row)return false;
      const expected={source_provided:'rgb(230, 244, 234)',auto_solved:'rgb(255, 244, 204)',manual:'rgb(227, 239, 250)'};
      return getComputedStyle(row).backgroundColor===expected[row.dataset.answerOrigin];
    },n);
    return editor.locator(`[data-item-id="${n}"] [data-answer-origin]:not([data-answer-origin="none"])`).evaluate(row=>getComputedStyle(row).backgroundColor);
  };
  assert.equal(await colorOf(1),'rgb(230, 244, 234)');
  assert.equal(await colorOf(2),'rgb(255, 244, 204)');
  assert.equal(await colorOf(3),'rgb(227, 239, 250)');
  await editor.evaluate(node=>{node.scrollTop=0;});
  await page.screenshot({path:path.join(root,'evidence','t101-three-origins.png'),fullPage:true});
  await page.setViewportSize({width:390,height:844});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),'Manual answer controls and export toolbar fit mobile width');
  await page.screenshot({path:path.join(root,'evidence','t101-three-origins-mobile.png'),fullPage:true});
  await page.setViewportSize({width:1440,height:1000});
  const imageBefore=await editor.locator('img').count();
  const draftDownloadEvent=page.waitForEvent('download');
  await page.getByRole('button',{name:'ดาวน์โหลด DOCX',exact:true}).click();
  const draftZip=await JSZip.loadAsync(fs.readFileSync(await (await draftDownloadEvent).path()));
  const draftXml=await draftZip.file('word/document.xml').async('text');
  assert.equal((draftXml.replace(/<[^>]+>/g,'').match(/\*/g)||[]).length,3,'Export keeps one answer star per selected choice');
  for (const entry of Object.values(draftZip.files).filter(entry=>entry.name.startsWith('word/media/')&&!entry.dir)) {
    const uri='data:image/png;base64,'+await entry.async('base64');
    const dimensions=await page.evaluate(async src=>{const image=new Image();image.src=src;await image.decode();return [image.naturalWidth,image.naturalHeight];},uri);
    assert.ok(dimensions.every(d=>d>0),'Exported image bytes actually decode');
  }
  // T-109 owner decision: the editor keeps three origin colours, but the export marks every answer with the
  // master template's run-level Pearl Aqua (B8F2E6), whatever the origin.
  for(const color of ['E6F4EA','FFF4CC','E3EFFA'])assert.ok(!draftXml.includes(`w:fill="${color}"`),`Export no longer uses origin colour ${color}`);
  assert.equal((draftXml.match(/<w:shd w:val="clear" w:color="auto" w:fill="B8F2E6"\/><\/w:rPr><w:t xml:space="preserve">  \*<\/w:t>/g)||[]).length,3,'Each of the three answers ends with a Pearl Aqua coral star');
  assert.equal(Object.keys(draftZip.files).filter(name=>name.startsWith('word/media/')&&!draftZip.files[name].dir).length,imageBefore);
  assert.ok((await page.locator('[data-step="review"]').getAttribute('title')).includes('รายการ'));
  exportedPayload=null;
  const googleExportResponse=page.waitForResponse('**/api/google/export');
  await page.getByRole('button',{name:'ส่งออกเข้า Google Drive',exact:true}).click();
  await googleExportResponse;
  assert.ok(exportedPayload.paragraphs.some(p=>p.background==='E3EFFA'));
  assert.equal((exportedPayload.paragraphs.flatMap(p=>p.runs).map(r=>r.text||'').join('').match(/\*/g)||[]).length,3);
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('exam-formatter-document-drafts-v1')).drafts[0].formattedItems[2].reconciliationProvenance==='manual');
  await page.reload();
  await openOriginDraft();
  assert.equal(await colorOf(3),'rgb(227, 239, 250)');
  assert.equal(await editor.locator('img').count(),imageBefore);
  await page.getByRole('radio',{name:'เฉลยข้อ 2 ตัวเลือก ข',exact:true}).check();
  assert.equal(await colorOf(2),'rgb(227, 239, 250)');
  const typedChoice=editor.locator('[data-item-id="1"] [data-choice-key="ข"] span.font-light').first();
  await typedChoice.evaluate(element=>{const range=document.createRange();range.selectNodeContents(element);range.collapse(false);const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);});
  await page.keyboard.type(' *');
  assert.equal(await editor.locator('[data-item-id="1"] [data-choice-key="ข"]').getAttribute('data-answer-origin'),'manual');
  await page.getByRole('button',{name:'ล้างเฉลยข้อ 3',exact:true}).click();
  assert.equal(await editor.locator('[data-item-id="3"] [data-answer-origin="manual"]').count(),0);
  await editor.evaluate(node=>{node.scrollTop=0;node.dispatchEvent(new Event('scroll'));});
  await page.waitForFunction(()=>document.querySelector('nav[aria-label="เลือกข้อสอบ"] [aria-current="true"]')?.textContent==='1');
  assert.equal(await colorOf(1),'rgb(227, 239, 250)','Restored HTML must not reset manual changes on scroll');
  assert.equal(await colorOf(2),'rgb(227, 239, 250)');
  await page.screenshot({path:path.join(root,'evidence','t101-answer-workflow.png'),fullPage:true});
  const legacyHtml=await editor.evaluate(node=>{
    const clone=node.cloneNode(true);
    const selected=clone.querySelector('[data-answer-origin="manual"]');
    const marker=selected.querySelector('[data-answer-marker]');
    const duplicateMarker=marker.cloneNode(true);duplicateMarker.removeAttribute('data-answer-marker');marker.after(duplicateMarker);
    const badge=selected.querySelector('[data-answer-badge]');
    const duplicateBadge=badge.cloneNode(true);duplicateBadge.removeAttribute('data-answer-badge');badge.after(duplicateBadge);
    return clone.innerHTML;
  });
  await page.evaluate(html=>{const key='exam-formatter-document-drafts-v1';const data=JSON.parse(localStorage.getItem(key));data.drafts[0].editorHtml=html;localStorage.setItem(key,JSON.stringify(data));},legacyHtml);
  await page.reload();await openOriginDraft();await assertSingleAnswers();
  assert.equal(await editor.locator('img').count(),imageBefore,'Legacy decoration repair preserves media');
  await page.screenshot({path:path.join(root,'evidence','t102-repaired-draft.png'),fullPage:true});
  mark('Legacy duplicated stars and badges are repaired on reopen without losing media');
  await editor.evaluate(node=>{
    const canvas=document.createElement('canvas');canvas.width=37;canvas.height=79;
    const context=canvas.getContext('2d');context.fillStyle='#F2604D';context.fillRect(0,0,37,79);context.fillStyle='#006D77';context.fillRect(8,12,21,55);
    const image=document.createElement('img');image.loading='lazy';image.src=canvas.toDataURL('image/webp');image.style.marginTop='10000px';image.dataset.exportFixture='offscreen';node.append(image);
  });
  const lazyDownloadEvent=page.waitForEvent('download');
  await page.getByRole('button',{name:'ดาวน์โหลด DOCX',exact:true}).click();
  const lazyBytes=fs.readFileSync(await (await lazyDownloadEvent).path());
  const lazyZip=await JSZip.loadAsync(lazyBytes);
  const lazyImages=Object.values(lazyZip.files).filter(entry=>entry.name.startsWith('word/media/')&&!entry.dir);
  assert.equal(lazyImages.length,imageBefore+1);
  const lastImage=await lazyImages.at(-1).async('base64');
  const lazyPixels=await page.evaluate(async src=>{const image=new Image();image.src=src;await image.decode();const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);return {width:canvas.width,height:canvas.height,pixel:Array.from(ctx.getImageData(18,35,1,1).data)};},'data:image/png;base64,'+lastImage);
  assert.deepEqual([lazyPixels.width,lazyPixels.height],[37,79]);
  assert.ok(lazyPixels.pixel[1]>80&&lazyPixels.pixel[2]>80&&lazyPixels.pixel[0]<40,'Canonical PNG retains teal interior pixels');
  fs.writeFileSync(path.join(root,'evidence','t102-export.docx'),lazyBytes);
  await editor.locator('[data-export-fixture]').evaluate(image=>{image.src='data:image/png;base64,AAAA';});
  const unexpectedExports=[];
  const exportListener=request=>{if(request.method()==='POST'&&request.url().endsWith('/api/export/docx'))unexpectedExports.push(request.url());};
  page.on('request',exportListener);
  await page.getByRole('button',{name:'ดาวน์โหลด DOCX',exact:true}).click();
  await page.getByRole('status').filter({hasText:'อ่านรูปภาพสำหรับส่งออกไม่ได้'}).waitFor();
  page.off('request',exportListener);
  assert.equal(unexpectedExports.length,0,'Unreadable image aborts before export API');
  await editor.locator('[data-export-fixture]').evaluate(image=>image.remove());
  mark('Offscreen WebP exports as decodable PNG with matching pixels; unreadable media aborts before upload');
  mark('Three answer colors, manual override, typed correction, clear and draft reopen preserve media');
  mark('Unreviewed formatted draft exports all answer colors and images without workflow gates');
  await page.getByRole('button',{name:'เลือกไฟล์ใหม่',exact:true}).click();
  await page.evaluate(()=>Object.defineProperty(indexedDB,'open',{configurable:true,value:()=>{throw new DOMException('Test storage unavailable','QuotaExceededError');}}));
  await page.locator('input[type=file]').setInputFiles({name:'storage-failure.md',mimeType:'text/markdown',buffer:Buffer.from('1. STORAGE_ORIGINAL\nก. original\nข. other')});
  await page.getByRole('alert').filter({hasText:'เก็บไฟล์ต้นฉบับในเครื่องไม่ได้'}).waitFor();
  assert.match(await page.locator('[data-source-original-only="text"]').innerText(),/STORAGE_ORIGINAL/);
  await page.evaluate(()=>{delete indexedDB.open;});
  mark('Original storage failure is explicit while the live source and editing remain available');
  assert.deepEqual(errors,[],'Browser runtime must have no uncaught errors');
  mark('No uncaught browser runtime errors');
  fs.writeFileSync(path.join(evidence,'results.json'),JSON.stringify({status:'passed',browser:'headless Microsoft Edge',checks,errors},null,2));
})().catch(error=>{
  console.error(error);
  fs.writeFileSync(path.join(evidence,'results.json'),JSON.stringify({status:'failed',checks,errors,failure:error.stack},null,2));
  process.exitCode=1;
}).finally(async()=>{
  if(browser) await browser.close();
  if(server) server.kill();
  try { fs.rmSync(path.join(root, e2eDistDir), { recursive: true, force: true }); } catch {}
  fs.writeFileSync(path.join(evidence,'server.log'),output.join(''));
});
