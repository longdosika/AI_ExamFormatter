const fs=require('fs'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText,f);
const {normalizeOcrText}=require('../lib/ocr-service.ts'); const {parseExamText}=require('../lib/exam-parser.ts');
const body=JSON.parse(fs.readFileSync('evidence/t038-provider-real-page1.json','utf8')).body; const raw=normalizeOcrText(body.choices[0].message.content); const items=parseExamText(raw); console.log(JSON.stringify({textLength:raw.length,items:items.length,questions:items.map(x=>({n:x.questionNumber,choices:x.choices.length,text:x.questionText.slice(0,60)}))}));

