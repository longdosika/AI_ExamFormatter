// Diagnose source-answer model behaviour on a real page (key never printed).
const fs=require('fs');const ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:1,target:7,esModuleInterop:true}}).outputText,f);
const {parseExamText}=require('../lib/exam-parser.ts');const {combinedOcrText}=require('../scripts/t121-dump-parse.cjs');
const env=Object.fromEntries(fs.readFileSync('.env.local','utf8').split(/\r?\n/).filter(l=>/^[A-Z_0-9]+=/.test(l)).map(l=>[l.slice(0,l.indexOf('=')),l.slice(l.indexOf('=')+1).replace(/^"|"$/g,'')]));
const src=fs.readFileSync('lib/source-answer-service.ts','utf8');const instruction=src.match(/systemInstruction: \{ parts: \[\{ text: "([^"]+)"/)[1];
const [model,pageArg,maxTokens,thinking,keyName]=process.argv.slice(2);const page=Number(pageArg);
const items=parseExamText(combinedOcrText('evidence/t121/audit-answers/ocr-response.json')).filter(i=>i.sourcePage===page);
const questions=items.map(i=>({id:i.id,questionNumber:i.questionNumber,questionText:i.questionText.slice(0,160),keys:i.choices.map(c=>c.key)}));
const image=fs.readFileSync(`evidence/t121/audit-0017/pages/page-${page}.png`).toString('base64');
const generationConfig={temperature:0,responseMimeType:'application/json',maxOutputTokens:Number(maxTokens||4096)};
if(thinking) generationConfig.thinkingConfig={thinkingBudget:Number(thinking)};
const t=Date.now();
fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':env[keyName||'GEMINI_API_KEY']},
 body:JSON.stringify({systemInstruction:{parts:[{text:instruction}]},contents:[{role:'user',parts:[{text:JSON.stringify({page,questions})},{inlineData:{mimeType:'image/png',data:image}}]}],generationConfig})})
.then(async r=>{const j=await r.json();const c=j.candidates?.[0];const text=c?.content?.parts?.filter(p=>p.text&&!p.thought).map(p=>p.text).join('');
console.log(JSON.stringify({model,page,status:r.status,ms:Date.now()-t,finish:c?.finishReason,usage:j.usageMetadata,error:j.error?.message?.slice(0,120),text:(text||'').slice(0,900)},null,1));});
