import { useContext, useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { ThemeContext } from '../../App';
import { useLanguage } from '../context/LanguageContext';
import { dateISO } from '../features/panchang/date';
import { usePanchangLocation, usePanchangToday } from '../features/panchang/locationStore';
import { getPanchangFromAPI, normalizePanchangData } from '../services/panchangService';

const CALENDAR_ICON = require('../../assets/icon/calender.png');
const HINDI_TITHIS = {
  pratipada: 'प्रतिपदा', prathama: 'प्रतिपदा', dwitiya: 'द्वितीया', dwithiya: 'द्वितीया',
  tritiya: 'तृतीया', thrithiya: 'तृतीया', chaturthi: 'चतुर्थी', chathurthi: 'चतुर्थी',
  panchami: 'पंचमी', shashthi: 'षष्ठी', shashti: 'षष्ठी', saptami: 'सप्तमी',
  ashtami: 'अष्टमी', navami: 'नवमी', dashami: 'दशमी', dasami: 'दशमी',
  ekadashi: 'एकादशी', ekadasi: 'एकादशी', dwadashi: 'द्वादशी', dvadashi: 'द्वादशी',
  trayodashi: 'त्रयोदशी', chaturdashi: 'चतुर्दशी', purnima: 'पूर्णिमा',
  poornima: 'पूर्णिमा', amavasya: 'अमावस्या',
};

function tithiLabel(panchang, isHindi) {
  if (!panchang || !panchang.isRealData || panchang.tithi === 'Unavailable') return null;
  const rawTithi = String(panchang.tithi || '').replace(/\b(shukla|krishna|paksha)\b/gi, '').trim();
  const tithi = isHindi ? panchang.tithiHi || HINDI_TITHIS[rawTithi.toLowerCase()] || rawTithi : rawTithi;
  const paksha = isHindi
    ? panchang.pakshaHi || (/shukla/i.test(panchang.paksha) ? 'शुक्ल पक्ष' : /krishna/i.test(panchang.paksha) ? 'कृष्ण पक्ष' : '')
    : panchang.paksha === 'Unavailable' ? '' : panchang.paksha;
  return [paksha, tithi].filter(Boolean).join(' · ');
}

export default function HomePanchangCard({ navigation, width }) {
  const { isDark, theme } = useContext(ThemeContext);
  const { currentLanguage } = useLanguage();
  const isHindi = currentLanguage === 'hi';
  const isFocused = useIsFocused();
  const [location] = usePanchangLocation();
  const today = usePanchangToday(location.timezone, navigation);
  const selectedDateISO = dateISO(today);
  const requestKey = `${selectedDateISO}:${location.latitude}:${location.longitude}:${location.timezone}`;
  const [result, setResult] = useState(null);
  const currentResult = result?.key === requestKey ? result : null;
  const label = tithiLabel(currentResult?.data, isHindi);

  useEffect(() => {
    if (!isFocused) return;
    let active = true;
    const controller = new AbortController();
    const dateParts = { year: today.getFullYear(), month: today.getMonth(), day: today.getDate() };
    getPanchangFromAPI({ ...dateParts, ...location, signal: controller.signal })
      .then((data) => {
        if (active) setResult({ key: requestKey, data: normalizePanchangData(data, dateParts) });
      })
      .catch(() => {
        if (active && !controller.signal.aborted) setResult({ key: requestKey, data: null });
      });
    return () => { active = false; controller.abort(); };
  }, [requestKey, location, isFocused]);

  const color = isDark ? theme.text : '#3F2713';
  const muted = isDark ? theme.textSecondary : '#725C38';
  const accent = isDark ? theme.accent : '#80520F';
  const dateLabel = today.toLocaleDateString(isHindi ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short', weekday: 'short' });

  return (
    <View style={[styles.card, { width, backgroundColor: isDark ? 'rgba(26,34,64,0.96)' : 'rgba(255,248,230,0.95)' }]}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={isHindi ? `आज का पंचांग खोलें। ${dateLabel}। ${label || ''}` : `Open today's Panchang. ${dateLabel}. ${label || ''}`}
        activeOpacity={0.8}
        style={styles.dailyButton}
        onPress={() => navigation.navigate('Calendar', { selectedDateISO })}
      >
        <Text style={[styles.eyebrow, { color: accent }]}>{isHindi ? 'आज का पंचांग' : "Today's Panchang"}</Text>
        <Text style={[styles.tithi, { color }]} numberOfLines={2}>
          {label || (currentResult ? (isHindi ? 'दैनिक विवरण देखें' : 'Explore the daily details') : (isHindi ? 'पंचांग लोड हो रहा है…' : 'Loading Panchang…'))}
        </Text>
        <Text style={[styles.date, { color: muted }]} numberOfLines={1}>{dateLabel} · {location.locationName}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={isHindi ? 'मासिक कैलेंडर खोलें' : 'Open monthly calendar'}
        activeOpacity={0.8}
        style={styles.monthButton}
        onPress={() => navigation.navigate('PanchangCalendar', { selectedDateISO, view: 'Month' })}
      >
        <Image source={CALENDAR_ICON} style={styles.icon} resizeMode="contain" />
        <Text style={[styles.monthLabel, { color: accent }]}>{isHindi ? 'मासिक\nकैलेंडर' : 'Month\ncalendar'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(207,161,72,0.5)', marginBottom: 12, shadowColor: '#8B4F12', shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  dailyButton: { flex: 1, minWidth: 0, justifyContent: 'center', paddingHorizontal: 14, paddingVertical: 12 },
  eyebrow: { fontSize: 11, lineHeight: 15, fontWeight: '800' },
  tithi: { fontSize: 14, lineHeight: 19, fontWeight: '800', marginTop: 3 },
  date: { fontSize: 10, lineHeight: 15, marginTop: 4 },
  monthButton: { width: 76, paddingHorizontal: 5, marginVertical: 10, borderLeftWidth: 1, borderLeftColor: 'rgba(207,161,72,0.35)', alignItems: 'center', justifyContent: 'center' },
  icon: { width: 28, height: 28, marginBottom: 3 },
  monthLabel: { fontSize: 10, lineHeight: 14, textAlign: 'center', fontWeight: '800' },
});
