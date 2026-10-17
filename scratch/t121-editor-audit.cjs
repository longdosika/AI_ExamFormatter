// Structural audit of an editor snapshot: choice keys, number sequence, stem tails, merged choices.
const fs=require('fs');const playwright=require('playwright');
(async()=>{const b=await playwright.chromium.launch({channel:'msedge'});const p=await b.newPage();
await p.setContent('<div id=r>'+fs.readFileSync(process.argv[2],'utf8')+'</div>');
const items=await p.evaluate(()=>Array.from(document.querySelectorAll('[data-item-id]')).filter(i=>!i.hidden).map(i=>({
 n:Number(i.textContent.trim().match(/^\d+/)?.[0]),stem:i.querySelector('[data-question-text]')?.innerText||'',
 choices:Array.from(i.querySelectorAll('[data-choice-key]')).map(c=>({k:c.dataset.choiceKey,inf:!!c.dataset.keyInferred,t:(c.innerText||'').replace(/^\s*[ก-จ]\.\s*/,'').replace(/\s*\*?\s*(เฉลย.*)?$/,'').trim(),img:!!c.querySelector('img')})),
 fig:!!i.querySelector('[data-question-image] img,[data-shared-image] img')})));
const out=[];let prev=0;
for(const it of items){const keys=it.choices.map(c=>c.k).join('');
 if(it.n!==prev+1)out.push(`${it.n}: เลขข้อไม่ต่อเนื่อง (ก่อนหน้า ${prev})`);prev=it.n;
 if(keys!=='กขคง')out.push(`${it.n}: ตัวเลือก ${keys||'ไม่มี'}`);
 it.choices.forEach(c=>{if(c.inf)out.push(`${it.n}: ตัวเลือก ${c.k} กู้คืนจาก OCR`);if(!c.t&&!c.img)out.push(`${it.n}: ตัวเลือก ${c.k} ว่าง`);if(/\s[ก-ง]\.\s|\s[1-4]\.\s[ก-๙]|\.\s[ก-๙]{4,}/.test(c.t))out.push(`${it.n}: ตัวเลือก ${c.k} อาจรวม "${c.t.slice(0,50)}"`);if(/^[\/|]/.test(c.t))out.push(`${it.n}: ตัวเลือก ${c.k} มีรอยปากกา "${c.t.slice(0,20)}"`);});
 const tail=it.stem.trim().split(/\s+/).slice(-4);if(tail.length===4&&tail.every(w=>w.length<=4))out.push(`${it.n}: ท้ายโจทย์มีคำสั้นต่อกัน "${tail.join(' ')}" (อาจเป็นป้ายในรูป)`);
 if(/ตาราง|ดังรูป|กราฟ|ในภาพ|จากรูป/.test(it.stem)&&!it.fig)out.push(`${it.n}: โจทย์อ้างรูป/ตาราง แต่ไม่มีรูป`);
 if(/[ก-๙]\s[ก-๙]\s[ก-๙]\s/.test(it.stem))out.push(`${it.n}: อักษรไทยแตกเป็นตัวเดี่ยว`);
}
console.log(`${process.argv[2]}: ${items.length} ข้อ`);console.log(out.join('\n')||'ไม่พบปัญหาโครงสร้าง');await b.close();})();
