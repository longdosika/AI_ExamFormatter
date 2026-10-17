// Manual ground truth inspected on all four original coloured source3 page rasters.
const fs = require('node:fs');
const path = require('node:path');
const out = path.resolve(__dirname, '../evidence/t123/live');
const expected = { 1: 'ค', 2: 'ค', 4: 'ง', 6: 'ค', 8: 'ง', 10: 'ค', 14: 'ก', 17: 'ค', 18: 'ข', 19: 'ข', 21: 'ข', 24: 'ค' };
const rounds = [];
for (const round of [1, 2, 3]) {
  const files = [1, 2, 3, 4].map(page => path.join(out, `source-round${round}-page${page}.json`)).filter(file => fs.existsSync(file));
  if (!files.length) continue;
  const pages = files.map(file => JSON.parse(fs.readFileSync(file, 'utf8')));
  const answers = pages.flatMap(page => page.raw?.answers || []);
  const correct = answers.filter(answer => expected[answer.id] === answer.key);
  const unsupported = answers.filter(answer => expected[answer.id] !== answer.key);
  const duplicateIds = correct.filter((answer, index) => correct.findIndex(other => other.id === answer.id) !== index).map(a => a.id);
  rounds.push({ round, fullPages: pages.length === 4 && pages.every(page => page.http === 200),
    models: [...new Set(pages.map(page => page.raw?.model).filter(Boolean))],
    correctCount: new Set(correct.map(answer => answer.id)).size, unsupported: unsupported.map(({ id, key }) => ({ id, key })), duplicateIds,
    missed: Object.keys(expected).map(Number).filter(id => !correct.some(answer => answer.id === id)) });
}
const report = { inspectedSource: 'evidence/t121/audit-0017/pages/page-1.png through page-4.png', expected,
  exclusion: 'Q9 has two circled keys and is ambiguous; X/cross/tick marks alone are not selected answers.',
  rounds, acceptance: rounds.length === 3 && rounds.every(round => round.fullPages && round.correctCount >= 10 && !round.unsupported.length && !round.duplicateIds.length),
  next: 'Stop repeated source tests after round2 failed the consecutive-round threshold; no purchase or billing change. Provider model fallback is observed, not proof of a specific HTTP quota response.' };
fs.writeFileSync(path.join(out, 'source-mark-audit.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
