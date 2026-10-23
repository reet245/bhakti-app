const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const source = fs.readFileSync(require.resolve('../public/sw.js'), 'utf8');
function worker({ cacheFailure = false } = {}) {
  const handlers = {};
  const network = new Response('fresh network response', { status: 200 });
  let fetched = 0;
  const deleted = [];
  const prefix = `bhakti-${encodeURIComponent('https://example.com/app/')}-`;
  const context = {
    URL, Response,
    self: { registration: { scope: 'https://example.com/app/' }, location: { href: 'https://example.com/app/sw.js' }, addEventListener: (event, handler) => { handlers[event] = handler; }, clients: { claim: async () => {} } },
    fetch: async () => { fetched++; return network; },
    caches: {
      open: async () => { if (cacheFailure) throw new Error('Storage disabled'); return { match: async () => undefined, put: async () => { throw new Error('Quota exceeded'); }, keys: async () => [] }; },
      match: async () => undefined,
      keys: async () => ['other-application-cache', 'bhakti-another-scope-v1', `${prefix}old`, `${prefix}__BHAKTI_BUILD_ID__`],
      delete: async (key) => { deleted.push(key); },
    },
  };
  vm.runInNewContext(source, context);
  return { handlers, network, deleted, prefix, fetched: () => fetched };
}
test('successful assets are delivered even when caching exceeds quota or storage is unavailable', async () => {
  for (const cacheFailure of [false, true]) {
    const runtime = worker({ cacheFailure }); let response;
    runtime.handlers.fetch({ request: { url: 'https://example.com/app/assets/new.png', method: 'GET', destination: 'image' }, respondWith: (pending) => { response = pending; } });
    assert.equal(await response, runtime.network);
  }
});
test('a shell response remains usable when offline storage fails', async () => {
  const runtime = worker({ cacheFailure: true }); let response;
  runtime.handlers.fetch({ request: { url: 'https://example.com/app/', method: 'GET', mode: 'navigate' }, respondWith: (pending) => { response = pending; } });
  assert.equal(await response, runtime.network);
});
test('API and cross-origin responses are not intercepted or cached', () => {
  const runtime = worker();
  for (const url of ['https://example.com/app/api/v1/kundli/generate', 'https://api.example.com/api/v1/health']) {
    runtime.handlers.fetch({ request: { url, method: 'GET', destination: 'script' }, respondWith: () => { throw new Error('API must not be cached'); } });
  }
  assert.equal(runtime.fetched(), 0);
});
test('activation removes only outdated caches owned by this Bhakti scope', async () => {
  const runtime = worker(); let pending;
  runtime.handlers.activate({ waitUntil: (task) => { pending = task; } });
  await pending;
  assert.deepEqual(runtime.deleted, [`${runtime.prefix}old`]);
});
