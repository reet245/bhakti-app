// ============================================================
// src/services/panchangService.js
// ============================================================
//
// Panchang data foundation for the Bhakti Calendar screens.
//
// Phase 1 loads real daily Panchang fields from the Bhakti
// Spring Boot backend, which keeps the VedAstro API key off the
// React Native client. Unsupported items such as festival dates,
// Rahu Kaal, end times, and muhurtas are marked unavailable
// instead of being generated locally.
// ============================================================

import { API_BASE_URL, API_BASE_URL_SOURCE } from '../config/api';

const REAL_DATA_ERROR_MESSAGE = 'Real Panchang data unavailable. Please try again.';
const PHASE_1_UNAVAILABLE = 'Not included in Phase 1';
const UNAVAILABLE = 'Unavailable';
const PANCHANG_DEBUG = typeof __DEV__ !== 'undefined' ? __DEV__ : true;

const REQUIRED_BACKEND_FIELDS = [
  'tithiName',
  'paksha',
  'lunarMonth',
  'nakshatra',
  'yogaName',
  'karana',
  'sunrise',
  'sunset',
  'ayanamsa',
];

const DEFAULT_LOCATION = {
  latitude: 22.566,
  longitude: 88.37,
  locationName: 'Kolkata, West Bengal, India',
  timezone: 'Asia/Kolkata',
  ayanamsa: 'LAHIRI',
};

const WEEKDAY_RULES = {
  0: {
    recommendedPuja: 'Surya Prayer',
    recommendedDeityId: null,
    recommendedMantra: 'Gayatri Mantra',
    mantraMeaning: 'A prayer for divine light, wisdom, and clarity.',
  },
  1: {
    recommendedPuja: 'Shiv Ji Puja',
    recommendedDeityId: 'shiv',
    recommendedMantra: 'Om Namah Shivaya',
    mantraMeaning: 'I bow to Lord Shiva, the auspicious and compassionate one.',
  },
  2: {
    recommendedPuja: 'Hanuman Ji Puja',
    recommendedDeityId: 'hanuman',
    recommendedMantra: 'Om Hanumate Namaha',
    mantraMeaning: 'I bow to Hanuman Ji, source of strength, courage, and devotion.',
  },
  3: {
    recommendedPuja: 'Ganesh Ji Puja',
    recommendedDeityId: 'ganesh',
    recommendedMantra: 'Om Gan Ganapataye Namaha',
    mantraMeaning: 'I bow to Lord Ganesha, remover of obstacles.',
  },
  4: {
    recommendedPuja: 'Vishnu/Krishna Puja',
    recommendedDeityId: 'krishna',
    recommendedMantra: 'Om Namo Bhagavate Vasudevaya',
    mantraMeaning: 'I bow to Lord Vasudeva, the divine presence within all.',
  },
  5: {
    recommendedPuja: 'Lakshmi Ma Puja',
    recommendedDeityId: 'lakshmi',
    recommendedMantra: 'Om Shreem Mahalakshmiyei Namaha',
    mantraMeaning: 'I bow to Mahalakshmi, source of grace, abundance, and auspiciousness.',
  },
  6: {
    recommendedPuja: 'Hanuman Ji Puja',
    recommendedDeityId: 'hanuman',
    recommendedMantra: 'Om Hanumate Namaha',
    mantraMeaning: 'I bow to Hanuman Ji, source of strength, courage, and devotion.',
  },
};

