import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { getPanchangFromAPI } from '../services/panchangService';
import useDevotionalStyles from '../hooks/useDevotionalStyles';
import { CalendarPage, Action, FestivalRows, DataNotes, calendarStyles, useCalendarCopy } from '../features/panchang/CalendarUI';
import { dateISO, dateParts, parseLocalDate } from '../features/panchang/date';
import { usePanchangLocation, usePanchangToday } from '../features/panchang/locationStore';

export default function PanchangFestivalsScreen({ navigation, route }) {
  const s = useDevotionalStyles(calendarStyles); const { c, locale } = useCalendarCopy();
  const [location] = usePanchangLocation(); const today = usePanchangToday(location.timezone, navigation);
  const selected = route?.params?.panchang?.dateISO || route?.params?.selectedDateISO || dateISO(today);
  const [data, setData] = useState(null); const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController(); setData(null); setError('');
    getPanchangFromAPI({ ...dateParts(parseLocalDate(selected)), ...location, signal: controller.signal }).then((result) => { if (!controller.signal.aborted) setData(result); }).catch((err) => { if (!controller.signal.aborted) setError(err.message); });
    return () => controller.abort();
  }, [selected, location]);
  return <CalendarPage navigation={navigation} title={c('Festivals & Vrats', 'त्योहार व व्रत')}>
    <Text style={s.body}>{parseLocalDate(selected).toLocaleDateString(locale)} · {location.locationName}</Text>
    {!data && !error && <ActivityIndicator color="#B48222" />}{!!error && <Text style={s.body}>{error}</Text>}
    {data && <View style={s.card}><FestivalRows items={data.festivals} navigation={navigation} /></View>}
    <Action onPress={() => navigation.navigate('UpcomingFestivals', { year: Number(selected.slice(0, 4)) })}>{c('Browse the festival year', 'साल के त्योहार देखें')} ›</Action>
    <Action onPress={() => navigation.navigate('Calendar', { selectedDateISO: selected })}>{c('Open daily Panchang', 'दैनिक पंचांग खोलें')} ›</Action><DataNotes />
  </CalendarPage>;
}
