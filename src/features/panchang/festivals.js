import { computeFestivalsForYear, convertGregorianToHindu } from 'panchang-ts';
import { festivals as stories } from '../../data/festivalData.js';
import { DEFAULT_PANCHANG_LOCATION } from './constants.js';
import { parseLocalDate, validCoordinates, validTimezone } from './date.js';
import { getChristianFestivalDates } from './christianFestivals.js';

// Narrative/art identity is independent of the calculated occurrence and its date.
const STORY_KEYS = {
  maha_shivaratri: 'maha-shivratri', rama_navami: 'ram-navami',
  krishna_janmashtami: 'janmashtami', navaratri: 'navratri',
  durga_ashtami: 'durga-puja', maha_navami: 'durga-puja',
  karva_chauth: 'karwa-chauth', baisakhi: 'vaisakhi',
  chhath_sandhya_arghya: 'chhath-puja', chhath_usha_arghya: 'chhath-puja',
  chhath_nahay_khay: 'chhath-puja', chhath_kharna: 'chhath-puja',
};
const FIXED_DATES = {
  new_years_day: ['01-01', 'new-years-day', 'नव वर्ष'],
  republic_day: ['01-26', 'republic-day', 'गणतंत्र दिवस'],
  independence_day: ['08-15', 'independence-day', 'स्वतंत्रता दिवस'],
  gandhi_jayanti: ['10-02', 'gandhi-jayanti', 'गांधी जयंती'],
  christmas: ['12-25', 'christmas', 'क्रिसमस'],
};
const REFERENCE_ONLY = {
  'mahavir-jayanti': 'महावीर जयंती', 'buddha-purnima-vesak': 'बुद्ध पूर्णिमा',
  'guru-nanak-jayanti': 'गुरु नानक जयंती',
};
const storiesById = new Map(stories.map((story) => [story.id, story]));
const yearCache = new Map();
const MAX_CACHED_YEARS = 8;
// Purnimanta month order: Chaitra ... Phalguna; each row is Shukla, Krishna.
// Upstream 5.4.0 passes an Amanta index into this naming convention, shifting
// Krishna names by a month. Dates still come from its fasting-day rules.
const EKADASHI_NAMES = [
  [['Kamada', 'कामदा'], ['Papamochani', 'पापमोचनी']],
  [['Mohini', 'मोहिनी'], ['Varuthini', 'वरूथिनी']],
  [['Nirjala', 'निर्जला'], ['Apara', 'अपरा']],
  [['Devshayani', 'देवशयनी'], ['Yogini', 'योगिनी']],
  [['Shravana Putrada', 'श्रावण पुत्रदा'], ['Kamika', 'कामिका']],
  [['Parivartini', 'परिवर्तिनी'], ['Aja', 'अजा']],
  [['Papankusha', 'पापांकुशा'], ['Indira', 'इन्दिरा']],
  [['Devutthana', 'देवउत्थान'], ['Rama', 'रमा']],
  [['Mokshada', 'मोक्षदा'], ['Utpanna', 'उत्पन्ना']],
  [['Pausha Putrada', 'पौष पुत्रदा'], ['Saphala', 'सफला']],
  [['Jaya', 'जया'], ['Shattila', 'षटतिला']],
  [['Amalaki', 'आमलकी'], ['Vijaya', 'विजया']],
];
// Explicitly sampled Delhi corrections, not rules inferred for other cities/years.
const DELHI_REFERENCE_DATES = {
  2026: { sharad_purnima: ['2026-10-26', '2026-10-25'] },
  2027: {
    holika_dahan: ['2027-03-22', '2027-03-21'],
    holi: ['2027-03-23', '2027-03-22'],
    mahalaya_amavasya: ['2027-09-30', '2027-09-29'],
    sharad_purnima: ['2027-10-15', '2027-10-14'],
  },
};

export function deityForFestival(key = '') {
  if (/ekadashi|janmashtami|govardhan|gita|rath_yatra/.test(key)) return 'krishna';
  if (/pradosha|shivaratri|shravan_somvar|karva_chauth/.test(key)) return 'shiv';
  if (/ganesh|vinayaka|sankashti/.test(key)) return 'ganesh';
  if (/navaratri|durga|teej|gauri|maha_navami/.test(key)) return 'durga';
  if (/diwali|dhanteras|lakshmi/.test(key)) return 'lakshmi';
  if (/hanuman/.test(key)) return 'hanuman';
  return null;
}

