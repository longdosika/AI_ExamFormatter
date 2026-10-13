const fs=require('node:fs');const assert=require('node:assert/strict');const ts=require('typescript');
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,file);
const {readOcrDocument,OCR_MAX_REQUEST_BYTES}=require('../lib/ocr-client.ts');
(async()=>{
  const calls=[];const progress=[];
  const fetcher=async(_url,options)=>{
    const images=JSON.parse(options.body).images;calls.push(images.length);
    const payload={allPagesSuccess:true,quality:'ready',questionMarkers:images.length,
      text:images.map((image,index)=>`[PAGE ${index+1}]\n${image}`).join('\n'),
      pageResults:images.map((_image,index)=>({page:index+1,success:true,modelUsed:'fixture'}))};
    return {ok:true,text:async()=>JSON.stringify(payload),json:async()=>payload};
  };
  for(const size of [12,25]){
    calls.length=0;
    const result=await readOcrDocument(Array.from({length:size},(_,i)=>`source ${i+1}`),{fetcher,onProgress:(done,total)=>progress.push([done,total])});
    assert.deepEqual(calls,size===12?[10,2]:[10,10,5]);
    assert.deepEqual(result.pageResults.map(page=>page.page),Array.from({length:size},(_,i)=>i+1));
    assert.ok(result.text.includes(`[PAGE ${size}]\nsource ${size}`));
    assert.equal(result.allPagesSuccess,true);
  }
  let current=true;calls.length=0;
  const cancelled=await readOcrDocument(Array(12).fill('source'),{isCurrent:()=>current,fetcher:async(...args)=>{current=false;return fetcher(...args);}});
  assert.equal(cancelled.cancelled,true);assert.equal(cancelled.allPagesSuccess,false);assert.equal(calls.length,1);
  calls.length=0;
  const partial=await readOcrDocument(Array(12).fill('source'),{fetcher:async(...args)=>calls.length?{ok:false,status:429,text:async()=>JSON.stringify({error:'fixture queue full'})}:fetcher(...args)});
  assert.ok(partial.text.includes('[PAGE 10]'));assert.equal(partial.allPagesSuccess,false);
  assert.equal(partial.pageResults.length,12);assert.equal(partial.error,'fixture queue full');
  assert.equal(partial.pageResults[11].success,false);
  const missing=await readOcrDocument(['one'],{fetcher:async()=>({ok:true,text:async()=>JSON.stringify({text:'source',allPagesSuccess:true,quality:'ready',questionMarkers:1,pageResults:[]})})});
  assert.equal(missing.quality,'needs_review');assert.equal(missing.allPagesSuccess,false);
  calls.length=0;
  const largePage='x'.repeat(Math.ceil(OCR_MAX_REQUEST_BYTES*0.7));
  const sizeLimited=await readOcrDocument([largePage,largePage],{fetcher});
  assert.deepEqual(calls,[1,1]);
  assert.equal(sizeLimited.allPagesSuccess,true);
  const plainTextFailure=await readOcrDocument(['one'],{fetcher:async()=>({ok:false,status:413,text:async()=> 'Request Entity Too Large'})});
  assert.match(plainTextFailure.error,/ใหญ่เกินไป/);
  assert.equal(plainTextFailure.pageResults[0].success,false);
  console.log('OCR client batching passed: page ceiling, adaptive request size, absolute page offsets, progress, stale cancellation, HTTP failure and partial text preservation.');
})().catch(error=>{console.error(error);process.exitCode=1;});
