const fs=require('node:fs');
const assert=require('node:assert/strict');
const ts=require('typescript');
let chromium;
try {({chromium}=require('playwright'));} catch {({chromium}=require('C:/Users/nathaphat/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));}
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText,file);
const {createExportDocx}=require('../lib/google-export.ts');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try {
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:3001/reviewed-separation.html');
  assert.equal(await page.locator('article section').count(),25);
  assert.equal(await page.locator('article img').count(),5);
  await page.locator('a[href="#q25"]').click();
  await page.locator('#q25 img').waitFor();
  assert.ok(await page.locator('#source4').evaluate(img => {
    const image=img.getBoundingClientRect();const pane=img.closest('aside').getBoundingClientRect();
    return Math.abs(image.top-pane.top)<30;
  }));
  await page.screenshot({path:'evidence/t041-review-result.png'});
  await page.pdf({path:'evidence/261011-reviewed-separation.pdf',format:'A4',printBackground:true,margin:{top:'18mm',bottom:'18mm',left:'16mm',right:'16mm'}});
  await page.goto('http://127.0.0.1:3001/');
  const started=Date.now();
  await page.locator('input[type=file]').setInputFiles('evidence/261011-reviewed-separation.md');
  const editor=page.locator('[contenteditable=true]').first();await editor.waitFor({timeout:60000});
  assert.equal(await editor.locator('[data-item-id]').count(),25);
  assert.equal(await editor.locator('img').count(),5);
  const owners=await editor.locator('img').evaluateAll(images=>images.map(img=>({question:img.alt,owner:img.closest('[data-item-id]')?.getAttribute('data-item-id')})));
  assert.deepEqual(owners.map(i=>Number(i.owner)),[8,16,20,22,25]);
  for (const n of [8,16,20,22,25]) {
   const img=editor.locator(`img[alt="Question ${n} Figure"]`);
   await img.scrollIntoViewIfNeeded();
   await img.evaluate(img=>img.decode());
   assert.ok(await img.evaluate(img=>img.naturalWidth>0 && img.naturalHeight>0));
  }
  const code=ts.transpileModule(fs.readFileSync('lib/export-document.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
  const snapshot=await page.evaluate(code=>{
   const exports={};new Function('exports',code)(exports);
   return exports.snapshotDocument(document.querySelector('[contenteditable=true]'),'การแยกสาร');
  },code);
  const imageRuns=snapshot.paragraphs.flatMap(p=>p.runs).filter(r=>r.image);
  assert.equal(imageRuns.length,5);
  assert.ok(Math.abs(imageRuns[4].height/imageRuns[4].width-850/1100)<.001);
  const visibleText=snapshot.paragraphs.flatMap(p=>p.runs).map(r=>r.text||'').join(' ');
  assert.ok(visibleText.includes('672'));
  assert.ok(!visibleText.includes('DIRTY'));
  fs.writeFileSync('evidence/t041-export-snapshot.json',JSON.stringify(snapshot,null,2));
  const docx=await createExportDocx(snapshot);
  fs.writeFileSync('evidence/261011-reviewed-separation.docx',docx);
  await page.screenshot({path:'evidence/t041-editor-result.png'});
  assert.deepEqual(errors,[]);
  const result={status:'passed',questions:25,choices:100,images:5,owners,importMs:Date.now()-started,docxBytes:docx.length,noBrowserErrors:true,answerPolicy:'No inferred answer keys; handwritten marks require owner reconciliation.',access:'http://127.0.0.1:3001/reviewed-separation.html'};
  fs.writeFileSync('evidence/t041-browser-result.json',JSON.stringify(result,null,2));
  console.log(JSON.stringify(result));
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
