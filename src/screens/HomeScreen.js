import { useContext } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  ImageBackground,
  SafeAreaView,
  ScrollView,
  StatusBar,
  useWindowDimensions,
} from 'react-native';

// Pull in the global theme context created in App.js
import { ThemeContext } from '../../App';
import { useLanguage } from '../context/LanguageContext';
import HomePanchangCard from '../components/HomePanchangCard';
import HomeMantraCard from '../components/HomeMantraCard';

// -------------------------------------------------------
// Background image — resolved at bundle time by Metro
// Image lives at: assets/home-bg.jpeg (flat assets folder)
// -------------------------------------------------------
const BG_IMAGE = require('../../assets/home-bg.jpeg');

// -------------------------------------------------------
// Custom devotional icon assets
// Folder: assets/icon/ (note: singular "icon", not "icons")
// Note: calendar file on disk is spelled "calender.png"
// require() resolves at bundle time — Metro packs them into the app
// -------------------------------------------------------
const ICONS = {
  calendar: require('../../assets/icon/calender.png'),   // disk spelling: calender
  kundli:   require('../../assets/icon/kundli.png'),
  puja:     require('../../assets/icon/puja.png'),
  mantras:  require('../../assets/icon/mantras.png'),
  fasting:  require('../../assets/icon/fasting.png'),
  horoscope: require('../../assets/icon/kundli.png'),
};

// Feature buttons — each carries a pre-resolved image source
const FEATURES = [
  { labelKey: 'panchang', icon: ICONS.calendar, screen: 'PanchangCalendar', subtitle: 'Monthly almanac &\ndaily Panchang' },
  { labelKey: 'kundli', icon: ICONS.kundli, screen: 'Kundli', subtitle: 'Your personal\nbirth chart' },
  { labelKey: 'puja', icon: ICONS.puja, screen: 'Puja', subtitle: 'Virtual Puja,\nAarti & Offerings' },
  { labelKey: 'mantras', icon: ICONS.mantras, screen: 'Mantras', subtitle: 'Sacred chants\nfor peace & power' },
  { labelKey: 'dailyHoroscope', icon: ICONS.horoscope, screen: 'DailyHoroscope', subtitle: 'Daily predictions\nfor your sign' },
  { labelKey: 'upcomingFestivals', icon: ICONS.fasting, screen: 'UpcomingFestivals', subtitle: 'Never miss an\nauspicious day' },
];

const LOTUS_MARK = '\u2741';

function HomeModuleCard({ item, title, subtitle, cardWidth, cardHeight, medallionSize, iconSize, onPress }) {
  const { theme, isDark } = useContext(ThemeContext);
  return (
    <TouchableOpacity
      key={item.labelKey}
      style={[styles.moduleCard, { width: cardWidth, height: cardHeight, backgroundColor: isDark ? 'rgba(26,34,64,0.94)' : 'rgba(255,248,230,0.9)' }]}
      onPress={onPress}
      activeOpacity={0.78}
      accessibilityRole="button"
    >
      <View style={styles.cardInnerGlow} pointerEvents="none" />
      <View style={styles.cardTopGlow} pointerEvents="none" />

      <View
        style={[
          styles.iconMedallion,
          {
            width: medallionSize,
            height: medallionSize,
            borderRadius: medallionSize / 2,
          },
        ]}
      >
        <View
          style={[
            styles.iconInnerRing,
            {
              width: medallionSize - 10,
              height: medallionSize - 10,
              borderRadius: (medallionSize - 10) / 2,
            },
          ]}
        />
        <Image
          source={item.icon}
          style={[styles.featureIcon, { width: iconSize, height: iconSize }]}
          resizeMode="contain"
        />
      </View>

      <View style={styles.cardTextBlock}>
        <Text
          style={[styles.moduleTitle, { color: theme.text }]}
          numberOfLines={2}
          adjustsFontSizeToFit
          minimumFontScale={0.88}
        >
          {title}
        </Text>
        <Text style={[styles.moduleSubtitle, { color: theme.textSecondary }]} numberOfLines={2}>
          {subtitle || item.subtitle}
        </Text>
      </View>

      <View style={styles.lotusDivider} pointerEvents="none">
        <View style={styles.lotusLine} />
        <Text style={styles.lotusSymbol}>{LOTUS_MARK}</Text>
        <View style={styles.lotusLine} />
      </View>
    </TouchableOpacity>
  );
}

