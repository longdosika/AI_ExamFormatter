const fs = require('node:fs');
const assert = require('node:assert/strict');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => {
  module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true }
  }).outputText, filename);
};
const { normalizeOcrText, getOcrProviderConfig } = require('../lib/ocr-service.ts');
const { parseExamText } = require('../lib/exam-parser.ts');

const providerMarkdown = [
  '# บทที่ 7 การแยกสาร',
  '',
  '1\\. ข้อความจาก provider',
  'ก\\. ตัวเลือกหนึ่ง',
  'ข\\. ตัวเลือกสอง',
  'ค\\. ตัวเลือกสาม',
  'ง\\. ตัวเลือกสี่',
  '',
  '2\\. ข้อถัดไป',
  'ก\\. หนึ่ง',
  'ข\\. สอง',
].join('\n');
const normalized = normalizeOcrText(providerMarkdown);
const items = parseExamText(normalized);
assert.deepEqual(items.map(item => item.questionNumber), [1, 2]);
assert.deepEqual(items.map(item => item.choices.length), [4, 2]);
assert.ok(!normalized.includes('\\.'));
const previous = {
  baseUrl: process.env.TYPHOON_OCR_BASE_URL,
  model: process.env.TYPHOON_OCR_MODEL,
  concurrency: process.env.TYPHOON_OCR_CONCURRENCY,
};
process.env.TYPHOON_OCR_BASE_URL = 'http://127.0.0.1:11434/v1';
process.env.TYPHOON_OCR_MODEL = 'scb10x/typhoon-ocr1.5-3b';
process.env.TYPHOON_OCR_CONCURRENCY = '9';
const localConfig = getOcrProviderConfig();
assert.equal(localConfig.baseUrl, 'http://127.0.0.1:11434/v1');
assert.deepEqual(localConfig.models, ['scb10x/typhoon-ocr1.5-3b']);
assert.equal(localConfig.maxConcurrency, 2);
for (const [key, value] of Object.entries(previous)) {
  const envKey = { baseUrl: 'TYPHOON_OCR_BASE_URL', model: 'TYPHOON_OCR_MODEL', concurrency: 'TYPHOON_OCR_CONCURRENCY' }[key];
  if (value === undefined) delete process.env[envKey]; else process.env[envKey] = value;
}
console.log('OCR contract assertions passed (escaped Markdown normalization and parser handoff).');

const { validateExamItems } = require('../lib/exam-validation.ts');
const complete = parseExamText('1. โจทย์\nA. หนึ่ง\nB. สอง\nC. สาม\nD. สี่');
assert.deepEqual(validateExamItems(complete), []);
assert.ok(validateExamItems(parseExamText('1. โจทย์\nข. สอง\nค. สาม\nง. สี่')).some(issue => issue.includes('ครบ')));
assert.ok(validateExamItems(parseExamText('1. โจทย์\nก. หนึ่ง\nข. สอง\nค. สาม\nค. ซ้ำ')).length);
assert.ok(validateExamItems(parseExamText('1. โจทย์\nก. หนึ่ง\nข. สอง\nค. สาม\nX. สี่')).length);
const table = parseExamText('1. ตาราง\n<table><tr><td>ก</td><td>หนึ่ง</td></tr><tr><td>ข</td><td>สอง</td></tr><tr><td>ค</td><td>สาม</td></tr><tr><td>ง</td><td>สี่</td></tr></table>');
assert.deepEqual(table[0].choices.map(choice => choice.text), ['หนึ่ง','สอง','สาม','สี่']);
assert.deepEqual(validateExamItems(table), []);
console.log('Review validation passed: complete/Latin/table choices accepted; missing, duplicate and ambiguous labels blocked.');
const dataTable = parseExamText('1. ข้อมูลสาร\n<table><tr><td>A</td><td>938</td></tr><tr><td>B</td><td>2040</td></tr><tr><td>C</td><td>361</td></tr></table>\nก. หนึ่ง\nข. สอง\nค. สาม\nง. สี่');
assert.equal(dataTable[0].choices.length, 4);
assert.ok(dataTable[0].questionText.includes('938'));

