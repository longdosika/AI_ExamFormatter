const assert = require('node:assert/strict');
const fs = require('node:fs');
const crypto = require('node:crypto');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText, filename);
const { driveLibrary, exportStamp } = require('../lib/drive-library.ts');
const { TARGET_FOLDER, createExportDocx } = require('../lib/google-export.ts');
const digest = (bytes, type = 'sha256') => crypto.createHash(type).update(bytes).digest('hex');

function fakeDrive() {
  const files = new Map([[TARGET_FOLDER, { id: TARGET_FOLDER, mimeType: 'application/vnd.google-apps.folder', permissions: [{ type: 'user' }], capabilities: { canAddChildren: true } }]]);
  const sessions = new Map(); let next = 0; let maliciousUpload = false;
  const contents = new Map();
  const response = (data, status = 200, headers) => new Response(JSON.stringify(data), { status, headers });
  const create = data => {
    const id = `fixture_file_${++next}`;
    const file = { id, createdTime: new Date().toISOString(), permissions: [{ type: 'user' }], capabilities: { canAddChildren: true }, webViewLink: `https://drive.google.com/file/d/${id}/view`, ...data };
    files.set(id, file); return file;
  };
  const request = async (url, init = {}) => {
    const parsed = new URL(url), method = init.method || 'GET';
    assert.equal(init.redirect, 'error');
    assert.equal(init.headers.Authorization, 'Bearer fixture-token');
    if (parsed.pathname.startsWith('/upload/')) {
      if (method === 'POST') {
        const uploadId = `session${sessions.size}`; sessions.set(uploadId, JSON.parse(init.body));
        return response({}, 200, { location: maliciousUpload ? 'https://untrusted.example/upload' : `https://www.googleapis.com/upload/drive/v3/files?upload_id=${uploadId}` });
      }
      assert.equal(method, 'PUT');
      const bytes = Buffer.from(init.body), metadata = sessions.get(parsed.searchParams.get('upload_id'));
      const created=create({ ...metadata, size: String(bytes.length), md5Checksum: digest(bytes, 'md5') });
      contents.set(created.id,bytes);
      return response(created);
    }
    const id = parsed.pathname.split('/')[4];
    if(id && parsed.searchParams.get('alt')==='media') return new Response(contents.get(id)||'',{status:contents.has(id)?200:404});
    if (parsed.pathname.endsWith('/copy')) {
      const original = files.get(id); return response(create({ ...original, id: `fixture_file_${next + 1}`, ...JSON.parse(init.body) }));
    }
    if (id) return files.has(id) ? response(files.get(id)) : response({}, 404);
    if (method === 'POST') return response(create(JSON.parse(init.body)));
    const q = parsed.searchParams.get('q');
    const parent = q.match(/'([^']+)' in parents/)[1];
    const properties = [...q.matchAll(/key='([^']+)' and value='([^']+)'/g)];
    const matches = [...files.values()].filter(file => file.parents?.includes(parent) && properties.every(([, key, value]) => file.properties?.[key] === value));
    // Force pagination even for tiny collections.
    const offset = Number(parsed.searchParams.get('pageToken') || 0);
    return response({ files: matches.slice(offset, offset + 2), ...(offset + 2 < matches.length ? { nextPageToken: String(offset + 2) } : {}) });
  };
  return { files, request, setMaliciousUpload: () => { maliciousUpload = true; } };
}

