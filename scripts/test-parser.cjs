const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const ts = require('typescript');
const Module = require('node:module');
require.extensions['.ts'] = (module, filename) => {
  module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true }
  }).outputText, filename);
};
const { parseExamText, reconcileAnswerKey, parseSharedContextHeader, stripCapturedTableText } = require('../lib/exam-parser.ts');
const { normalizeOcrText } = require('../lib/ocr-service.ts');
assert.equal(parseExamText(normalizeOcrText('## 1\\. escaped question\nก\\. first\nข\\. second')).length, 1);
assert.deepEqual(parseExamText('unstructured source', [], 'การแยกสาร.docx'), []);
const single = parseExamText('1. Actual source\nก. first\nข. second');
assert.equal(single.length, 1);
assert.equal(single[0].questionText, 'Actual source');
assert.equal(single[0].reconciliationProvenance, 'unresolved');
assert.equal(single[0].reconciledAnswerKey, undefined);
assert.equal(single[0].explanationText, '');
assert.ok(single[0].choices.every(choice => !choice.isCorrect && choice.shadingType === 'none'));
const multi = parseExamText('1. first question\nก. *one\nข. two\nคำอธิบาย: ตอบ ข. evidence\n2. second question\nA. one\nB. two*\nเฉลย: B');
assert.equal(multi.length, 2);
assert.equal(multi[0].reconciledAnswerKey, 'ข');
assert.equal(multi[0].choices[1].shadingType, 'source_provided');
assert.equal(multi[1].reconciledAnswerKey, 'ข');
const nested = parseExamText('1. first question\nก. yes*\nข. no\nคำอธิบาย: ตอบ ก.\n1. first reason\n2. second reason\n2. next question\nก. first\nข. second*');
assert.equal(nested.length, 2);
assert.equal(nested[0].explanationText, 'ตอบ ก. 1. first reason 2. second reason');
assert.equal(nested[1].questionText, 'next question');
const nestedNumeric = parseExamText('1. first question\nก. yes*\nข. no\nคำอธิบาย: why\n1. reason\n2. next question\n1. one\n2. two*\n3. three\n4. four');
assert.equal(nestedNumeric.length, 2);
assert.equal(nestedNumeric[0].explanationText, 'why 1. reason');
assert.equal(nestedNumeric[1].choices.length, 4);
assert.equal(parseExamText('1. image source\nก. first', [{id: 'image', dataUrl: 'data:image/png;base64,AA=='}])[0].imageStatus, 'DIRTY');
const numeric = parseExamText('1. Numeric question\n1. one\n2. two*\n3. three\n4. four\n2. Next question\nก. first\nข. second');
assert.equal(numeric.length, 2);
assert.equal(numeric[0].choices.length, 4);
assert.equal(numeric[0].reconciledAnswerKey, 'ข');
const sets = parseExamText('ชุดที่ 1\n1. first\nก. yes*\nชุดที่ 2\n1. restarted\nก. yes*');
assert.deepEqual(sets.map(item => item.questionNumber), [1, 1]);
assert.deepEqual(sets.map(item => item.id), [1, 2]);
const continuation = parseExamText('1. question\ncontinued\nก. choice\ncontinued choice\nข. other\nเฉลย: ค');
assert.equal(continuation[0].questionText, 'question continued');
assert.equal(continuation[0].choices[0].text, 'choice continued choice');
assert.equal(continuation[0].reconciliationProvenance, 'unresolved');
assert.equal(reconcileAnswerKey(null, 'answer absent').finalKey, undefined);
assert.equal(reconcileAnswerKey(null, 'ตอบ กำหนด').finalKey, undefined);
assert.equal(parseExamText('1. source\nก. a*b\nข. other')[0].choices[0].text, 'a*b');
assert.equal(parseExamText('1. source\nก. a*\nข. b*')[0].reconciliationProvenance, 'unresolved');
// T-027 Inline Choices (Horizontal / multi-choice per line)
const inlineChoices = parseExamText('1. สารผสมในข้อใดมีส่วนประกอบเป็นของแข็งและของเหลว\nก. น้ำอบไทย น้ำเชื่อม ข. น้ำคลอง น้ำเกลือ\nค. น้ำกะทิ น้ำนม ง. น้ำส้มสายชู น้ำโซดา*');
assert.equal(inlineChoices.length, 1);
assert.equal(inlineChoices[0].choices.length, 4);
assert.equal(inlineChoices[0].choices[0].key, 'ก');
assert.equal(inlineChoices[0].choices[0].text, 'น้ำอบไทย น้ำเชื่อม');
assert.equal(inlineChoices[0].choices[1].key, 'ข');
assert.equal(inlineChoices[0].choices[1].text, 'น้ำคลอง น้ำเกลือ');
assert.equal(inlineChoices[0].choices[2].key, 'ค');
assert.equal(inlineChoices[0].choices[2].text, 'น้ำกะทิ น้ำนม');
assert.equal(inlineChoices[0].choices[3].key, 'ง');
assert.equal(inlineChoices[0].choices[3].text, 'น้ำส้มสายชู น้ำโซดา');
assert.equal(inlineChoices[0].reconciledAnswerKey, 'ง');
// T-070 Inline numeric choices (1..2, 3..4 on same line)
const inlineNumeric = parseExamText('1. โจทย์ทดสอบตัวเลือกเลข\n1. ตัวเลือกหนึ่ง 2. ตัวเลือกสอง\n3. ตัวเลือกสาม 4. ตัวเลือกสี่');
assert.equal(inlineNumeric.length, 1);
assert.equal(inlineNumeric[0].choices.length, 4);
assert.equal(inlineNumeric[0].choices[0].text, 'ตัวเลือกหนึ่ง');
assert.equal(inlineNumeric[0].choices[1].text, 'ตัวเลือกสอง');
assert.equal(inlineNumeric[0].choices[2].text, 'ตัวเลือกสาม');
assert.equal(inlineNumeric[0].choices[3].text, 'ตัวเลือกสี่');
// T-027 Neutral Fallback (No fabricated chromatography questions)
const { generateFallbackExamItems } = require('../lib/exam-fallback.ts');
const fallbackItems = generateFallbackExamItems({ fileName: 'ชุดที่ 2 การแยกสาร.pdf', rawContent: '', extractedImages: [], fileSize: 100, fileType: 'application/pdf', extension: '.pdf', isClean: true, statusMessage: '' });
assert.ok(fallbackItems.length >= 10);
assert.ok(!fallbackItems[0].questionText.includes('โครมาโทกราฟี'));
assert.ok(fallbackItems[0].questionText.includes('ข้อที่ 1'));
assert.equal(fallbackItems[0].imageUrl, undefined);

