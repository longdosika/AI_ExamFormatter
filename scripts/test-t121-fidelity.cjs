require('./e2e-import-helper.cjs'); // T-128: answer the duplicate-import dialog with "นำเข้าใหม่"
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
const JSZip=require('jszip');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const base=process.env.E2E_BASE_URL||'http://localhost:3111';
const file=process.env.T121_PDF||'C:/Users/natha/Downloads/บทที่ 7 ชุดที่ 3 เรื่อง การแยกสาร.pdf';
const is80=process.env.T121_SOURCE80==='1';
const fixtureDir=path.join(root,'evidence/t121',is80?'source80-live':'continuation-r2');
const batches=JSON.parse(fs.readFileSync(path.join(fixtureDir,'ocr-response.json'),'utf8'));
const pages=[];
for(const batch of batches) {
  const parts=batch.text.split(/^\[PAGE \d+\]\s*\n/gm).filter(Boolean);
  for(let i=0;i<parts.length;i++) pages.push({text:parts[i],...(batch.pageResults?.[i]||{})});
}
const diagrams=JSON.parse(fs.readFileSync(path.join(fixtureDir,'diagrams-response.json'),'utf8'));
(async()=>{
  const browser=await chromium.launch({headless:true,channel:process.env.E2E_BROWSER_CHANNEL||'msedge'});
  try {
    const page=await browser.newPage({viewport:{width:1912,height:914}}),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.route('**/api/google/session',route=>route.fulfill({json:{configured:true,connected:false,folderReady:false}}));
    let offset=0;
    await page.route('**/api/ocr',route=>{
      const count=route.request().postDataJSON().images.length, rows=pages.slice(offset,offset+count);offset+=count;
      return route.fulfill({json:{success:true,allPagesSuccess:true,quality:'ready',questionMarkers:25,pageCount:count,processedCount:count,text:rows.map((row,i)=>`[PAGE ${i+1}]\n${row.text}`).join('\n\n'),pageResults:rows.map((row,i)=>({...row,page:i+1,success:true}))}});
    });
    await page.route('**/api/diagrams',route=>{
      const number=route.request().postDataJSON().page,record=diagrams.find(row=>row.page===number&&row.status===200);
      assert.ok(record,'Real-provider replay exists for page'+number);
      return route.fulfill({json:record.body});
    });
    await page.goto(base);
    await page.locator('input[type=file]').setInputFiles(file);
    await page.getByRole('button',{name:'แปลงเป็นรูปแบบข้อสอบ',exact:true}).click();
    const editor=page.locator('[contenteditable=true]');
    await editor.locator('[data-item-id]').first().waitFor();
    assert.equal(await editor.locator('[data-item-id]').count(),is80?80:25);
    if(!is80) {
      const split=page.getByRole('button',{name:'แยกตัวเลือก ค และ ง ข้อ 15',exact:true});
      if(await split.count()) await split.click();
    }
    await editor.locator('[data-question-text]').first().evaluate(node=>{const strong=document.createElement('strong');strong.textContent='RICH_KEEP ';node.prepend(strong);});
    await page.getByRole('button',{name:'บันทึกแบบร่าง',exact:true}).click();
    await page.waitForFunction(()=>document.querySelector('[data-draft-saved]')?.dataset.draftSaved==='true');
    await page.reload();
    await page.getByRole('button',{name:`ทำต่อจากแบบร่าง ${path.basename(file)}`,exact:true}).click();
    await editor.locator('[data-item-id]').first().waitFor();
    for(const number of [1,3]) {
      const src=await page.locator(`[data-source-page-target="${number}"] img`).getAttribute('src');
      if(src?.startsWith('data:image/png;base64,')) fs.writeFileSync(path.join(root,`tmp/pdfs/t121-app-${number}.png`),Buffer.from(src.split(',')[1],'base64'));
    }
    await page.getByRole('button',{name:'สกัดรูปประกอบ (AI)',exact:true}).click();
    await page.locator('[data-step="diagrams"]:not(:disabled)').waitFor({timeout:120000});
    const item=number=>editor.locator(`[data-item-id="${number}"]`);
    assert.ok(await item(1).locator('[data-question-text] strong').count(),'Manual formatting survives resumed harvest');
    const harvestedSnapshot=await page.evaluate(()=>JSON.parse(localStorage.getItem('exam-formatter-document-drafts-v1')).drafts[0].editorHtml);
    assert.ok(harvestedSnapshot.includes('RICH_KEEP')&&harvestedSnapshot.includes('data-source-bbox'),'Harvest automatically persists the updated edited HTML, not only the model');
    if(!is80) assert.equal(await item(15).locator('[data-choice-key]').count(),4,'Confirmed split survives harvest without cloned duplicate rows');
    const targetFigures=is80?[28,33,43,66,80]:[6,8,10,20,21];
    for(const number of targetFigures) assert.ok(await item(number).locator('[data-question-image] img, [data-shared-image] img').count(),`Question${number} has visible captured figure`);
    if(is80) assert.ok(!(await item(66).locator('[data-question-text]').textContent()).includes('X 3 1'),'Q66 captured cells do not duplicate stem');
    if(is80) assert.ok(!(await item(17).locator('[data-shared-text], .whitespace-pre-line').first().textContent()).includes('สาร ผลการทดลอง'),'T123 H-08 captured shared-table header does not duplicate the passage');
    if(is80) assert.ok(JSON.parse(await item(66).locator('[data-question-image] img').getAttribute('data-source-bbox'))[2]<849,'Q66 crop excludes its following question-continuation line');
    for(const number of is80?[]:[6,21]) {
      const bbox=JSON.parse(await item(number).locator('[data-question-image] img').getAttribute('data-source-bbox'));
      console.log('Table bounds',number,bbox);
      assert.ok(bbox[3]>650,`Table${number} includes rightmost column`);
    }
    const q20bbox=is80?[]:JSON.parse(await item(20).locator('[data-question-image] img').getAttribute('data-source-bbox'));
    if(!is80) assert.ok(q20bbox[0]>500&&q20bbox[2]<660,'Q20 excludes stem20 and stem21');
    if(!is80) assert.ok(!(await item(20).innerText()).includes('CLEAN'),'Unverified crop never claims CLEAN');
    if(!await page.getByRole('button',{name:'ไปข้อ 15',exact:true}).count()) await page.locator('[data-nav-gap="10"]').click();
    await page.getByRole('button',{name:'ไปข้อ 15',exact:true}).click();
    const split=page.getByRole('button',{name:'แยกตัวเลือก ค และ ง ข้อ 15',exact:true});
    if(await split.count()) {
      assert.equal(await item(15).locator('[data-choice-key]').count(),3,'Missing key requires confirmation');
      await split.click();
      assert.equal(await item(15).locator('[data-choice-key]').count(),4);
    }
    await page.getByRole('button',{name:'ตรวจรูปทั้งหมด',exact:true}).click();
    const modal=page.getByRole('dialog',{name:'ตรวจรูปทั้งหมด'});
    await modal.waitFor();
    assert.ok(await modal.locator('[aria-label="กรอบภาพในต้นฉบับ"]').count()>=5);
    await page.screenshot({path:path.join(root,`evidence/t121/${is80?'source80-':''}figure-overview.png`)});
    await page.getByRole('button',{name:'ปิดตรวจรูปทั้งหมด',exact:true}).click();
    await page.getByRole('button',{name:'บันทึกแบบร่าง',exact:true}).click();
    await page.waitForFunction(()=>document.querySelector('[data-draft-saved]')?.dataset.draftSaved==='true');
    const download=page.waitForEvent('download');
    await page.getByRole('button',{name:'ดาวน์โหลด DOCX',exact:true}).click();
    const confirm=page.getByRole('button',{name:'ส่งออกเลย',exact:true});if(await confirm.isVisible()) await confirm.click();
    const bytes=fs.readFileSync(await (await download).path());
    const zip=await JSZip.loadAsync(bytes),xml=await zip.file('word/document.xml').async('string');
    assert.ok(Object.keys(zip.files).filter(name=>name.startsWith('word/media/')&&!zip.files[name].dir).length>=5);
    assert.ok(!xml.includes('grid-template-columns'));
    // Master template order: N. stem -> รูปคำถาม: -> image -> ตัวเลือก: -> choices -> คำอธิบาย: (owner screenshot 2026-10-17).
    const lines=xml.replace(/<w:drawing>[\s\S]*?<\/w:drawing>/g,'[IMAGE]').split('</w:p>').map(p=>p.replace(/<[^>]+>/g,'').trim()).filter(Boolean);
    let block=[];
    const checkBlock=()=>{const figure=block.indexOf('รูปคำถาม:'),choices=block.indexOf('ตัวเลือก:');if(figure>=0) assert.ok(choices<0||figure<choices,`รูปคำถาม must precede ตัวเลือก in: ${block[0]}`);};
    const blocks=[];
    for(const line of lines){if(/^\d+\.\s/.test(line)&&block.length&&block.includes('ตัวเลือก:')){checkBlock();blocks.push(block);block=[];}block.push(line);}checkBlock();blocks.push(block);
    if(is80) {
      // Image-only choices (source1 Q16 crystals) are created during harvest and must all reach the export.
      const q16=blocks.find(lines=>/^16\.\s/.test(lines[0]))||[];
      const choiceLines=q16.slice(q16.indexOf('ตัวเลือก:')+1).filter(line=>!/^(โจทย์ร่วม|รูปโจทย์ร่วม:|คำอธิบาย:)/.test(line));
      assert.ok(choiceLines.filter(line=>line.includes('[IMAGE]')).length>=4,`Q16 exports four image choices: ${JSON.stringify(choiceLines.slice(0,6))}`);
    }
    if(is80) assert.equal(blocks.find(lines=>/^16\.\s/.test(lines[0])).filter(line=>line==='ตัวเลือก:').length,1,'Q16 has one choices label');
    if(!is80) assert.ok(lines.some(line=>/^8. .*ข้อสรุปใดถูกต้อง$/.test(line)),'Q8 stem ends at the question, figure labels removed');
    if(!is80) assert.ok(lines.some(line=>line.startsWith('สาร A และ B กับน้ำ')),'Q6 question sentence stays whole after its table rows are removed');
    if(!is80) for(const row of ['A ของแข็ง 90','B ของแข็ง ไม่ละลาย ละลาย 218','สารประกอบ สถาน']) assert.ok(!lines.some(line=>line.includes(row)),`captured table row is not repeated as text: ${row}`);
    for(const match of xml.matchAll(/<wp:extent cx="(\d+)" cy="(\d+)"/g)) assert.ok(Number(match[1])<=661*9525,'Export figure follows master IMAGE_MAX');
    fs.writeFileSync(path.join(root,`tmp/pdfs/t121-${is80?'source80':'full'}-output.docx`),bytes);
    await page.getByRole('button',{name:'ไปข้อ 20',exact:true}).click();
    await page.screenshot({path:path.join(root,`evidence/t121/${is80?'source80-':''}fidelity-desktop.png`)});
    await page.setViewportSize({width:390,height:844});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    await page.screenshot({path:path.join(root,`evidence/t121/${is80?'source80-':''}fidelity-mobile.png`)});
    assert.deepEqual(errors,[]);
    fs.writeFileSync(path.join(root,`evidence/t121/${is80?'source80-':''}fidelity-result.json`),JSON.stringify({passed:true,questions:is80?80:25,visibleFigures:targetFigures,cloud:'replayed real provider responses; no new provider or Google call',localDocx:true,errors},null,2));
    console.log(`T121 real-PDF replay passed: ${is80?80:25} questions, visible tables, full grid columns, crop limits, single-column choices, overview, Save and actual DOCX.`);
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
