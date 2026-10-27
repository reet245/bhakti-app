// Gregorian (Western) Easter, using the Meeus/Jones/Butcher computus.
// These are calendar dates, independent of the user's location or timezone.
export function getChristianFestivalDates(year) {
  if (!Number.isInteger(year) || year < 1900 || year > 2100) {
    throw new RangeError('Year must be an integer between 1900 and 2100.');
  }

  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;

  return {
    easterDateISO: new Date(Date.UTC(year, month - 1, day)).toISOString().slice(0, 10),
    goodFridayDateISO: new Date(Date.UTC(year, month - 1, day - 2)).toISOString().slice(0, 10),
  };
}
