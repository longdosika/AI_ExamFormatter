const fs=require('fs');const playwright=require('playwright');
(async()=>{const [img,ymin,xmin,ymax,xmax,out]=process.argv.slice(2);const b=await playwright.chromium.launch({channel:'msedge'});const p=await b.newPage();
const data='data:image/png;base64,'+fs.readFileSync(img).toString('base64');
const r=await p.evaluate(async([data,box])=>{const i=new Image();i.src=data;await i.decode();const W=i.naturalWidth,H=i.naturalHeight;const [y0,x0,y1,x1]=box.map(Number);
const c=document.createElement('canvas');const sx=x0/1000*W,sy=y0/1000*H,sw=(x1-x0)/1000*W,sh=(y1-y0)/1000*H;c.width=sw;c.height=sh;c.getContext('2d').drawImage(i,sx,sy,sw,sh,0,0,sw,sh);return {W,H,url:c.toDataURL()};},[data,[ymin,xmin,ymax,xmax]]);
fs.writeFileSync(out,Buffer.from(r.url.split(',')[1],'base64'));console.log(r.W,r.H);await b.close();})();