// This is the Home Screen - the first screen users see when they open the app
export default function HomeScreen({ navigation }) {
  // "navigation" is given to us automatically by React Navigation

  // ThemeContext kept wired — toggle still works when screens are themed later
  useContext(ThemeContext);
  const { t, currentLanguage } = useLanguage();
  const { width, height } = useWindowDimensions();
  const isHindi = currentLanguage === 'hi';

  const isCompact = width < 380;
  const horizontalPadding = isCompact ? 16 : 22;
  const gridGap = isCompact ? 8 : 10;
  const gridWidth = Math.min(width - horizontalPadding * 2, 388);
  const cardWidth = Math.floor((gridWidth - gridGap * 2) / 3);
  const cardHeight = Math.min(158, Math.max(148, cardWidth * 1.32));
  const medallionSize = Math.min(62, Math.max(52, cardWidth * 0.5));
  const iconSize = Math.min(38, Math.max(30, medallionSize * 0.58));


  return (
    // ImageBackground stretches to fill the screen behind all children
    <ImageBackground
      source={BG_IMAGE}
      style={styles.bgImage}
      resizeMode="cover"
    >
      {/* Very subtle dark scrim — just enough for text legibility
          without dimming the artwork. Opacity kept at 0.22.        */}
      <View style={styles.overlay} pointerEvents="none" />

      <SafeAreaView style={styles.safeArea}>

        {/* -------------------------------------------------------
            TOP BAR — settings icon pinned to top-right
            ------------------------------------------------------- */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.settingsIcon}
            onPress={() => navigation.navigate('Settings')}
            accessibilityLabel={t('settings')}
          >
            <Text style={styles.settingsIconText}>⚙️</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Keep the first content below the deity portraits; shorter screens scroll. */}
          <View style={[styles.spacer, { minHeight: Math.max(200, Math.min(420, height * 0.42)) }]} />

          <View style={[styles.bottomContent, { paddingHorizontal: horizontalPadding }]}>
            <HomePanchangCard navigation={navigation} width={gridWidth} />

            {/* Feature buttons — 3-column grid */}
            <View style={[styles.buttonGrid, { width: gridWidth, columnGap: gridGap, rowGap: gridGap + 2 }]}>
              {FEATURES.map((item) => (
                <HomeModuleCard
                  key={item.labelKey}
                  item={item}
                  title={item.labelKey === 'panchang' ? (isHindi ? 'कैलेंडर व पंचांग' : 'Calendar & Panchang') : t(item.labelKey)}
                  subtitle={item.labelKey === 'panchang'
                    ? (isHindi ? 'मासिक पत्रक और\nदैनिक पंचांग' : 'Monthly almanac &\ndaily Panchang')
                    : item.labelKey === 'mantras'
                      ? (isHindi ? 'मंत्र, श्लोक\nऔर जप' : 'Mantras, shlokas\n& Jaap')
                      : undefined}
                  cardWidth={cardWidth}
                  cardHeight={cardHeight}
                  medallionSize={medallionSize}
                  iconSize={iconSize}
                  onPress={() => navigation.navigate(item.screen)}
                />
              ))}
            </View>
            <HomeMantraCard navigation={navigation} width={gridWidth} />
          </View>
        </ScrollView>

      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({

  // --- Full-screen image container ---
  bgImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },

  // --- Very subtle translucent scrim (22% black) ---
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
  },

  // --- SafeAreaView sits above the scrim ---
  safeArea: {
    flex: 1,
    paddingTop: StatusBar.currentHeight ?? 0,
  },

  // --- Top bar: settings icon pinned to top-right ---
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 22,   // extra breathing room from edge
    paddingTop: 14,          // comfortable distance from status bar
  },

  // Minimal bare icon — no heavy circle, no dark overlay
  // A tiny warm-cream frost is enough to lift it off busy artwork
  settingsIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 248, 220, 0.18)', // barely-there warm frost
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIconText: {
    fontSize: 20,
  },

  // --- Flex spacer — pushes buttons to the bottom ---
  spacer: {
    flex: 1,
  },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1 },

  // --- Bottom section — buttons float in the lower quarter ---
  bottomContent: {
    paddingHorizontal: 22,   // matches topBar horizontal rhythm
    paddingBottom: 38,       // generous floor so buttons don't crowd the very edge
    paddingTop: 8,           // small gap between spacer and grid
    alignItems: 'center',
  },

  // --- 3-column flex-wrap button grid ---
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    rowGap: 12,
    width: '100%',
  },

  featureIcon: {
    zIndex: 1,
  },

  moduleCard: {
    backgroundColor: 'rgba(255, 248, 230, 0.50)',
    borderRadius: 24,
    paddingHorizontal: 7,
    paddingTop: 8,
    paddingBottom: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(207, 161, 72, 0.38)',
    shadowColor: '#8b4f12',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 7,
    elevation: 2,
  },

  cardInnerGlow: {
    position: 'absolute',
    top: 2,
    right: 2,
    bottom: 2,
    left: 2,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.24)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },

  cardTopGlow: {
    position: 'absolute',
    top: 5,
    width: '66%',
    height: 26,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
  },

  iconMedallion: {
    backgroundColor: 'rgba(255, 248, 225, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(207, 161, 72, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#d4932e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
  },

  iconInnerRing: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.24)',
    backgroundColor: 'rgba(255, 250, 229, 0.10)',
  },

  cardTextBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    width: '100%',
  },

  moduleTitle: {
    fontSize: 15,
    lineHeight: 17,
    fontWeight: '800',
    color: '#56340d',
    letterSpacing: 0,
    textAlign: 'center',
    textShadowColor: 'rgba(255, 235, 160, 0.36)',
    textShadowOffset: { width: 0, height: 0.5 },
    textShadowRadius: 2,
  },

  moduleSubtitle: {
    marginTop: 3,
    fontSize: 11,
    lineHeight: 12.5,
    fontWeight: '600',
    color: 'rgba(91, 55, 15, 0.80)',
    letterSpacing: 0,
    textAlign: 'center',
  },

  lotusDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '78%',
    minHeight: 12,
  },

  lotusLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(190, 123, 28, 0.34)',
  },

  lotusSymbol: {
    marginHorizontal: 5,
    fontSize: 9,
    lineHeight: 11,
    color: 'rgba(148, 84, 16, 0.66)',
    textAlign: 'center',
  },
});
