const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { getChristianFestivalDates } = require('./christianFestivals.js');

test('Gregorian Good Friday and Easter agree with official 2026–2028 calendars', () => {
  // USCCB: https://www.usccb.org/resources/2026cal.pdf
  // USNO: https://aa.usno.navy.mil/calculated/observances/christian?year=2027
  // USNO: https://aa.usno.navy.mil/calculated/observances/christian?year=2028
  for (const [year, easterDateISO, goodFridayDateISO] of [
    [2026, '2026-04-05', '2026-04-03'],
    [2027, '2027-03-28', '2027-03-26'],
    [2028, '2028-04-16', '2028-04-14'],
  ]) {
    assert.deepEqual(getChristianFestivalDates(year), { easterDateISO, goodFridayDateISO });
  }
});

test('century boundaries and Good Friday crossing a month boundary are handled', () => {
  for (const [year, easterDateISO, goodFridayDateISO] of [
    [1900, '1900-04-15', '1900-04-13'],
    [2000, '2000-04-23', '2000-04-21'],
    [2018, '2018-04-01', '2018-03-30'],
    [2100, '2100-03-28', '2100-03-26'],
  ]) {
    assert.deepEqual(getChristianFestivalDates(year), { easterDateISO, goodFridayDateISO });
  }
});

test('calendar dates do not shift with the host timezone', () => {
  const modulePath = require.resolve('./christianFestivals.js');
  const script = `const { getChristianFestivalDates } = require(process.argv[1]); process.stdout.write(JSON.stringify(getChristianFestivalDates(2018)));`;
  const expected = JSON.stringify({ easterDateISO: '2018-04-01', goodFridayDateISO: '2018-03-30' });
  for (const timezone of ['Asia/Kolkata', 'America/Los_Angeles', 'Pacific/Kiritimati']) {
    const output = execFileSync(process.execPath, ['-e', script, modulePath], {
      encoding: 'utf8', env: { ...process.env, TZ: timezone },
    });
    assert.equal(output, expected, timezone);
  }
});

test('unsupported years fail instead of producing misleading festival dates', () => {
  for (const year of [1899, 2101, 2026.5, '2026', null, undefined, NaN, Infinity, {}]) {
    assert.throws(() => getChristianFestivalDates(year), RangeError);
  }
});
