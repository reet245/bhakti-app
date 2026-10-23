import useDevotionalCopy from '../hooks/useDevotionalCopy';
import useDevotionalStyles from '../hooks/useDevotionalStyles';
import { useMemo } from 'react';
import {
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

import useJaapSession from '../hooks/useJaapSession';

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

function formatElapsedTime(elapsedMs) {
  const seconds = Math.floor(elapsedMs / 1000);
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

export default function JaapCounterScreen({ navigation, route }) {
  const styles = useDevotionalStyles(baseStyles);
  const { ui, isHindi } = useDevotionalCopy();
  const { width, height } = useWindowDimensions();
  const headerTopPadding = useBhaktiTopPadding(width, 'hero');
  const mantra = MANTRA_LIBRARY.find((item) => item.id === route?.params?.mantraId) ?? MANTRA_LIBRARY[0];
  const deity = getDeityById(mantra.deityId);
  const category = getCategoryById(mantra.categoryId);
  const requestedTarget = Number.parseInt(route?.params?.targetCount, 10);
  const targetCount = Number.isInteger(requestedTarget) && requestedTarget > 0 && requestedTarget <= 99999 ? requestedTarget : 108;
  const { count, isActive, elapsedMs, ready, error, start: startJaap, pause: pauseJaap, increment: incrementCount, reset: resetCounter } = useJaapSession(`${mantra.id}:${targetCount}`);

  const responsiveStyles = useMemo(() => {
    const compactWidth = Math.min(width, 520);
    const horizontalPadding = Math.max(14, Math.min(22, compactWidth * 0.045));
    const contentWidth = Math.max(280, Math.min(width - horizontalPadding * 2, 680));
    const bellWidth = Math.max(38, Math.min(58, compactWidth * 0.122));
    const counterSize = Math.max(220, Math.min(330, Math.min(contentWidth * 0.78, height * 0.38)));
    const beadSize = Math.max(9, Math.min(14, counterSize * 0.038));

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
        padding: Math.max(16, Math.min(22, compactWidth * 0.046)),
      },
      counter: {
        width: counterSize,
        height: counterSize,
        borderRadius: counterSize / 2,
      },
      counterInner: {
        width: counterSize * 0.74,
        height: counterSize * 0.74,
        borderRadius: (counterSize * 0.74) / 2,
      },
      countText: {
        fontSize: Math.max(50, Math.min(76, counterSize * 0.24)),
        lineHeight: Math.max(58, Math.min(84, counterSize * 0.27)),
      },
      bead: {
        width: beadSize,
        height: beadSize,
        borderRadius: beadSize / 2,
      },
      statsCard: {
        width: width < 360 ? '100%' : '31.5%',
      },
    };
  }, [headerTopPadding, height, width]);

  const completedMala = Math.floor(count / 108);
  const completedCount = Math.min(count, targetCount);
  const isComplete = count >= targetCount;
  const elapsedTime = formatElapsedTime(elapsedMs);

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

            <Text style={[styles.headerTitle, responsiveStyles.headerTitle]}>{ui('Jaap Counter')}</Text>
            <Text style={styles.subtitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.76}>
              {mantra.title}
            </Text>
            <View style={styles.lotusDividerWrap}>
              <View style={[styles.dividerLine, styles.dividerLineLeft]} />
              <Image source={LOTUS_DIVIDER_IMAGE} style={styles.lotusDivider} resizeMode="contain" />
              <View style={[styles.dividerLine, styles.dividerLineRight]} />
            </View>
          </View>

          <View style={[styles.counterCard, responsiveStyles.card]}>
            <View style={styles.mantraInfoRow}>
              <View style={styles.deityThumb}>
                {deity.image ? (
                  <Image source={deity.image} style={styles.deityThumbImage} resizeMode="cover" />
                ) : (
                  <Text style={styles.deitySymbol}>{deity.symbol}</Text>
                )}
              </View>
              <View style={styles.mantraInfoCopy}>
                <Text style={styles.mantraName} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.76}>
                  {mantra.title}
                </Text>
                <Text style={styles.mantraMeta} numberOfLines={1}>
                  {`${isHindi ? deity.hindiName : deity.englishName} | ${ui(category.label)}`}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.counterCircle, responsiveStyles.counter, isActive && styles.counterCircleActive]}
              activeOpacity={0.9}
              disabled={!ready}
              accessibilityLabel="Add one chant"
              onPress={incrementCount}
            >
              {Array.from({ length: 24 }).map((_, index) => {
                const angle = (index / 24) * Math.PI * 2;
                const radius = 45;
                const left = 50 + Math.cos(angle) * radius;
                const top = 50 + Math.sin(angle) * radius;

                return (
                  <View
                    key={`bead-${index}`}
                    style={[
                      styles.bead,
                      responsiveStyles.bead,
                      {
                        left: `${left}%`,
                        top: `${top}%`,
                      },
                    ]}
                  />
                );
              })}
              <View style={[styles.counterInner, responsiveStyles.counterInner]}>
                <Text
                  style={[styles.countText, responsiveStyles.countText]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.5}
                >
                  {count}
                </Text>
                <Text style={styles.targetText}>{`/${targetCount}`}</Text>
                <Text style={styles.tapHint}>{ui(isActive ? 'Tap to count' : 'Start or tap')}</Text>
              </View>
            </TouchableOpacity>

            {!!error && <Text accessibilityRole="alert" style={styles.completionText}>{ui(error)}</Text>}
            {!ready && <Text style={styles.completionText}>{ui('Loading saved progress…')}</Text>}
            {isComplete && (
              <View style={styles.completionCard}>
                <Text style={styles.completionTitle}>{ui('Jaap complete')}</Text>
                <Text style={styles.completionText}>{ui('Your devotional count has reached the target.')}</Text>
              </View>
            )}

            <View style={styles.buttonRow}>
              <TouchableOpacity style={[styles.primaryButton, styles.flexButton]} activeOpacity={0.86} disabled={!ready} onPress={isActive ? pauseJaap : startJaap}>
                <Text style={styles.primaryButtonText}>{ui(isActive ? 'Pause Jaap' : count > 0 ? 'Resume Jaap' : 'Start Jaap')}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.resetButton, styles.flexButton]} activeOpacity={0.84} disabled={!ready} onPress={resetCounter}>
                <Text style={styles.resetButtonText}>{ui('Reset')}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.statsSection, responsiveStyles.card]}>
            <View style={styles.statsGrid}>
              {[
                { label: ui('Mala'), value: `${completedMala}` },
                { label: ui('Completed'), value: `${completedCount}/${targetCount}` },
                { label: ui('Time'), value: elapsedTime },
              ].map((item) => (
                <View key={item.label} style={[styles.statsCard, responsiveStyles.statsCard]}>
                  <Text style={styles.statsLabel}>{item.label}</Text>
                  <Text style={styles.statsValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}>
                    {item.value}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </DevotionalBackground>
  );
}

const baseStyles = StyleSheet.create({
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
  subtitle: {
    color: '#795425',
    fontSize: 12,
    fontWeight: '900',
    marginTop: 5,
    textAlign: 'center',
    maxWidth: '82%',
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
  counterCard: {
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
  mantraInfoRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  deityThumb: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FFF2C6',
    borderWidth: 1,
    borderColor: '#D9A83F',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginRight: 11,
  },
  deityThumbImage: {
    width: '100%',
    height: '100%',
  },
  deitySymbol: {
    color: '#8A520B',
    fontFamily: DEVOTIONAL_FONT,
    fontSize: 17,
    fontWeight: '900',
  },
  mantraInfoCopy: {
    flex: 1,
    minWidth: 0,
  },
  mantraName: {
    color: '#3F2713',
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 20,
  },
  mantraMeta: {
    color: '#8A6425',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2,
  },
  counterCircle: {
    backgroundColor: 'rgba(255, 248, 232, 0.72)',
    borderWidth: 3,
    borderColor: 'rgba(216, 168, 63, 0.68)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#B87918',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 7 },
    elevation: 5,
    overflow: 'hidden',
  },
  counterCircleActive: {
    borderColor: '#D8A12D',
    shadowColor: '#FFD66B',
    shadowOpacity: 0.48,
  },
  bead: {
    position: 'absolute',
    backgroundColor: '#D8A12D',
    borderWidth: 1,
    borderColor: 'rgba(255, 248, 232, 0.82)',
    marginLeft: -6,
    marginTop: -6,
    opacity: 0.74,
  },
  counterInner: {
    backgroundColor: 'rgba(255, 250, 239, 0.94)',
    borderWidth: 1,
    borderColor: 'rgba(216, 177, 92, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
  },
  countText: {
    color: '#3F2713',
    fontFamily: DEVOTIONAL_FONT,
    fontWeight: '900',
    textAlign: 'center',
  },
  targetText: {
    color: '#8A520B',
    fontSize: 18,
    fontWeight: '900',
    marginTop: -2,
  },
  tapHint: {
    color: '#8A6425',
    fontSize: 11,
    fontWeight: '900',
    marginTop: 7,
    textTransform: 'uppercase',
  },
  completionCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 248, 232, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(216, 177, 92, 0.58)',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  completionTitle: {
    color: '#3F2713',
    fontSize: 14,
    fontWeight: '900',
  },
  completionText: {
    color: '#7A5520',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 3,
  },
  buttonRow: {
    width: '100%',
    flexDirection: 'row',
    columnGap: 10,
    marginTop: 16,
  },
  flexButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  primaryButton: {
    backgroundColor: '#C9911E',
    borderWidth: 1,
    borderColor: '#F0C96C',
    shadowColor: '#A86913',
    shadowOpacity: 0.24,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFF8E8',
    fontSize: 13,
    fontWeight: '900',
  },
  resetButton: {
    backgroundColor: 'rgba(255, 248, 232, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(216, 177, 92, 0.66)',
  },
  resetButtonText: {
    color: '#7A5520',
    fontSize: 13,
    fontWeight: '900',
  },
  statsSection: {
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  statsCard: {
    minHeight: 78,
    backgroundColor: 'rgba(255, 248, 220, 0.72)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(156, 106, 24, 0.22)',
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsLabel: {
    color: '#A36A12',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    marginBottom: 5,
  },
  statsValue: {
    color: '#3F2713',
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
  },
});
