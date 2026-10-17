// Optional private-render diagnostic; production detector assertions run in test-diagram-contract.cjs.
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
const {chromium}=require('playwright');
(async()=>{
  const browser=await chromium.launch({headless:true,channel:'msedge'});
  try {
    const page=await browser.newPage();
    const source=fs.readFileSync(path.join(__dirname,'../lib/table-bounds.ts'),'utf8').replace('if(candidates.length!==1) return null;','return {bands,groups,candidates};');
    const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
    for(const fixture of [{page:1,limits:[593,0,725,1000]},{page:3,limits:[671,0,821,1000]}]) {
      const data='data:image/png;base64,'+fs.readFileSync(path.join(__dirname,`../tmp/pdfs/t121-${process.env.T121_GRID_APP ? 'app' : 'source'}-${fixture.page}.png`)).toString('base64');
      const result=await page.evaluate(async({data,code,limits})=>{
        const exports={};new Function('exports',code)(exports);
        const img=new Image();img.src=data;await img.decode();
        const canvas=document.createElement('canvas');canvas.width=img.width;canvas.height=img.height;
        const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0);
        return exports.detectRuledTable(ctx.getImageData(0,0,img.width,img.height).data,img.width,img.height,limits);
      },{data,code,limits:fixture.limits});
      console.log(JSON.stringify({page:fixture.page,...result}));
    }
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
