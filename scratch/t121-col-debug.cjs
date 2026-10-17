const fs=require('fs');const playwright=require('playwright');
(async()=>{const b=await playwright.chromium.launch({channel:'msedge'});const p=await b.newPage();
const img='data:image/png;base64,'+fs.readFileSync('evidence/t121/audit-0017/pages/page-2.png').toString('base64');
const r=await p.evaluate(async(img)=>{const i=new Image();i.src=img;await i.decode();const W=i.naturalWidth,H=i.naturalHeight;const c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');x.drawImage(i,0,0);const d=x.getImageData(0,0,W,H).data;
const rows=[];for(let row=650;row<900;row++){let n=0;for(let col=150;col<420;col++){const k=(row*W+col)*4;const L=d[k]*.299+d[k+1]*.587+d[k+2]*.114;if(L<150&&Math.max(d[k],d[k+1],d[k+2])-Math.min(d[k],d[k+1],d[k+2])<=60)n++;}rows.push(n);}
const cols=[];for(let col=360;col<440;col++){let n=0;for(let row=702;row<848;row++){const k=(row*W+col)*4;const L=d[k]*.299+d[k+1]*.587+d[k+2]*.114;if(L<150&&Math.max(d[k],d[k+1],d[k+2])-Math.min(d[k],d[k+1],d[k+2])<=60)n++;}cols.push(n);}
return {W,H,rows:rows.map((n,i)=>n?(650+i)+':'+n:'').filter(Boolean).join(' '),cols:cols.join(',')};},img);console.log(r);await b.close();})();
