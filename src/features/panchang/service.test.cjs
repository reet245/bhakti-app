const test = require('node:test');
const assert = require('node:assert/strict');
const { getPanchangFromAPI, getPanchangMonth, normalizePanchangData } = require('../../services/panchangService.js');
const { getFestivalsForDate } = require('./festivals.js');

const DELHI = { latitude: 28.6139, longitude: 77.209, timezone: 'Asia/Kolkata', locationName: 'New Delhi, India' };
const options = (month, day, year = 2026) => ({ ...DELHI, year, month: month - 1, day });

test('daily service keeps Hindi names, art identity and deity for canonical observances', async () => {
  const result = await getPanchangFromAPI(options(10, 23));
  const pradosha = result.festivals.find((item) => item.key === 'pradosha');
  assert.ok(pradosha);
  assert.equal(pradosha.nameHi, 'प्रदोष व्रत');
  assert.equal(pradosha.deityId, 'shiv');
  assert.match(pradosha.basis, /evening/);
  assert.ok(result.calendarMarkers.some((marker) => marker.id === pradosha.id && marker.labelHi === pradosha.nameHi));
  assert.equal(result.isFast, true);
  assert.ok(result.recommendedPuja);
});

test('annual verified corrections are reflected in every daily marker and summary', async () => {
  const observed = await getPanchangFromAPI(options(10, 25));
  const shifted = await getPanchangFromAPI(options(10, 26));
  const festival = observed.festivals.find((item) => item.key === 'sharad_purnima');
  assert.ok(festival);
  assert.equal(festival.dateBasis, 'verified-reference');
  assert.ok(observed.observances.some((item) => item.key === 'sharad_purnima'));
  assert.ok(observed.calendarMarkers.some((marker) => marker.id === festival.id));
  assert.ok(!shifted.festivals.some((item) => item.key === 'sharad_purnima'));
  assert.ok(!shifted.observances.some((item) => item.key === 'sharad_purnima'));
  assert.ok(!shifted.calendarMarkers.some((marker) => marker.id.endsWith(':sharad_purnima')));
  assert.ok(!shifted.festival.includes('Sharad'));
  assert.deepEqual(observed.festivals.map((item) => item.id), getFestivalsForDate({ ...DELHI, dateISO: '2026-10-25' }).map((item) => item.id));
});

test('civil holidays and future-year dates agree across month and daily views', async () => {
  const future = await getPanchangFromAPI(options(1, 26, 2027));
  assert.ok(future.festivals.some((item) => item.key === 'republic_day' && item.dateISO === '2027-01-26'));
  assert.ok(future.calendarMarkers.some((item) => item.labelHi === 'गणतंत्र दिवस'));
  const month = await getPanchangMonth({ ...DELHI, year: 2027, month: 0 });
  assert.equal(month.length, 31);
  assert.deepEqual(month[25].festivals, future.festivals);
});

test('empty calculated festival lists remain empty instead of acquiring stale bundled dates', () => {
  const empty = normalizePanchangData({ festivals: [], calendarMarkers: [], isFestival: false, isRealData: true }, { year: 2026, month: 9, day: 26 });
  assert.deepEqual(empty.festivals, []);
  assert.deepEqual(empty.calendarMarkers, []);
  assert.equal(empty.isFestival, false);
});

test('cancelled requests reject before doing calculation work', async () => {
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(getPanchangFromAPI({ ...options(10, 23), signal: controller.signal }), { name: 'AbortError' });
  await assert.rejects(getPanchangMonth({ ...options(10, 23), signal: controller.signal }), { name: 'AbortError' });
});