export function formatFestivalDate(dateISO, language = 'en') {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateISO || '')) return '';
  return new Intl.DateTimeFormat(language === 'hi' ? 'hi-IN' : 'en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  }).format(parseLocalDate(dateISO));
}

export function getFestivalDateNote(festival, language = 'en') {
  if (festival?.dateBasis === 'fixed') return language === 'hi' ? 'निश्चित ग्रेगोरियन तिथि' : 'Fixed Gregorian date';
  if (festival?.dateBasis === 'gregorian-computus') return language === 'hi'
    ? 'पश्चिमी ईसाई परंपरा के ग्रेगोरियन कैलेंडर के अनुसार तिथि।'
    : 'Date follows the Gregorian calendar used by Western Christian traditions.';
  if (festival?.dateBasis === 'regional-reference') return language === 'hi'
    ? `${festival.referenceLocation} के प्रकाशित ${festival.dateISO?.slice(0, 4)} क्षेत्रीय कैलेंडर की तिथि।`
    : `Published ${festival.dateISO?.slice(0, 4)} regional calendar date for ${festival.referenceLocation}.`;
  if (festival?.dateBasis === 'verified-reference') {
    const year = festival.dateISO?.slice(0, 4) || '';
    return language === 'hi'
      ? `दिल्ली के प्रकाशित ${year} पंचांग की सत्यापित पर्व तिथि। स्थानीय परंपरा के अनुसार पुष्टि करें।`
      : `Verified observance from the published Delhi ${year} Panchang. Confirm with your local tradition.`;
  }
  if (festival?.dateBasis === 'reference') return language === 'hi'
    ? 'भारत की 2026 संदर्भ तिथि; स्थान के अनुसार गणना नहीं की गई है।'
    : 'India 2026 reference date; not calculated for the selected location.';
  const base = language === 'hi'
    ? `${festival?.locationName || 'चयनित स्थान'} के लिए गणना। क्षेत्र और परंपरा के अनुसार पालन भिन्न हो सकता है।`
    : `Calculated for ${festival?.locationName || 'the selected location'}. Observance can differ by region and tradition.`;
  return festival?.dateCaution ? `${base}\n${festival.dateCaution}` : base;
}

export function enrichFestival(festival, context = {}) {
  const language = context.language === 'hi' ? 'hi' : 'en';
  const key = festival.key || String(festival.storyId || festival.id || '').replace(/-/g, '_');
  const storyId = festival.storyId || STORY_KEYS[key] || key.replace(/_/g, '-');
  const story = storiesById.get(storyId);
  // Never allow a story's historical date or title to replace an engine occurrence.
  const selectedDate = context.dateISO || festival.dateISO || '';
  const rawName = language === 'hi' ? festival.nameHi || festival.name : festival.name;
  const tradition = festival.type === 'smarta_ekadashi' ? (language === 'hi' ? 'स्मार्त' : 'Smarta')
    : festival.type === 'vaishnava_ekadashi' ? (language === 'hi' ? 'वैष्णव' : 'Vaishnava') : '';
  const name = tradition && rawName && !rawName.includes(tradition) ? `${rawName} (${tradition})` : rawName;
  const hindiTradition = festival.type === 'smarta_ekadashi' ? 'स्मार्त' : festival.type === 'vaishnava_ekadashi' ? 'वैष्णव' : '';
  const rawHindiName = festival.nameHi || (language === 'hi' ? festival.name : '');
  const nameHi = hindiTradition && rawHindiName && !rawHindiName.includes(hindiTradition) ? `${rawHindiName} (${hindiTradition})` : rawHindiName;
  const description = language === 'hi' ? festival.descriptionHi || festival.description : festival.description;
  return {
    ...story, ...festival, key, storyId, id: `${selectedDate}:${key}`,
    name: name || story?.name || key.replace(/_/g, ' '),
    nameHi,
    dateISO: selectedDate, dateText: formatFestivalDate(selectedDate, language),
    dateTextHi: formatFestivalDate(selectedDate, 'hi'),
    date: formatFestivalDate(selectedDate, language),
    locationName: context.locationName || festival.locationName || DEFAULT_PANCHANG_LOCATION.locationName,
    dateBasis: festival.dateBasis || 'calculated',
    source: festival.source || 'panchang-ts@5.4.0',
    story: story?.story || '', storyLanguage: 'en',
    imageKey: story?.imageKey || (key === 'nag_panchami' ? 'nagPanchami' : festival.imageKey),
    meaning: language === 'hi' ? description || name || festival.name : story?.meaning || description || name,
    subtitle: language === 'hi' ? description || '' : story?.subtitle || description || '',
    description: description || (language === 'hi' ? name : story?.meaning) || '',
    descriptionHi: festival.descriptionHi || nameHi || '',
    deityId: festival.deityId || story?.pujaDeityId || deityForFestival(key),
    dateCaution: festival.dateCaution,
  };
}