// T-029 Sub-enumerations in question stem (e.g. Question 3 with statements 1..6)
const subStem = parseExamText('3. ถ้าต้องการแยกเอาเกลือออกจากน้ำทะเลควรใช้วิธีใด\n1. การกรอง 2. การตกผลึก 3. การระเหิด 4. การสกัดด้วยไอน้ำ\n5. การใช้แม่เหล็กดูด 6. การระเหยจนแห้ง\nก. หมายเลข 1 ข. หมายเลข 4 ค. หมายเลข 5 ง. หมายเลข 6');
assert.equal(subStem.length, 1);
assert.equal(subStem[0].questionNumber, 3);
assert.ok(subStem[0].questionText.includes('การกรอง'));
assert.equal(subStem[0].choices.length, 4);
assert.equal(subStem[0].choices[0].key, 'ก');
assert.equal(subStem[0].choices[0].text, 'หมายเลข 1');

// T-030 Markdown OCR text parsing (Typhoon OCR output)
const mdBold = parseExamText('**1.** ข้อใดถูกต้อง\n**ก.** ช้อย 1\n**ข.** ช้อย 2\n**ค.** ช้อย 3\n**ง.** ช้อย 4');
// T-031 Structured OCR contract: page provenance and numeric stem items must survive.
const structured = parseExamText([
  '[PAGE 1]',
  '[QUESTION 1]',
  'สารในคู่ใดมีลักษณะแตกต่างกันมากที่สุด',
  '[CHOICE ก] น้ำและสารละลายน้ำเกลือ',
  '[CHOICE ข] กรดน้ำส้มและสารละลายน้ำส้มสายชู',
  '[CHOICE ค] น้ำและสารละลายกรดคาร์บอนิก',
  '[CHOICE ง] เอทานอลและสารละลายเอทานอล',
  '[QUESTION 3]',
  'ถ้าต้องการแยกเกลือออกจากน้ำทะเลควรใช้วิธีใด',
  '[STEM_ITEM 1] การกรอง',
  '[STEM_ITEM 2] การตกผลึก',
  '[STEM_ITEM 3] การระเหิด',
  '[STEM_ITEM 4] การสกัดด้วยไอน้ำ',
  '[STEM_ITEM 5] การใช้แม่เหล็กดูด',
  '[STEM_ITEM 6] การระเหยจนแห้ง',
  '[CHOICE ก] หมายเลข 1',
  '[CHOICE ข] หมายเลข 4',
  '[CHOICE ค] หมายเลข 5',
  '[CHOICE ง] หมายเลข 6',
].join('\n'));
assert.deepEqual(structured.map(item => item.questionNumber), [1, 3]);
assert.deepEqual(structured.map(item => item.sourcePage), [1, 1]);
assert.equal(structured[1].choices.length, 4);
assert.ok(structured[1].questionText.includes('การกรอง'));
assert.ok(structured[1].questionText.includes('การระเหยจนแห้ง'));
assert.ok(!structured.some(item => item.questionNumber === 2));
assert.equal(mdBold.length, 1);
assert.equal(mdBold[0].choices.length, 4);

