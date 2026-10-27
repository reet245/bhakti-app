'use strict';

// Calculations run entirely on-device. Keep this adapter independent of React,
// network services and the editorial festival catalogue so it is testable in Node.
const Panchang = require('panchang-ts');

const MIN_YEAR = 1900;
const MAX_YEAR = 2100;
const DAY_MS = 86400000;
const DAY_CACHE_LIMIT = 124;
const dayCache = new Map();
const monthCache = new Map();
const newYearCache = new Map();
const formatters = new Map();
const SOURCE = 'panchang-ts 5.4.0 · calculated on device';
const SOURCE_URL = 'https://dharmagya.app/docs/panchang/accuracy';
const LIMITATIONS = Object.freeze([
  'North Indian Purnimanta calendar, Lahiri ayanamsa. Both lunar month systems are shown.',
  'Times are calculated for the selected coordinates and timezone; horizon and traditional conventions can change published timings.',
  'Festival dates follow the library’s regional rules. Fasting and parana traditions can differ; no parana time is inferred from a tithi alone.',
  'Sun and Moon rise/set rows show events on the selected civil date; next-day labels on transitions and muhurtas are explicit.',
]);

function remember(cache, key, value, limit) {
  if (cache.has(key)) cache.delete(key);
  cache.set(key, value);
  while (cache.size > limit) cache.delete(cache.keys().next().value);
  return value;
}

function formatter(timezone, kind) {
  const key = `${timezone}:${kind}`;
  if (formatters.has(key)) return formatters.get(key);
  const options = kind === 'parts'
    ? { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }
    : kind === 'clock'
      ? { hour: 'numeric', minute: '2-digit', hour12: true }
      : kind === 'hi'
        ? { year: 'numeric', month: 'long', day: 'numeric' }
        : { year: 'numeric', month: 'long', day: 'numeric' };
  return remember(formatters, key, new Intl.DateTimeFormat(kind === 'hi' ? 'hi-IN' : 'en-IN', { timeZone: timezone, ...options }), 64);
}

function getDatePartsInTimezone(instant = new Date(), timezone = 'Asia/Kolkata') {
  const parts = Object.fromEntries(formatter(timezone, 'parts').formatToParts(new Date(instant))
    .filter((part) => part.type !== 'literal').map((part) => [part.type, Number(part.value)]));
  return { year: parts.year, month: parts.month - 1, day: parts.day, hour: parts.hour, minute: parts.minute, second: parts.second };
}

function dateISO({ year, month, day }) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function offsetAt(instant, timezone) {
  const p = getDatePartsInTimezone(instant, timezone);
  return (Date.UTC(p.year, p.month, p.day, p.hour, p.minute, p.second) - Math.floor(instant.getTime() / 1000) * 1000) / 60000;
}

// Choose the earliest matching instant on ambiguous midnights. A skipped date
// (e.g. Samoa 2011-12-30) is rejected instead of silently becoming tomorrow.
function localMidnight(parts, timezone) {
  const wall = Date.UTC(parts.year, parts.month, parts.day);
  const candidates = [...new Set([-DAY_MS, 0, DAY_MS].map((delta) => offsetAt(new Date(wall + delta), timezone)))]
    .map((offset) => new Date(wall - offset * 60000))
    .sort((a, b) => a - b);
  const exact = candidates.find((candidate) => {
    const local = getDatePartsInTimezone(candidate, timezone);
    return dateISO(local) === dateISO(parts) && local.hour === 0;
  });
  if (exact) return exact;
  // Some zones advance at 00:00. The first extant wall hour still starts that date.
  const onDate = candidates.filter((candidate) => dateISO(getDatePartsInTimezone(candidate, timezone)) === dateISO(parts));
  if (onDate.length) return onDate[0];
  throw new RangeError(`The date ${dateISO(parts)} does not exist in ${timezone}.`);
}

