const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const assert = require('node:assert/strict');
const {performance} = require('node:perf_hooks');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020}
}).outputText, filename);
const {parseExamText} = require('../lib/exam-parser.ts');
const results = [];
for (const count of [100, 1000, 5000]) {
  const source = Array.from({length: count}, (_, index) => `${index+1}. Source question ${index+1}\nก. First\nข. Second*\nค. Third\nง. Fourth\nคำอธิบาย: ตอบ ข. source evidence`).join('\n');
  parseExamText(source); // warm-up before reporting seven samples
  const samplesMs = [];
  for (let sample = 0; sample < 7; sample++) {
    const start = performance.now();
    const items = parseExamText(source);
    samplesMs.push(Number((performance.now()-start).toFixed(3)));
    assert.equal(items.length, count);
    items.forEach((item, index) => {
      assert.equal(item.questionNumber, index+1); assert.equal(item.questionText, `Source question ${index+1}`);
      assert.equal(item.choices.length, 4); assert.equal(item.reconciledAnswerKey, 'ข');
      assert.equal(item.choices.filter(choice => choice.isCorrect).length, 1);
    });
  }
  const sorted = [...samplesMs].sort((a,b) => a-b);
  results.push({questions: count, sourceBytesUtf8: Buffer.byteLength(source), samplesMs, medianMs: sorted[3], maxMs: sorted[6], correctness: 'all source question texts, numbers, four choices and source answers asserted each sample'});
}
const artifact = {task: 'T-022', capturedAt: new Date().toISOString(), environment: {node: process.version, typescript: ts.version, platform: process.platform, release: os.release(), arch: process.arch, cpu: os.cpus()[0]?.model, logicalCpus: os.cpus().length}, methodology: 'Synchronous parser only; one warm-up and seven measured samples per size; correctness asserted outside measured interval; observations are not timed test thresholds or browser/import measurements.', results};
const output = path.resolve(__dirname, '../evidence/performance-baseline.json');
fs.writeFileSync(output, JSON.stringify(artifact, null, 2)+'\n');
console.log(JSON.stringify({artifact: output, results: results.map(({questions, medianMs, maxMs}) => ({questions, medianMs, maxMs}))}, null, 2));