const mdList = parseExamText('### 2. ข้อใดถูกต้อง\n* ก. ช้อย 1\n* ข. ช้อย 2\n* ค. ช้อย 3\n* ง. ช้อย 4');
assert.equal(mdList.length, 1);
assert.equal(mdList[0].choices.length, 4);

const multiSubEnum = parseExamText('3. จงพิจารณา\n1. การกรอง\n2. การกลั่น\n3. การตกผลึก\n4. การระเหิด\n5. การใช้แม่เหล็ก\n6. การสกัด\nก. 1 และ 2\nข. 3 และ 4\nค. 5 และ 6\nง. ทั้งหมด\n4. ข้อถัดไป\nก. แรก\nข. สอง');
assert.equal(multiSubEnum.length, 2);
assert.equal(multiSubEnum[0].questionNumber, 3);
assert.equal(multiSubEnum[0].choices.length, 4);
assert.ok(multiSubEnum[0].questionText.includes('6. การสกัด'));
assert.equal(multiSubEnum[1].questionNumber, 4);
assert.equal(multiSubEnum[1].choices.length, 2);
(async () => {
  const JSZip = require('jszip');
  const { parseDocxFile, parseUploadedFile } = require('../lib/file-parser.ts');
  const zip = new JSZip();
  zip.file('word/document.xml', '<w:document><w:p><w:r><w:t>1. Q &amp; </w:t></w:r><w:r><w:t>text</w:t></w:r></w:p><w:p><w:r><w:t>ก. choice</w:t></w:r></w:p></w:document>');
  const data = await zip.generateAsync({type: 'nodebuffer'});
  const parsed = await parseDocxFile({name: 'source.docx', size: data.length, type: '', arrayBuffer: async () => data});
  assert.equal(parsed.rawContent, '1. Q & text\nก. choice');
  assert.equal(parseExamText(parsed.rawContent)[0].choices.length, 1);
  const invalidZip = await new JSZip().generateAsync({type: 'nodebuffer'});
  await assert.rejects(() => parseDocxFile({name: 'invalid.docx', size: invalidZip.length, type: '', arrayBuffer: async () => invalidZip}), /word\/document.xml/);
  const image = await parseUploadedFile(new File([new Uint8Array([137, 80, 78, 71])], 'source.png', {type: 'image/png'}));
  assert.equal(image.isClean, false);
  assert.equal(image.extractedImages[0].dataUrl, 'data:image/png;base64,iVBORw==');
  assert.ok(image.statusMessage.includes('OCR ยังไม่พร้อมใช้งาน'));
  assert.deepEqual(parseExamText(image.rawContent), []);
  URL.revokeObjectURL(image.fileUrl);
  const pdfModulePath = require.resolve('pdfjs-dist');
  const originalPdfModule = require.cache[pdfModulePath];
  const originalDocument = global.document;
  const originalError = console.error;
  try {
    require.cache[pdfModulePath] = { exports: { GlobalWorkerOptions: {}, version: 'test', getDocument: () => ({destroy: async () => {}, promise: Promise.reject(new Error('corrupt PDF'))}) } };
    console.error = () => {};
    await assert.rejects(() => parseUploadedFile(new File(['invalid'], 'invalid.pdf')), /corrupt PDF/);
    console.error = originalError;
    global.document = { createElement: () => ({getContext: () => ({}), toDataURL: () => 'data:image/png;base64,AA=='}) };
    require.cache[pdfModulePath] = { exports: { GlobalWorkerOptions: {}, version: 'test', getDocument: () => ({destroy: async () => {}, promise: Promise.resolve({numPages: 16, getPage: async () => ({
      getTextContent: async () => ({items: [{str: '1. Q', transform: [1,0,0,1,0,100]}, {str: 'ก. A', transform: [1,0,0,1,0,80], hasEOL: true}]}),
      cleanup: () => {}, getViewport: () => ({width: 1, height: 1}), render: () => ({cancel: () => {}, promise: Promise.resolve()})
    })})}) } };
    const pdf = await parseUploadedFile(new File(['fixture'], 'fixture.pdf'));
    assert.equal(pdf.pageImages.length, 16);
    assert.ok(pdf.rawContent.includes('1. Q') && pdf.rawContent.includes('ก. A'));
    assert.equal(pdf.isClean, false);
    URL.revokeObjectURL(pdf.fileUrl);
  } finally {
    console.error = originalError;
    global.document = originalDocument;
    if (originalPdfModule) require.cache[pdfModulePath] = originalPdfModule;
    else delete require.cache[pdfModulePath];
  }
  console.log('Parser regression assertions passed (source fidelity, answers, boundaries, numeric choices, DOCX).');
})().catch(error => { console.error(error); process.exitCode = 1; });

