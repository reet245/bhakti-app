import useDevotionalStyles from '../hooks/useDevotionalStyles';
import { useEffect, useMemo, useState } from 'react';
import {
  Image,
  ImageBackground,
  ActivityIndicator,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

import { getFeaturedYearFestivals } from '../features/panchang/featuredFestivals';
import { getPendingRegionalFestivals } from '../features/panchang/regionalFestivalReferences';
import { festivalImages } from '../data/festivalImages';
import { deityArt } from '../features/panchang/CalendarUI';
import { useLanguage } from '../context/LanguageContext';
import { usePanchangLocation, usePanchangToday } from '../features/panchang/locationStore';
import { dateISO } from '../features/panchang/date';
import BhaktiBackButton, { BhaktiBackSpacer } from '../components/BhaktiBackButton';
import { useBhaktiTopPadding } from '../components/BhaktiLayout';

const BG_IMAGE = require('../../assets/horoscope/background/horoscope-bg.png');
const DEVOTIONAL_FONT = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

const tabs = [
  { id: 'all', labelKey: 'all' },
  { id: 'upcoming', labelKey: 'upcoming' },
  { id: 'past', labelKey: 'pastFestivals' },
];

function groupFestivalsByMonth(items, language) {
  return items.reduce((sections, festival) => {
    const monthIndex = Number(festival.dateISO.slice(5, 7)) - 1;
    const sectionId = festival.dateISO.slice(0, 7);
    const existingSection = sections.find((section) => section.id === sectionId);
    if (existingSection) { existingSection.festivals.push(festival); return sections; }
    sections.push({
      id: sectionId,
      title: new Intl.DateTimeFormat(language === 'hi' ? 'hi-IN' : 'en-IN', { month: 'long', year: 'numeric' }).format(new Date(Number(festival.dateISO.slice(0, 4)), monthIndex, 1, 12)),
      festivals: [festival],
    });
    return sections;
  }, []);
}

function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

function FestivalSticker({ festival, responsiveStyles }) {
  const styles = useDevotionalStyles(baseStyles);
  const festivalImage = festivalImages[festival?.imageKey];
  const imageSource = festivalImage || deityArt[festival?.deityId];

  return (
    <View style={[styles.festivalImageWrap, responsiveStyles.festivalImageWrap]}>
      {imageSource ? (
        <Image source={imageSource} style={styles.festivalImage} resizeMode={festivalImage ? 'cover' : 'contain'} />
      ) : (
        <View style={styles.placeholderPanel}>
          <Text style={[styles.placeholderInitials, responsiveStyles.placeholderInitials]}>
            {getInitials(festival.name)}
          </Text>
        </View>
      )}
    </View>
  );
}

export default function UpcomingFestivalsScreen({ navigation, route }) {
  const styles = useDevotionalStyles(baseStyles);
  const { t, currentLanguage } = useLanguage();
  const [location] = usePanchangLocation();
  const today = usePanchangToday(location.timezone, navigation);
  const todayISO = dateISO(today);
  const { width, height } = useWindowDimensions();
  const topPadding = useBhaktiTopPadding(width, 'title');
  const [activeTab, setActiveTab] = useState(route?.params?.year ? 'all' : 'upcoming');
  const [year, setYear] = useState(() => route?.params?.year || today.getFullYear());
  const [yearItems, setYearItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (route?.params?.year) { setYear(route.params.year); setActiveTab('all'); }
  }, [route?.params?.year]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    const timer = setTimeout(() => {
      try {
        const items = getFeaturedYearFestivals({ year, ...location, language: currentLanguage });
        if (!cancelled) setYearItems(items);
      } catch (failure) {
        if (!cancelled) { setYearItems([]); setError(failure.message); }
      } finally { if (!cancelled) setLoading(false); }
    }, 0);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [year, location, currentLanguage]);

  const changeYear = (offset) => {
    setYear((value) => Math.max(1900, Math.min(2100, value + offset)));
    setActiveTab('all');
  };

  const responsiveStyles = useMemo(() => {
    const compactWidth = Math.min(width, 520);
    const horizontalPadding = Math.max(14, Math.min(24, compactWidth * 0.045));
    const contentWidth = Math.max(280, Math.min(width - horizontalPadding * 2, 720));
    const titleSize = Math.max(24, Math.min(34, compactWidth * 0.07));
    const subtitleSize = Math.max(12, Math.min(15, compactWidth * 0.031));
    const cardRadius = Math.max(18, Math.min(24, contentWidth * 0.038));
    const cardHeight = Math.max(140, Math.min(165, height * 0.19));
    const imageWidth = Math.max(118, Math.min(contentWidth * 0.44, 310));
    const cardTitleSize = Math.max(15, Math.min(18, compactWidth * 0.04));
    const sectionTitleSize = Math.max(18, Math.min(22, compactWidth * 0.045));
    const bodySize = Math.max(11, Math.min(13, compactWidth * 0.029));
    const textPaddingHorizontal = Math.max(12, Math.min(17, contentWidth * 0.03));
    const textPaddingVertical = Math.max(10, Math.min(14, cardHeight * 0.085));

    return {
      content: {
        paddingHorizontal: horizontalPadding,
        paddingTop: topPadding,
        paddingBottom: Math.max(30, height * 0.045),
      },
      contentInner: {
        width: contentWidth,
      },
      header: {
        marginBottom: Math.max(14, height * 0.022),
        paddingHorizontal: Math.max(8, contentWidth * 0.03),
      },
      title: {
        fontSize: titleSize,
        lineHeight: titleSize * 1.16,
      },
      subtitle: {
        fontSize: subtitleSize,
        lineHeight: subtitleSize * 1.45,
        marginTop: Math.max(6, height * 0.008),
      },
      tabRow: {
        borderRadius: Math.max(17, Math.min(22, contentWidth * 0.04)),
        padding: Math.max(4, contentWidth * 0.007),
        marginBottom: Math.max(16, height * 0.022),
      },
      tabButton: {
        borderRadius: Math.max(13, Math.min(18, contentWidth * 0.032)),
        paddingVertical: Math.max(9, Math.min(12, height * 0.014)),
      },
      tabText: {
        fontSize: Math.max(11, Math.min(13, compactWidth * 0.028)),
      },
      sectionList: {
        rowGap: Math.max(18, height * 0.028),
      },
      section: {
        rowGap: Math.max(9, height * 0.012),
      },
      sectionTitle: {
        fontSize: sectionTitleSize,
        lineHeight: sectionTitleSize * 1.22,
      },
      cardList: {
        rowGap: Math.max(10, height * 0.014),
      },
      card: {
        height: cardHeight,
        borderRadius: cardRadius,
      },
      festivalImageWrap: {
        width: imageWidth,
        height: '100%',
        borderTopLeftRadius: cardRadius,
        borderBottomLeftRadius: cardRadius,
      },
      cardCopy: {
        paddingHorizontal: textPaddingHorizontal,
        paddingVertical: textPaddingVertical,
      },
      cardTitle: {
        fontSize: cardTitleSize,
        lineHeight: cardTitleSize * 1.22,
      },
      cardDate: {
        fontSize: bodySize,
        lineHeight: bodySize * 1.3,
      },
      cardMeaning: {
        fontSize: bodySize,
        lineHeight: bodySize * 1.35,
      },
      cardAction: {
        fontSize: Math.max(12, Math.min(14, compactWidth * 0.031)),
        lineHeight: Math.max(16, Math.min(19, compactWidth * 0.042)),
      },
      placeholderInitials: {
        fontSize: Math.max(24, Math.min(34, compactWidth * 0.07)),
        lineHeight: Math.max(30, Math.min(40, compactWidth * 0.084)),
      },
      emptyCard: {
        minHeight: Math.max(140, height * 0.19),
        borderRadius: cardRadius,
        padding: Math.max(18, contentWidth * 0.035),
      },
      emptyText: {
        fontSize: Math.max(12, Math.min(14, compactWidth * 0.03)),
      },
    };
  }, [height, topPadding, width]);

  const festivalSections = useMemo(() => {
    const visibleFestivals = yearItems.filter((festival) => activeTab === 'all' || (activeTab === 'upcoming' ? festival.dateISO >= todayISO : festival.dateISO < todayISO));
    return groupFestivalsByMonth(visibleFestivals, currentLanguage);
  }, [activeTab, todayISO, currentLanguage, yearItems]);

  const emptyMessage = currentLanguage === 'hi'
    ? 'इस चयन में कोई उत्सव नहीं है। सभी उत्सव या दूसरा वर्ष चुनें।'
    : 'No festivals in this selection. Choose All festivals or another year.';
  const pendingFestivals = activeTab !== 'past' && year >= today.getFullYear()
    ? getPendingRegionalFestivals(year, currentLanguage) : [];

  const openFestivalStory = (festival) => {
    navigation?.navigate?.('FestivalDetail', { festival, dateISO: festival.dateISO, festivalKey: festival.key });
  };

  return (
    <ImageBackground source={BG_IMAGE} style={styles.background} resizeMode="cover">
      <View style={styles.overlay} />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={[styles.content, responsiveStyles.content]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.contentInner, responsiveStyles.contentInner]}>
            <View style={[styles.header, responsiveStyles.header]}>
              <View pointerEvents="none" style={styles.headerGlow} />
              <View style={styles.headerTopRow}>
                <BhaktiBackButton navigation={navigation} />
                <Text style={[styles.title, responsiveStyles.title]}>{t('upcomingFestivals')}</Text>
                <BhaktiBackSpacer />
              </View>
              <Text style={[styles.subtitle, responsiveStyles.subtitle]}>
                {t('stayConnectedCelebrations')}
                {'\n'}{currentLanguage === 'hi' ? 'भारत के प्रमुख त्योहार · चुनिंदा एकादशियाँ' : 'Major festivals across India · Selected Ekadashis'}
                {'\n'}{location.locationName}
              </Text>
            </View>

            <View style={[styles.tabRow, responsiveStyles.tabRow, { alignItems: 'center' }]}>
              <TouchableOpacity accessibilityRole="button" accessibilityLabel={currentLanguage === 'hi' ? 'पिछला वर्ष' : 'Previous year'} disabled={year <= 1900} style={[styles.tabButton, responsiveStyles.tabButton]} onPress={() => changeYear(-1)}><Text style={styles.tabText}>‹</Text></TouchableOpacity>
              <Text accessibilityRole="header" style={[styles.sectionTitle, { flex: 2, textAlign: 'center' }]}>{year}</Text>
              <TouchableOpacity accessibilityRole="button" accessibilityLabel={currentLanguage === 'hi' ? 'अगला वर्ष' : 'Next year'} disabled={year >= 2100} style={[styles.tabButton, responsiveStyles.tabButton]} onPress={() => changeYear(1)}><Text style={styles.tabText}>›</Text></TouchableOpacity>
            </View>

            <View style={[styles.tabRow, responsiveStyles.tabRow]}>
              {tabs.map((tab) => {
                const isActive = tab.id === activeTab;

                return (
                  <TouchableOpacity
                    key={tab.id}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: isActive }}
                    style={[styles.tabButton, responsiveStyles.tabButton, isActive && styles.tabButtonActive]}
                    onPress={() => setActiveTab(tab.id)}
                    activeOpacity={0.82}
                  >
                    <Text style={[styles.tabText, responsiveStyles.tabText, isActive && styles.tabTextActive]}>
                      {tab.id === 'all' ? (currentLanguage === 'hi' ? 'सभी उत्सव' : 'All festivals') : t(tab.labelKey)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {loading ? <ActivityIndicator size="large" color="#A36A12" accessibilityLabel={currentLanguage === 'hi' ? 'उत्सव लोड हो रहे हैं' : 'Loading festivals'} /> : error ? <Text style={styles.emptyText}>{error}</Text> : festivalSections.length > 0 ? (
              <View style={[styles.sectionList, responsiveStyles.sectionList]}>
                {festivalSections.map((section) => (
                  <View key={section.id} style={[styles.section, responsiveStyles.section]}>
                    <Text style={[styles.sectionTitle, responsiveStyles.sectionTitle]}>{section.title}</Text>

                    <View style={[styles.cardList, responsiveStyles.cardList]}>
                      {section.festivals.map((festival) => (
                        <TouchableOpacity
                          key={festival.id}
                          accessibilityRole="button"
                          accessibilityLabel={`${festival.name}, ${festival.dateText}`}
                          style={[styles.card, responsiveStyles.card]}
                          activeOpacity={0.86}
                          onPress={() => openFestivalStory(festival)}
                        >
                          <FestivalSticker festival={festival} responsiveStyles={responsiveStyles} />

                          <View style={[styles.cardCopy, responsiveStyles.cardCopy]}>
                            <Text style={[styles.cardTitle, responsiveStyles.cardTitle]} numberOfLines={2}>
                              {festival.name}
                            </Text>
                            {!!(festival.dateText || festival.date) && (
                              <Text style={[styles.cardDate, responsiveStyles.cardDate]} numberOfLines={1}>
                                {new Intl.DateTimeFormat(currentLanguage === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${festival.dateISO}T12:00:00`))}
                              </Text>
                            )}
                            <Text style={[styles.cardMeaning, responsiveStyles.cardMeaning]} numberOfLines={2}>
                              {festival.subtitle || festival.meaning}
                            </Text>
                            <View style={styles.cardActionRow}>
                              <Text
                                style={[styles.cardAction, responsiveStyles.cardAction]}
                                numberOfLines={1}
                              >
                                {currentLanguage === 'hi' ? 'विवरण देखें' : 'View details'}
                              </Text>
                              <Text style={[styles.cardActionArrow, responsiveStyles.cardAction]}>{'>'}</Text>
                            </View>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={[styles.emptyCard, responsiveStyles.emptyCard]}>
                <Text style={[styles.emptyText, responsiveStyles.emptyText]}>{emptyMessage}</Text>
              </View>
            )}
            {!loading && !error && pendingFestivals.length > 0 && (
              <Text style={[styles.subtitle, { marginTop: 20 }]}>
                {currentLanguage === 'hi' ? 'तिथि की पुष्टि बाकी है: ' : 'Dates to be confirmed: '}
                {pendingFestivals.map((festival) => festival.name).join(', ')}
              </Text>
            )}
            <Text style={[styles.subtitle, { fontSize: 11, lineHeight: 17, marginTop: 20 }]}>
              {currentLanguage === 'hi'
                ? 'क्षेत्रीय तिथियों का स्थान विवरण में देखें। विस्तृत क्षेत्रीय संदर्भ सूची 2026–2027 के लिए उपलब्ध है; अन्य वर्षों में सूची छोटी हो सकती है। नियमित मासिक व्रत पंचांग में देखें।'
                : 'See festival details for the region used for each date. The expanded regional reference list covers 2026–2027; other years may have fewer entries. Regular monthly fasts remain in the Panchang.'}
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const baseStyles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 246, 226, 0.62)',
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
  contentInner: {
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    overflow: 'visible',
  },
  headerTopRow: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    zIndex: 1,
  },
  headerGlow: {
    position: 'absolute',
    top: '-22%',
    width: '68%',
    aspectRatio: 1,
    borderRadius: 999,
    backgroundColor: 'rgba(246, 205, 105, 0.2)',
    shadowColor: '#FFD875',
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
  },
  title: {
    color: '#3F2713',
    fontFamily: DEVOTIONAL_FONT,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0,
    textShadowColor: 'rgba(184, 121, 24, 0.16)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    zIndex: 1,
  },
  subtitle: {
    color: '#795425',
    fontWeight: '800',
    textAlign: 'center',
    zIndex: 1,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(239, 216, 168, 0.74)',
    borderWidth: 1,
    borderColor: 'rgba(216, 177, 92, 0.52)',
    shadowColor: '#8A5A12',
    shadowOpacity: 0.09,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  tabButtonActive: {
    backgroundColor: 'rgba(255, 248, 232, 0.94)',
  },
  tabText: {
    color: '#8A6425',
    fontWeight: '900',
  },
  tabTextActive: {
    color: '#3F2713',
  },
  sectionList: {},
  section: {},
  sectionTitle: {
    color: '#3F2713',
    fontWeight: '900',
    paddingHorizontal: 2,
    textShadowColor: 'rgba(255, 250, 239, 0.62)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  cardList: {},
  card: {
    backgroundColor: 'rgba(255, 250, 239, 0.96)',
    borderWidth: 1,
    borderColor: 'rgba(216, 177, 92, 0.62)',
    flexDirection: 'row',
    alignItems: 'stretch',
    shadowColor: '#7A552A',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
    overflow: 'hidden',
  },
  festivalImageWrap: {
    backgroundColor: 'rgba(243, 218, 162, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  },
  festivalImage: {
    width: '100%',
    height: '100%',
  },
  placeholderPanel: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 244, 218, 0.94)',
  },
  placeholderInitials: {
    color: '#A56512',
    fontFamily: DEVOTIONAL_FONT,
    fontWeight: '900',
    letterSpacing: 0,
  },
  cardCopy: {
    flex: 1,
    minWidth: 0,
    zIndex: 1,
    justifyContent: 'center',
  },
  cardTitle: {
    color: '#3F2713',
    fontWeight: '900',
  },
  cardDate: {
    color: '#A36A12',
    fontWeight: '900',
    marginTop: 7,
  },
  cardMeaning: {
    color: '#5E4220',
    fontWeight: '800',
    marginTop: 7,
  },
  cardActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexShrink: 0,
    flexWrap: 'nowrap',
    marginTop: 9,
  },
  cardAction: {
    color: '#B87918',
    fontWeight: '900',
    flexShrink: 0,
    includeFontPadding: false,
  },
  cardActionArrow: {
    color: '#B87918',
    fontWeight: '900',
    marginLeft: 5,
    flexShrink: 0,
    includeFontPadding: false,
  },
  emptyCard: {
    backgroundColor: 'rgba(255, 250, 239, 0.96)',
    borderWidth: 1,
    borderColor: 'rgba(216, 177, 92, 0.62)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7A552A',
    shadowOpacity: 0.10,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  emptyText: {
    color: '#8A6425',
    fontWeight: '800',
    textAlign: 'center',
  },
});