function validate(input) {
  const { year, month, day, latitude, longitude, timezone } = input || {};
  if (!Number.isInteger(year) || year < MIN_YEAR || year > MAX_YEAR) throw new RangeError(`Year must be between ${MIN_YEAR} and ${MAX_YEAR}.`);
  if (!Number.isInteger(month) || month < 0 || month > 11) throw new RangeError('Month must be an integer from 0 to 11.');
  const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  if (!Number.isInteger(day) || day < 1 || day > days) throw new RangeError('The selected calendar date is invalid.');
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) throw new RangeError('Latitude must be between -90 and 90.');
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) throw new RangeError('Longitude must be between -180 and 180.');
  if (typeof timezone !== 'string' || !timezone.trim()) throw new RangeError('An IANA timezone is required.');
  // Constructing the formatter validates the zone before any calculation occurs.
  formatter(timezone, 'parts');
  return { year, month, day, latitude, longitude, timezone, locationName: input.locationName || 'Selected location', region: input.region || 'uttar-pradesh' };
}

function keyFor(input) {
  return [dateISO(input), input.latitude, input.longitude, input.timezone, input.locationName, input.region].join('|');
}

function iso(value) { return value ? new Date(value).toISOString() : null; }

function formatEvent(value, timezone, referenceDate, language = 'en') {
  if (!value) return language === 'hi' ? 'इस दिन नहीं' : 'No event this day';
  // Display to the nearest minute, while retaining the original instants in raw.
  const instant = new Date(Math.round(new Date(value).getTime() / 60000) * 60000);
  const localDate = dateISO(getDatePartsInTimezone(instant, timezone));
  const time = formatter(timezone, 'clock').format(instant).replace(/\bam\b/i, 'AM').replace(/\bpm\b/i, 'PM');
  if (localDate === referenceDate) return time;
  const delta = Math.round((Date.parse(`${localDate}T00:00:00Z`) - Date.parse(`${referenceDate}T00:00:00Z`)) / DAY_MS);
  if (delta === 1) return `${time} ${language === 'hi' ? '(अगले दिन)' : '(next day)'}`;
  if (delta === -1) return `${time} ${language === 'hi' ? '(पिछले दिन)' : '(previous day)'}`;
  return `${time} (${localDate})`;
}

function periodText(period, input, language = 'en') {
  if (!period) return language === 'hi' ? 'इस दिन नहीं' : 'Not observed this day';
  return `${formatEvent(period.start, input.timezone, dateISO(input), language)} – ${formatEvent(period.end, input.timezone, dateISO(input), language)}`;
}

function periodRecord(period, input) {
  return { start: iso(period.start), end: iso(period.end), time: periodText(period, input), timeHi: periodText(period, input, 'hi'), ...(period.segment ? { segment: period.segment } : {}) };
}

function deityFor(key) {
  if (/ekadashi|janmashtami|govardhan|gita|rath_yatra/.test(key)) return 'krishna';
  if (/pradosha|shivaratri|shravan_somvar/.test(key)) return 'shiv';
  if (/ganesh|vinayaka|sankashti/.test(key)) return 'ganesh';
  if (/navaratri|durga|ashtami|navami|teej|gauri/.test(key) && key !== 'rama_navami') return 'durga';
  if (/diwali|dhanteras|lakshmi/.test(key)) return 'lakshmi';
  if (/rama|hanuman/.test(key)) return key.includes('hanuman') ? 'hanuman' : 'ram';
  if (/saraswati|vasant_panchami/.test(key)) return 'saraswati';
  return null;
}

function festivalBasis(item) {
  if (/ekadashi/.test(item.type)) return 'Computed Ekadashi rule; Smarta and Vaishnava variants remain distinct.';
  if (item.type === 'pradosha') return 'Trayodashi overlap with the local evening pradosha window.';
  if (/sankashti|karva_chauth/.test(item.key)) return 'Chaturthi at local moonrise, with the library’s traditional tie-break rules.';
  return 'Computed from lunar/solar positions and the library’s festival observance rules.';
}

