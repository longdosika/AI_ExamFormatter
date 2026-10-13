const assert = require('node:assert/strict');
const {spawnSync} = require('node:child_process');
const path = require('node:path');

const script = path.join(__dirname, 'check-environment.mjs');
const result = spawnSync(process.execPath, [script, '--json', '--skip-network'], {
  cwd: path.join(__dirname, '..'),
  encoding: 'utf8',
  env: {...process.env, TYPHOON_OCR_BASE_URL: 'http://127.0.0.1:11434/v1', TYPHOON_OCR_MODEL: 'fixture-model'},
});

assert.ok(result.stdout, `environment doctor produced no JSON output\n${result.stderr}`);
const report = JSON.parse(result.stdout);
assert.equal(typeof report.generatedAt, 'string');
assert.equal(typeof report.status, 'string');
assert.ok(['PASS', 'WARN', 'FAIL'].includes(report.status));
assert.ok(Array.isArray(report.checks));
assert.ok(report.checks.some((item) => item.id === 'package-lock'));
assert.ok(report.checks.some((item) => item.id === 'ocr-config'));
assert.equal(JSON.stringify(report).includes('TYPHOON_API_KEY_VALUE'), false);
console.log('Environment doctor contract tests passed.');