(async () => {
  const { processImageOcr } = require('../lib/ocr-service.ts');
  const originalFetch = global.fetch;
  const oldConcurrency = process.env.TYPHOON_OCR_CONCURRENCY;
  const oldBase = process.env.TYPHOON_OCR_BASE_URL;
  const oldModel = process.env.TYPHOON_OCR_MODEL;
  try {
    process.env.TYPHOON_OCR_CONCURRENCY = 'invalid';
    assert.equal(getOcrProviderConfig().maxConcurrency, 2);
    process.env.TYPHOON_OCR_CONCURRENCY = '1.5';
    assert.equal(getOcrProviderConfig().maxConcurrency, 1);
    process.env.TYPHOON_OCR_BASE_URL = 'http://127.0.0.1:11434/v1';
    process.env.TYPHOON_OCR_MODEL = 'fixture';
    global.fetch = async (_url, options) => {
      assert.ok(options.signal instanceof AbortSignal);
      const request = JSON.parse(options.body);
      assert.equal(request.messages[0].content[0].text, require('../lib/ocr-service.ts').TYPHOON_OCR_PROMPT);
      assert.equal(request.max_tokens,16384);
      return { ok: true, json: async () => ({ choices: [{ finish_reason: 'length', message: { content: '1. incomplete source' } }] }) };
    };
    const result = await processImageOcr('data:image/png;base64,AA==');
    assert.equal(result.success, false);
    assert.equal(result.text, '1. incomplete source');
    assert.ok(result.error);
    console.log('OCR reliability: invalid concurrency recovered, request timeout attached, truncated source retained and rejected.');
    delete process.env.TYPHOON_OCR_CONCURRENCY;
    assert.equal(getOcrProviderConfig().maxConcurrency, 1, 'local defaults to one shared slot');
    let active = 0;
    let peak = 0;
    const visited = [];
    global.fetch = async (_url, options) => {
      const image = JSON.parse(options.body).messages[0].content[1].image_url.url;
      visited.push(image);
      peak = Math.max(peak, ++active);
      await new Promise(resolve => setTimeout(resolve, 5));
      active--;
      return { ok: true, json: async () => ({ choices: [{ message: { content: image } }] }) };
    };
    const { processImagesOcr } = require('../lib/ocr-service.ts');
    const documents = await Promise.all([processImagesOcr(['A1','A2']), processImagesOcr(['B1','B2']), processImagesOcr(['C1','C2'])]);
    assert.equal(peak, 1, 'three documents share the local slot');
    assert.deepEqual(visited.map(value => value.split(',')[1]), ['A1','B1','C1','A2','B2','C2']);
    assert.deepEqual(documents.map(pages => pages.map(page => page.page)), [[1,2],[1,2],[1,2]]);
    process.env.TYPHOON_OCR_CONCURRENCY = '2';
    peak = 0;
    await Promise.all(Array.from({length:6}, (_, index) => processImageOcr(String(index))));
    assert.equal(peak, 2, 'explicit two slots shared across uploads');

    process.env.TYPHOON_OCR_CONCURRENCY = '1';
    let unblock;
    let started;
    const start = new Promise(resolve => { started = resolve; });
    const blocked = new Promise(resolve => { unblock = resolve; });
    let calls = 0;
    global.fetch = async () => {
      if (++calls === 1) { started(); await blocked; }
      return { ok: true, json: async () => ({ choices: [{ message: { content: 'source' } }] }) };
    };
    const first = processImageOcr('first');
    await start;
    const waiting = Array.from({length:32}, () => processImageOcr('queued'));
    const overflow = await processImageOcr('overflow');
    assert.equal(overflow.success, false);
    assert.ok(overflow.error.includes('คิว OCR เต็ม'));
    unblock();
    assert.ok((await Promise.all([first,...waiting])).every(page => page.success));
    assert.equal(calls, 33, 'overflow never calls the provider');

    calls = 0;
    global.fetch = async () => {
      calls++;
      if (calls <= 2) throw new Error('fixture provider failure');
      return { ok: true, json: async () => ({ choices: [{ message: { content: 'recovered' } }] }) };
    };
    const recovery = await Promise.all([processImageOcr('failure'),processImageOcr('next')]);
    assert.equal(recovery[0].success, false);
    assert.equal(recovery[1].text, 'recovered');
    console.log('Shared OCR scheduling passed: local default, three-user FIFO, two-slot limit, queue overflow and failure recovery.');
  } finally {
    global.fetch = originalFetch;
    for (const [key,value] of [['TYPHOON_OCR_CONCURRENCY',oldConcurrency],['TYPHOON_OCR_BASE_URL',oldBase],['TYPHOON_OCR_MODEL',oldModel]]) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
assert.equal(normalizeOcrText('☑ ก. one\n☐ ข. two\n☑ missing key'), 'ก. one\nข. two\n☑ missing key');
const labeledTable = parseExamText('1. ตาราง\n<table><tr><th>ข้อ</th><th>ค่า</th></tr><tr><td>ก</td><td>1</td></tr><tr><td>ข</td><td>2</td></tr><tr><td>ค</td><td>3</td></tr><tr><td>ง</td><td>4</td></tr></table>');
assert.equal(labeledTable[0].choices[0].text,'ค่า: 1');
assert.deepEqual(validateExamItems(labeledTable), []);
assert.ok(validateExamItems(parseExamText('1. จากรูป\nก. a\nข. b\nค. c\nง. d')).some(issue=>issue.includes('รูปต้นฉบับ')));
const { readReviewedDocument } = require('../lib/reviewed-document.ts');
const reviewedRecord={schemaVersion:1,sourceHash:'a'.repeat(64),sourcePageCount:1,questionCount:1,reviewMethod:'visual_source_comparison',reviewer:'fixture reviewer',text:'[PAGE 1]\n1. โจทย์\nก. a\nข. b\nค. c\nง. d'};
assert.ok(readReviewedDocument(reviewedRecord,'a'.repeat(64),1));
assert.equal(readReviewedDocument(reviewedRecord,'b'.repeat(64),1),null);
assert.equal(readReviewedDocument({...reviewedRecord,text:'[PAGE 1]\n1. ไม่ครบ'},'a'.repeat(64),1),null);
assert.equal(readReviewedDocument(reviewedRecord,'a'.repeat(64),2),null);
assert.equal(readReviewedDocument({...reviewedRecord,reviewer:''},'a'.repeat(64),1),null);
console.log('Reviewed corpus validates exact hash, page count, reviewer and complete structure.');
