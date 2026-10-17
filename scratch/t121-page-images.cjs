// Save rendered source page images of a PDF via the app's own renderer (no OCR call).
const fs=require('fs');const path=require('path');const playwright=require('playwright');
(async()=>{const b=await playwright.chromium.launch({channel:'msedge'});const p=await b.newPage({viewport:{width:1912,height:914}});
await p.route('**/api/ocr',r=>r.abort());
await p.goto(process.env.BASE||'http://localhost:3000');await p.waitForLoadState('networkidle');
await p.locator('input[type=file]').setInputFiles(process.argv[2]);
await p.waitForSelector('[data-source-page-target] img',{timeout:120000});await p.waitForTimeout(3000);
const srcs=await p.$$eval('[data-source-page-target] img',a=>a.map(i=>i.src));
fs.mkdirSync(process.argv[3],{recursive:true});
for(const [i,s] of srcs.entries()){if(s.startsWith('data:')){fs.writeFileSync(path.join(process.argv[3],`page-${i+1}.png`),Buffer.from(s.split(',')[1],'base64'));}else{const r=await p.request.get(s).catch(()=>null);console.log('non-data src',s.slice(0,60));}}
console.log(srcs.length,'pages');await b.close();})().catch(e=>{console.error(e.message);process.exit(1)});
