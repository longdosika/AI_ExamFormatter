const fs = require('node:fs');
const assert = require('node:assert/strict');
const ts = require('typescript');

require.extensions['.ts'] = (module, filename) => {
  module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true }
  }).outputText, filename);
};

const {
  getProviderApiKeys,
  isQuotaOrRateLimitError,
  maskApiKey,
  executeWithKeyRotation,
} = require('../lib/api-key-manager.ts');

async function runTests() {
  console.log('Running Provider Multi-Key & Quota Rotation tests...');

  // 1. Key Extraction & Ordering Tests
  const mockEnv1 = {
    GEMINI_API_KEY: 'key-primary',
    GEMINI_API_KEY_2: 'key-backup-2',
    GEMINI_API_KEY_3: 'key-backup-3',
  };
  const geminiKeys = getProviderApiKeys('gemini', mockEnv1);
  assert.deepStrictEqual(geminiKeys, ['key-primary', 'key-backup-2', 'key-backup-3'], 'Gemini keys must preserve primary -> backup order');

  // 2. Deduplication and Trimming
  const mockEnv2 = {
    GEMINI_API_KEY: '  key-primary  ',
    GEMINI_API_KEY_2: 'key-primary', // duplicate
    GEMINI_API_KEY_3: 'key-unique-3',
    GEMINI_API_KEYS: 'key-unique-4, key-primary ; key-unique-5',
  };
  const deduplicated = getProviderApiKeys('gemini', mockEnv2);
  assert.deepStrictEqual(deduplicated, ['key-primary', 'key-unique-3', 'key-unique-4', 'key-unique-5'], 'Must trim and deduplicate keys across environment sources');

  // 3. Google Vision Fallback & Project Key Inclusion
  const mockEnv3 = {
    GOOGLE_VISION_API_KEY: 'gv-primary',
    GOOGLE_VISION_API_KEY_2: 'gv-backup',
    GOOGLE_PICKER_API_KEY: 'picker-fallback',
  };
  const gvKeys = getProviderApiKeys('google-vision', mockEnv3);
  assert.deepStrictEqual(gvKeys, ['gv-primary', 'gv-backup', 'picker-fallback'], 'Google Vision keys must include numbered backups and fallback picker key');

  // 4. Quota Error Classifier
  assert.strictEqual(isQuotaOrRateLimitError(new Error('GEMINI_HTTP_429')), true, 'HTTP 429 is a quota error');
  assert.strictEqual(isQuotaOrRateLimitError(new Error('Resource has been exhausted (e.g. check quota).')), true, 'Gemini quota message recognized');
  assert.strictEqual(isQuotaOrRateLimitError(new Error('Rate limit exceeded')), true, 'Rate limit message recognized');
  assert.strictEqual(isQuotaOrRateLimitError(new Error('SyntaxError: Unexpected token'), 400), false, 'Syntax error is not quota');
  assert.strictEqual(isQuotaOrRateLimitError(new Error('Not found'), 404), false, '404 is not quota');

  // 5. Key Masking
  assert.strictEqual(maskApiKey('test-mask-fixture-value'), 'test...alue');
  assert.strictEqual(maskApiKey('short'), '***');

  // 6. executeWithKeyRotation: Success on Primary Key
  const callLog1 = [];
  const res1 = await executeWithKeyRotation(
    'gemini',
    async (key, idx) => {
      callLog1.push({ key, idx });
      return `success-${key}`;
    },
    { env: mockEnv1 }
  );
  assert.strictEqual(res1.result, 'success-key-primary');
  assert.strictEqual(callLog1.length, 1, 'Should succeed on first key without calling backups');

  // 7. executeWithKeyRotation: Failover from Key #1 to Key #2 upon 429
  const callLog2 = [];
  const rotations2 = [];
  const res2 = await executeWithKeyRotation(
    'gemini',
    async (key, idx) => {
      callLog2.push({ key, idx });
      if (idx === 0) {
        throw new Error('GEMINI_HTTP_429: Resource exhausted');
      }
      return `success-${key}`;
    },
    {
      env: mockEnv1,
      onKeyRotated: (from, to) => rotations2.push({ from, to }),
    }
  );
  assert.strictEqual(res2.result, 'success-key-backup-2');
  assert.strictEqual(callLog2.length, 2, 'Should failover to second key on 429');
  assert.deepStrictEqual(rotations2, [{ from: 0, to: 1 }]);

  // 8. executeWithKeyRotation: Cascades through Key #1, #2 to Key #3
  const callLog3 = [];
  const res3 = await executeWithKeyRotation(
    'gemini',
    async (key, idx) => {
      callLog3.push({ key, idx });
      if (idx < 2) {
        throw new Error('Quota exceeded for quota metric');
      }
      return `recovered-on-${key}`;
    },
    { env: mockEnv1 }
  );
  assert.strictEqual(res3.result, 'recovered-on-key-backup-3');
  assert.strictEqual(callLog3.length, 3, 'Should cascade across all 3 keys until success');

  // 9. executeWithKeyRotation: Non-quota error does NOT rotate
  let nonQuotaRotated = false;
  await assert.rejects(
    async () => {
      await executeWithKeyRotation(
        'gemini',
        async () => {
          throw new Error('INVALID_IMAGE');
        },
        {
          env: mockEnv1,
          onKeyRotated: () => { nonQuotaRotated = true; },
        }
      );
    },
    /INVALID_IMAGE/
  );
  assert.strictEqual(nonQuotaRotated, false, 'Non-quota error must fail immediately without rotating keys');

  console.log('PASS Provider Multi-Key & Quota Rotation test contract verified cleanly');
}

runTests().catch(err => {
  console.error(err);
  process.exit(1);
});
