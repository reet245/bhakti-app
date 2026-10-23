import { requestJson } from './http';

export const ZODIAC_IDS = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'];

export function unavailableHoroscopes(language = 'en') {
  const message = language === 'hi'
    ? 'हिंदी राशिफल का स्रोत अभी उपलब्ध नहीं है। अंग्रेज़ी में पढ़ने के लिए भाषा बदलें।'
    : 'Today’s horoscope is unavailable. Please try again later.';
  return Object.fromEntries(ZODIAC_IDS.map((id) => [id, { id, horoscope: message, date: '', source: '', available: false }]));
}

export async function getDailyHoroscopes(language = 'en', { signal } = {}) {
  const fallback = unavailableHoroscopes(language);
  if (language !== 'en') return fallback;
  const response = await requestJson(`/api/v1/horoscope/daily?language=${encodeURIComponent(language)}`, { signal, timeoutMs: 20000 });
  if (!response?.success || !response.data || typeof response.data !== 'object') throw new Error('Horoscope data is unavailable.');
  return ZODIAC_IDS.reduce((result, id) => {
    const item = response.data[id];
    if (typeof item?.horoscope === 'string' && item.horoscope.trim() && /^\d{4}-\d{2}-\d{2}$/.test(item.date || '')) {
      result[id] = { id, title: item.title, horoscope: item.horoscope.trim(), date: item.date, source: typeof item.source === 'string' ? item.source : '', available: true };
    }
    return result;
  }, fallback);
}
