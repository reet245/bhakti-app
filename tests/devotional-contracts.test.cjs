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

function loadBundledPlayback(createAudioPlayer, setAudioModeAsync = async () => {}) {
  const source = fs.readFileSync('src/utils/bundledAudio.js', 'utf8')
    .replace(/^import .*;\r?\n/gm, '').replace(/^export /gm, '');
  const context = { createAudioPlayer, setAudioModeAsync, module: { exports: {} } };
  vm.runInNewContext(`${source}\nmodule.exports = { createBundledPlayback, configureForegroundAudio };`, context);
  return context.module.exports;
}

function mockAudioPlayer() {
  let statusListener;
  const calls = { played: 0, paused: 0, removed: 0, unsubscribed: 0 };
  const player = {
    currentStatus: { isLoaded: true, playing: true },
    addListener: (event, callback) => {
      assert.equal(event, 'playbackStatusUpdate');
      statusListener = callback;
      return { remove() { calls.unsubscribed += 1; } };
    },
    play() { calls.played += 1; },
    pause() { calls.paused += 1; },
    release() { calls.removed += 1; },
  };
  return { player, calls, emit: (status) => statusListener(status) };
}

function loadAudioHook(createAudioPlayer, setAudioModeAsync) {
  const focusCleanups = [];
  const effectCleanups = [];
  const values = [];
  const state = [];
  let appStateListener;
  const source = fs.readFileSync('src/hooks/useBundledAudio.js', 'utf8')
    .replace(/^import .*;\r?\n/gm, '').replace('export default function', 'function');
  const context = {
    module: { exports: {} },
    useRef: (value) => ({ current: value }),
    useState: (value) => {
      const index = state.length;
      state.push(value);
      return [value, (next) => { state[index] = next; values.push(next); }];
    },
    useCallback: (callback) => callback,
    useFocusEffect: (callback) => focusCleanups.push(callback()),
    useEffect: (callback) => effectCleanups.push(callback()),
    AppState: { currentState: 'active', addEventListener: (_, callback) => { appStateListener = callback; return { remove() {} }; } },
    ...loadBundledPlayback(createAudioPlayer, setAudioModeAsync),
  };
  vm.runInNewContext(`${source}\nmodule.exports = useBundledAudio;`, context);
  const hook = context.module.exports();
  return {
    hook, values, state,
    blur: () => focusCleanups.forEach((cleanup) => cleanup()),
    background: () => appStateListener('background'),
    unmount: () => [...focusCleanups, ...effectCleanups].forEach((cleanup) => cleanup?.()),
  };
}

test('pending audio setup cannot start after screen blur', async () => {
  let resolveMode;
  let created = 0;
  const { hook, blur } = loadAudioHook(() => { created += 1; }, (mode) => {
    assert.equal(mode.shouldPlayInBackground, false);
    return new Promise((resolve) => { resolveMode = resolve; });
  });
  const playback = hook.toggle('ganesh', 10);
  blur();
  resolveMode();
  await playback;
  assert.equal(created, 0);
});

test('playing audio is released on app background and unmatched chants never play', async () => {
  let created = 0;
  const { player, calls, emit } = mockAudioPlayer();
  const { hook, background, values, state } = loadAudioHook(() => {
    created += 1;
    return player;
  });
  await hook.toggle('chalisa', null);
  assert.equal(created, 0);
  assert.ok(values.some((value) => typeof value === 'string' && value.includes('not available')));
  await hook.toggle('ganesh', 10);
  assert.equal(calls.played, 1);
  assert.equal(state[0], 'ganesh');
  background();
  assert.equal(calls.removed, 1);
  assert.equal(calls.unsubscribed, 1);
  assert.equal(calls.paused, 1);
  const valueCount = values.length;
  emit({ isLoaded: true, playing: true });
  assert.equal(values.length, valueCount, 'released player events must be ignored');
  assert.equal(state[0], null);
});

test('tapping a loading chant again cancels it before its player is created', async () => {
  let resolveMode;
  let created = 0;
  const { hook, state } = loadAudioHook(() => { created += 1; }, () => new Promise((resolve) => { resolveMode = resolve; }));
  const pending = hook.toggle('ganesh', 10);
  assert.equal(state[1], 'ganesh');
  await hook.toggle('ganesh', 10);
  resolveMode();
  await pending;
  assert.equal(created, 0);
  assert.equal(state[1], null);
});

test('only the latest requested chant starts when setup completes out of order', async () => {
  const resolvers = [];
  const sources = [];
  const { player, calls } = mockAudioPlayer();
  const { hook } = loadAudioHook((source) => { sources.push(source); return player; },
    () => new Promise((resolve) => resolvers.push(resolve)));
  const first = hook.toggle('ganesh', 10);
  const second = hook.toggle('shiva', 11);
  resolvers[1]();
  await second;
  resolvers[0]();
  await first;
  assert.deepEqual(sources, [11]);
  assert.equal(calls.played, 1);
});

test('completion, playback failure and unmount all release the audio player', async () => {
  for (const event of ['finished', 'error', 'unmount']) {
    const { player, calls, emit } = mockAudioPlayer();
    const { hook, state, unmount } = loadAudioHook(() => player);
    await hook.toggle('ganesh', 10);
    if (event === 'unmount') unmount();
    else emit(event === 'finished' ? { didJustFinish: true } : { error: 'decoding failed' });
    assert.equal(calls.removed, 1, event);
    assert.equal(calls.unsubscribed, 1, event);
    assert.equal(state[0], null, event);
    if (event === 'error') assert.match(state[2], /could not be played/);
    hook.stop();
    assert.equal(calls.removed, 1, 'repeated stop should be safe');
  }
});

test('a loading failure clears the spinner and ignores a late ready notification', async () => {
  const { player, calls, emit } = mockAudioPlayer();
  player.currentStatus = { isLoaded: false, playing: false, isBuffering: true };
  const { hook, state } = loadAudioHook(() => player);
  await hook.toggle('ganesh', 10);
  assert.equal(state[0], null);
  assert.equal(state[1], 'ganesh');
  emit({ isLoaded: false, playing: false, error: 'Failed to load recording' });
  assert.equal(state[1], null);
  assert.match(state[2], /could not be played/);
  assert.equal(calls.removed, 1);
  emit({ isLoaded: true, playing: true });
  assert.equal(state[0], null);
});

test('audio setup and play exceptions release partially configured players', async () => {
  for (const failure of ['configure', 'play']) {
    const { player, calls } = mockAudioPlayer();
    if (failure === 'configure') player.addListener = () => { throw new Error('setup failed'); };
    else player.play = () => { throw new Error('play failed'); };
    const { hook, state } = loadAudioHook(() => player);
    await hook.toggle('ganesh', 10);
    assert.equal(calls.removed, 1, failure);
    assert.match(state[2], /could not be played/);
  }
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
