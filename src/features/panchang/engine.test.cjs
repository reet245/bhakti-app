const test = require('node:test');
const assert = require('node:assert/strict');
const { calculatePanchang, calculateMonth, getDatePartsInTimezone, formatEvent, clearCalculationCache, MIN_YEAR, MAX_YEAR } = require('./engine.cjs');

const DELHI = { latitude: 28.6139, longitude: 77.209, timezone: 'Asia/Kolkata', locationName: 'New Delhi, India' };
const NEW_YORK = { latitude: 40.7128, longitude: -74.006, timezone: 'America/New_York', locationName: 'New York' };
const day = (year, month, date, location = DELHI) => calculatePanchang({ year, month: month - 1, day: date, ...location });
const withinMinutes = (actual, expected, tolerance) => assert.ok(Math.abs(Date.parse(actual) - Date.parse(expected)) <= tolerance * 60000, `${actual} differs from ${expected} by more than ${tolerance} minutes`);

test('Delhi 23 October 2026 matches a published almanac within declared calculation tolerances', () => {
  // Reference: Drik Panchang, New Delhi day page, accessed 23 October 2026.
  // https://www.drikpanchang.com/panchang/day-panchang.html?date=23/10/2026
  // Reference page selected New Delhi. Different Delhi neighbourhood coordinates
  // and the source's minute rounding are covered by the tolerances below.
  // Published minute-rounded values: sunrise 06:27, sunset 17:44,
  // Dwadashi until 14:35, Purva Bhadrapada 21:02, Dhruva 22:08,
  // Balava 14:35 and Kaulava 02:11 the following day. End times here allow
  // two minutes; source horizon models differ by up to five minutes for Moon events.
  const result = day(2026, 10, 23);
  assert.equal(result.tithi, 'Dwadashi');
  assert.equal(result.tithiHi, 'द्वादशी');
  assert.equal(result.nakshatra, 'Purva Bhadrapada');
  assert.equal(result.yoga, 'Dhruva');
  assert.equal(result.karana, 'Balava');
  assert.equal(result.lunarMonth, 'Ashwina');
  assert.equal(result.vikramSamvat, '2083');
  assert.equal(result.sunRashi, 'Tula');
  assert.equal(result.moonRashi, 'Kumbha');
  withinMinutes(result.raw.sunrise, '2026-10-23T06:27:00+05:30', 1);
  withinMinutes(result.raw.sunset, '2026-10-23T17:44:00+05:30', 1);
  withinMinutes(result.raw.moonrise, '2026-10-23T15:55:00+05:30', 5);
  withinMinutes(result.transitions.tithi[0].end, '2026-10-23T14:35:00+05:30', 2);
  withinMinutes(result.transitions.nakshatra[0].end, '2026-10-23T21:02:00+05:30', 2);
  withinMinutes(result.transitions.yoga[0].end, '2026-10-23T22:08:00+05:30', 2);
  withinMinutes(result.transitions.karana[1].end, '2026-10-24T02:11:00+05:30', 2);
  assert.equal(result.sunrise, '6:27 AM');
  assert.match(result.transitions.karana[1].endTime, /next day/);
  assert.match(result.transitions.karana[1].endTimeHi, /अगले दिन/);
  assert.ok(result.festivals.some((festival) => festival.key === 'pradosha'));
});

test('month/day results preserve both lunar systems and leap months', () => {
  // https://dharmagya.app/docs/panchang/accuracy documents true new-moon
  // bounding for adhika; 2026 Adhika Jyeshtha runs in May–June.
  const leap = day(2026, 5, 20);
  assert.equal(leap.isAdhika, true);
  assert.match(leap.amantaMonth, /Adhika Jyeshtha/);
  assert.match(leap.lunarMonthHi, /अधिक/);
  const darkFortnight = day(2026, 11, 8);
  assert.equal(darkFortnight.purnimantaMonth, 'Kartika');
  assert.equal(darkFortnight.amantaMonth, 'Ashwina');
  assert.equal(darkFortnight.isAdhika, false);
  assert.equal(day(2026, 3, 18).vikramSamvat, '2082');
  // Chaitra Pratipada is skipped at sunrise in Delhi in 2026. The observed
  // new-year date is March 19, not the next morning's sunrise.
  // https://dharmagya.app/docs/panchang/accuracy#festival-day-resolution
  assert.equal(day(2026, 3, 19).vikramSamvat, '2083');
});