function normalizeFestivals(en, hi, input) {
  return en.map((item) => {
    const hindi = hi.find((entry) => entry.key === item.key);
    return {
      ...item,
      id: `${dateISO(input)}:${item.key}`,
      nameHi: hindi?.name || item.name,
      description: item.description || festivalBasis(item),
      descriptionHi: hindi?.description || hindi?.name || item.name,
      dateISO: dateISO(input),
      deityId: deityFor(item.key),
      basis: festivalBasis(item),
      source: SOURCE,
    };
  });
}

function buildMuhurtas(result, input) {
  const hindiDescriptions = {
    brahma: 'सूर्योदय से पहले रात्रि के पंद्रह मुहूर्तों में चौदहवाँ मुहूर्त।',
    abhijit: 'दिन का आठवाँ मुहूर्त; बुधवार को नहीं माना जाता।',
    vijaya: 'दिन का ग्यारहवाँ मुहूर्त।',
    godhuli: 'सूर्यास्त के आसपास का पारंपरिक समय।',
    amrit: 'नक्षत्र पर आधारित चार आनुपातिक घटी का समय।',
    rahu: 'वार के अनुसार स्थानीय दिनमान का आठवाँ भाग।',
    gulika: 'वार के अनुसार स्थानीय दिनमान का आठवाँ भाग।',
    yamaganda: 'वार के अनुसार स्थानीय दिनमान का आठवाँ भाग।',
    durmuhurta: 'वार के अनुसार पारंपरिक मुहूर्त; मंगलवार को रात्रि का समय भी हो सकता है।',
    varjyam: 'नक्षत्र पर आधारित समय, जिस हिंदू दिन में प्रारंभ होता है उसी में दिखाया गया है।',
  };
  const definitions = [
    ['brahma', 'Brahma Muhurta', 'ब्रह्म मुहूर्त', result.muhurtas.brahma, 'auspicious', 'The fourteenth of fifteen night muhurtas before sunrise.'],
    ['abhijit', 'Abhijit Muhurta', 'अभिजीत मुहूर्त', result.muhurtas.abhijit, 'auspicious', 'The eighth daytime muhurta; omitted on Wednesdays.'],
    ['vijaya', 'Vijaya Muhurta', 'विजय मुहूर्त', result.muhurtas.vijaya, 'auspicious', 'The eleventh daytime muhurta.'],
    ['godhuli', 'Godhuli Muhurta', 'गोधूलि मुहूर्त', result.muhurtas.godhuli, 'auspicious', 'A traditional window around sunset.'],
    ['amrit', 'Amrit Kaal', 'अमृत काल', result.muhurtas.amritKala, 'auspicious', 'Nakshatra-based windows, each four proportional ghatikas long.'],
    ['rahu', 'Rahu Kaal', 'राहु काल', result.inauspicious.rahuKalam, 'inauspicious', 'A weekday-specific eighth of local daylight.'],
    ['gulika', 'Gulika Kaal', 'गुलिक काल', result.inauspicious.gulikaKalam, 'inauspicious', 'A weekday-specific eighth of local daylight.'],
    ['yamaganda', 'Yamaganda', 'यमगण्ड', result.inauspicious.yamaganda, 'inauspicious', 'A weekday-specific eighth of local daylight.'],
    ['durmuhurta', 'Durmuhurta', 'दुर्मुहूर्त', result.inauspicious.durMuhurta, 'inauspicious', 'Traditional weekday muhurtas; Tuesday can include a night window.'],
    ['varjyam', 'Varjyam', 'वर्ज्यम्', result.inauspicious.varjyam, 'inauspicious', 'Nakshatra-based windows assigned to the day they begin.'],
  ];
  return definitions.flatMap(([id, name, nameHi, periods, type, description]) => (Array.isArray(periods) ? periods : periods ? [periods] : [])
    .map((period, index) => ({ id: `${id}-${index}`, key: id, name, nameHi, type, description, descriptionHi: hindiDescriptions[id], ...periodRecord(period, input) })));
}

