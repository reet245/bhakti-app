import useDevotionalCopy from '../hooks/useDevotionalCopy';
import useDevotionalStyles from '../hooks/useDevotionalStyles';
import { useMemo } from 'react';
import {
  Alert,
  Image,
  ImageBackground,
  Platform,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

import { getFestivalById } from '../data/festivalData';
import { MANTRA_LIBRARY } from '../data/mantrasData';
import { enrichFestival, getFestivalDateNote, getYearFestivals } from '../features/panchang/festivals';
import { getFeaturedYearFestivals } from '../features/panchang/featuredFestivals';
import { usePanchangLocation, usePanchangToday } from '../features/panchang/locationStore';
import { dateISO } from '../features/panchang/date';
import { festivalImages } from '../data/festivalImages';
import { deityArt } from '../features/panchang/CalendarUI';
import BhaktiBackButton from '../components/BhaktiBackButton';
import { useBhaktiTopPadding } from '../components/BhaktiLayout';

const BG_IMAGE = require('../../assets/horoscope/background/horoscope-bg.png');
const DEVOTIONAL_FONT = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });
const STORY_FALLBACK = 'A devotional story for this festival will be added soon.';

function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

function buildShareMessage(festival, storyText, language) {
  const titleLine = [festival?.name, festival?.subtitle].filter(Boolean).join(' - ');
  const dateLine = festival?.dateText || festival?.date;
  const preview = storyText.length > 520 ? `${storyText.slice(0, 517).trim()}...` : storyText;

  return [
    titleLine,
    dateLine,
    getFestivalDateNote(festival, language),
    '',
    preview,
    '',
    'Shared from Bhakti.',
  ].filter((line) => line !== undefined && line !== null).join('\n');
}

function showShareFallback() {
  Alert.alert('Sharing is not available on this platform.');
}

