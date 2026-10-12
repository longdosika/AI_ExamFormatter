const fs = require('node:fs');
const assert = require('node:assert/strict');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,filename);
const {validateSourceAnswers}=require('../lib/source-answer-service.ts');
const questions=[{id:1,questionNumber:1,questionText:'source',keys:['ก','ข','ค','ง']}];
const answer={id:1,key:'ข',confidence:0.98,evidence:'มีวงกลมล้อมตัวเลือก ข ชัดเจน',bbox:[100,100,150,150]};
assert.equal(validateSourceAnswers([answer],questions,2)[0].page,2);
for(const row of [{...answer,id:2},{...answer,key:'จ'},{...answer,confidence:0.9},{...answer,confidence:NaN},{...answer,bbox:[150,100,100,150]},{...answer,evidence:''},null]) assert.deepEqual(validateSourceAnswers([row],questions,2),[]);
assert.deepEqual(validateSourceAnswers([answer,answer],questions,2),[]);
assert.deepEqual(validateSourceAnswers(null,questions,2),[]);
console.log('Source answer ownership, ambiguity, evidence, confidence and bbox guards passed');
const {readSourceAnswers}=require('../lib/source-answer-client.ts');
(async()=>{
  const original=global.fetch;
  try {
    let calls=0;
    global.fetch=async()=>{calls++;return {ok:true,json:async()=>({answers:[{...answer,page:1}],model:'test'})};};
    const item={id:1,questionNumber:1,sourcePage:1,questionText:'source',choices:questions[0].keys.map(key=>({key,text:key,isCorrect:false})),explanationText:''};
    const result=await readSourceAnswers([item],['image'],()=>true,()=>{});
    assert.equal(result.count,1);assert.equal(item.reconciledAnswerKey,'ข');assert.equal(item.sourceAnswerEvidence.page,1);
    await readSourceAnswers([item],['image'],()=>true,()=>{});assert.equal(calls,1,'Explicit/reconciled answers must not be overwritten');
    const stale={...item,reconciledAnswerKey:undefined,choices:item.choices.map(c=>({...c,isCorrect:false}))};let current=true;
    global.fetch=async()=>{current=false;return {ok:true,json:async()=>({answers:[{...answer,page:1}],model:'test'})};};
    await readSourceAnswers([stale],['image'],()=>current,()=>{});assert.equal(stale.reconciledAnswerKey,undefined);
    calls=0;global.fetch=async()=>{calls++;return {ok:false,status:502,json:async()=>({code:'GEMINI_HTTP_429'})};};
    await assert.rejects(()=>readSourceAnswers([stale],['image','image'],()=>true,()=>{}),/โควตา/);assert.equal(calls,1,'Quota failure must stop without further page requests');
    console.log('Source answer client preserves existing answers and rejects stale responses');
  } finally {global.fetch=original;}
})().catch(e=>{console.error(e);process.exitCode=1;});