const sparseMedia = parseExamText('1. หนึ่ง\nก. a\nข. b\n2. สอง\nก. c\nข. d', [{id:'question-2',dataUrl:'data:image/png;base64,AA=='}]);
assert.equal(sparseMedia[0].imageUrl, undefined);
assert.equal(sparseMedia[1].imageUrl, 'data:image/png;base64,AA==');
const inlineMediaCase = parseExamText('1. จากรูป\n![รูปโจทย์](data:image/png;base64,AA==)\nก. a\nข. b');
assert.equal(inlineMediaCase[0].imageUrl, 'data:image/png;base64,AA==');
assert.equal(inlineMediaCase[0].questionText, 'จากรูป');
console.log('Explicit inline and sparse question-owned media regression passed.');
const pageBoundaries = parseExamText('[PAGE 1]\n1. หน้าแรก\nก. a\nข. b\n[PAGE 2]\n2. หน้าสอง\nก. c\nข. d');
assert.deepEqual(pageBoundaries.map(i=>i.sourcePage),[1,2]);
console.log('Question start-page ownership survives following page markers.');

// T-052 preserve layout and resolve explicit colon answer immediately.
const steps = parseExamText('5. การทำนาเกลือ\n1. ระบายน้ำ\n2. นาตาก\n3. นาปลง\nขั้นตอนใด\nก. การระเหย: ขั้นตอนที่ 1, 2; การตกผลึก: ขั้นตอนที่ 3\nข. สอง\nค. สาม\nง. สี่\nเฉลย: ง');
assert.equal(steps.length,1);
assert.equal(steps[0].questionText,'การทำนาเกลือ\n1. ระบายน้ำ\n2. นาตาก\n3. นาปลง\nขั้นตอนใด');
assert.equal(steps[0].reconciledAnswerKey,'ง');
assert.equal(steps[0].choices[3].shadingType,'source_provided');
assert.equal(reconcileAnswerKey('ก','เฉลย: ตอบ ข้อ ข.').finalKey,'ข');
assert.equal(reconcileAnswerKey(null,'เฉลย: คำตอบไม่มี').finalKey,undefined);
console.log('T-052 enumerated layout and colon source-answer regressions passed.');

