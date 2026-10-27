import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import useDevotionalStyles from '../hooks/useDevotionalStyles';
import { getPanchangFromAPI } from '../services/panchangService';
import { CalendarPage, Action, DataNotes, calendarStyles, useCalendarCopy } from '../features/panchang/CalendarUI';
import { dateISO, parseLocalDate } from '../features/panchang/date';
import { usePanchangLocation, usePanchangToday } from '../features/panchang/locationStore';

const HINDI_DESCRIPTIONS = {
  brahma: 'सूर्योदय से पहले रात्रि के पंद्रह मुहूर्तों में चौदहवाँ मुहूर्त।',
  abhijit: 'दिन का आठवाँ मुहूर्त। बुधवार को नहीं दर्शाया जाता।',
  vijaya: 'दिन का ग्यारहवाँ मुहूर्त।',
  godhuli: 'सूर्यास्त के आसपास का पारंपरिक समय।',
  amrit: 'नक्षत्र आधारित अवधि, चार समानुपाती घटी लंबी।',
  rahu: 'स्थानीय दिन के आठ भागों में से वार के अनुसार निर्धारित भाग।',
  gulika: 'स्थानीय दिन के आठ भागों में से वार के अनुसार निर्धारित भाग।',
  yamaganda: 'स्थानीय दिन के आठ भागों में से वार के अनुसार निर्धारित भाग।',
  durmuhurta: 'वार पर आधारित मुहूर्त। मंगलवार की अवधि रात्रि में भी हो सकती है।',
  varjyam: 'नक्षत्र आधारित अवधि, जिस दिन शुरू होती है उस दिन दिखाई जाती है।',
};

