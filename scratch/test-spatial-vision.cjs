const fs = require('fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => {
  module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true }
  }).outputText, filename);
};
const { parseExamText } = require('../lib/exam-parser.ts');

function reconstructSpatialText(visionPage) {
  if (!visionPage || !visionPage.blocks) return null;
  const words = [];
  for (const block of visionPage.blocks) {
    for (const para of block.paragraphs) {
      for (const word of para.words) {
        const text = word.symbols.map(s => s.text).join('');
        const minX = Math.min(...word.boundingBox.vertices.map(v => v.x ?? 0));
        const minY = Math.min(...word.boundingBox.vertices.map(v => v.y ?? 0));
        const maxY = Math.max(...word.boundingBox.vertices.map(v => v.y ?? 0));
        const midY = (minY + maxY) / 2;
        const height = maxY - minY;
        words.push({ text, minX, minY, maxY, midY, height });
      }
    }
  }
  if (!words.length) return null;

  words.sort((a, b) => a.minY - b.minY);

  const lines = [];
  for (const word of words) {
    let placed = false;
    for (const line of lines) {
      const avgY = line.reduce((sum, w) => sum + w.midY, 0) / line.length;
      const avgH = line.reduce((sum, w) => sum + w.height, 0) / line.length;
      if (Math.abs(word.midY - avgY) < Math.max(avgH, word.height) * 0.6) {
        line.push(word);
        placed = true;
        break;
      }
    }
    if (!placed) {
      lines.push([word]);
    }
  }

  lines.sort((a, b) => {
    const minYa = Math.min(...a.map(w => w.minY));
    const minYb = Math.min(...b.map(w => w.minY));
    return minYa - minYb;
  });

  return lines.map(line => {
    line.sort((a, b) => a.minX - b.minX);
    return line.map(w => w.text).join(' ');
  }).join('\n');
}

async function testPages() {
  const env = fs.readFileSync('.env.local', 'utf8');
  const key = env.match(/GOOGLE_PICKER_API_KEY=([^\r\n]+)/)[1].trim();

  let allText = '';
  for (let p = 1; p <= 3; p++) {
    const pad = String(p).padStart(2, '0');
    const b64 = fs.readFileSync('D:/0-Project/10-Obsidian/quizflow/tmp/separation_pages/page-' + pad + '.png').toString('base64');
    const res = await fetch('https://vision.googleapis.com/v1/images:annotate?key=' + key, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [{ image: { content: b64 }, features: [{ type: 'DOCUMENT_TEXT_DETECTION' }] }]
      })
    });
    const data = await res.json();
    const page = data.responses?.[0]?.fullTextAnnotation?.pages?.[0];
    const text = reconstructSpatialText(page) || data.responses?.[0]?.fullTextAnnotation?.text || '';
    allText += `[PAGE ${p}]\n` + text + '\n\n';
  }

  // Pre-split inline numeric choices
  allText = allText.replace(/(?<=\S)\s+(?=(?:[24])[.)]\s+)/g, '\n');

  console.log('Reconstructed text length:', allText.length);
  const items = parseExamText(allText);
  console.log('Total questions parsed:', items.length);
  console.log('Question numbers:', items.map(it => it.questionNumber));
}

testPages().catch(console.error);
