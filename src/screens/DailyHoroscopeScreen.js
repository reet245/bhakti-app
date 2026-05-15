import { useEffect, useMemo, useState } from 'react';
import {
  Image,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useLanguage } from '../context/LanguageContext';
import { getDailyHoroscopes } from '../services/horoscopeService';

const BG_IMAGE = require('../../assets/horoscope/background/horoscope-bg.png');

const ZODIAC_SIGNS = [
  {
    id: 'aries',
    nameKey: 'aries',
    dateRange: 'Mar 21 - Apr 19',
    icon: require('../../assets/horoscope/zodiac/aries.png'),
  },
  {
    id: 'taurus',
    nameKey: 'taurus',
    dateRange: 'Apr 20 - May 20',
    icon: require('../../assets/horoscope/zodiac/taurus.png'),
  },
  {
    id: 'gemini',
    nameKey: 'gemini',
    dateRange: 'May 21 - Jun 20',
    icon: require('../../assets/horoscope/zodiac/gemini.png'),
  },
  {
    id: 'cancer',
    nameKey: 'cancer',
    dateRange: 'Jun 21 - Jul 22',
    icon: require('../../assets/horoscope/zodiac/cancer.png'),
  },
  {
    id: 'leo',
    nameKey: 'leo',
    dateRange: 'Jul 23 - Aug 22',
    icon: require('../../assets/horoscope/zodiac/leo.png'),
  },
  {
    id: 'virgo',
    nameKey: 'virgo',
    dateRange: 'Aug 23 - Sep 22',
    icon: require('../../assets/horoscope/zodiac/virgo.png'),
  },
  {
    id: 'libra',
    nameKey: 'libra',
    dateRange: 'Sep 23 - Oct 22',
    icon: require('../../assets/horoscope/zodiac/libra.png'),
  },
  {
    id: 'scorpio',
    nameKey: 'scorpio',
    dateRange: 'Oct 23 - Nov 21',
    icon: require('../../assets/horoscope/zodiac/scorpio.png'),
  },
  {
    id: 'sagittarius',
    nameKey: 'sagittarius',
    dateRange: 'Nov 22 - Dec 21',
    icon: require('../../assets/horoscope/zodiac/sagittarius.png'),
  },
  {
    id: 'capricorn',
    nameKey: 'capricorn',
    dateRange: 'Dec 22 - Jan 19',
    icon: require('../../assets/horoscope/zodiac/capricorn.png'),
  },
  {
    id: 'aquarius',
    nameKey: 'aquarius',
    dateRange: 'Jan 20 - Feb 18',
    icon: require('../../assets/horoscope/zodiac/aquarius.png'),
  },
  {
    id: 'pisces',
    nameKey: 'pisces',
    dateRange: 'Feb 19 - Mar 20',
    icon: require('../../assets/horoscope/zodiac/pisces.png'),
  },
];

const EMPTY_MESSAGES = {
  en: "Unable to load today's horoscope. Please try again later.",
  hi: 'आज का राशिफल लोड नहीं हो पाया। कृपया बाद में पुनः प्रयास करें।',
};

const createSafeHoroscopes = (languageCode = 'en') => {
  const safeLanguageCode = languageCode === 'hi' ? 'hi' : 'en';

  return ZODIAC_SIGNS.reduce((horoscopeMap, sign) => ({
    ...horoscopeMap,
    [sign.id]: {
      id: sign.id,
      title: sign.nameKey,
      horoscope: EMPTY_MESSAGES[safeLanguageCode],
      date: '',
      luckyNumber: '',
      luckyColor: '',
      remedy: '',
      source: '',
    },
  }), {});
};

