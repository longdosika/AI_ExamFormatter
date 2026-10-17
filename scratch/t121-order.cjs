const fs=require('fs');const playwright=require('playwright');
(async()=>{const b=await playwright.chromium.launch({channel:'msedge'});const p=await b.newPage();
await p.setContent('<div id=r>'+fs.readFileSync(process.argv[2],'utf8')+'</div>');
const rows=await p.evaluate(()=>Array.from(document.querySelectorAll('[data-item-id]')).filter(i=>!i.hidden&&i.querySelector('img')).map(i=>{
 const parts=[];const walk=(el)=>{for(const c of el.children){const d=c.dataset||{};
  if(d.questionText)parts.push('stem');else if(d.questionImage)parts.push('figure');else if(d.sharedImage)parts.push('shared-figure');else if(d.choiceKey)parts.push('choice:'+d.choiceKey);else if(/ตัวเลือก:/.test(c.textContent)&&c.children.length===0)parts.push('label-choices');else if(d.missingFigure)parts.push('missing');else walk(c);}};walk(i);
 return i.textContent.trim().match(/^\d+/)?.[0]+': '+parts.filter((x,k,a)=>x!==a[k-1]).join(' > ');}));
console.log(rows.join('\n'));await b.close();})();
