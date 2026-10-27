import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { getPanchangMonth } from '../services/panchangService';
import useDevotionalStyles from '../hooks/useDevotionalStyles';
import { dateISO, parseLocalDate, shiftMonth } from '../features/panchang/date';
import { usePanchangLocation, usePanchangToday } from '../features/panchang/locationStore';
import { formatPeriodBoundary, mergeMonthPeriods } from '../features/panchang/periods';
import { Action, CalendarArt, CalendarPage, CalendarTabs, DataNotes, DateJump, FestivalRows, calendarStyles, useCalendarCopy, weekdayDeities } from '../features/panchang/CalendarUI';

export default function PanchangCalendarScreen({ navigation, route }) {
  const s = useDevotionalStyles(calendarStyles); const g = useDevotionalStyles(gridStyles);
  const { c, value, locale } = useCalendarCopy();
  const [location] = usePanchangLocation(); const today = usePanchangToday(location.timezone, navigation);
  const focused = useIsFocused();
  const [selected, setSelected] = useState(() => parseLocalDate(route?.params?.selectedDateISO, today));
  const [view, setView] = useState(route?.params?.view === 'Almanac' ? 'Almanac' : 'Month');
  const [days, setDays] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const selectedISO = dateISO(selected); const year = selected.getFullYear(); const month = selected.getMonth();
  useEffect(() => { if (route?.params?.selectedDateISO) setSelected(parseLocalDate(route.params.selectedDateISO, today)); }, [route?.params?.selectedDateISO]);
  useEffect(() => { setView(route?.params?.view === 'Almanac' ? 'Almanac' : 'Month'); }, [route?.params?.view]);
  useEffect(() => {
    if (!focused) return;
    const controller = new AbortController(); setLoading(true); setError(''); setDays([]);
    getPanchangMonth({ year, month, ...location, signal: controller.signal }).then((result) => { if (!controller.signal.aborted) setDays(result); }).catch((err) => { if (!controller.signal.aborted) setError(err.message); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [year, month, location, focused]);
  const firstWeekday = new Date(year, month, 1).getDay();
  const count = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: Math.ceil((firstWeekday + count) / 7) * 7 }, (_, i) => {
    const day = i - firstWeekday + 1;
    return day > 0 && day <= count ? day : null;
  });
  const weekdays = Array.from({ length: 7 }, (_, i) => new Date(2026, 9, 4 + i).toLocaleDateString(locale, { weekday: 'short' }));
  const selectedData = days.find((day) => day.dateISO === selectedISO);
  const monthEvents = useMemo(() => days.flatMap((day) => day.festivals || []), [days]);
  const monthlyPeriods = useMemo(() => ({
    panchaka: mergeMonthPeriods(days, 'panchakaPeriods'),
    gandaMula: mergeMonthPeriods(days, 'gandaMulaPeriods'),
  }), [days]);
  const incompletePeriodCoverage = days.some((day) => day.noSunrise || !Array.isArray(day.panchakaPeriods) || !Array.isArray(day.gandaMulaPeriods));
  const monthNames = [...new Set(days.map((day) => value(day, 'purnimantaMonth')).filter(Boolean))].join(' – ');
  const pick = (day) => setSelected(new Date(year, month, day, 12));
  const openDaily = (date = selectedISO) => navigation.navigate('Calendar', { selectedDateISO: date });
  const moon = (day) => day?.isPurnima ? '○' : day?.isAmavasya ? '●' : day?.isFast ? '✧' : '';
  return <CalendarPage navigation={navigation} title={view === 'Almanac' ? c('Illustrated Almanac', 'सचित्र पंचांग') : c('Monthly Calendar', 'मासिक कैलेंडर')} wide>
    <CalendarTabs active={view} navigation={navigation} selectedDateISO={selectedISO} />
    <Action onPress={() => navigation.navigate('Calendar', { selectedDateISO: selectedISO })}>⌖ {location.locationName} · {c('Location settings in Daily Panchang', 'दैनिक पंचांग में स्थान बदलें')}</Action>
    <View style={s.between}><Action label={c('Previous month', 'पिछला महीना')} onPress={() => setSelected(shiftMonth(selected, -1))} disabled={year <= 1900 && month === 0}>‹</Action><View style={{ flex: 1 }}><Text style={[s.sectionTitle, { textAlign: 'center' }]}>{selected.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}</Text><Text style={[s.hint, { textAlign: 'center' }]}>{monthNames || c('North Indian · Purnimanta', 'उत्तर भारतीय · पूर्णिमांत')}{days[0]?.samvat ? ` · ${c('Vikram', 'विक्रम')} ${days[0].samvat}` : ''}</Text></View><Action label={c('Next month', 'अगला महीना')} onPress={() => setSelected(shiftMonth(selected, 1))} disabled={year >= 2100 && month === 11}>›</Action></View>
    <View style={s.between}><DateJump date={selected} onChange={setSelected} /><Action onPress={() => setSelected(today)}>{c('Today', 'आज')}</Action></View>
    {loading && <View style={s.row}><ActivityIndicator color="#B48222" /><Text style={s.hint}>{c('Calculating this month…', 'इस महीने की गणना…')}</Text></View>}
    {!!error && <Text accessibilityRole="alert" style={s.body}>{error}</Text>}
    {view === 'Month' ? <View style={g.calendar}>
      <View style={g.weekRow}>{weekdays.map((day, i) => <Text key={day} style={[g.weekLabel, i === 0 && g.sunday]}>{day}</Text>)}</View>
      <View style={g.grid}>{cells.map((day, i) => {
        const data = day ? days[day - 1] : null;
        const isSelected = day === selected.getDate(); const isToday = day && dateISO(new Date(year, month, day)) === dateISO(today);
        return day ? <TouchableOpacity key={i} accessibilityRole="button" accessibilityLabel={`${day} ${selected.toLocaleDateString(locale, { month: 'long' })}${data ? `, ${value(data, 'paksha')} ${value(data, 'tithi')}, ${data.festivals.map((item) => value(item, 'name')).join(', ')}` : ''}`} accessibilityState={{ selected: isSelected }} onPress={() => pick(day)} style={[g.cell, isToday && g.todayCell, isSelected && g.selectedCell]}>
          <View style={g.cellHead}><Text style={[g.dayNumber, i % 7 === 0 && g.sunday]}>{day}</Text><Text style={g.tithiNumber}>{data?.tithiNumber || ''}</Text></View>
          <Text numberOfLines={1} style={g.tithi}>{data ? value(data, 'tithi') : ' '}</Text>
          <View style={g.cellArt}>{data?.festivals?.length ? <CalendarArt festival={data.festivals[0]} size={25} /> : <Text style={g.moon}>{moon(data)}</Text>}{data?.festivals?.length > 1 ? <Text style={g.eventCount}>+{data.festivals.length - 1}</Text> : null}</View>
        </TouchableOpacity> : <View key={i} style={[g.cell, g.emptyCell]} />;
      })}</View>
    </View> : <View style={s.card}>
      <View style={s.between}><CalendarArt deity="ganesh" size={60} /><View style={{ flex: 1 }}><Text style={s.heroTitle}>{c('Bhakti Almanac', 'भक्ति पंचांग')}</Text><Text style={s.hint}>{c('Tithi · Nakshatra · Sunrise · Sunset', 'तिथि · नक्षत्र · सूर्योदय · सूर्यास्त')}</Text></View></View>
      <Text style={s.hint}>{c('Swipe horizontally for the whole month. Tap any date for its daily Panchang.', 'पूरा महीना देखने के लिए दाएँ-बाएँ खिसकाएँ। दैनिक पंचांग के लिए तारीख दबाएँ।')}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={{ paddingBottom: 10 }}><View style={{ width: Math.max(760, cells.length / 7 * 132 + 70) }}>
        {weekdays.map((weekday, weekdayIndex) => <View key={weekday} style={g.almanacRow}>
          <View style={g.weekdayArt}><CalendarArt deity={weekdayDeities[weekdayIndex]} size={44} /><Text style={g.almanacWeekday}>{weekday}</Text></View>
          {Array.from({ length: cells.length / 7 }, (_, week) => {
            const day = cells[week * 7 + weekdayIndex]; const data = day ? days[day - 1] : null;
            return <TouchableOpacity key={week} disabled={!day} accessibilityRole="button" accessibilityLabel={day ? `${c('Open daily Panchang', 'दैनिक पंचांग खोलें')} ${day}` : undefined} onPress={() => openDaily(dateISO(new Date(year, month, day)))} style={[g.almanacCell, day === selected.getDate() && g.selectedCell, !day && g.emptyCell]}>
              {day && <><View style={s.between}><Text style={[g.almanacDate, weekdayIndex === 0 && g.sunday]}>{day}</Text>{data?.festivals?.length ? <CalendarArt festival={data.festivals[0]} size={30} /> : <Text style={g.moon}>{moon(data)}</Text>}</View>
                <Text style={g.almanacTithi}>{data && !data.noSunrise ? `${value(data, 'paksha').split(' ')[0]} ${data.tithiNumber}` : data?.noSunrise ? c('No sunrise', 'सूर्योदय नहीं') : ''}</Text>
                <Text style={g.almanacText}>{data ? value(data, 'tithi') : '…'}</Text><Text style={g.almanacText}>{data ? value(data, 'nakshatra') : ''}</Text>
                <Text style={g.almanacTime}>☀ {data?.sunrise || '—'} · ☼ {data?.sunset || '—'}</Text>
                {!!data?.festivals?.length && <Text style={g.almanacFestival}>{data.festivals.map((item) => value(item, 'name')).join(' · ')}</Text>}
              </>}
            </TouchableOpacity>;
          })}
        </View>)}
      </View></ScrollView>
    </View>}
    <Text style={s.hint}>{c('Small number: lunar tithi at sunrise · ○ Purnima · ● Amavasya · ✧ Vrat · Art: listed festival. Sundays are coloured, not marked as public holidays.', 'छोटी संख्या: सूर्योदय की तिथि · ○ पूर्णिमा · ● अमावस्या · ✧ व्रत · चित्र: सूचीबद्ध पर्व। रविवार का रंग सरकारी अवकाश नहीं दर्शाता।')}</Text>
    <View style={s.hero}><Text style={s.sectionTitle}>{selected.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
      <Text style={s.bodyBold}>{selectedData ? `${value(selectedData, 'paksha')} · ${value(selectedData, 'tithi')}` : c('Select a date to explore', 'तारीख चुनें')}</Text>
      {!!selectedData && <Text style={s.hint}>{c('Sunrise', 'सूर्योदय')} {selectedData.sunrise} · {c('Sunset', 'सूर्यास्त')} {selectedData.sunset}</Text>}
      <FestivalRows items={selectedData?.festivals} navigation={navigation} empty={!loading} /><Action onPress={() => openDaily()}>{c('Open full daily Panchang', 'पूरा दैनिक पंचांग देखें')} ›</Action>
    </View>
    {!loading && !error && days.length > 0 ? <View style={s.card}>
      <Text style={s.sectionTitle}>{c('Panchak & Gand Mool', 'पंचक व गंडमूल')}</Text>
      <Text style={s.hint}>{location.locationName} · {location.timezone}</Text>
      <Text style={s.hint}>{c('Continuous periods across this month’s sunrise-to-sunrise days.', 'इस महीने के सूर्योदय से अगले सूर्योदय तक के दिनों में लगातार चलने वाली अवधियाँ।')}</Text>
      {incompletePeriodCoverage ? <Text style={s.hint}>{c('Some days have no complete solar cycle. The periods below cover only the days that could be calculated.', 'कुछ दिनों में सूर्य का पूरा चक्र नहीं है। नीचे केवल उन दिनों की अवधियाँ हैं जिनकी गणना हो सकी।')}</Text> : null}
      {[[c('Panchak', 'पंचक'), monthlyPeriods.panchaka], [c('Gand Mool', 'गंडमूल'), monthlyPeriods.gandaMula]].map(([title, periods]) => <View key={title} style={{ gap: 7, marginTop: 7 }}>
        <Text style={s.bodyBold}>{title}</Text>
        {periods.map((period) => <View key={period.id} style={[s.tableRow, { flexDirection: 'column', gap: 5 }]}>
          <Text selectable style={s.body}>{period.clippedStart ? c('Already active at range start', 'इस अवधि की शुरुआत में पहले से जारी') : c('Begins', 'आरंभ')}: {formatPeriodBoundary(period.start, location.timezone, locale)}</Text>
          <Text selectable style={s.body}>{period.clippedEnd ? c('Continues after range end', 'इस अवधि के अंत के बाद भी जारी') : c('Ends', 'समाप्ति')}: {formatPeriodBoundary(period.end, location.timezone, locale)}</Text>
          {period.clippedStart || period.clippedEnd ? <Text style={s.hint}>{c('This boundary is the first or last sunrise covered here, not the actual beginning or end of the period.', 'यह सीमा यहाँ दिखाए गए पहले या अंतिम सूर्योदय की है, अवधि के वास्तविक आरंभ या अंत की नहीं।')}</Text> : null}
        </View>)}
        {!periods.length ? <Text style={s.hint}>{incompletePeriodCoverage ? c('No interval calculated within the available days.', 'उपलब्ध दिनों में कोई अवधि नहीं मिली।') : c('No period in this month’s calculated days.', 'इस महीने के गणना किए गए दिनों में यह अवधि नहीं है।')}</Text> : null}
      </View>)}
    </View> : null}
    <View style={s.card}><Text style={s.sectionTitle}>{c('This month’s festivals & vrats', 'इस महीने के त्योहार व व्रत')}</Text><FestivalRows items={monthEvents} navigation={navigation} empty={!loading} /><Action onPress={() => navigation.navigate('UpcomingFestivals', { year })}>{c('Browse festival year', 'साल के त्योहार देखें')} ›</Action></View>
    <DataNotes />
  </CalendarPage>;
}
const gridStyles = StyleSheet.create({
  calendar: { borderRadius: 19, borderWidth: 1, borderColor: '#DCC28A', overflow: 'hidden', backgroundColor: '#FFF7E3' },
  weekRow: { flexDirection: 'row', backgroundColor: '#EFD487', paddingVertical: 13 },
  weekLabel: { width: '14.285714%', textAlign: 'center', fontWeight: '800', color: '#3F2713', fontSize: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' }, cell: { width: '14.285714%', minHeight: 100, paddingHorizontal: 4, paddingVertical: 7, borderRightWidth: 1, borderBottomWidth: 1, borderColor: '#EADAB5' },
  cellHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, dayNumber: { color: '#3F2713', fontWeight: '800', fontSize: 20 },
  tithiNumber: { color: '#80520F', fontSize: 10 }, tithi: { color: '#725C38', fontSize: 9, lineHeight: 17, marginTop: 2 },
  cellArt: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', minHeight: 27, marginTop: 3 }, eventCount: { fontSize: 9, color: '#80520F' },
  moon: { color: '#80520F', fontSize: 23 }, sunday: { color: '#AF4339' }, todayCell: { backgroundColor: '#FFF0C8' }, selectedCell: { backgroundColor: '#EFD487', borderColor: '#A36A12', borderWidth: 1 },
  emptyCell: { backgroundColor: '#F4EDDC' }, almanacRow: { flexDirection: 'row' }, weekdayArt: { width: 70, backgroundColor: '#EFD487', alignItems: 'center', justifyContent: 'center', borderWidth: 0.5, borderColor: '#DCC28A' },
  almanacWeekday: { color: '#3F2713', fontSize: 13, fontWeight: '800', marginTop: 5 }, almanacCell: { flex: 1, minHeight: 157, padding: 8, borderWidth: 0.5, borderColor: '#DCC28A' },
  almanacDate: { color: '#3F2713', fontSize: 32, fontWeight: '900' }, almanacTithi: { color: '#80520F', fontWeight: '800', fontSize: 12 },
  almanacText: { color: '#3F2713', fontSize: 11, lineHeight: 17 }, almanacTime: { color: '#725C38', fontSize: 9, marginTop: 4, lineHeight: 15 }, almanacFestival: { color: '#9D4032', fontSize: 10, lineHeight: 14, marginTop: 4 },
});
