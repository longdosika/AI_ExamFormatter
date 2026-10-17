const fs=require('fs');
function edit(f,pairs){let s=fs.readFileSync(f,'utf8');const crlf=s.includes('\r\n');s=s.replace(/\r\n/g,'\n');for(const [a,b] of pairs){if(!s.includes(a))throw new Error(f+': missing '+a.slice(0,80));s=s.replace(a,()=>b);}fs.writeFileSync(f,crlf?s.replace(/\n/g,'\r\n'):s);}
edit('lib/source-answer-service.ts',[
 ['A unique circle is the selected answer even if other choices have X marks. Multiple circles, an X inside the circle, or unclear circles are ambiguous: return no answer.','Each clearly circled choice key is a selected answer even if other choices have X marks; when several different choices of one question are circled, the question has several correct answers: return one entry per circled key (same id). An X inside the circle or an unclear circle is ambiguous: skip that choice.'],
 ['  const counts = new Map<number, number>();\n  for (const row of value) if (row && typeof row.id === "number") counts.set(row.id, (counts.get(row.id) || 0) + 1);','  // T-126: one question may have several circled keys (multiple correct answers); the same key twice is ambiguous.\n  const counts = new Map<string, number>();\n  for (const row of value) if (row && typeof row.id === "number") counts.set(`${row.id}:${row.key}`, (counts.get(`${row.id}:${row.key}`) || 0) + 1);'],
 ['    return question && counts.get(row.id) === 1 && question.keys.includes(row.key) &&','    return question && counts.get(`${row.id}:${row.key}`) === 1 && question.keys.includes(row.key) &&'],
]);
edit('lib/source-answer-client.ts',[
 [`    for (const answer of (result.answers || []) as SourceAnswer[]) {
      const item = items.find(item => item.id === answer.id && item.sourcePage === answer.page);
      if (!item || item.reconciledAnswerKey || !item.choices.some(choice => choice.key === answer.key)) continue;
      item.reconciledAnswerKey = answer.key;
      item.reconciliationProvenance = "source_vision";
      item.sourceAnswerEvidence = { page: answer.page, confidence: answer.confidence, evidence: answer.evidence, bbox: answer.bbox, model: result.model };
      item.choices.forEach(choice => { choice.isCorrect = choice.key === answer.key; choice.shadingType = choice.isCorrect ? "source_provided" : "none"; });
      count++;
    }`,`    // T-126: several circled keys of one question are all correct answers.
    const answered = new Set<number>();
    for (const answer of (result.answers || []) as SourceAnswer[]) {
      const item = items.find(item => item.id === answer.id && item.sourcePage === answer.page);
      if (!item || (item.reconciledAnswerKey && !answered.has(item.id)) || !item.choices.some(choice => choice.key === answer.key)) continue;
      if (!answered.has(item.id)) {
        answered.add(item.id);
        item.reconciledAnswerKey = answer.key;
        item.reconciliationProvenance = "source_vision";
        item.sourceAnswerEvidence = { page: answer.page, confidence: answer.confidence, evidence: answer.evidence, bbox: answer.bbox, model: result.model };
        item.choices.forEach(choice => { choice.isCorrect = false; choice.shadingType = "none"; });
        count++;
      }
      const keys = new Set([...(item.reconciledAnswerKeys || [item.reconciledAnswerKey!]), answer.key]);
      item.reconciledAnswerKeys = keys.size > 1 ? Array.from(keys) : undefined;
      item.choices.forEach(choice => { if (choice.key === answer.key) { choice.isCorrect = true; choice.shadingType = "source_provided"; } });
    }`],
]);
console.log('ok');
