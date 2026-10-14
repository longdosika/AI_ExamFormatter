const fs = require('fs');

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#'))
    .map(l => l.split('='))
);
for (const k in env) process.env[k] = env[k];

const ts = require('typescript');
require.extensions['.ts'] = (m, f) => m._compile(
  ts.transpileModule(fs.readFileSync(f, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
  }).outputText,
  f
);

const { analyzePageDiagrams } = require('../lib/diagram-service.ts');

(async () => {
  const { chromium } = require('playwright');
  const b = await chromium.launch({ headless: true, channel: 'msedge' });
  const p = await b.newPage();
  await p.goto('http://localhost:3000');

  const pdfBuf = fs.readFileSync('C:/Users/nathaphat/.gemini/antigravity/brain/82ac165c-57d1-452c-ba17-cfd4425cb1c4/.user_uploaded/media_1791938569863_98eb2182.pdf');
  await p.locator('input[type=file]').setInputFiles({ name: 'chapter7.pdf', mimeType: 'application/pdf', buffer: pdfBuf });
  await p.waitForTimeout(3000);

  const pageImages = await p.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('[data-workspace="source"] img'));
    return imgs.map(i => i.src);
  });

  console.log('Got pageImages count:', pageImages.length);
  const page3 = pageImages[2];

  // Test analyzePageDiagrams on page 3
  const questions = [
    { questionNumber: 15, stem: 'ในการทดลอง...' },
    { questionNumber: 16, stem: 'รูปร่างของผลึกจุนสี...' },
    { questionNumber: 17, stem: 'จากผลการทดลอง...' },
    { questionNumber: 18, stem: 'ถ้าให้ความร้อน...' }
  ];

  try {
    const res = await analyzePageDiagrams(page3, 3, questions);
    console.log('Found diagrams on Page 3:', res.diagrams.length);
    console.log(JSON.stringify(res.diagrams, null, 2));
  } catch (err) {
    console.error('Error on Page 3:', err);
  }

  await b.close();
})();
