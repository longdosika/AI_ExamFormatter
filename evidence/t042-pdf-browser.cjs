const fs=require('node:fs');const assert=require('node:assert/strict');
let chromium;try{({chromium}=require('playwright'));}catch{({chromium}=require('C:/Users/nathaphat/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));}
(async()=>{const browser=await chromium.launch({headless:true,channel:'msedge'});try{
 const page=await browser.newPage({viewport:{width:1600,height:1000}});
 let ocrCalls=0;const errors=[];page.on('request',r=>{if(r.url().endsWith('/api/ocr'))ocrCalls++;});page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:3001/');const started=Date.now();
 await page.locator('input[type=file]').setInputFiles('D:/0-Project/10-Obsidian/quizflow/tmp/บทที่ 7 ชุดที่ 2 เรื่อง การแยกสาร.pdf');
 const editor=page.locator('[contenteditable=true]').first();await editor.waitFor({timeout:90000});
 assert.equal(await editor.locator('[data-item-id]').count(),25);
 assert.equal(await editor.locator('img').count(),5);
 assert.equal(ocrCalls,0);
 assert.ok(await page.getByText(/โหลดฉบับตรวจแก้ที่ตรงกับไฟล์ต้นฉบับ 25 ข้อ/).count());
 const sourcePages=await editor.locator('[data-source-page]').evaluateAll(buttons=>buttons.map(b=>Number(b.dataset.sourcePage)));
 assert.deepEqual(sourcePages,[...Array(6).fill(1),...Array(4).fill(2),...Array(10).fill(3),...Array(5).fill(4)]);
 const question25=editor.locator('[data-item-id="25"]');await question25.scrollIntoViewIfNeeded();
 await question25.locator('[data-source-page="4"]').click();await page.waitForTimeout(800);
 const source=page.locator('[data-source-page-target="4"]');
 const visible=await source.evaluate(el=>{let pane=el.parentElement;while(pane&&getComputedStyle(pane).overflowY!=='auto')pane=pane.parentElement;return pane?Math.abs(el.getBoundingClientRect().top-pane.getBoundingClientRect().top)<35:false;});
 assert.ok(visible,'Source-page button must align the original page 4');
 await question25.locator('img').evaluate(img=>img.decode());
 await page.screenshot({path:'evidence/t042-real-pdf-result.png'});
 assert.deepEqual(errors,[]);
 const result={status:'passed',source:'Original supplied PDF, not a renamed transcript',questions:25,choices:100,mediaGroups:5,ocrCalls,sourcePages,sourcePageNavigation:'passed',durationMs:Date.now()-started,url:'http://127.0.0.1:3001/',reuseNotice:'visible',noBrowserErrors:true};
 fs.writeFileSync('evidence/t042-real-pdf-result.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
