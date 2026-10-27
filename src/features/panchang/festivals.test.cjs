const test = require('node:test');
const assert = require('node:assert/strict');
const { enrichFestival, getYearFestivals, getFestivalDateNote, getFestivalsForDate } = require('./festivals.js');

test('festival artwork and stories never replace a calculated future date', () => {
  const festival = enrichFestival({ key: 'krishna_janmashtami', name: 'Krishna Janmashtami', type: 'major' }, { dateISO: '2027-08-25' });
  assert.equal(festival.dateISO, '2027-08-25');
  assert.equal(festival.id, '2027-08-25:krishna_janmashtami');
  assert.equal(festival.storyId, 'janmashtami');
  assert.equal(festival.imageKey, 'janmashtami');
  assert.ok(festival.story.includes('Vasudeva'));
});

test('annual dates match published Delhi 2026 and 2027 festival examples', () => {
  const year2026 = getYearFestivals({ year: 2026 });
  for (const [key, expected] of [['krishna_janmashtami', '2026-09-04'], ['diwali', '2026-11-08'], ['govardhan_puja', '2026-11-10'], ['bhai_dooj', '2026-11-11']]) {
    assert.equal(year2026.find((item) => item.key === key).dateISO, expected);
  }
  const year2027 = getYearFestivals({ year: 2027 });
  assert.equal(year2027.find((item) => item.key === 'diwali').dateISO, '2027-10-29');
  assert.equal(year2027.find((item) => item.key === 'krishna_janmashtami').dateISO, '2027-08-25');
  assert.ok(year2027.every((item) => item.dateISO.startsWith('2027-')));
  assert.ok(!year2027.some((item) => item.key === 'mahavir_jayanti'));
});

test('Hindi labels and location metadata survive enrichment, with stable occurrence keys', () => {
  const hindi = getYearFestivals({ year: 2026, language: 'hi' }).find((item) => item.key === 'bhai_dooj');
  assert.equal(hindi.name, 'भाई दूज');
  assert.equal(hindi.id, '2026-11-11:bhai_dooj');
  assert.ok(getFestivalDateNote(hindi, 'hi').includes('New Delhi'));
  assert.equal(hindi.storyLanguage, 'en');
  const english = getYearFestivals({ year: 2026 }).find((item) => item.key === 'bhai_dooj');
  assert.equal(english.nameHi, 'भाई दूज');
  assert.ok(english.descriptionHi);
});

test('date-only values remain in the selected timezone west of UTC', () => {
  const location = { latitude: 40.7128, longitude: -74.006, timezone: 'America/New_York', locationName: 'New York' };
  const rows = getYearFestivals({ year: 2027, ...location });
  assert.ok(rows.every((item) => item.dateISO.startsWith('2027-')));
  assert.equal(rows.find((item) => item.key === 'christmas').dateISO, '2027-12-25');
  assert.equal(rows.find((item) => item.key === 'diwali').locationName, 'New York');
});

test('verified Delhi Sharad Purnima correction agrees across day and year without leaking to other cities', () => {
  const festival = getYearFestivals({ year: 2026 }).find((item) => item.key === 'sharad_purnima');
  assert.equal(festival.dateISO, '2026-10-25');
  assert.equal(festival.dateBasis, 'verified-reference');
  assert.ok(festival.sourceUrl.includes('drikpanchang.com'));
  assert.ok(getFestivalsForDate({ dateISO: '2026-10-25' }).some((item) => item.key === 'sharad_purnima'));
  assert.ok(!getFestivalsForDate({ dateISO: '2026-10-26' }).some((item) => item.key === 'sharad_purnima'));
  const mumbai = getYearFestivals({ year: 2026, latitude: 19.076, longitude: 72.8777, locationName: 'Mumbai' }).find((item) => item.key === 'sharad_purnima');
  assert.equal(mumbai.dateBasis, 'calculated');
  const newYork = getYearFestivals({ year: 2026, latitude: 40.7128, longitude: -74.006, timezone: 'America/New_York' }).find((item) => item.key === 'sharad_purnima');
  assert.equal(newYork.dateBasis, 'calculated');
  assert.ok(!getYearFestivals({ year: 2026 }).some((item) => item.key.startsWith('raja_')));
});

test('invalid inputs fail and annual results cannot be mutated by callers', () => {
  assert.throws(() => getYearFestivals({ year: 2101 }));
  assert.throws(() => getYearFestivals({ year: 2027, latitude: null }));
  assert.throws(() => getYearFestivals({ year: 2027, timezone: 'not/a-zone' }));
  const result = getYearFestivals({ year: 2027 });
  assert.ok(Object.isFrozen(result));
  assert.ok(Object.isFrozen(result[0]));
});