function normalizeTransitions(result, hindi, input, location) {
  // The library's daily arrays end at next sunrise, not at the final anga's
  // astronomical boundary. Recover that boundary from an instant calculation.
  const lastDate = new Date(result.sun.nextRise.getTime() - 1);
  const lastInstant = lastDate.getUTCFullYear() <= MAX_YEAR ? Panchang.getInstantPanchang(lastDate, location, { ayanamsa: 'lahiri', masaSystem: 'purnimanta', computeEndTimes: true }) : null;
  const groups = { tithi: 'tithis', nakshatra: 'nakshatras', yoga: 'yogas', karana: 'karanas' };
  return Object.fromEntries(Object.entries(groups).map(([singular, plural]) => [singular, result.angas[plural].map((entry, index, entries) => {
    const clipped = entry.endTime?.getTime() === result.sun.nextRise.getTime();
    const final = lastInstant?.angas[singular];
    const end = clipped ? (final?.index === entry.index ? final.endTime : null) : entry.endTime;
    const nameHi = hindi.angas[plural][index]?.name || entry.name;
    return {
      index: entry.index, number: entry.number ?? null, name: entry.name, nameHi,
      start: iso(entry.startTime), end: iso(end), coverageEnd: iso(entry.endTime),
      endTime: end ? formatEvent(end, input.timezone, dateISO(input)) : 'Continues beyond next sunrise',
      endTimeHi: end ? formatEvent(end, input.timezone, dateISO(input), 'hi') : 'अगले सूर्योदय के बाद भी जारी',
      isActiveAtSunrise: entry.isActiveAtSunrise,
      continuesAfterNextSunrise: clipped && (!end || end > result.sun.nextRise),
      nextName: entries[index + 1]?.name || null,
      nextNameHi: hindi.angas[plural][index + 1]?.name || null,
    };
  })]));
}

function buildPanchakaPeriods(result, input) {
  const start = result.sun.rise.getTime();
  const end = result.sun.nextRise.getTime();
  // panchakaRahita is the library's exact list of intervals OUTSIDE Panchak.
  // Its complement is coverage within this Hindu day, not a full-spell estimate.
  const outside = result.inauspicious.panchakaRahita
    .map((period) => ({ start: Math.max(start, period.start.getTime()), end: Math.min(end, period.end.getTime()) }))
    .filter((period) => period.end > period.start)
    .sort((a, b) => a.start - b.start);
  const periods = [];
  let cursor = start;
  for (const free of outside) {
    if (free.start > cursor) periods.push({ start: new Date(cursor), end: new Date(free.start) });
    cursor = Math.max(cursor, free.end);
  }
  if (cursor < end) periods.push({ start: new Date(cursor), end: new Date(end) });
  return periods.map((period, index) => ({
    id: `${dateISO(input)}:panchaka:${index}`, key: 'panchaka', name: 'Panchak', nameHi: 'पंचक',
    ...periodRecord(period, input),
    clippedStart: period.start.getTime() === start,
    clippedEnd: period.end.getTime() === end,
  }));
}

function buildGandaMulaPeriods(result, transitions, input) {
  const dayStart = result.sun.rise.getTime();
  const dayEnd = result.sun.nextRise.getTime();
  return transitions.nakshatra.filter((entry) => Panchang.computeGandaMula(entry.index).active)
    .map((entry) => {
      const actualStart = Date.parse(entry.start);
      const actualEnd = entry.end ? Date.parse(entry.end) : null;
      const start = new Date(Math.max(dayStart, actualStart));
      const end = new Date(Math.min(dayEnd, actualEnd ?? dayEnd));
      return {
        id: `${dateISO(input)}:ganda-mula:${entry.index}`, key: 'ganda-mula', name: 'Gand Mool', nameHi: 'गंडमूल',
        ...periodRecord({ start, end }, input),
        clippedStart: actualStart < dayStart,
        clippedEnd: actualEnd === null || actualEnd > dayEnd,
        nakshatraIndex: entry.index, nakshatraName: entry.name, nakshatraNameHi: entry.nameHi,
        actualStart: entry.start, actualEnd: entry.end,
      };
    }).filter((period) => Date.parse(period.start) < Date.parse(period.end));
}

