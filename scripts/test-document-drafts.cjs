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

  console.log("PASS Document Draft & OCR Cache Store contract verified cleanly");
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
