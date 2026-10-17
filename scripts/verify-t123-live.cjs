// Explicit opt-in only: existing provider quota, original raster, no OCR or answer solving.
const fs = require('node:fs');
const path = require('node:path');
const { combinedOcrText } = require('./t121-dump-parse.cjs');
const { parseExamText } = require('../lib/exam-parser.ts');
const root = path.resolve(__dirname, '..');
const base = process.env.E2E_BASE_URL || 'http://localhost:3000';
const out = path.join(root, 'evidence/t123/live');

async function main() {
  if (process.env.T123_LIVE !== '1') throw new Error('Set T123_LIVE=1 only with owner authorization to consume existing quota.');
  const round = Number(process.env.T123_ROUND || 1);
  const pages = (process.env.T123_PAGES || '1').split(',').map(Number);
  if (![1, 2, 3].includes(round) || !pages.length || pages.some(page => ![1, 2, 3, 4].includes(page))) throw new Error('Invalid bounded round/pages');
  fs.mkdirSync(out, { recursive: true });
  const items = parseExamText(combinedOcrText(path.join(root, 'evidence/t121/continuation-r2/ocr-response.json')));
  const results = [];
  for (const page of pages) {
    const imagePath = path.join(root, `evidence/t121/audit-0017/pages/page-${page}.png`);
    const questions = items.filter(item => item.sourcePage === page).map(item => ({
      id: item.id, questionNumber: item.questionNumber, questionText: item.questionText,
      keys: item.choices.map(choice => choice.key)
    }));
    if (!questions.length) throw new Error(`No source questions on page ${page}`);
    const started = Date.now();
    const file = path.join(out, `source-round${round}-page${page}.json`);
    if (fs.existsSync(file)) throw new Error(`Refusing to overwrite live evidence: ${file}`);
    console.log(`LIVE source-only round=${round} page=${page} questions=${questions.length}`);
    let result;
    try {
      const response = await fetch(`${base}/api/source-answers`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Origin: base },
        body: JSON.stringify({ image: `data:image/png;base64,${fs.readFileSync(imagePath).toString('base64')}`, questions, page }),
        signal: AbortSignal.timeout(240000)
      });
      const raw = await response.json();
      result = { round, page, at: new Date().toISOString(), http: response.status, durationMs: Date.now() - started,
        source: path.relative(root, imagePath), questionNumbers: questions.map(q => q.questionNumber),
        scope: 'Live source marks only; no OCR, solver, purchase, billing or model/key configuration change', raw };
    } catch (error) {
      result = { round, page, at: new Date().toISOString(), durationMs: Date.now() - started,
        error: error.name === 'TimeoutError' ? 'Request timeout; provider may still be running. Do not retry immediately.' : error.message };
    }
    fs.writeFileSync(file, JSON.stringify(result, null, 2));
    results.push(result);
    console.log(JSON.stringify({ round, page, http: result.http, durationMs: result.durationMs,
      model: result.raw?.model, answers: result.raw?.answers?.map(a => ({ id: a.id, key: a.key })), code: result.raw?.code, error: result.error }));
    if (result.http !== 200) break;
  }
  const recorded = [1, 2, 3, 4].map(page => path.join(out, `source-round${round}-page${page}.json`))
    .filter(file => fs.existsSync(file)).map(file => JSON.parse(fs.readFileSync(file, 'utf8')));
  const summary = { round, requestedPages: pages, completedPages: recorded.map(r => r.page),
    allHttp200: recorded.every(r => r.http === 200), fullFourPages: recorded.length === 4,
    detectedCount: recorded.reduce((count, result) => count + (result.raw?.answers?.length || 0), 0),
    note: 'Detected count is NOT a correctness certification; compare marks with original pages before acceptance.' };
  fs.writeFileSync(path.join(out, `source-round${round}-summary.json`), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary));
  if (!summary.allHttp200) process.exitCode = 1;
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
