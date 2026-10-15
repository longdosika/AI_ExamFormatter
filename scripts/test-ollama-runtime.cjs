const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

require.extensions['.ts'] = (module, file) => {
  const source = fs.readFileSync(file, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  module._compile(output, file);
};

const { ensureOllamaReady, isLocalOllamaBase, ollamaTagsEndpoint } = require('../lib/ollama-runtime.ts');

(async () => {
  assert.equal(isLocalOllamaBase('http://127.0.0.1:11434/v1'), true);
  assert.equal(isLocalOllamaBase('http://localhost:11434/v1'), true);
  assert.equal(isLocalOllamaBase('https://api.example.test/v1'), false);
  assert.equal(ollamaTagsEndpoint('http://localhost:11434/v1'), 'http://localhost:11434/api/tags');

  let probes = 0;
  let spawned = 0;
  const started = await ensureOllamaReady({
    baseUrl: 'http://127.0.0.1:11434/v1',
    fetcher: async () => ({ ok: ++probes > 1 }),
    spawnProcess: (command, args, options) => {
      spawned += 1;
      assert.equal(command, 'ollama');
      assert.deepEqual(args, ['serve']);
      assert.deepEqual(options, { detached: true, stdio: 'ignore', windowsHide: true });
      return { unref() {} };
    },
    pollAttempts: 2,
    pollDelayMs: 1,
  });
  assert.deepEqual(started, { ready: true, started: true, endpoint: 'http://127.0.0.1:11434/api/tags' });
  assert.equal(spawned, 1);

  const reused = await ensureOllamaReady({
    baseUrl: 'http://localhost:11434/v1',
    fetcher: async () => ({ ok: true }),
    spawnProcess: () => { throw new Error('running Ollama must be reused'); },
  });
  assert.equal(reused.ready, true);
  assert.equal(reused.started, false);

  let remoteTouched = false;
  const remote = await ensureOllamaReady({
    baseUrl: 'https://api.typhoon.ai/v1',
    fetcher: async () => { remoteTouched = true; return { ok: false }; },
    spawnProcess: () => { throw new Error('remote OCR must not start local Ollama'); },
  });
  assert.deepEqual(remote, { ready: true, started: false, endpoint: 'https://api.typhoon.ai/api/tags' });
  assert.equal(remoteTouched, false);

  let releasePoll;
  let atSpawn;
  const pollGate = new Promise(resolve => { releasePoll = resolve; });
  const spawnGate = new Promise(resolve => { atSpawn = resolve; });
  let concurrentCalls = 0;
  let concurrentSpawns = 0;
  const concurrentFetcher = async () => {
    concurrentCalls += 1;
    if (concurrentCalls === 1) return { ok: false };
    await pollGate;
    return { ok: true };
  };
  const concurrentSpawn = () => {
    concurrentSpawns += 1;
    atSpawn();
    return { unref() {} };
  };
  const first = ensureOllamaReady({
    baseUrl: 'http://127.0.0.1:11434/v1',
    fetcher: concurrentFetcher,
    spawnProcess: concurrentSpawn,
    pollAttempts: 1,
  });
  await spawnGate;
  const second = ensureOllamaReady({
    baseUrl: 'http://127.0.0.1:11434/v1',
    fetcher: concurrentFetcher,
    spawnProcess: concurrentSpawn,
    pollAttempts: 1,
  });
  releasePoll();
  const concurrentResults = await Promise.all([first, second]);
  assert.equal(concurrentSpawns, 1);
  assert.equal(concurrentResults[0].ready, true);
  assert.equal(concurrentResults[1].ready, true);

  await assert.rejects(
    ensureOllamaReady({
      baseUrl: 'http://127.0.0.1:11434/v1',
      fetcher: async () => ({ ok: false }),
      spawnProcess: () => ({ unref() {} }),
      pollAttempts: 1,
    }),
    /OLLAMA_NOT_READY/
  );

  if (process.argv.includes('--live')) {
    const live = await ensureOllamaReady();
    fs.writeFileSync(
      'evidence/t099-live-ollama.json',
      JSON.stringify({ checkedAt: new Date().toISOString(), ...live }, null, 2) + '\n'
    );
    assert.equal(live.ready, true);
    console.log(`Live Ollama readiness passed: ${live.endpoint} (started=${live.started}).`);
  }

  console.log('Ollama runtime readiness passed: local reuse, automatic detached startup, remote bypass, concurrent startup lock and actionable failure.');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
