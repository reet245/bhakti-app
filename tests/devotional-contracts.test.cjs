const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function loadService(requestJson) {
  const source = fs.readFileSync('src/services/horoscopeService.js', 'utf8')
    .replace(/^import .*;\r?\n/gm, '').replace(/^export /gm, '');
  const context = { requestJson, module: { exports: {} } };
  vm.runInNewContext(`${source}\nmodule.exports = { getDailyHoroscopes };`, context);
  return context.module.exports;
}

test('horoscope service calls the same-origin backend and preserves provider dates', async () => {
  let call;
  const signal = new AbortController().signal;
  const { getDailyHoroscopes } = loadService(async (...args) => {
    call = args;
    return { success: true, data: { aries: { horoscope: 'Aries provider text', date: '2026-10-23', source: 'https://source.example' } } };
  });
  const data = await getDailyHoroscopes('en', { signal });
  assert.equal(call[0], '/api/v1/horoscope/daily?language=en');
  assert.equal(call[1].signal, signal);
  assert.equal(data.aries.available, true);
  assert.equal(data.aries.date, '2026-10-23');
  assert.equal(data.taurus.available, false);
  assert.notEqual(data.taurus.horoscope, data.aries.horoscope);
});

test('Hindi and missing/undated horoscope data stay explicitly unavailable', async () => {
  let calls = 0;
  const { getDailyHoroscopes } = loadService(async () => {
    calls += 1;
    return { success: true, data: { aries: { horoscope: 'Undated text' } } };
  });
  const hindi = await getDailyHoroscopes('hi');
  assert.equal(calls, 0);
  assert.equal(hindi.aries.available, false);
  assert.match(hindi.aries.horoscope, /हिंदी/);
  assert.equal((await getDailyHoroscopes('en')).aries.available, false);
});

function loadAudioHook(createAsync) {
  const focusCleanups = [];
  const values = [];
  let appStateListener;
  const source = fs.readFileSync('src/hooks/useBundledAudio.js', 'utf8')
    .replace(/^import .*;\r?\n/gm, '').replace('export default function', 'function');
  const context = {
    module: { exports: {} },
    useRef: (value) => ({ current: value }),
    useState: (value) => [value, (next) => values.push(next)],
    useCallback: (callback) => callback,
    useFocusEffect: (callback) => focusCleanups.push(callback()),
    useEffect: (callback) => callback(),
    AppState: { addEventListener: (_, callback) => { appStateListener = callback; return { remove() {} }; } },
    Audio: { setAudioModeAsync: async () => {}, Sound: { createAsync } },
  };
  vm.runInNewContext(`${source}\nmodule.exports = useBundledAudio;`, context);
  const hook = context.module.exports();
  return { hook, values, blur: () => focusCleanups.forEach((cleanup) => cleanup()), background: () => appStateListener('background') };
}

test('pending audio creation cannot start after screen blur', async () => {
  let resolveSound;
  let played = 0;
  let unloaded = 0;
  let options;
  const { hook, blur } = loadAudioHook(async (_, configuration) => {
    options = configuration;
    return new Promise((resolve) => { resolveSound = resolve; });
  });
  const playback = hook.toggle('ganesh', 10);
  await new Promise((resolve) => setImmediate(resolve));
  blur();
  resolveSound({ sound: { playAsync: async () => played++, unloadAsync: async () => unloaded++ } });
  await playback;
  assert.equal(options.shouldPlay, false);
  assert.equal(played, 0);
  assert.equal(unloaded, 1);
});

test('playing audio unloads on app background and unmatched chants never play', async () => {
  let created = 0;
  let played = 0;
  let unloaded = 0;
  const { hook, background, values } = loadAudioHook(async () => {
    created += 1;
    return { sound: { setOnPlaybackStatusUpdate() {}, playAsync: async () => played++, unloadAsync: async () => unloaded++ } };
  });
  await hook.toggle('chalisa', null);
  assert.equal(created, 0);
  assert.ok(values.some((value) => typeof value === 'string' && value.includes('not available')));
  await hook.toggle('ganesh', 10);
  assert.equal(played, 1);
  background();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(unloaded, 1);
});

test('favorites hydrate once, stay shared across screens, and serialize saved progress', async () => {
  let resolveRead;
  const writes = [];
  const source = fs.readFileSync('src/hooks/useDevotionalState.js', 'utf8')
    .replace(/^import .*;\r?\n/gm, '').replace(/^export /gm, '');
  const context = {
    module: { exports: {} },
    useEffect: (callback) => callback(),
    useSyncExternalStore: (_, getSnapshot) => getSnapshot(),
    AsyncStorage: {
      getItem: () => new Promise((resolve) => { resolveRead = resolve; }),
      setItem: async (_, value) => writes.push(JSON.parse(value)),
    },
  };
  vm.runInNewContext(`${source}\nmodule.exports = { useDevotionalState, toggleMantraFavorite, saveJaapSession };`, context);
  const { useDevotionalState, toggleMantraFavorite, saveJaapSession } = context.module.exports;
  assert.equal(useDevotionalState().ready, false);
  toggleMantraFavorite('early');
  resolveRead(JSON.stringify({ favorites: ['saved'], sessions: { old: { count: 21, elapsedMs: 10 } } }));
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(useDevotionalState().favorites.join(','), 'saved');
  toggleMantraFavorite('ganesh');
  toggleMantraFavorite('saved');
  saveJaapSession('shiv:108', { count: 12, elapsedMs: 4000 });
  assert.equal(useDevotionalState().favorites.join(','), 'ganesh');
  assert.equal(useDevotionalState().sessions.old.count, 21);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(writes.at(-1).favorites.join(','), 'ganesh');
  assert.equal(writes.at(-1).sessions['shiv:108'].count, 12);
});