assert.equal(reconcileAnswerKey('ก','เฉลย: ข. ตอบ ง.').finalKey,undefined);
// T-066 QuizFlow blueprint parity: explicit answer labels and Thai OCR spacing
// are normalized before structural parsing; unknown corruption is preserved.
const thaiSpacing = parseExamText('1. เป ็ น โจทย์\nก. หนึ่ง\nข. สอง\nค. สาม\nง. สี่\nคำตอบ: ข');
assert.equal(thaiSpacing[0].questionText, 'เป็น โจทย์');
assert.equal(thaiSpacing[0].reconciledAnswerKey, 'ข');
const englishAnswer = parseExamText('1. คำถาม\nก. หนึ่ง\nข. สอง\nค. สาม\nง. สี่\nAnswer: ค');
assert.equal(englishAnswer[0].reconciledAnswerKey, 'ค');
assert.equal(parseExamText('1. ก๋วยเต�ยว\nก. หนึ่ง\nข. สอง')[0].questionText, 'ก๋วยเต�ยว');
const t066Fixtures = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'evidence', 't066-synthetic-fixtures.json'), 'utf8'));
assert.equal(t066Fixtures.external_golden_corpus_available, false);
for (const fixture of t066Fixtures.cases) {
  const [item] = parseExamText(fixture.input);
  assert.equal(item.questionText, fixture.expected_question, fixture.id);
  assert.equal(item.reconciledAnswerKey ?? null, fixture.expected_answer, fixture.id);
}
console.log('T-066 synthetic fixture regressions passed (external QuizFlow corpus unavailable).');