function civilSamvat(input, location, sunrise) {
  const key = [input.year, input.latitude, input.longitude, input.timezone].join('|');
  let newYear = newYearCache.get(key);
  if (!newYearCache.has(key)) {
    const historicalOffset = offsetAt(sunrise, input.timezone);
    const yearTimezone = Number.isInteger(historicalOffset) ? input.timezone : Math.round(historicalOffset);
    const instant = Panchang.getHinduNewYear(input.year, 'uttar-pradesh', location, { timezone: yearTimezone, ayanamsa: 'lahiri', masaSystem: 'purnimanta' });
    newYear = instant ? dateISO(getDatePartsInTimezone(instant, input.timezone)) : null;
    remember(newYearCache, key, newYear, 24);
  }
  // A skipped Pratipada can make the observed new-year day begin before the
  // astronomical new moon. Keep the civic year consistent for that whole date.
  const current = Panchang.computeSamvat(sunrise);
  if (!newYear) return { ...current, newYearDate: null };
  const after = dateISO(input) >= newYear;
  return { ...current, vikramSamvat: input.year + (after ? 57 : 56), shakaSamvat: input.year - (after ? 78 : 79), newYearDate: newYear };
}

function emptyDay(input, start, end) {
  const message = 'A sunrise-to-sunrise Panchang is unavailable here because this date has no complete sunrise and sunset cycle.';
  return {
    dateISO: dateISO(input), dateLabel: formatter(input.timezone, 'date').format(start), dateLabelHi: formatter(input.timezone, 'hi').format(start),
    ...input, source: SOURCE, sourceUrl: SOURCE_URL, isRealData: false, partial: true,
    noSunrise: true, errorMessage: message, importance: message,
    tithi: 'Unavailable', tithiHi: 'अनुपलब्ध', paksha: 'Unavailable', pakshaHi: 'अनुपलब्ध', lunarMonth: 'Unavailable', lunarMonthHi: 'अनुपलब्ध',
    nakshatra: 'Unavailable', yoga: 'Unavailable', karana: 'Unavailable', sunrise: 'No complete solar day', sunset: 'No complete solar day',
    moonrise: 'Unavailable', moonset: 'Unavailable', muhurtas: [], festivals: [], observances: [], calendarMarkers: [],
    transitions: { tithi: [], nakshatra: [], yoga: [], karana: [] }, panchakaPeriods: [], gandaMulaPeriods: [],
    isEkadashi: false, isEkadashiTithi: false, isPurnima: false, isAmavasya: false, isFestival: false, isFast: false,
    calculation: { engine: 'panchang-ts', version: '5.4.0', license: 'MIT', available: false, limitations: LIMITATIONS },
    raw: { startOfDay: iso(start), endOfDay: iso(end), sunrise: null, sunset: null, nextSunrise: null, moonrise: null, moonset: null, referenceTime: null },
  };
}

