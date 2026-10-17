// T-121 helper: parse a captured OCR response (evidence/t121/ocr-response.json) and print every question's structure.
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => {
  module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText, filename);
};
const { parseExamText } = require('../lib/exam-parser.ts');
const { validateExamItems } = require('../lib/exam-validation.ts');
function combinedOcrText(file) {
  let offset = 0;
  return JSON.parse(fs.readFileSync(file, 'utf8')).map(batch => {
    const text = batch.text.replace(/^\[PAGE (\d+)\]/gm, (_m, page) => `[PAGE ${Number(page) + offset}]`);
    offset += batch.pageCount;
    return text;
  }).join('\n\n');
}
module.exports = { combinedOcrText };
if (require.main === module) {
  const items = parseExamText(combinedOcrText(process.argv[2] || 'evidence/t121/ocr-response.json'));
  for (const item of items) console.log(`${item.questionNumber} [p${item.sourcePage}] ${item.questionText.slice(0, 60).replace(/\n/g, ' / ')}\n   ` + item.choices.map(c => `${c.key}${c.keyInferred ? '?' : ''}=${c.text}`).join(' | '));
  console.log('ISSUES', validateExamItems(items));
}