// T-069 long scanned exam contract: 80 numbered questions over 13 pages,
// alternating letter/numeric choices and one page-owned figure marker.
const longExam = [];
for (let page = 1; page <= 13; page++) {
  longExam.push(`[PAGE ${page}]`);
  const first = (page - 1) * 6 + 1;
  const last = page === 13 ? 80 : first + 5;
  for (let q = first; q <= last; q++) {
    longExam.push(`${q}. โจทย์ข้อ ${q}${q === 20 ? ' [รูปต้องตรวจสอบ]' : ''}`);
    if (q % 5 === 0) {
      longExam.push('1. ตัวเลือกหนึ่ง', '2. ตัวเลือกสอง', '3. ตัวเลือกสาม', '4. ตัวเลือกสี่');
    } else {
      longExam.push('ก. ตัวเลือกหนึ่ง', 'ข. ตัวเลือกสอง', 'ค. ตัวเลือกสาม', 'ง. ตัวเลือกสี่');
    }
  }
}
const longItems = parseExamText(longExam.join('\n'), [{id:'page-4',dataUrl:'data:image/png;base64,AA=='}]);
assert.equal(longItems.length, 80);
assert.deepEqual(longItems.map(item => item.questionNumber), Array.from({length:80}, (_, i) => i + 1));
assert.equal(longItems[19].sourcePage, 4);
assert.equal(longItems[19].imageUrl, 'data:image/png;base64,AA==');
assert.equal(longItems[19].choices.length, 4);
const alternatingNumeric = Array.from({length:80},(_,index)=>{
  const q=index+1;
  const choices = q % 2 === 0
    ? `1. ตัวเลือกหนึ่งของข้อ ${q}\n2. ตัวเลือกสองของข้อ ${q}\n3. ตัวเลือกสามของข้อ ${q}\n4. ตัวเลือกสี่ของข้อ ${q}`
    : `ก. ตัวเลือก ก ของข้อ ${q}\nข. ตัวเลือก ข ของข้อ ${q}\nค. ตัวเลือก ค ของข้อ ${q}\nง. ตัวเลือก ง ของข้อ ${q}`;
  return `${q}. โจทย์ทดสอบข้อ ${q}\n${choices}`;
}).join('\n\n');
const alternatingItems = parseExamText(alternatingNumeric);
assert.equal(alternatingItems.length, 80);
assert.deepEqual(alternatingItems.map(item => item.questionNumber), Array.from({length:80}, (_, i) => i + 1));
const allNumeric = Array.from({length:80},(_,index)=>{
  const q=index+1;
  return `${q}. โจทย์ตัวเลขข้อ ${q}\n1. ตัวเลือกหนึ่ง\n2. ตัวเลือกสอง\n3. ตัวเลือกสาม\n4. ตัวเลือกสี่`;
}).join('\n\n');
const allNumericItems = parseExamText(allNumeric);
assert.equal(allNumericItems.length, 80);
assert.deepEqual(allNumericItems.map(item => item.questionNumber), Array.from({length:80}, (_, i) => i + 1));
console.log('T-069 long 80-question/page-owned-image regression passed.');

// T-074 detached enumeration punctuation and numeric choice preservation
const detachedPunctuationOcr = [
  '[PAGE 1]',
  '1 . ในการเลือกวิธีแยกสารผสมควรพิจารณาจากสิ่งใด',
  '1. สถานะของสาร 2. จุดเดือดและจุดหลอมเหลวของสาร',
  '3. ลักษณะเนื้อสาร 4. การละลายน้ำ',
  '2 . วิธีการใดใช้แยกสารเนื้อเดียวได้ทั้งหมด',
  '1. การกรองและการระเหย 2. โครมาโทกราฟีและการกลั่น',
  '3. การตกผลึกและการใช้แม่เหล็ก 4. การระเหิดและการสกัดด้วยตัวทำละลาย'
].join('\n');
const detachedItems = parseExamText(detachedPunctuationOcr);
assert.equal(detachedItems.length, 2, 'Detached punctuation 1 . must not collapse choices into separate questions');
assert.equal(detachedItems[0].questionNumber, 1);
assert.equal(detachedItems[0].questionText, 'ในการเลือกวิธีแยกสารผสมควรพิจารณาจากสิ่งใด');
assert.equal(detachedItems[0].choices.length, 4);
assert.equal(detachedItems[0].choices[0].key, 'ก');
assert.equal(detachedItems[0].choices[0].text, 'สถานะของสาร');
assert.equal(detachedItems[1].questionNumber, 2);
assert.equal(detachedItems[1].questionText, 'วิธีการใดใช้แยกสารเนื้อเดียวได้ทั้งหมด');
assert.equal(detachedItems[1].choices.length, 4);
console.log('T-074 detached punctuation and numeric choice preservation passed.');

// T-075 Shared Context (โจทย์ร่วม) Parsing & Scoping Regressions
assert.deepEqual(parseSharedContextHeader('โจทย์ร่วม ใช้ข้อมูลในตารางต่อไปนี้ตอบคำถามข้อ 17 - 18'), {
  start: 17,
  end: 18,
  description: 'ใช้ข้อมูลในตารางต่อไปนี้ตอบคำถามข้อ 17 - 18',
});
assert.deepEqual(parseSharedContextHeader('ใช้รูปต่อไปนี้ตอบคำถามข้อ 28 - 29'), {
  start: 28,
  end: 29,
  description: 'ใช้รูปต่อไปนี้ตอบคำถามข้อ 28 - 29',
});
assert.deepEqual(parseSharedContextHeader('ข้อ 17-18 ใช้ข้อมูลในตารางต่อไปนี้ตอบคำถาม'), {
  start: 17,
  end: 18,
  description: 'ข้อ 17-18 ใช้ข้อมูลในตารางต่อไปนี้ตอบคำถาม',
});
assert.equal(parseSharedContextHeader('17. จากการทดลอง สารใดมีสภาพการละลายได้น้อยที่สุด'), null);

