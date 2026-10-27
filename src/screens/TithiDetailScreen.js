import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Share, Text, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import useDevotionalStyles from '../hooks/useDevotionalStyles';
import { getPanchangFromAPI } from '../services/panchangService';
import { CalendarPage, Action, DataNotes, calendarStyles, useCalendarCopy } from '../features/panchang/CalendarUI';
import { dateISO, parseLocalDate } from '../features/panchang/date';
import { usePanchangLocation, usePanchangToday } from '../features/panchang/locationStore';
import engine from '../features/panchang/engine.cjs';

export default function TithiDetailScreen({ navigation, route }) {
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
  const [shareError, setShareError] = useState(false);
  const current = result?.key === requestKey ? result : null;
  const panchang = current?.data;

  useEffect(() => {
    if (!isFocused) return;
    let active = true;
    const controller = new AbortController();
    const selected = parseLocalDate(selectedDateISO);
    setShareError(false);
    getPanchangFromAPI({ ...location, year: selected.getFullYear(), month: selected.getMonth(), day: selected.getDate(), signal: controller.signal })
      .then((data) => { if (active) setResult({ key: requestKey, data }); })
      .catch((error) => { if (active && !controller.signal.aborted) setResult({ key: requestKey, error: error.message }); });
    return () => { active = false; controller.abort(); };
  }, [requestKey, location, isFocused, retry]);

  const dateLabel = parseLocalDate(selectedDateISO).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' });
  const transitions = panchang?.transitions?.tithi || [];
  const formatTime = (instant) => engine.formatEvent(instant, location.timezone, selectedDateISO, hi ? 'hi' : 'en');
  const shareTithi = async () => {
    if (!panchang || panchang.noSunrise) return;
    setShareError(false);
    const timeline = transitions.map((item) => `${value(item, 'name')}: ${formatTime(item.start)} – ${value(item, 'endTime')}`).join('\n');
    try {
      await Share.share({
        title: c('Bhakti · Tithi', 'भक्ति · तिथि'),
        message: `${dateLabel}\n${location.locationName} · ${location.timezone}\n${timeline || value(panchang, 'tithiFull')}\n${c('Calculated with Lahiri ayanamsa. Confirm fasting observance with your local tradition.', 'लाहिड़ी अयनांश से गणना। व्रत की तिथि अपनी स्थानीय परंपरा से मिलाएँ।')}`,
      });
    } catch (error) { if (error?.name !== 'AbortError') setShareError(true); }
  };

  return <CalendarPage navigation={navigation} title={c('Tithi details', 'तिथि विवरण')} action={<Action disabled={!panchang || panchang.noSunrise} onPress={shareTithi}>{c('Share', 'साझा')}</Action>}>
    <Text selectable style={s.bodyBold}>{dateLabel}</Text>
    <Text selectable style={s.hint}>{location.locationName} · {location.timezone}</Text>
    {!current ? <View style={s.card}><ActivityIndicator color="#C99416" /><Text style={s.hint}>{c('Calculating tithi…', 'तिथि की गणना हो रही है…')}</Text></View> : null}
    {current?.error ? <View style={s.card}><Text accessibilityRole="alert" style={s.body}>{c(`Unable to calculate this date. ${current.error}`, 'इस तारीख की गणना नहीं हो सकी। स्थान और तारीख जाँचें।')}</Text><Action onPress={() => { setResult(null); setRetry((n) => n + 1); }}>{c('Try again', 'फिर प्रयास करें')}</Action></View> : null}
    {panchang?.noSunrise ? <View style={s.card}><Text style={s.body}>{c('A sunrise-based Panchang cannot be shown because this location has no complete sunrise and sunset cycle on the selected date.', 'इस स्थान पर चुनी तारीख में सूर्योदय और सूर्यास्त का पूरा चक्र नहीं है, इसलिए सूर्योदय आधारित पंचांग नहीं दिखाया जा सकता।')}</Text></View> : null}
    {panchang && !panchang.noSunrise ? <>
      <View style={s.hero}>
        <View style={s.row}>
          <Text accessible={false} style={[s.symbol, { fontSize: 50, width: 64 }]}>{panchang.isPurnima ? '○' : panchang.isAmavasya ? '●' : '◐'}</Text>
          <View style={{ flex: 1 }}><Text style={s.heroTitle}>{value(panchang, 'tithi')}</Text><Text style={s.bodyBold}>{value(panchang, 'paksha')}</Text></View>
        </View>
        <Text style={s.body}>{value(panchang, 'purnimantaMonth')} · {c('Vikram Samvat', 'विक्रम संवत')} {panchang.vikramSamvat}</Text>
        <Text style={s.hint}>{c('Present at local sunrise', 'स्थानीय सूर्योदय पर तिथि')}: {panchang.sunrise}</Text>
      </View>
      <View style={s.card}>
        <Text style={s.sectionTitle}>{c('Tithi transitions', 'तिथि परिवर्तन')}</Text>
        <Text style={s.hint}>{c('Tithis intersecting this sunrise-to-sunrise day. Each row shows its actual start and end; a tithi can continue beyond the next sunrise.', 'इस सूर्योदय से अगले सूर्योदय के बीच आने वाली तिथियाँ। हर पंक्ति में वास्तविक आरंभ और समाप्ति दिखाई गई है; तिथि अगले सूर्योदय के बाद भी चल सकती है।')}</Text>
        {transitions.map((item) => <View key={`${item.index}-${item.start}`} style={[s.tableRow, { flexDirection: 'column', gap: 4 }]}>
          <Text selectable style={s.bodyBold}>{value(item, 'name')}{item.isActiveAtSunrise ? c(' · at sunrise', ' · सूर्योदय पर') : ''}</Text>
          <Text selectable style={s.body}>{c('Starts', 'आरंभ')}: {formatTime(item.start)}</Text>
          <Text selectable style={s.body}>{c('Ends', 'समाप्ति')}: {value(item, 'endTime')}</Text>
          {item.continuesAfterNextSunrise ? <Text style={s.hint}>{c('Continues beyond the next sunrise.', 'अगले सूर्योदय के बाद भी जारी रहती है।')}</Text> : null}
        </View>)}
        {!transitions.length ? <Text style={s.body}>{c('No tithi transition records for this date.', 'इस तारीख के तिथि परिवर्तन उपलब्ध नहीं हैं।')}</Text> : null}
      </View>
      <View style={s.card}>
        <Text style={s.sectionTitle}>{c('Understanding a tithi', 'तिथि को समझें')}</Text>
        <Text style={s.body}>{c('A tithi is a lunar day, defined by each 12° increase in the Moon–Sun angular separation. Its duration is not fixed at 24 hours, so it can start or end at any time of the civil day.', 'तिथि चंद्र दिवस है, जो सूर्य और चंद्रमा के बीच कोणीय अंतर में प्रत्येक 12° वृद्धि से बनती है। इसकी अवधि हमेशा 24 घंटे नहीं होती, इसलिए यह दिन के किसी भी समय शुरू या समाप्त हो सकती है।')}</Text>
        <Text style={s.hint}>{c('The tithi present at sunrise identifies the day in this calendar. A festival or fast may use another time, such as moonrise or sunset, and its own observance rules.', 'इस पंचांग में सूर्योदय की तिथि से दिन की पहचान होती है। किसी पर्व या व्रत के लिए चंद्रोदय या सूर्यास्त जैसी दूसरी अवधि और परंपरा के नियम लागू हो सकते हैं।')}</Text>
      </View>
      <Action onPress={() => navigation.navigate('PanchangMuhurtas', { selectedDateISO, location })}>{c('View this day’s muhurtas', 'इस दिन के मुहूर्त देखें')}</Action>
      {shareError ? <Text accessibilityRole="alert" style={s.hint}>{c('Sharing is unavailable here. You can read and copy the date and times above.', 'यहाँ साझा करने की सुविधा उपलब्ध नहीं है। ऊपर की तारीख और समय पढ़कर कॉपी कर सकते हैं।')}</Text> : null}
    </> : null}
    <Action onPress={() => navigation.navigate('Calendar', { selectedDateISO })}>{c('Full daily Panchang', 'पूरा दैनिक पंचांग')}</Action>
    <DataNotes />
  </CalendarPage>;
}