export function enrichFestivals(festivals, context = {}) {
  return (festivals || []).map((festival) => enrichFestival(festival, context));
}

function dateInZone(date, timezone) {
  const values = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date).map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function ekadashiNamesForDay(date, location, timezone) {
  const lunar = convertGregorianToHindu(date, location, { timezone, masaSystem: 'amanta', ayanamsa: 'lahiri' });
  const paksha = lunar.paksha === 'krishna' ? 1 : 0;
  const month = (lunar.masaIndex + paksha) % 12;
  const names = lunar.isAdhika ? (paksha ? ['Parama', 'परमा'] : ['Padmini', 'पद्मिनी']) : EKADASHI_NAMES[month][paksha];
  return { nameEn: `${names[0]} Ekadashi`, nameHi: `${names[1]} एकादशी` };
}

function withEkadashiName(festival, names, language) {
  const originalEn = language === 'hi' ? festival.descriptionEn : festival.description;
  const originalHi = festival.descriptionHi;
  // Keep exceptional fast-day instructions; replace only an upstream name label.
  const descriptionEn = !originalEn || /Ekadashi$/i.test(originalEn) ? names.nameEn : `${names.nameEn}. ${originalEn}`;
  const descriptionHi = !originalHi || /एकादशी$/.test(originalHi) ? names.nameHi : `${names.nameHi}। ${originalHi}`;
  return {
    ...festival, ...names, name: language === 'hi' ? names.nameHi : names.nameEn,
    description: language === 'hi' ? descriptionHi : descriptionEn,
    descriptionEn, descriptionHi, nameBasis: 'lunar-month-and-paksha',
  };
}

