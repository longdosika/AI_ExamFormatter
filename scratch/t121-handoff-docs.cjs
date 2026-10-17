const fs = require('fs');
function edit(file, pairs) {
  let s = fs.readFileSync(file, 'utf8'); const crlf = s.includes('\r\n'); s = s.replace(/\r\n/g, '\n');
  for (const [from, to] of pairs) { if (!s.includes(from)) throw new Error(`${file}: missing ${from.slice(0, 70)}`); s = s.replace(from, () => to); }
  fs.writeFileSync(file, crlf ? s.replace(/\n/g, '\r\n') : s);
}
const handoff = fs.readFileSync(__dirname + '/t121-handoff.md', 'utf8');
const issues = fs.readFileSync(__dirname + '/t121-issues.md', 'utf8');
const taskEntry = fs.readFileSync(__dirname + '/t121-task123.md', 'utf8');
const taskNote = fs.readFileSync(__dirname + '/t121-tasknote.md', 'utf8');
edit('release_log.md', [
  ['## ประวัติ build (ใหม่สุดอยู่บน)', handoff + '\n## ประวัติ build (ใหม่สุดอยู่บน)'],
  ['| I-036 |', issues.trimEnd() + '\n| I-036 |'],
]);
edit('documents/tasks.md', [
  ['### T-122 Confirm quick-pointer', taskEntry + '\n### T-122 Confirm quick-pointer'],
  ['- B-36 diagnosis (2026-10-17):', taskNote.trimEnd() + '\n- B-36 diagnosis (2026-10-17):'],
]);
console.log('handoff docs written');
