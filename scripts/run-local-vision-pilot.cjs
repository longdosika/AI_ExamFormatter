const fs=require('node:fs');
const {spawn}=require('node:child_process');
const folder=process.env.BENCH_INPUT_MODE==='roi'?'evidence/t058-roi':'evidence/t058-local';fs.mkdirSync(folder,{recursive:true});
const models=['qwen3-vl:2b','qwen3-vl:4b'];
const progress={started:new Date().toISOString(),models:{},phase:'waiting for downloads'};
function save(){fs.writeFileSync(folder+'/progress.json',JSON.stringify(progress,null,2));}
function run(model){return new Promise(resolve=>{const child=spawn(process.execPath,['scripts/benchmark-local-vision.cjs',model],{stdio:['ignore','pipe','pipe'],windowsHide:true});const log=fs.createWriteStream(folder+'/'+model.replace(':','-')+'.log');child.stdout.pipe(log);child.stderr.pipe(log);child.on('exit',code=>resolve(code));});}
(async()=>{
 // Avoid background model downloads competing with cold-load measurements.
 progress.phase='waiting for both model downloads';save();
 const downloadDeadline=Date.now()+4*60*60*1000;
 while(true){
  try{const tags=await(await fetch('http://127.0.0.1:11434/api/tags')).json();if(models.every(model=>tags.models?.some(entry=>entry.name===model)))break;}catch{}
  if(Date.now()>downloadDeadline)throw new Error('Both-model download deadline exceeded');
  await new Promise(resolve=>setTimeout(resolve,15000));
 }
 for(const model of models){
  progress.phase='waiting for '+model;save();
  const deadline=Date.now()+4*60*60*1000;
  while(true){
   try{const tags=await(await fetch('http://127.0.0.1:11434/api/tags')).json();if(tags.models?.some(entry=>entry.name===model)){break;}}catch{}
   if(Date.now()>deadline)throw new Error('Download waiting deadline exceeded: '+model);
   await new Promise(resolve=>setTimeout(resolve,15000));
  }
  progress.phase='benchmarking '+model;progress.models[model]={started:new Date().toISOString()};save();console.log(progress.phase);
  const exit=await run(model);progress.models[model].exitCode=exit;progress.models[model].finished=new Date().toISOString();save();console.log(model+' benchmark exited '+exit);
 }
 const reportExit=await new Promise(resolve=>{const child=spawn(process.execPath,['scripts/report-local-vision.cjs'],{stdio:'inherit',windowsHide:true});child.on('exit',resolve);});
 progress.phase=reportExit||Object.values(progress.models).some(model=>model.exitCode!==0)?'experiment has failures; review required':'benchmarks finished; awaiting review';progress.finished=new Date().toISOString();save();
 if(progress.phase==='experiment has failures; review required')process.exitCode=1;
})().catch(error=>{progress.phase='failed';progress.error=error.message;save();console.error(error);process.exitCode=1;});
