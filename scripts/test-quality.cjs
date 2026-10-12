const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const script = path.resolve(__dirname, 'check-knowledge-drift.mjs');
const fixture = fs.mkdtempSync(path.join(path.resolve(__dirname, '..'), '.qa-drift-'));
const git = (...args) => {
  const result = spawnSync('git', args, {cwd: fixture, encoding:'utf8', windowsHide:true});
  assert.equal(result.status, 0, result.stderr);
};
const check = () => spawnSync(process.execPath, [script, '--require-git'], {cwd:fixture, encoding:'utf8', windowsHide:true});
const write = (name, value='fixture') => { const file=path.join(fixture,name); fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,value); };
try {
  git('init');
  write('lib/new.ts','export const value = 1;');
  assert.equal(check().status,1,'No-HEAD untracked source must fail without synchronized knowledge');
  for (const name of ['documents/tasks.md','documents/traceability.md','documents/code-map.md','features/r-002-feature.md']) write(name);
  assert.equal(check().status,0,'Initial source and knowledge change must pass together');
  git('add','.');
  git('-c','user.name=QA Fixture','-c','user.email=qa@example.invalid','commit','-m','fixture baseline');
  write('lib/untracked.ts','export const newValue = 2;');
  assert.equal(check().status,1,'Untracked source after HEAD must be detected');
  for (const name of ['documents/tasks.md','documents/traceability.md','documents/code-map.md','features/r-002-feature.md']) write(name,'updated');
  assert.equal(check().status,0,'Untracked source and changed knowledge must pass together');
  console.log('Quality regression passed: untracked source, no HEAD, synchronized documents.');
} finally { fs.rmSync(fixture,{recursive:true,force:true}); }
