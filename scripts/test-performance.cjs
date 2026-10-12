const fs = require('node:fs');
const assert = require('node:assert/strict');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true}
}).outputText, filename);
const {renderPdfPages} = require('../lib/pdf-renderer.ts');
const {parseUploadedFile, revokeParsedFileUrls} = require('../lib/file-parser.ts');
const pdfPath = require.resolve('pdfjs-dist');
const oldPdf = require.cache[pdfPath];
const oldDocument = global.document;
const oldCreate = URL.createObjectURL;
const oldRevoke = URL.revokeObjectURL;
const file = new File(['PDF fixture'], 'fixture.pdf');
(async () => {
  let cleanups = 0, destroyed = 0, rendered = 0, cancelled = 0;
  let canvases = [];
  let controller;
  const setup = ({pages = 2, abortRender = false} = {}) => {
    cleanups = destroyed = rendered = cancelled = 0; canvases = [];
    global.document = {createElement: () => {const canvas = {width: 0, height: 0, getContext: () => ({}), toDataURL: () => 'data:image/png;base64,AA=='}; canvases.push(canvas); return canvas;}};
    require.cache[pdfPath] = {exports: {GlobalWorkerOptions: {}, version: 'fixture', getDocument: () => ({destroy: async () => {destroyed++;}, promise: Promise.resolve({numPages: pages, getPage: async () => ({
      cleanup: () => {cleanups++;}, getViewport: () => ({width: 100, height: 100}), getTextContent: async () => ({items: []}),
      render: () => {rendered++; let reject; const promise = abortRender ? new Promise((_, fail) => {reject = fail; queueMicrotask(() => controller.abort());}) : Promise.resolve(); return {promise, cancel: () => {cancelled++; reject?.(new Error('render cancelled'));}};}
    })})})}};
  };
  setup();
  await assert.rejects(() => renderPdfPages(file, Infinity, {maxDecodedPixels: 15000}), /พิกเซล/);
  assert.equal(rendered, 1); assert.equal(cleanups, 2); assert.equal(destroyed, 1);
  assert.ok(canvases.every(canvas => canvas.width === 0 && canvas.height === 0));
  setup();
  assert.equal((await renderPdfPages(file, Infinity, {maxDecodedPixels: 20000})).pageImages.length, 2);
  assert.equal(cleanups, 2); assert.equal(destroyed, 1);
  assert.ok(canvases.every(canvas => canvas.width === 0 && canvas.height === 0));
  setup();
  await assert.rejects(() => renderPdfPages(file, 1), /จำนวนหน้า/);
  assert.equal(rendered, 0); assert.equal(destroyed, 1);
  controller = new AbortController(); controller.abort();
  await assert.rejects(() => parseUploadedFile(file, {signal: controller.signal}), {name: 'AbortError'});
  controller = new AbortController(); setup({abortRender: true});
  await assert.rejects(() => renderPdfPages(file, Infinity, {signal: controller.signal}), {name: 'AbortError'});
  assert.equal(cancelled, 1); assert.equal(cleanups, 1); assert.equal(destroyed, 1);
  assert.ok(canvases.every(canvas => canvas.width === 0 && canvas.height === 0));
  controller = new AbortController();
  let loadingDestroyed = 0;
  require.cache[pdfPath] = {exports: {GlobalWorkerOptions: {}, version: 'fixture', getDocument: () => {
    let reject;
    const promise = new Promise((_, fail) => {reject = fail; queueMicrotask(() => controller.abort());});
    return {promise, destroy: async () => {loadingDestroyed++; reject(new Error('loading cancelled'));}};
  }}};
  await assert.rejects(() => renderPdfPages(file, Infinity, {signal: controller.signal}), {name: 'AbortError'});
  assert.equal(loadingDestroyed, 1);
  const revoked = [];
  URL.createObjectURL = () => 'blob:fixture'; URL.revokeObjectURL = url => revoked.push(url);
  setup();
  await assert.rejects(() => parseUploadedFile(file, {maxDecodedPixels: 1}), /พิกเซล/);
  assert.deepEqual(revoked, ['blob:fixture']);
  revokeParsedFileUrls({fileUrl: 'blob:discarded'});
  revokeParsedFileUrls({fileUrl: 'https://example.com/source.pdf'});
  revokeParsedFileUrls({fileUrl: 'data:image/png;base64,AA=='});
  assert.deepEqual(revoked, ['blob:fixture', 'blob:discarded']);
  controller = new AbortController();
  const delayedImage = {name: 'image.png', size: 1, arrayBuffer: async () => {controller.abort(); return new Uint8Array([1]).buffer;}};
  await assert.rejects(() => parseUploadedFile(delayedImage, {signal: controller.signal}), {name: 'AbortError'});
  assert.deepEqual(revoked, ['blob:fixture', 'blob:discarded']);
  console.log('Import resource assertions passed: pixel budget, full rejection, page/canvas/worker cleanup, render cancellation, URL disposal.');
})().catch(error => {console.error(error); process.exitCode = 1;}).finally(() => {
  global.document = oldDocument; URL.createObjectURL = oldCreate; URL.revokeObjectURL = oldRevoke;
  if (oldPdf) require.cache[pdfPath] = oldPdf; else delete require.cache[pdfPath];
});
