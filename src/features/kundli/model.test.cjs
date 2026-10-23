const test = require('node:test');
const assert = require('node:assert/strict');
const { INITIAL_FORM, parseBirthDate, parseBirthTime, birthFormError, buildKundliRequest, normalizeKundliData } = require('./model.js');
const today = new Date(2026, 9, 23, 12);
const form = { ...INITIAL_FORM, name: 'Example', date: '2000-07-23', time: '7:30 AM', place: 'New York', latitude: 40.71, longitude: -74.01, timezone: 'America/New_York' };

test('birth date and time start empty and require explicit user entry', () => {
  assert.equal(INITIAL_FORM.date, '');
  assert.equal(INITIAL_FORM.time, '');
  assert.match(birthFormError(INITIAL_FORM, false, 2, today), /valid birth date/);
});

test('birth dates reject impossible leap days and future dates', () => {
  assert.equal(parseBirthDate('2024-02-29'), '2024-02-29');
  assert.equal(parseBirthDate('2023-02-29'), null);
  assert.equal(parseBirthDate('31/04/2000'), null);
  assert.equal(parseBirthDate('23 July 2000'), '2000-07-23');
  assert.match(birthFormError({ ...form, date: '2026-10-24' }, false, 2, today), /before today/);
});

test('birth time converts noon and midnight and rejects invalid clock values', () => {
  assert.equal(parseBirthTime('12:00 AM', false), '00:00');
  assert.equal(parseBirthTime('12:00 PM', false), '12:00');
  assert.equal(parseBirthTime('23:59', false), '23:59');
  assert.equal(parseBirthTime('24:00', false), null);
  assert.equal(parseBirthTime('7:60 AM', false), null);
  assert.equal(parseBirthTime('00:30 AM', false), null);
});

test('edited form fields and birthplace IANA zone reach the calculation request', () => {
  const request = buildKundliRequest({ ...form, date: '1994-11-06', time: '6:45 PM' }, false, today);
  assert.equal(request.birthDate, '1994-11-06');
  assert.equal(request.birthTime, '18:45');
  assert.equal(request.timezone, 'America/New_York');
  assert.equal(request.longitude, -74.01);
  assert.equal(request.unknownTime, false);
});

test('unknown time is explicit and sends null rather than a sample clock time', () => {
  const request = buildKundliRequest({ ...form, time: '' }, true, today);
  assert.equal(request.birthTime, null);
  assert.equal(request.unknownTime, true);
  assert.throws(() => buildKundliRequest({ ...form, time: '' }, false, today), /birth time/);
});

test('invalid coordinates and numeric current timezone offsets cannot generate a chart', () => {
  for (const invalid of [{ latitude: NaN }, { longitude: Infinity }, { latitude: 91 }, { longitude: '' }, { timezone: '+05:30' }, { timezone: 'Invented/Zone' }]) {
    assert.throws(() => buildKundliRequest({ ...form, ...invalid }, false, today), /birthplace/);
  }
});

test('D9 and predictions from the active backend schema remain available in results', () => {
  const data = normalizeKundliData({
    charts: { d1: { houses: [{ house: 1, sign: 'Aries', lord: 'Mars', planets: ['Sun'] }] }, d9: { houses: [{ house: 1, sign: 'Leo', planets: ['Moon'] }] } },
    predictions: [{ category: 'career', title: 'Career', text: 'Provider interpretation.' }],
    dasha: { timeline: [{ mahaDasha: 'Moon', antarDasha: 'Sun', startDate: '2026-01-01', endDate: '2027-01-01' }] },
  });
  assert.equal(data.houses[0].sign, 'Aries');
  assert.equal(data.d9Houses[0].sign, 'Leo');
  assert.equal(data.predictions[0].text, 'Provider interpretation.');
  assert.match(data.dashaTimeline[0], /2026-01-01/);
  assert.match(data.houses[0].detail, /Mars/);
  assert.match(data.doshas[0].status, /Unavailable/);
});

test('unknown-time results never present the provider approximation as a known birth time', () => {
  const data = normalizeKundliData({ profile: { birthTime: '12:00' }, calculationMeta: { precision: 'APPROXIMATE_UNKNOWN_BIRTH_TIME' } });
  assert.equal(data.profile.birthTime, 'Birth time unknown');
  assert.deepEqual(data.dashaTimeline, []);
});
