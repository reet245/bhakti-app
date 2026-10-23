import { dateISO, validCoordinates, validTimezone } from '../panchang/date.js';

const PLANETS = [
  {
    symbol: '\u2609',
    name: 'Sun',
    meaning: 'Sun represents soul, confidence, father, authority and life purpose.',
  },
  {
    symbol: '\u263D',
    name: 'Moon',
    meaning: 'Moon represents emotions, intuition, mother, comfort and the inner mind.',
  },
  {
    symbol: '\u2642',
    name: 'Mars',
    meaning: 'Mars represents courage, energy, initiative, discipline and decisive action.',
  },
  {
    symbol: '\u263F',
    name: 'Mercury',
    meaning: 'Mercury represents intellect, speech, learning, analysis and communication.',
  },
  {
    symbol: '\u2643',
    name: 'Jupiter',
    meaning: 'Jupiter represents wisdom, faith, teachers, growth and good fortune.',
  },
  {
    symbol: '\u2640',
    name: 'Venus',
    meaning: 'Venus represents love, harmony, beauty, relationships and refined pleasures.',
  },
  {
    symbol: '\u2644',
    name: 'Saturn',
    meaning: 'Saturn represents responsibility, patience, discipline, karma and endurance.',
  },
  {
    symbol: '\u260A',
    name: 'Rahu',
    meaning: 'Rahu represents ambition, worldly desire, innovation and unfamiliar experiences.',
  },
  {
    symbol: '\u260B',
    name: 'Ketu',
    meaning: 'Ketu represents detachment, intuition, past-life insight and spiritual liberation.',
  },
];

const INITIAL_FORM = {
  name: '',
  gender: 'Female',
  date: '',
  time: '',
  place: '',
  latitude: null,
  longitude: null,
  timezone: null,
};

const SAFE_VALUE = '--';
const MONTHS = {
  january: '01',
  february: '02',
  march: '03',
  april: '04',
  may: '05',
  june: '06',
  july: '07',
  august: '08',
  september: '09',
  october: '10',
  november: '11',
  december: '12',
};

const PLANET_SYMBOLS = PLANETS.reduce((map, planet) => ({
  ...map,
  [planet.name.toLowerCase()]: planet.symbol,
}), {});

const PLANET_MEANINGS = PLANETS.reduce((map, planet) => ({
  ...map,
  [planet.name.toLowerCase()]: planet.meaning,
}), {});

const PLANET_ABBREVIATIONS = {
  sun: 'Su',
  moon: 'Mo',
  mars: 'Ma',
  mercury: 'Me',
  jupiter: 'Ju',
  venus: 'Ve',
  saturn: 'Sa',
  rahu: 'Ra',
  ketu: 'Ke',
};

function safeValue(value, fallback = SAFE_VALUE) {
  if (value === null || value === undefined) return fallback;
  const stringValue = String(value).trim();
  return stringValue || fallback;
}

function planetAbbreviation(name) {
  return PLANET_ABBREVIATIONS[safeValue(name, '').toLowerCase()] || safeValue(name).slice(0, 2);
}

function parseBirthDate(value) {
  const trimmed = safeValue(value, '');

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return isValidBirthDate(trimmed) ? trimmed : null;
  }

  const readableDate = trimmed.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (readableDate) {
    const [, day, monthName, year] = readableDate;
    const month = MONTHS[monthName.toLowerCase()];
    if (month) {
      const isoDate = `${year}-${month}-${String(day).padStart(2, '0')}`;
      return isValidBirthDate(isoDate) ? isoDate : null;
    }
  }

  const slashDate = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashDate) {
    const [, day, month, year] = slashDate;
    const isoDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return isValidBirthDate(isoDate) ? isoDate : null;
  }

  return null;
}

function isValidBirthDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

function parseBirthTime(value, unknownTime) {
  if (unknownTime) return null;

  const trimmed = safeValue(value, '');
  const twentyFourHour = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (twentyFourHour) {
    const [, hour, minute] = twentyFourHour;
    if (Number(hour) <= 23 && Number(minute) <= 59) {
      return `${String(hour).padStart(2, '0')}:${minute}`;
    }
    return null;
  }

  const twelveHour = trimmed.match(/^(\d{1,2}):(\d{2})\s*([AP]M)$/i);
  if (twelveHour) {
    const [, hour, minute, period] = twelveHour;
    if (Number(hour) < 1 || Number(hour) > 12 || Number(minute) > 59) {
      return null;
    }
    const normalizedHour = Number(hour) % 12 + (period.toUpperCase() === 'PM' ? 12 : 0);
    return `${String(normalizedHour).padStart(2, '0')}:${minute}`;
  }

  return null;
}

