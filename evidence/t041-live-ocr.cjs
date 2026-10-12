const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,filename);
require('@next/env').loadEnvConfig(process.cwd());
const {processImagesOcr}=require('../lib/ocr-service.ts');
const {parseExamText}=require('../lib/exam-parser.ts');
const {validateExamItems}=require('../lib/exam-validation.ts');
(async()=>{
 const images=[1,2,3,4].map(i=>'data:image/png;base64,'+fs.readFileSync(`evidence/t041-source-${i}.png`).toString('base64'));
 const start=Date.now();
 const pages=await processImagesOcr(images);
 const text=pages.map(p=>`[PAGE ${p.page}]\n${p.text}`).join('\n\n');
 const items=parseExamText(text);
 fs.writeFileSync('evidence/t041-fixed-prompt-pages.json',JSON.stringify(pages,null,2));
 fs.writeFileSync('evidence/t041-fixed-prompt.md',text);
 fs.writeFileSync('evidence/t041-fixed-prompt-items.json',JSON.stringify(items,null,2));
 fs.writeFileSync('evidence/t041-live-summary.json',JSON.stringify({elapsedMs:Date.now()-start,pages:pages.map(p=>({page:p.page,success:p.success,error:p.error})),questions:items.map(p=>p.questionNumber),issues:validateExamItems(items)},null,2));
 console.log(JSON.stringify({pages:pages.length,success:pages.every(p=>p.success),questions:items.length,issues:validateExamItems(items)}));
})().catch(e=>{console.error(e.message);process.exitCode=1;});
