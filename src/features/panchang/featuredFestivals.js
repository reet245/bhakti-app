import { enrichFestival, getYearFestivals } from './festivals.js';
import { getRegionalFestivalReferences } from './regionalFestivalReferences.js';

// This is the annual festival feed, independent of the complete daily Panchang.
// Engine types are not a useful filter: Nag Panchami is "minor", while monthly
// Sankashti Chaturthi is "major" and the solar New Years are "sankranti".
const FEATURED_KEYS = new Set([
  'new_years_day', 'christmas', 'good_friday', 'easter',
  'mahavir_jayanti', 'buddha_purnima_vesak', 'guru_nanak_jayanti',
  'lohri', 'makar_sankranti', 'pongal', 'magh_bihu',
  'vasant_panchami', 'maha_shivaratri',
  'holika_dahan', 'holi', 'ugadi', 'gudi_padwa', 'gangaur',
  'rama_navami', 'hanuman_jayanti', 'baisakhi', 'vishu', 'puthandu',
  'pohela_boishakh', 'bohag_bihu', 'akshaya_tritiya', 'parashurama_jayanti',
  'vat_savitri_amavasya', 'vat_savitri_purnima', 'jagannath_rath_yatra',
  'guru_purnima', 'hariyali_teej', 'nag_panchami',
  'onam', 'raksha_bandhan',
  'varamahalakshmi', 'kajari_teej', 'krishna_janmashtami',
  'ganesh_chaturthi', 'hartalika_teej', 'anant_chaturdashi',
  'bathukamma_start', 'navaratri',
  'durga_ashtami', 'maha_navami', 'bathukamma_saddula', 'dussehra',
  'sharad_purnima', 'karva_chauth', 'dhanteras', 'narak_chaturdashi',
  'diwali', 'govardhan_puja', 'bhai_dooj', 'chhath_nahay_khay',
  'chhath_kharna', 'chhath_sandhya_arghya', 'chhath_usha_arghya',
  'kartika_purnima', 'karthigai_deepam',
]);
const FEATURED_EKADASHIS = new Set([
  'Nirjala Ekadashi', 'Devshayani Ekadashi', 'Devutthana Ekadashi', 'Mokshada Ekadashi',
]);
const yearCache = new Map();
const MAX_CACHED_YEARS = 8;
const isEkadashi = (festival) => /^(smarta_|vaishnava_)?ekadashi$/.test(festival.type);
const withoutTradition = (name = '') => name.replace(/\s*\((?:Smarta|Vaishnava|स्मार्त|वैष्णव)\)\s*$/u, '').trim();

function mergeSameDayEkadashis(items) {
  const result = [];
  const groups = new Map();
  for (const item of items) {
    if (!isEkadashi(item)) {
      result.push(Object.freeze({ ...item, featured: true }));
      continue;
    }
    const identity = `${item.dateISO}:${withoutTradition(item.nameEn)}`;
    if (!groups.has(identity)) groups.set(identity, []);
    groups.get(identity).push(item);
  }
  for (const observances of groups.values()) {
    const primary = observances[0];
    result.push(Object.freeze(observances.length === 1
      ? { ...primary, featured: true }
      : {
        ...primary, featured: true,
        name: withoutTradition(primary.name),
        nameEn: withoutTradition(primary.nameEn),
        nameHi: withoutTradition(primary.nameHi),
        observances: Object.freeze(observances),
      }));
  }
  return result;
}

export function getFeaturedYearFestivals(options = {}) {
  // Validate through the shared calendar before consulting our cache. Its frozen
  // result identity already includes location, timezone, language and year.
  const fullYear = getYearFestivals({ ...options, region: 'all' });
  if (yearCache.has(fullYear)) return yearCache.get(fullYear);
  const language = options.language === 'hi' ? 'hi' : 'en';
  const references = getRegionalFestivalReferences(options.year);
  const referenceKeys = new Set(references.map((item) => item.key));
  const items = fullYear.filter((item) => !referenceKeys.has(item.key)
    && (FEATURED_KEYS.has(item.key)
      || (isEkadashi(item) && FEATURED_EKADASHIS.has(withoutTradition(item.nameEn)))));
  // Raja's upstream solar anchor is incorrect, so its keys are deliberately
  // absent above. Raja, Bonalu and Vaikuntha require sourced reference dates.
  for (const reference of references) {
    items.push(Object.freeze(enrichFestival({
      ...reference,
      type: reference.type || 'major',
      source: reference.source || 'Regional festival reference',
    }, {
      dateISO: reference.dateISO,
      language,
      locationName: reference.referenceLocation,
    })));
  }
  const unique = new Map(mergeSameDayEkadashis(items).map((item) => [item.id, item]));
  const result = Object.freeze([...unique.values()].sort((a, b) => a.dateISO.localeCompare(b.dateISO) || a.key.localeCompare(b.key)));
  if (yearCache.size >= MAX_CACHED_YEARS) yearCache.delete(yearCache.keys().next().value);
  yearCache.set(fullYear, result);
  return result;
}