function normalizeKundliData(data) {
  const profile = data?.profile || {};
  const summary = data?.birthSummary || data?.summary || {};
  const calculationMeta = data?.calculationMeta || {};
  const rawHouses = Array.isArray(data?.houses)
    ? data.houses
    : Array.isArray(data?.charts?.d1?.houses)
      ? data.charts.d1.houses
      : [];
  const rawPlanets = Array.isArray(data?.planets) ? data.planets : [];
  const rawDoshas = Array.isArray(data?.doshas) ? data.doshas : [];
  const rawDashas = Array.isArray(data?.dashas)
    ? data.dashas
    : Array.isArray(data?.dasha?.timeline)
      ? data.dasha.timeline
      : [];
  const rawRemedies = Array.isArray(data?.remedies) ? data.remedies : [];
  const housesByNumber = rawHouses.reduce((map, house) => ({
    ...map,
    [house?.houseNumber ?? house?.number ?? house?.house]: house,
  }), {});
  const houses = Array.from({ length: 12 }, (_, index) => {
    const number = index + 1;
    const house = housesByNumber[number] || {};
    const planetNames = Array.isArray(house.planets) ? house.planets.map((planet) => safeValue(planet)) : [];
    const title = safeValue(house.name || house.title, `${number}${number === 1 ? 'st' : number === 2 ? 'nd' : number === 3 ? 'rd' : 'th'} House`);

    return {
      number,
      name: title,
      title,
      sign: safeValue(house.sign),
      planets: planetNames.map(planetAbbreviation),
      planetNames,
      meaning: safeValue(house.meaning, 'House interpretation is unavailable.'),
      detail: safeValue(house.detail, house.lord ? `House lord: ${house.lord}` : 'No interpretation was supplied by the calculation service.'),
    };
  });
  const normalizedPlanets = rawPlanets.length > 0
    ? rawPlanets.map((planet) => {
      const name = safeValue(planet?.planet || planet?.name);
      return {
        symbol: PLANET_SYMBOLS[name.toLowerCase()] || '\u2609',
        name,
        sign: safeValue(planet?.sign),
        degree: safeValue(planet?.degree),
        house: safeValue(planet?.house),
        meaning: PLANET_MEANINGS[name.toLowerCase()] || SAFE_VALUE,
      };
    })
    : [{
      symbol: '\u2609',
      name: SAFE_VALUE,
      sign: SAFE_VALUE,
      degree: SAFE_VALUE,
      house: SAFE_VALUE,
      meaning: SAFE_VALUE,
    }];
  const doshas = rawDoshas.length > 0
    ? rawDoshas.map((dosha) => {
      const status = safeValue(dosha?.status);
      const clear = /clear|not detected|none|normal/i.test(status);
      return {
        icon: clear ? '\u2713' : '\u2726',
        title: safeValue(dosha?.name),
        status,
        description: safeValue(dosha?.description),
        tone: clear ? 'clear' : 'mild',
      };
    })
    : [{
      icon: '\u2726',
      title: 'Dosha analysis unavailable',
      status: 'Unavailable',
      description: 'The calculation service does not currently provide dosha analysis.',
      tone: 'mild',
    }];
  const dashas = rawDashas.length > 0
    ? rawDashas.map((dasha) => ({
      icon: PLANET_SYMBOLS[safeValue(dasha?.mahaDasha || dasha?.name, '').split(' ')[0].toLowerCase()] || '\u263D',
      label: safeValue(dasha?.type || (dasha?.antarDasha ? 'Antardasha' : 'Mahadasha')),
      name: safeValue(dasha?.name || [dasha?.mahaDasha, dasha?.antarDasha].filter(Boolean).join(' / ')),
      range: `${safeValue(dasha?.startDate)} - ${safeValue(dasha?.endDate)}`,
    }))
    : [{
      icon: '\u263D',
      label: 'Dasha unavailable',
      name: 'No dasha periods were supplied.',
      range: 'An exact birth time may be required.',
    }];
  const remedies = rawRemedies.length > 0
    ? rawRemedies.map((remedy, index) => ({
      icon: ['\u{1FA94}', '\u273F', '\u0950', '\u2726'][index % 4],
      title: safeValue(remedy?.title),
      subtitle: safeValue(remedy?.description || remedy?.subtitle),
    }))
    : [{
      icon: '\u2726',
      title: 'Personalized remedies unavailable',
      subtitle: 'The calculation service does not currently provide personalized remedies. General devotional activities remain available below.',
    }];

  return {
    profile: {
      name: safeValue(profile.name),
      gender: safeValue(profile.gender),
      birthDate: safeValue(profile.birthDate),
      birthTime: calculationMeta.precision === 'APPROXIMATE_UNKNOWN_BIRTH_TIME' ? 'Birth time unknown' : safeValue(profile.birthTime),
      placeName: safeValue(profile.birthPlace || profile.placeName || calculationMeta?.birthLocation?.name),
      latitude: calculationMeta?.birthLocation?.latitude ?? profile.latitude,
      longitude: calculationMeta?.birthLocation?.longitude ?? profile.longitude,
      timezone: safeValue(calculationMeta?.birthLocation?.timezone || profile.timezone),
    },
    summary: {
      lagna: safeValue(summary.lagna),
      rashi: safeValue(summary.rashi),
      nakshatra: safeValue(summary.nakshatra),
      tithi: safeValue(summary.tithi),
      sunSign: safeValue(summary.sunSign),
      moonSign: safeValue(summary.moonSign || summary.rashi),
      ayanamsa: safeValue(summary.ayanamsa || calculationMeta?.ayanamsa),
    },
    overviewItems: [
      { label: 'Lagna', value: safeValue(summary.lagna) },
      ...(summary.sunSign ? [{ label: 'Sun Sign', value: safeValue(summary.sunSign) }] : []),
      { label: 'Rashi', value: safeValue(summary.rashi) },
      { label: 'Nakshatra', value: safeValue(summary.nakshatra) },
      { label: 'Tithi', value: safeValue(summary.tithi) },
      { label: 'Karana', value: safeValue(summary.karana) },
      { label: 'Yoga', value: safeValue(summary.yoga) },
      { label: 'Ayanamsa', value: safeValue(summary.ayanamsa || calculationMeta?.ayanamsa) },
    ],
    planets: normalizedPlanets,
    houses,
    d9Houses: Array.isArray(data?.charts?.d9?.houses) && data.charts.d9.houses.length
      ? normalizeKundliData({ houses: data.charts.d9.houses }).houses : [],
    predictions: Array.isArray(data?.predictions) ? data.predictions.filter((item) => item?.text) : [],
    doshas,
    dashas,
    dashaTimeline: rawDashas.length ? dashas.map((dasha) => `${dasha.name}\n${dasha.range}`) : [],
    remedies,
    calculationMeta,
  };
}


