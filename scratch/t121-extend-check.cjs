const fs=require('fs');const ts=require('typescript');const playwright=require('playwright');
const src=fs.readFileSync('lib/diagram-client.ts','utf8');const start=src.indexOf('export function extendCropAcrossInk');const end=src.indexOf('export async function cropBboxFromImage');
const js=ts.transpile(src.slice(start,end).replace('export ',''),{target:ts.ScriptTarget.ES2020});
const diags=require('../evidence/t121/audit-0017/diagrams-response.json');
(async()=>{const b=await playwright.chromium.launch({channel:'msedge'});const p=await b.newPage();
for(const d of diags){const img='data:image/png;base64,'+fs.readFileSync(`evidence/t121/audit-0017/pages/page-${d.page}.png`).toString('base64');
for(const g of d.body.diagrams||[]){const r=await p.evaluate(async([js,img,bbox])=>{eval(js+';window.f=extendCropAcrossInk');const i=new Image();i.src=img;await i.decode();const W=i.naturalWidth,H=i.naturalHeight;const c=document.createElement('canvas');c.width=W;c.height=H;const x2=c.getContext('2d');x2.drawImage(i,0,0);
const rawX=bbox[1]/1000*W,rawY=bbox[0]/1000*H,rawW=(bbox[3]-bbox[1])/1000*W,rawH=(bbox[2]-bbox[0])/1000*H;const padX=Math.max(32,Math.min(36,Math.round(rawW*0.035))),padY=Math.max(32,Math.min(32,Math.round(rawH*0.035)));
const x=Math.round(rawX-padX),y=Math.round(rawY-padY),w=Math.ceil(rawX+rawW+padX)-x,h=Math.ceil(rawY+rawH+padY)-y;const e=window.f(x2.getImageData(0,0,W,H).data,W,H,{x,y,w,h},{left:0,right:W},{top:Math.round(rawY),bottom:Math.round(rawY+rawH)});
const o=document.createElement('canvas');o.width=e.w;o.height=h;o.getContext('2d').drawImage(i,e.x,y,e.w,h,0,0,e.w,h);return {before:[x,w],after:[e.x,e.w],url:o.toDataURL()};},[js,img,g.bbox]);
console.log('q',g.questionNumber,'before',r.before,'after',r.after);fs.writeFileSync(`evidence/t121/audit-0017/extended-q${g.questionNumber}.png`,Buffer.from(r.url.split(',')[1],'base64'));}}
await b.close();})();
