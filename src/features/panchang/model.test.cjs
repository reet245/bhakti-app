const test = require('node:test');
const assert = require('node:assert/strict');
const { parseLocalDate, dateISO, shiftMonth, validCoordinates, validTimezone } = require('./date.js');
const { mapBackendPanchang, assertBackendPanchangData, getFallbackPanchangData, getFestivalItems } = require('./model.js');
const parts = { year: 2026, month: 9, day: 23 };

test('calendar date-only selection stays on the requested day west of UTC', () => {
  const previous = process.env.TZ;
  process.env.TZ = 'America/Los_Angeles';
  try {
    assert.equal(dateISO(parseLocalDate('2026-10-23')), '2026-10-23');
    assert.equal(parseLocalDate('2026-10-23').getDate(), 23);
  } finally { if (previous) process.env.TZ = previous; else delete process.env.TZ; }
});

test('month navigation keeps the selected day within the actual target month', () => {
  assert.equal(dateISO(shiftMonth(new Date(2026, 0, 31, 12), 1)), '2026-02-28');
  assert.equal(dateISO(shiftMonth(new Date(2024, 0, 31, 12), 1)), '2024-02-29');
  assert.equal(dateISO(shiftMonth(new Date(2026, 0, 15, 12), -1)), '2025-12-15');
});

test('coordinate validation preserves zero and rejects NaN, infinity and missing values', () => {
  assert.equal(validCoordinates(0, 0), true);
  for (const [lat, lon] of [[NaN, 0], [0, Infinity], [null, 0], ['', 0], [0, 181]]) assert.equal(validCoordinates(lat, lon), false);
  assert.equal(validTimezone('America/New_York'), true);
  assert.equal(validTimezone('+05:30'), false);
});

test('partial provider data stays usable without inventing missing values', () => {
  const response = { date: '2026-10-23', tithiName: 'Purnima', timezone: 'America/New_York', locationName: 'New York', isRealData: true, partial: true, missingFields: ['sunrise'] };
  assert.doesNotThrow(() => assertBackendPanchangData(response));
  const mapped = mapBackendPanchang(response, parts);
  assert.equal(mapped.tithi, 'Purnima');
  assert.equal(mapped.sunrise, 'Unavailable');
  assert.equal(mapped.timezone, 'America/New_York');
  assert.equal(mapped.partial, true);
  assert.equal(mapped.isPurnima, true);
  assert.equal(mapped.isAmavasya, false);
  assert.deepEqual(mapped.muhurtas, []);
});

test('empty provider responses fail and offline data never pretends to be real', () => {
  assert.throws(() => assertBackendPanchangData({}), /unavailable/);
  const fallback = getFallbackPanchangData(parts);
  assert.equal(fallback.isRealData, false);
  assert.equal(fallback.isPurnima, false);
  assert.equal(fallback.tithi, 'Unavailable');
});

test('observance flags reflect supplied tithi rather than fixed false defaults', () => {
  assert.equal(mapBackendPanchang({ tithiName: 'Amavasya' }, parts).isAmavasya, true);
  assert.equal(mapBackendPanchang({ tithiName: 'Shukla Ekadashi' }, parts).isEkadashi, true);
  assert.equal(mapBackendPanchang({ tithiName: 'Dwitiya' }, parts).isEkadashi, false);
});

test('Panchang festival lists use actual library dates and never repeat expired years', () => {
  assert.ok(getFestivalItems('2026-01-01').some((item) => item.id === 'new-years-day'));
  assert.ok(getFestivalItems('2026-10-23', true).every((item) => item.dateISO > '2026-10-23'));
  assert.deepEqual(getFestivalItems('2027-01-01', true), []);
});
