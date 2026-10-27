const test = require('node:test');
const assert = require('node:assert/strict');
const { getYearFestivals } = require('./festivals.js');
const { getFeaturedYearFestivals } = require('./featuredFestivals.js');
const { getRegionalFestivalReferences, getPendingRegionalFestivals } = require('./regionalFestivalReferences.js');

test('annual feed includes regional festivals and Christian dates but excludes monthly and political observances', () => {
  const items = getFeaturedYearFestivals({ year: 2026 });
  const keys = new Set(items.map((item) => item.key));
  for (const key of ['new_years_day', 'christmas', 'good_friday', 'easter', 'pongal', 'lohri', 'gudi_padwa', 'vishu', 'puthandu', 'pohela_boishakh', 'bohag_bihu', 'onam', 'varamahalakshmi', 'bathukamma_start', 'karthigai_deepam', 'nag_panchami', 'kartika_purnima']) {
    assert.ok(keys.has(key), `Missing ${key}`);
  }
  for (const key of ['republic_day', 'independence_day', 'gandhi_jayanti', 'sankashti_chaturthi', 'vinayaka_chaturthi', 'masik_shivaratri', 'masik_karthigai', 'pradosha', 'sankranti', 'shravan_somvar', 'mangala_gauri']) {
    assert.ok(!keys.has(key), `Unexpected ${key}`);
  }
  assert.equal(items.find((item) => item.key === 'good_friday').dateISO, '2026-04-03');
  assert.equal(getFeaturedYearFestivals({ year: 2027 }).find((item) => item.key === 'good_friday').dateISO, '2027-03-26');
});

test('only selected named Ekadashis appear in both languages without removing daily calendar observances', () => {
  const selected = new Set(['Nirjala Ekadashi', 'Devshayani Ekadashi', 'Devutthana Ekadashi', 'Mokshada Ekadashi', 'Vaikuntha Ekadashi']);
  const ekadashiRows = (items) => items.filter((item) => /^(smarta_|vaishnava_)?ekadashi$/.test(item.type));
  const english = ekadashiRows(getFeaturedYearFestivals({ year: 2026 }));
  const hindi = ekadashiRows(getFeaturedYearFestivals({ year: 2026, language: 'hi' }));
  assert.deepEqual(new Set(english.map((item) => item.nameEn)), selected);
  assert.deepEqual(hindi.map((item) => [item.id, item.nameEn]), english.map((item) => [item.id, item.nameEn]));
  assert.ok(hindi.every((item) => item.name.includes('एकादशी')));
  assert.ok(!getFeaturedYearFestivals({ year: 2027 }).some((item) => ['vaikuntha_ekadashi', 'bonalu'].includes(item.key)));
  const complete = ekadashiRows(getYearFestivals({ year: 2026 }));
  assert.ok(complete.length > 24);
  assert.ok(complete.some((item) => item.nameEn === 'Yogini Ekadashi'));
});

test('same-day Ekadashi traditions share a card while distinct dates and real festival stages remain separate', () => {
  const items = getFeaturedYearFestivals({ year: 2026 });
  const nirjala = items.filter((item) => item.nameEn === 'Nirjala Ekadashi');
  assert.equal(nirjala.length, 1);
  assert.equal(nirjala[0].name, 'Nirjala Ekadashi');
  assert.deepEqual(new Set(nirjala[0].observances.map((item) => item.type)), new Set(['smarta_ekadashi', 'vaishnava_ekadashi']));
  const devutthana = items.filter((item) => item.nameEn === 'Devutthana Ekadashi');
  assert.deepEqual(devutthana.map((item) => item.dateISO), ['2026-11-20', '2026-11-21']);
  assert.ok(devutthana.some((item) => item.name.endsWith('(Smarta)')));
  assert.ok(devutthana.some((item) => item.name.endsWith('(Vaishnava)')));
  assert.equal(items.filter((item) => item.key.startsWith('chhath_')).length, 4);
  assert.ok(items.some((item) => item.key === 'durga_ashtami'));
  assert.ok(items.some((item) => item.key === 'maha_navami'));
  assert.deepEqual(new Set(items.filter((item) => item.dateISO === '2026-12-20' && ['Mokshada Ekadashi', 'Vaikuntha Ekadashi'].includes(item.nameEn)).map((item) => item.nameEn)), new Set(['Mokshada Ekadashi', 'Vaikuntha Ekadashi']));
});

test('2026 and 2027 regional references retain names, provenance and corrected dates', () => {
  for (const year of [2026, 2027]) {
    const references = getRegionalFestivalReferences(year);
    assert.ok(references.length > 0);
    const english = getFeaturedYearFestivals({ year });
    const hindi = getFeaturedYearFestivals({ year, language: 'hi' });
    for (const reference of references) {
      const occurrence = english.find((item) => item.key === reference.key && item.dateISO === reference.dateISO);
      assert.ok(occurrence, `${year}: ${reference.key}`);
      assert.equal(occurrence.name, reference.nameEn || reference.name);
      assert.equal(occurrence.dateBasis, 'regional-reference');
      assert.equal(occurrence.sourceUrl, reference.sourceUrl);
      assert.equal(occurrence.referenceLocation, reference.referenceLocation);
      assert.equal(hindi.find((item) => item.id === occurrence.id).name, reference.nameHi);
      const expectedDates = references.filter((item) => item.key === reference.key).map((item) => item.dateISO).sort();
      assert.deepEqual(english.filter((item) => item.key === reference.key).map((item) => item.dateISO).sort(), expectedDates);
    }
  }
  assert.deepEqual(getPendingRegionalFestivals(2027).map((item) => item.key), ['bonalu']);
  assert.ok(getPendingRegionalFestivals(2027, 'hi')[0].name.includes('बोनालु'));
  assert.equal(getPendingRegionalFestivals(2026).length, 0);
  const laterYear = getFeaturedYearFestivals({ year: 2028 });
  assert.ok(!laterYear.some((item) => item.dateBasis === 'regional-reference' || item.key.startsWith('raja_') || item.key === 'vaikuntha_ekadashi'));
});

test('featured occurrence IDs are unique and chronologically ordered', () => {
  for (const year of [2026, 2027]) {
    const items = getFeaturedYearFestivals({ year });
    assert.equal(new Set(items.map((item) => item.id)).size, items.length);
    assert.ok(items.every((item) => item.featured && item.dateISO.startsWith(`${year}-`)));
    assert.deepEqual(items.map((item) => item.dateISO), items.map((item) => item.dateISO).sort());
  }
});
