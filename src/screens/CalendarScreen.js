import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Share, Text, View } from 'react-native';
import * as Location from 'expo-location';
import { useIsFocused } from '@react-navigation/native';
import { getPanchangFromAPI } from '../services/panchangService';
import useDevotionalStyles from '../hooks/useDevotionalStyles';
import { usePanchangLocation, usePanchangToday } from '../features/panchang/locationStore';
import { dateISO, dateParts, parseLocalDate, deviceTimezone } from '../features/panchang/date';
import LocationPicker from '../features/panchang/LocationPicker';
import { Action, CalendarArt, CalendarPage, CalendarTabs, DataNotes, DateJump, FestivalRows, calendarStyles, useCalendarCopy, weekdayDeities } from '../features/panchang/CalendarUI';

export default function CalendarScreen({ navigation, route }) {
  const s = useDevotionalStyles(calendarStyles);
  const { c, value, locale } = useCalendarCopy();
  const focused = useIsFocused();
  const [location, setLocation] = usePanchangLocation();
  const today = usePanchangToday(location.timezone, navigation);
  const todayISO = dateISO(today);
  const [selectedISO, setSelectedISO] = useState(route?.params?.selectedDateISO || null);
  const selectedDate = parseLocalDate(selectedISO || todayISO, today);
  const selectedDateISO = dateISO(selectedDate);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [showLocation, setShowLocation] = useState(false);
  const [draft, setDraft] = useState(location);
  const [locationMessage, setLocationMessage] = useState('');
  const [detecting, setDetecting] = useState(false);
  const generation = useRef(0);
  useEffect(() => { if (route?.params?.selectedDateISO) setSelectedISO(route.params.selectedDateISO); }, [route?.params?.selectedDateISO]);
  useEffect(() => { setDraft(location); }, [location]);
  useEffect(() => () => { generation.current += 1; }, []);
  useEffect(() => {
    if (!focused) return;
    const controller = new AbortController();
    setData(null); setError('');
    getPanchangFromAPI({ ...dateParts(selectedDate), ...location, signal: controller.signal }).then((result) => { if (!controller.signal.aborted) setData(result); }).catch((err) => { if (!controller.signal.aborted) setError(err.message); });
    return () => controller.abort();
  }, [selectedDateISO, location, focused]);
  const changeDate = (date) => setSelectedISO(dateISO(date) === todayISO ? null : dateISO(date));
  const shiftDay = (delta) => changeDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate() + delta, 12));
  const detect = async () => {
    const id = ++generation.current; setDetecting(true); setLocationMessage('');
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') throw new Error(c('Location permission was not granted. Choose a city or enter coordinates.', 'स्थान की अनुमति नहीं मिली। शहर चुनें या निर्देशांक लिखें।'));
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      if (id !== generation.current) return;
      setDraft({ latitude: position.coords.latitude, longitude: position.coords.longitude, timezone: deviceTimezone(), locationName: c('Current location', 'वर्तमान स्थान') });
      setLocationMessage(c('Coordinates detected. Check that the timezone matches this place, then save.', 'निर्देशांक मिले। इस स्थान का समय क्षेत्र जाँचकर सहेजें।'));
    } catch (err) { if (id === generation.current) setLocationMessage(err.message); }
    finally { if (id === generation.current) setDetecting(false); }
  };
  const share = async () => {
    if (!data) return;
    try { await Share.share({ title: c('Bhakti Panchang', 'भक्ति पंचांग'), message: `${selectedDate.toLocaleDateString(locale)} · ${location.locationName} (${location.timezone})\n${value(data, 'paksha')} · ${value(data, 'tithi')}\n${c('Sunrise', 'सूर्योदय')}: ${data.sunrise} · ${c('Sunset', 'सूर्यास्त')}: ${data.sunset}\n${c('Rahu Kaal', 'राहु काल')}: ${data.rahuKaal}\n${c('Calculated with panchang-ts; North Indian Purnimanta. Confirm local ritual dates.', 'panchang-ts गणना; उत्तर भारतीय पूर्णिमांत। अनुष्ठान की तारीख स्थानीय पंचांग से मिलाएँ।')}` }); } catch { setError(c('Sharing is unavailable on this device.', 'इस डिवाइस पर साझा करना उपलब्ध नहीं है।')); }
  };
  const angaText = (key) => (data?.transitions?.[key] || []).map((item) => `${value(item, 'name')} · ${c('ends', 'समाप्ति')} ${value(item, 'endTime')}`).join('\n');
  const periodText = (key) => (data?.[key] || []).map((item) => [
    item.nakshatraName ? value(item, 'nakshatraName') : null,
    item.clippedStart ? c('Already active at sunrise', 'सूर्योदय से पहले जारी') : null,
    value(item, 'time'),
    item.clippedEnd ? c('Continues after next sunrise', 'अगले सूर्योदय के बाद जारी') : null,
  ].filter(Boolean).join(' · ')).join('\n') || c('Not present', 'नहीं');
  const rows = data ? [
    [c('Vikram Samvat', 'विक्रम संवत'), data.vikramSamvat || data.samvat],
    [c('Purnimanta month', 'पूर्णिमांत मास'), value(data, 'purnimantaMonth') || value(data, 'lunarMonth')],
    [c('Amanta month', 'अमांत मास'), value(data, 'amantaMonth')],
    [c('Paksha', 'पक्ष'), value(data, 'paksha')],
    [c('Tithi', 'तिथि'), angaText('tithi')],
    [c('Nakshatra', 'नक्षत्र'), angaText('nakshatra')],
    [c('Yoga', 'योग'), angaText('yoga')],
    [c('Karana', 'करण'), angaText('karana')],
    [c('Sun rashi', 'सूर्य राशि'), value(data, 'sunRashi')],
    [c('Moon rashi', 'चंद्र राशि'), value(data, 'moonRashi')],
    [c('Season', 'ऋतु'), value(data, 'ritu')],
    [c('Ayana', 'अयन'), value(data, 'ayan')],
    [c('Panchak at sunrise', 'सूर्योदय पर पंचक'), data.panchaka ? c('Present', 'है') : c('Not present', 'नहीं')],
    [c('Panchak period', 'पंचक का समय'), periodText('panchakaPeriods')],
    [c('Gand Mool period', 'गंड मूल का समय'), periodText('gandaMulaPeriods')],
    [c('Bhadra', 'भद्रा'), data.bhadra ? value(data.bhadra, 'time') : c('Not present', 'नहीं')],
  ] : [];
  return <CalendarPage navigation={navigation} title={c('Calendar & Panchang', 'कैलेंडर व पंचांग')} action={<Action label={c('Share Panchang', 'पंचांग साझा करें')} onPress={share} disabled={!data}>↗</Action>}>
    <CalendarTabs active="Daily" navigation={navigation} selectedDateISO={selectedDateISO} />
    <Action onPress={() => { generation.current += 1; setDetecting(false); setShowLocation(!showLocation); }}>⌖ {location.locationName} · {c('Change', 'बदलें')}</Action>
    {showLocation && <View style={s.card}><Text style={s.hint}>{c('Your place and timezone are saved on this device. Calculations work offline.', 'स्थान और समय क्षेत्र इस डिवाइस पर सहेजे जाते हैं। गणना ऑफलाइन होती है।')}</Text>
      <LocationPicker offlineOnly value={draft} onChange={(next) => { generation.current += 1; setDetecting(false); setDraft(next); }} />
      <Action onPress={detect} disabled={detecting}>{detecting ? c('Detecting…', 'खोज रहे हैं…') : c('Use device location', 'डिवाइस का स्थान लें')}</Action>
      <Action onPress={() => { if (setLocation(draft)) { generation.current += 1; setShowLocation(false); setLocationMessage(''); } else setLocationMessage(c('Select a valid place and timezone first.', 'पहले सही स्थान और समय क्षेत्र चुनें।')); }}>{c('Save location', 'स्थान सहेजें')}</Action>
      {!!locationMessage && <Text accessibilityLiveRegion="polite" style={s.hint}>{locationMessage}</Text>}
    </View>}
    <View style={s.between}><Action label={c('Previous day', 'पिछला दिन')} onPress={() => shiftDay(-1)} disabled={selectedDateISO <= '1900-01-01'}>‹</Action><View style={{ flex: 1 }}><Text style={[s.bodyBold, { textAlign: 'center' }]}>{selectedDate.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</Text><Text style={[s.hint, { textAlign: 'center' }]}>{location.timezone}</Text></View><Action label={c('Next day', 'अगला दिन')} onPress={() => shiftDay(1)} disabled={selectedDateISO >= '2100-12-31'}>›</Action></View>
    <View style={s.between}><DateJump date={selectedDate} onChange={changeDate} /><Action onPress={() => { setSelectedISO(null); navigation.setParams({ selectedDateISO: null }); }}>{c('Today', 'आज')}</Action></View>
    {!data && !error ? <ActivityIndicator size="large" color="#B48222" accessibilityLabel={c('Calculating Panchang', 'पंचांग गणना')} /> : null}
    {!!error && <Text accessibilityRole="alert" style={s.body}>{error}</Text>}
    {data?.noSunrise && <View style={s.card}><Text style={s.sectionTitle}>{c('No sunrise-based Panchang', 'सूर्योदय आधारित पंचांग उपलब्ध नहीं')}</Text><Text style={s.body}>{c('This place has no complete sunrise and sunset cycle on the selected date. Select a different date or location to calculate daily tithis and periods.', 'चुनी तारीख को इस स्थान पर सूर्योदय और सूर्यास्त का पूरा चक्र नहीं है। दैनिक तिथि और समय के लिए दूसरी तारीख या स्थान चुनें।')}</Text></View>}
    {data && !data.noSunrise && <>
      <View style={s.hero}><View style={s.between}><View style={{ flex: 1 }}><Text style={s.hint}>{value(data, 'purnimantaMonth') || value(data, 'lunarMonth')} · {value(data, 'paksha')}</Text><Text style={s.heroTitle}>{value(data, 'tithi')}</Text><Text style={s.hint}>{c('At local sunrise · Lahiri', 'स्थानीय सूर्योदय पर · लाहिड़ी')}</Text></View><CalendarArt deity={weekdayDeities[selectedDate.getDay()]} size={76} /></View>
        <Text style={s.body}>{data.festivals.map((item) => value(item, 'name')).join(' · ') || c('A new day for your devotional practice', 'भक्ति और साधना का एक नया दिन')}</Text>
      </View>
      <View style={s.card}><Text style={s.sectionTitle}>{c('Sun & Moon', 'सूर्य व चंद्र')}</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{[[c('Sunrise', 'सूर्योदय'), data.sunrise, '☀'], [c('Sunset', 'सूर्यास्त'), data.sunset, '☼'], [c('Moonrise', 'चंद्रोदय'), value(data, 'moonrise'), '☾'], [c('Moonset', 'चंद्रास्त'), value(data, 'moonset'), '☽']].map(([label, time, icon]) => <View key={label} style={{ width: '50%', paddingVertical: 9 }}><Text style={s.hint}>{icon} {label}</Text><Text style={s.bodyBold}>{time || c('No event on this date', 'इस दिन घटना नहीं')}</Text></View>)}</View></View>
      <View style={s.card}><Text style={s.sectionTitle}>{c('Daily Panchang', 'दैनिक पंचांग')}</Text>{rows.map(([label, item]) => <View key={label} style={s.tableRow}><Text style={s.rowLabel}>{label}</Text><Text style={s.rowValue}>{String(item ?? '—')}</Text></View>)}<Action onPress={() => navigation.navigate('TithiDetail', { panchang: data })}>{c('Tithi details & transitions', 'तिथि विवरण व परिवर्तन')} ›</Action></View>
      <View style={s.card}><Text style={s.sectionTitle}>{c('Muhurta & daily periods', 'मुहूर्त व दैनिक समय')}</Text><Text style={s.hint}>{c('All times are for the selected location. Events after midnight are marked next day.', 'सभी समय चुने स्थान के हैं। मध्यरात्रि के बाद का समय अगले दिन के रूप में दिखाया गया है।')}</Text>{(data.muhurtas || []).map((item) => <View key={item.id} style={s.tableRow}><Text style={s.rowLabel}>{value(item, 'name')}</Text><Text style={s.rowValue}>{value(item, 'time')}</Text></View>)}{!data.muhurtas?.length && <Text style={s.hint}>{c('No daily periods available for this date and location.', 'इस तारीख व स्थान के दैनिक समय उपलब्ध नहीं हैं।')}</Text>}<Action onPress={() => navigation.navigate('PanchangMuhurtas', { panchang: data })}>{c('Explore muhurtas', 'मुहूर्त देखें')} ›</Action></View>
      <View style={s.card}><Text style={s.sectionTitle}>{c('Festivals & observances', 'त्योहार व व्रत')}</Text><FestivalRows items={data.festivals} navigation={navigation} /><Action onPress={() => navigation.navigate('UpcomingFestivals', { year: selectedDate.getFullYear() })}>{c('Browse the festival year', 'साल के त्योहार देखें')} ›</Action></View>
      {!!data.calculation?.note && <Text style={s.hint}>{data.calculation.note}</Text>}
    </>}
    <DataNotes />
  </CalendarPage>;
}
