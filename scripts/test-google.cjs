const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

require.extensions['.ts'] = (module, filename) => {
  module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true }
  }).outputText, filename);
};

// Set dummy session secret for crypto tests
process.env.GOOGLE_SESSION_SECRET = '0123456789abcdef0123456789abcdef';
process.env.APP_URL = 'http://localhost:3000';

const { sealCookie, openCookie, equalState, googleConfig, canonicalAuthRedirect } = require('../lib/google-auth.ts');
const { validateExportDocument, createExportDocx } = require('../lib/google-export.ts');

(async () => {
  assert.equal(canonicalAuthRedirect('http://127.0.0.1:3001/api/google/auth'), 'http://localhost:3000/api/google/auth');
  assert.equal(canonicalAuthRedirect('http://localhost:3001/api/google/auth'), 'http://localhost:3000/api/google/auth');
  assert.equal(canonicalAuthRedirect('http://localhost:3000/api/google/auth'), null);
  assert.equal(canonicalAuthRedirect('https://untrusted.example/api/google/auth'), 'http://localhost:3000/api/google/auth');
  // Test cookie seal and open
  const payload = { token: 'sample-token', expires: Date.now() + 60000 };
  const sealed = sealCookie(payload, 'test_purpose');
  assert.ok(typeof sealed === 'string');
  const opened = openCookie(sealed, 'test_purpose');
  assert.deepEqual(opened, payload);

  // Mismatched purpose returns null
  assert.equal(openCookie(sealed, 'wrong_purpose'), null);

  // Timing safe equal
  assert.ok(equalState('state_123', 'state_123'));
  assert.ok(!equalState('state_123', 'state_456'));

  // Test document validation
  const validDoc = {
    title: 'Test Exam Document',
    paragraphs: [
      {
        background: 'F7F7F7',
        runs: [
          { text: 'ข้อ 1. ', bold: true, color: 'F2604D' },
          { text: 'โจทย์ทดสอบ', color: '000000' }
        ]
      }
    ]
  };
  validateExportDocument(validDoc);

  // Test docx generation
  const docxBuffer = await createExportDocx(validDoc);
  assert.ok(docxBuffer instanceof Buffer);
  assert.ok(docxBuffer.length > 0);
  const JSZip = require('jszip');
  const grouped = await createExportDocx({title:'Grouped source',paragraphs:[{keepWithNext:true,runs:[{text:'Question'}]},{runs:[{text:'Choices'}]}]});
  const zip = await JSZip.loadAsync(grouped);
  const documentXml = await zip.file('word/document.xml').async('text');
  assert.equal((documentXml.match(/<w:keepNext\/>/g)||[]).length,1);
  assert.equal((documentXml.match(/<w:keepLines\/>/g)||[]).length,2);

  const mediaFixture = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j5N8AAAAASUVORK5CYII=';
  const mediaDoc = await createExportDocx({
    title: 'Media roles after review',
    paragraphs: [{ runs: [
      { text: 'รูปโจทย์:' }, { image: mediaFixture, width: 20, height: 20 },
      { text: 'รูปโจทย์ร่วม:' }, { image: mediaFixture, width: 20, height: 20 },
      { text: 'รูปตัวเลือก ก' }, { image: mediaFixture, width: 20, height: 20 },
      { text: 'รูปคำอธิบาย:' }, { image: mediaFixture, width: 20, height: 20 },
    ] }],
  });
  const mediaZip = await JSZip.loadAsync(mediaDoc);
  assert.equal(Object.entries(mediaZip.files).filter(([name, entry]) => name.startsWith('word/media/') && !entry.dir).length, 4, 'Export must keep question/shared/choice/explanation images');

  // Invalid doc should throw
  assert.throws(() => validateExportDocument({ title: '', paragraphs: [] }));

  console.log('Google Auth & Export unit tests passed.');
})().catch(err => {
  console.error(err);
  process.exit(1);
});
