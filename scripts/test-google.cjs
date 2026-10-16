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
  // T-109 template: title line + title gap precede the content.
  assert.equal((documentXml.match(/<w:keepLines\/>/g)||[]).length,4);

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

  const originsDoc = await createExportDocx({title:'Three answer origins',paragraphs:['E6F4EA','FFF4CC','E3EFFA'].map(background=>({background,runs:[{text:'Answer'}]}))});
  const originsZip = await JSZip.loadAsync(originsDoc);
  const originsXml = await originsZip.file('word/document.xml').async('text');
  for (const color of ['E6F4EA','FFF4CC','E3EFFA']) assert.ok(originsXml.includes(`w:fill="${color}"`), `DOCX preserves ${color} answer background`);
  const tallZip = await JSZip.loadAsync(await createExportDocx({title:'Tall image ratio',paragraphs:[{runs:[{image:mediaFixture,width:100,height:2000}]}]}));
  const tallXml = await tallZip.file('word/document.xml').async('text');
  const extent = tallXml.match(/wp:extent cx="(\d+)" cy="(\d+)"/);
  assert.equal(Number(extent[2])/Number(extent[1]),20,'DOCX bounds preserve tall image aspect ratio');

  // T-109: master QuizFlow template layout (evidence/t109-master-template.docx) applied to a role-tagged snapshot.
  const { layoutExamDocument, exportStamp } = require('../lib/export-layout.ts');
  assert.equal(exportStamp(new Date('2026-10-13T09:07:00Z')), '691013-1607', 'Stamp uses Thai year and Bangkok time');
  const roleDoc = {
    title: 'บทที่ 7 เรื่อง การแยกสาร — QuizFlow',
    paragraphs: [
      { item: 1, role: 'question', keepWithNext: true, runs: [{ text: '1. ', bold: true, color: 'F2604D' }, { text: 'ข้อใดถูก', color: '0F172A' }] },
      { item: 1, role: 'questionImageLabel', runs: [{ text: 'รูปโจทย์:', bold: true, color: 'F2604D' }] },
      { item: 1, role: 'questionImage', runs: [{ image: mediaFixture, width: 600, height: 300 }] },
      { item: 1, role: 'choicesLabel', runs: [{ text: 'ตัวเลือก:', bold: true, color: '006D77' }] },
      { item: 1, role: 'choice', runs: [{ text: 'ก. ', bold: true, color: '006D77' }, { text: 'สาร A', color: '1E293B' }] },
      { item: 1, role: 'choice', background: 'FFF4CC', runs: [{ text: 'ข. ', bold: true, color: '006D77' }, { text: 'สาร B', color: '451A03' }, { text: ' *', bold: true, color: 'F2604D' }] },
      { item: 1, role: 'choiceImage', runs: [{ image: mediaFixture, width: 500, height: 250 }] },
      { item: 2, role: 'sharedHeader', runs: [{ text: 'โจทย์ร่วม: ', bold: true, color: '006D77' }] },
      { item: 2, role: 'sharedText', background: '006D77', runs: [{ text: 'ใช้ข้อมูลในตาราง\nทำการทดลองที่อุณหภูมิห้อง', color: '0F172A' }] },
      { item: 2, role: 'sharedImageLabel', runs: [{ text: 'รูปโจทย์ร่วม:', bold: true, color: 'F2604D' }] },
      { item: 2, role: 'sharedImage', runs: [{ image: mediaFixture, width: 900, height: 180 }] },
      { item: 2, role: 'question', runs: [{ text: '2. ', bold: true, color: 'F2604D' }, { text: 'สารใด', bold: true, color: '0F172A' }] },
      { item: 2, role: 'choicesLabel', runs: [{ text: 'ตัวเลือก:', bold: true, color: '006D77' }] },
      { item: 2, role: 'choice', runs: [{ text: '1. ', bold: true, color: '006D77' }, { text: '1/4', color: '1E293B' }] },
      { item: 2, role: 'explanation', runs: [{ text: 'คำอธิบาย: ', bold: true, color: '006D77' }, { text: 'เหตุผล', color: '334155' }] },
      { item: 2, role: 'sharedEnd', runs: [{ text: 'จบโจทย์ร่วม', bold: true, color: '006D77' }] },
    ],
  };
  const laid = layoutExamDocument(roleDoc, new Date('2026-10-13T09:07:00Z'));
  const plain = paragraph => paragraph.runs.map(run => run.image ? '[IMG]' : run.text).join('');
  assert.deepEqual(laid.paragraphs.map(plain), [
    'บทที่ 7 เรื่อง การแยกสาร', '',
    '1. ข้อใดถูก', 'รูปคำถาม:', '[IMG]', '', 'ตัวเลือก:', 'สาร A', 'สาร B[IMG]  *',
    '', 'โจทย์ร่วม ใช้ข้อมูลในตาราง', 'ทำการทดลองที่อุณหภูมิห้อง', 'รูปโจทย์ร่วม:', '[IMG]',
    '', '2. สารใด', '', 'ตัวเลือก:', '1/4', 'คำอธิบาย: เหตุผล', 'จบโจทย์ร่วม', '◆',
  ], 'Block order, spacers, labels and keyless choices follow the master template');
  const byText = text => laid.paragraphs.find(paragraph => plain(paragraph) === text);
  assert.deepEqual(laid.footer, { code: 'V-691013', name: 'บทที่ 7 เรื่อง การแยกสาร' }, 'Footer carries the date code and file name');
  assert.deepEqual(laid.paragraphs[0].runs[0], { text: 'บทที่ 7 เรื่อง การแยกสาร', bold: true, color: '000000', size: 34 }, 'Title uses the template 17 pt bold black line');
  const q1 = byText('1. ข้อใดถูก');
  assert.deepEqual([q1.runs[0].color, q1.runs[0].bold, q1.runs[1].color, q1.before, q1.after], ['F25F4D', true, '102A2E', 160, 80], 'Question number coral, text ink, 160/80 spacing');
  assert.ok(byText('2. สารใด').runs[1].bold, 'User bold emphasis inside a question survives');
  const label = byText('ตัวเลือก:');
  assert.deepEqual([label.indentLeft, label.before, label.after, label.runs[0].color], [400, 40, 60, '006D77']);
  const answer = byText('สาร B[IMG]  *');
  assert.deepEqual([answer.indentLeft, answer.hanging, answer.before, answer.after], [660, 260, 0, 60], 'Choice indent and hanging follow the template');
  assert.ok(answer.runs.every(run => run.shade === 'B8F2E6'), 'Answer runs carry Pearl Aqua text shading regardless of origin');
  assert.deepEqual([answer.runs[2].color, Boolean(answer.runs[2].bold)], ['F25F4D', false], 'Star is coral, not bold');
  assert.equal(answer.runs[1].width, 353, 'Choice image sits inline at 353 px');
  assert.ok(byText('สาร A').runs.every(run => !run.shade), 'Non-answer choices are unshaded');
  assert.ok(laid.paragraphs.every(paragraph => !paragraph.background), 'Template roles never shade whole paragraphs');
  assert.equal(laid.paragraphs.filter(paragraph => paragraph.runs.length === 1 && paragraph.runs[0].image).map(paragraph => paragraph.runs[0].width).join(','), '600,661', 'Question images keep size up to 661 px; wider shared image fits 661 px');
  assert.deepEqual([byText('ทำการทดลองที่อุณหภูมิห้อง').runs[0].italic, byText('ทำการทดลองที่อุณหภูมิห้อง').indentLeft], [true, 360], 'Shared passage italic and indented');
  assert.deepEqual(byText('โจทย์ร่วม ใช้ข้อมูลในตาราง').runs.map(run => run.color), ['006D77', '102A2E']);
  assert.deepEqual(byText('คำอธิบาย: เหตุผล').runs.map(run => run.color), ['006D77', '102A2E']);
  assert.equal(byText('◆').align, 'center', 'Centred diamond follows the shared-context end');
  assert.equal(byText('สาร A').keepWithNext, true);
  assert.equal(answer.keepWithNext, false, 'The last choice ends the keep-together chain');
  const laidZip = await JSZip.loadAsync(await createExportDocx(roleDoc, new Date('2026-10-13T09:07:00Z')));
  const laidXml = await laidZip.file('word/document.xml').async('text');
  assert.match(laidXml, /<w:footerReference w:type="default" r:id="footer1"\/><w:pgSz w:w="11909" w:h="16834" w:orient="portrait"\/><w:pgMar w:top="283" w:right="429" w:bottom="694" w:left="850"/, 'A4 page and template margins with footer');
  assert.ok(laidXml.includes('<w:ind w:left="660" w:hanging="260"/>'), 'Choice hanging indent written');
  assert.ok(laidXml.includes('<w:shd w:val="clear" w:color="auto" w:fill="B8F2E6"/></w:rPr>'), 'Run-level Pearl Aqua answer shading written');
  assert.ok(!/>ก\. |>ข\. |>1\. 1\/4/.test(laidXml), 'Choice keys are not exported');
  const footerXml = await laidZip.file('word/footer1.xml').async('text');
  assert.ok(footerXml.includes('V-691013') && footerXml.includes('บทที่ 7 เรื่อง การแยกสาร') && footerXml.includes(' PAGE ') && footerXml.includes(' NUMPAGES '), 'Footer has code, name and page fields');
  assert.match(await laidZip.file('[Content_Types].xml').async('text'), /footer1\.xml" ContentType="application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.footer\+xml"/);
  assert.match(await laidZip.file('word/_rels/document.xml.rels').async('text'), /Id="footer1"[^>]*Target="footer1\.xml"/);
  assert.throws(() => validateExportDocument({ title: 'x', paragraphs: [{ role: 'unknown', runs: [] }] }), 'Unknown roles are rejected');

  // Invalid doc should throw
  assert.throws(() => validateExportDocument({ title: '', paragraphs: [] }));

  console.log('Google Auth & Export unit tests passed.');
})().catch(err => {
  console.error(err);
  process.exit(1);
});