test('festival observances use their own time windows instead of sunrise tithi alone', () => {
  // https://www.drikpanchang.com/vrats/ekadashidates.html?year=2026
  // https://www.drikpanchang.com/festivals/diwali/diwali-date-time.html?year=2026
  const ekadashi = day(2026, 10, 22);
  assert.equal(ekadashi.isEkadashi, true);
  assert.ok(ekadashi.festivals.some((festival) => festival.type === 'smarta_ekadashi'));
  const pradosha = day(2026, 10, 23);
  assert.equal(pradosha.tithiNumber, 12);
  assert.ok(pradosha.festivals.some((festival) => festival.type === 'pradosha'));
  const diwali = day(2026, 11, 8);
  assert.equal(diwali.tithiNumber, 14);
  assert.ok(diwali.festivals.some((festival) => festival.key === 'diwali'));
  const ids = diwali.festivals.map((festival) => festival.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(diwali.festivals.every((festival) => festival.nameHi && festival.basis && festival.dateISO === diwali.dateISO));
});

test('actual final anga boundaries are never replaced by the next sunrise', () => {
  const month = calculateMonth({ year: 2026, month: 9, ...DELHI });
  let recoveredBoundaries = 0;
  for (const result of month) {
    for (const entries of Object.values(result.transitions)) {
      assert.equal(entries[0].isActiveAtSunrise, true);
      for (let i = 0; i < entries.length; i += 1) {
        const entry = entries[i];
        assert.ok(Date.parse(entry.start) < Date.parse(entry.end));
        assert.ok(Date.parse(entry.coverageEnd) <= Date.parse(result.raw.nextSunrise));
        if (i > 0) {
          assert.ok(Date.parse(entry.start) >= Date.parse(entries[i - 1].end));
          assert.ok(Date.parse(entry.start) - Date.parse(entries[i - 1].end) < 1000);
        }
        if (entry.continuesAfterNextSunrise) {
          recoveredBoundaries += 1;
          assert.ok(Date.parse(entry.end) > Date.parse(result.raw.nextSunrise));
        }
      }
    }
  }
  assert.ok(recoveredBoundaries > 80);
});

test('IANA DST transitions retain the requested civil date and format each event with its own offset', () => {
  const spring = day(2026, 3, 8, NEW_YORK);
  assert.equal(spring.dateISO, '2026-03-08');
  assert.equal((Date.parse(spring.raw.endOfDay) - Date.parse(spring.raw.startOfDay)) / 3600000, 23);
  assert.equal(spring.sunrise, '7:19 AM');
  const fall = day(2026, 11, 1, NEW_YORK);
  assert.equal((Date.parse(fall.raw.endOfDay) - Date.parse(fall.raw.startOfDay)) / 3600000, 25);
  assert.equal(fall.sunrise, '6:26 AM');
  // This moonrise falls in the 25th civil hour: a 24h search would lose it.
  assert.equal(getDatePartsInTimezone(fall.raw.moonrise, NEW_YORK.timezone).day, 1);
  assert.equal(getDatePartsInTimezone(fall.raw.moonrise, NEW_YORK.timezone).hour, 23);
  for (const result of [spring, fall]) {
    for (const field of ['moonrise', 'moonset']) {
      if (result.raw[field]) {
        assert.ok(Date.parse(result.raw[field]) >= Date.parse(result.raw.startOfDay));
        assert.ok(Date.parse(result.raw[field]) < Date.parse(result.raw.endOfDay));
      }
    }
  }
});

test('muhruta windows are ordered and Wednesday has no Abhijit', () => {
  const wednesday = day(2026, 10, 14);
  assert.equal(wednesday.weekday, 'Wednesday');
  assert.equal(wednesday.abhijitMuhurta, 'Not observed this day');
  assert.equal(wednesday.muhurtas.some((item) => item.key === 'abhijit'), false);
  const tuesday = day(2026, 10, 13);
  assert.ok(tuesday.muhurtas.some((item) => item.key === 'durmuhurta' && item.segment === 'night'));
  for (const result of [wednesday, tuesday]) {
    assert.ok(result.muhurtas.every((item) => Date.parse(item.start) < Date.parse(item.end) && item.nameHi && item.timeHi && item.descriptionHi));
    const rahu = result.muhurtas.find((item) => item.key === 'rahu');
    const duration = Date.parse(result.raw.sunset) - Date.parse(result.raw.sunrise);
    assert.ok(Math.abs((Date.parse(rahu.end) - Date.parse(rahu.start)) * 8 - duration) < 8);
  }
});

test('polar days report missing solar cycles without fabricated tithis or times', () => {
  const polar = { latitude: 78.2232, longitude: 15.6469, timezone: 'Arctic/Longyearbyen' };
  for (const month of [6, 12]) {
    const result = day(2026, month, 21, polar);
    assert.equal(result.isRealData, false);
    assert.equal(result.noSunrise, true);
    assert.equal(result.raw.sunrise, null);
    assert.equal(result.raw.referenceTime, null);
    assert.deepEqual(result.muhurtas, []);
    assert.deepEqual(result.panchakaPeriods, []);
    assert.deepEqual(result.gandaMulaPeriods, []);
    assert.match(result.errorMessage, /no complete sunrise and sunset cycle/);
  }
});

test('Panchak coverage includes an onset after sunrise and clips continuing spells to the Hindu day', () => {
  const onset = day(2026, 10, 21);
  assert.equal(onset.panchaka, false, 'The sunrise snapshot alone must not conceal an onset later that day.');
  assert.equal(onset.panchakaPeriods.length, 1);
  const first = onset.panchakaPeriods[0];
  withinMinutes(first.start, '2026-10-21T07:00:00+05:30', 2);
  assert.equal(first.end, onset.raw.nextSunrise);
  assert.equal(first.clippedStart, false);
  assert.equal(first.clippedEnd, true);
  const middle = day(2026, 10, 22);
  assert.equal(middle.panchakaPeriods[0].start, middle.raw.sunrise);
  assert.equal(middle.panchakaPeriods[0].end, middle.raw.nextSunrise);
  assert.equal(middle.panchakaPeriods[0].clippedStart, true);
  assert.equal(middle.panchakaPeriods[0].clippedEnd, true);
  const ending = day(2026, 10, 25);
  withinMinutes(ending.panchakaPeriods[0].end, '2026-10-25T19:22:00+05:30', 2);
  assert.equal(ending.panchakaPeriods[0].clippedEnd, false);
  assert.deepEqual(day(2026, 10, 26).panchakaPeriods, []);
});

test('Panchak uses the 300-degree boundary, not the start of all Dhanishtha', () => {
  const before = day(2026, 10, 21);
  assert.ok(before.raw.moonLongitude < 300);
  const crossing = new Date(before.panchakaPeriods[0].start);
  const { getSiderealMoonLongitude } = require('panchang-ts');
  const at = getSiderealMoonLongitude(crossing, 'lahiri');
  assert.ok(Math.abs(at - 300) < 0.001);
  assert.ok(getSiderealMoonLongitude(new Date(crossing.getTime() - 60000), 'lahiri') < 300);
  assert.ok(getSiderealMoonLongitude(new Date(crossing.getTime() + 60000), 'lahiri') > 300);
});

test('Gand Mool includes precisely the six classified nakshatras and preserves their real boundaries', () => {
  const month = calculateMonth({ year: 2026, month: 9, ...DELHI });
  const seen = new Set();
  for (const result of month) {
    const expected = result.transitions.nakshatra.filter((entry) => [0, 8, 9, 17, 18, 26].includes(entry.index));
    assert.deepEqual(result.gandaMulaPeriods.map((period) => period.nakshatraIndex), expected.map((entry) => entry.index));
    for (const period of result.gandaMulaPeriods) {
      seen.add(period.nakshatraIndex);
      assert.ok(Date.parse(period.start) >= Date.parse(result.raw.sunrise));
      assert.ok(Date.parse(period.end) <= Date.parse(result.raw.nextSunrise));
      assert.ok(Date.parse(period.start) < Date.parse(period.end));
      assert.ok(period.nameHi && period.nakshatraNameHi && period.timeHi);
      assert.ok(Date.parse(period.actualStart) <= Date.parse(period.start));
      assert.ok(Date.parse(period.actualEnd) >= Date.parse(period.end));
    }
  }
  assert.deepEqual([...seen].sort((a, b) => a - b), [0, 8, 9, 17, 18, 26]);
  // Revati ends and Ashwini begins during the same Hindu day; both belong to
  // Gand Mool and must remain contiguous without inventing an end at midnight.
  const split = day(2026, 10, 25).gandaMulaPeriods;
  assert.deepEqual(split.map((period) => period.nakshatraIndex), [26, 0]);
  assert.ok(Math.abs(Date.parse(split[1].start) - Date.parse(split[0].end)) <= 1);
  assert.deepEqual(day(2026, 10, 13).gandaMulaPeriods, []);
});

test('calendar validation rejects rollover, invalid coordinates/zones and skipped local dates', () => {
  const valid = { year: 2026, month: 9, day: 23, ...DELHI };
  for (const change of [{ year: 1899 }, { year: 2101 }, { month: -1 }, { month: 12 }, { month: 1, day: 30 }, { day: 0 }, { latitude: NaN }, { latitude: 91 }, { longitude: 181 }, { timezone: '' }, { timezone: 'not/a-zone' }]) {
    assert.throws(() => calculatePanchang({ ...valid, ...change }));
  }
  assert.throws(() => day(2011, 12, 30, { latitude: -13.833, longitude: -171.75, timezone: 'Pacific/Apia' }), /does not exist/);
  assert.equal(day(MIN_YEAR, 1, 1).isRealData, true);
  assert.equal(day(MAX_YEAR, 12, 31).isRealData, true);
});

test('month cache is location-sensitive, includes leap day and serializes without Dates', () => {
  clearCalculationCache();
  const input = { year: 2028, month: 1, ...DELHI };
  const february = calculateMonth(input);
  assert.equal(february.length, 29);
  assert.equal(february.at(-1).dateISO, '2028-02-29');
  assert.equal(calculateMonth(input), february);
  const elsewhere = calculateMonth({ ...input, latitude: 19.076, longitude: 72.8777, locationName: 'Mumbai' });
  assert.notEqual(elsewhere[0].sunrise, february[0].sunrise);
  assert.doesNotThrow(() => JSON.parse(JSON.stringify(february)));
});

test('date and time helpers do not depend on the host timezone', () => {
  const local = getDatePartsInTimezone(new Date('2026-10-22T20:00:00Z'), DELHI.timezone);
  assert.deepEqual({ year: local.year, month: local.month, day: local.day }, { year: 2026, month: 9, day: 23 });
  assert.equal(formatEvent('2026-10-23T20:42:31Z', DELHI.timezone, '2026-10-23'), '2:13 AM (next day)');
  assert.equal(formatEvent(null, DELHI.timezone, '2026-10-23'), 'No event this day');
});
