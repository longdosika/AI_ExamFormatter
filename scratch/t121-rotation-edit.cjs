// Rewrite "for each key { for each model }" loops into executeAcrossModelsAndKeys (model outer, key inner).
const fs = require('fs');
for (const [file, list] of [['lib/source-answer-service.ts', 'ANSWER_CANDIDATE_MODELS'], ['lib/ai-answer-service.ts', 'SOLVER_CANDIDATE_MODELS'], ['lib/diagram-service.ts', 'CANDIDATE_MODELS']]) {
  let s = fs.readFileSync(file, 'utf8'); const crlf = s.includes('\r\n'); s = s.replace(/\r\n/g, '\n');
  const lines = s.split('\n');
  const start = lines.findIndex(l => l.includes('const rotation = await executeWithKeyRotation("gemini", async (key, keyIdx, totalKeys) => {'));
  if (start < 0 || !lines[start + 1].includes('let lastError: Error | null = null;') || !lines[start + 2].includes(`for (const model of ${list}) {`) || lines[start + 3].trim() !== 'try {') throw new Error('shape ' + file);
  let end = start + 4;
  while (!(lines[end].trim().startsWith('} catch (err) {'))) end++;
  // end: "} catch (err) {", +1 lastError=, +2 "}", +3 "}" (for), +4 blank?, then throw lastError, then "});"
  let close = end; while (!lines[close].includes('throw lastError || new Error("ALL_MODELS_FAILED");')) close++;
  const body = lines.slice(start + 4, end).map(l => l.startsWith('    ') ? l.slice(4) : l)
    .map(l => l.replace(/^(\s*)lastError = new Error\(`GEMINI_HTTP_\$\{response.status\}`\);$/, '$1throw new Error(`GEMINI_HTTP_${response.status}`);'))
    .filter(l => !/^\s*continue;/.test(l));
  const head = lines[start].replace('executeWithKeyRotation("gemini", async (key, keyIdx, totalKeys) => {', `executeAcrossModelsAndKeys("gemini", ${list}, async (key, model, keyIdx, totalKeys) => {`);
  lines.splice(start, close - start + 1, head, ...body);
  s = lines.join('\n').replace(/import \{ executeWithKeyRotation \} from "\.\/api-key-manager";/, 'import { executeAcrossModelsAndKeys } from "./api-key-manager";');
  fs.writeFileSync(file, crlf ? s.replace(/\n/g, '\r\n') : s);
  console.log(file, 'rewritten', start, close);
}
