const test = require('node:test');
const assert = require('node:assert/strict');
const { mergeMonthPeriods, formatPeriodBoundary } = require('./periods.js');
const { calculateMonth } = require('./engine.cjs');

const slice = (start, end, clippedStart = false, clippedEnd = false, key = 'panchaka') => ({ key, name: 'Panchak', nameHi: 'पंचक', start, end, clippedStart, clippedEnd });
const daily = (...periods) => ({ panchakaPeriods: periods });

test('monthly summary merges sunrise slices, tolerates 1ms boundaries and preserves true outer events', () => {
  const days = [
    daily(slice('2026-10-21T01:31:00Z', '2026-10-22T01:00:00Z', false, true)),
    daily(slice('2026-10-22T01:00:00.001Z', '2026-10-23T01:00:00Z', true, true)),
    daily(slice('2026-10-23T01:00:00.001Z', '2026-10-25T13:53:00Z', true, false)),
  ];
  const original = JSON.stringify(days);
  const result = mergeMonthPeriods(days, 'panchakaPeriods');
  assert.equal(result.length, 1);
  assert.equal(result[0].start, '2026-10-21T01:31:00.000Z');
  assert.equal(result[0].end, '2026-10-25T13:53:00.000Z');
  assert.equal(result[0].clippedStart, false);
  assert.equal(result[0].clippedEnd, false);
  assert.equal(JSON.stringify(days), original);
});

test('clipped month edges remain clipped and separate spells or different kinds never merge', () => {
  const result = mergeMonthPeriods([
    daily(slice('2026-10-01T01:00:00Z', '2026-10-02T01:00:00Z', true, true)),
    daily(slice('2026-10-02T01:00:00Z', '2026-10-03T03:00:00Z', true, false)),
    daily(slice('2026-10-30T05:00:00Z', '2026-11-01T01:00:00Z', false, true)),
    daily(slice('2026-11-01T01:00:00Z', '2026-11-01T03:00:00Z', false, false, 'ganda-mula')),
  ], 'panchakaPeriods');
  assert.equal(result.length, 3);
  assert.equal(result[0].clippedStart, true);
  assert.equal(result[0].clippedEnd, false);
  assert.equal(result[1].clippedStart, false);
  assert.equal(result[1].clippedEnd, true);
  assert.equal(result[2].key, 'ganda-mula');
  assert.deepEqual(mergeMonthPeriods([{}, daily(slice('bad', 'also bad')), daily(slice('2026-10-01', '2026-10-01'))], 'panchakaPeriods'), []);
});

test('overlapping duplicate coverage cannot shorten a spell or erase a known true end', () => {
  const result = mergeMonthPeriods([
    daily(slice('2026-10-21T01:31:00Z', '2026-10-25T13:53:00Z')),
    daily(slice('2026-10-22T01:00:00Z', '2026-10-23T01:00:00Z', true, true)),
  ], 'panchakaPeriods');
  assert.equal(result.length, 1);
  assert.equal(result[0].end, '2026-10-25T13:53:00.000Z');
  assert.equal(result[0].clippedEnd, false);
});

test('Delhi October 2026 Panchak aggregates into the October 21–25 reference spell', () => {
  const days = calculateMonth({ year: 2026, month: 9, latitude: 28.6139, longitude: 77.209, timezone: 'Asia/Kolkata', locationName: 'New Delhi' });
  const result = mergeMonthPeriods(days, 'panchakaPeriods');
  assert.equal(result.length, 1);
  // Reference window: about 07:00 IST on 21 October through 19:23 IST on 25 October.
  assert.ok(Math.abs(Date.parse(result[0].start) - Date.parse('2026-10-21T07:00:00+05:30')) < 2 * 60000);
  assert.ok(Math.abs(Date.parse(result[0].end) - Date.parse('2026-10-25T19:23:00+05:30')) < 2 * 60000);
  assert.equal(result[0].clippedStart, false);
  assert.equal(result[0].clippedEnd, false);
  assert.ok(days.filter((day) => day.panchakaPeriods.length).length >= 5);
});

test('period boundaries use the selected timezone and round across midnight correctly', () => {
  const instant = '2026-10-21T18:29:40Z';
  assert.match(formatPeriodBoundary(instant, 'Asia/Kolkata'), /22 Oct 2026/);
  assert.match(formatPeriodBoundary(instant, 'America/New_York'), /21 Oct 2026/);
  assert.match(formatPeriodBoundary(instant, 'Asia/Kolkata', 'hi-IN'), /अक्तू|अक्टू/);
});
