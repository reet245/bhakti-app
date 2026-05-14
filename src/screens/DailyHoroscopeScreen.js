import { useMemo, useState } from 'react';
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

const BG_IMAGE = require('../../assets/horoscope/background/horoscope-bg.png');

const ZODIAC_SIGNS = [
  {
    id: 'aries',
    nameKey: 'aries',
    dateRange: 'Mar 21 - Apr 19',
    icon: require('../../assets/horoscope/zodiac/aries.png'),
    horoscope: 'Today brings calm energy and a chance to focus on your inner growth.',
    love: 'Be patient and kind in communication.',
    career: 'A steady approach will bring better results.',
    health: 'Take rest and avoid rushing.',
    luckyColor: 'Gold',
    luckyNumber: '9',
  },
  {
    id: 'taurus',
    nameKey: 'taurus',
    dateRange: 'Apr 20 - May 20',
    icon: require('../../assets/horoscope/zodiac/taurus.png'),
    horoscope: 'A peaceful rhythm supports thoughtful choices and practical progress.',
    love: 'A gentle gesture can bring warmth to your bonds.',
    career: 'Stay consistent and avoid taking shortcuts today.',
    health: 'Nourish yourself with simple food and quiet rest.',
    luckyColor: 'Green',
    luckyNumber: '6',
  },
  {
    id: 'gemini',
    nameKey: 'gemini',
    dateRange: 'May 21 - Jun 20',
    icon: require('../../assets/horoscope/zodiac/gemini.png'),
    horoscope: 'Your words carry influence, so speak with clarity and compassion.',
    love: 'Honest conversation can clear a small misunderstanding.',
    career: 'A new idea may become useful when you organize it well.',
    health: 'Balance mental activity with mindful breathing.',
    luckyColor: 'Yellow',
    luckyNumber: '5',
  },
  {
    id: 'cancer',
    nameKey: 'cancer',
    dateRange: 'Jun 21 - Jul 22',
    icon: require('../../assets/horoscope/zodiac/cancer.png'),
    horoscope: 'Listen to your intuition and protect your emotional peace.',
    love: 'Your care will be felt when it is offered without expectation.',
    career: 'Focus on one meaningful task before taking on more.',
    health: 'A calm routine will help restore your energy.',
    luckyColor: 'White',
    luckyNumber: '2',
  },
  {
    id: 'leo',
    nameKey: 'leo',
    dateRange: 'Jul 23 - Aug 22',
    icon: require('../../assets/horoscope/zodiac/leo.png'),
    horoscope: 'Confidence grows when you act with humility and purpose.',
    love: 'Let appreciation guide your interactions.',
    career: 'Your leadership is strongest when you include others.',
    health: 'Stretch, hydrate, and keep your pace steady.',
    luckyColor: 'Saffron',
    luckyNumber: '1',
  },
  {
    id: 'virgo',
    nameKey: 'virgo',
    dateRange: 'Aug 23 - Sep 22',
    icon: require('../../assets/horoscope/zodiac/virgo.png'),
    horoscope: 'Small improvements made today can create lasting comfort.',
    love: 'Kind listening will matter more than perfect advice.',
    career: 'Details are important, but avoid overthinking every step.',
    health: 'Give your body enough time to slow down.',
    luckyColor: 'Cream',
    luckyNumber: '4',
  },
  {
    id: 'libra',
    nameKey: 'libra',
    dateRange: 'Sep 23 - Oct 22',
    icon: require('../../assets/horoscope/zodiac/libra.png'),
    horoscope: 'Harmony returns when you choose balance over pressure.',
    love: 'A thoughtful message can soften the day.',
    career: 'Work with cooperation, but keep your own priorities clear.',
    health: 'Gentle movement will refresh your mood.',
    luckyColor: 'Pink',
    luckyNumber: '7',
  },
  {
    id: 'scorpio',
    nameKey: 'scorpio',
    dateRange: 'Oct 23 - Nov 21',
    icon: require('../../assets/horoscope/zodiac/scorpio.png'),
    horoscope: 'Deep focus helps you release what no longer needs your energy.',
    love: 'Trust grows through calm and sincere words.',
    career: 'A patient strategy will work better than force.',
    health: 'Rest your mind before making intense decisions.',
    luckyColor: 'Maroon',
    luckyNumber: '8',
  },
  {
    id: 'sagittarius',
    nameKey: 'sagittarius',
    dateRange: 'Nov 22 - Dec 21',
    icon: require('../../assets/horoscope/zodiac/sagittarius.png'),
    horoscope: 'A hopeful sign points you toward learning, travel, or fresh perspective.',
    love: 'Share joy without ignoring someone else\'s feelings.',
    career: 'A broader view will reveal a simpler solution.',
    health: 'Spend time in open air if you can.',
    luckyColor: 'Purple',
    luckyNumber: '3',
  },
  {
    id: 'capricorn',
    nameKey: 'capricorn',
    dateRange: 'Dec 22 - Jan 19',
    icon: require('../../assets/horoscope/zodiac/capricorn.png'),
    horoscope: 'Discipline and devotion work together beautifully today.',
    love: 'Show affection through reliability and presence.',
    career: 'A practical step will bring visible progress.',
    health: 'Respect your limits and avoid carrying too much.',
    luckyColor: 'Brown',
    luckyNumber: '10',
  },
  {
    id: 'aquarius',
    nameKey: 'aquarius',
    dateRange: 'Jan 20 - Feb 18',
    icon: require('../../assets/horoscope/zodiac/acquarius.png'),
    horoscope: 'Fresh thinking opens a path, especially when guided by kindness.',
    love: 'Give space, but stay emotionally available.',
    career: 'An unusual approach may help solve a repeated issue.',
    health: 'A screen break can bring welcome clarity.',
    luckyColor: 'Sky Blue',
    luckyNumber: '11',
  },
  {
    id: 'pisces',
    nameKey: 'pisces',
    dateRange: 'Feb 19 - Mar 20',
    icon: require('../../assets/horoscope/zodiac/pisces.png'),
    horoscope: 'Spiritual reflection and creativity bring calm direction.',
    love: 'Softness and patience will deepen connection.',
    career: 'Trust your imagination, then ground it with a clear plan.',
    health: 'Quiet meditation can ease emotional heaviness.',
    luckyColor: 'Sea Green',
    luckyNumber: '12',
  },
];

export default function DailyHoroscopeScreen() {
  const { t } = useLanguage();
  const [selectedSignId, setSelectedSignId] = useState('aries');

  const selectedSign = useMemo(
    () => ZODIAC_SIGNS.find((sign) => sign.id === selectedSignId) ?? ZODIAC_SIGNS[0],
    [selectedSignId],
  );

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
          <Text style={styles.horoscopeText}>{selectedSign.horoscope}</Text>

          <View style={styles.guidanceList}>
            <GuidanceRow label={t('love')} value={selectedSign.love} />
            <GuidanceRow label={t('career')} value={selectedSign.career} />
            <GuidanceRow label={t('health')} value={selectedSign.health} />
            <GuidanceRow label={t('luckyColor')} value={selectedSign.luckyColor} />
            <GuidanceRow label={t('luckyNumber')} value={selectedSign.luckyNumber} />
          </View>
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