export default function FestivalDetailScreen({ navigation, route }) {
  const styles = useDevotionalStyles(baseStyles);
  const { ui, isHindi } = useDevotionalCopy();
  const [location] = usePanchangLocation();
  const today = usePanchangToday(location.timezone, navigation);
  const todayISO = dateISO(today);
  const { width, height } = useWindowDimensions();
  const iconTop = useBhaktiTopPadding(width, 'overlay');
  const language = isHindi ? 'hi' : 'en';
  const festival = useMemo(() => {
    const params = route?.params || {};
    const occurrence = /^(\d{4}-\d{2}-\d{2}):(.+)$/.exec(params.festivalId || '');
    const selectedDate = params.dateISO || params.festival?.dateISO || occurrence?.[1];
    const key = params.festivalKey || params.festival?.key || occurrence?.[2];
    try {
      const selectedYear = selectedDate ? Number(selectedDate.slice(0, 4)) : Number(todayISO.slice(0, 4));
      const getFestivals = params.festival?.featured ? getFeaturedYearFestivals : getYearFestivals;
      const items = getFestivals({ ...location, year: selectedYear, language });
      if (key && selectedDate) {
        const match = items.find((item) => item.key === key && item.dateISO === selectedDate);
        if (match) return match;
      }
      // Older links carry only a narrative id. Resolve that story to this year's
      // next calculated occurrence instead of resurrecting its 2026 date.
      if (!selectedDate && params.festivalId) {
        const alias = { 'saraswati-puja': 'vasant_panchami', 'lakshmi-puja': 'diwali' }[params.festivalId];
        const matchesStory = (item) => item.storyId === params.festivalId || item.key === alias;
        const upcoming = items.find((item) => matchesStory(item) && item.dateISO >= todayISO);
        if (upcoming) return upcoming;
        if (selectedYear < 2100) {
          const next = getYearFestivals({ ...location, year: selectedYear + 1, language }).find(matchesStory);
          if (next) return next;
        }
      }
    } catch { /* A passed occurrence can still show its story when a location is unavailable. */ }
    if (params.festival) return enrichFestival(params.festival, { ...location, language, dateISO: selectedDate });
    const story = getFestivalById(params.festivalId);
    if (story) return enrichFestival({ ...story, storyId: story.id, dateBasis: 'reference' }, { ...location, language, dateISO: story.dateISO });
    return { name: isHindi ? 'उत्सव' : 'Festival', story: '', dateText: '' };
  }, [route?.params, location, language, isHindi, todayISO]);
  const festivalImage = festivalImages[festival?.imageKey];
  const imageSource = festivalImage || deityArt[festival?.deityId];
  const storyText = festival?.story || festival?.description || STORY_FALLBACK;
  const relatedMantra = MANTRA_LIBRARY.find((item) => item.id === festival?.mantraId);
  const dateText = festival?.dateText || festival?.date;
  const contentWidth = Math.max(282, Math.min(width - Math.max(24, width * 0.07), 720));
  const compactWidth = Math.min(width, 520);
  const heroHeight = Math.max(260, Math.min(380, height * 0.42, width * 0.98));
  const cardOverlap = Math.max(22, Math.min(34, heroHeight * 0.09));
  const titleSize = Math.max(27, Math.min(38, compactWidth * 0.078));
  const subtitleSize = Math.max(13, Math.min(16, compactWidth * 0.035));
  const storySize = Math.max(15, Math.min(17, compactWidth * 0.039));

  const handleShare = async () => {
    const message = buildShareMessage(festival, storyText, language);

    try {
      if (Platform.OS === 'web' && typeof globalThis.navigator?.share === 'function') {
        await globalThis.navigator.share({
          title: festival?.name || 'Festival Story',
          text: message,
        });
        return;
      }

      if (typeof Share?.share === 'function') {
        await Share.share({
          title: festival?.name || 'Festival Story',
          message,
        });
        return;
      }

      showShareFallback();
    } catch (error) {
      if (error?.name === 'AbortError') return;
      showShareFallback();
    }
  };

  return (
    <ImageBackground source={BG_IMAGE} style={styles.background} resizeMode="cover">
      <View style={styles.overlay} />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={[styles.content, { paddingBottom: Math.max(34, height * 0.055) }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.heroStage, { height: heroHeight }]}>
            {imageSource ? (
              <Image source={imageSource} style={styles.heroImage} resizeMode={festivalImage ? 'cover' : 'contain'} />
            ) : (
              <View style={styles.heroFallback}>
                <Text style={styles.heroInitials}>{getInitials(festival?.name)}</Text>
              </View>
            )}
            <View style={styles.heroShade} />

            <BhaktiBackButton navigation={navigation} style={[styles.backButton, { top: iconTop }]} />

            <TouchableOpacity
              style={[styles.floatButton, styles.shareButton, { top: iconTop }]}
              activeOpacity={0.82}
              onPress={handleShare}
            >
              <Text style={styles.shareIcon}>{ui('Share')}</Text>
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.storyCard,
              {
                width: contentWidth,
                marginTop: -cardOverlap,
                borderRadius: Math.max(24, Math.min(32, contentWidth * 0.055)),
                paddingHorizontal: Math.max(18, Math.min(26, contentWidth * 0.048)),
                paddingVertical: Math.max(20, Math.min(28, height * 0.034)),
              },
            ]}
          >
            <Text
              style={[styles.festivalName, { fontSize: titleSize, lineHeight: titleSize * 1.14 }]}
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.78}
            >
              {festival?.name}
            </Text>
            {!!festival.dateISO && <Text style={[styles.subtitle, { fontSize: 12, lineHeight: 18, marginTop: 8 }]}>{getFestivalDateNote(festival, language)}</Text>}
            {!!festival?.subtitle && (
              <Text style={[styles.subtitle, { fontSize: subtitleSize, lineHeight: subtitleSize * 1.38 }]} numberOfLines={2}>
                {festival.subtitle}
              </Text>
            )}
            {!!dateText && (
              <Text style={[styles.dateText, { fontSize: subtitleSize, lineHeight: subtitleSize * 1.35 }]} numberOfLines={1}>
                {dateText}
              </Text>
            )}
            {festival.observances?.length > 1 && (
              <Text style={[styles.subtitle, { fontSize: 12, lineHeight: 18 }]}>
                {isHindi ? 'इस तिथि पर स्मार्त और वैष्णव दोनों परंपराओं का व्रत।' : 'Smarta and Vaishnava traditions observe the fast on this date.'}
              </Text>
            )}
            <Text style={[styles.storyText, { fontSize: storySize, lineHeight: storySize * 1.66 }]}>
              {festival.story ? <>{isHindi && 'कथा अभी अंग्रेज़ी में उपलब्ध है।\n\n'}{storyText}</> : (festival.description || (isHindi ? 'यह पंचांग में दर्शाया गया व्रत या उत्सव है। इसकी विस्तृत कथा अभी उपलब्ध नहीं है।' : 'This is an observance in the Panchang. A detailed story is not available yet.'))}
            </Text>
            {relatedMantra && (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={isHindi ? `संबंधित मंत्र पढ़ें: ${relatedMantra.titleHi || relatedMantra.title}` : `Read related mantra: ${relatedMantra.title}`}
                activeOpacity={0.8}
                style={styles.relatedMantraButton}
                onPress={() => navigation.navigate('MantraDetail', { mantraId: relatedMantra.id })}
              >
                <Text style={styles.relatedMantraLabel}>{isHindi ? 'संबंधित मंत्र' : 'Related mantra'}</Text>
                <Text style={styles.relatedMantraTitle}>{isHindi ? relatedMantra.titleHi || relatedMantra.title : relatedMantra.title} →</Text>
              </TouchableOpacity>
            )}
            {!!festival.dateISO && <TouchableOpacity accessibilityRole="button" style={[styles.floatButton, { position: 'relative', marginTop: 22, alignSelf: 'center' }]} onPress={() => navigation?.navigate?.('Calendar', { selectedDateISO: festival.dateISO })}><Text style={styles.shareIcon}>{isHindi ? 'इस दिन का पंचांग' : 'Open this day’s Panchang'}</Text></TouchableOpacity>}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const baseStyles = StyleSheet.create({
  relatedMantraButton: {
    marginTop: 18,
    padding: 14,
    gap: 5,
    borderRadius: 16,
    borderCurve: 'continuous',
    backgroundColor: 'rgba(255, 248, 232, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(184, 121, 24, 0.28)',
  },
  relatedMantraLabel: { color: '#80520F', fontSize: 11, lineHeight: 16, fontWeight: '700' },
  relatedMantraTitle: { color: '#3F2713', fontSize: 15, lineHeight: 22, fontWeight: '800' },
  background: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 244, 218, 0.7)',
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    alignItems: 'center',
  },
  heroStage: {
    width: '100%',
    backgroundColor: '#E8CF99',
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2DDA8',
  },
  heroInitials: {
    color: '#9A6114',
    fontFamily: DEVOTIONAL_FONT,
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: 0,
  },
  heroShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(47, 28, 9, 0.16)',
  },
  floatButton: {
    position: 'absolute',
    minWidth: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 250, 239, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255, 231, 177, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    shadowColor: '#2F1C09',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    zIndex: 2,
  },
  shareButton: {
    right: 16,
  },
  shareIcon: {
    color: '#5B3511',
    fontSize: 12,
    fontWeight: '900',
    lineHeight: 16,
  },
  storyCard: {
    backgroundColor: 'rgba(255, 250, 239, 0.98)',
    borderWidth: 1,
    borderColor: 'rgba(190, 137, 44, 0.42)',
    shadowColor: '#7A552A',
    shadowOpacity: 0.14,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  festivalName: {
    color: '#3F2713',
    fontFamily: DEVOTIONAL_FONT,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0,
  },
  subtitle: {
    color: '#75501E',
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 8,
  },
  dateText: {
    color: '#A36A12',
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 6,
  },
  storyText: {
    color: '#4E3217',
    fontWeight: '700',
    marginTop: 17,
  },
});