const sharedContextSample = [
  'โจทย์ร่วม ใช้ข้อมูลในตารางต่อไปนี้ตอบคำถามข้อ 17 - 18',
  'ทำการทดลองที่อุณหภูมิห้อง โดยนำของแข็ง A, B และ C จำนวน 5 กรัม ใส่ในบีกเกอร์แต่ละใบ',
  'รูปโจทย์ร่วม:',
  '![ตาราง](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=)',
  '17. จากการทดลอง สารใดมีสภาพการละลายได้น้อยที่สุด',
  'ตัวเลือก:',
  'ก. สาร A',
  'ข. สาร B *',
  'ค. สาร C',
  'ง. ทุกสารเท่ากัน',
  '18. ถ้าให้ความร้อนแก่สารทั้ง 3 ชนิด แล้วทิ้งไว้ให้เย็นลงอย่างรวดเร็ว สารใดน่าจะตกผลึกเร็วที่สุด',
  'ตัวเลือก:',
  'ก. สาร A',
  'ข. สาร B *',
  'ค. สาร C',
  'ง. ไม่มีสารใดตกผลึก',
  'จบโจทย์ร่วม',
  '19. สารละลายอิ่มตัวของเกลือแกงในน้ำ 200 กรัม',
  'ตัวเลือก:',
  'ก. 37.3 กรัม',
  'ข. 39.8 กรัม',
  'ค. 74.6 กรัม *',
  'ง. 79.6 กรัม',
].join('\n');

const parsedSharedItems = parseExamText(sharedContextSample);
assert.equal(parsedSharedItems.length, 3, 'Must parse exactly 3 questions');
// Question 17 assertions
assert.equal(parsedSharedItems[0].questionNumber, 17);
assert.equal(parsedSharedItems[0].isSharedContextStart, true);
assert.equal(parsedSharedItems[0].isSharedContextEnd, false);
assert.deepEqual(parsedSharedItems[0].sharedContextRange, { start: 17, end: 18 });
assert.ok(parsedSharedItems[0].sharedContextText.includes('ใช้ข้อมูลในตารางต่อไปนี้ตอบคำถามข้อ 17 - 18'));
assert.ok(parsedSharedItems[0].sharedContextText.includes('ทำการทดลองที่อุณหภูมิห้อง'));
assert.ok(parsedSharedItems[0].sharedContextImageUrl.startsWith('data:image/png;base64,'));
assert.equal(parsedSharedItems[0].choices.length, 4);
assert.equal(parsedSharedItems[0].reconciledAnswerKey, 'ข');

// Question 18 assertions
assert.equal(parsedSharedItems[1].questionNumber, 18);
assert.equal(parsedSharedItems[1].isSharedContextStart, false);
assert.equal(parsedSharedItems[1].isSharedContextEnd, true);
assert.deepEqual(parsedSharedItems[1].sharedContextRange, { start: 17, end: 18 });
assert.equal(parsedSharedItems[1].choices.length, 4);

// Question 19 assertions (Outside shared context)
assert.equal(parsedSharedItems[2].questionNumber, 19);
assert.equal(parsedSharedItems[2].isSharedContextStart, false);
assert.equal(parsedSharedItems[2].isSharedContextEnd, false);
assert.equal(parsedSharedItems[2].sharedContextRange, undefined);
assert.equal(parsedSharedItems[2].sharedContextText, undefined);

console.log('T-075 shared context parsing and bounding regressions passed.');