export function birthFormError(form, unknownTime, step, today = new Date()) {
  const date = parseBirthDate(form.date);
  if (step === 1 && !form.name.trim()) return 'Enter your name.';
  if (step === 2 && (!date || date > dateISO(today))) return 'Enter a valid birth date in YYYY-MM-DD format, on or before today.';
  if (step === 2 && !unknownTime && !parseBirthTime(form.time, false)) return 'Enter birth time as HH:MM (24 hour) or HH:MM AM/PM, or select unknown time.';
  if (step === 3 && (!form.place.trim() || !validCoordinates(form.latitude, form.longitude) || !validTimezone(form.timezone))) return 'Search and select a birthplace, or enter its coordinates and IANA timezone.';
  return '';
}

export function buildKundliRequest(form, unknownTime, today = new Date()) {
  for (const step of [1, 2, 3]) {
    const message = birthFormError(form, unknownTime, step, today);
    if (message) throw new Error(message);
  }
  return {
    name: form.name.trim(), gender: form.gender,
    birthDate: parseBirthDate(form.date), birthTime: parseBirthTime(form.time, unknownTime),
    birthPlace: form.place.trim(), unknownTime, ayanamsa: 'LAHIRI',
    latitude: Number(form.latitude), longitude: Number(form.longitude), timezone: form.timezone.trim(),
  };
}

export { INITIAL_FORM, SAFE_VALUE, safeValue, parseBirthDate, parseBirthTime, normalizeKundliData };
