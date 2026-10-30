import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, useWindowDimensions, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { getPanchangMonth } from '../services/panchangService';
import useDevotionalStyles from '../hooks/useDevotionalStyles';
import { dateISO, parseLocalDate, shiftMonth } from '../features/panchang/date';
import { usePanchangLocation, usePanchangToday } from '../features/panchang/locationStore';
import { Action, CalendarPage, CalendarTabs, DateJump, calendarStyles, useCalendarCopy } from '../features/panchang/CalendarUI';
import AlmanacSheet from '../features/panchang/AlmanacSheet';

export default function PanchangCalendarScreen({ navigation, route }) {
  const s = useDevotionalStyles(calendarStyles);
  const { c, locale } = useCalendarCopy();
  const [location] = usePanchangLocation();
  const today = usePanchangToday(location.timezone, navigation);
  const focused = useIsFocused();
  const [selected, setSelected] = useState(() => parseLocalDate(route?.params?.selectedDateISO, today));
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const { width, height } = useWindowDimensions();
  const compact = !datePickerOpen && width > height && height < 540;
  const selectedISO = dateISO(selected);
  const year = selected.getFullYear();
  const month = selected.getMonth();

  useEffect(() => {
    if (route?.params?.selectedDateISO) setSelected(parseLocalDate(route.params.selectedDateISO, today));
  }, [route?.params?.selectedDateISO]);

  useEffect(() => {
    if (!focused) return;
    const controller = new AbortController();
    setLoading(true); setError(''); setDays([]);
    getPanchangMonth({ year, month, ...location, signal: controller.signal })
      .then((result) => { if (!controller.signal.aborted) setDays(result); })
      .catch((err) => { if (!controller.signal.aborted) setError(err.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [year, month, location, focused, retry]);

  const openDaily = (date = selectedISO) => {
    setSelected(parseLocalDate(date, selected));
    navigation.navigate('Calendar', { selectedDateISO: date });
  };

  // Legacy links with view: 'Almanac' now open the same Month sheet.
  return <CalendarPage navigation={navigation} title={c('Calendar & Panchang', 'कैलेंडर व पंचांग')} wide fitContent={!datePickerOpen}
    action={<Action label={c('Today', 'आज')} onPress={() => { setSelected(today); setDatePickerOpen(false); }} style={{ width: 40, paddingHorizontal: 0 }}>↺</Action>}>
    <View style={{ flexDirection: compact ? 'row' : 'column', gap: 8 }}>
    <View style={compact && { flex: 1 }}><CalendarTabs active="Month" navigation={navigation} selectedDateISO={selectedISO} /></View>
    <View style={compact && { flex: 1 }}><DateJump date={selected} onChange={setSelected} open={datePickerOpen} onOpenChange={setDatePickerOpen}
      label={selected.toLocaleDateString(locale, { month: 'long', year: 'numeric' })} triggerStyle={{ flex: 1 }}
      before={<Action label={c('Previous month', 'पिछला महीना')} onPress={() => setSelected(shiftMonth(selected, -1))} disabled={year <= 1900 && month === 0}>‹</Action>}
      actions={<Action label={c('Next month', 'अगला महीना')} onPress={() => setSelected(shiftMonth(selected, 1))} disabled={year >= 2100 && month === 11}>›</Action>} /></View>
    </View>
    {!datePickerOpen && (loading ? <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 }}>
      <ActivityIndicator color="#B48222" />
      <Text accessibilityLiveRegion="polite" style={s.hint}>{c('Calculating this month…', 'इस महीने की गणना…')}</Text>
    </View> : error || !days.length ? <View style={[s.card, { marginTop: 12 }]}>
      <Text accessibilityRole="alert" style={s.body}>{error || c('This month could not be loaded.', 'यह महीना लोड नहीं हो सका।')}</Text>
      <Action onPress={() => setRetry((attempt) => attempt + 1)}>{c('Try again', 'फिर कोशिश करें')}</Action>
    </View> : <AlmanacSheet days={days} selected={selected} today={today} location={location} navigation={navigation} onOpenDate={openDaily} />)}
    <Text style={[s.hint, { textAlign: 'center', fontSize: 11 }]}>{c('Pinch to zoom · Drag to move · Tap a date for Panchang', 'दो उँगलियों से ज़ूम करें · खींचकर देखें · पंचांग के लिए तारीख दबाएँ')}</Text>
  </CalendarPage>;
}
