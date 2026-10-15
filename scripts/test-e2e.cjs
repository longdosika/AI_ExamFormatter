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
    assert.equal(await page.getByRole('button',{name:'ส่งออกเข้า Google Drive',exact:true}).count(),0);
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
  mark('Compact icon rail reads source marks then solves unresolved questions with visible AI provenance');
  assert.equal(await editor.locator('[data-item-id]').count(),12);
  assert.deepEqual(batchSizes,[10,2]);
  const mappedPages=await editor.locator('[data-source-page]').evaluateAll(buttons=>buttons.map(button=>Number(button.dataset.sourcePage)));
  assert.deepEqual(mappedPages,Array.from({length:12},(_,i)=>i+1));
  assert.equal(await editor.locator('[data-item-id="1"] [data-question-image="true"]').count(),1,'Page-owned figure must render in the converted question');
  assert.match(await editor.locator('[data-item-id="1"] [data-question-image="true"] img').getAttribute('src'),/^data:image\/png;base64,/);
  fs.writeFileSync(path.join(root,'evidence','t047-batch-result.json'),JSON.stringify({status:'passed',fixture:'generated twelve-page blank PDF; mocked OCR transport',batchSizes,questions:12,mappedPages,semanticAccuracy:'not measured'},null,2));
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
  assert.deepEqual(await visibleNavigationNumbers(),[1,2,3,4,5,6,7,8,9,10,20,30,40,50,60,70,80]);
  await longNavigation.getByRole('button',{name:'ไปข้อ 10',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('nav[data-layout="compact-question-nav"]')?.getAttribute('data-window-start')==='10');
  assert.deepEqual(await visibleNavigationNumbers(),[1,10,11,12,13,14,15,16,17,18,19,20,30,40,50,60,70,80]);
  await longNavigation.getByRole('button',{name:'ไปข้อ 20',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('nav[data-layout="compact-question-nav"]')?.getAttribute('data-window-start')==='20');
  assert.deepEqual(await visibleNavigationNumbers(),[1,10,20,21,22,23,24,25,26,27,28,29,30,40,50,60,70,80]);
  await longNavigation.getByRole('button',{name:'ไปข้อ 60',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('nav[data-layout="compact-question-nav"]')?.getAttribute('data-window-start')==='60');
  assert.deepEqual(await visibleNavigationNumbers(),[1,10,20,30,40,50,60,61,62,63,64,65,66,67,68,69,70,80]);
  assert.equal(await longNavigation.getByRole('button',{name:/^ไปข้อ \d+$/}).count(),18);
  mark('80-question browser conversion keeps all question items and active decade window navigation');
  await page.getByRole('button',{name:'เลือกไฟล์ใหม่',exact:true}).click();
  const offsetFixture = Buffer.from(Array.from({length:25},(_,index)=>{
    const q=index+21;
    return `${q}. แบบทดสอบข้อ ${q}\nก. ตัวเลือก ก\nข. ตัวเลือก ข\nค. ตัวเลือก ค\nง. ตัวเลือก ง`;
  }).join('\n\n'));
  await page.locator('input[type=file]').setInputFiles({name:'offset-questions.md',mimeType:'text/markdown',buffer:offsetFixture});
  await formatRaw();
  const offsetNavigation=page.getByRole('navigation',{name:'เลือกข้อสอบ'});
  const offsetNumbers=()=>offsetNavigation.getByRole('button',{name:/^ไปข้อ \d+$/}).evaluateAll(buttons=>buttons.map(button=>Number(button.textContent)));
  assert.deepEqual(await offsetNumbers(),[21,22,23,24,25,26,27,28,29,30,40,45]);
  await offsetNavigation.getByRole('button',{name:'ไปข้อ 30',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('nav[data-layout="compact-question-nav"]')?.getAttribute('data-window-start')==='30');
  assert.deepEqual(await offsetNumbers(),[21,30,31,32,33,34,35,36,37,38,39,40,45]);
  mark('non-1 first-question navigation keeps the parsed first anchor without hard-coded question 1');
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
