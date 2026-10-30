const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function loadState(storage) {
  const source = fs.readFileSync('src/hooks/useDevotionalState.js', 'utf8')
    .replace(/^import .*;\r?\n/gm, '').replace(/^export /gm, '');
  const context = {
    module: { exports: {} }, AsyncStorage: storage,
    useEffect: (callback) => callback(),
    useSyncExternalStore: (_, getSnapshot) => getSnapshot(),
  };
  vm.runInNewContext(`${source}\nmodule.exports = { useDevotionalState, toggleMantraFavorite, saveJaapSession, saveCustomMantra, deleteCustomMantra, updateReadingPreferences, retryDevotionalLoad, retryDevotionalSave };`, context);
  return context.module.exports;
}
const flush = () => new Promise((resolve) => setImmediate(resolve));
const personal = { id: 'custom-prayer', title: 'My prayer', text: 'ॐ नमः शिवाय', deityId: 'shiv' };

test('legacy favorites and sessions migrate while malformed personal entries and preferences are bounded', async () => {
  const state = loadState({ getItem: async () => JSON.stringify({ favorites: ['om-namah-shivaya'], sessions: { old: { count: 3 } }, customMantras: [personal, { id: 'bad', title: 'x', text: 'x' }, { ...personal, title: 'Updated' }], readingScript: 'unknown', meaningLanguage: 'bn' }), setItem: async () => {} });
  state.useDevotionalState();
  await flush();
  const value = state.useDevotionalState();
  assert.equal(value.ready, true);
  assert.equal(value.favorites[0], 'om-namah-shivaya');
  assert.equal(value.sessions.old.count, 3);
  assert.equal(value.customMantras.length, 1);
  assert.equal(value.customMantras[0].title, 'Updated');
  assert.equal(value.customMantras[0].isCustom, true);
  assert.equal(value.readingScript, 'devanagari');
  assert.equal(value.meaningLanguage, 'bn');
});

test('failed hydration blocks writes until explicit retry succeeds', async () => {
  let failed = true;
  const writes = [];
  const state = loadState({ getItem: async () => { if (failed) throw new Error('unavailable'); return JSON.stringify({ favorites: ['saved'] }); }, setItem: async (_, value) => writes.push(value) });
  state.useDevotionalState();
  await flush();
  assert.equal(state.useDevotionalState().ready, false);
  state.toggleMantraFavorite('new');
  await assert.rejects(state.saveCustomMantra(personal));
  assert.equal(writes.length, 0);
  failed = false;
  await state.retryDevotionalLoad();
  assert.equal(state.useDevotionalState().ready, true);
  assert.equal(state.useDevotionalState().favorites[0], 'saved');
});

test('repeated load retries share the in-flight read so stale responses cannot overwrite edits', async () => {
  let reads = 0;
  let resolveRead;
  const state = loadState({ getItem: async () => { reads += 1; return new Promise((resolve) => { resolveRead = resolve; }); }, setItem: async () => {} });
  state.useDevotionalState();
  const retry = state.retryDevotionalLoad();
  state.retryDevotionalLoad();
  assert.equal(reads, 1);
  resolveRead('{}');
  await retry;
  state.toggleMantraFavorite('saved-now');
  await state.retryDevotionalLoad();
  assert.equal(reads, 1);
  assert.equal(state.useDevotionalState().favorites[0], 'saved-now');
});

test('personal save publishes only after durable storage and concurrent favorites are preserved', async () => {
  let resolveSave;
  const writes = [];
  let first = true;
  const state = loadState({ getItem: async () => '{}', setItem: async (_, value) => { writes.push(JSON.parse(value)); if (first) { first = false; await new Promise((resolve) => { resolveSave = resolve; }); } } });
  state.useDevotionalState();
  await flush();
  const saving = state.saveCustomMantra(personal);
  await flush();
  assert.equal(state.useDevotionalState().customMantras.length, 0);
  state.toggleMantraFavorite('ganesh-vakratunda');
  resolveSave();
  await saving;
  await flush();
  assert.equal(state.useDevotionalState().customMantras[0].id, personal.id);
  assert.equal(state.useDevotionalState().favorites[0], 'ganesh-vakratunda');
  assert.equal(writes.at(-1).customMantras[0].id, personal.id);
  assert.equal(writes.at(-1).favorites[0], 'ganesh-vakratunda');
});

test('failed personal save and deletion leave collection intact and can be retried', async () => {
  let failed = true;
  const state = loadState({ getItem: async () => JSON.stringify({ customMantras: [personal], favorites: [personal.id], sessions: { 'custom-prayer:108': { count: 9 }, 'other:108': { count: 3 } } }), setItem: async () => { if (failed) throw new Error('disk full'); } });
  state.useDevotionalState();
  await flush();
  await assert.rejects(state.saveCustomMantra({ ...personal, title: 'Changed' }));
  assert.equal(state.useDevotionalState().customMantras[0].title, 'My prayer');
  await assert.rejects(state.deleteCustomMantra(personal.id));
  assert.equal(state.useDevotionalState().customMantras.length, 1);
  assert.equal(state.useDevotionalState().sessions['custom-prayer:108'].count, 9);
  failed = false;
  await state.saveCustomMantra({ ...personal, title: 'Changed' });
  assert.equal(state.useDevotionalState().customMantras[0].title, 'Changed');
  await state.deleteCustomMantra(personal.id);
  assert.equal(state.useDevotionalState().customMantras.length, 0);
  assert.equal(state.useDevotionalState().favorites.length, 0);
  assert.equal(state.useDevotionalState().sessions['custom-prayer:108'], undefined);
  assert.equal(state.useDevotionalState().sessions['other:108'].count, 3);
});

test('reading and meaning preferences save independently of UI language with safe validation', async () => {
  const writes = [];
  const state = loadState({ getItem: async () => '{}', setItem: async (_, value) => writes.push(JSON.parse(value)) });
  state.useDevotionalState();
  await flush();
  state.updateReadingPreferences({ readingScript: 'bengali', meaningLanguage: 'bn' });
  state.updateReadingPreferences({ readingScript: 'invalid' });
  await flush();
  assert.equal(writes.at(-1).readingScript, 'bengali');
  assert.equal(writes.at(-1).meaningLanguage, 'bn');
  await assert.rejects(state.saveCustomMantra({ title: ' ', text: 'ॐ' }));
  assert.equal(state.useDevotionalState().customMantras.length, 0);
});
