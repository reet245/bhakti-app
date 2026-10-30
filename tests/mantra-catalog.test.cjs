const test = require('node:test');
const assert = require('node:assert/strict');
const { devanagariToRoman, devanagariToBengali, getMantraScript, normalizeSearch, buildSearchText, filterMantras, dailyMantra } = require('../src/features/mantras/catalog.cjs');

const shiva = { id: 'shiva', title: 'Om Namah Shivaya', titleHi: 'शिव पंचाक्षर मंत्र', titleBn: 'শিব পঞ্চাক্ষর মন্ত্র', deityId: 'shiv', categoryId: 'mantras', text: 'ॐ नमः शिवाय', transliteration: 'Oṃ Namaḥ Śivāya', meaningBn: 'শিবের প্রতি প্রণাম।', featured: true };
const gita = { id: 'gita-2-47', title: 'Bhagavad Gita 2.47', deityId: 'krishna', categoryId: 'shlokas', text: 'कर्मण्येवाधिकारस्ते', chapter: 2, verse: 47, reference: 'Bhagavad Gita 2.47', featured: false };
const custom = { id: 'custom-one', title: 'My prayer', deityId: 'shiv', categoryId: 'mantras', text: 'A personal prayer', isCustom: true };
const library = [shiva, gita, custom];

test('Sanskrit rendering preserves vowel signs, conjuncts, danda and verse numbers offline', () => {
  assert.equal(devanagariToRoman('ॐ नमः शिवाय ॥१२॥'), 'oṃ namaḥ śivāya ||12||');
  assert.equal(devanagariToRoman('श्री कृष्ण विद्या'), 'śrī kṛṣṇa vidyā');
  assert.equal(devanagariToBengali('ॐ नमः शिवाय ॥१२॥'), 'ওঁ নমঃ শিবায ॥১২॥');
  assert.equal(getMantraScript(shiva, 'devanagari'), shiva.text);
  assert.equal(getMantraScript(shiva, 'roman'), shiva.transliteration);
  assert.equal(getMantraScript({ ...shiva, textBn: 'Reviewed Bengali-script text' }, 'bengali'), 'Reviewed Bengali-script text');
  assert.equal(getMantraScript(undefined, 'roman'), '');
});

test('personal text is never machine-transformed and explicit pronunciation is honored', () => {
  assert.equal(getMantraScript(custom, 'bengali'), custom.text);
  assert.equal(getMantraScript(custom, 'roman'), custom.text);
  assert.equal(getMantraScript({ ...custom, transliteration: 'My supplied pronunciation' }, 'roman'), 'My supplied pronunciation');
});

test('search finds Sanskrit, Roman diacritics, Hindi and Bengali text and deity metadata', () => {
  const index = { [shiva.id]: buildSearchText(shiva, { englishName: 'Shiva', hindiName: 'शिव जी', bengaliName: 'শিব ঠাকুর' }, { label: 'Mantras', labelHi: 'मंत्र' }) };
  for (const query of ['śivāya', 'sivaya', 'नमः शिवाय', 'शिव पंचाक्षर', 'শিব পঞ্চাক্ষর', 'শিব ঠাকুর', 'ওঁ নমঃ', 'প্রণাম']) {
    assert.deepEqual(filterMantras(library, { query }, index).map((item) => item.id), ['shiva'], query);
  }
  assert.deepEqual(filterMantras(library, { query: 'Gita २.४७' }).map((item) => item.id), [gita.id]);
  assert.deepEqual(filterMantras(library, { query: 'Gita ২.৪৭' }).map((item) => item.id), [gita.id]);
  assert.equal(normalizeSearch('  Oṃ  NAMAḤ  '), 'om namah');
  assert.equal(filterMantras(library, { query: 'not present anywhere' }).length, 0);
});

test('all filters intersect and saved and personal collections stay independent', () => {
  assert.deepEqual(filterMantras(library, { deityId: 'shiv', collection: 'saved', favorites: [shiva.id, gita.id] }).map((item) => item.id), [shiva.id]);
  assert.deepEqual(filterMantras(library, { collection: 'personal' }).map((item) => item.id), [custom.id]);
  assert.deepEqual(filterMantras(library, { collection: 'saved', favorites: [custom.id] }).map((item) => item.id), [custom.id]);
  assert.deepEqual(filterMantras(library, { categoryId: 'shlokas', chapter: '2', query: '2.47' }).map((item) => item.id), [gita.id]);
  assert.equal(filterMantras(library, { categoryId: 'shlokas', chapter: 3 }).length, 0);
  assert.deepEqual(filterMantras([{ ...gita, deityIds: ['krishna', 'vishnu'] }], { deityId: 'vishnu' }).map((item) => item.id), [gita.id]);
});

test('daily reading is stable within a local calendar day and excludes partial/personal texts', () => {
  const candidates = [shiva, { ...gita, featured: true }, { ...custom, featured: true }, { id: 'excerpt', featured: true, isExcerpt: true }];
  const morning = new Date(2026, 9, 28, 0, 1);
  const evening = new Date(2026, 9, 28, 23, 59);
  assert.equal(dailyMantra(candidates, morning).id, dailyMantra(candidates, evening).id);
  assert.notEqual(dailyMantra(candidates, morning).id, dailyMantra(candidates, new Date(2026, 9, 29, 0, 1)).id);
  for (let day = 1; day <= 31; day += 1) assert.ok([shiva.id, gita.id].includes(dailyMantra(candidates, new Date(2026, 9, day)).id));
  assert.equal(dailyMantra([custom, { id: 'excerpt', isExcerpt: true }]), undefined);
  assert.equal(dailyMantra([{ ...gita, featured: false }]).id, gita.id);
});