function formatDateLabel(date) {
  return date.toLocaleDateString([], {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function getDateISO(year, month, day) {
  return [
    year,
    String(month + 1).padStart(2, '0'),
    String(day).padStart(2, '0'),
  ].join('-');
}

function getDateFromParts({ year, month, day }) {
  return new Date(year, month, day);
}

function getSafeDateParts(dateParts) {
  if (dateParts?.year && Number.isInteger(dateParts.month) && dateParts?.day) {
    return dateParts;
  }

  const today = new Date();
  return {
    year: today.getFullYear(),
    month: today.getMonth(),
    day: today.getDate(),
  };
}

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function debugLog(label, value) {
  if (PANCHANG_DEBUG) {
    console.log(`[Bhakti Panchang] ${label}`, value);
  }
}

function displayValue(value, fallback = UNAVAILABLE) {
  return hasText(value) ? value.trim() : fallback;
}

function buildQuery(params) {
  return Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function getWeekdayRule(date) {
  return WEEKDAY_RULES[date.getDay()] || WEEKDAY_RULES[0];
}

function getSuggestedBhaktiActionsForDate({
  recommendedPuja,
  recommendedDeityId,
  recommendedMantra,
}) {
  return [
    {
      id: 'light-evening-diya',
      title: 'Light a diya in the evening',
      description: 'Offer a simple diya with a quiet prayer for the day.',
      icon: 'diya',
      actionType: 'ritual',
      target: null,
    },
    {
      id: `chant-${slugify(recommendedMantra)}`,
      title: "Chant today's mantra 108 times",
      description: recommendedMantra,
      icon: 'mantra',
      actionType: 'mantra',
      target: recommendedMantra,
    },
    {
      id: `start-${slugify(recommendedPuja)}`,
      title: 'Start recommended puja',
      description: recommendedPuja,
      icon: 'puja',
      actionType: 'puja',
      target: recommendedDeityId,
    },
  ];
}

function getPhase1FestivalItems(dateLabel) {
  return [
    {
      id: 'vedastro-phase-1-festivals',
      name: 'Festival data not included in Phase 1',
      date: dateLabel,
      icon: '\u273A',
      description: 'VedAstro PanchangaTable Phase 1 is used only for daily Panchang fields.',
      featured: true,
    },
  ];
}

function buildUnavailablePanchangData(dateParts, message = REAL_DATA_ERROR_MESSAGE) {
  const safeParts = getSafeDateParts(dateParts);
  const date = getDateFromParts(safeParts);
  const weekdayRule = getWeekdayRule(date);
  const dateLabel = formatDateLabel(date);

  return {
    dateISO: getDateISO(safeParts.year, safeParts.month, safeParts.day),
    dateLabel,
    weekday: date.toLocaleDateString([], { weekday: 'long' }),
    hindiDateLabel: UNAVAILABLE,
    tithi: UNAVAILABLE,
    tithiEnd: PHASE_1_UNAVAILABLE,
    nakshatra: UNAVAILABLE,
    nakshatraEnd: PHASE_1_UNAVAILABLE,
    yoga: UNAVAILABLE,
    yogaDescription: UNAVAILABLE,
    karana: UNAVAILABLE,
    paksha: UNAVAILABLE,
    masa: UNAVAILABLE,
    lunarMonth: UNAVAILABLE,
    vikramSamvat: PHASE_1_UNAVAILABLE,
    samvat: PHASE_1_UNAVAILABLE,
    ayan: PHASE_1_UNAVAILABLE,
    ritu: PHASE_1_UNAVAILABLE,
    vaar: date.toLocaleDateString([], { weekday: 'long' }),
    sunrise: UNAVAILABLE,
    sunset: UNAVAILABLE,
    moonrise: PHASE_1_UNAVAILABLE,
    moonset: PHASE_1_UNAVAILABLE,
    rahuKaal: PHASE_1_UNAVAILABLE,
    shubhMuhurat: PHASE_1_UNAVAILABLE,
    festival: PHASE_1_UNAVAILABLE,
    fast: PHASE_1_UNAVAILABLE,
    importance: message,
    recommendedPuja: weekdayRule.recommendedPuja,
    recommendedDeityId: weekdayRule.recommendedDeityId,
    recommendedMantra: weekdayRule.recommendedMantra,
    mantraMeaning: weekdayRule.mantraMeaning,
    suggestedBhaktiActions: getSuggestedBhaktiActionsForDate({
      recommendedPuja: weekdayRule.recommendedPuja,
      recommendedDeityId: weekdayRule.recommendedDeityId,
      recommendedMantra: weekdayRule.recommendedMantra,
    }),
    muhurtas: [],
    festivals: getPhase1FestivalItems(dateLabel),
    calendarMarkers: [],
    isEkadashi: false,
    isPurnima: false,
    isAmavasya: false,
    isFestival: false,
    isFast: false,
    source: null,
    isRealData: false,
    errorMessage: message,
  };
}

function buildImportanceText(data, { tithi, paksha, nakshatra }) {
  const pieces = [paksha, tithi, nakshatra].filter((value) => value !== UNAVAILABLE);

  if (pieces.length === 0) {
    return 'Real daily Panchang data loaded from VedAstro.';
  }

  return `Real VedAstro Panchang for today: ${pieces.join(' | ')}.`;
}

function getMissingRequiredFields(data) {
  return REQUIRED_BACKEND_FIELDS.filter((fieldName) => !hasText(data?.[fieldName]));
}

function assertBackendPanchangData(data) {
  const missingFields = getMissingRequiredFields(data);
  if (missingFields.length > 0) {
    throw new Error(`Backend Panchang response missing required fields: ${missingFields.join(', ')}`);
  }
}

function mapBackendPanchang(data, dateParts) {
  const fallback = buildUnavailablePanchangData(dateParts, null);
  const date = getDateFromParts(getSafeDateParts(dateParts));
  const weekdayRule = getWeekdayRule(date);
  const tithi = displayValue(data?.tithiName);
  const paksha = displayValue(data?.paksha);
  const lunarMonth = displayValue(data?.lunarMonth);
  const nakshatra = displayValue(data?.nakshatra);
  const yoga = displayValue(data?.yogaName);
  const karana = displayValue(data?.karana);
  const dateLabel = fallback.dateLabel;

  return {
    ...fallback,
    dateISO: displayValue(data?.date, fallback.dateISO),
    dateLabel,
    weekday: displayValue(data?.vara, fallback.weekday),
    hindiDateLabel: [paksha, tithi].filter((value) => value !== UNAVAILABLE).join(' ') || UNAVAILABLE,
    tithi,
    tithiEnd: PHASE_1_UNAVAILABLE,
    nakshatra,
    nakshatraEnd: PHASE_1_UNAVAILABLE,
    yoga,
    yogaDescription: displayValue(data?.yogaDescription),
    karana,
    paksha,
    masa: lunarMonth,
    lunarMonth,
    ayan: displayValue(data?.ayanamsa, fallback.ayan),
    vaar: displayValue(data?.vara, fallback.vaar),
    sunrise: displayValue(data?.sunrise),
    sunset: displayValue(data?.sunset),
    horaLord: displayValue(data?.horaLord),
    dishaShool: displayValue(data?.dishaShool),
    ishtaKaala: displayValue(data?.ishtaKaala),
    ayanamsa: displayValue(data?.ayanamsa, DEFAULT_LOCATION.ayanamsa),
    locationName: displayValue(data?.locationName, DEFAULT_LOCATION.locationName),
    latitude: data?.latitude,
    longitude: data?.longitude,
    timezone: displayValue(data?.timezone, DEFAULT_LOCATION.timezone),
    source: displayValue(data?.source, 'VEDASTRO'),
    isRealData: data?.isRealData === true,
    errorMessage: null,
    importance: buildImportanceText(data, { tithi, paksha, nakshatra }),
    recommendedPuja: weekdayRule.recommendedPuja,
    recommendedDeityId: weekdayRule.recommendedDeityId,
    recommendedMantra: weekdayRule.recommendedMantra,
    mantraMeaning: weekdayRule.mantraMeaning,
    suggestedBhaktiActions: getSuggestedBhaktiActionsForDate({
      recommendedPuja: weekdayRule.recommendedPuja,
      recommendedDeityId: weekdayRule.recommendedDeityId,
      recommendedMantra: weekdayRule.recommendedMantra,
    }),
    festivals: getPhase1FestivalItems(dateLabel),
    muhurtas: [],
    calendarMarkers: [],
  };
}

async function getPanchangFromAPI({
  year,
  month,
  day,
  latitude = DEFAULT_LOCATION.latitude,
  longitude = DEFAULT_LOCATION.longitude,
  locationName = DEFAULT_LOCATION.locationName,
  timezone = DEFAULT_LOCATION.timezone,
  ayanamsa = DEFAULT_LOCATION.ayanamsa,
}) {
  const dateParts = getSafeDateParts({ year, month, day });
  const dateISO = getDateISO(dateParts.year, dateParts.month, dateParts.day);
  const safeLatitude = Number.isFinite(latitude) ? latitude : DEFAULT_LOCATION.latitude;
  const safeLongitude = Number.isFinite(longitude) ? longitude : DEFAULT_LOCATION.longitude;
  const query = buildQuery({
    date: dateISO,
    lat: safeLatitude,
    lon: safeLongitude,
    locationName: locationName || DEFAULT_LOCATION.locationName,
    timezone: timezone || DEFAULT_LOCATION.timezone,
    ayanamsa: ayanamsa || DEFAULT_LOCATION.ayanamsa,
  });
  const requestUrl = `${API_BASE_URL}/api/v1/panchang/daily?${query}`;

  debugLog('API_BASE_URL', API_BASE_URL);
  debugLog('API_BASE_URL source', API_BASE_URL_SOURCE);
  debugLog('request URL', requestUrl);

  let response;

  try {
    response = await fetch(requestUrl);
    debugLog('HTTP status', response.status);
  } catch (error) {
    console.warn('panchangService: backend network call failed.', error?.message);
    throw new Error(REAL_DATA_ERROR_MESSAGE);
  }

  let apiResponse;

  try {
    apiResponse = await response.json();
    debugLog('raw backend JSON', apiResponse);
  } catch (error) {
    console.warn('panchangService: backend response was not JSON.', error?.message);
    throw new Error(REAL_DATA_ERROR_MESSAGE);
  }

  if (response.ok && apiResponse?.success === true && apiResponse.data) {
    try {
      assertBackendPanchangData(apiResponse.data);
      const mappedPanchang = mapBackendPanchang(apiResponse.data, dateParts);
      debugLog('mapped Panchang object', mappedPanchang);
      return mappedPanchang;
    } catch (error) {
      console.warn('panchangService: backend Panchang data was incomplete.', error?.message);
      throw new Error(REAL_DATA_ERROR_MESSAGE);
    }
  }

  console.warn('panchangService: backend returned Panchang error.', apiResponse?.message);
  throw new Error(REAL_DATA_ERROR_MESSAGE);
}

function getFallbackPanchangData(dateParts) {
  return buildUnavailablePanchangData(dateParts);
}

function normalizePanchangData(data, dateParts) {
  const fallback = getFallbackPanchangData(dateParts);

  if (!data) {
    return fallback;
  }

  return {
    ...fallback,
    ...data,
    samvat: data.samvat || data.vikramSamvat || fallback.samvat,
    vaar: data.vaar || data.weekday || fallback.vaar,
    muhurtas: Array.isArray(data.muhurtas) ? data.muhurtas : fallback.muhurtas,
    festivals: Array.isArray(data.festivals) && data.festivals.length ? data.festivals : fallback.festivals,
    calendarMarkers: Array.isArray(data.calendarMarkers) ? data.calendarMarkers : fallback.calendarMarkers,
    isRealData: data.isRealData === true,
    errorMessage: data.errorMessage || null,
  };
}

export {
  getFallbackPanchangData,
  getPanchangFromAPI,
  normalizePanchangData,
};
