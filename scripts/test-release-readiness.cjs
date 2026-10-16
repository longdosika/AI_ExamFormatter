const assert = require('node:assert/strict');

(async () => {
  const { inspectReleaseFile } = await import('./check-release-readiness.mjs');
  const text = Buffer.from('safe project text');
  assert.equal(inspectReleaseFile('.env.local', text).findings[0].type, 'local-secret-file');
  assert.deepEqual(inspectReleaseFile('.env.example', text).findings, []);
  assert.equal(inspectReleaseFile('.next-release/server.js', text).findings[0].type, 'generated-output');
  assert.equal(inspectReleaseFile('node_modules/package/index.js', text).findings[0].type, 'generated-output');
  assert.equal(inspectReleaseFile('oversize.bin', text, 101 * 1024 * 1024).findings[0].type, 'github-file-limit');
  assert.equal(inspectReleaseFile('large.bin', text, 51 * 1024 * 1024).warnings[0].type, 'large-file');
  const synthetic = 'AI' + 'za' + 'x'.repeat(35);
  const report = inspectReleaseFile('fixture.txt', Buffer.from('first line\n' + synthetic));
  assert.deepEqual(report.findings, [{ type: 'google-api-key', path: 'fixture.txt', line: 2 }]);
  assert.ok(!JSON.stringify(report).includes(synthetic), 'Reports must not print credential-shaped values');
  assert.deepEqual(inspectReleaseFile('image.png', Buffer.from(synthetic)).findings, [], 'Binary formats are outside text scanning scope');
  assert.equal(inspectReleaseFile('fixture.txt', Buffer.from(synthetic)).findings.length, 1, 'Repeated scans must reset regex iteration');
  console.log('Release readiness guards passed: ignored secrets/builds, file sizes, redacted findings and explicit binary limits.');
})().catch(error => { console.error(error); process.exitCode = 1; });
