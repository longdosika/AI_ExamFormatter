const fs=require('fs');const playwright=require('playwright');
(async()=>{const b=await playwright.chromium.launch({channel:'msedge'});const p=await b.newPage();
await p.setContent('<div id=r>'+fs.readFileSync(process.argv[2],'utf8')+'</div>');
const rows=await p.evaluate(()=>Array.from(document.querySelectorAll('[data-item-id]')).filter(i=>!i.hidden).map(i=>{
 const q=i.querySelector('[data-question-text]')?.textContent||'';
 const keys=Array.from(i.querySelectorAll('[data-choice-key]')).map(c=>c.dataset.choiceKey+(c.dataset.keyInferred?'?':'')).join('');
 const imgs=Array.from(i.querySelectorAll('[data-question-image] img,[data-shared-image] img')).map(m=>m.naturalWidth+'x'+m.naturalHeight);
 const num=i.textContent.trim().match(/^\d+/)?.[0];
 return `${num} keys=${keys} imgs=${imgs.join(',')} q="${q.slice(0,70)}"`;}));
console.log(rows.join('\n'));
console.log('pending-split',await p.evaluate(()=>document.querySelectorAll('[data-pending-split],[data-key-pending]').length));
await b.close();})();
