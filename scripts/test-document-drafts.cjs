const assert = require("assert");

function createMockStorage() {
  const map = new Map();
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => {
      map.set(key, String(value));
    },
    removeItem: (key) => {
      map.delete(key);
    },
    _map: map,
  };
}

async function runTests() {
  console.log("Running Document Draft & OCR Cache Store tests...");

  // Dynamic import of TS module via ts-node or compiled require, or test logic via direct contract
  const ts = require("typescript");
  const fs = require("fs");
  const path = require("path");

  const code = fs.readFileSync(path.join(__dirname, "../lib/document-draft-store.ts"), "utf8");
  const transpiled = ts.transpileModule(code, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });

  const moduleExports = {};
  const evalFunc = new Function("exports", "require", "module", "__filename", "__dirname", transpiled.outputText);
  evalFunc(moduleExports, require, { exports: moduleExports }, __filename, __dirname);

  const {
    makeDocKey,
    validateDraftEntry,
    loadAllDrafts,
    findDraftByDoc,
    saveDocumentDraft,
    deleteDocumentDraft,
    clearAllDocumentDrafts,
  } = moduleExports;

  const storage = createMockStorage();
  const strictStorage = createMockStorage();
  const strictInput = { fileName: 'strict.pdf', fileBytes: 12, itemCount: 2, sourceItemCount: 80, ocrText: 'raw', formattedItems: [], editorHtml: '<strong>live edit</strong>' };
  saveDocumentDraft(strictStorage, strictInput, { requireFullSnapshot: true });
  assert.equal(loadAllDrafts(strictStorage)[0].editorHtml, strictInput.editorHtml);
  saveDocumentDraft(strictStorage, { ...strictInput, sourceItemCount: undefined });
  assert.equal(loadAllDrafts(strictStorage)[0].sourceItemCount, 80, 'Autosave preserves original count after explicit save');
  const beforeQuotaFailure = strictStorage.getItem('exam-formatter-document-drafts-v1');
  assert.throws(() => saveDocumentDraft({ ...strictStorage, setItem: () => { throw new Error('quota'); } }, strictInput, { requireFullSnapshot: true }), /quota/);
  assert.equal(strictStorage.getItem('exam-formatter-document-drafts-v1'), beforeQuotaFailure, 'Strict manual failure never removes the prior snapshot');
  assert.throws(() => saveDocumentDraft({ getItem: () => null, setItem: () => {}, removeItem: () => {} }, strictInput, { requireFullSnapshot: true }), /ยืนยัน/, 'No-op storage must not report a manual save');
  const sourceCode = fs.readFileSync(path.join(__dirname, "../lib/original-source-store.ts"), "utf8");
  const sourceModule = { exports: {} };
  new Function("exports", "require", "module", ts.transpileModule(sourceCode, {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(sourceModule.exports, specifier => specifier === './document-draft-store' ? moduleExports : require(specifier), sourceModule);
  const { sourceMatchesDraft, saveOriginalSource } = sourceModule.exports;
  const sourceIdentity={fileName:'original.pdf',fileSize:123,sourceHash:'verified-hash'};
  assert.ok(sourceMatchesDraft(sourceIdentity,{fileName:'original.pdf',fileBytes:123,sourceHash:'verified-hash'}));
  assert.ok(!sourceMatchesDraft(sourceIdentity,{fileName:'original.pdf',fileBytes:123,sourceHash:'different-hash'}));
  assert.ok(!sourceMatchesDraft(sourceIdentity,{fileName:'other.pdf',fileBytes:123}));
  assert.ok(!sourceMatchesDraft(sourceIdentity,{fileName:'original.pdf',fileBytes:124}));
  await assert.rejects(()=>saveOriginalSource(sourceIdentity),/ที่เก็บไฟล์ต้นฉบับ/,'Unavailable IndexedDB must report failure, not fake a save');

  // Test 1: Empty storage
  assert.deepStrictEqual(loadAllDrafts(storage), []);
  assert.strictEqual(findDraftByDoc(storage, "test.pdf", 1024), undefined);

  // Test 2: makeDocKey
  assert.strictEqual(makeDocKey("Exam-1.pdf", 5000), "exam-1.pdf-5000");
  assert.strictEqual(makeDocKey("Exam-1.pdf", 5000, "hash123"), "exam-1.pdf-5000-hash123");

  // Test 3: Save and Find Draft
  const saved1 = saveDocumentDraft(storage, {
    fileName: "Exam-1.pdf",
    fileBytes: 5000,
    sourceHash: "hash123",
    ocrText: "1. ข้อสอบเคมี\nก. น้ำ\nข. เกลือ",
    formattedItems: [{ id: "q1", questionNumber: 1, questionText: "ข้อสอบเคมี", choices: [] }],
    editorHtml: '<div data-item-id="q1">1. ข้อสอบเคมี <strong>แก้แล้ว</strong></div>',
    itemCount: 1,
    diagramsHarvested: true,
  });

  assert.ok(saved1.id.startsWith("draft-"));
  assert.strictEqual(saved1.itemCount, 1);
  assert.strictEqual(saved1.diagramsHarvested, true);

  const found1 = findDraftByDoc(storage, "Exam-1.pdf", 5000, "hash123");
  assert.ok(found1);
  assert.strictEqual(found1.fileName, "Exam-1.pdf");
  assert.strictEqual(found1.itemCount, 1);
  assert.strictEqual(found1.ocrText, "1. ข้อสอบเคมี\nก. น้ำ\nข. เกลือ");
  assert.ok(found1.editorHtml.includes("แก้แล้ว"));

  // Test 4: Overwriting existing docKey updates without duplicating
  saveDocumentDraft(storage, {
    fileName: "Exam-1.pdf",
    fileBytes: 5000,
    sourceHash: "hash123",
    ocrText: "Updated OCR text",
    itemCount: 5,
  });

  const allDrafts = loadAllDrafts(storage);
  assert.strictEqual(allDrafts.length, 1);
  assert.strictEqual(allDrafts[0].ocrText, "Updated OCR text");
  assert.strictEqual(allDrafts[0].itemCount, 5);

  // Test 4b: App integration contract keeps old drafts editable without reimport
  const appSource = fs.readFileSync(path.join(__dirname, "../app/page.tsx"), "utf8");
  assert.ok(appSource.includes("parsedFileFromDraft"), "Opening a saved draft without an active file must create a resumable ParsedFileResult");
  assert.ok(appSource.includes("restoredEditorHtml"), "Saved editor DOM must be restored for exact continuation");
  assert.ok(appSource.includes("onEditorDraftChange"), "Editor changes must autosave back into the draft");
  assert.ok(appSource.includes('data-theme-surface="earth"'), "Draft modal must stay on the earth-tone design surface");

  const editorSource = fs.readFileSync(path.join(__dirname, "../components/SplitDocumentEditor.tsx"), "utf8");
  assert.ok(editorSource.includes("dangerouslySetInnerHTML"), "Editor must be able to restore the saved draft DOM snapshot");

  // Test 5: Delete draft
  deleteDocumentDraft(storage, saved1.docKey);
  assert.strictEqual(loadAllDrafts(storage).length, 0);

  // Test 6: Clear all drafts
  saveDocumentDraft(storage, { fileName: "A.pdf", fileBytes: 100, itemCount: 10 });
  saveDocumentDraft(storage, { fileName: "B.pdf", fileBytes: 200, itemCount: 20 });
  assert.strictEqual(loadAllDrafts(storage).length, 2);
  clearAllDocumentDrafts(storage);
  assert.strictEqual(loadAllDrafts(storage).length, 0);

  // Test 7: Corrupted JSON recovery
  storage.setItem("exam-formatter-document-drafts-v1", "{ corrupt json !!");
  assert.deepStrictEqual(loadAllDrafts(storage), []);

  // T-128: a renamed copy is found by SHA-256; progress and export marks survive later saves.
  {
    const { draftsForSource, markDraftExported, draftProgress } = moduleExports;
    const store = createMockStorage();
    const hash = "a".repeat(64);
    saveDocumentDraft(store, { fileName: "บทที่ 7.pdf", fileBytes: 100, sourceHash: hash, ocrText: "1. q", formattedItems: [{ id: 1, questionNumber: 1, questionText: "q", choices: [{ key: "ก", text: "a", isCorrect: true }], explanationText: "" }, { id: 2, questionNumber: 2, questionText: "q", choices: [{ key: "ก", text: "a", isCorrect: false }], explanationText: "" }], itemCount: 2, diagramsHarvested: true, editorHtml: '<div data-item-id="1"><div data-choice-key="ก" data-answer-origin="manual"></div></div><div data-item-id="2"><div data-choice-key="ก" data-answer-origin="none"></div></div>' });
    assert.equal(draftsForSource(store, "renamed copy.pdf", 100, hash).length, 1, "renamed copy found by hash");
    assert.equal(draftsForSource(store, "other.pdf", 100, "b".repeat(64)).length, 0);
    saveDocumentDraft(store, { fileName: "บทที่ 7.pdf", fileBytes: 100, sourceHash: hash, ocrText: "1. q", itemCount: 2, editorHtml: '<div data-item-id="1"><div data-answer-origin="manual"></div></div><div data-item-id="2"></div>' });
    assert.equal(draftsForSource(store, "x.pdf", 100, hash)[0].diagramsHarvested, true, "a save without the flag keeps figures captured");
    assert.equal(markDraftExported(store, hash, "x.pdf", 100, "2026-10-17T07:30:00.000Z"), true);
    const progress = draftProgress(draftsForSource(store, "x.pdf", 100, hash)[0]);
    assert.deepEqual(progress, { converted: true, figures: true, answered: 1, total: 2, exportedAt: "2026-10-17T07:30:00.000Z" });
    assert.equal(loadAllDrafts(store).length, 1, "storage format kept after marking the export");
  }
  console.log("PASS Document Draft & OCR Cache Store contract verified cleanly");
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
