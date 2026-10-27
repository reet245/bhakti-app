// Daily periods are bounded by sunrise, so touching slices belong to one
// continuous spell. Keep clipped outer edges explicit: they are not true events.
export function mergeMonthPeriods(days, field) {
  const slices = (days || []).flatMap((day) => Array.isArray(day?.[field]) ? day[field] : [])
    .map((period) => ({ ...period, startMs: Date.parse(period.start), endMs: Date.parse(period.end) }))
    .filter((period) => Number.isFinite(period.startMs) && Number.isFinite(period.endMs) && period.endMs > period.startMs)
    .sort((a, b) => a.startMs - b.startMs || a.endMs - b.endMs);
  const spans = [];
  for (const slice of slices) {
    const previous = spans.at(-1);
    if (previous && previous.key === slice.key && slice.startMs <= previous.endMs + 1000) {
      if (slice.startMs === previous.startMs) previous.clippedStart = previous.clippedStart && Boolean(slice.clippedStart);
      if (slice.endMs > previous.endMs) {
        previous.endMs = slice.endMs;
        previous.clippedEnd = Boolean(slice.clippedEnd);
      } else if (slice.endMs === previous.endMs) {
        previous.clippedEnd = previous.clippedEnd && Boolean(slice.clippedEnd);
      }
      continue;
    }
    spans.push({ key: slice.key, name: slice.name, nameHi: slice.nameHi, startMs: slice.startMs, endMs: slice.endMs, clippedStart: Boolean(slice.clippedStart), clippedEnd: Boolean(slice.clippedEnd) });
  }
  return spans.map(({ startMs, endMs, ...period }) => ({
    ...period, id: `${period.key}:${startMs}:${endMs}`, start: new Date(startMs).toISOString(), end: new Date(endMs).toISOString(),
  }));
}

export function formatPeriodBoundary(instant, timezone, locale = 'en-IN') {
  const milliseconds = Date.parse(instant);
  if (!Number.isFinite(milliseconds)) return '—';
  return new Intl.DateTimeFormat(locale, {
    timeZone: timezone, day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true,
  }).format(new Date(Math.round(milliseconds / 60000) * 60000));
}
