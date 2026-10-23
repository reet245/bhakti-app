import useDevotionalStyles from '../hooks/useDevotionalStyles';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Image,
  ImageBackground,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import BhaktiBackButton from '../components/BhaktiBackButton';
import BhaktiBottomNav, { getBhaktiBottomNavContentPadding } from '../components/BhaktiBottomNav';
import { useLanguage } from '../context/LanguageContext';
import { getDailyHoroscopes, unavailableHoroscopes } from '../services/horoscopeService';
import { getPanchangFromAPI } from '../services/panchangService';
import { usePanchangLocation, usePanchangToday } from '../features/panchang/locationStore';
import { dateParts, dateISO } from '../features/panchang/date';

const BG_IMAGE = require('../../assets/horoscope/background/horoscope-bg.png');
const HANGING_BELL_IMAGE = require('../../assets/horoscope/decorations/hanging-bell.png');
const DIYA_IMAGE = require('../../assets/horoscope/decorations/diya.png');
const LOTUS_DIVIDER_IMAGE = require('../../assets/horoscope/decorations/lotus-divider.png');
const NAKSHATRA_IMAGE = require('../../assets/horoscope/decorations/nakshatra.png');
const MOON_SIGN_IMAGE = require('../../assets/horoscope/decorations/moon-sign.png');
const TITHI_IMAGE = require('../../assets/horoscope/decorations/tithi.png');

const ZODIAC_SIGNS = [
  { id: 'aries', englishName: 'Aries', englishRashi: 'Mesh', hindiName: '\u092e\u0947\u0937', dateRange: 'Mar 21 - Apr 19', icon: require('../../assets/horoscope/zodiac/aries.png'), zeroArtwork: require('../../assets/horoscope/zodiac-zero/aries.png') },
  { id: 'taurus', englishName: 'Taurus', englishRashi: 'Vrishabh', hindiName: '\u0935\u0943\u0937\u092d', dateRange: 'Apr 20 - May 20', icon: require('../../assets/horoscope/zodiac/taurus.png'), zeroArtwork: require('../../assets/horoscope/zodiac-zero/taurus.png') },
  { id: 'gemini', englishName: 'Gemini', englishRashi: 'Mithun', hindiName: '\u092e\u093f\u0925\u0941\u0928', dateRange: 'May 21 - Jun 20', icon: require('../../assets/horoscope/zodiac/gemini.png'), zeroArtwork: require('../../assets/horoscope/zodiac-zero/gemini.png') },
  { id: 'cancer', englishName: 'Cancer', englishRashi: 'Kark', hindiName: '\u0915\u0930\u094d\u0915', dateRange: 'Jun 21 - Jul 22', icon: require('../../assets/horoscope/zodiac/cancer.png'), zeroArtwork: require('../../assets/horoscope/zodiac-zero/cancer.png') },
  { id: 'leo', englishName: 'Leo', englishRashi: 'Singh', hindiName: '\u0938\u093f\u0902\u0939', dateRange: 'Jul 23 - Aug 22', icon: require('../../assets/horoscope/zodiac/leo.png'), zeroArtwork: require('../../assets/horoscope/zodiac-zero/leo.png') },
  { id: 'virgo', englishName: 'Virgo', englishRashi: 'Kanya', hindiName: '\u0915\u0928\u094d\u092f\u093e', dateRange: 'Aug 23 - Sep 22', icon: require('../../assets/horoscope/zodiac/virgo.png'), zeroArtwork: require('../../assets/horoscope/zodiac-zero/virgo.png') },
  { id: 'libra', englishName: 'Libra', englishRashi: 'Tula', hindiName: '\u0924\u0941\u0932\u093e', dateRange: 'Sep 23 - Oct 22', icon: require('../../assets/horoscope/zodiac/libra.png'), zeroArtwork: require('../../assets/horoscope/zodiac-zero/libra.png') },
  { id: 'scorpio', englishName: 'Scorpio', englishRashi: 'Vrishchik', hindiName: '\u0935\u0943\u0936\u094d\u091a\u093f\u0915', dateRange: 'Oct 23 - Nov 21', icon: require('../../assets/horoscope/zodiac/scorpio.png'), zeroArtwork: require('../../assets/horoscope/zodiac-zero/scorpio.png') },
  { id: 'sagittarius', englishName: 'Sagittarius', englishRashi: 'Dhanu', hindiName: '\u0927\u0928\u0941', dateRange: 'Nov 22 - Dec 21', icon: require('../../assets/horoscope/zodiac/sagittarius.png'), zeroArtwork: require('../../assets/horoscope/zodiac-zero/sagittarius.png') },
  { id: 'capricorn', englishName: 'Capricorn', englishRashi: 'Makar', hindiName: '\u092e\u0915\u0930', dateRange: 'Dec 22 - Jan 19', icon: require('../../assets/horoscope/zodiac/capricorn.png'), zeroArtwork: require('../../assets/horoscope/zodiac-zero/capricorn.png') },
  { id: 'aquarius', englishName: 'Aquarius', englishRashi: 'Kumbh', hindiName: '\u0915\u0941\u092e\u094d\u092d', dateRange: 'Jan 20 - Feb 18', icon: require('../../assets/horoscope/zodiac/aquarius.png'), zeroArtwork: require('../../assets/horoscope/zodiac-zero/aquarius.png') },
  { id: 'pisces', englishName: 'Pisces', englishRashi: 'Meen', hindiName: '\u092e\u0940\u0928', dateRange: 'Feb 19 - Mar 20', icon: require('../../assets/horoscope/zodiac/pisces.png'), zeroArtwork: require('../../assets/horoscope/zodiac-zero/pisces.png') },
];

const INSIGHT_ITEMS = {
  en: [
    { id: 'love', icon: '\u2665', label: 'Love', value: 'Unavailable' },
    { id: 'career', icon: '\u2609', label: 'Career', value: 'Unavailable' },
    { id: 'health', icon: '\u2726', label: 'Health', value: 'Unavailable' },
  ],
  hi: [
    { id: 'love', icon: '\u2665', label: 'प्रेम', value: 'अनुपलब्ध' },
    { id: 'career', icon: '\u2609', label: 'करियर', value: 'अनुपलब्ध' },
    { id: 'health', icon: '\u2726', label: 'स्वास्थ्य', value: 'अनुपलब्ध' },
  ],
};

