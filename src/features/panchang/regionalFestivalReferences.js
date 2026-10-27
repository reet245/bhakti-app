import { NORTH_FESTIVAL_REFERENCES } from './festivalReferencesNorth.js';
import { REGIONAL_FESTIVAL_REFERENCES } from './festivalReferencesRegional.js';

export const REGIONAL_REFERENCE_YEARS = Object.freeze([2026, 2027]);

// These are published civil dates for the named region, not calculated dates for
// the user's coordinates. Never copy one year's lunar observance into another.
export function getRegionalFestivalReferences(year) {
  if (!Number.isInteger(year) || year < 1900 || year > 2100) {
    throw new RangeError('Choose a year from 1900 to 2100.');
  }
  return [...NORTH_FESTIVAL_REFERENCES, ...REGIONAL_FESTIVAL_REFERENCES].flatMap((entry) => {
    const dates = entry.dates[year];
    if (!dates || (Array.isArray(dates) && dates.length === 0)) return [];
    const { dates: _dates, sources, ...metadata } = entry;
    const sourceUrl = (sources?.[year] || entry.sourceUrl).replace('{year}', String(year));
    return (Array.isArray(dates) ? dates : [dates]).map((dateISO) => Object.freeze({
      ...metadata,
      name: entry.nameEn,
      dateISO,
      type: entry.key === 'vaikuntha_ekadashi' ? 'ekadashi' : 'major',
      dateBasis: 'regional-reference',
      source: 'Published regional festival calendar',
      sourceUrl,
    }));
  });
}

export function getPendingRegionalFestivals(year, language = 'en') {
  return [...NORTH_FESTIVAL_REFERENCES, ...REGIONAL_FESTIVAL_REFERENCES]
    .filter((entry) => entry.pendingYears?.includes(year))
    .map((entry) => ({ key: entry.key, name: language === 'hi' ? entry.nameHi : entry.nameEn }));
}
