require('./e2e-import-helper.cjs'); // T-128: answer the duplicate-import dialog with "นำเข้าใหม่"
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {chromium}=require('playwright');
const base=process.env.E2E_BASE_URL||'http://localhost:3000';
const source=Buffer.from('6. source six\nก. first\nข. second\nค. third\nง. fourth\n7. source seven\nก. first\nข. second\nค. third\nง. fourth');
const hash=crypto.createHash('sha256').update(source).digest('hex');
const group={id:'fixture_collection_t121',name:'T121 draft collection',mimeType:'application/vnd.google-apps.folder',properties:{aefHash:hash}};
const sourceFile={id:'fixture_source_t121',name:'t121-legacy.md',size:String(source.length),properties:{aefRole:'source',aefHash:hash}};
let snapshot,backupCount=0,remoteRequests=0;
(async()=>{
 const browser=await chromium.launch({headless:true,channel:process.env.E2E_BROWSER_CHANNEL||'msedge'});
 try {
  const page=await browser.newPage({viewport:{width:1912,height:914}}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('https://untrusted.example/**',route=>{remoteRequests++;return route.abort();});
  await page.route('**/api/google/session',route=>route.fulfill({json:{configured:true,connected:true,folderReady:true}}));
  await page.route('**/api/google/library**',route=>{
    const url=new URL(route.request().url()),action=route.request().headers()['x-library-action'];
    if(route.request().method()==='POST') {
      if(action==='source') return route.fulfill({json:{collection:group,source:sourceFile}});
      if(action==='draft') {snapshot=JSON.parse(route.request().postData()).draft;backupCount++;return route.fulfill({json:{draft:{id:'fixture_draft_t121'}}});}
    }
    if(url.searchParams.get('source')==='1') return route.fulfill({contentType:'text/markdown',body:source});
    if(url.searchParams.has('draft')) return route.fulfill({json:{draft:{...snapshot,editorHtml:snapshot.editorHtml+'<img src="https://untrusted.example/leak" onerror="window.T121_PWNED=true"><script>window.T121_PWNED=true</script>'}}});
    if(url.searchParams.has('collection')) return route.fulfill({json:{collection:group,files:[sourceFile,...(snapshot?[{id:'fixture_draft_t121',name:'T121 saved draft',createdTime:new Date().toISOString(),properties:{aefRole:'draft',aefBuild:'test'}}]:[])]}});
    return route.fulfill({json:{collections:[group]}});
  });
  await page.goto(base);
  await page.locator('input[type=file]').setInputFiles({name:sourceFile.name,mimeType:'text/markdown',buffer:source});
  await page.getByRole('button',{name:'แปลงเป็นรูปแบบข้อสอบ',exact:true}).click();
  await page.locator('[contenteditable=true] [data-item-id]').first().waitFor();
  const keys=['ก','ข','ค','ง'];
  const old=[{id:1,questionNumber:6,questionText:'Six with three choices',choices:keys.slice(0,3).map(key=>({key,text:key,isCorrect:false})),explanationText:''},{id:2,questionNumber:4,questionText:'fourth source choice',choices:[],explanationText:''},{id:3,questionNumber:7,questionText:'สาร สถาน จุดเดือด',choices:keys.map(key=>({key,text:key,isCorrect:false})),explanationText:''}];
  await page.evaluate(({old})=>{
    const key='exam-formatter-document-drafts-v1',data=JSON.parse(localStorage.getItem(key));
    data.drafts[0]={...data.drafts[0],formattedItems:old,editorHtml:'',itemCount:3,sourceItemCount:2};localStorage.setItem(key,JSON.stringify(data));
  },{old});
  const resume=async()=>{await page.getByRole('button',{name:'ทำต่อจากแบบร่าง t121-legacy.md',exact:true}).click();await page.locator('[contenteditable=true] [data-item-id]').first().waitFor();};
  await page.reload();await resume();
  await page.getByRole('button',{name:'รวมเป็นตัวเลือก ง ของข้อ 6',exact:true}).click();
  const editor=page.locator('[contenteditable=true]');
  await page.getByRole('radio',{name:'เฉลยข้อ 6 ตัวเลือก ง',exact:true}).check();
  assert.ok((await editor.innerText()).includes('สถาน'),'No automatic spelling replacement');
  await page.getByRole('button',{name:'ยืนยันแก้คำ สถาน ข้อ 7',exact:true}).click();
  assert.ok((await editor.innerText()).includes('สถานะ'));
  await page.getByRole('button',{name:'บันทึกแบบร่าง',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('[data-draft-saved]')?.dataset.draftSaved==='true');
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('exam-formatter-document-drafts-v1')).drafts[0]);
  assert.deepEqual(saved.formattedItems.map(item=>item.questionNumber),[6,7],'Fake question does not return in structured draft');
  assert.equal(saved.formattedItems[0].choices.length,4);assert.equal(saved.itemCount,2);
  await page.reload();await resume();
  assert.equal(await page.getByRole('radio',{name:'เฉลยข้อ 6 ตัวเลือก ง',exact:true}).isChecked(),true);
  await page.getByRole('button',{name:'ตัวเลือก Google Drive',exact:true}).click(); // T-130: Drive backup is in the Drive menu
  await page.getByRole('button',{name:'สำรองแบบร่างบน Drive',exact:true}).click();
  await page.getByText('สำรองแบบร่างบน Drive แล้ว เปิดทำต่อได้จากคลังไฟล์',{exact:true}).waitFor();
  assert.equal(backupCount,1);assert.equal(snapshot.sourceHash,hash);assert.ok(snapshot.editorHtml.includes('สถานะ'));
  await page.getByRole('button',{name:'คลังไฟล์บน Drive',exact:true}).click();
  await page.getByRole('button',{name:/T121 draft collection/}).click();
  await page.getByRole('button',{name:'เปิดทำต่อ',exact:true}).click();
  await page.getByRole('dialog',{name:'คลังไฟล์บน Drive',exact:true}).waitFor({state:'hidden'});
  await page.getByText(/โหลดแบบร่างและประวัติ OCR เรียบร้อย/).waitFor();
  assert.ok((await editor.innerText()).includes('สถานะ'));
  assert.ok(await page.locator('[data-workspace="source"]').innerText().then(text=>text.includes('source six')));
  assert.equal(await page.evaluate(()=>Boolean(window.T121_PWNED)),false);assert.equal(remoteRequests,0);
  await page.route('**/api/google/export',route=>route.fulfill({status:400,json:{error:'T121 durable export failure'}}));
  await page.getByRole('button',{name:'ส่งออกเข้า Google Drive',exact:true}).click();
  const exportConfirm=page.getByRole('button',{name:'ส่งออกเลย',exact:true});if(await exportConfirm.isVisible()) await exportConfirm.click();
  await page.getByRole('alert').filter({hasText:'T121 durable export failure'}).waitFor();
  await page.screenshot({path:path.join(__dirname,'../evidence/t121/draft-restored.png')});
  assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(__dirname,'../evidence/t121/controls-result.json'),JSON.stringify({passed:true,legacyMerge:true,explicitSpelling:true,cloud:'mocked Drive; backend hash/tamper guards separately tested',backupCount,originalRestored:true,scriptAndRemoteMarkupBlocked:true,errors},null,2));
  console.log('T121 legacy merge/save/resume, explicit spelling, Drive backup/restore with original and safe markup passed.');
 } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
