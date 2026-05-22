import { useEffect, useMemo, useState } from 'react';
import {
  Image,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

import { useLanguage } from '../context/LanguageContext';
import { getDailyHoroscopes } from '../services/horoscopeService';

const BG_IMAGE = require('../../assets/horoscope/background/horoscope-bg.png');

const ZODIAC_SIGNS = [
  { id: 'aries', englishName: 'Aries', englishRashi: 'Mesh', zeroArtwork: require('../../assets/horoscope/zodiac-zero/aries.png') },
  { id: 'taurus', englishName: 'Taurus', englishRashi: 'Vrishabh', zeroArtwork: require('../../assets/horoscope/zodiac-zero/taurus.png') },
  { id: 'gemini', englishName: 'Gemini', englishRashi: 'Mithun', zeroArtwork: require('../../assets/horoscope/zodiac-zero/gemini.png') },
  { id: 'cancer', englishName: 'Cancer', englishRashi: 'Kark', zeroArtwork: require('../../assets/horoscope/zodiac-zero/cancer.png') },
  { id: 'leo', englishName: 'Leo', englishRashi: 'Singh', zeroArtwork: require('../../assets/horoscope/zodiac-zero/leo.png') },
  { id: 'virgo', englishName: 'Virgo', englishRashi: 'Kanya', zeroArtwork: require('../../assets/horoscope/zodiac-zero/virgo.png') },
  { id: 'libra', englishName: 'Libra', englishRashi: 'Tula', zeroArtwork: require('../../assets/horoscope/zodiac-zero/libra.png') },
  { id: 'scorpio', englishName: 'Scorpio', englishRashi: 'Vrishchik', zeroArtwork: require('../../assets/horoscope/zodiac-zero/scorpio.png') },
  { id: 'sagittarius', englishName: 'Sagittarius', englishRashi: 'Dhanu', zeroArtwork: require('../../assets/horoscope/zodiac-zero/sagittarius.png') },
  { id: 'capricorn', englishName: 'Capricorn', englishRashi: 'Makar', zeroArtwork: require('../../assets/horoscope/zodiac-zero/capricorn.png') },
  { id: 'aquarius', englishName: 'Aquarius', englishRashi: 'Kumbh', zeroArtwork: require('../../assets/horoscope/zodiac-zero/aquarius.png') },
  { id: 'pisces', englishName: 'Pisces', englishRashi: 'Meen', zeroArtwork: require('../../assets/horoscope/zodiac-zero/pisces.png') },
];

const FALLBACK_HOROSCOPE = {
  en: 'Your daily guidance will appear here.',
  hi: '\u0906\u092a\u0915\u093e \u0926\u0948\u0928\u093f\u0915 \u0930\u093e\u0936\u093f\u092b\u0932 \u092f\u0939\u093e\u0901 \u0926\u093f\u0916\u093e\u0908 \u0926\u0947\u0917\u093e\u0964',
};

const INSIGHT_ITEMS = {
  en: [
    { id: 'love', icon: '\u2665', label: 'Love', value: 'Positive vibes in relationships.' },
    { id: 'career', icon: '\u2609', label: 'Career', value: 'New opportunities are coming.' },
    { id: 'health', icon: '\u2726', label: 'Health', value: 'Take care of your diet and rest.' },
  ],
  hi: [
    { id: 'love', icon: '\u2665', label: '\u092a\u094d\u0930\u0947\u092e', value: '\u0930\u093f\u0936\u094d\u0924\u094b\u0902 \u092e\u0947\u0902 \u0938\u0915\u093e\u0930\u093e\u0924\u094d\u092e\u0915 \u090a\u0930\u094d\u091c\u093e \u0930\u0939\u0947\u0917\u0940\u0964' },
    { id: 'career', icon: '\u2609', label: '\u0915\u0930\u093f\u092f\u0930', value: '\u0928\u090f \u0905\u0935\u0938\u0930 \u0906\u092a\u0915\u0940 \u0913\u0930 \u0906 \u0930\u0939\u0947 \u0939\u0948\u0902\u0964' },
    { id: 'health', icon: '\u2726', label: '\u0938\u094d\u0935\u093e\u0938\u094d\u0925\u094d\u092f', value: '\u0906\u0939\u093e\u0930 \u0914\u0930 \u0906\u0930\u093e\u092e \u0915\u093e \u0927\u094d\u092f\u093e\u0928 \u0930\u0916\u0947\u0902\u0964' },
  ],
};

const LUCKY_ITEMS = {
  en: [
    { id: 'luckyColor', label: 'Lucky Color', value: 'Golden' },
    { id: 'luckyNumber', label: 'Lucky Number', value: '8' },
    { id: 'auspiciousTime', label: 'Auspicious Time', value: '10:45 AM - 12:30 PM' },
  ],
  hi: [
    { id: 'luckyColor', label: '\u0936\u0941\u092d \u0930\u0902\u0917', value: '\u0938\u0941\u0928\u0939\u0930\u093e' },
    { id: 'luckyNumber', label: '\u0936\u0941\u092d \u0905\u0902\u0915', value: '\u096e' },
    { id: 'auspiciousTime', label: '\u0936\u0941\u092d \u0938\u092e\u092f', value: '\u0938\u0941\u092c\u0939 10:45 - \u0926\u094b\u092a\u0939 12:30' },
  ],
};

export default function HoroscopeDetailScreen({ navigation, route }) {
  const { width } = useWindowDimensions();
  const { currentLanguage, t } = useLanguage();
  const safeLanguage = currentLanguage === 'hi' ? 'hi' : 'en';
  const [horoscopeText, setHoroscopeText] = useState(FALLBACK_HOROSCOPE[safeLanguage]);
  const [isLoading, setIsLoading] = useState(true);

  const selectedSign = useMemo(() => (
    ZODIAC_SIGNS.find((sign) => sign.id === route?.params?.signId) ?? ZODIAC_SIGNS[0]
  ), [route?.params?.signId]);

  const imageSize = Math.max(190, Math.min(290, width * 0.58));

  useEffect(() => {
    let isActive = true;

    async function loadHoroscope() {
      setIsLoading(true);

      try {
        const horoscopes = await getDailyHoroscopes(safeLanguage);
        const text = horoscopes?.[selectedSign.id]?.horoscope || FALLBACK_HOROSCOPE[safeLanguage];

        if (isActive) {
          setHoroscopeText(text);
        }
      } catch (error) {
        if (isActive) {
          setHoroscopeText(FALLBACK_HOROSCOPE[safeLanguage]);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadHoroscope();

    return () => {
      isActive = false;
    };
  }, [safeLanguage, selectedSign.id]);

  return (
    <ImageBackground source={BG_IMAGE} style={styles.background} resizeMode="cover">
      <View style={styles.overlay} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backButton} activeOpacity={0.78} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>{'\u2039'} Back</Text>
        </TouchableOpacity>

        <View style={styles.heroCard}>
          <Image
            source={selectedSign.zeroArtwork}
            style={[styles.heroImage, { width: imageSize, height: imageSize * 1.06 }]}
            resizeMode="contain"
          />
          <Text style={styles.eyebrow}>Today's Detailed Horoscope</Text>
          <View style={styles.nameRow}>
            <Text style={styles.title}>{selectedSign.englishName}</Text>
            <Text style={styles.nameDivider}>/</Text>
            <Text style={styles.rashiName}>{selectedSign.englishRashi}</Text>
          </View>
        </View>

        <View style={styles.detailCard}>
          <Text style={styles.detailText}>{isLoading ? t('loading') : horoscopeText}</Text>
        </View>

        <View style={styles.cardGrid}>
          {INSIGHT_ITEMS[safeLanguage].map((item) => (
            <View key={item.id} style={styles.infoCard}>
              <Text style={styles.infoIcon}>{item.icon}</Text>
              <Text style={styles.infoLabel}>{item.label}</Text>
              <Text style={styles.infoValue}>{item.value}</Text>
            </View>
          ))}
        </View>

        <View style={styles.cardGrid}>
          {LUCKY_ITEMS[safeLanguage].map((item) => (
            <View key={item.id} style={styles.luckyCard}>
              <Text style={styles.luckyLabel}>{item.label}</Text>
              <Text style={styles.luckyValue}>{item.value}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.listenButton} activeOpacity={0.82}>
          <Text style={styles.listenButtonText}>Listen Horoscope</Text>
        </TouchableOpacity>
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 246, 226, 0.68)',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 34,
  },
  backButton: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: 'rgba(255, 248, 232, 0.94)',
    borderWidth: 1,
    borderColor: 'rgba(198, 143, 42, 0.48)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 12,
  },
  backButtonText: {
    color: '#7C4B0B',
    fontSize: 13,
    fontWeight: '900',
  },
  heroCard: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 247, 223, 0.98)',
    borderRadius: 28,
    borderWidth: 1.4,
    borderColor: 'rgba(198, 143, 42, 0.58)',
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 20,
    shadowColor: '#9C6420',
    shadowOpacity: 0.2,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 7,
  },
  heroImage: {
    marginBottom: 4,
  },
  eyebrow: {
    color: '#B47A18',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0,
    marginBottom: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    flexWrap: 'wrap',
    columnGap: 8,
  },
  title: {
    color: '#3F2713',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 0,
  },
  nameDivider: {
    color: '#A36A12',
    fontSize: 18,
    fontWeight: '900',
  },
  rashiName: {
    color: '#8A6425',
    fontSize: 17,
    fontWeight: '900',
  },
  detailCard: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    marginTop: 14,
    backgroundColor: 'rgba(255, 252, 239, 0.97)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(216, 177, 92, 0.6)',
    padding: 18,
    shadowColor: '#8A6425',
    shadowOpacity: 0.11,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  detailText: {
    color: '#4D3218',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 25,
  },
  cardGrid: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 8,
    rowGap: 8,
    marginTop: 12,
  },
  infoCard: {
    flex: 1,
    flexBasis: '31%',
    minWidth: 0,
    minHeight: 116,
    backgroundColor: 'rgba(255, 252, 239, 0.96)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(216, 177, 92, 0.58)',
    paddingVertical: 12,
    paddingHorizontal: 9,
    shadowColor: '#8A6425',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  infoIcon: {
    color: '#B87918',
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 5,
  },
  infoLabel: {
    color: '#A36A12',
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 5,
  },
  infoValue: {
    color: '#4D3218',
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 16,
  },
  luckyCard: {
    flex: 1,
    flexBasis: '31%',
    minWidth: 0,
    minHeight: 78,
    backgroundColor: 'rgba(255, 242, 202, 0.78)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(199, 139, 32, 0.48)',
    paddingVertical: 11,
    paddingHorizontal: 9,
    justifyContent: 'center',
  },
  luckyLabel: {
    color: '#A36A12',
    fontSize: 10,
    fontWeight: '900',
    marginBottom: 5,
  },
  luckyValue: {
    color: '#3F2713',
    fontSize: 12,
    fontWeight: '900',
    lineHeight: 16,
  },
  listenButton: {
    alignSelf: 'center',
    marginTop: 18,
    borderRadius: 999,
    backgroundColor: '#D89A22',
    borderWidth: 1,
    borderColor: '#F0C96C',
    paddingHorizontal: 24,
    paddingVertical: 12,
    shadowColor: '#A86913',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  listenButtonText: {
    color: '#FFF9E8',
    fontSize: 14,
    fontWeight: '900',
  },
});
