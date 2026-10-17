// Source-only diagnostic: no AI solving and no change to editor answers or original bytes.
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,file);
const {parseExamText}=require('../lib/exam-parser.ts');
(async()=>{
 const root=path.resolve(__dirname,'..'),base=process.env.E2E_BASE_URL||'http://localhost:3000';
 const batches=JSON.parse(fs.readFileSync(path.join(root,'evidence/t121/continuation-r2/ocr-response.json'),'utf8'));
 const items=parseExamText(batches.map(batch=>batch.text).join('\n')).filter(item=>item.sourcePage===1);
 const questions=items.map(item=>({id:item.id,questionNumber:item.questionNumber,questionText:item.questionText,keys:item.choices.map(choice=>choice.key)}));
 const image='data:image/png;base64,'+fs.readFileSync(path.join(root,'tmp/pdfs/t121-source-1.png')).toString('base64');
 const response=await fetch(base+'/api/source-answers',{method:'POST',headers:{'Content-Type':'application/json',Origin:base},body:JSON.stringify({image,questions,page:1}),signal:AbortSignal.timeout(180000)});
 const body=await response.json();
 const expected={1:'ค',2:'ค',4:'ง',6:'ค'},answers=body.answers||[];
 const report={http:response.status,source:'Owner set3 page1; original coloured circle/X marks; no solver',expectedUniqueCircles:expected,raw:body,matched:answers.filter(row=>expected[row.id]===row.key).map(row=>row.id),wrongOrUnsupported:answers.filter(row=>expected[row.id]!==row.key),unresolved:Object.keys(expected).filter(id=>!answers.some(row=>row.id===Number(id))),note:'One-page diagnostic only, not corpus-wide answer accuracy. X marks are rejection; no circle is unresolved.'};
 fs.writeFileSync(path.join(root,'evidence/t121/source-mark-diagnostic.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify(report));
})().catch(error=>{console.error(error);process.exitCode=1;});
