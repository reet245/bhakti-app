import { useCallback, useContext, useState } from 'react';
import { AppState, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ThemeContext } from '../../App';
import { useLanguage } from '../context/LanguageContext';
import { getDailyMantra, getDeityById, getMantraScript, MANTRA_LIBRARY } from '../data/mantrasData';
import { useDevotionalState } from '../hooks/useDevotionalState';

export default function HomeMantraCard({ navigation, width }) {
  const { isDark, theme } = useContext(ThemeContext);
  const { currentLanguage } = useLanguage();
  const { readingScript } = useDevotionalState();
  const isHindi = currentLanguage === 'hi';
  const [today, setToday] = useState(() => new Date());

  useFocusEffect(useCallback(() => {
    const refreshDay = () => {
      const now = new Date();
      setToday((previous) => previous.toDateString() === now.toDateString() ? previous : now);
    };
    refreshDay();
    const timer = setInterval(refreshDay, 60000);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshDay();
    });
    return () => { clearInterval(timer); subscription.remove(); };
  }, []));

  const mantra = getDailyMantra(today) || MANTRA_LIBRARY[0];
  if (!mantra) return null;
  const deity = getDeityById(mantra.deityId);
  const title = isHindi ? mantra.titleHi || mantra.title : mantra.title;
  const artwork = deity?.thumbnailImage || deity?.image;
  const color = isDark ? theme.text : '#3F2713';
  const muted = isDark ? theme.textSecondary : '#725C38';
  const accent = isDark ? theme.accent : '#80520F';

  return (
    <View style={[styles.card, { width, backgroundColor: isDark ? 'rgba(26,34,64,0.96)' : 'rgba(255,248,230,0.95)' }]}>
      <View style={styles.header}>
        <Text style={[styles.eyebrow, { color: accent }]}>{isHindi ? 'आज का मंत्र' : 'Daily Mantra'}</Text>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={isHindi ? 'सभी मंत्र और श्लोक देखें' : 'View the mantra and shloka library'}
          activeOpacity={0.75}
          style={styles.libraryButton}
          onPress={() => navigation.navigate('Mantras', { collection: 'all' })}
        >
          <Text style={[styles.libraryLabel, { color: accent }]}>{isHindi ? 'संग्रह देखें' : 'View library'} ›</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={isHindi ? `${title} पढ़ें` : `Read ${title}`}
        activeOpacity={0.8}
        style={styles.dailyButton}
        onPress={() => navigation.navigate('MantraDetail', { mantraId: mantra.id })}
      >
        <View style={styles.medallion}>
          {artwork
            ? <Image source={artwork} style={styles.image} resizeMode="cover" />
            : <Text style={[styles.symbol, { color: accent }]}>{deity?.symbol || 'ॐ'}</Text>}
        </View>
        <View style={styles.copy}>
          <Text style={[styles.title, { color }]} numberOfLines={2}>{title}</Text>
          <Text style={[styles.preview, { color: muted }]} numberOfLines={2}>{getMantraScript(mantra, readingScript).slice(0, 180)}</Text>
          <Text style={[styles.readLabel, { color: accent }]}>{isHindi ? 'पढ़ें' : 'Read'} →</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: 14, borderRadius: 20, borderCurve: 'continuous', borderWidth: 1, borderColor: 'rgba(207,161,72,0.5)', paddingHorizontal: 14, paddingBottom: 14 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  eyebrow: { flexShrink: 1, fontSize: 11, lineHeight: 16, fontWeight: '800' },
  libraryButton: { minHeight: 44, justifyContent: 'center', paddingLeft: 8 },
  libraryLabel: { fontSize: 11, lineHeight: 16, fontWeight: '700' },
  dailyButton: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  medallion: { width: 58, height: 58, borderRadius: 29, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(207,161,72,0.5)' },
  image: { width: '100%', height: '100%' },
  symbol: { fontSize: 25 },
  copy: { flex: 1, minWidth: 0, gap: 4 },
  title: { fontSize: 14, lineHeight: 19, fontWeight: '800' },
  preview: { fontSize: 12, lineHeight: 19 },
  readLabel: { fontSize: 11, lineHeight: 16, fontWeight: '800' },
});