export default function DailyHoroscopeScreen() {
  const { t, currentLanguage } = useLanguage();
  const safeLanguage = currentLanguage === 'hi' ? 'hi' : 'en';
  const [selectedSignId, setSelectedSignId] = useState('aries');
  const [horoscopes, setHoroscopes] = useState(() => createSafeHoroscopes(safeLanguage));
  const [isLoading, setIsLoading] = useState(true);

  const selectedSign = useMemo(
    () => ZODIAC_SIGNS.find((sign) => sign.id === selectedSignId) ?? ZODIAC_SIGNS[0],
    [selectedSignId],
  );
  const selectedHoroscope = horoscopes[selectedSign.id] ?? createSafeHoroscopes(safeLanguage)[selectedSign.id];
  const guidanceRows = [
    {
      label: t('luckyNumber'),
      value: selectedHoroscope?.luckyNumber,
    },
    {
      label: t('luckyColor'),
      value: selectedHoroscope?.luckyColor,
    },
    {
      label: safeLanguage === 'hi' ? 'उपाय' : 'Remedy',
      value: selectedHoroscope?.remedy,
    },
  ].filter((row) => row.value);

  useEffect(() => {
    let isActive = true;

    async function loadDailyHoroscopes() {
      setIsLoading(true);

      try {
        const nextHoroscopes = await getDailyHoroscopes(safeLanguage);

        if (isActive) {
          setHoroscopes(nextHoroscopes || createSafeHoroscopes(safeLanguage));
        }
      } catch (error) {
        console.log('Horoscope fetch failed:', error);

        if (isActive) {
          setHoroscopes(createSafeHoroscopes(safeLanguage));
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadDailyHoroscopes();

    return () => {
      isActive = false;
    };
  }, [safeLanguage]);

  return (
    <ImageBackground
      source={BG_IMAGE}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay} />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerSymbolWrap}>
            <Image source={selectedSign.icon} style={styles.headerIcon} resizeMode="contain" />
          </View>
          <Text style={styles.title}>{t('dailyHoroscope')}</Text>
          <Text style={styles.subtitle}>{t('chooseZodiacSign')}</Text>
        </View>

        <View style={styles.signGrid}>
          {ZODIAC_SIGNS.map((sign) => {
            const isSelected = selectedSign.id === sign.id;

            return (
              <TouchableOpacity
                key={sign.id}
                style={[styles.signCard, isSelected && styles.signCardSelected]}
                onPress={() => setSelectedSignId(sign.id)}
                activeOpacity={0.78}
              >
                <View style={[styles.signIconWrap, isSelected && styles.signIconWrapSelected]}>
                  <Image source={sign.icon} style={styles.signIcon} resizeMode="contain" />
                </View>
                <View style={styles.signCopy}>
                  <Text style={[styles.signName, isSelected && styles.signNameSelected]}>
                    {t(sign.nameKey)}
                  </Text>
                  <Text style={[styles.dateRange, isSelected && styles.dateRangeSelected]}>
                    {sign.dateRange}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.detailCard}>
          <View style={styles.detailHeader}>
            <View style={styles.detailSymbolWrap}>
              <Image source={selectedSign.icon} style={styles.detailIcon} resizeMode="contain" />
            </View>
            <View style={styles.detailTitleWrap}>
              <Text style={styles.detailSignName}>{t(selectedSign.nameKey)}</Text>
              <Text style={styles.detailDateRange}>{selectedSign.dateRange}</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>{t('todaysHoroscope')}</Text>
          <Text style={styles.horoscopeText}>
            {isLoading ? t('loading') : selectedHoroscope?.horoscope}
          </Text>

          {guidanceRows.length > 0 && (
            <View style={styles.guidanceList}>
              {guidanceRows.map((row) => (
                <GuidanceRow key={row.label} label={row.label} value={row.value} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </ImageBackground>
  );
}

function GuidanceRow({ label, value }) {
  return (
    <View style={styles.guidanceRow}>
      <Text style={styles.guidanceLabel}>{label}</Text>
      <Text style={styles.guidanceValue}>{value}</Text>
    </View>
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
    backgroundColor: 'rgba(248, 239, 216, 0.48)',
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 26,
    paddingBottom: 34,
  },
  header: {
    alignItems: 'center',
    marginBottom: 22,
  },
  headerSymbolWrap: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: 'rgba(255, 248, 232, 0.88)',
    borderWidth: 1,
    borderColor: '#E8D3A2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#B87918',
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  headerIcon: {
    width: 58,
    height: 58,
  },
  title: {
    color: '#4B2E16',
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
  },
  subtitle: {
    color: '#8A6A3F',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 7,
  },
  signGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  signCard: {
    width: '48%',
    minHeight: 148,
    backgroundColor: 'rgba(255, 248, 232, 0.9)',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E8D3A2',
    shadowColor: '#8A6A3F',
    shadowOpacity: 0.11,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
    alignItems: 'center',
  },
  signCardSelected: {
    backgroundColor: 'rgba(245, 216, 144, 0.94)',
    borderColor: '#B87918',
  },
  signIconWrap: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#F8EFD8',
    borderWidth: 1,
    borderColor: '#E8D3A2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  signIconWrapSelected: {
    backgroundColor: '#FFF8E8',
    borderColor: '#B87918',
  },
  signIcon: {
    width: 58,
    height: 58,
  },
  signCopy: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signName: {
    color: '#4B2E16',
    fontSize: 15,
    fontWeight: '900',
  },
  signNameSelected: {
    color: '#3D230D',
  },
  dateRange: {
    color: '#8A6A3F',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },
  dateRangeSelected: {
    color: '#5C3A0E',
  },
  detailCard: {
    backgroundColor: 'rgba(255, 248, 232, 0.94)',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E8D3A2',
    marginTop: 22,
    shadowColor: '#8A6A3F',
    shadowOpacity: 0.14,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailSymbolWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F8EFD8',
    borderWidth: 1,
    borderColor: '#E8D3A2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  detailIcon: {
    width: 48,
    height: 48,
  },
  detailTitleWrap: {
    flex: 1,
  },
  detailSignName: {
    color: '#4B2E16',
    fontSize: 21,
    fontWeight: '900',
  },
  detailDateRange: {
    color: '#8A6A3F',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 3,
  },
  sectionTitle: {
    color: '#B87918',
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 8,
  },
  horoscopeText: {
    color: '#5C3A0E',
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
    marginBottom: 16,
  },
  guidanceList: {
    gap: 10,
  },
  guidanceRow: {
    backgroundColor: '#F8EFD8',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E8D3A2',
  },
  guidanceLabel: {
    color: '#B87918',
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 4,
  },
  guidanceValue: {
    color: '#4B2E16',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
});
