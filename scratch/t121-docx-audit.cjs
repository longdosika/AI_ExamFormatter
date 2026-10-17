// Audit an exported DOCX against master-template structure rules.
const fs=require('fs');const {execSync}=require('child_process');
const xml=execSync(`unzip -p "${process.argv[2]}" word/document.xml`,{maxBuffer:1e8}).toString();
const lines=xml.replace(/<w:drawing>[\s\S]*?<\/w:drawing>/g,'[IMAGE]').split('</w:p>').map(p=>p.replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').trim()).filter(Boolean);
const blocks=[];let cur=null;
for(const l of lines){const m=l.match(/^(\d+)\.\s/);if(m&&(!cur||cur.lines.includes('ตัวเลือก:'))){cur={n:+m[1],lines:[l]};blocks.push(cur);}else if(cur)cur.lines.push(l);}
const issues=[];let expect=1;
for(const b of blocks){const L=b.lines;const ci=L.indexOf('ตัวเลือก:'),fi=L.indexOf('รูปคำถาม:'),ei=L.findIndex(x=>x.startsWith('คำอธิบาย:'));
 if(b.n!==expect)issues.push(`${b.n}: เลขข้อไม่ต่อเนื่อง (คาด ${expect})`);expect=b.n+1;
 const stem=L.slice(0,fi>=0?fi:ci);const choices=L.slice(ci+1,ei>=0?ei:undefined).filter(x=>x!=='[IMAGE]'&&!/^(จบโจทย์ร่วม|◆|โจทย์ร่วม|รูปโจทย์ร่วม:)/.test(x));
 const choiceCount=L.slice(ci+1).findIndex(x=>/^(คำอธิบาย:|โจทย์ร่วม|จบโจทย์ร่วม)/.test(x));const realChoices=(choiceCount<0?L.slice(ci+1):L.slice(ci+1,ci+1+choiceCount));
 if(realChoices.length!==4)issues.push(`${b.n}: ตัวเลือก ${realChoices.length} บรรทัด`);
 if(fi>=0&&ci>=0&&fi>ci)issues.push(`${b.n}: รูปคำถามอยู่หลังตัวเลือก`);
 stem.slice(1).forEach(x=>{if(/^\d+\.\s/.test(x))issues.push(`${b.n}: บรรทัดในโจทย์ขึ้นต้นด้วยเลข "${x.slice(0,30)}" (QuizFlow อาจอ่านเป็นข้อใหม่)`);});
 if(/(\s\S{1,4}){4,}$/.test(stem.join(' '))&&!/[?ใด]$/.test(stem.join(' ').trim()))issues.push(`${b.n}: ท้ายโจทย์มีคำสั้นต่อกันหลายคำ "${stem.join(' ').slice(-40)}"`);
 realChoices.forEach(x=>{if(/^[ก-ง][.)]\s/.test(x))issues.push(`${b.n}: ตัวเลือกยังมี key "${x.slice(0,20)}"`);if(/\s[ก-ง]\.\s|\s[1-4]\.\s[ก-๙]/.test(x))issues.push(`${b.n}: ตัวเลือกอาจรวม 2 ข้อ "${x.slice(0,50)}"`);});
}
console.log(`${process.argv[2]}: ${blocks.length} questions`);console.log(issues.join('\n')||'no structural issues');
