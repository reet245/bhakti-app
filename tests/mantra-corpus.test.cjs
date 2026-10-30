const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');

const corpus = require('../src/data/mantra-corpus/library.json');
const manifest = require('../src/data/mantra-corpus/manifest.json');
const sources = require('../src/data/mantra-corpus/sources.json');
const nityaManifest = require('../src/data/mantra-corpus/nitya-manifest.json');
const nityaSources = require('../src/data/mantra-corpus/nitya-sources.json');
const originalSummaries = require('../src/data/mantra-corpus/summaries.json');
const selectedGitaSummaries = require('../src/data/mantra-corpus/gita-summaries.json');
const stats = require('../src/data/mantra-corpus/stats.json');
const catalog = require('../src/features/mantras/catalog.cjs');

// The bundled edition uses 34 verses in chapter 13 (700 verses in all).
// Keep this independent of the importer's own validation constants.
const GITA_CHAPTER_COUNTS = [47, 72, 43, 42, 29, 47, 30, 28, 34, 42, 55, 20, 34, 27, 20, 24, 28, 78];
const LEGACY_MANTRA_IDS = [
  'om-namah-shivaya', 'maha-mrityunjaya', 'shiv-aarti', 'ganesh-vakratunda',
  'ganesh-aarti', 'hanuman-chalisa', 'hanuman-kavach', 'durga-stuti',
  'durga-aarti', 'lakshmi-mantra', 'krishna-bhajan', 'ram-raksha', 'saraswati-vandana',
];

function loadData(relativeFile, bindings, exportedNames) {
  const filename = path.resolve(__dirname, '..', relativeFile);
  const source = fs.readFileSync(filename, 'utf8')
    .replace(/^import .*;\r?\n/gm, '')
    .replace(/^export /gm, '');
  const context = {
    ...bindings,
    module: { exports: {} },
    require(assetPath) {
      assert.match(assetPath, /\.(?:png|jpe?g|webp|mp3|wav)$/i, 'Only native asset imports are stubbed');
      const absolutePath = path.resolve(path.dirname(filename), assetPath);
      assert.ok(fs.existsSync(absolutePath), `Missing bundled asset: ${assetPath}`);
      return absolutePath;
    },
  };
  vm.runInNewContext(`${source}\nmodule.exports = { ${exportedNames.join(', ')} };`, context, { filename });
  return context.module.exports;
}

test('bundled Gita contains all 700 verses in chapter order without gaps or duplicate verse labels', () => {
  const gita = corpus.filter((item) => item.collectionId === 'bhagavad-gita');
  assert.equal(gita.length, 700);
  const expectedIds = GITA_CHAPTER_COUNTS.flatMap((count, index) => (
    Array.from({ length: count }, (_, verseIndex) => `gita-${index + 1}-${verseIndex + 1}`)
  ));
  assert.deepEqual(gita.map((item) => item.id), expectedIds);

  for (let chapter = 1; chapter <= GITA_CHAPTER_COUNTS.length; chapter += 1) {
    const verses = gita.filter((item) => item.chapter === chapter);
    assert.equal(verses.length, GITA_CHAPTER_COUNTS[chapter - 1], `Chapter ${chapter}`);
    for (const [index, item] of verses.entries()) {
      assert.equal(item.verse, index + 1, item.id);
      assert.equal(item.reference, `Bhagavad Gita ${chapter}.${index + 1}`, item.id);
      const labels = Array.from(item.text.matchAll(/॥\s*([0-9]+)\.([0-9]+)\s*॥/g));
      assert.equal(labels.length, 1, `${item.id}: exactly one verse label`);
      assert.equal(labels[0][1], String(chapter), item.id);
      assert.equal(labels[0][2], String(index + 1), item.id);
      assert.ok(item.text.endsWith(labels[0][0]), `${item.id}: no trailing commentary`);
      const verseLineCount = item.text.split('\n').filter((line) => line.trim()).length;
      assert.ok([2, 4].includes(verseLineCount), `${item.id}: preserve the complete two-line or four-line verse`);
      // Conservative metrical sanity check, independent of the importer: this
      // edition's complete verses contain at least 31 Sanskrit syllables.
      // This is a truncation detector, not a scholarly assessment of metre.
      const syllables = Array.from(item.text.matchAll(/[अआइईउऊऋॠऌॡएऐओऔ]|[क-हळ](?!़?्)/gu)).length;
      assert.ok(syllables >= 30, `${item.id}: unusually short verse (${syllables} syllables)`);
      assert.doesNotMatch(item.text, /^(?:श्रीभगवान्?\s*उवाच|सञ्जय उवाच|धृतराष्ट्र उवाच|अर्जुन उवाच)\s*[।॥:]?\s*$|अध्याय|श्रीपरमात्मने|^इति श्रीमद्भगवद्गीता/m, `${item.id}: root verse only`);
    }
  }
  // "Said" can also occur inside a verse, so removing every line containing
  // उवाच would silently delete half of 1.25 while leaving verse counts intact.
  assert.match(gita.find((item) => item.id === 'gita-1-25').text, /उवाच पार्थ पश्यैतान्समवेतान्कुरूनिति/);
  // These are verse lines, not chapter colophons. A generic ^इति filter would
  // leave the total at 700 while silently truncating all five readings.
  const preservedLines = {
    'gita-4-14': 'इति मां योऽभिजानाति कर्मभिर्न स बध्यते',
    'gita-10-8': 'इति मत्वा भजन्ते मां बुधा भावसमन्विताः',
    'gita-13-18': 'इति क्षेत्रं तथा ज्ञानं ज्ञेयं चोक्तं समासतः',
    'gita-15-20': 'इति गुह्यतमं शास्त्रमिदमुक्तं मयानघ',
    'gita-18-63': 'इति ते ज्ञानमाख्यातं गुह्याद्गुह्यतरं मया',
  };
  for (const [id, line] of Object.entries(preservedLines)) {
    assert.ok(gita.find((item) => item.id === id).text.includes(line), `${id}: preserve the complete इति line`);
  }
});

