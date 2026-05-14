// ============================================================
// src/services/panchangService.js
// ============================================================
//
// Panchang data foundation for the Bhakti Calendar screen.
//
// IMPORTANT:
//   Only sunrise and sunset currently come from a real API
//   (sunrise-sunset.org). All lunar Panchang values below
//   are deterministic local placeholders. They are NOT
//   astronomically accurate yet.
//
//   Later, getBasicPanchangForDate can be replaced with a real
//   Panchang API while keeping the returned object shape stable.
// ============================================================

const TITHIS = [
  'Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami',
  'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami',
  'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi', 'Purnima',
  'Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami',
  'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami',
  'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi', 'Amavasya',
];

const NAKSHATRAS = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira',
  'Ardra', 'Punarvasu', 'Pushya', 'Ashlesha', 'Magha',
  'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati',
  'Vishakha', 'Anuradha', 'Jyeshtha', 'Mula', 'Purva Ashadha',
  'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha',
  'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati',
];

const YOGAS = [
  'Vishkambha', 'Priti', 'Ayushman', 'Saubhagya', 'Shobhana',
  'Atiganda', 'Sukarma', 'Dhriti', 'Shoola', 'Ganda',
  'Vriddhi', 'Dhruva', 'Vyaghata', 'Harshana', 'Vajra',
  'Siddhi', 'Vyatipata', 'Variyan', 'Parigha', 'Shiva',
  'Siddha', 'Sadhya', 'Shubha', 'Shukla', 'Brahma',
  'Indra', 'Vaidhriti',
];

const KARANAS = [
  'Bava', 'Balava', 'Kaulava', 'Taitila', 'Garaja',
  'Vanija', 'Vishti', 'Shakuni', 'Chatushpada', 'Naga', 'Kimstughna',
];

const MASA_NAMES = [
  'Chaitra', 'Vaishakha', 'Jyeshtha', 'Ashadha', 'Shravana', 'Bhadrapada',
  'Ashwin', 'Kartika', 'Margashirsha', 'Pausha', 'Magha', 'Phalguna',
];

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