function calculatePanchang(input) {
  const options = validate(input);
  const key = keyFor(options);
  if (dayCache.has(key)) return dayCache.get(key);
  const { year, month, day, latitude, longitude, timezone } = options;
  const start = localMidnight(options, timezone);
  const nextDate = new Date(Date.UTC(year, month, day + 1));
  const end = localMidnight({ year: nextDate.getUTCFullYear(), month: nextDate.getUTCMonth(), day: nextDate.getUTCDate() }, timezone);
  const location = { latitude, longitude, elevation: 0 };
  // A UTC instant inside the requested local date prevents host-timezone drift.
  // Pre-standard historical zones can include seconds; the source accepts whole
  // offset minutes only. This affects its day-search origin by at most 30 seconds;
  // all returned astronomical instants are formatted in the actual IANA zone.
  const engineOptions = { timezone: Math.round(offsetAt(start, timezone)), language: 'en', ayanamsa: 'lahiri', masaSystem: 'purnimanta', region: options.region, sections: ['festivals', 'moonTimes', 'lunarWindows'] };
  const engineDate = new Date(Math.min(Math.max((start.getTime() + end.getTime()) / 2, Date.UTC(MIN_YEAR, 0, 1)), Date.UTC(MAX_YEAR + 1, 0, 1) - 1));
  const result = Panchang.getDailyPanchang(engineDate, location, engineOptions);
  if (!result || dateISO(getDatePartsInTimezone(result.sun.rise, timezone)) !== dateISO(options)) return remember(dayCache, key, emptyDay(options, start, end), DAY_CACHE_LIMIT);
  const hindi = Panchang.getDailyPanchang(engineDate, location, { ...engineOptions, language: 'hi' });
  const current = result.angas.tithis[0];
  const currentHi = hindi.angas.tithis[0];
  const lunar = result.calendar.chandramasa;
  const lunarHi = hindi.calendar.chandramasa;
  const transitions = normalizeTransitions(result, hindi, options, location);
  const festivals = normalizeFestivals(result.festivals, hindi.festivals, options);
  const observances = [...festivals];
  if (current.index === 14 || current.index === 29) {
    const full = current.index === 14;
    const moonKey = full ? 'purnima' : 'amavasya';
    if (!observances.some((item) => item.key === moonKey)) observances.push({ id: `${dateISO(options)}:${moonKey}`, key: moonKey, name: full ? 'Purnima' : 'Amavasya', nameHi: full ? 'पूर्णिमा' : 'अमावस्या', type: 'lunar', dateISO: dateISO(options), deityId: null, basis: 'Tithi present at local sunrise; not a fasting or parana determination.', description: 'Lunar observance at sunrise.', descriptionHi: 'सूर्योदय की चंद्र तिथि।' });
  }
  const muhurtas = buildMuhurtas(result, options);
  const range = (entries, fallback = 'None in this Hindu day') => entries.length ? entries.map((item) => periodText(item, options)).join('; ') : fallback;
  const samvat = civilSamvat(options, location, result.sun.rise);
  // Re-evaluate moon events over the actual civil-day duration: 23/25 hours on
  // DST boundaries. The library's daily convenience function assumes 24 hours.
  const foundMoonrise = Panchang.getMoonrise(start, location, (end - start) / DAY_MS);
  const moonrise = foundMoonrise && foundMoonrise < end ? foundMoonrise : null;
  const foundMoonset = Panchang.getMoonset(start, location, (end - start) / DAY_MS);
  const moonset = foundMoonset && foundMoonset < end ? foundMoonset : null;
  const rituIndex = Math.floor(lunar.purnimantaIndex / 2);
  const ritu = ['Vasanta', 'Grishma', 'Varsha', 'Sharad', 'Hemanta', 'Shishira'][rituIndex];
  const rituHi = ['वसंत', 'ग्रीष्म', 'वर्षा', 'शरद', 'हेमंत', 'शिशिर'][rituIndex];
  const uttarayana = result.sun.siderealLongitude >= 270 || result.sun.siderealLongitude < 90;
  const isFast = festivals.some((item) => /ekadashi|pradosha/.test(item.type) || /sankashti|shivaratri|karva_chauth|somvar|teej/.test(item.key));
  const normalized = {
    ...options,
    dateISO: dateISO(options), dateLabel: formatter(timezone, 'date').format(start), dateLabelHi: formatter(timezone, 'hi').format(start),
    weekday: result.angas.vara.englishName, weekdayHi: hindi.angas.vara.name, weekdayIndex: result.angas.vara.index,
    vaar: result.angas.vara.name, vaarHi: hindi.angas.vara.name,
    hindiDateLabel: `${lunarHi.name} · ${currentHi.name}`, tithi: current.name.replace(/^(Shukla|Krishna)\s+/, ''), tithiHi: currentHi.name.replace(/^(शुक्ल|कृष्ण)\s+/, ''),
    tithiFull: current.name, tithiFullHi: currentHi.name, tithiIndex: current.index, tithiNumber: current.number,
    tithiEnd: transitions.tithi[0].endTime, tithiEndHi: transitions.tithi[0].endTimeHi,
    nakshatra: result.angas.nakshatras[0].name, nakshatraHi: hindi.angas.nakshatras[0].name, nakshatraIndex: result.angas.nakshatras[0].index,
    nakshatraEnd: transitions.nakshatra[0].endTime, nakshatraEndHi: transitions.nakshatra[0].endTimeHi,
    yoga: result.angas.yogas[0].name, yogaHi: hindi.angas.yogas[0].name, yogaIndex: result.angas.yogas[0].index,
    yogaEnd: transitions.yoga[0].endTime, yogaEndHi: transitions.yoga[0].endTimeHi,
    yogaDescription: 'One of the 27 traditional Sun–Moon yogas.',
    karana: result.angas.karanas[0].name, karanaHi: hindi.angas.karanas[0].name, karanaIndex: result.angas.karanas[0].index,
    karanaEnd: transitions.karana[0].endTime, karanaEndHi: transitions.karana[0].endTimeHi,
    paksha: `${current.paksha} Paksha`, pakshaHi: `${currentHi.paksha} पक्ष`, pakshaIndex: current.index < 15 ? 0 : 1,
    masa: lunar.name, lunarMonth: lunar.name, lunarMonthHi: lunarHi.name,
    amantaMonth: lunar.amantaName, amantaMonthHi: lunarHi.amantaName, amantaMonthIndex: lunar.amantaIndex,
    purnimantaMonth: lunar.purnimantaName, purnimantaMonthHi: lunarHi.purnimantaName, purnimantaMonthIndex: lunar.purnimantaIndex,
    isAdhika: lunar.isAdhika, vikramSamvat: String(samvat.vikramSamvat), samvat: String(samvat.vikramSamvat), shakaSamvat: String(samvat.shakaSamvat),
    ayan: uttarayana ? 'Uttarayana' : 'Dakshinayana', ayanHi: uttarayana ? 'उत्तरायण' : 'दक्षिणायन', ritu, rituHi,
    sunRashi: result.calendar.masa.name, sunRashiHi: hindi.calendar.masa.name, moonRashi: result.moon.rashi.name, moonRashiHi: hindi.moon.rashi.name,
    sunrise: formatEvent(result.sun.rise, timezone, dateISO(options)), sunriseHi: formatEvent(result.sun.rise, timezone, dateISO(options), 'hi'), sunset: formatEvent(result.sun.set, timezone, dateISO(options)), sunsetHi: formatEvent(result.sun.set, timezone, dateISO(options), 'hi'),
    moonrise: formatEvent(moonrise, timezone, dateISO(options)), moonriseHi: formatEvent(moonrise, timezone, dateISO(options), 'hi'), moonset: formatEvent(moonset, timezone, dateISO(options)), moonsetHi: formatEvent(moonset, timezone, dateISO(options), 'hi'),
    rahuKaal: periodText(result.inauspicious.rahuKalam, options), rahuKaalHi: periodText(result.inauspicious.rahuKalam, options, 'hi'), gulikaKaal: periodText(result.inauspicious.gulikaKalam, options), gulikaKaalHi: periodText(result.inauspicious.gulikaKalam, options, 'hi'), yamaganda: periodText(result.inauspicious.yamaganda, options), yamagandaHi: periodText(result.inauspicious.yamaganda, options, 'hi'),
    brahmaMuhurta: periodText(result.muhurtas.brahma, options), brahmaMuhurtaHi: periodText(result.muhurtas.brahma, options, 'hi'), abhijitMuhurta: periodText(result.muhurtas.abhijit, options), abhijitMuhurtaHi: periodText(result.muhurtas.abhijit, options, 'hi'),
    durmuhurta: range(result.inauspicious.durMuhurta), durmuhurtaHi: result.inauspicious.durMuhurta.map((item) => periodText(item, options, 'hi')).join('; ') || 'इस हिंदू दिन में नहीं', amritKaal: range(result.muhurtas.amritKala), amritKaalHi: result.muhurtas.amritKala.map((item) => periodText(item, options, 'hi')).join('; ') || 'इस हिंदू दिन में नहीं', varjyam: range(result.inauspicious.varjyam),
    shubhMuhurat: periodText(result.muhurtas.abhijit || result.muhurtas.brahma, options), muhurtas,
    panchaka: result.inauspicious.panchaka,
    panchakaPeriods: buildPanchakaPeriods(result, options), gandaMulaPeriods: buildGandaMulaPeriods(result, transitions, options),
    bhadra: result.inauspicious.bhadra ? { ...periodRecord(result.inauspicious.bhadra, options), location: result.inauspicious.bhadra.location } : null,
    festivals, observances, festival: festivals.map((item) => item.name).join(' · ') || 'No listed festival', fast: isFast ? festivals.filter((item) => /ekadashi|pradosha/.test(item.type) || /sankashti|shivaratri|karva_chauth|somvar|teej/.test(item.key)).map((item) => item.name).join(' · ') : 'No listed vrat',
    calendarMarkers: observances.map((item) => ({ id: item.id, type: item.type, label: item.name, labelHi: item.nameHi, deityId: item.deityId })),
    isEkadashi: festivals.some((item) => /ekadashi/.test(item.type)), isEkadashiTithi: current.number === 11,
    isPurnima: current.index === 14, isAmavasya: current.index === 29, isFestival: festivals.length > 0, isFast,
    transitions,
    choghadiya: Object.fromEntries(['day', 'night'].map((period) => [period, result.periods.choghadiya[period].map((item, index) => ({ name: item.name, nameHi: hindi.periods.choghadiya[period][index].name, quality: item.quality, ...periodRecord(item, options) }))])),
    ayanamsa: 'LAHIRI', ayanamsaDegrees: result.ayanamsa, source: SOURCE, sourceUrl: SOURCE_URL, isRealData: true, partial: false, noSunrise: false, errorMessage: null,
    importance: `${lunar.name} · ${current.name} at sunrise in ${options.locationName}.`,
    calculation: { engine: 'panchang-ts', version: '5.4.0', license: 'MIT', available: true, tradition: 'North Indian / Purnimanta', ayanamsa: 'Lahiri', reference: 'Local sunrise', calendarYearStart: samvat.newYearDate, rituBasis: 'Purnimanta lunar month', ayanaBasis: 'Sidereal solar sign', limitations: LIMITATIONS },
    raw: { startOfDay: iso(start), endOfDay: iso(end), sunrise: iso(result.sun.rise), sunset: iso(result.sun.set), nextSunrise: iso(result.sun.nextRise), moonrise: iso(moonrise), moonset: iso(moonset), referenceTime: iso(result.sun.rise), sunLongitude: result.sun.siderealLongitude, moonLongitude: result.moon.siderealLongitude },
  };
  return remember(dayCache, key, normalized, DAY_CACHE_LIMIT);
}

function calculateMonth(input) {
  const options = validate({ ...input, day: 1 });
  const key = keyFor(options);
  if (monthCache.has(key)) return monthCache.get(key);
  const days = new Date(Date.UTC(options.year, options.month + 1, 0)).getUTCDate();
  return remember(monthCache, key, Array.from({ length: days }, (_, index) => calculatePanchang({ ...options, day: index + 1 })), 4);
}

function clearCalculationCache() { dayCache.clear(); monthCache.clear(); newYearCache.clear(); }

module.exports = { calculatePanchang, calculateMonth, getDatePartsInTimezone, formatEvent, clearCalculationCache, MIN_YEAR, MAX_YEAR, SOURCE, SOURCE_URL, LIMITATIONS };
