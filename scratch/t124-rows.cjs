const fs=require('fs');const playwright=require('playwright');
(async()=>{const [img,y0,y1,x0,x1]=process.argv.slice(2);const b=await playwright.chromium.launch({channel:'msedge'});const p=await b.newPage();
const data='data:image/png;base64,'+fs.readFileSync(img).toString('base64');
const r=await p.evaluate(async([data,y0,y1,x0,x1])=>{const i=new Image();i.src=data;await i.decode();const W=i.naturalWidth,H=i.naturalHeight;const c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');x.drawImage(i,0,0);const d=x.getImageData(0,0,W,H).data;const out=[];
for(let row=Math.round(y0/1000*H);row<Math.round(y1/1000*H);row++){let n=0;for(let col=Math.round(x0/1000*W);col<Math.round(x1/1000*W);col++){const k=(row*W+col)*4;const L=d[k]*.299+d[k+1]*.587+d[k+2]*.114;if(L<150&&Math.max(d[k],d[k+1],d[k+2])-Math.min(d[k],d[k+1],d[k+2])<=60)n++;}out.push((row/H*1000).toFixed(1)+':'+n);}return out.join(' ');},[data,+y0,+y1,+x0,+x1]);console.log(r);await b.close();})();
