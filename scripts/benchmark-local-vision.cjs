const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,filename);
const {validateSourceAnswers}=require('../lib/source-answer-service.ts');
const {score}=require('./local-vision-metrics.cjs');
const {parseExamText}=require('../lib/exam-parser.ts');
const base='http://127.0.0.1:11434';
const model=process.argv[2];
if(!['qwen3-vl:2b','qwen3-vl:4b'].includes(model)) throw new Error('Choose qwen3-vl:2b or qwen3-vl:4b');
const roi=process.env.BENCH_INPUT_MODE==='roi';
const folder=roi?'evidence/t058-roi':'evidence/t058-local';fs.mkdirSync(folder,{recursive:true});
// Visual transcription; owner confirmed this fixture is a teacher's rechecked key.
const fixtures=roi?JSON.parse(fs.readFileSync(folder+'/roi-manifest.json','utf8')).fixtures:[
 {page:1,file:'evidence/t038-page1-1.png',truth:{1:'ก',2:'ก',3:'ง',4:'ค',5:'ง',6:'ง'},kind:'red crosses, nested numeric list, table choices'},
 {page:2,file:'evidence/pdf-review/page-2.png',truth:{7:'ค',8:'ค',9:'ข',10:'ข'},kind:'crosses in two multi-column tables, classification diagram and a circle'},
 {page:3,file:'evidence/pdf-review/page-3.png',truth:{11:'ง',12:'ง',13:null,14:'ก',15:'ข',16:'ก',17:'ข',18:'ง',19:'ค',20:'ก'},kind:'circles, unmarked question13 with unrelated handwritten Free'}
];
const prompt='Read EXISTING handwritten answer marks from this exam image. The owner confirmed these marks are a teacher-rechecked answer key for this fixture. Do not solve questions. A unique red circle or red cross over a choice letter denotes the existing answer. Ignore unrelated red writing (such as Free), logos, underline and question numbers. If no selection or multiple marks, omit that question. Match only the provided ids. Return {answers:[{id,key,confidence,evidence,bbox}]}. key is the Thai choice letter. confidence0..1, evidence short English description of actual mark, bbox[top,left,bottom,right] normalized0..1000. Never guess an answer. No explanations outside JSON.';
const schema={type:'object',properties:{answers:{type:'array',items:{type:'object',properties:{id:{type:'integer'},key:{type:'string',enum:['ก','ข','ค','ง']},confidence:{type:'number'},evidence:{type:'string'},bbox:{type:'array',items:{type:'number'},minItems:4,maxItems:4}},required:['id','key','confidence','evidence','bbox'],additionalProperties:false}}},required:['answers'],additionalProperties:false};
const {postLocal}=require('./local-vision-http.cjs');
async function post(endpoint,body){return postLocal(base+endpoint,body,600000);}
(async()=>{
 const corpus=parseExamText(fs.readFileSync('evidence/261011-reviewed-separation.md','utf8'));
 for(const fixture of fixtures){fixture.questions=Object.keys(fixture.truth).map(id=>{
  const item=corpus.find(item=>item.questionNumber===Number(id)&&item.sourcePage===fixture.page);
  if(!item)throw new Error('Reviewed source question missing: '+id);
  return{id:Number(id),questionNumber:Number(id),questionText:item.questionText,keys:item.choices.map(choice=>choice.key)};
 });}
 if(process.argv.includes('--preflight')){
  for(const fixture of fixtures)fixture.sha256=crypto.createHash('sha256').update(fs.readFileSync(fixture.file)).digest('hex');
  fs.writeFileSync(folder+'/fixtures.json',JSON.stringify({truthProvenance:'Owner confirmed teacher-rechecked answers on2026-10-12; visual labels transcribed from these images only',fixtures,prompt},null,2));
  console.log(JSON.stringify({pages:fixtures.map(f=>f.page),questions:fixtures.flatMap(f=>f.questions).length,marked:fixtures.flatMap(f=>Object.values(f.truth)).filter(key=>key!==null).length}));return;
 }
 // Evict other models so the experiment doesn't load OCR and Vision together.
 const resident=await(await fetch(base+'/api/ps')).json();for(const r of resident.models||[])await post('/api/generate',{model:r.name,keep_alive:0});
 const version=await(await fetch(base+'/api/version')).json();const tags=await(await fetch(base+'/api/tags')).json();
 const identity=tags.models?.find(entry=>entry.name===model);
 const runs=[];const images={};for(const fixture of fixtures){const buf=fs.readFileSync(fixture.file);images[fixture.file]=buf.toString('base64');fixture.sha256=crypto.createHash('sha256').update(buf).digest('hex');}
 const safe=model.replace(/[:/]/g,'-');
 for(const [index,fixture]of [...fixtures,fixtures[0]].entries()){
  const questions=fixture.questions;
  const started=Date.now();let peakModelResidentBytes=0;let peakVramBytes=0;
  const sampler=setInterval(async()=>{try{const ps=await(await fetch(base+'/api/ps')).json();const entry=ps.models?.find(m=>m.name===model);if(entry){peakModelResidentBytes=Math.max(peakModelResidentBytes,entry.size||0);peakVramBytes=Math.max(peakVramBytes,entry.size_vram||0);}}catch{}},2000);
  let record;
  try{
   const result=await post('/api/chat',{model,stream:true,think:false,keep_alive:'5m',format:schema,messages:[{role:'system',content:prompt},{role:'user',content:JSON.stringify({page:fixture.page,questions}),images:[images[fixture.file]]}],options:{temperature:0,seed:7,num_ctx:4096,num_predict:roi?256:1024,num_thread:6}});
   const output=result.message?.content||result.message?.thinking||''; const outputChannel=result.message?.content?'content':'thinking-json-diagnostic'; let parsed;let parseError=null;try{parsed=JSON.parse(output);}catch(error){parsed={answers:[]};parseError=error.message;}
   if(!Array.isArray(parsed.answers))parseError='answers must be an array';
   const raw=Array.isArray(parsed.answers)?parsed.answers:[];const accepted=validateSourceAnswers(raw,questions,fixture.page);
   record={model,run:index+1,page:fixture.page,phase:index===0?'cold':'warm',wallSeconds:(Date.now()-started)/1000,firstTokenSeconds:result.firstTokenSeconds,loadSeconds:result.load_duration/1e9,promptSeconds:result.prompt_eval_duration/1e9,generationSeconds:result.eval_duration/1e9,promptTokens:result.prompt_eval_count,outputTokens:result.eval_count,doneReason:result.done_reason,parseError,peakModelResidentBytes,peakVramBytes,memoryScope:'Ollama /api/ps model residency; not total process or system RAM',rawScore:score(raw,fixture.truth),acceptedScore:score(accepted,fixture.truth),accepted,streamChunks:result.streamChunks,outputChannel,rawResponse:output,truth:fixture.truth,sourceSha256:fixture.sha256};
  }catch(error){record={model,run:index+1,page:fixture.page,error:error.message,errorCode:error.code,wallSeconds:(Date.now()-started)/1000};}
  finally{clearInterval(sampler);}
  record.caseId=fixture.caseId; runs.push(record);fs.writeFileSync(path.join(folder,safe+'.json'),JSON.stringify({date:new Date().toISOString(),runtime:version,modelIdentity:identity,settings:{inputMode:roi?'roi':'full-page',stream:true,diagnosticThinkingJson:true,num_ctx:4096,num_predict:roi?256:1024,num_thread:6,temperature:0,seed:7,think:false},fixtures,prompt,runs},null,2));
  console.log(JSON.stringify({...record,streamChunks:undefined,rawResponse:undefined,accepted:undefined,truth:undefined}));
  if(record.error){process.exitCode=1;break;}
 }
 await post('/api/generate',{model,keep_alive:0});
 fs.copyFileSync(path.join(folder,safe+'.json'),path.join(folder,safe+'-'+Date.now()+'.json'));
})().catch(error=>{console.error(error);process.exitCode=1;});