export function getYearFestivals(options = {}) {
  const { year, latitude, longitude, timezone, locationName, language = 'en', masaSystem = 'purnimanta', region = 'uttar-pradesh' } = {
    ...DEFAULT_PANCHANG_LOCATION, ...options,
  };
  if (!Number.isInteger(year) || year < 1900 || year > 2100) throw new Error('Choose a year from 1900 to 2100.');
  if (!validCoordinates(latitude, longitude) || !validTimezone(timezone)) throw new Error('Choose a valid location and timezone.');
  const cacheKey = JSON.stringify([year, latitude, longitude, timezone, locationName, language, masaSystem, region]);
  if (yearCache.has(cacheKey)) return yearCache.get(cacheKey);
  const rows = computeFestivalsForYear(year, { latitude: Number(latitude), longitude: Number(longitude) }, {
    timezone, language: language === 'hi' ? 'hi' : 'en', masaSystem, ayanamsa: 'lahiri', region,
  });
  const alternateRows = computeFestivalsForYear(year, { latitude: Number(latitude), longitude: Number(longitude) }, {
    timezone, language: language === 'hi' ? 'en' : 'hi', masaSystem, ayanamsa: 'lahiri', region,
  });
  const alternateByOccurrence = new Map(alternateRows.map(({ date, festival }) => [`${dateInZone(date, timezone)}:${festival.key}`, festival]));
  const context = { locationName, language };
  const ekadashiNamesByDate = new Map();
  const isDelhiReference = timezone === 'Asia/Kolkata'
    && Math.abs(Number(latitude) - 28.6139) <= 0.1 && Math.abs(Number(longitude) - 77.2090) <= 0.1;
  const items = rows.map(({ date, festival }) => {
    const sourceDate = dateInZone(date, timezone);
    const alternate = alternateByOccurrence.get(`${sourceDate}:${festival.key}`);
    let bilingual = {
      ...festival, nameEn: language === 'hi' ? alternate?.name : festival.name,
      nameHi: language === 'hi' ? festival.name : alternate?.name,
      descriptionEn: language === 'hi' ? alternate?.description : festival.description,
      descriptionHi: language === 'hi' ? festival.description : alternate?.description,
    };
    if (/^(smarta_|vaishnava_)?ekadashi$/.test(festival.type)) {
      if (!ekadashiNamesByDate.has(sourceDate)) ekadashiNamesByDate.set(sourceDate, ekadashiNamesForDay(date, { latitude: Number(latitude), longitude: Number(longitude) }, timezone));
      bilingual = withEkadashiName(bilingual, ekadashiNamesByDate.get(sourceDate), language);
    }
    const reference = isDelhiReference && DELHI_REFERENCE_DATES[year]?.[festival.key];
    if (reference && sourceDate === reference[0]) {
      return enrichFestival({ ...bilingual, dateBasis: 'verified-reference', source: `Drik Panchang Delhi ${year}`, sourceUrl: `https://www.drikpanchang.com/calendars/hindu/hinducalendar.html?geoname-id=1273294&year=${year}`, computedDateISO: sourceDate }, { ...context, dateISO: reference[1] });
    }
    return enrichFestival(bilingual, { ...context, dateISO: sourceDate });
  });
  for (const [key, [monthDay, storyId, nameHi]] of Object.entries(FIXED_DATES)) {
    items.push(enrichFestival({ key, storyId, name: storiesById.get(storyId)?.name, nameHi, type: 'holiday', dateBasis: 'fixed', source: 'Gregorian calendar' }, { ...context, dateISO: `${year}-${monthDay}` }));
  }
  const { goodFridayDateISO, easterDateISO } = getChristianFestivalDates(year);
  for (const [key, storyId, name, nameHi, dateISO] of [
    ['good_friday', 'good-friday', 'Good Friday', 'गुड फ्राइडे', goodFridayDateISO],
    ['easter', 'easter', 'Easter', 'ईस्टर', easterDateISO],
  ]) {
    items.push(enrichFestival({ key, storyId, name, nameEn: name, nameHi, type: 'major', dateBasis: 'gregorian-computus', source: 'Gregorian Easter computus', sourceUrl: `https://aa.usno.navy.mil/calculated/observances/christian?year=${year}` }, { ...context, dateISO }));
  }
  // These traditions are not implemented by the Hindu calculation engine. Preserve
  // the existing, explicitly dated reference records only in their own year.
  for (const [storyId, nameHi] of Object.entries(REFERENCE_ONLY)) {
    const story = storiesById.get(storyId);
    if (story?.dateISO?.startsWith(`${year}-`)) {
      items.push(enrichFestival({ key: storyId.replace(/-/g, '_'), storyId, name: story.name, nameHi, type: 'major', dateBasis: 'reference', source: 'Bundled India 2026 reference' }, { ...context, dateISO: story.dateISO }));
    }
  }
  // The generic Ekadashi is redundant when the same date has its tradition label.
  const specificEkadashiDays = new Set(items.filter((item) => /^(smarta|vaishnava)_ekadashi$/.test(item.type)).map((item) => item.dateISO));
  const unique = new Map(items.filter((item) => item.type !== 'ekadashi' || !specificEkadashiDays.has(item.dateISO)).map((item) => [item.id, Object.freeze(item)]));
  const result = Object.freeze([...unique.values()].sort((a, b) => a.dateISO.localeCompare(b.dateISO) || a.key.localeCompare(b.key)));
  if (yearCache.size >= MAX_CACHED_YEARS) yearCache.delete(yearCache.keys().next().value);
  yearCache.set(cacheKey, result);
  return result;
}

// Shared by daily, monthly and yearly surfaces so fixes and civil dates agree.
export function getFestivalsForDate({ dateISO: requestedDate, ...options }) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(requestedDate || '')) throw new Error('Choose a valid calendar date.');
  const parsed = parseLocalDate(requestedDate, null);
  if (!parsed) throw new Error('Choose a valid calendar date.');
  return getYearFestivals({ ...options, year: Number(requestedDate.slice(0, 4)) }).filter((item) => item.dateISO === requestedDate);
}
