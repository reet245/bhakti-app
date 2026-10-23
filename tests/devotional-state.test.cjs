const test = require('node:test');
const assert = require('node:assert/strict');
const { sanitizeSession, activeElapsedMs, pauseSession } = require('../src/utils/jaapModel.cjs');

test('restored Jaap progress stays paused and rejects invalid counters', () => {
  assert.deepEqual(sanitizeSession({ count: -2, elapsedMs: -100, runningSince: 20 }), { count: 0, elapsedMs: 0, runningSince: null });
  assert.equal(sanitizeSession({ count: NaN, elapsedMs: Infinity }).count, 0);
  assert.deepEqual(sanitizeSession({ count: 21, elapsedMs: 1200, runningSince: 20 }), { count: 21, elapsedMs: 1200, runningSince: null });
});

test('Jaap elapsed time advances without taps and freezes while paused', () => {
  const active = { count: 1, elapsedMs: 500, runningSince: 1000 };
  assert.equal(activeElapsedMs(active, 4000), 3500);
  const paused = pauseSession(active, 4000);
  assert.equal(activeElapsedMs(paused, 9000), 3500);
  assert.equal(paused.runningSince, null);
});

test('dark devotional palette replaces cream surfaces and brown text while retaining gold actions', () => {
  const { themeDevotionalStyle } = require('../src/utils/devotionalTheme.cjs');
  const theme = { card: '#1a2240', background: '#0f1528', cardAlt: '#16213e', text: '#e0d7ff', textSecondary: '#c8c0e0', accent: '#e8b849' };
  const original = { backgroundColor: 'rgba(255, 250, 239, 0.96)', color: '#3F2713', padding: 16 };
  assert.deepEqual(themeDevotionalStyle(original, theme, 'card'), { backgroundColor: theme.card, color: theme.text, padding: 16 });
  assert.equal(original.color, '#3F2713');
  assert.equal(themeDevotionalStyle({ backgroundColor: 'rgba(255, 247, 228, 0.68)' }, theme, 'overlay').backgroundColor, theme.background);
  assert.equal(themeDevotionalStyle({ backgroundColor: '#C9911E', color: '#FFF8E8' }, theme, 'button').backgroundColor, '#C9911E');
});

test('LocationPicker button foreground and surface remain a readable pair in dark mode', () => {
  const fs = require('node:fs');
  const { themeDevotionalStyle } = require('../src/utils/devotionalTheme.cjs');
  const source = fs.readFileSync('src/features/panchang/LocationPicker.js', 'utf8');
  const surface = /button:\s*\{[^}]*backgroundColor: '([^']+)'/.exec(source)[1];
  const foreground = /buttonText:\s*\{[^}]*color: '([^']+)'/.exec(source)[1];
  const theme = { card: '#1a2240', textSecondary: '#c8c0e0', text: '#e0d7ff' };
  const background = themeDevotionalStyle({ backgroundColor: surface }, theme, 'button').backgroundColor;
  const color = themeDevotionalStyle({ color: foreground }, theme, 'buttonText').color;
  const luminance = (hex) => {
    const rgb = hex.slice(1).match(/../g).map((part) => parseInt(part, 16) / 255).map((part) => part <= 0.04045 ? part / 12.92 : ((part + 0.055) / 1.055) ** 2.4);
    return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
  };
  const a = luminance(background); const b = luminance(color);
  assert.ok((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) >= 4.5);
});
