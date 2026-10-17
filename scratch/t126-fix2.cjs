const fs=require('fs');
function edit(f,pairs){let s=fs.readFileSync(f,'utf8');const crlf=s.includes('\r\n');s=s.replace(/\r\n/g,'\n');for(const [a,b] of pairs){if(!s.includes(a))throw new Error(f+': missing '+a.slice(0,80));s=s.replace(a,()=>b);}fs.writeFileSync(f,crlf?s.replace(/\n/g,'\r\n'):s);}
edit('components/SplitDocumentEditor.tsx',[
 ['import { ANSWER_ORIGINS, MAX_CHOICES, confirmCurrentAnswers,','import { ANSWER_ORIGINS, MAX_CHOICES, choiceKeySpan, confirmCurrentAnswers,'],
 ['      const body = Array.from(row.querySelectorAll<HTMLElement>("span")).find(span => !span.closest("[data-export-ignore], [data-answer-marker]") && !/^\s*[ก-จ]\.\s*$/.test(span.textContent || "")) || row;','      const keySpan = choiceKeySpan(row);\n      const body = Array.from(row.querySelectorAll<HTMLElement>("span")).find(span => span !== keySpan && !span.contains(keySpan) && !span.closest("[data-export-ignore], [data-answer-marker]")) || row;'],
]);
edit('scripts/test-t126-answers-choices.cjs',[
 ["    key: row.dataset.choiceKey, origin: row.dataset.answerOrigin,","    key: row.dataset.choiceKey, origin: row.dataset.answerOrigin,\n    visible: Array.from(row.querySelectorAll('span')).find(span => !span.closest('[data-export-ignore],[data-answer-marker]') && /^\s*[ก-จ]\.\s*$/.test(span.textContent || ''))?.textContent.trim(),"],
 ["  assert.deepEqual(q2.map(row => row.key), ['ก', 'ข', 'ค']);","  assert.deepEqual(q2.map(row => row.key), ['ก', 'ข', 'ค']);\n  assert.deepEqual(q2.map(row => row.visible), ['ก.', 'ข.', 'ค.'], 'visible keys re-letter too');"],
 ["  assert.deepEqual(q2.map(row => row.key), ['ก', 'ข', 'ค', 'ง']);","  assert.deepEqual(q2.map(row => row.key), ['ก', 'ข', 'ค', 'ง']);\n  assert.deepEqual(q2.map(row => row.visible), ['ก.', 'ข.', 'ค.', 'ง.'], 'the added row shows its key');"],
]);
console.log('ok');
