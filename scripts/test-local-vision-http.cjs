const assert=require('node:assert/strict');
const http=require('node:http');
const {postLocal}=require('./local-vision-http.cjs');
(async()=>{
 const server=http.createServer((req,res)=>{
  if(req.url==='/truncated'){res.end('{"message":{"content":"x"}}\n');return;}
  if(req.url==='/error'){res.end('{"error":"model failed"}\n');return;}
  if(req.url==='/thinking'){res.end('{"message":{"thinking":"{\\"answers\\":[]}"},"done":true}\n');return;}
  res.write('{"message":{"content":"ก"}}\n');
  res.end('{"message":{"content":"ข"},"done":true,"eval_count":2}\n');
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port;
 try{
  const result=await postLocal(base,{stream:true},1000);
  assert.equal(result.message.content,'กข');assert.equal(result.eval_count,2);
  assert.ok(Number.isFinite(result.firstTokenSeconds));
  await assert.rejects(postLocal(base+'/truncated',{stream:true},1000),/Incomplete/);
  await assert.rejects(postLocal(base+'/error',{stream:true},1000),/model failed/);
  const diagnostic=await postLocal(base+'/thinking',{stream:true},1000);
  assert.equal(diagnostic.message.content,'');assert.equal(diagnostic.message.thinking,'{"answers":[]}');
  assert.throws(()=>postLocal('http://example.com',{},1000),/Loopback/);
 }finally{server.close();}
 console.log('Local streaming transport: UTF8, final metadata, incomplete/error and loopback guards passed');
})().catch(error=>{console.error(error);process.exitCode=1;});
