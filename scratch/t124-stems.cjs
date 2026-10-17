const fs=require('fs');const playwright=require('playwright');
(async()=>{const b=await playwright.chromium.launch({channel:'msedge'});const p=await b.newPage();
await p.setContent('<div>'+fs.readFileSync(process.argv[2],'utf8')+'</div>');
console.log((await p.evaluate(nums=>Array.from(document.querySelectorAll('[data-item-id]')).filter(i=>nums.includes(i.textContent.trim().match(/^\d+/)?.[0])).map(i=>i.textContent.trim().match(/^\d+/)[0]+': STEM='+JSON.stringify(i.querySelector('[data-question-text]')?.innerText)+' SHARED='+JSON.stringify(i.querySelector('[data-shared-context-block]')?.innerText?.slice(0,200)||'')),process.argv.slice(3))).join('\n'));await b.close();})();
