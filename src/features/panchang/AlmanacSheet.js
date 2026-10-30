import { useMemo, useState } from 'react';
import { Animated, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import useDevotionalStyles from '../../hooks/useDevotionalStyles';
import { CalendarArt, useCalendarCopy, weekdayDeities } from './CalendarUI';
import { dateISO, parseLocalDate } from './date';
import { mergeMonthPeriods } from './periods';
import useAlmanacZoom from './use-almanac-zoom';

// One print-style coordinate system keeps all dates and summaries together.
// The viewport adapts to the phone; pinch and pan make the fine print readable.
const SHEET_WIDTH = 760;

export default function AlmanacSheet({ days, selected, today, location, navigation, onOpenDate }) {
  const s = useDevotionalStyles(sheetStyles);
  const { c, value, locale } = useCalendarCopy();
  const [sheetHeight, setSheetHeight] = useState(0);
  const year = selected.getFullYear();
  const month = selected.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const count = new Date(year, month + 1, 0).getDate();
  const weeks = Math.ceil((firstWeekday + count) / 7);
  const selectedISO = dateISO(selected);
  const todayISO = dateISO(today);
  const events = useMemo(() => days.flatMap((day) => day.festivals || []), [days]);
  const periods = useMemo(() => [
    { key: 'panchaka', title: c('Panchak', 'पंचक'), items: mergeMonthPeriods(days, 'panchakaPeriods') },
    { key: 'gandaMula', title: c('Gand Mool', 'गंडमूल'), items: mergeMonthPeriods(days, 'gandaMulaPeriods') },
  ], [days, locale]);
  const incomplete = days.some((day) => day.noSunrise || !Array.isArray(day.panchakaPeriods) || !Array.isArray(day.gandaMulaPeriods));
  const clipped = periods.some((group) => group.items.some((period) => period.clippedStart || period.clippedEnd));
  // The year is already in the sheet heading; keep side-column times compact.
  const periodFormatter = useMemo(() => new Intl.DateTimeFormat(locale, {
    timeZone: location.timezone, day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true,
  }), [locale, location.timezone]);
  const periodTime = (instant) => periodFormatter.format(new Date(Math.round(Date.parse(instant) / 60000) * 60000));
  const monthNames = [...new Set(days.map((day) => value(day, 'purnimantaMonth')).filter(Boolean))].join(' – ');
  const samvats = [...new Set(days.map((day) => day.samvat || day.vikramSamvat).filter(Boolean))].join(' / ');
  const zoom = useAlmanacZoom({ width: SHEET_WIDTH, height: sheetHeight, resetKey: `${year}-${month}-${locale}` });
  const marker = (day) => day?.isPurnima ? '○' : day?.isAmavasya ? '●' : day?.isFast ? '✧' : '';

  return <View ref={zoom.viewportRef} collapsable={false} testID="month-almanac-viewport" style={[s.viewport, Platform.OS === 'web' && { touchAction: 'none', userSelect: 'none' }]}
      onLayout={zoom.onViewportLayout} {...zoom.panHandlers}>
    <Animated.View testID="month-almanac-sheet" onLayout={({ nativeEvent: { layout } }) => {
      setSheetHeight((previous) => Math.abs(previous - layout.height) < 0.5 ? previous : layout.height);
    }} style={[s.sheet, {
      width: SHEET_WIDTH,
      opacity: zoom.ready ? 1 : 0,
    }, zoom.animatedStyle]}>
      <View style={s.banner}>
        <CalendarArt deity="shiv" size={62} />
        <View style={s.bannerCopy}>
          <Text style={s.title}>{c('Bhakti Almanac', 'भक्ति पंचांग')} {year}</Text>
          <Text style={s.subtitle}>{location.locationName} · {location.timezone}</Text>
        </View>
        <CalendarArt deity="ganesh" size={54} />
      </View>
      <View style={s.monthBand}>
        <Text style={s.monthTitle}>{selected.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}</Text>
        <Text style={s.monthDetail}>{samvats ? `${c('Vikram Samvat', 'विक्रम संवत')} ${samvats}` : c('Purnimanta', 'पूर्णिमांत')}</Text>
        <Text style={s.monthDetail}>{monthNames}</Text>
      </View>
      <View style={s.body}>
        <View style={s.grid}>
          {Array.from({ length: 7 }, (_, weekday) => <View key={weekday} style={s.weekRow}>
            <View style={s.weekday}>
              <CalendarArt deity={weekdayDeities[weekday]} size={42} />
              <Text style={[s.weekdayLabel, weekday === 0 && s.sunday]}>{new Date(2026, 9, 4 + weekday).toLocaleDateString(locale, { weekday: 'short' })}</Text>
            </View>
            {Array.from({ length: weeks }, (_, week) => {
              const number = week * 7 + weekday - firstWeekday + 1;
              if (number < 1 || number > count) return <View key={week} style={[s.day, s.empty]} />;
              const day = days[number - 1];
              const iso = dateISO(new Date(year, month, number, 12));
              const festivals = day?.festivals || [];
              const isSelected = iso === selectedISO;
              const isToday = iso === todayISO;
              const lunar = day && !day.noSunrise ? `${value(day, 'paksha') || ''} ${day.tithiNumber || ''}` : '';
              const description = [
                parseLocalDate(iso).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
                lunar, value(day, 'tithi'), value(day, 'nakshatra'),
                ...festivals.map((festival) => value(festival, 'name')),
                isToday ? c('Today', 'आज') : '',
                day?.noSunrise ? c('No sunrise-based Panchang', 'सूर्योदय आधारित पंचांग उपलब्ध नहीं') : '',
              ].filter(Boolean).join(', ');
              return <TouchableOpacity key={week} accessibilityRole="button" accessibilityLabel={description}
                accessibilityHint={c('Opens Daily Panchang', 'दैनिक पंचांग खोलें')}
                accessibilityState={{ selected: isSelected }} activeOpacity={0.7}
                onPress={() => { if (zoom.canActivate()) onOpenDate(iso); }} style={[s.day, day?.isFast && s.fastDay, weekday === 0 && s.sundayCell, isSelected && s.selectedCell, isToday && s.todayCell]}>
                <View style={s.dateRow}>
                  <Text style={[s.date, weekday === 0 && s.sunday]}>{number}</Text>
                  <View style={s.dayArt}>{festivals.length ? <CalendarArt festival={festivals[0]} size={26} /> : <Text style={s.moon}>{marker(day)}</Text>}
                    {festivals.length > 1 && <Text style={s.eventCount}>+{festivals.length - 1}</Text>}
                  </View>
                </View>
                {day?.noSunrise ? <Text style={s.dayText}>{c('No sunrise-based Panchang', 'सूर्योदय आधारित पंचांग उपलब्ध नहीं')}</Text> : <>
                  <Text style={s.lunar}>{`${(value(day, 'paksha') || '').split(' ')[0]} ${day?.tithiNumber || ''}`}</Text>
                  <Text style={s.dayText}>{value(day, 'tithi') || '—'}</Text>
                  <Text style={s.dayText}>{value(day, 'nakshatra') || '—'}</Text>
                  <View style={s.sunTimes}><Text style={s.time}>↑ {day?.sunrise || '—'}</Text><Text style={s.time}>↓ {day?.sunset || '—'}</Text></View>
                </>}
              </TouchableOpacity>;
            })}
          </View>)}
        </View>
        <View style={s.sidebar}>
          <Text style={s.sideHeading}>{c('Calendar guide', 'पंचांग संकेत')}</Text>
          <View style={s.sideSection}>
            <Text style={s.sideText}>○ {c('Purnima', 'पूर्णिमा')}</Text>
            <Text style={s.sideText}>● {c('Amavasya', 'अमावस्या')}</Text>
            <Text style={s.sideText}>✧ {c('Vrat', 'व्रत')}</Text>
            <Text style={s.sideText}>↑ {c('Sunrise', 'सूर्योदय')}</Text>
            <Text style={s.sideText}>↓ {c('Sunset', 'सूर्यास्त')}</Text>
            <Text style={s.sideNote}>{c('Gold border: today. Shaded date: selected.', 'सुनहरी सीमा: आज। गहरा रंग: चुनी तारीख।')}</Text>
          </View>
          {periods.map((group) => <View key={group.key}>
            <Text style={s.sideHeading}>{group.title}</Text>
            <View style={s.sideSection}>
              {group.items.map((period) => <View key={period.id} style={s.period}>
                <Text style={s.periodLabel}>{period.clippedStart ? c('← Ongoing from', '← जारी है') : c('Begins', 'आरंभ')}</Text>
                <Text style={s.sideText}>{periodTime(period.start)}</Text>
                <Text style={s.periodLabel}>{period.clippedEnd ? c('Continues beyond →', 'आगे भी जारी →') : c('Ends', 'समाप्ति')}</Text>
                <Text style={s.sideText}>{periodTime(period.end)}</Text>
              </View>)}
              {!group.items.length && <Text style={s.sideText}>{c('No calculated period', 'कोई गणित अवधि नहीं')}</Text>}
            </View>
          </View>)}
          {clipped && <Text style={[s.sideNote, s.sideSection]}>{c('← / → Coverage reaches the first / last sunrise of this month, not the actual start / end.', '← / → सीमा इस महीने का पहला / अंतिम सूर्योदय है, अवधि का वास्तविक आरंभ / अंत नहीं।')}</Text>}
          {incomplete && <Text style={[s.sideNote, s.sideSection]}>{c('Some days have no complete solar cycle. Periods cover available days only.', 'कुछ दिनों का पूरा सौर चक्र उपलब्ध नहीं है। अवधियाँ केवल उपलब्ध दिनों की हैं।')}</Text>}
        </View>
      </View>
      <View style={s.festivals}>
        <Text style={s.festivalTitle}>{c('This month’s festivals & vrats', 'इस महीने के त्योहार व व्रत')}</Text>
        <Text style={s.festivalList}>{events.length ? events.map((festival, index) => <Text key={`${festival.id || festival.key}-${index}`}>
          {index > 0 ? '   •   ' : ''}<Text accessibilityRole="link" onPress={() => { if (zoom.canActivate()) navigation.navigate('FestivalDetail', { festival }); }}>
            <Text style={s.festivalDate}>{Number(festival.dateISO?.slice(-2)) || ''}</Text> {value(festival, 'name')}
          </Text>
        </Text>) : c('No festivals listed for this month.', 'इस महीने कोई पर्व सूचीबद्ध नहीं है।')}</Text>
      </View>
      <Text style={s.footer}>{c('North Indian · Purnimanta · Local sunrise · Sundays are not a public holiday list. Calculation notes in Daily Panchang.', 'उत्तर भारतीय · पूर्णिमांत · स्थानीय सूर्योदय · रविवार सरकारी अवकाश सूची नहीं है। गणना व स्रोत दैनिक पंचांग में देखें।')}</Text>
    </Animated.View>
  </View>;
}

const sheetStyles = StyleSheet.create({
  viewport: { flex: 1, minHeight: 0, width: '100%', overflow: 'hidden' },
  sheet: { position: 'absolute', top: 0, left: 0, backgroundColor: '#FFF7E3', borderWidth: 2, borderColor: '#B48222', borderRadius: 6, overflow: 'hidden' },
  banner: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, gap: 10, backgroundColor: '#F1D894' },
  bannerCopy: { flex: 1, alignItems: 'center', gap: 2 }, title: { fontSize: 29, fontWeight: '900', color: '#3F2713' },
  subtitle: { fontSize: 12, color: '#725C38' },
  monthBand: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFD487', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#DCC28A', padding: 7, gap: 8 },
  monthTitle: { flex: 1.2, fontSize: 18, fontWeight: '800', color: '#3F2713' }, monthDetail: { flex: 1, fontSize: 15, fontWeight: '700', textAlign: 'center', color: '#80520F' },
  body: { flexDirection: 'row' }, grid: { flex: 1 }, weekRow: { flex: 1, flexDirection: 'row', minHeight: 108 },
  weekday: { width: 58, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1D894', borderBottomWidth: 1, borderRightWidth: 1, borderColor: '#DCC28A', gap: 5 },
  weekdayLabel: { fontSize: 14, fontWeight: '800', color: '#3F2713' },
  day: { flex: 1, minWidth: 0, paddingHorizontal: 5, paddingVertical: 3, borderRightWidth: 1, borderBottomWidth: 1, borderColor: '#DCC28A' },
  empty: { backgroundColor: '#F4EDDC' }, fastDay: { backgroundColor: '#FFF0C8' }, sundayCell: { backgroundColor: '#F8E6CB' },
  selectedCell: { backgroundColor: '#EFD487' }, todayCell: { borderWidth: 2, borderColor: '#B48222', paddingHorizontal: 4, paddingVertical: 2 },
  dateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  date: { fontSize: 34, lineHeight: 39, fontWeight: '900', color: '#3F2713', fontVariant: ['tabular-nums'] }, sunday: { color: '#AF4339' },
  dayArt: { flexDirection: 'row', alignItems: 'center' }, moon: { fontSize: 23, color: '#80520F' }, eventCount: { fontSize: 9, color: '#80520F' },
  lunar: { fontSize: 11, lineHeight: 16, fontWeight: '800', color: '#80520F' }, dayText: { fontSize: 11, lineHeight: 15, color: '#3F2713' },
  sunTimes: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 3 }, time: { fontSize: 8, lineHeight: 12, color: '#725C38' },
  sidebar: { width: 132, backgroundColor: '#FFFCF3' }, sideHeading: { backgroundColor: '#EFD487', padding: 6, fontSize: 14, fontWeight: '800', textAlign: 'center', color: '#80520F' },
  sideSection: { padding: 7, gap: 4 }, sideText: { fontSize: 11, lineHeight: 15, color: '#3F2713' }, sideNote: { fontSize: 10, lineHeight: 14, color: '#725C38' },
  period: { paddingBottom: 5, marginBottom: 3, borderBottomWidth: 1, borderColor: '#EADAB5' }, periodLabel: { fontSize: 10, lineHeight: 14, fontWeight: '800', color: '#80520F' },
  festivals: { backgroundColor: '#F1D894', padding: 9, gap: 4 }, festivalTitle: { fontSize: 16, fontWeight: '800', color: '#80520F' },
  festivalList: { fontSize: 11, lineHeight: 17, color: '#3F2713' }, festivalDate: { fontWeight: '900', color: '#AF4339' },
  footer: { fontSize: 10, lineHeight: 15, color: '#725C38', paddingHorizontal: 8, paddingVertical: 5 },
});
