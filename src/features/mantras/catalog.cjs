// Deterministic script rendering. These are transliterations, never translations.
const VOWELS = { 'अ': 'a', 'आ': 'ā', 'इ': 'i', 'ई': 'ī', 'उ': 'u', 'ऊ': 'ū', 'ऋ': 'ṛ', 'ॠ': 'ṝ', 'ऌ': 'ḷ', 'ॡ': 'ḹ', 'ए': 'e', 'ऐ': 'ai', 'ओ': 'o', 'औ': 'au' };
const MARKS = { 'ा': 'ā', 'ि': 'i', 'ी': 'ī', 'ु': 'u', 'ू': 'ū', 'ृ': 'ṛ', 'ॄ': 'ṝ', 'ॢ': 'ḷ', 'ॣ': 'ḹ', 'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au' };
const CONSONANTS = { 'क': 'k', 'ख': 'kh', 'ग': 'g', 'घ': 'gh', 'ङ': 'ṅ', 'च': 'c', 'छ': 'ch', 'ज': 'j', 'झ': 'jh', 'ञ': 'ñ', 'ट': 'ṭ', 'ठ': 'ṭh', 'ड': 'ḍ', 'ढ': 'ḍh', 'ण': 'ṇ', 'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n', 'प': 'p', 'फ': 'ph', 'ब': 'b', 'भ': 'bh', 'म': 'm', 'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'v', 'श': 'ś', 'ष': 'ṣ', 'स': 's', 'ह': 'h', 'ळ': 'ḷ' };
const OTHER = { 'ं': 'ṃ', 'ः': 'ḥ', 'ँ': 'm̐', 'ऽ': '’', 'ॐ': 'oṃ', '।': '|', '॥': '||', '्': '', '़': '', '॑': '', '॒': '' };

function devanagariToRoman(text = '') {
  const chars = Array.from(String(text).normalize('NFC'));
  return chars.map((char, index) => {
    if (CONSONANTS[char]) {
      const next = chars[index + 1];
      return CONSONANTS[char] + (next === '्' || MARKS[next] ? '' : 'a');
    }
    if (VOWELS[char]) return VOWELS[char];
    if (MARKS[char]) return MARKS[char];
    if (Object.hasOwn(OTHER, char)) return OTHER[char];
    const code = char.codePointAt(0);
    return code >= 0x966 && code <= 0x96f ? String(code - 0x966) : char;
  }).join('');
}

function devanagariToBengali(text = '') {
  return Array.from(String(text).normalize('NFC'), (char) => {
    // Sanskrit va is conventionally rendered with Bengali ba; ṛ and vocalic l
    // retain their Sanskrit letterforms. Vedic accents/dandas are preserved.
    if (char === 'व') return 'ব';
    if (char === 'ॐ') return 'ওঁ';
    if (char === 'ळ') return 'ল';
    if (char === 'ऍ' || char === 'ऎ') return 'এ';
    if (char === 'ऑ' || char === 'ऒ') return 'ও';
    if (char === 'ॅ' || char === 'ॆ') return 'ে';
    if (char === 'ॉ' || char === 'ॊ') return 'ো';
    const code = char.codePointAt(0);
    if ('ँंःअआइईउऊऋऌएऐओऔकखगघङचछजझञटठडढणतथदधनपफबभमयरलशषसह़ऽािीुूृॄेैोौ्ड़ढ़य़ॠॡॢॣ'.includes(char)) return String.fromCodePoint(code + 0x80);
    if (code >= 0x966 && code <= 0x96f) return String.fromCodePoint(code + 0x80);
    return char;
  }).join('');
}

function getMantraScript(mantra, script) {
  if (!mantra) return '';
  if (mantra.isCustom) return script === 'roman' ? mantra.transliteration || mantra.text : mantra.text;
  if (script === 'bengali') return mantra.textBn || devanagariToBengali(mantra.text);
  if (script === 'roman') return mantra.transliteration || devanagariToRoman(mantra.text);
  return mantra.text || '';
}

function normalizeSearch(value = '') {
  return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[०-९]/g, (d) => String(d.charCodeAt(0) - 0x966))
    .replace(/[০-৯]/g, (d) => String(d.charCodeAt(0) - 0x9e6))
    .replace(/[’'\-]/g, '').replace(/\s+/g, ' ').trim();
}

function buildSearchText(mantra, deity = {}, category = {}) {
  return normalizeSearch([
    mantra.title, mantra.titleHi, mantra.titleBn, mantra.text, getMantraScript(mantra, 'bengali'),
    mantra.transliteration || devanagariToRoman(mantra.text), mantra.meaning, mantra.meaningHi, mantra.meaningBn,
    mantra.reference, ...(mantra.aliases || []), deity.englishName, deity.hindiName, deity.bengaliName,
    category.label, category.labelHi, mantra.categoryId, mantra.deityId,
  ].filter(Boolean).join(' '));
}

function filterMantras(library, { query = '', deityId = 'all', categoryId = 'all', collection = 'all', favorites = [], chapter = 'all' } = {}, searchIndex = {}) {
  const terms = normalizeSearch(query).split(' ').filter(Boolean);
  const saved = new Set(favorites);
  return library.filter((item) => (
    (deityId === 'all' || item.deityId === deityId || item.deityIds?.includes(deityId))
    && (categoryId === 'all' || item.categoryId === categoryId)
    && (chapter === 'all' || Number(item.chapter) === Number(chapter))
    && (collection !== 'saved' || saved.has(item.id))
    && (collection !== 'personal' || item.isCustom)
    && (collection !== 'featured' || item.featured)
    && terms.every((term) => (searchIndex[item.id] || buildSearchText(item)).includes(term))
  ));
}

function dailyMantra(library, date = new Date()) {
  const candidates = library.filter((item) => item.featured && !item.isExcerpt && !item.isCustom);
  const pool = candidates.length ? candidates : library.filter((item) => !item.isExcerpt && !item.isCustom);
  if (!pool.length) return undefined;
  // Use calendar fields in the user's local timezone, not elapsed time through DST.
  const day = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);
  return pool[((day % pool.length) + pool.length) % pool.length];
}

module.exports = { devanagariToRoman, devanagariToBengali, getMantraScript, normalizeSearch, buildSearchText, filterMantras, dailyMantra };
