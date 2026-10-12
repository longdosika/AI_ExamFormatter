const fs=require('fs');
const env=fs.readFileSync('.env.local','utf8');
const key=(env.match(/^TYPHOON_OCR_API_KEY=(.*)$/m)||[])[1]?.trim();
const b64=fs.readFileSync('evidence/t038-page1-1.png').toString('base64');
(async()=>{const res=await fetch('https://api.opentyphoon.ai/v1/chat/completions',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({model:'typhoon-ocr',messages:[{role:'user',content:[{type:'text',text:'อ่านข้อความทั้งหมดจากภาพนี้ ส่งคืนเฉพาะข้อความสั้น ๆ'}, {type:'image_url',image_url:{url:`data:image/png;base64,${b64}`}}]}],temperature:0.1,max_tokens:128})}); const text=await res.text(); console.log(JSON.stringify({status:res.status,ok:res.ok,body:text.slice(0,500)}));})().catch(e=>{console.error(e.message);process.exit(1)});