test('corpus IDs are unique, stable manifest IDs and complete Gita IDs; counts describe shipped data', () => {
  const ids = corpus.map((item) => item.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(new Set(manifest.map((item) => item.id)).size, manifest.length);
  assert.equal(new Set(nityaManifest.map((item) => item.id)).size, nityaManifest.length);
  for (const id of ids) assert.match(id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  const devotionalIds = corpus.filter((item) => item.collectionId !== 'bhagavad-gita').map((item) => item.id);
  const nityaIds = new Set(nityaManifest.map((item) => item.id));
  const expectedDevotionalIds = [
    ...manifest.filter((item) => !nityaIds.has(item.id)).map((item) => item.id),
    ...nityaManifest.map((item) => item.id),
  ];
  assert.deepEqual(devotionalIds, expectedDevotionalIds);
  assert.equal(stats.devotionalTexts, devotionalIds.length);
  assert.equal(stats.gitaShlokas, 700);
  assert.equal(stats.chapters, 18);
  assert.equal(stats.total, corpus.length);
});

test('every imported text retains approved per-source provenance and reuse attribution', () => {
  for (const item of corpus) {
    const url = new URL(item.sourceUrl);
    assert.equal(url.protocol, 'https:', item.id);
    assert.equal(url.username + url.password + url.hash, '', item.id);
    if (item.sourceLabel === 'Sanskrit Wikisource') {
      assert.equal(url.hostname, 'sa.wikisource.org', item.id);
      assert.equal(url.pathname, '/w/index.php', item.id);
      assert.ok(Number.isSafeInteger(item.sourceRevision) && item.sourceRevision > 0, item.id);
      assert.equal(url.searchParams.get('oldid'), String(item.sourceRevision), item.id);
      assert.equal(item.textSource, item.sourceUrl, item.id);
      const snapshot = sources.find((entry) => entry.title === url.searchParams.get('title') && entry.revision === item.sourceRevision);
      assert.ok(snapshot, `${item.id}: source revision must exist in the offline snapshots`);
      assert.match(snapshot.sha256, /^[a-f0-9]{64}$/, item.id);
      assert.equal(item.license, 'CC BY-SA 4.0', item.id);
      assert.equal(item.licenseUrl, 'https://creativecommons.org/licenses/by-sa/4.0/', item.id);
      assert.ok(item.attribution.includes(snapshot.title), item.id);
      assert.ok(item.attribution.includes('Wikisource contributors'), item.id);
      assert.ok(item.attribution.includes(item.license), item.id);
    } else {
      assert.equal(item.sourceLabel, 'Nitya', `${item.id}: unreviewed source`);
      const definition = nityaManifest.find((entry) => entry.id === item.id);
      const snapshot = nityaSources.find((entry) => entry.id === item.id);
      assert.ok(definition && snapshot, `${item.id}: source snapshot and manifest required`);
      assert.equal(item.sourceUrl, `https://getnitya.com/en/${definition.path}/`, item.id);
      assert.equal(item.textSource, `https://getnitya.com/data/${definition.path}/dev.json`, item.id);
      assert.equal(snapshot.url, item.textSource, item.id);
      assert.match(snapshot.sha256, /^[a-f0-9]{64}$/, item.id);
      assert.equal(item.sourceRevision, snapshot.sha256, item.id);
      assert.equal(item.sourcePolicyUrl, 'https://getnitya.com/en/about/data/', item.id);
      assert.equal(item.license, 'Public domain (PDM 1.0)', item.id);
      assert.equal(item.licenseUrl, 'https://creativecommons.org/publicdomain/mark/1.0/', item.id);
      assert.match(item.attribution, /Nitya.*public domain/i, item.id);
    }
  }
});

test('Nitya snapshots contain only reusable original-script text and retain every section', () => {
  for (const definition of nityaManifest) {
    const snapshot = nityaSources.find((entry) => entry.id === definition.id);
    const item = corpus.find((entry) => entry.id === definition.id);
    assert.ok(snapshot && item, definition.id);
    // These upstream JSON responses use compact JSON; checking the hash of that
    // representation detects accidental edits to any stored verse or word list.
    assert.equal(crypto.createHash('sha256').update(JSON.stringify(snapshot.data)).digest('hex'), snapshot.sha256, definition.id);
    assert.deepEqual(Object.keys(snapshot.data).sort(), ['lang', 's', 'v']);
    assert.equal(snapshot.data.s, 'dev');
    const sections = Object.values(snapshot.data.v);
    assert.equal(item.sectionCount, sections.length, definition.id);
    if (definition.expectedSections) assert.equal(sections.length, definition.expectedSections, definition.id);
    for (const section of sections) {
      assert.ok(Array.isArray(section.l) && section.l.length > 0, definition.id);
      assert.ok(Object.keys(section).every((key) => ['l', 'w'].includes(key)), `${definition.id}: source meanings must not enter the text-only snapshots`);
      for (const line of section.l) assert.equal(typeof line, 'string', definition.id);
    }
    assert.equal(item.text, sections.map((section) => section.l.join('\n')).join('\n\n'), definition.id);
    assert.equal(item.language, definition.language, definition.id);
    assert.ok(['Sanskrit', 'Hindi', 'Awadhi'].includes(item.language), definition.id);
    assert.equal(item.isExcerpt, false, definition.id);
    for (const [index, field] of ['meaning', 'meaningHi', 'meaningBn'].entries()) {
      assert.equal(item[field], definition[field] || originalSummaries[definition.id]?.[index], `${definition.id}.${field}: app-authored summary only`);
    }
  }
  const hanuman = corpus.find((item) => item.id === 'hanuman-chalisa');
  assert.equal(hanuman.sectionCount, 43, 'Two opening dohas, forty chaupais and one closing doha');
  assert.match(hanuman.text, /^श्रीगुरु चरन सरोज रज/);
  assert.match(hanuman.text, /राम लखन सीता सहित/);
});

test('reader text contains devotional text rather than wiki markup, HTML or Latin editorial prose', () => {
  for (const item of corpus) {
    assert.equal(typeof item.text, 'string', item.id);
    assert.ok(item.text.trim().length >= 9, item.id);
    assert.match(item.text, /\p{Script=Devanagari}/u, item.id);
    assert.doesNotMatch(item.text, /[A-Za-z]/, `${item.id}: Latin content belongs in transliteration or provenance`);
    for (const field of ['text', 'textBn', 'transliteration']) {
      assert.equal(typeof item[field], 'string', `${item.id}.${field}`);
      assert.doesNotMatch(item[field], /\{\{|\}\}|\[\[|\]\]|<\/?[A-Za-z][^>]*>|<!--|&(?:[A-Za-z]+|#\d+|#x[0-9a-f]+);/i, `${item.id}.${field}`);
      assert.doesNotMatch(item[field], /\uFFFD|\p{Cn}/u, `${item.id}.${field}: valid Unicode`);
    }
  }
});

test('Bengali script remains a reproducible rendering of the original text with an explicit translation distinction', () => {
  for (const item of corpus) {
    assert.equal(item.textBn, catalog.devanagariToBengali(item.text), item.id);
    assert.match(item.textBn, /\p{Script=Bengali}/u, item.id);
    assert.match(item.textBnNote, /not a Bengali translation/i, item.id);
    assert.match(item.transliterationNote, /transliteration/i, item.id);
  }
});

test('available summaries have all three languages and selected Gita summaries survive the import', () => {
  for (const item of corpus) {
    const fields = ['meaning', 'meaningHi', 'meaningBn'];
    if (item.collectionId === 'bhagavad-gita' && !fields.some((field) => item[field])) continue;
    for (const field of fields) {
      assert.equal(typeof item[field], 'string', `${item.id}.${field}`);
      assert.ok(item[field].trim().length > 15, `${item.id}.${field}`);
    }
    assert.match(item.meaning, /[A-Za-z]/, item.id);
    assert.match(item.meaningHi, /\p{Script=Devanagari}/u, item.id);
    assert.match(item.meaningBn, /\p{Script=Bengali}/u, item.id);
    assert.match(item.meaningNote || item.meaningType, /original.*summary/i, item.id);
  }
  assert.equal(Object.keys(selectedGitaSummaries).length, 25);
  for (const [reference, summary] of Object.entries(selectedGitaSummaries)) {
    const item = corpus.find((entry) => entry.id === `gita-${reference.replace('.', '-')}`);
    assert.ok(item, reference);
    for (const field of ['meaning', 'meaningHi', 'meaningBn', 'meaningNote']) {
      assert.equal(item[field], summary[field], `${reference}.${field}`);
    }
    assert.equal(item.meaningNote, 'Original concise summary; not a literal or scholarly translation.');
  }
});

test('app library resolves every deity, category and existing festival link while preserving saved mantra IDs', () => {
  const data = loadData('src/data/mantrasData.js', { importedCorpus: corpus, catalog }, [
    'MANTRA_LIBRARY', 'DEITY_OPTIONS', 'CATEGORY_OPTIONS', 'getMantraById',
  ]);
  const { festivals } = loadData('src/data/festivalData.js', {}, ['festivals']);
  const deityIds = new Set(Array.from(data.DEITY_OPTIONS, (item) => item.id));
  const categoryIds = new Set(Array.from(data.CATEGORY_OPTIONS, (item) => item.id));
  const libraryIds = new Set(Array.from(data.MANTRA_LIBRARY, (item) => item.id));
  assert.equal(libraryIds.size, data.MANTRA_LIBRARY.length);
  assert.equal(libraryIds.size, corpus.length, 'Only sourced corpus readings may be bundled');

  for (const item of data.MANTRA_LIBRARY) {
    assert.ok(item.textSource && item.license && item.attribution, `${item.id}: missing source credit`);
    assert.ok(deityIds.has(item.deityId), `${item.id}: unknown deity ${item.deityId}`);
    assert.ok(categoryIds.has(item.categoryId), `${item.id}: unknown category ${item.categoryId}`);
    for (const deityId of item.deityIds || []) assert.ok(deityIds.has(deityId), `${item.id}: unknown secondary deity ${deityId}`);
    assert.equal(data.getMantraById(item.id), item);
  }
  for (const id of LEGACY_MANTRA_IDS) assert.ok(libraryIds.has(id), `Saved/history ID lost: ${id}`);
  for (const item of corpus) assert.ok(libraryIds.has(item.id), `Corpus item missing in app: ${item.id}`);
  for (const festival of festivals.filter((item) => item.mantraId)) {
    assert.ok(data.getMantraById(festival.mantraId), `${festival.id}: broken mantra link ${festival.mantraId}`);
  }
  assert.equal(data.getMantraById('missing-mantra'), undefined);
  assert.ok(!libraryIds.has('santoshi-vrat-katha'), 'Unsourced story placeholder must not reappear');
});
