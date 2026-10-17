const fs=require('fs');
let s=fs.readFileSync('documents/tasks.md','utf8');const crlf=s.includes('\r\n');s=s.replace(/\r\n/g,'\n');
if(!s.includes('### T-123')){
  s=s.replace('### T-122 Confirm quick-pointer',()=>fs.readFileSync('scratch/t121-task123.md','utf8')+'\n### T-122 Confirm quick-pointer');
  s=s.replace('- B-36 diagnosis (2026-10-17):',()=>fs.readFileSync('scratch/t121-tasknote.md','utf8').trimEnd()+'\n- B-36 diagnosis (2026-10-17):');
}
for(let i=0;i<5;i++){try{fs.writeFileSync('documents/tasks.md',crlf?s.replace(/\n/g,'\r\n'):s);console.log('written try',i+1);break;}catch(e){console.log('retry',e.code);require('child_process').execSync('sleep 2');}}
