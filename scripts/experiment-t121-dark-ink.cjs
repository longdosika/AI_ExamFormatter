// Offline experiment only. Never used by the app or sent to an OCR provider.
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try {
  const page=await browser.newPage();
  const ocr=JSON.parse(fs.readFileSync(path.join(root,'evidence/t121/continuation-r2/ocr-response.json'),'utf8'));
  const diagrams=JSON.parse(fs.readFileSync(path.join(root,'evidence/t121/continuation-r2/diagrams-response.json'),'utf8'));
  const regions=ocr[0].pageResults[0].textRegions;
  const figures=diagrams.find(row=>row.page===1&&row.status===200).body.diagrams.map(row=>row.bbox);
  const source='data:image/png;base64,'+fs.readFileSync(path.join(root,'tmp/pdfs/t121-source-1.png')).toString('base64');
  const result=await page.evaluate(async({source,regions,figures})=>{
   const image=new Image();image.src=source;await image.decode();
   const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
   const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);
   const frame=ctx.getImageData(0,0,image.width,image.height);
   const boxes=[...regions.map(row=>row.bbox),...figures],mask=new Uint8Array(image.width*image.height);
   for(const [t,l,b,r] of boxes) for(let y=Math.max(0,Math.floor(t*image.height/1000)-3);y<Math.min(image.height,Math.ceil(b*image.height/1000)+3);y++) mask.fill(1,y*image.width+Math.max(0,Math.floor(l*image.width/1000)-3),y*image.width+Math.min(image.width,Math.ceil(r*image.width/1000)+3));
   let removed=0,protectedDark=0;
   for(let pixel=0;pixel<mask.length;pixel++) {
    const i=pixel*4,[r,g,b]=frame.data.slice(i,i+3);
    if(Math.max(r,g,b)-Math.min(r,g,b)>35||(r+g+b)/3>=160) continue;
    if(mask[pixel]) {protectedDark++;continue;}
    frame.data[i]=frame.data[i+1]=frame.data[i+2]=255;removed++;
   }
   ctx.putImageData(frame,0,0);
   return {png:canvas.toDataURL(),removed,protectedDark,protectedRegions:boxes.length,width:image.width,height:image.height};
  },{source,regions,figures});
  const {png,...metrics}=result;
  fs.writeFileSync(path.join(root,'tmp/pdfs/t121-dark-ink-experiment.png'),Buffer.from(png.split(',')[1],'base64'));
  const report={experiment:'B-38 OCR text/figure protection mask; dark pixels outside mask whitened on a copy',...metrics,deployed:false,providerCalled:false,decision:'Do not deploy: OCR boxes may contain the handwritten marks themselves and miss printed glyphs, so the mask cannot reliably separate dark ink from print. Original unchanged; explicit review remains required.'};
  fs.writeFileSync(path.join(root,'evidence/t121/dark-ink-experiment.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