const RESULT_LUCKY_ITEMS = {
  en: [
    { id: 'luckyColor', label: 'Lucky Color', value: 'Unavailable' },
    { id: 'luckyNumber', label: 'Lucky Number', value: 'Unavailable' },
    { id: 'auspiciousTime', label: 'Auspicious Time', value: 'Unavailable' },
  ],
  hi: [
    { id: 'luckyColor', label: 'शुभ रंग', value: 'अनुपलब्ध' },
    { id: 'luckyNumber', label: 'शुभ अंक', value: 'अनुपलब्ध' },
    { id: 'auspiciousTime', label: 'शुभ समय', value: 'अनुपलब्ध' },
  ],
};

const RESULT_CARD_TEXT = {
  en: {
    heading: "Today's Horoscope",
    button: 'View Detailed Horoscope',
  },
  hi: {
    heading: '\u0906\u091c \u0915\u093e \u0930\u093e\u0936\u093f\u092b\u0932',
    button: 'विस्तृत राशिफल देखें',
  },
};

const HEADER_BLESSING_TEXT = {
  en: '|| \u0938\u0930\u094d\u0935\u0947 \u092d\u0935\u0928\u094d\u0924\u0941 \u0938\u0941\u0916\u093f\u0928\u0903 \u0938\u0930\u094d\u0935\u0947 \u0938\u0928\u094d\u0924\u0941 \u0928\u093f\u0930\u093e\u092e\u092f\u093e\u0903 ||',
  hi: '|| \u0938\u0930\u094d\u0935\u0947 \u092d\u0935\u0928\u094d\u0924\u0941 \u0938\u0941\u0916\u093f\u0928\u0903 \u0938\u0930\u094d\u0935\u0947 \u0938\u0928\u094d\u0924\u0941 \u0928\u093f\u0930\u093e\u092e\u092f\u093e\u0903 ||',
};

const ZODIAC_SELECTOR_TITLE = "Choose your zodiac sign to read today's guidance";

const HEADER_SPARKLES = [
  { left: 0.18, top: 0.08, size: 3.2, opacity: 0.38 },
  { left: 0.29, top: 0.04, size: 2.4, opacity: 0.28 },
  { left: 0.74, top: 0.07, size: 3.6, opacity: 0.34 },
  { left: 0.84, top: 0.16, size: 2.6, opacity: 0.3 },
  { left: 0.14, top: 0.24, size: 2.8, opacity: 0.27 },
  { left: 0.89, top: 0.31, size: 3, opacity: 0.31 },
  { left: 0.23, top: 0.48, size: 2.2, opacity: 0.24 },
  { left: 0.78, top: 0.47, size: 2.4, opacity: 0.26 },
  { left: 0.1, top: 0.63, size: 3.4, opacity: 0.24 },
  { left: 0.91, top: 0.64, size: 3.2, opacity: 0.23 },
  { left: 0.37, top: 0.28, size: 2, opacity: 0.18 },
  { left: 0.63, top: 0.28, size: 2, opacity: 0.18 },
  { left: 0.07, top: 0.78, size: 2.8, opacity: 0.24 },
  { left: 0.17, top: 0.83, size: 2.2, opacity: 0.2 },
  { left: 0.83, top: 0.82, size: 2.2, opacity: 0.2 },
  { left: 0.93, top: 0.77, size: 2.8, opacity: 0.24 },
  { left: 0.06, top: 0.56, size: 2.4, opacity: 0.23 },
  { left: 0.94, top: 0.56, size: 2.4, opacity: 0.23 },
  { left: 0.28, top: 0.68, size: 2, opacity: 0.18 },
  { left: 0.72, top: 0.68, size: 2, opacity: 0.18 },
];

