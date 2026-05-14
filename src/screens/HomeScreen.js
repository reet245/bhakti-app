import { useContext } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  ImageBackground,
  SafeAreaView,
  StatusBar,
} from 'react-native';

// Pull in the global theme context created in App.js
import { ThemeContext } from '../../App';
import { useLanguage } from '../context/LanguageContext';

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
  { labelKey: 'panchang',    icon: ICONS.calendar, screen: 'Calendar' },
  { labelKey: 'kundli',      icon: ICONS.kundli,   screen: 'Kundli'   },
  { labelKey: 'puja',        icon: ICONS.puja,     screen: 'Puja'     },
  { labelKey: 'mantras',     icon: ICONS.mantras,  screen: 'Mantras'  },
  { labelKey: 'fastingDays', icon: ICONS.fasting,  screen: 'Calendar' },
  { labelKey: 'upcomingFestivals', icon: ICONS.fasting, screen: 'UpcomingFestivals' },
  { labelKey: 'dailyHoroscope', icon: ICONS.horoscope, screen: 'DailyHoroscope' },
];

// This is the Home Screen - the first screen users see when they open the app
export default function HomeScreen({ navigation }) {
  // "navigation" is given to us automatically by React Navigation

  // ThemeContext kept wired — toggle still works when screens are themed later
  useContext(ThemeContext);
  const { t } = useLanguage();


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

        {/* -------------------------------------------------------
            SPACER — lets the artwork breathe above the buttons.
            Flex:1 pushes the button section toward the bottom.
            ------------------------------------------------------- */}
        <View style={styles.spacer} />

        {/* -------------------------------------------------------
            BOTTOM CONTENT — app name + feature buttons
            Positioned in the lower-middle third of the screen so
            deity faces and the Om symbol remain fully visible.
            ------------------------------------------------------- */}
        <View style={styles.bottomContent}>

          {/* Feature buttons — 2-column grid */}
          <View style={styles.buttonGrid}>
            {FEATURES.map((item) => (
              <TouchableOpacity
                key={item.labelKey}
                style={styles.glassButton}
                onPress={() => navigation.navigate(item.screen)}
                activeOpacity={0.78}
              >
                {/* Local PNG icon — resizeMode="contain" preserves
                    transparency and prevents stretching on any button size */}
                <Image
                  source={item.icon}
                  style={styles.featureIcon}
                  resizeMode="contain"
                />
                <Text style={styles.glassButtonLabel}>{t(item.labelKey)}</Text>
              </TouchableOpacity>
            ))}
          </View>

        </View>

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

  // --- Bottom section — buttons float in the lower quarter ---
  bottomContent: {
    paddingHorizontal: 22,   // matches topBar horizontal rhythm
    paddingBottom: 44,       // generous floor so buttons don't crowd the very edge
    paddingTop: 8,           // small gap between spacer and grid
    alignItems: 'center',
  },

  // --- 2-column flex-wrap button grid ---
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,                  // tighter gap = more composed, less scattered
    width: '100%',
  },

  // Sacred cream-gold floating button
  glassButton: {
    width: '44%',               // ~2 per row with gap
    // Warm ivory — cream with the faintest gold warmth, ~70% opaque
    // so the artwork glows softly through without muddying
    backgroundColor: 'rgba(255, 248, 224, 0.72)',
    borderRadius: 18,
    paddingVertical: 15,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 1,
    // Soft warm-gold border — present but never harsh
    borderColor: 'rgba(200, 150, 40, 0.55)',
    // Amber glow shadow — feels warm, not cold
    shadowColor: '#c8962a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.30,
    shadowRadius: 10,
    elevation: 5,
  },

  // Custom PNG icon — fixed square keeps all icons visually identical
  // resizeMode="contain" (set inline) scales within this box without cropping
  featureIcon: {
    width: 36,
    height: 36,
    marginBottom: 6,
  },

  glassButtonLabel: {
    fontSize: 13,
    fontWeight: '700',
    // Warm dark brown — readable against the cream background
    // and harmonises with the gold border and artwork palette
    color: '#5c3a0e',
    letterSpacing: 0.5,
    textAlign: 'center',
    // Very light warm shadow lifts the text cleanly off the button
    textShadowColor: 'rgba(255, 235, 160, 0.6)',
    textShadowOffset: { width: 0, height: 0.5 },
    textShadowRadius: 2,
  },
});