export default function PanchangMuhurtasScreen({ navigation, route }) {
  const s = useDevotionalStyles(calendarStyles);
  const { c, value, hi, locale } = useCalendarCopy();
  const isFocused = useIsFocused();
  const [savedLocation] = usePanchangLocation();
  const location = useMemo(() => ({ ...savedLocation, ...route?.params?.location }), [savedLocation, route?.params?.location]);
  const today = usePanchangToday(location.timezone, navigation);
  const selectedDateISO = dateISO(parseLocalDate(route?.params?.selectedDateISO || route?.params?.dateISO || route?.params?.panchang?.dateISO, today));
  const requestKey = `${selectedDateISO}:${location.latitude}:${location.longitude}:${location.timezone}:${location.locationName}`;
  const [result, setResult] = useState(null);
  const [retry, setRetry] = useState(0);
  const [filter, setFilter] = useState('all');
  const [choghadiyaPeriod, setChoghadiyaPeriod] = useState('day');
  const current = result?.key === requestKey ? result : null;
  const panchang = current?.data;

  useEffect(() => {
    if (!isFocused) return;
    let active = true;
    const controller = new AbortController();
    const selected = parseLocalDate(selectedDateISO);
    getPanchangFromAPI({ ...location, year: selected.getFullYear(), month: selected.getMonth(), day: selected.getDate(), signal: controller.signal })
      .then((data) => { if (active) setResult({ key: requestKey, data }); })
      .catch((error) => { if (active && !controller.signal.aborted) setResult({ key: requestKey, error: error.message }); });
    return () => { active = false; controller.abort(); };
  }, [requestKey, location, isFocused, retry]);

  const dateLabel = parseLocalDate(selectedDateISO).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' });
  const muhurtas = (panchang?.muhurtas || []).filter((item) => filter === 'all' || item.type === filter);
  const qualityLabel = (quality) => quality === 'auspicious' ? c('Auspicious', 'शुभ') : quality === 'inauspicious' ? c('Inauspicious', 'अशुभ') : c('Neutral', 'सामान्य');

  return <CalendarPage navigation={navigation} title={c('Muhurta', 'मुहूर्त')}>
    <View style={s.hero}>
      <Text style={s.sectionTitle}>{dateLabel}</Text>
      <Text style={s.hint}>{location.locationName} · {location.timezone}</Text>
      <Text style={s.body}>{c('Daily periods calculated from the Sun and Moon for your selected place.', 'चुने स्थान के सूर्य और चंद्रमा के आधार पर दैनिक समय की गणना।')}</Text>
    </View>

    {!current ? <View style={s.card}><ActivityIndicator color="#C99416" /><Text style={s.hint}>{c('Calculating local times…', 'स्थानीय समय की गणना हो रही है…')}</Text></View> : null}
    {current?.error ? <View style={s.card}><Text accessibilityRole="alert" style={s.body}>{c(`Unable to calculate this date. ${current.error}`, 'इस तारीख की गणना नहीं हो सकी। स्थान और तारीख जाँचें।')}</Text><Action onPress={() => { setResult(null); setRetry((n) => n + 1); }}>{c('Try again', 'फिर प्रयास करें')}</Action></View> : null}
    {panchang?.noSunrise ? <View style={s.card}><Text style={s.body}>{c('This place has no complete sunrise and sunset cycle on the selected date. Sunrise-based muhurta periods cannot be calculated.', 'इस स्थान पर चुनी तारीख में सूर्योदय और सूर्यास्त का पूरा चक्र नहीं है। सूर्योदय आधारित मुहूर्त की गणना नहीं की जा सकती।')}</Text></View> : null}

    {panchang && !panchang.noSunrise ? <>
      <View style={s.row}>{[['all', c('All', 'सभी')], ['auspicious', c('Auspicious', 'शुभ')], ['inauspicious', c('Inauspicious', 'अशुभ')]].map(([id, label]) => <Action key={id} selected={filter === id} style={{ flex: 1 }} onPress={() => setFilter(id)}>{label}</Action>)}</View>
      {muhurtas.map((item) => <View key={item.id} style={s.card}>
        <View style={s.between}><Text style={[s.sectionTitle, { flex: 1 }]}>{value(item, 'name')}</Text><Text style={s.hint}>{qualityLabel(item.type)}</Text></View>
        <Text style={s.bodyBold}>{value(item, 'time')}</Text>
        <Text style={s.hint}>{hi ? item.descriptionHi || HINDI_DESCRIPTIONS[item.key] || '' : item.description}</Text>
      </View>)}
      {!muhurtas.length ? <View style={s.card}><Text style={s.body}>{c('No periods in this category for the selected day.', 'चुने दिन इस श्रेणी की कोई अवधि नहीं है।')}</Text></View> : null}
      {!panchang.muhurtas.some((item) => item.key === 'abhijit') ? <Text style={s.hint}>{c('Abhijit Muhurta is not listed on Wednesdays in this calculation.', 'इस गणना में बुधवार को अभिजीत मुहूर्त नहीं दिखाया जाता।')}</Text> : null}
      <Text style={s.hint}>{c('Times use this location’s timezone. “Next day” and “previous day” refer to the selected civil date. These are general daily periods; a ceremony-specific muhurta requires its own rules.', 'समय इसी स्थान के समय क्षेत्र में है। “अगले दिन” और “पिछले दिन” का संबंध चुनी तारीख से है। ये सामान्य दैनिक समय हैं; किसी विशेष अनुष्ठान के मुहूर्त के नियम अलग होते हैं।')}</Text>

      {panchang.choghadiya ? <View style={s.card}>
        <Text style={s.sectionTitle}>{c('Choghadiya', 'चौघड़िया')}</Text>
        <View style={s.row}>{[['day', c('Day', 'दिन')], ['night', c('Night', 'रात')]].map(([id, label]) => <Action key={id} style={{ flex: 1 }} selected={choghadiyaPeriod === id} onPress={() => setChoghadiyaPeriod(id)}>{label}</Action>)}</View>
        {(panchang.choghadiya[choghadiyaPeriod] || []).map((item, index) => <View key={`${item.start}-${index}`} style={s.tableRow}>
          <View style={{ width: '32%' }}><Text style={s.bodyBold}>{value(item, 'name')}</Text><Text style={s.hint}>{qualityLabel(item.quality)}</Text></View>
          <Text style={s.rowValue}>{value(item, 'time')}</Text>
        </View>)}
      </View> : null}
    </> : null}
    <Action onPress={() => navigation.navigate('Calendar', { selectedDateISO })}>{c('Full daily Panchang', 'पूरा दैनिक पंचांग')}</Action>
    <DataNotes />
  </CalendarPage>;
}
