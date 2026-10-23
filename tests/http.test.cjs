const test = require('node:test');
const assert = require('node:assert/strict');
const { validateApiUrl } = require('../src/utils/apiPolicy.cjs');
const { createJsonClient } = require('../src/utils/jsonClient.cjs');

test('production requires HTTPS public backend without credentials or query', () => {
  assert.equal(validateApiUrl('https://api.example.com/base/', { production: true }), 'https://api.example.com/base');
  for (const value of ['', 'http://example.com', 'https://localhost:8080', 'https://user:pass@example.com', 'https://example.com?key=x', 'javascript:alert(1)']) {
    assert.throws(() => validateApiUrl(value, { production: true }));
  }
  assert.equal(validateApiUrl('http://localhost:8080'), 'http://localhost:8080');
});

test('production rejects local domains and private address literals, including normalized forms', () => {
  const hosts = [
    'LOCALHOST.', 'api.localhost', 'bhakti.local.', '0.0.0.0', '127.1', '2130706433', '0x7f000001',
    '10.0.2.2', '10.20.30.40', '169.254.10.20', '172.16.0.1', '172.31.255.254', '192.168.1.1',
    '[::]', '[::1]', '[0:0:0:0:0:0:0:1]', '[fc00::1]', '[fdab::1]', '[fe80::1]', '[febf::1]',
    '[::ffff:127.0.0.1]', '[::ffff:c0a8:101]',
  ];
  for (const host of hosts) {
    assert.throws(() => validateApiUrl(`https://${host}`, { production: true }), /public HTTPS/, host);
  }
});

test('production allows public hosts beside private-range boundaries', () => {
  for (const host of ['api.local.example.com', '172.15.255.254', '172.32.0.1', '8.8.8.8', '[2606:4700:4700::1111]', '[::ffff:8.8.8.8]']) {
    const value = `https://${host}/api`;
    assert.equal(validateApiUrl(value, { production: true }), value);
  }
});

test('development permits local HTTP servers but still rejects non-HTTP schemes', () => {
  for (const value of ['http://192.168.1.2:8080', 'http://10.0.2.2:8080', 'http://[::1]:8080']) {
    assert.equal(validateApiUrl(value), value);
  }
  for (const value of ['ftp://example.com', 'file:///tmp/backend', 'https://user:pass@example.com', 'https://example.com#fragment']) {
    assert.throws(() => validateApiUrl(value));
  }
});
test('client sends only relative routes and returns full envelope', async () => {
  let called;
  const client = createJsonClient({ baseUrl: 'https://example.com', fetchImpl: async (...args) => {
    called = args; return { ok: true, json: async () => ({ success: true, data: { tithi: 'test' } }) };
  } });
  assert.equal((await client('/api/v1/panchang/daily')).data.tithi, 'test');
  assert.equal(called[0], 'https://example.com/api/v1/panchang/daily');
  assert.equal(called[1].headers.Accept, 'application/json');
  await assert.rejects(client('//other.example'), /Invalid API route/);
});
test('configuration error fails before network call', async () => {
  const client = createJsonClient({ baseUrl: '', configurationError: 'Missing HTTPS backend', fetchImpl: () => { throw new Error('must not run'); } });
  await assert.rejects(client('/test'), /Missing HTTPS backend/);
});
test('timeouts cancel the fetch and are actionable', async () => {
  const client = createJsonClient({ baseUrl: 'https://example.com', fetchImpl: (_, { signal }) => new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true })) });
  await assert.rejects(client('/test', { timeoutMs: 10 }), /took too long/);
});
test('external cancellation is distinguishable from service errors', async () => {
  const controller = new AbortController();
  const client = createJsonClient({ baseUrl: 'https://example.com', fetchImpl: (_, { signal }) => new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true })) });
  const pending = client('/test', { signal: controller.signal });
  controller.abort();
  await assert.rejects(pending, { name: 'AbortError' });
  await assert.rejects(client('/test', { signal: controller.signal }), { name: 'AbortError' });
});
test('HTTP errors retain status; malformed responses fail safely', async () => {
  const failed = createJsonClient({ baseUrl: 'https://example.com', fetchImpl: async () => ({ ok: false, status: 429, json: async () => ({ success: false, message: 'Too many requests.' }) }) });
  await assert.rejects(failed('/test'), (error) => error.status === 429 && error.message === 'Too many requests.');
  const malformed = createJsonClient({ baseUrl: 'https://example.com', fetchImpl: async () => ({ ok: true, json: async () => { throw new Error('HTML'); } }) });
  await assert.rejects(malformed('/test'), /invalid response/);
});
