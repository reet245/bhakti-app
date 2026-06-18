import { useEffect, useMemo, useRef, useState } from 'react';
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
import * as Speech from 'expo-speech';

import BhaktiBackButton from '../components/BhaktiBackButton';
import { useBhaktiTopPadding } from '../components/BhaktiLayout';
import { useLanguage } from '../context/LanguageContext';
import { getDailyHoroscopes } from '../services/horoscopeService';

const BG_IMAGE = require('../../assets/horoscope/background/horoscope-bg.png');
const LOTUS_DIVIDER_IMAGE = require('../../assets/horoscope/decorations/lotus-divider.png');
const DETAIL_CARD_COLOR = 'rgba(255, 250, 230, 0.95)';

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

export default function HoroscopeDetailScreen({ navigation, route }) {
  const { width } = useWindowDimensions();
  const topPadding = useBhaktiTopPadding(width, 'title', { usesCoreSafeArea: false });
  const { currentLanguage, t } = useLanguage();
  const safeLanguage = currentLanguage === 'hi' ? 'hi' : 'en';
  const [horoscopeText, setHoroscopeText] = useState(FALLBACK_HOROSCOPE[safeLanguage]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const isScreenActive = useRef(true);

  const selectedSign = useMemo(() => (
    ZODIAC_SIGNS.find((sign) => sign.id === route?.params?.signId) ?? ZODIAC_SIGNS[0]
  ), [route?.params?.signId]);

  const imageSize = Math.max(128, Math.min(170, width * 0.42));
  const heroGap = width < 360 ? 12 : 16;

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

  const finishSpeaking = () => {
    if (isScreenActive.current) {
      setIsSpeaking(false);
    }
  };

  useEffect(() => () => {
    isScreenActive.current = false;
    Speech.stop();
  }, []);

  const handleListenHoroscope = async () => {
    try {
      const alreadySpeaking = await Speech.isSpeakingAsync();

      if (alreadySpeaking) {
        Speech.stop();
        setIsSpeaking(false);
        return;
      }

      const textToRead = `${selectedSign.englishName}, ${selectedSign.englishRashi}. Detailed Horoscope. ${horoscopeText}`;

      setIsSpeaking(true);
      Speech.speak(textToRead, {
        language: safeLanguage === 'hi' ? 'hi-IN' : 'en-IN',
        pitch: 1,
        rate: 0.9,
        onDone: finishSpeaking,
        onStopped: finishSpeaking,
        onError: finishSpeaking,
      });
    } catch (error) {
      setIsSpeaking(false);
    }
  };

  return (
    <ImageBackground source={BG_IMAGE} style={styles.background} resizeMode="cover">
      <View style={styles.overlay} />
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: topPadding }]} showsVerticalScrollIndicator={false}>
        <BhaktiBackButton navigation={navigation} style={styles.backButton} />

        <View style={styles.detailCard}>
          <View style={styles.topRow}>
            <Image
              source={selectedSign.zeroArtwork}
              style={[styles.zodiacHeroImage, { width: imageSize, height: imageSize, marginRight: heroGap }]}
              resizeMode="cover"
            />

            <View style={styles.signCopy}>
              <Text style={styles.signName} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.78}>
                {selectedSign.englishName}
              </Text>
              <Text style={styles.hinglishName}>
                {selectedSign.englishName} / {selectedSign.englishRashi}
              </Text>
            </View>
          </View>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Image source={LOTUS_DIVIDER_IMAGE} style={styles.lotusIcon} resizeMode="contain" />
            <View style={styles.dividerLine} />
          </View>

          <Text style={styles.detailTitle}>Detailed Horoscope</Text>
          <Text style={styles.horoscopeText}>{isLoading ? t('loading') : horoscopeText}</Text>

          <TouchableOpacity
            style={[styles.listenButton, isLoading && styles.listenButtonDisabled]}
            activeOpacity={0.82}
            onPress={handleListenHoroscope}
            disabled={isLoading}
          >
            <Text style={styles.listenButtonText}>
              {isSpeaking ? 'Stop Listening' : 'Listen to your Horoscope'}
            </Text>
          </TouchableOpacity>
        </View>
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
    paddingBottom: 34,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 14,
  },
  detailCard: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    backgroundColor: DETAIL_CARD_COLOR,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(156, 106, 24, 0.25)',
    padding: 18,
    shadowColor: '#8A5A12',
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  zodiacHeroImage: {
    borderRadius: 24,
    backgroundColor: 'rgba(243, 209, 138, 0.86)',
    overflow: 'hidden',
  },
  signCopy: {
    flex: 1,
    minWidth: 0,
  },
  signName: {
    fontSize: 26,
    fontWeight: '900',
    color: '#4F2E10',
    letterSpacing: 0,
  },
  hinglishName: {
    fontSize: 14,
    fontWeight: '900',
    color: '#9A681E',
    marginTop: 4,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    borderRadius: 1,
    backgroundColor: 'rgba(156, 106, 24, 0.35)',
  },
  lotusIcon: {
    width: 34,
    height: 20,
    marginHorizontal: 10,
    opacity: 0.86,
  },
  detailTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#4F2E10',
    marginBottom: 12,
    letterSpacing: 0,
  },
  horoscopeText: {
    fontSize: 15.5,
    lineHeight: 25,
    color: '#5C3A18',
    fontWeight: '700',
  },
  listenButton: {
    alignSelf: 'center',
    marginTop: 20,
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 22,
    backgroundColor: '#C9911E',
    borderWidth: 1,
    borderColor: '#F0C96C',
    shadowColor: '#A86913',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  listenButtonDisabled: {
    opacity: 0.58,
  },
  listenButtonText: {
    color: '#FFF8E8',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
});