function formatUTCtoLocalTime(utcString) {
  const date = new Date(utcString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

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

function getIndexedValue(items, year, month, day, offset = 0) {
  const index = Math.abs((year * 17 + month * 31 + day + offset) % items.length);
  return items[index];
}

function getPlaceholderTime(day, baseHour, minuteStep = 7) {
  const hour = (baseHour + (day % 5)) % 24;
  const minute = (day * minuteStep) % 60;
  const date = new Date(2000, 0, 1, hour, minute);

  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getPlaceholderWindow(day, baseHour, durationMinutes) {
  const start = new Date(2000, 0, 1, baseHour + (day % 3), (day * 11) % 60);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

  return `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

function getTithiIndex(day) {
  return (day - 1) % TITHIS.length;
}

function getFestivalForDate({ month, day, tithi }) {
  const monthDay = `${month + 1}-${day}`;

  const festivalsByDate = {
    '1-14': 'Makar Sankranti',
    '3-8': 'Maha Shivratri',
    '3-25': 'Holi',
    '4-17': 'Ram Navami',
    '4-23': 'Hanuman Jayanti',
    '8-26': 'Janmashtami',
    '9-7': 'Ganesh Chaturthi',
    '10-3': 'Navratri',
    '10-12': 'Dussehra',
    '10-31': 'Diwali',
  };

  if (festivalsByDate[monthDay]) return festivalsByDate[monthDay];
  if (tithi === 'Ekadashi') return 'Ekadashi';
  if (tithi === 'Purnima') return 'Purnima';
  if (tithi === 'Amavasya') return 'Amavasya';
  if (tithi === 'Trayodashi') return 'Pradosh Vrat';
  if (tithi === 'Chaturthi') return 'Sankashti Chaturthi';

  return 'None';
}

function getRecommendedPujaForDate({ weekday, festival }) {
  const festivalRules = [
    {
      match: 'Ekadashi',
      value: {
        recommendedPuja: 'Krishna/Vishnu Puja',
        recommendedDeityId: 'krishna',
      },
    },
    {
      match: 'Pradosh Vrat',
      value: {
        recommendedPuja: 'Shiv Ji Puja',
        recommendedDeityId: 'shiv',
      },
    },
    {
      match: 'Purnima',
      value: {
        recommendedPuja: 'Krishna/Vishnu Puja',
        recommendedDeityId: 'krishna',
      },
    },
    {
      match: 'Sankashti Chaturthi',
      value: {
        recommendedPuja: 'Ganesh Ji Puja',
        recommendedDeityId: 'ganesh',
      },
    },
    {
      match: 'Navratri',
      value: {
        recommendedPuja: 'Durga Ma Puja',
        recommendedDeityId: 'durga',
      },
    },
    {
      match: 'Diwali',
      value: {
        recommendedPuja: 'Lakshmi Ma Puja',
        recommendedDeityId: 'lakshmi',
      },
    },
    {
      match: 'Janmashtami',
      value: {
        recommendedPuja: 'Krishna Ji Puja',
        recommendedDeityId: 'krishna',
      },
    },
    {
      match: 'Hanuman Jayanti',
      value: {
        recommendedPuja: 'Hanuman Ji Puja',
        recommendedDeityId: 'hanuman',
      },
    },
  ];

  const festivalRule = festivalRules.find((rule) => festival.includes(rule.match));
  if (festivalRule) return festivalRule.value;

  const weekdayRule = WEEKDAY_RULES[weekday];
  return {
    recommendedPuja: weekdayRule.recommendedPuja,
    recommendedDeityId: weekdayRule.recommendedDeityId,
  };
}

function getRecommendedMantraForDate({ weekday, festival }) {
  const festivalRules = [
    {
      match: 'Ekadashi',
      mantra: 'Om Namo Bhagavate Vasudevaya',
      meaning: 'A devotional mantra for surrender to Lord Krishna/Vishnu.',
    },
    {
      match: 'Pradosh Vrat',
      mantra: 'Om Namah Shivaya',
      meaning: 'I bow to Lord Shiva, the auspicious and compassionate one.',
    },
    {
      match: 'Purnima',
      mantra: 'Om Namo Bhagavate Vasudevaya',
      meaning: 'A devotional mantra for surrender to Lord Krishna/Vishnu.',
    },
    {
      match: 'Sankashti Chaturthi',
      mantra: 'Om Gan Ganapataye Namaha',
      meaning: 'I bow to Lord Ganesha, remover of obstacles.',
    },
    {
      match: 'Navratri',
      mantra: 'Om Dum Durgayei Namaha',
      meaning: 'I bow to Durga Ma, the protective divine mother.',
    },
    {
      match: 'Diwali',
      mantra: 'Om Shreem Mahalakshmiyei Namaha',
      meaning: 'I bow to Mahalakshmi, source of grace, abundance, and auspiciousness.',
    },
    {
      match: 'Janmashtami',
      mantra: 'Om Namo Bhagavate Vasudevaya',
      meaning: 'A devotional mantra for surrender to Lord Krishna.',
    },
    {
      match: 'Hanuman Jayanti',
      mantra: 'Om Hanumate Namaha',
      meaning: 'I bow to Hanuman Ji, source of strength, courage, and devotion.',
    },
  ];

  const festivalRule = festivalRules.find((rule) => festival.includes(rule.match));
  if (festivalRule) {
    return {
      recommendedMantra: festivalRule.mantra,
      mantraMeaning: festivalRule.meaning,
    };
  }

  const weekdayRule = WEEKDAY_RULES[weekday];
  return {
    recommendedMantra: weekdayRule.recommendedMantra,
    mantraMeaning: weekdayRule.mantraMeaning,
  };
}

function getCalendarMarkersForDate({ festival, isEkadashi, isPurnima, isAmavasya, isFast }) {
  const markers = [];

  if (festival !== 'None') markers.push('festival');
  if (isEkadashi) markers.push('ekadashi');
  if (isPurnima) markers.push('purnima');
  if (isAmavasya) markers.push('amavasya');
  if (isFast) markers.push('fast');

  return markers;
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function getImportanceForDate({ festival, tithi, paksha, recommendedPuja }) {
  if (festival !== 'None') {
    return `${festival} is a meaningful day for ${recommendedPuja}, japa, and a simple devotional sankalp.`;
  }

  if (tithi === 'Ekadashi') {
    return 'Ekadashi is traditionally observed with fasting, Vishnu/Krishna bhakti, and mantra japa.';
  }

  if (tithi === 'Purnima') {
    return 'Purnima is a bright full moon day for gratitude, prayer, charity, and peaceful reflection.';
  }

  if (tithi === 'Amavasya') {
    return 'Amavasya is a quiet new moon day for inner reflection, diya lighting, and remembrance.';
  }

  return `${paksha} ${tithi} is suitable for steady daily sadhana and ${recommendedPuja}.`;
}

function getSuggestedBhaktiActionsForDate({
  festival,
  fast,
  recommendedPuja,
  recommendedDeityId,
  recommendedMantra,
  isFast,
}) {
  const actions = [
    {
      id: 'light-evening-diya',
      title: 'Light a diya in the evening',
      description: 'Offer a simple diya with a quiet prayer for the day.',
      icon: '🪔',
      actionType: 'ritual',
      target: null,
    },
    {
      id: `chant-${slugify(recommendedMantra)}`,
      title: 'Chant today’s mantra 108 times',
      description: recommendedMantra,
      icon: '📿',
      actionType: 'mantra',
      target: recommendedMantra,
    },
    {
      id: 'avoid-rahu-kaal',
      title: 'Avoid starting important work during Rahu Kaal',
      description: 'Use Rahu Kaal as a planning caution until accurate Panchang API data is added.',
      icon: '⚠️',
      actionType: 'guidance',
      target: 'rahuKaal',
    },
    {
      id: `start-${slugify(recommendedPuja)}`,
      title: 'Start recommended puja',
      description: recommendedPuja,
      icon: '🛕',
      actionType: 'puja',
      target: recommendedDeityId,
    },
  ];

  if (festival !== 'None' || isFast) {
    actions.push({
      id: `set-reminder-${slugify(festival !== 'None' ? festival : fast)}`,
      title: 'Set reminder for festival or vrat',
      description: festival !== 'None' ? festival : fast,
      icon: '🔔',
      actionType: 'reminder',
      target: festival !== 'None' ? festival : fast,
    });
  }

  return actions;
}

function getFastForDate({ festival, isEkadashi }) {
  if (isEkadashi) return 'Ekadashi Vrat';
  if (festival === 'Pradosh Vrat') return 'Pradosh Vrat';
  if (festival === 'Sankashti Chaturthi') return 'Sankashti Vrat';
  return 'None';
}

function getBasicPanchangForDate({ year, month, day }) {
  const date = new Date(year, month, day);
  const tithiIndex = getTithiIndex(day);
  const tithi = TITHIS[tithiIndex];
  const paksha = tithiIndex <= 14 ? 'Shukla Paksha' : 'Krishna Paksha';
  const festival = getFestivalForDate({ month, day, tithi });
  const isEkadashi = tithi === 'Ekadashi';
  const isPurnima = tithi === 'Purnima';
  const isAmavasya = tithi === 'Amavasya';
  const fast = getFastForDate({ festival, isEkadashi });
  const isFestival = festival !== 'None';
  const isFast = fast !== 'None';
  const puja = getRecommendedPujaForDate({ weekday: date.getDay(), festival });
  const mantra = getRecommendedMantraForDate({ weekday: date.getDay(), festival });

  return {
    dateISO: getDateISO(year, month, day),
    dateLabel: formatDateLabel(date),
    weekday: date.toLocaleDateString([], { weekday: 'long' }),
    hindiDateLabel: `${paksha} ${tithi}`,
    tithi,
    tithiEnd: getPlaceholderTime(day, 20),
    nakshatra: getIndexedValue(NAKSHATRAS, year, month, day),
    nakshatraEnd: getPlaceholderTime(day, 14, 9),
    yoga: getIndexedValue(YOGAS, year, month, day, 5),
    karana: getIndexedValue(KARANAS, year, month, day, 11),
    paksha,
    masa: getIndexedValue(MASA_NAMES, year, month, day, 2),
    vikramSamvat: year + 57,
    moonrise: getPlaceholderTime(day, 18, 13),
    moonset: getPlaceholderTime(day, 6, 17),
    rahuKaal: getPlaceholderWindow(day, 7, 90),
    shubhMuhurat: getPlaceholderWindow(day, 10, 75),
    festival,
    fast,
    importance: getImportanceForDate({
      festival,
      tithi,
      paksha,
      recommendedPuja: puja.recommendedPuja,
    }),
    recommendedPuja: puja.recommendedPuja,
    recommendedDeityId: puja.recommendedDeityId,
    recommendedMantra: mantra.recommendedMantra,
    mantraMeaning: mantra.mantraMeaning,
    suggestedBhaktiActions: getSuggestedBhaktiActionsForDate({
      festival,
      fast,
      recommendedPuja: puja.recommendedPuja,
      recommendedDeityId: puja.recommendedDeityId,
      recommendedMantra: mantra.recommendedMantra,
      isFast,
    }),
    calendarMarkers: getCalendarMarkersForDate({
      festival,
      isEkadashi,
      isPurnima,
      isAmavasya,
      isFast,
    }),
    isEkadashi,
    isPurnima,
    isAmavasya,
    isFestival,
    isFast,
  };
}

function buildPanchangResponse({ year, month, day, sunrise, sunset }) {
  const basic = getBasicPanchangForDate({ year, month, day });

  return {
    dateISO: basic.dateISO,
    dateLabel: basic.dateLabel,
    weekday: basic.weekday,
    hindiDateLabel: basic.hindiDateLabel,
    tithi: basic.tithi,
    tithiEnd: basic.tithiEnd,
    nakshatra: basic.nakshatra,
    nakshatraEnd: basic.nakshatraEnd,
    yoga: basic.yoga,
    karana: basic.karana,
    paksha: basic.paksha,
    masa: basic.masa,
    vikramSamvat: basic.vikramSamvat,
    sunrise,
    sunset,
    moonrise: basic.moonrise,
    moonset: basic.moonset,
    rahuKaal: basic.rahuKaal,
    shubhMuhurat: basic.shubhMuhurat,
    festival: basic.festival,
    fast: basic.fast,
    importance: basic.importance,
    recommendedPuja: basic.recommendedPuja,
    recommendedDeityId: basic.recommendedDeityId,
    recommendedMantra: basic.recommendedMantra,
    mantraMeaning: basic.mantraMeaning,
    suggestedBhaktiActions: basic.suggestedBhaktiActions,
    calendarMarkers: basic.calendarMarkers,
    isEkadashi: basic.isEkadashi,
    isPurnima: basic.isPurnima,
    isAmavasya: basic.isAmavasya,
    isFestival: basic.isFestival,
    isFast: basic.isFast,
  };
}

async function getPanchangFromAPI({ year, month, day, latitude, longitude }) {
  const dateISO = getDateISO(year, month, day);
  const url =
    `https://api.sunrise-sunset.org/json?lat=${latitude}&lng=${longitude}&date=${dateISO}&formatted=0`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      throw new Error('API returned non-OK status: ' + data.status);
    }

    return buildPanchangResponse({
      year,
      month,
      day,
      sunrise: formatUTCtoLocalTime(data.results.sunrise),
      sunset: formatUTCtoLocalTime(data.results.sunset),
    });
  } catch (error) {
    console.warn('panchangService: API call failed, using fallback.', error.message);

    return buildPanchangResponse({
      year,
      month,
      day,
      sunrise: 'Unavailable',
      sunset: 'Unavailable',
    });
  }
}

export { getPanchangFromAPI };
