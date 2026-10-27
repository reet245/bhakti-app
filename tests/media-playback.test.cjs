const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { parse } = require('@babel/parser');

const pujaSource = fs.readFileSync('src/screens/PujaScreen.js', 'utf8');
const pujaAst = parse(pujaSource, { sourceType: 'module', plugins: ['jsx'] });
const pujaFunctions = pujaAst.program.body.find((node) => node.type === 'ExportDefaultDeclaration')
  .declaration.body.body.filter((node) => node.type === 'FunctionDeclaration');

function playerMock() {
  let listener;
  const counts = { play: 0, pause: 0, remove: 0 };
  const player = {
    currentStatus: { isLoaded: true, playing: true },
    addListener: (_, callback) => { listener = callback; return { remove() {} }; },
    play() { counts.play += 1; },
    pause() { counts.pause += 1; },
    release() { counts.remove += 1; },
  };
  return { player, counts, emit: (status) => listener(status) };
}

function loadPujaAudio(setAudioModeAsync = async () => {}) {
  const players = [];
  const alerts = [];
  const state = {};
  const context = {
    setAudioModeAsync,
    createAudioPlayer: (source) => {
      const playback = { ...playerMock(), source };
      players.push(playback);
      return playback.player;
    },
    selectedDeity: { aartiAudio: 20 },
    deities: [],
    pujaItems: { bell: { audio: 10 } },
    screenActiveRef: { current: true },
    appActiveRef: { current: true },
    bellPlaybackRef: { current: null },
    aartiPlaybackRef: { current: null },
    bellSessionRef: { current: 0 },
    aartiSessionRef: { current: 0 },
    Alert: { alert: (...args) => alerts.push(args) },
  };
  for (const name of ['Flowers', 'DiyaActive', 'AgarbattiActive', 'PrasadVisible', 'BellActive', 'AartiActive']) {
    context[`set${name}`] = (value) => { state[name] = value; };
  }
  const helperSource = fs.readFileSync('src/utils/bundledAudio.js', 'utf8')
    .replace(/^import .*;\r?\n/gm, '').replace(/^export /gm, '');
  const functions = pujaFunctions.filter((node) => ['resetPuja', 'stopBellAudio', 'stopAartiAudio', 'playBellAudio', 'playAartiAudio'].includes(node.id.name))
    .map((node) => pujaSource.slice(node.start, node.end));
  vm.createContext(context);
  vm.runInContext(`${helperSource}\n${functions.join('\n')}`, context);
  return { context, players, alerts, state };
}

test('puja bell loops at its original volume and reset stops both audio players', async () => {
  const { context, players, state } = loadPujaAudio();
  await context.playBellAudio();
  await context.playAartiAudio();
  assert.equal(players[0].source, 10);
  assert.equal(players[0].player.loop, true);
  assert.equal(players[0].player.volume, 0.55);
  assert.equal(players[1].source, 20);
  assert.equal(players[1].player.loop, false);
  assert.equal(players[1].player.volume, 0.75);
  assert.ok(players.every(({ counts }) => counts.play === 1));
  context.resetPuja();
  assert.ok(players.every(({ counts }) => counts.pause === 1 && counts.remove === 1));
  assert.equal(state.BellActive, false);
  assert.equal(state.AartiActive, false);
});

test('reset or app background cancels puja audio while mode setup is pending', async () => {
  for (const cancel of ['reset', 'background', 'blur']) {
    const resolvers = [];
    const { context, players } = loadPujaAudio(() => new Promise((resolve) => resolvers.push(resolve)));
    const pending = [context.playBellAudio(), context.playAartiAudio()];
    if (cancel === 'reset') context.resetPuja();
    if (cancel === 'background') context.appActiveRef.current = false;
    if (cancel === 'blur') context.screenActiveRef.current = false;
    resolvers.forEach((resolve) => resolve());
    await Promise.all(pending);
    assert.equal(players.length, 0, cancel);
  }
});

test('aarti completion and bell load errors stop playback and update the UI', async () => {
  const { context, players, state, alerts } = loadPujaAudio();
  await context.playAartiAudio();
  players[0].emit({ didJustFinish: true });
  assert.equal(state.AartiActive, false);
  assert.equal(players[0].counts.remove, 1);
  await context.playBellAudio();
  players[1].emit({ error: 'unable to decode recording' });
  assert.equal(state.BellActive, false);
  assert.equal(players[1].counts.remove, 1);
  assert.match(alerts[0][1], /bell could not be played/);
  players[1].emit({ error: 'late event from released player' });
  assert.equal(alerts.length, 1);
});

test('a missing aarti recording gives feedback instead of leaving playback active', async () => {
  const { context, players, state, alerts } = loadPujaAudio();
  context.selectedDeity = { aartiAudio: null };
  await context.playAartiAudio();
  assert.equal(players.length, 0);
  assert.equal(state.AartiActive, false);
  assert.match(alerts[0][1], /aarti could not be played/);
});

test('aarti video stays muted and looping, and pauses on background or leaving the screen', () => {
  const component = pujaAst.program.body.find((node) => node.type === 'FunctionDeclaration' && node.id.name === 'AartiVideo');
  const jsxReturn = component.body.body.find((node) => node.type === 'ReturnStatement');
  const componentLifecycle = `${pujaSource.slice(component.start, jsxReturn.start)}\n}`;
  for (const initialState of ['active', 'background']) {
    const { player, counts } = playerMock();
    let focusCleanup;
    let appListener;
    let removedListener = 0;
    const context = {
      useCallback: (callback) => callback,
      useFocusEffect: (callback) => { focusCleanup = callback(); },
      useVideoPlayer: (source, setup) => { assert.equal(source, 30); setup(player); return player; },
      AppState: {
        currentState: initialState,
        addEventListener: (_, callback) => {
          appListener = callback;
          return { remove() { removedListener += 1; } };
        },
      },
    };
    vm.createContext(context);
    vm.runInContext(`${componentLifecycle}\nAartiVideo({ source: 30 });`, context);
    assert.equal(player.loop, true);
    assert.equal(player.muted, true);
    assert.equal(player.staysActiveInBackground, false);
    assert.equal(player.audioMixingMode, 'mixWithOthers');
    assert.equal(counts.play, initialState === 'active' ? 1 : 0);
    appListener('background');
    assert.equal(counts.pause, 1);
    focusCleanup();
    assert.equal(counts.pause, 2);
    assert.equal(removedListener, 1);
  }
});
