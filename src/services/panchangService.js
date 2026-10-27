import engine from '../features/panchang/engine.cjs';
import { DEFAULT_PANCHANG_LOCATION } from '../features/panchang/constants.js';
import { normalizePanchangData } from '../features/panchang/model.js';
import { getFestivalsForDate } from '../features/panchang/festivals.js';
export { getFallbackPanchangData, normalizePanchangData, getFestivalItems } from '../features/panchang/model.js';

function isVrat(festival) {
  return /ekadashi|pradosha/.test(festival.type || '')
    || /sankashti|shivaratri|karva_chauth|somvar|teej/.test(festival.key || '');
}

function enrich(data) {
  // The annual catalogue owns corrected dates, civil holidays and story identity.
  // Preserve the engine's bilingual names, deity and observance basis whenever
  // the catalogue has no replacement. Never reinsert a raw, corrected occurrence.
  const rawByKey = new Map((data.festivals || []).map((festival) => [festival.key, festival]));
  const festivals = getFestivalsForDate({ dateISO: data.dateISO, latitude: data.latitude, longitude: data.longitude, timezone: data.timezone, locationName: data.locationName, region: data.region })
    .map((festival) => ({ ...rawByKey.get(festival.key), ...Object.fromEntries(Object.entries(festival).filter(([, value]) => value !== undefined)) }));
  const observances = [...festivals, ...(data.observances || []).filter((item) => item.type === 'lunar' && !festivals.some((festival) => festival.key === item.key))];
  const fasts = festivals.filter(isVrat);
  return normalizePanchangData({
    ...data, festivals, observances,
    calendarMarkers: observances.map((item) => ({ id: item.id, type: item.type, label: item.name, labelHi: item.nameHi || item.name, deityId: item.deityId })),
    festival: festivals.map((item) => item.name).join(' · ') || 'No listed festival',
    festivalHi: festivals.map((item) => item.nameHi || item.name).join(' · ') || 'कोई सूचीबद्ध त्योहार नहीं',
    fast: fasts.map((item) => item.name).join(' · ') || 'No listed vrat',
    fastHi: fasts.map((item) => item.nameHi || item.name).join(' · ') || 'कोई सूचीबद्ध व्रत नहीं',
    isFestival: festivals.length > 0, isFast: fasts.length > 0,
    isEkadashi: festivals.some((item) => /ekadashi/.test(item.type || '')),
  }, {
    year: Number(data.dateISO.slice(0, 4)), month: Number(data.dateISO.slice(5, 7)) - 1, day: Number(data.dateISO.slice(8, 10)),
  });
}

// Existing callers keep this name. Calculations run on the device without an API key or server.
export async function getPanchangFromAPI(options = {}) {
  if (options.signal?.aborted) throw Object.assign(new Error('Cancelled'), { name: 'AbortError' });
  return enrich(engine.calculatePanchang({ ...DEFAULT_PANCHANG_LOCATION, ...options }));
}

export async function getPanchangMonth(options) {
  const days = [];
  const count = new Date(Date.UTC(options.year, options.month + 1, 0)).getUTCDate();
  for (let day = 1; day <= count; day += 1) {
    if (options.signal?.aborted) throw Object.assign(new Error('Cancelled'), { name: 'AbortError' });
    days.push(await getPanchangFromAPI({ ...options, day }));
    if (day % 4 === 0) await new Promise((resolve) => setTimeout(resolve, 0));
  }
  return days;
}