(async () => {
  const fake = fakeDrive(), library = driveLibrary('fixture-token', fake.request);
  assert.deepEqual(await library.listCollections(), { root: null, collections: [] });
  const bytes = Buffer.from('%PDF-immutable-source'), hash = digest(bytes);
  await assert.rejects(library.saveSource(bytes, 'source.pdf', 'application/pdf', 'bad'), /SHA-256/);
  const [saved, same] = await Promise.all([library.saveSource(bytes, 'source.pdf', 'application/pdf', hash), library.saveSource(bytes, 'renamed.pdf', 'application/pdf', hash)]);
  assert.equal(saved.source.id, same.source.id, 'same bytes deduplicate despite renamed source');
  assert.deepEqual((await library.readSource(saved.collection.id)).bytes,bytes,'Restore source bytes only after original hash verification');
  const restart = driveLibrary('fixture-token', fake.request);
  assert.equal((await restart.listCollections()).collections.length, 1, 'Drive metadata survives new service instance');
  const draft={id:'draft-test',docKey:'test-source',fileName:'source.pdf',fileBytes:bytes.length,sourceHash:hash,updatedAt:new Date().toISOString(),itemCount:1,ocrText:'1. source',editorHtml:'<p>edited</p>'};
  const backup=Buffer.from(JSON.stringify({schemaVersion:1,kind:'exam-formatter-draft',draft}));
  const backupVersion=crypto.randomUUID();
  const backedUp=await library.saveDraft(saved.collection.id,backup,backupVersion,'261016-test');
  assert.equal((await library.saveDraft(saved.collection.id,backup,backupVersion,'same')).draft.id,backedUp.draft.id);
  assert.deepEqual((await library.readDraft(saved.collection.id,backedUp.draft.id)).draft,draft,'Cloud backup restores exact snapshot after readback hash checks');
  await assert.rejects(library.saveDraft(saved.collection.id,Buffer.from('{}'),crypto.randomUUID(),'test'),/สำรอง|แบบร่าง|รองรับ/);
  fake.files.get(backedUp.draft.id).md5Checksum='0'.repeat(32);
  await assert.rejects(library.readDraft(saved.collection.id,backedUp.draft.id),/แก้ภายนอก/);
  fake.files.get(backedUp.draft.id).md5Checksum=digest(backup,'md5');
  const other = await library.saveSource(Buffer.from('different'), 'source.pdf', 'application/pdf', digest(Buffer.from('different')));
  assert.notEqual(saved.collection.id, other.collection.id, 'same filename different bytes forms separate collection');
  const docx = await createExportDocx({ title: 'Fixture', paragraphs: [{ runs: [{ text: 'Draft output' }] }] });
  const version = crypto.randomUUID();
  const output = await library.saveOutput(saved.collection.id, docx, 'test.docx', version, '261016-1700');
  assert.equal((await library.saveOutput(saved.collection.id, docx, 'test.docx', version, 'same')).output.id, output.output.id);
  await assert.rejects(library.saveOutput(saved.collection.id, Buffer.from('PKdifferent'), 'test.docx', version, 'same'), /เวอร์ชันเดิม/);
  await library.saveOutput(saved.collection.id, docx, 'test.docx', crypto.randomUUID(), '261016-1701');
  assert.equal((await library.details(saved.collection.id)).files.filter(file => file.properties.aefRole === 'output').length, 2);
  assert.equal((await library.details(saved.collection.id)).files.filter(file => file.properties.aefRole === 'quizflow-import').length, 0, 'export never infers import');
  await assert.rejects(library.outputTarget(other.collection.id, output.output.id), /ไม่สัมพันธ์/);
  await assert.rejects(library.confirmImport(saved.collection.id, output.output.id, crypto.randomUUID(), false, ''), /ยืนยัน/);
  const operation = crypto.randomUUID();
  const imported = await library.confirmImport(saved.collection.id, output.output.id, operation, true, 'Fixture only');
  assert.equal(imported.md5Checksum, output.output.md5Checksum);
  assert.equal(imported.properties.aefConfirmation, 'user-reported');
  assert.equal((await library.confirmImport(saved.collection.id, output.output.id, operation, true, '')).id, imported.id);
  fake.files.get(output.output.id).md5Checksum = '0'.repeat(32);
  await assert.rejects(library.confirmImport(saved.collection.id, output.output.id, crypto.randomUUID(), true, ''), /แก้ภายนอก/);
  const target = fake.files.get(TARGET_FOLDER);
  target.permissions = [{ type: 'anyone' }];
  await assert.rejects(library.saveSource(bytes, 'source.pdf', 'application/pdf', hash), /สาธารณะ/);
  target.permissions = [{ type: 'user' }];
  fake.files.get(saved.source.id).md5Checksum = 'tampered';
  await assert.rejects(library.saveSource(bytes, 'source.pdf', 'application/pdf', hash), /เขียนทับ/);
  const foreign = fakeDrive(); foreign.setMaliciousUpload();
  await assert.rejects(driveLibrary('fixture-token', foreign.request).saveSource(bytes, 'source.pdf', 'application/pdf', hash), /ปลายทาง/);
  // T-128: flat layout and names; every file of a document sits in the AI_ExamFormatter folder.
  assert.match(exportStamp(new Date('2026-10-17T07:30:00Z')), /^261017-1430$/, 'Thai-time yymmdd-hhmm');
  const mine = [...fake.files.values()].filter(file => file.properties?.aefHash === hash);
  assert.ok(mine.every(file => file.parents?.includes(TARGET_FOLDER) && file.mimeType !== 'application/vnd.google-apps.folder'), 'no per-document folders');
  assert.equal(mine.find(file => file.properties.aefRole === 'source').name, 'source.pdf', 'original keeps its file name');
  assert.ok(mine.filter(file => file.properties.aefRole === 'output').every(file => /^source_[0-9]{6}-[0-9]{4}[.]docx$/.test(file.name)), 'export is [original]_[yymmdd-hhmm].docx');
  assert.ok(mine.filter(file => file.properties.aefRole === 'draft').every(file => /^source_แบบร่าง_[0-9]{6}-[0-9]{4}[.]json$/.test(file.name)));
  assert.ok(mine.filter(file => file.properties.aefRole === 'quizflow-import').every(file => /^source_QuizFlow_[0-9]{6}-[0-9]{4}$/.test(file.name)));

  assert.equal((await library.findByHash(hash)).collection.id, saved.collection.id, 'renamed copies are found by hash');
  assert.equal((await library.findByHash(digest(Buffer.from('never stored')))).collection, null);
  // A collection created before T-128 (folder per document) stays readable and is reused, never duplicated.
  const old = fakeDrive(), oldLibrary = driveLibrary('fixture-token', old.request), oldBytes = Buffer.from('%PDF-legacy'), oldHash = digest(oldBytes);
  const make = data => { const id = `legacy_fixture_${old.files.size}`; old.files.set(id, { id, permissions: [{ type: 'user' }], capabilities: { canAddChildren: true }, createdTime: new Date().toISOString(), ...data }); return old.files.get(id); };
  const libraryRoot = make({ name: 'คลังชุดเอกสาร', mimeType: 'application/vnd.google-apps.folder', parents: [TARGET_FOLDER], properties: { aefApp: 'exam-library-v1', aefRole: 'library' } });
  const group = make({ name: 'legacy [abc]', mimeType: 'application/vnd.google-apps.folder', parents: [libraryRoot.id], properties: { aefApp: 'exam-library-v1', aefRole: 'collection', aefHash: oldHash } });
  const folder = make({ name: '01 ต้นฉบับ', mimeType: 'application/vnd.google-apps.folder', parents: [group.id], properties: { aefApp: 'exam-library-v1', aefRole: 'originals', aefHash: oldHash } });
  make({ name: 'legacy.pdf', mimeType: 'application/pdf', parents: [folder.id], size: String(oldBytes.length), md5Checksum: digest(oldBytes, 'md5'), properties: { aefApp: 'exam-library-v1', aefRole: 'source', aefHash: oldHash } });
  assert.equal((await oldLibrary.listCollections()).collections[0].id, group.id, 'legacy collections are still listed');
  assert.equal((await oldLibrary.saveSource(oldBytes, 'renamed-legacy.pdf', 'application/pdf', oldHash)).collection.id, group.id, 'same bytes reuse the legacy collection');
  assert.equal([...old.files.values()].filter(file => file.properties?.aefRole === 'source').length, 1, 'no duplicate original uploaded');
  const legacyOutput = await oldLibrary.saveOutput(group.id, docx, 'x.docx', crypto.randomUUID(), 'test');
  assert.ok(legacyOutput.output.parents.includes(TARGET_FOLDER) && /^legacy_[0-9]{6}-[0-9]{4}[.]docx$/.test(legacyOutput.output.name), 'new exports of legacy documents also go flat');
  assert.ok((await oldLibrary.details(group.id)).files.some(file => file.id === legacyOutput.output.id), 'details merge flat files into the legacy document');
  console.log('T-128 flat Drive layout, names, hash lookup and legacy collections passed');
  console.log('Drive library: hash identity, immutable versions, explicit import, restart, pagination, concurrency, destination privacy, tampering and upload-host guards passed. Network mocked; no real QuizFlow import claimed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
