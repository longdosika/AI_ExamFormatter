const fs = require('node:fs');
const assert = require('node:assert/strict');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,filename);
const {validateSourceAnswers}=require('../lib/source-answer-service.ts');
const {validateAiAnswers}=require('../lib/ai-answer-service.ts');
const questions=[{id:1,questionNumber:1,questionText:'source',keys:['ก','ข','ค','ง']}];
const answer={id:1,key:'ข',confidence:0.98,evidence:'มีวงกลมล้อมตัวเลือก ข ชัดเจน',bbox:[100,100,150,150]};
assert.equal(validateSourceAnswers([answer],questions,2)[0].page,2);
for(const row of [{...answer,id:2},{...answer,key:'จ'},{...answer,confidence:0.9},{...answer,confidence:NaN},{...answer,bbox:[150,100,100,150]},{...answer,evidence:''},null]) assert.deepEqual(validateSourceAnswers([row],questions,2),[]);
assert.deepEqual(validateSourceAnswers([answer,answer],questions,2),[]);
assert.deepEqual(validateSourceAnswers(null,questions,2),[]);
console.log('Source answer ownership, ambiguity, evidence, confidence and bbox guards passed');
// T-121 (B-25): an X or tick is not a source selection, even when the model reports it confidently.
for (const evidence of ['กากบาทสีแดงทับตัวเลือก ง', 'เครื่องหมายถูกสีชมพูหน้าตัวเลือก ก', 'X mark over choice ข clearly']) assert.deepEqual(validateSourceAnswers([{ ...answer, evidence }], questions, 2), [], evidence);
assert.equal(validateSourceAnswers([{ ...answer, evidence: 'วงกลมสีฟ้าล้อมรอบตัวเลือก ข' }], questions, 2).length, 1);
console.log('T-121 source answers reject X/tick evidence');
// T-126: several circled keys of one question are all answers; the same key twice stays ambiguous.
assert.deepEqual(validateSourceAnswers([{ ...answer, key: 'ก', evidence: 'วงกลมล้อมรอบตัวเลือก ก' }, { ...answer, key: 'ง', evidence: 'วงกลมล้อมรอบตัวเลือก ง' }], questions, 2).map(row => row.key), ['ก', 'ง']);
assert.deepEqual(validateSourceAnswers([answer, { ...answer }], questions, 2), [], 'duplicate key for one question is ambiguous');
console.log('T-126 multiple circled answers accepted per question');
const aiAnswer={id:1,key:'ค',confidence:0.91,evidence:'จากหลักการแยกสาร ตัวเลือกนี้สอดคล้องกับโจทย์'};
assert.equal(validateAiAnswers([aiAnswer],questions)[0].key,'ค');
for(const row of [{...aiAnswer,key:'จ'},{...aiAnswer,confidence:0.79},{...aiAnswer,evidence:'สั้น'},{...aiAnswer,id:2},null]) assert.deepEqual(validateAiAnswers([row],questions),[]);
assert.deepEqual(validateAiAnswers([aiAnswer,aiAnswer],questions),[]);
console.log('AI answer validation keeps only unique, valid, reviewable suggestions');
const {readSourceAnswers,solveUnresolvedAnswers}=require('../lib/source-answer-client.ts');
(async()=>{
  const original=global.fetch;
  try {
    let calls=0;
    global.fetch=async()=>{calls++;return {ok:true,json:async()=>({answers:[{...answer,page:1}],model:'test'})};};
    const item={id:1,questionNumber:1,sourcePage:1,questionText:'source',choices:questions[0].keys.map(key=>({key,text:key,isCorrect:false})),explanationText:''};
    const result=await readSourceAnswers([item],['image'],()=>true,()=>{});
    assert.equal(result.count,1);assert.equal(item.reconciledAnswerKey,'ข');assert.equal(item.sourceAnswerEvidence.page,1);
    await readSourceAnswers([item],['image'],()=>true,()=>{});assert.equal(calls,1,'Explicit/reconciled answers must not be overwritten');
    // T-126: two circled keys (set 3 Q9: ก and ง) become two correct choices of one question.
    global.fetch=async()=>({ok:true,json:async()=>({answers:[{...answer,key:'ก',page:1},{...answer,key:'ง',page:1}],model:'test'})});
    const multi={id:1,questionNumber:9,sourcePage:1,questionText:'source',choices:questions[0].keys.map(key=>({key,text:key,isCorrect:false})),explanationText:''};
    const multiResult=await readSourceAnswers([multi],['image'],()=>true,()=>{});
    assert.equal(multiResult.count,1,'one question answered');
    assert.deepEqual(multi.choices.filter(c=>c.isCorrect).map(c=>c.key),['ก','ง']);
    assert.deepEqual(multi.reconciledAnswerKeys,['ก','ง']);assert.equal(multi.reconciledAnswerKey,'ก');
    const stale={...item,reconciledAnswerKey:undefined,choices:item.choices.map(c=>({...c,isCorrect:false}))};let current=true;
    global.fetch=async()=>{current=false;return {ok:true,json:async()=>({answers:[{...answer,page:1}],model:'test'})};};
    await readSourceAnswers([stale],['image'],()=>current,()=>{});assert.equal(stale.reconciledAnswerKey,undefined);
    calls=0;global.fetch=async()=>{calls++;return {ok:false,status:502,json:async()=>({code:'GEMINI_HTTP_429'})};};
    await assert.rejects(()=>readSourceAnswers([stale],['image','image'],()=>true,()=>{}),/โควตา/);assert.equal(calls,1,'Quota failure must stop without further page requests');
    const unresolved={id:2,questionNumber:2,sourcePage:1,questionText:'ข้อคำนวณ',choices:questions[0].keys.map(key=>({key,text:key,isCorrect:false})),explanationText:''};
    global.fetch=async(_url,opts)=>{const body=JSON.parse(opts.body);assert.equal(body.questions[0].id,2);assert.equal(body.image,undefined);return {ok:true,json:async()=>({answers:[{id:2,key:'ค',confidence:0.91,evidence:'คำนวณตามข้อมูลในโจทย์'}],model:'mock-solver'})};};
    const aiResult=await solveUnresolvedAnswers([unresolved],[],()=>true,()=>{});
    assert.equal(aiResult.count,1);assert.equal(unresolved.reconciliationProvenance,'ai_generated');assert.equal(unresolved.reconciledAnswerKey,'ค');assert.equal(unresolved.choices[2].shadingType,'auto_solved');
    const sourceWon={...unresolved,id:3,reconciledAnswerKey:'ก',reconciliationProvenance:'source_vision',choices:unresolved.choices.map(c=>({...c,isCorrect:c.key==='ก',shadingType:c.key==='ก'?'source_provided':'none'}))};
    let solveCalls=0;global.fetch=async()=>{solveCalls++;return {ok:true,json:async()=>({answers:[{id:3,key:'ง',confidence:1,evidence:'ไม่ควรแทนที่'}]})};};
    await solveUnresolvedAnswers([sourceWon],[],()=>true,()=>{});assert.equal(solveCalls,0,'AI fallback must never overwrite source answers');
    const manual={...sourceWon,reconciliationProvenance:'manual',choices:sourceWon.choices.map(c=>({...c,shadingType:c.isCorrect?'manual':'none'}))};
    await solveUnresolvedAnswers([manual],[],()=>true,()=>{});
    await readSourceAnswers([manual],['image'],()=>true,()=>{});
    assert.equal(solveCalls,0,'Neither source reader nor AI solver may overwrite a manual answer');
    assert.equal(manual.reconciliationProvenance,'manual');
    console.log('Source answer client preserves existing answers and rejects stale responses');
  } finally {global.fetch=original;}
})().catch(e=>{console.error(e);process.exitCode=1;});