test('sampled 2027 Delhi observances use published dates consistently without global overrides', () => {
  const corrections = [
    ['holika_dahan', '2027-03-21', '2027-03-22'],
    ['holi', '2027-03-22', '2027-03-23'],
    ['mahalaya_amavasya', '2027-09-29', '2027-09-30'],
    ['sharad_purnima', '2027-10-14', '2027-10-15'],
  ];
  for (const [key, published, computed] of corrections) {
    const event = getYearFestivals({ year: 2027 }).find((item) => item.key === key);
    assert.equal(event.dateISO, published);
    assert.equal(event.computedDateISO, computed);
    assert.equal(event.dateBasis, 'verified-reference');
    assert.ok(event.sourceUrl.endsWith('year=2027'));
    assert.ok(getFestivalsForDate({ dateISO: published }).some((item) => item.key === key));
    assert.ok(!getFestivalsForDate({ dateISO: computed }).some((item) => item.key === key));
  }
  const mumbai = getYearFestivals({ year: 2027, latitude: 19.076, longitude: 72.8777, locationName: 'Mumbai' });
  assert.ok(mumbai.filter((item) => corrections.some(([key]) => key === item.key)).every((item) => item.dateBasis === 'calculated'));
});

test('Ekadashi names follow lunar month and paksha, including adhika and a deferred Vaishnava day', () => {
  // Published Delhi 2026 calendar: names sampled from both pakshas, adhika,
  // year rollover and the distinct Smarta/Vaishnava days.
  const examples = [
    ['2026-01-14', 'Shattila', 'षटतिला'], ['2026-01-29', 'Jaya', 'जया'],
    ['2026-02-13', 'Vijaya', 'विजया'], ['2026-03-15', 'Papamochani', 'पापमोचनी'],
    ['2026-05-27', 'Padmini', 'पद्मिनी'], ['2026-06-11', 'Parama', 'परमा'],
    ['2026-06-25', 'Nirjala', 'निर्जला'], ['2026-07-10', 'Yogini', 'योगिनी'],
    ['2026-07-11', 'Yogini', 'योगिनी'], ['2026-10-22', 'Papankusha', 'पापांकुशा'],
    ['2026-11-05', 'Rama', 'रमा'], ['2026-12-04', 'Utpanna', 'उत्पन्ना'],
    ['2027-01-03', 'Saphala', 'सफला'],
  ];
  for (const [dateISO, name, nameHi] of examples) {
    const rows = getFestivalsForDate({ dateISO }).filter((item) => item.type.includes('ekadashi'));
    assert.ok(rows.length, dateISO);
    for (const row of rows) {
      assert.ok(row.name.startsWith(`${name} Ekadashi`), `${dateISO}: ${row.name}`);
      assert.ok(row.nameHi.startsWith(`${nameHi} एकादशी`), `${dateISO}: ${row.nameHi}`);
      assert.equal(row.nameBasis, 'lunar-month-and-paksha');
    }
  }
  const amanta = getYearFestivals({ year: 2026, masaSystem: 'amanta', language: 'hi' }).find((item) => item.dateISO === '2026-01-14' && item.type === 'smarta_ekadashi');
  assert.equal(amanta.name, 'षटतिला एकादशी (स्मार्त)');
  assert.equal(amanta.description, 'षटतिला एकादशी');
});

test('enrichment does not repeat Smarta or Vaishnava labels', () => {
  for (const name of ['Smarta Ekadashi', 'Shattila Ekadashi (Smarta)']) {
    assert.equal(enrichFestival({ key: 'smarta_ekadashi', type: 'smarta_ekadashi', name }).name, name);
  }
  const hindi = enrichFestival({ key: 'vaishnava_ekadashi', type: 'vaishnava_ekadashi', nameHi: 'षटतिला एकादशी (वैष्णव)' }, { language: 'hi' });
  assert.equal(hindi.name, 'षटतिला एकादशी (वैष्णव)');
  assert.equal(hindi.nameHi, hindi.name);
});

test('Christian holidays recur correctly beyond the old 2026 reference year in both languages', () => {
  for (const language of ['en', 'hi']) {
    const rows = getYearFestivals({ year: 2027, language });
    const friday = rows.filter((item) => item.key === 'good_friday');
    assert.equal(friday.length, 1);
    assert.equal(friday[0].dateISO, '2027-03-26');
    assert.equal(friday[0].name, language === 'hi' ? 'गुड फ्राइडे' : 'Good Friday');
    assert.equal(friday[0].dateBasis, 'gregorian-computus');
    assert.equal(rows.find((item) => item.key === 'easter').dateISO, '2027-03-28');
    assert.equal(rows.find((item) => item.key === 'new_years_day').dateISO, '2027-01-01');
    assert.equal(rows.find((item) => item.key === 'christmas').dateISO, '2027-12-25');
  }
  assert.match(getFestivalDateNote({ dateBasis: 'gregorian-computus' }), /Gregorian/);
});