export default function DailyHoroscopeScreen() {
  const styles = useDevotionalStyles(baseStyles);
  const navigation = useNavigation();
  const { width, height } = useWindowDimensions();
  const { t, currentLanguage } = useLanguage();
  const safeLanguage = currentLanguage === 'hi' ? 'hi' : 'en';
  const [selectedSignId, setSelectedSignId] = useState('aries');
  const [location] = usePanchangLocation();
  const today = usePanchangToday(location.timezone, navigation);
  const dayKey = dateISO(today);
  const [horoscopes, setHoroscopes] = useState(() => unavailableHoroscopes(safeLanguage));
  const [isLoading, setIsLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  const [panchang, setPanchang] = useState(null);
  const unavailable = safeLanguage === 'hi' ? 'अनुपलब्ध' : 'Unavailable';
  const headerPanchangItems = [
    { label: safeLanguage === 'hi' ? 'नक्षत्र' : 'Nakshatra', image: NAKSHATRA_IMAGE, value: panchang?.nakshatra || unavailable },
    { label: safeLanguage === 'hi' ? 'योग' : 'Yoga', image: MOON_SIGN_IMAGE, value: panchang?.yoga || unavailable },
    { label: safeLanguage === 'hi' ? 'तिथि' : 'Tithi', image: TITHI_IMAGE, value: panchang?.tithi || unavailable },
  ];

  useFocusEffect(useCallback(() => {
    const controller = new AbortController();
    let active = true;
    setIsLoading(true);
    setHoroscopes(unavailableHoroscopes(safeLanguage));
    getDailyHoroscopes(safeLanguage, { signal: controller.signal })
      .then((data) => { if (active) setHoroscopes(data); })
      .catch(() => { if (active) setHoroscopes(unavailableHoroscopes(safeLanguage)); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; controller.abort(); };
  }, [safeLanguage, dayKey, retry]));

  useFocusEffect(useCallback(() => {
    const controller = new AbortController();
    let active = true;
    setPanchang(null);
    getPanchangFromAPI({ ...dateParts(today), ...location, signal: controller.signal })
      .then((data) => { if (active) setPanchang(data); })
      .catch(() => { if (active) setPanchang(null); });
    return () => { active = false; controller.abort(); };
  }, [dayKey, location, retry]));
  const selectedSignScale = useRef(new Animated.Value(1)).current;
  const sparkleBreath = useRef(new Animated.Value(0)).current;

  const selectedSign = useMemo(
    () => ZODIAC_SIGNS.find((sign) => sign.id === selectedSignId) ?? ZODIAC_SIGNS[0],
    [selectedSignId],
  );
  const selectedName = selectedSign.englishName;
  const formattedDate = useMemo(() => (
    new Intl.DateTimeFormat(safeLanguage === 'hi' ? 'hi-IN' : 'en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(today)
  ), [safeLanguage, dayKey]);
  const formattedWeekday = useMemo(() => (
    new Intl.DateTimeFormat(safeLanguage === 'hi' ? 'hi-IN' : 'en-GB', {
      weekday: 'long',
    }).format(today)
  ), [safeLanguage, dayKey]);
  const responsiveStyles = useMemo(() => {
    const compactWidth = Math.min(width, 520);
    const contentWidth = Math.min(width - 32, 620);
    const selectorInnerWidth = Math.max(260, contentWidth - 24);
    const bellWidth = Math.max(46, Math.min(68, compactWidth * 0.145));
    const bellHeight = bellWidth * 2.34;
    const diyaWidth = compactWidth * 0.136;
    const panchangIconSize = Math.max(20, Math.min(28, compactWidth * 0.058));
    const headerMinHeight = Math.max(232, Math.min(292, height * 0.315));
    const sparkleAreaHeight = Math.max(150, Math.min(220, headerMinHeight * 0.76));
    const zodiacCircleSize = Math.max(54, Math.min(70, (selectorInnerWidth / 4) * 0.8));
    const zodiacIconSize = zodiacCircleSize * 1.08;
    const zodiacTitleLineWidth = Math.min(width * 0.1, 42);
    const zodiacTitleLineHeight = zodiacTitleLineWidth * 0.18;
    const previewCardHeight = Math.max(178, Math.min(204, contentWidth * 0.49));
    const previewContentPadding = Math.max(9, Math.min(12, contentWidth * 0.024));
    const insightCardMinHeight = Math.max(38, Math.min(44, previewCardHeight * 0.23));
    const luckyCardMinHeight = Math.max(34, Math.min(40, previewCardHeight * 0.2));

    return {
      content: {
        paddingTop: height * 0.012,
        paddingBottom: getBhaktiBottomNavContentPadding(height, 24),
      },
      headerCard: {
        paddingHorizontal: compactWidth * 0.05,
        paddingTop: Math.max(58, height * 0.078),
        paddingBottom: height * 0.012,
        minHeight: headerMinHeight,
      },
      headerBell: {
        width: bellWidth,
        height: bellHeight,
      },
      leftBellTop: {
        left: -4,
        top: 0,
      },
      leftBellLower: {
        left: Math.max(6, compactWidth * 0.02),
        top: Math.max(34, compactWidth * 0.09),
      },
      rightBellTop: {
        right: -4,
        top: 0,
      },
      rightBellLower: {
        right: Math.max(6, compactWidth * 0.02),
        top: Math.max(34, compactWidth * 0.09),
      },
      headerDiya: {
        width: diyaWidth,
        height: compactWidth * 0.11,
      },
      headerDiyaLeft: {
        left: compactWidth * 0.028,
      },
      headerDiyaRight: {
        right: compactWidth * 0.028,
      },
      headerCenter: {
        width: contentWidth,
        maxWidth: 620,
        paddingHorizontal: compactWidth * 0.04,
      },
      title: {
        fontSize: Math.max(24, Math.min(34, compactWidth * 0.071)),
        lineHeight: Math.max(30, Math.min(42, compactWidth * 0.087)),
      },
      dateText: {
        fontSize: Math.max(11, Math.min(15, compactWidth * 0.031)),
        lineHeight: Math.max(15, Math.min(19, compactWidth * 0.04)),
      },
      dateRow: {
        marginTop: height * 0.004,
      },
      panchangPill: {
        minHeight: Math.max(28, height * 0.036),
        paddingHorizontal: compactWidth * 0.034,
        marginTop: height * 0.008,
      },
      panchangPillText: {
        fontSize: Math.max(11, Math.min(14, compactWidth * 0.03)),
      },
      headerInfoRow: {
        marginTop: height * 0.009,
        maxWidth: Math.min(560, compactWidth * 0.98),
        columnGap: Math.max(4, compactWidth * 0.01),
        rowGap: Math.max(6, height * 0.006),
        flexWrap: 'nowrap',
      },
      headerInfoColumn: {
        minHeight: Math.max(50, height * 0.058),
        paddingHorizontal: Math.max(1, compactWidth * 0.004),
        flexBasis: 0,
      },
      panchangSticker: {
        width: panchangIconSize,
        height: panchangIconSize,
        marginRight: Math.max(3, compactWidth * 0.008),
      },
      panchangStickerText: {
        fontSize: Math.max(9, panchangIconSize * 0.38),
      },
      headerInfoLabel: {
        fontSize: Math.max(7.5, Math.min(11, compactWidth * 0.023)),
        lineHeight: Math.max(10.5, Math.min(14, compactWidth * 0.029)),
      },
      headerInfoValue: {
        fontSize: Math.max(9, Math.min(13, compactWidth * 0.028)),
        lineHeight: Math.max(12, Math.min(16, compactWidth * 0.034)),
      },
      headerBlessing: {
        fontSize: Math.max(11, Math.min(14, compactWidth * 0.028)),
        marginTop: height * 0.007,
      },
      lotusDividerWrap: {
        marginTop: height * 0.004,
        width: Math.max(190, Math.min(330, compactWidth * 0.68)),
        columnGap: Math.max(5, compactWidth * 0.012),
      },
      lotusDivider: {
        width: Math.max(34, Math.min(48, compactWidth * 0.092)),
        height: Math.max(18, Math.min(25, compactWidth * 0.048)),
      },
      selectorCard: {
        marginTop: height * 0.006,
      },
      zodiacTitleLine: {
        width: Math.max(18, zodiacTitleLineWidth),
        height: Math.max(2, zodiacTitleLineHeight),
        marginHorizontal: Math.max(3, compactWidth * 0.008),
      },
      sectionHeading: {
        fontSize: Math.max(10, Math.min(13, compactWidth * 0.028)),
        lineHeight: Math.max(13, Math.min(17, compactWidth * 0.036)),
      },
      signGrid: {
        rowGap: Math.max(10, compactWidth * 0.027),
      },
      signCircleShell: {
        width: zodiacCircleSize,
        height: zodiacCircleSize,
        borderRadius: zodiacCircleSize / 2,
      },
      signCircle: {
        borderRadius: zodiacCircleSize / 2,
        paddingHorizontal: Math.max(3, zodiacCircleSize * 0.045),
        paddingBottom: Math.max(6, zodiacCircleSize * 0.088),
      },
      signIcon: {
        width: zodiacIconSize,
        height: zodiacIconSize,
        top: -zodiacCircleSize * 0.1,
      },
      signName: {
        fontSize: Math.max(7.5, Math.min(9.5, zodiacCircleSize * 0.13)),
        lineHeight: Math.max(9.5, Math.min(11.5, zodiacCircleSize * 0.155)),
      },
      signSubName: {
        fontSize: Math.max(6, Math.min(7.5, zodiacCircleSize * 0.095)),
        lineHeight: Math.max(7.5, Math.min(9.5, zodiacCircleSize * 0.12)),
      },
      sparkleField: {
        height: sparkleAreaHeight,
      },
      sparkles: HEADER_SPARKLES.map((sparkle) => ({
        left: compactWidth * sparkle.left,
        top: sparkleAreaHeight * sparkle.top,
        width: Math.max(2, compactWidth * 0.006 * sparkle.size),
        height: Math.max(2, compactWidth * 0.006 * sparkle.size),
        borderRadius: Math.max(1, compactWidth * 0.003 * sparkle.size),
        opacity: sparkle.opacity,
      })),
      overviewCard: {
        height: previewCardHeight,
        borderRadius: Math.max(24, Math.min(32, contentWidth * 0.052)),
      },
      resultDashboard: {
        flexDirection: 'row',
        alignItems: 'stretch',
        height: '100%',
      },
      overviewTop: {
        marginBottom: Math.max(4, Math.min(7, contentWidth * 0.012)),
      },
      resultArtworkColumn: {
        flexBasis: '42%',
        maxWidth: '43%',
        height: '100%',
      },
      largeZodiacAura: {
        width: '100%',
        height: '100%',
      },
      largeZodiacGlow: {
        display: 'none',
      },
      largeZodiacIcon: {
        width: '100%',
        height: '100%',
      },
      overviewCopy: {
        minHeight: undefined,
      },
      overviewEyebrow: {
        fontSize: Math.max(8, Math.min(10, contentWidth * 0.021)),
      },
      overviewTitle: {
        fontSize: Math.max(19, Math.min(26, contentWidth * 0.049)),
        lineHeight: Math.max(23, Math.min(30, contentWidth * 0.058)),
      },
      overviewSubtitle: {
        fontSize: Math.max(10, Math.min(13, contentWidth * 0.025)),
      },
      resultContentColumn: {
        paddingVertical: previewContentPadding,
        paddingHorizontal: previewContentPadding,
      },
      insightCard: {
        minHeight: insightCardMinHeight,
      },
      luckyMiniCard: {
        minHeight: luckyCardMinHeight,
      },
      detailButton: {
        minHeight: Math.max(32, Math.min(36, contentWidth * 0.07)),
      },
    };
  }, [height, width]);

  useEffect(() => {
    selectedSignScale.setValue(0.98);
    Animated.spring(selectedSignScale, {
      toValue: 1.06,
      friction: 6,
      tension: 90,
      useNativeDriver: true,
    }).start();
  }, [selectedSignId, selectedSignScale]);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(sparkleBreath, {
          toValue: 1,
          duration: 2600,
          useNativeDriver: true,
        }),
        Animated.timing(sparkleBreath, {
          toValue: 0,
          duration: 3200,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [sparkleBreath]);

  const sparkleOpacity = sparkleBreath.interpolate({
    inputRange: [0, 1],
    outputRange: [0.45, 1],
  });

  return (
    <ImageBackground source={BG_IMAGE} style={styles.background} resizeMode="cover">
      <View style={styles.overlay} />

      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, responsiveStyles.content]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.headerCard, responsiveStyles.headerCard]}>
          <View pointerEvents="none" style={[styles.sparkleField, responsiveStyles.sparkleField]}>
            {responsiveStyles.sparkles.map((sparkleStyle, index) => (
              <Animated.View
                key={`header-sparkle-${index}`}
                style={[
                  styles.headerSparkle,
                  sparkleStyle,
                  {
                    opacity: sparkleOpacity.interpolate({
                      inputRange: [0, 1],
                      outputRange: [sparkleStyle.opacity * 0.72, sparkleStyle.opacity],
                    }),
                    transform: [
                      {
                        scale: sparkleBreath.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.82 + (index % 3) * 0.04, 1 + (index % 2) * 0.08],
                        }),
                      },
                    ],
                  },
                ]}
              />
            ))}
          </View>
          <Image source={HANGING_BELL_IMAGE} style={[styles.headerBell, responsiveStyles.headerBell, styles.leftBellTop, responsiveStyles.leftBellTop]} resizeMode="contain" />
          <Image source={HANGING_BELL_IMAGE} style={[styles.headerBell, responsiveStyles.headerBell, styles.leftBellLower, responsiveStyles.leftBellLower]} resizeMode="contain" />
          <Image source={HANGING_BELL_IMAGE} style={[styles.headerBell, responsiveStyles.headerBell, styles.rightBellTop, responsiveStyles.rightBellTop]} resizeMode="contain" />
          <Image source={HANGING_BELL_IMAGE} style={[styles.headerBell, responsiveStyles.headerBell, styles.rightBellLower, responsiveStyles.rightBellLower]} resizeMode="contain" />
          <Image source={DIYA_IMAGE} style={[styles.headerDiya, responsiveStyles.headerDiya, styles.headerDiyaLeft, responsiveStyles.headerDiyaLeft]} resizeMode="contain" />
          <Image source={DIYA_IMAGE} style={[styles.headerDiya, responsiveStyles.headerDiya, styles.headerDiyaRight, responsiveStyles.headerDiyaRight]} resizeMode="contain" />
          <BhaktiBackButton
            accessibilityLabel={t('back')}
            navigation={navigation}
            style={styles.backButton}
          />
          <View style={[styles.headerCenter, responsiveStyles.headerCenter]}>
            <Text style={[styles.title, responsiveStyles.title]}>{t('dailyHoroscope')}</Text>
            <View style={[styles.dateRow, responsiveStyles.dateRow]}>
              <Text style={[styles.dateText, responsiveStyles.dateText]}>{`${formattedDate} | ${formattedWeekday}`}</Text>
            </View>
            <View style={[styles.panchangPill, responsiveStyles.panchangPill]}>
              <View style={styles.panchangDot} />
              <Text style={[styles.panchangPillText, responsiveStyles.panchangPillText]}>{`${safeLanguage === 'hi' ? 'पंचांग' : 'Panchang'}: ${panchang?.paksha || unavailable}`}</Text>
              <View style={styles.panchangDot} />
            </View>
            <View style={[styles.headerInfoRow, responsiveStyles.headerInfoRow]}>
              {headerPanchangItems.map((item) => (
                <View key={item.label} style={[styles.headerInfoColumn, responsiveStyles.headerInfoColumn]}>
                  <View style={[styles.panchangSticker, responsiveStyles.panchangSticker]}>
                    {item.image ? (
                      <Image source={item.image} style={styles.panchangStickerImage} resizeMode="contain" />
                    ) : (
                      <Text style={[styles.panchangStickerText, responsiveStyles.panchangStickerText]}>{item.icon}</Text>
                    )}
                  </View>
                  <View style={styles.headerInfoTextWrap}>
                    <Text
                      style={[styles.headerInfoLabel, responsiveStyles.headerInfoLabel]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.84}
                    >
                      {item.label}
                    </Text>
                    <Text style={[styles.headerInfoValue, responsiveStyles.headerInfoValue]} numberOfLines={2}>
                      {item.value}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
            <TouchableOpacity accessibilityRole="button" onPress={() => navigation.navigate('Calendar')}><Text style={[styles.headerInfoValue, { textAlign: 'center' }]}>{location.locationName}</Text></TouchableOpacity>
            <Text style={[styles.headerBlessing, responsiveStyles.headerBlessing]}>{HEADER_BLESSING_TEXT[safeLanguage]}</Text>
            <View style={[styles.lotusDividerWrap, responsiveStyles.lotusDividerWrap]}>
              <View style={[styles.lotusLineGroup, styles.lotusLineGroupLeft]}>
                <View style={[styles.lotusLine, styles.lotusLineMain]} />
                <View style={[styles.lotusLine, styles.lotusLineSoft]} />
              </View>
              <Image source={LOTUS_DIVIDER_IMAGE} style={[styles.lotusDivider, responsiveStyles.lotusDivider]} resizeMode="contain" />
              <View style={[styles.lotusLineGroup, styles.lotusLineGroupRight]}>
                <View style={[styles.lotusLine, styles.lotusLineMain]} />
                <View style={[styles.lotusLine, styles.lotusLineSoft]} />
              </View>
            </View>
          </View>
        </View>

        <View style={[styles.selectorCard, responsiveStyles.selectorCard]}>
          <View style={styles.selectorCornerGlowLeft} />
          <View style={styles.selectorCornerGlowRight} />
          <View style={styles.sectionHeadingRow}>
            <View style={[styles.zodiacTitleLineWrap, responsiveStyles.zodiacTitleLine]}>
              <View style={[styles.zodiacTitleLine, styles.zodiacTitleLineStrong]} />
              <View style={[styles.zodiacTitleLine, styles.zodiacTitleLineSoft]} />
            </View>
            <Text
              style={[styles.sectionHeading, responsiveStyles.sectionHeading]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
            >
              {safeLanguage === 'hi' ? 'आज का राशिफल पढ़ने के लिए अपनी राशि चुनें' : ZODIAC_SELECTOR_TITLE}
            </Text>
            <View style={[styles.zodiacTitleLineWrap, responsiveStyles.zodiacTitleLine]}>
              <View style={[styles.zodiacTitleLine, styles.zodiacTitleLineStrong]} />
              <View style={[styles.zodiacTitleLine, styles.zodiacTitleLineSoft]} />
            </View>
          </View>
          <View style={[styles.signGrid, responsiveStyles.signGrid]}>
            {ZODIAC_SIGNS.map((sign) => {
              const isSelected = selectedSign.id === sign.id;
              const primaryName = sign.englishName;
              const secondaryName = sign.hindiName;

              return (
                <TouchableOpacity
                  key={sign.id}
                  style={styles.signButton}
                  onPress={() => setSelectedSignId(sign.id)}
                  activeOpacity={0.78}
                >
                  <Animated.View
                    style={[
                      styles.signCircleShell,
                      responsiveStyles.signCircleShell,
                      isSelected && styles.signCircleShellSelected,
                      isSelected && { transform: [{ scale: selectedSignScale }] },
                    ]}
                  >
                    {isSelected && <View pointerEvents="none" style={styles.signSelectedHalo} />}
                    <View style={[styles.signCircle, responsiveStyles.signCircle, isSelected && styles.signCircleSelected]}>
                      <SafeZodiacImage source={sign.icon} fallback={primaryName.slice(0, 1)} style={[styles.signIcon, responsiveStyles.signIcon]} />
                      <View style={styles.signLabelStack}>
                        <Text style={[styles.signName, responsiveStyles.signName, isSelected && styles.signNameSelected]} numberOfLines={1}>
                          {primaryName}
                        </Text>
                        <Text style={[styles.signSubName, responsiveStyles.signSubName]} numberOfLines={1}>
                          {secondaryName}
                        </Text>
                      </View>
                    </View>
                  </Animated.View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={[styles.overviewCard, responsiveStyles.overviewCard]}>
          <View style={styles.overviewInnerGlow} />
          <View style={[styles.resultDashboard, responsiveStyles.resultDashboard]}>
            <View style={[styles.resultArtworkColumn, responsiveStyles.resultArtworkColumn]}>
              <View style={[styles.largeZodiacAura, responsiveStyles.largeZodiacAura]}>
                <View style={[styles.largeZodiacGlow, responsiveStyles.largeZodiacGlow]} />
                <SafeZodiacImage
                  source={selectedSign.zeroArtwork}
                  fallback={selectedName.slice(0, 1)}
                  style={[styles.largeZodiacIcon, responsiveStyles.largeZodiacIcon]}
                  resizeMode="cover"
                />
              </View>
            </View>

            <View style={[styles.resultContentColumn, responsiveStyles.resultContentColumn]}>
              <View style={[styles.overviewTop, responsiveStyles.overviewTop]}>
                <View style={[styles.overviewCopy, responsiveStyles.overviewCopy]}>
                  <Text style={[styles.overviewEyebrow, responsiveStyles.overviewEyebrow]}>{RESULT_CARD_TEXT[safeLanguage].heading}</Text>
                  <View style={styles.nameRow}>
                    <Text style={[styles.overviewTitle, responsiveStyles.overviewTitle]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.76}>
                      {selectedName}
                    </Text>
                    <Text style={[styles.nameDivider, responsiveStyles.overviewSubtitle]}>/</Text>
                    <Text style={[styles.overviewSubtitle, responsiveStyles.overviewSubtitle]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.78}>
                      {selectedSign.englishRashi}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.insightGrid}>
                {INSIGHT_ITEMS[safeLanguage].map((item) => (
                  <View key={item.id} style={[styles.insightCard, responsiveStyles.insightCard]}>
                    <Text style={styles.insightIcon}>{item.icon}</Text>
                    <Text style={styles.insightLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}>
                      {item.label}
                    </Text>
                    <Text style={styles.insightValue} numberOfLines={2}>{item.value}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.luckyMiniGrid}>
                {RESULT_LUCKY_ITEMS[safeLanguage].map((item) => (
                  <View key={item.id} style={[styles.luckyMiniCard, responsiveStyles.luckyMiniCard]}>
                    <Text style={styles.luckyMiniLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.68}>
                      {item.label}
                    </Text>
                    <Text style={styles.luckyMiniValue} numberOfLines={2}>{item.value}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.detailButton, responsiveStyles.detailButton]}
                activeOpacity={0.82}
                onPress={() => navigation.navigate('HoroscopeDetail', { signId: selectedSign.id })}
              >
                <Text style={styles.detailButtonText}>{RESULT_CARD_TEXT[safeLanguage].button}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <View style={styles.luckyPanel}>
          <Text style={styles.panelTitle}>{safeLanguage === 'hi' ? `${selectedSign.hindiName} राशिफल` : `${selectedName} guidance`}</Text>
          <Text style={styles.horoscopePreview}>{isLoading ? t('loading') : horoscopes[selectedSignId]?.horoscope}</Text>
          {!!horoscopes[selectedSignId]?.date && <Text style={styles.providerNote}>{`${safeLanguage === 'hi' ? 'स्रोत की तारीख' : 'Provider date'}: ${horoscopes[selectedSignId].date}`}</Text>}
          <Text style={styles.providerNote}>{safeLanguage === 'hi' ? 'स्रोत प्रेम, करियर, स्वास्थ्य, शुभ रंग, अंक या शुभ समय के अलग परिणाम नहीं देता है।' : 'The source does not supply separate love, career, health, lucky color, number or auspicious time results.'}</Text>
          <TouchableOpacity style={styles.detailButton} onPress={() => setRetry((value) => value + 1)} disabled={isLoading}>
            <Text style={styles.detailButtonText}>{safeLanguage === 'hi' ? 'फिर से लोड करें' : 'Refresh'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <BhaktiBottomNav activeTab="Horoscope" navigation={navigation} />
    </ImageBackground>
  );
}

function SafeZodiacImage({ source, fallback, style, resizeMode = 'contain' }) {
  const styles = useDevotionalStyles(baseStyles);
  if (!source) {
    return <Text style={styles.imageFallback}>{fallback}</Text>;
  }

  return <Image source={source} style={style} resizeMode={resizeMode} />;
}

const baseStyles = StyleSheet.create({
  horoscopePreview: { color: '#4D3218', fontSize: 15, lineHeight: 24 },
  providerNote: { color: '#76501F', fontSize: 12, lineHeight: 18, marginTop: 10 },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#FFF7E6',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 247, 228, 0.68)',
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  headerCard: {
    backgroundColor: 'transparent',
    borderRadius: 0,
    borderWidth: 0,
    borderColor: 'transparent',
    paddingHorizontal: 18,
    paddingTop: 54,
    paddingBottom: 10,
    shadowOpacity: 0,
    elevation: 0,
    width: '100%',
    overflow: 'visible',
  },
  sparkleField: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    overflow: 'visible',
  },
  headerSparkle: {
    position: 'absolute',
    backgroundColor: '#F5C85A',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 238, 164, 0.7)',
    shadowColor: '#FFD875',
    shadowOpacity: 0.42,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    elevation: 1,
  },
  headerBell: {
    position: 'absolute',
    opacity: 0.58,
    zIndex: 2,
    backgroundColor: 'transparent',
    resizeMode: 'contain',
  },
  leftBellTop: {
    left: -4,
    top: -14,
  },
  leftBellLower: {
    left: 0,
    top: 4,
  },
  rightBellTop: {
    right: -4,
    top: -14,
    transform: [{ scaleX: -1 }],
  },
  rightBellLower: {
    right: 0,
    top: 4,
    transform: [{ scaleX: -1 }],
  },
  headerDiya: {
    position: 'absolute',
    bottom: 0,
    opacity: 0.86,
    zIndex: 2,
    shadowColor: '#D89420',
    shadowOpacity: 0.28,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  headerDiyaLeft: {
    left: 14,
  },
  headerDiyaRight: {
    right: 14,
    transform: [{ scaleX: -1 }],
  },
  backButton: {
    position: 'absolute',
    top: 14,
    left: 14,
    zIndex: 6,
  },
  headerCenter: {
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: 22,
    zIndex: 4,
  },
  title: {
    color: '#3F2713',
    fontSize: 28,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0,
    textShadowColor: 'rgba(184, 121, 24, 0.16)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  dateText: {
    color: '#795425',
    fontSize: 12,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    fontWeight: '800',
    textAlign: 'center',
    flexShrink: 0,
  },
  panchangPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 30,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 248, 232, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(216, 177, 92, 0.62)',
    paddingHorizontal: 12,
    marginTop: 6,
  },
  panchangPillText: {
    color: '#855915',
    fontSize: 12,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    fontWeight: '900',
    textAlign: 'center',
  },
  panchangDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#C88B20',
    marginHorizontal: 8,
  },
  headerInfoRow: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    columnGap: 4,
    marginTop: 7,
  },
  headerInfoColumn: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
    minHeight: 38,
    paddingHorizontal: 3,
  },
  panchangSticker: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  },
  panchangStickerImage: {
    width: '90%',
    height: '90%',
  },
  panchangStickerText: {
    color: '#B87918',
    fontWeight: '900',
  },
  headerInfoTextWrap: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    alignSelf: 'stretch',
    justifyContent: 'flex-start',
  },
  headerInfoLabel: {
    color: '#8A6425',
    fontSize: 10,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    fontWeight: '800',
    textAlign: 'left',
    lineHeight: 12,
  },
  headerInfoValue: {
    color: '#4A2E14',
    fontSize: 13,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    fontWeight: '900',
    textAlign: 'left',
    lineHeight: 15,
    marginTop: 2,
  },
  headerBlessing: {
    color: '#9A5F0C',
    fontSize: 12,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    fontWeight: '900',
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 17,
  },
  lotusDividerWrap: {
    width: '72%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  lotusLineGroup: {
    flex: 1,
    minWidth: 0,
    height: 8,
    justifyContent: 'center',
  },
  lotusLineGroupLeft: {
    alignItems: 'flex-end',
  },
  lotusLineGroupRight: {
    alignItems: 'flex-start',
  },
  lotusLine: {
    height: 1.2,
    borderRadius: 1,
    backgroundColor: 'rgba(184, 121, 24, 0.3)',
  },
  lotusLineMain: {
    width: '100%',
  },
  lotusLineSoft: {
    width: '66%',
    marginTop: 2,
    opacity: 0.45,
  },
  lotusDivider: {
    width: 30,
    height: 15,
    marginHorizontal: 8,
    opacity: 0.78,
  },
  selectorCard: {
    marginTop: 5,
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 250, 239, 0.96)',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(216, 177, 92, 0.46)',
    shadowColor: '#8A5A12',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
    overflow: 'hidden',
  },
  selectorCornerGlowLeft: {
    position: 'absolute',
    top: -42,
    left: -34,
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: 'rgba(239, 216, 168, 0.16)',
  },
  selectorCornerGlowRight: {
    position: 'absolute',
    bottom: -46,
    right: -34,
    width: 122,
    height: 122,
    borderRadius: 61,
    backgroundColor: 'rgba(255, 248, 232, 0.18)',
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
    zIndex: 1,
  },
  zodiacTitleLineWrap: {
    justifyContent: 'center',
    flexShrink: 1,
    backgroundColor: 'transparent',
  },
  zodiacTitleLine: {
    height: 1,
    borderRadius: 1,
    backgroundColor: 'rgba(184, 121, 24, 0.34)',
  },
  zodiacTitleLineStrong: {
    width: '100%',
  },
  zodiacTitleLineSoft: {
    width: '58%',
    marginTop: 2,
    alignSelf: 'center',
    opacity: 0.45,
  },
  sectionHeading: {
    color: '#5C3A0E',
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 17,
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    maxWidth: '82%',
  },
  signGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 14,
    zIndex: 1,
  },
  signButton: {
    width: '25%',
    alignItems: 'center',
  },
  signCircleShell: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(255, 250, 230, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(192, 145, 54, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#B8860B',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    overflow: 'visible',
  },
  signCircleShellSelected: {
    backgroundColor: 'rgba(239, 212, 135, 0.9)',
    borderColor: 'rgba(201, 148, 22, 0.68)',
    borderWidth: 2,
    shadowColor: '#B87918',
    shadowOpacity: 0.24,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  signSelectedHalo: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
    backgroundColor: 'rgba(239, 216, 168, 0.22)',
    borderWidth: 2,
    borderColor: 'rgba(216, 177, 92, 0.38)',
    transform: [{ scale: 1.16 }],
  },
  signCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 38,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 5,
    paddingBottom: 6,
    position: 'relative',
    overflow: 'hidden',
  },
  signCircleSelected: {
    backgroundColor: 'rgba(255, 248, 232, 0.28)',
  },
  signIcon: {
    width: 34,
    height: 34,
    position: 'absolute',
    alignSelf: 'center',
    transform: [{ scale: 1.1 }],
  },
  signLabelStack: {
    width: '100%',
    alignItems: 'center',
    zIndex: 2,
  },
  signName: {
    color: '#4B2E16',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 12,
    width: '100%',
  },
  signNameSelected: {
    color: '#3F2713',
  },
  signSubName: {
    color: '#7A5520',
    fontSize: 8,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 10,
    width: '100%',
  },
  overviewCard: {
    marginTop: 12,
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 250, 239, 0.96)',
    borderRadius: 26,
    padding: 0,
    borderWidth: 1,
    borderColor: 'rgba(216, 177, 92, 0.46)',
    shadowColor: '#8A5A12',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
    overflow: 'hidden',
  },
  overviewInnerGlow: {
    position: 'absolute',
    top: -52,
    right: -40,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(239, 216, 168, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(216, 177, 92, 0.12)',
  },
  resultDashboard: {
    flexDirection: 'row',
    alignItems: 'stretch',
    height: '100%',
    zIndex: 1,
  },
  resultArtworkColumn: {
    flexBasis: '42%',
    maxWidth: '43%',
    height: '100%',
    backgroundColor: 'rgba(255, 247, 227, 0.74)',
    alignItems: 'stretch',
    justifyContent: 'stretch',
    alignSelf: 'stretch',
    overflow: 'hidden',
  },
  resultContentColumn: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    zIndex: 2,
  },
  overviewTop: {
    position: 'relative',
    justifyContent: 'flex-start',
    marginBottom: 10,
    zIndex: 2,
  },
  largeZodiacAura: {
    width: '100%',
    height: '100%',
    borderRadius: 0,
    alignItems: 'stretch',
    justifyContent: 'stretch',
    overflow: 'hidden',
  },
  largeZodiacGlow: {
    position: 'absolute',
    width: 126,
    height: 126,
    borderRadius: 63,
    backgroundColor: 'rgba(255, 222, 131, 0.36)',
    borderWidth: 1,
    borderColor: 'rgba(184, 121, 24, 0.14)',
    shadowColor: '#E3A72E',
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  largeZodiacWrap: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: 'rgba(255, 248, 232, 0.98)',
    borderWidth: 2,
    borderColor: '#D9A83F',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#B87918',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  largeZodiacIcon: {
    width: '100%',
    height: '100%',
  },
  overviewCopy: {
    flex: 1,
    zIndex: 1,
    justifyContent: 'flex-start',
    minWidth: 0,
  },
  overviewEyebrow: {
    color: '#B47A18',
    fontSize: 10,
    fontWeight: '900',
    marginBottom: 1,
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  overviewTitle: {
    color: '#3F2713',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 0,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    columnGap: 6,
  },
  nameDivider: {
    color: '#A36A12',
    fontSize: 15,
    fontWeight: '900',
  },
  overviewSubtitle: {
    color: '#8A6425',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 0,
    marginBottom: 0,
  },
  insightGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    columnGap: 5,
    zIndex: 2,
  },
  insightCard: {
    flex: 1,
    minWidth: 0,
    minHeight: 40,
    backgroundColor: 'rgba(255, 250, 239, 0.86)',
    borderRadius: 11,
    borderWidth: 1,
    borderColor: 'rgba(216, 177, 92, 0.32)',
    paddingVertical: 5,
    paddingHorizontal: 5,
    shadowColor: '#8A6425',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  insightIcon: {
    color: '#B87918',
    fontSize: 10,
    fontWeight: '900',
    lineHeight: 11,
    marginBottom: 1,
  },
  insightLabel: {
    color: '#A36A12',
    fontSize: 9,
    fontWeight: '900',
    marginBottom: 1,
  },
  insightValue: {
    color: '#4D3218',
    fontSize: 8,
    fontWeight: '800',
    lineHeight: 10,
  },
  luckyMiniGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    columnGap: 5,
    marginTop: 5,
    zIndex: 2,
  },
  luckyMiniCard: {
    flex: 1,
    minWidth: 0,
    minHeight: 36,
    backgroundColor: 'rgba(255, 247, 227, 0.84)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(216, 177, 92, 0.3)',
    paddingVertical: 5,
    paddingHorizontal: 5,
    justifyContent: 'center',
  },
  luckyMiniLabel: {
    color: '#A36A12',
    fontSize: 8,
    fontWeight: '900',
    marginBottom: 1,
  },
  luckyMiniValue: {
    color: '#3F2713',
    fontSize: 9,
    fontWeight: '900',
    lineHeight: 11,
  },
  detailButton: {
    minHeight: 34,
    borderRadius: 999,
    backgroundColor: '#C9911E',
    borderWidth: 1,
    borderColor: '#F0C96C',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 7,
    paddingHorizontal: 20,
    paddingVertical: 8,
    shadowColor: '#A86913',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
    zIndex: 1,
  },
  detailButtonText: {
    color: '#FFF8E8',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  scoreGrid: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
    marginTop: 16,
  },
  scoreCard: {
    width: '31.5%',
    minHeight: 96,
    backgroundColor: 'rgba(255, 250, 239, 0.96)',
    borderRadius: 20,
    paddingVertical: 11,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(216, 177, 92, 0.68)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7A552A',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  scoreIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFF2C6',
    borderWidth: 1,
    borderColor: '#D9A83F',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#B87918',
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  scoreIconText: {
    color: '#8A520B',
    fontSize: 12,
    fontWeight: '900',
  },
  scoreLabel: {
    color: '#76501F',
    fontSize: 11,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 14,
  },
  scoreValue: {
    color: '#3F2713',
    fontSize: 19,
    fontWeight: '900',
    marginTop: 4,
  },
  luckyPanel: {
    marginTop: 16,
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 250, 239, 0.96)',
    borderRadius: 26,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(184, 121, 24, 0.3)',
    shadowColor: '#7A552A',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  panelTitle: {
    color: '#4B2E16',
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 12,
  },
  luckyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  luckyCard: {
    width: '48.5%',
    minHeight: 76,
    backgroundColor: 'rgba(255, 248, 232, 0.9)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(216, 177, 92, 0.58)',
    padding: 12,
    justifyContent: 'center',
    shadowColor: '#8A6A3F',
    shadowOpacity: 0.08,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  luckyLabel: {
    color: '#A56B16',
    fontSize: 11,
    fontWeight: '900',
    marginBottom: 5,
  },
  luckyValue: {
    color: '#3F2713',
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 19,
  },
  imageFallback: {
    color: '#4B2E16',
    fontSize: 22,
    fontWeight: '900',
  },
});
