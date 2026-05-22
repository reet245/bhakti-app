const SAFE_MESSAGE = 'Unable to load today’s horoscope. Please try again later.';

const ZODIAC_SIGNS = [
  { id: 'aries', title: 'Aries' },
  { id: 'taurus', title: 'Taurus' },
  { id: 'gemini', title: 'Gemini' },
  { id: 'cancer', title: 'Cancer' },
  { id: 'leo', title: 'Leo' },
  { id: 'virgo', title: 'Virgo' },
  { id: 'libra', title: 'Libra' },
  { id: 'scorpio', title: 'Scorpio' },
  { id: 'sagittarius', title: 'Sagittarius' },
  { id: 'capricorn', title: 'Capricorn' },
  { id: 'aquarius', title: 'Aquarius' },
  { id: 'pisces', title: 'Pisces' },
];

const ZODIAC_TITLE_TO_ID = ZODIAC_SIGNS.reduce((map, sign) => ({
  ...map,
  [sign.title.toLowerCase()]: sign.id,
}), {});

export async function getDailyHoroscopes(languageCode = 'en') {
  if (languageCode !== 'en') {
    return getSafeHoroscopeData(languageCode);
  }

  try {
    console.log('Loading English horoscope RSS');

    const response = await fetch('https://feeds.feedburner.com/dayhoroscope');
    const xml = await response.text();
    const parsed = parseEnglishRSS(xml);

    console.log('Parsed horoscope signs:', Object.keys(parsed));

    if (!parsed || Object.keys(parsed).length === 0) {
      return getSafeHoroscopeData('en');
    }

    return {
      ...getSafeHoroscopeData('en'),
      ...parsed,
    };
  } catch (error) {
    console.log('English horoscope RSS failed:', error);
    return getSafeHoroscopeData('en');
  }
}

function getSafeHoroscopeData(languageCode = 'en') {
  return ZODIAC_SIGNS.reduce((horoscopeMap, sign) => ({
    ...horoscopeMap,
    [sign.id]: {
      id: sign.id,
      title: sign.title,
      horoscope: SAFE_MESSAGE,
      date: '',
      luckyNumber: '',
      luckyColor: '',
      remedy: '',
      source: '',
    },
  }), {});
}

function parseEnglishRSS(xml) {
  try {
    if (!xml || typeof xml !== 'string') {
      return {};
    }

    const parsed = {};
    const itemBlocks = xml.match(/<item\b[^>]*>[\s\S]*?<\/item>/gi) || [];

    itemBlocks.forEach((itemBlock) => {
      const title = cleanRSSValue(extractRSSValue(itemBlock, 'title'));
      const horoscope = cleanRSSValue(extractRSSValue(itemBlock, 'description'));
      const date = cleanRSSValue(extractRSSValue(itemBlock, 'pubDate'));
      const zodiacId = getZodiacIdFromTitle(title);

      if (!zodiacId || !horoscope) {
        return;
      }

      parsed[zodiacId] = {
        id: zodiacId,
        title: getZodiacTitle(zodiacId),
        horoscope,
        date,
        source: 'english-rss',
      };
    });

    return parsed;
  } catch (error) {
    return {};
  }
}

function extractRSSValue(itemBlock, tagName) {
  const match = itemBlock.match(new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i'));
  return match?.[1] || '';
}

function cleanRSSValue(value) {
  return decodeHTMLEntities(stripHTMLTags(stripCDATA(value))).trim();
}

function stripCDATA(value) {
  return String(value || '').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1');
}

function stripHTMLTags(value) {
  return String(value || '').replace(/<[^>]+>/g, ' ');
}

function decodeHTMLEntities(value) {
  const entityMap = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&nbsp;': ' ',
    '&rsquo;': '’',
    '&lsquo;': '‘',
    '&ldquo;': '“',
    '&rdquo;': '”',
    '&hellip;': '...',
  };

  return String(value || '')
    .replace(/&(amp|lt|gt|quot|#39|apos|nbsp|rsquo|lsquo|ldquo|rdquo|hellip);/g, (entity) => entityMap[entity] || entity)
    .replace(/&#(\d+);/g, (_, code) => {
      const codePoint = Number(code);
      return Number.isFinite(codePoint) ? String.fromCharCode(codePoint) : _;
    })
    .replace(/\s+/g, ' ');
}

function getZodiacIdFromTitle(title) {
  const normalizedTitle = String(title || '').toLowerCase();
  const matchedSign = ZODIAC_SIGNS.find((sign) => normalizedTitle.includes(sign.title.toLowerCase()));
  return matchedSign ? ZODIAC_TITLE_TO_ID[matchedSign.title.toLowerCase()] : '';
}

function getZodiacTitle(zodiacId) {
  return ZODIAC_SIGNS.find((sign) => sign.id === zodiacId)?.title || zodiacId;
}
