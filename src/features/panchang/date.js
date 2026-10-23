// Date-only values must never pass through the UTC Date string parser.
export function dateParts(date) {
  return { year: date.getFullYear(), month: date.getMonth(), day: date.getDate() };
}

export function dateISO(date) {
  const { year, month, day } = dateParts(date);
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function parseLocalDate(value, fallback = new Date()) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''));
  if (!match) return fallback;
  const [, year, month, day] = match.map(Number);
  const date = new Date(year, month - 1, day, 12);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
    ? date : fallback;
}

export function shiftMonth(date, offset) {
  const lastDay = new Date(date.getFullYear(), date.getMonth() + offset + 1, 0).getDate();
  return new Date(date.getFullYear(), date.getMonth() + offset, Math.min(date.getDate(), lastDay), 12);
}

export function validTimezone(value) {
  if (typeof value !== 'string' || !value.trim() || /^[+-]/.test(value)) return false;
  try {
    new Intl.DateTimeFormat('en', { timeZone: value.trim() }).format();
    return true;
  } catch { return false; }
}

export function deviceTimezone() {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch { return ''; }
}

export function validCoordinates(latitude, longitude) {
  return latitude !== '' && longitude !== '' && latitude != null && longitude != null
    && Number.isFinite(Number(latitude)) && Number.isFinite(Number(longitude))
    && Math.abs(Number(latitude)) <= 90 && Math.abs(Number(longitude)) <= 180;
}