// T-080: Captured text deduplication assertions
const duplicatedTableRaw = [
  'ใช้ข้อมูลต่อไปนี้ตอบคำถามข้อ 19-21',
  'ตารางแสดงความสามารถในการละลายของสารบางชนิด',
  'ปริมาณ สารที่ละลายได้ ig) ในน้ำ 100 g ที่อุณหภูมิ',
  'สาร สูตร',
  '20°C 60°C 100°C',
  'เกลือแกง NaCl 36.0 37.3 39.8',
  'จุนสี CuSO4 77.0 110.0 246.0'
].join('\n');

const cleanedTableText = stripCapturedTableText(duplicatedTableRaw);
assert.equal(cleanedTableText, 'ใช้ข้อมูลต่อไปนี้ตอบคำถามข้อ 19-21', 'Must strip captured table rows and header text when image is present');
assert.ok(!cleanedTableText.includes('ตารางแสดงความสามารถในการละลาย'));
assert.ok(!cleanedTableText.includes('เกลือแกง'));

// Narrative passage test: preserve story text before image
const narrativeWithTable = [
  'โจทย์ร่วม ใช้ข้อมูลในตารางต่อไปนี้ตอบคำถามข้อ 17 - 18',
  'ทำการทดลองที่อุณหภูมิห้อง โดยนำของแข็ง A, B และ C จำนวน 5 กรัม ใส่ในบีกเกอร์แต่ละใบ',
  'ตารางที่ 1 ผลการละลายของสาร',
  'หลอดที่ 1 20°C 30°C'
].join('\n');
const cleanedNarrative = stripCapturedTableText(narrativeWithTable);
assert.ok(cleanedNarrative.includes('ใช้ข้อมูลในตารางต่อไปนี้ตอบคำถามข้อ 17 - 18'));
assert.ok(cleanedNarrative.includes('ทำการทดลองที่อุณหภูมิห้อง'));
assert.ok(!cleanedNarrative.includes('ตารางที่ 1'));
assert.ok(!cleanedNarrative.includes('หลอดที่ 1'));

console.log('T-080 captured text deduplication regressions passed.');

// T-081: Table column headers and sample row lines stripping
const tableWithSampleRows = [
  'โจทย์ร่วม ใช้ข้อมูลในตารางต่อไปนี้ตอบคำถามข้อ 17 - 18',
  'ทำการทดลองที่อุณหภูมิห้อง โดยนำของแข็ง A, B และ C จำนวน 5 กรัม ใส่ในบีกเกอร์แต่ละใบเติมน้ำลงไปบีกเกอร์ละ 20 ลูกบาศก์เซนติเมตร ใช้แท่งแก้วคนให้ละลายได้ผลการทดลองเป็นดังนี้',
  'สาร',
  'ผลการทดลอง',
  'A ได้ของเหลวใส ไม่มีสี',
  'B ได้ของเหลวสีฟ้า ใส มีตะกอนสีฟ้านอนก้นอยู่เล็กน้อย',
  'C ได้ของเหลวสีเหลือง ใส'
].join('\n');
const cleanedSampleRows = stripCapturedTableText(tableWithSampleRows);
assert.ok(cleanedSampleRows.includes('ใช้ข้อมูลในตารางต่อไปนี้ตอบคำถามข้อ 17 - 18'));
assert.ok(cleanedSampleRows.includes('ทำการทดลองที่อุณหภูมิห้อง'));
assert.ok(!cleanedSampleRows.split('\n').some(l => l.trim() === 'ผลการทดลอง'));
assert.ok(!cleanedSampleRows.split('\n').some(l => l.trim() === 'สาร'));
assert.ok(!cleanedSampleRows.includes('A ได้ของเหลวใส'));
assert.ok(!cleanedSampleRows.includes('B ได้ของเหลวสีฟ้า'));
assert.ok(!cleanedSampleRows.includes('C ได้ของเหลวสีเหลือง'));
console.log('T-081 table row and header stripping regressions passed.');

