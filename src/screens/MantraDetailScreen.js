import { useMemo, useState } from 'react';
import {
  Image,
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

import DevotionalBackground from '../components/DevotionalBackground';
import BhaktiBackButton from '../components/BhaktiBackButton';
import { useBhaktiTopPadding } from '../components/BhaktiLayout';
import {
  MANTRA_LIBRARY,
  getCategoryById,
  getDeityById,
} from '../data/mantrasData';

const HANGING_BELL_IMAGE = require('../../assets/horoscope/decorations/hanging-bell.png');
const LOTUS_DIVIDER_IMAGE = require('../../assets/horoscope/decorations/lotus-divider.png');

const DEVOTIONAL_FONT = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });
const CHANT_COUNT_OPTIONS = [11, 21, 108];

export default function MantraDetailScreen({ navigation, route }) {
  const { width, height } = useWindowDimensions();
  const headerTopPadding = useBhaktiTopPadding(width, 'hero');
  const mantra = MANTRA_LIBRARY.find((item) => item.id === route?.params?.mantraId) ?? MANTRA_LIBRARY[0];
  const deity = getDeityById(mantra.deityId);
  const category = getCategoryById(mantra.categoryId);
  const recommendedCount = Number.parseInt(mantra.chantCount, 10);
  const initialCount = CHANT_COUNT_OPTIONS.includes(recommendedCount) ? recommendedCount : 108;
  const [selectedCount, setSelectedCount] = useState(initialCount);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const responsiveStyles = useMemo(() => {
    const compactWidth = Math.min(width, 520);
    const horizontalPadding = Math.max(14, Math.min(22, compactWidth * 0.045));
    const contentWidth = Math.max(280, Math.min(width - horizontalPadding * 2, 680));
    const bellWidth = Math.max(38, Math.min(58, compactWidth * 0.122));
    const heroImageSize = Math.max(142, Math.min(214, contentWidth * 0.48));
    const actionButtonSize = Math.max(38, Math.min(46, compactWidth * 0.11));

    return {
      content: {
        paddingHorizontal: horizontalPadding,
        paddingTop: Math.max(4, height * 0.006),
      },
      header: {
        minHeight: Math.max(150, Math.min(210, height * 0.23)),
        paddingTop: headerTopPadding,
        paddingHorizontal: Math.max(18, compactWidth * 0.052),
      },
      bell: {
        width: bellWidth,
        height: bellWidth * 2.34,
      },
      headerTitle: {
        fontSize: Math.max(24, Math.min(33, compactWidth * 0.07)),
        lineHeight: Math.max(30, Math.min(41, compactWidth * 0.086)),
      },
      card: {
        width: contentWidth,
        padding: Math.max(15, Math.min(22, compactWidth * 0.046)),
      },
      heroImage: {
        width: heroImageSize,
        height: heroImageSize,
        borderRadius: heroImageSize / 2,
      },
      actionButton: {
        width: actionButtonSize,
        height: actionButtonSize,
        borderRadius: actionButtonSize / 2,
      },
      infoCard: {
        width: width < 360 ? '100%' : '48.5%',
      },
      mantraText: {
        fontSize: Math.max(16, Math.min(21, compactWidth * 0.047)),
        lineHeight: Math.max(27, Math.min(34, compactWidth * 0.076)),
      },
    };
  }, [headerTopPadding, height, width]);

  const handleShare = async () => {
    try {
      await Share.share({
        title: mantra.title,
        message: `${mantra.title}\n${deity.englishName} | ${category.label}\n\n${mantra.text}`,
      });
    } catch (error) {
      console.warn('Unable to share mantra:', error);
    }
  };

  const startJaap = () => {
    navigation?.navigate?.('JaapCounter', {
      mantraId: mantra.id,
      targetCount: selectedCount,
    });
  };

  return (
    <DevotionalBackground style={styles.background}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={[styles.content, responsiveStyles.content]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.header, responsiveStyles.header]}>
            <Image source={HANGING_BELL_IMAGE} style={[styles.headerBell, styles.leftBell, responsiveStyles.bell]} resizeMode="contain" />
            <Image source={HANGING_BELL_IMAGE} style={[styles.headerBell, styles.rightBell, responsiveStyles.bell]} resizeMode="contain" />

            <BhaktiBackButton navigation={navigation} style={styles.backButton} />

            <Text style={[styles.headerTitle, responsiveStyles.headerTitle]}>Mantra Details</Text>
            <View style={styles.lotusDividerWrap}>
              <View style={[styles.dividerLine, styles.dividerLineLeft]} />
              <Image source={LOTUS_DIVIDER_IMAGE} style={styles.lotusDivider} resizeMode="contain" />
              <View style={[styles.dividerLine, styles.dividerLineRight]} />
            </View>
          </View>

          <View style={[styles.heroCard, responsiveStyles.card]}>
            <View pointerEvents="none" style={styles.heroGlow} />
            <View style={styles.heroImageWrap}>
              {deity.image ? (
                <Image source={deity.image} style={[styles.heroImage, responsiveStyles.heroImage]} resizeMode="cover" />
              ) : (
                <View style={[styles.heroSymbolWrap, responsiveStyles.heroImage]}>
                  <Text style={styles.heroSymbol}>{deity.symbol}</Text>
                </View>
              )}
            </View>

            <Text style={styles.mantraTitle} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.76}>
              {mantra.title}
            </Text>
            <Text style={styles.deityName} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.78}>
              {deity.englishName}
            </Text>

            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{category.label}</Text>
            </View>
          </View>

          <View style={[styles.mantraCard, responsiveStyles.card]}>
            <View style={styles.mantraCardHeader}>
              <Text style={styles.panelTitle}>Sacred Chant</Text>
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.roundAction, responsiveStyles.actionButton]}
                  activeOpacity={0.82}
                  onPress={() => setIsPlaying((value) => !value)}
                >
                  <Text style={styles.roundActionText}>{isPlaying ? '\u275a\u275a' : '\u25b6'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.roundAction, responsiveStyles.actionButton, isFavorite && styles.favoriteAction]}
                  activeOpacity={0.82}
                  onPress={() => setIsFavorite((value) => !value)}
                >
                  <Text style={[styles.roundActionText, isFavorite && styles.favoriteText]}>
                    {isFavorite ? '\u2665' : '\u2661'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.roundAction, responsiveStyles.actionButton]}
                  activeOpacity={0.82}
                  onPress={handleShare}
                >
                  <Text style={styles.roundActionText}>{'\u2197'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={[styles.mantraText, responsiveStyles.mantraText]}>{mantra.text}</Text>
            <Text style={styles.transliterationText}>{mantra.transliteration}</Text>
          </View>

          <View style={[styles.infoSection, responsiveStyles.card]}>
            <View style={styles.infoGrid}>
              {[
                { label: 'Meaning', value: mantra.meaning },
                { label: 'Benefits', value: mantra.benefits },
                { label: 'Best time to chant', value: mantra.bestTime },
                { label: 'Recommended chant count', value: `${mantra.chantCount} Times` },
              ].map((item) => (
                <View key={item.label} style={[styles.infoCard, responsiveStyles.infoCard]}>
                  <Text style={styles.infoLabel}>{item.label}</Text>
                  <Text style={styles.infoValue}>{item.value}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.chipTitle}>Chant count</Text>
            <View style={styles.chipRow}>
              {CHANT_COUNT_OPTIONS.map((count) => {
                const isSelected = selectedCount === count;

                return (
                  <TouchableOpacity
                    key={count}
                    style={[styles.countChip, isSelected && styles.countChipSelected]}
                    activeOpacity={0.82}
                    onPress={() => setSelectedCount(count)}
                  >
                    <Text style={[styles.countChipText, isSelected && styles.countChipTextSelected]}>
                      {`${count} Times`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <TouchableOpacity style={[styles.startButton, responsiveStyles.card]} activeOpacity={0.86} onPress={startJaap}>
            <Text style={styles.startButtonText}>Start Jaap</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </DevotionalBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    alignItems: 'center',
    paddingBottom: 34,
  },
  header: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    paddingBottom: 12,
  },
  headerBell: {
    position: 'absolute',
    top: 2,
    opacity: 0.62,
    zIndex: 2,
  },
  leftBell: {
    left: 2,
  },
  rightBell: {
    right: 2,
    transform: [{ scaleX: -1 }],
  },
  backButton: {
    position: 'absolute',
    top: 14,
    left: 8,
    zIndex: 6,
  },
  headerTitle: {
    color: '#3F2713',
    fontFamily: DEVOTIONAL_FONT,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0,
    textShadowColor: 'rgba(184, 121, 24, 0.16)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  lotusDividerWrap: {
    width: '72%',
    maxWidth: 340,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1.2,
    borderRadius: 1,
    backgroundColor: 'rgba(184, 121, 24, 0.32)',
  },
  dividerLineLeft: {
    marginRight: 8,
  },
  dividerLineRight: {
    marginLeft: 8,
  },
  lotusDivider: {
    width: 44,
    height: 24,
    opacity: 0.78,
  },
  heroCard: {
    alignSelf: 'center',
    alignItems: 'center',
    backgroundColor: '#F6E2A8',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(156, 106, 24, 0.25)',
    shadowColor: '#9C6420',
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute',
    top: -52,
    right: -40,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(246, 205, 105, 0.26)',
    borderWidth: 1,
    borderColor: 'rgba(216, 177, 92, 0.16)',
  },
  heroImageWrap: {
    backgroundColor: 'rgba(243, 209, 138, 0.88)',
    borderRadius: 999,
    padding: 8,
    marginBottom: 12,
    zIndex: 1,
  },
  heroImage: {
    backgroundColor: '#FFF2C6',
    borderWidth: 2,
    borderColor: '#D9A83F',
  },
  heroSymbolWrap: {
    backgroundColor: '#FFF2C6',
    borderWidth: 2,
    borderColor: '#D9A83F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroSymbol: {
    color: '#8A520B',
    fontFamily: DEVOTIONAL_FONT,
    fontSize: 36,
    fontWeight: '900',
  },
  mantraTitle: {
    color: '#3F2713',
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 28,
    textAlign: 'center',
    zIndex: 1,
  },
  deityName: {
    color: '#7A5520',
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 3,
    zIndex: 1,
  },
  categoryBadge: {
    minHeight: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 248, 232, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(216, 177, 92, 0.58)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    marginTop: 10,
    zIndex: 1,
  },
  categoryBadgeText: {
    color: '#855915',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  mantraCard: {
    alignSelf: 'center',
    marginTop: 12,
    backgroundColor: 'rgba(255, 250, 239, 0.96)',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(184, 121, 24, 0.28)',
    shadowColor: '#7A552A',
    shadowOpacity: 0.13,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  mantraCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    columnGap: 10,
  },
  panelTitle: {
    color: '#5C3A0E',
    fontSize: 15,
    fontWeight: '900',
    flex: 1,
    minWidth: 0,
  },
  actionRow: {
    flexDirection: 'row',
    columnGap: 6,
  },
  roundAction: {
    backgroundColor: '#FFF2C6',
    borderWidth: 1,
    borderColor: 'rgba(216, 168, 63, 0.58)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#B87918',
    shadowOpacity: 0.09,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  favoriteAction: {
    backgroundColor: 'rgba(255, 225, 120, 0.62)',
    borderColor: '#D8A12D',
  },
  roundActionText: {
    color: '#8A520B',
    fontSize: 14,
    fontWeight: '900',
  },
  favoriteText: {
    color: '#B15C12',
  },
  mantraText: {
    color: '#4A2E14',
    fontFamily: DEVOTIONAL_FONT,
    fontWeight: '900',
    textAlign: 'center',
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 18,
    backgroundColor: 'rgba(248, 231, 184, 0.62)',
    borderWidth: 1,
    borderColor: 'rgba(216, 177, 92, 0.45)',
  },
  transliterationText: {
    color: '#60401E',
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 12,
  },
  infoSection: {
    alignSelf: 'center',
    marginTop: 12,
    backgroundColor: 'rgba(255, 250, 239, 0.96)',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(184, 121, 24, 0.28)',
    shadowColor: '#7A552A',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  infoCard: {
    minHeight: 82,
    backgroundColor: 'rgba(255, 248, 220, 0.72)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(156, 106, 24, 0.22)',
    padding: 11,
    justifyContent: 'center',
  },
  infoLabel: {
    color: '#A36A12',
    fontSize: 10,
    fontWeight: '900',
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  infoValue: {
    color: '#4D3218',
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 17,
  },
  chipTitle: {
    color: '#5C3A0E',
    fontSize: 14,
    fontWeight: '900',
    marginTop: 14,
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  countChip: {
    minHeight: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 248, 232, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(216, 177, 92, 0.58)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 13,
  },
  countChipSelected: {
    backgroundColor: 'rgba(255, 225, 120, 0.72)',
    borderColor: '#D8A12D',
    shadowColor: '#FFD66B',
    shadowOpacity: 0.42,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  countChipText: {
    color: '#8A520B',
    fontSize: 11,
    fontWeight: '900',
  },
  countChipTextSelected: {
    color: '#3F2713',
  },
  startButton: {
    minHeight: 46,
    borderRadius: 999,
    backgroundColor: '#C9911E',
    borderWidth: 1,
    borderColor: '#F0C96C',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 11,
    shadowColor: '#A86913',
    shadowOpacity: 0.24,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  startButtonText: {
    color: '#FFF8E8',
    fontSize: 14,
    fontWeight: '900',
  },
});
