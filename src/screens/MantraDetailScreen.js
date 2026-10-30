import useDevotionalCopy from '../hooks/useDevotionalCopy';
import useDevotionalStyles from '../hooks/useDevotionalStyles';
import { useEffect, useMemo, useState } from 'react';
import {
  Image,
  Linking,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import useBundledAudio from '../hooks/useBundledAudio';
import { useDevotionalState, toggleMantraFavorite, updateReadingPreferences, retryDevotionalLoad, retryDevotionalSave } from '../hooks/useDevotionalState';

import DevotionalBackground from '../components/DevotionalBackground';
import BhaktiBackButton from '../components/BhaktiBackButton';
import { getBhaktiTopPadding } from '../components/BhaktiLayout';
import {
  MANTRA_LIBRARY,
  getMantraById,
  getMantraScript,
  getCategoryById,
  getDeityById,
} from '../data/mantrasData';

const HANGING_BELL_IMAGE = require('../../assets/horoscope/decorations/hanging-bell.png');
const LOTUS_DIVIDER_IMAGE = require('../../assets/horoscope/decorations/lotus-divider.png');

const DEVOTIONAL_FONT = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });
const CHANT_COUNT_OPTIONS = [1, 9, 11, 21, 108];
const SHLOKA_ORDER = MANTRA_LIBRARY.filter((item) => item.categoryId === 'shlokas');

export default function MantraDetailScreen({ navigation, route }) {
  const { customMantras, ready, error } = useDevotionalState();
  const { isHindi } = useDevotionalCopy();
  const styles = useDevotionalStyles(baseStyles);
  const mantra = getMantraById(route?.params?.mantraId, customMantras);
  const personalRequest = typeof route?.params?.mantraId === 'string' && route.params.mantraId.startsWith('custom-');
  if (!mantra) return (
    <DevotionalBackground style={styles.background}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.unavailable}>
          <BhaktiBackButton navigation={navigation} fallbackRoute="Mantras" />
          <Text selectable style={styles.panelTitle}>{!ready && personalRequest
            ? (isHindi ? 'आपका संग्रह लोड हो रहा है…' : 'Loading your collection…')
            : (isHindi ? 'यह मंत्र नहीं मिला। संग्रह में वापस जाएँ।' : 'This mantra was not found. Return to the library.')}</Text>
          {!!error && <TouchableOpacity accessibilityRole="button" onPress={retryDevotionalLoad}><Text style={styles.transliterationText}>{isHindi ? 'फिर प्रयास करें' : 'Retry loading saved collection'}</Text></TouchableOpacity>}
        </View>
      </SafeAreaView>
    </DevotionalBackground>
  );
  return <MantraReader key={mantra.id} mantra={mantra} navigation={navigation} />;
}

function MantraReader({ navigation, mantra }) {
  const styles = useDevotionalStyles(baseStyles);
  const { ui, isHindi } = useDevotionalCopy();
  const { width, height } = useWindowDimensions();
  // SafeAreaView owns system insets; this value is only the devotional header gap.
  const headerTopPadding = getBhaktiTopPadding(width, 0, 'hero');
  const deity = getDeityById(mantra.deityId);
  const category = getCategoryById(mantra.categoryId);
  const recommendedCount = Number.parseInt(mantra.chantCount, 10);
  const initialCount = CHANT_COUNT_OPTIONS.includes(recommendedCount) ? recommendedCount : 108;
  const [selectedCount, setSelectedCount] = useState(initialCount);
  useEffect(() => { setSelectedCount(initialCount); }, [mantra.id, initialCount]);
  const { playingId, loadingId, error: audioError, toggle: toggleAudio } = useBundledAudio();
  const { favorites, ready, error: storageError, readingScript, meaningLanguage } = useDevotionalState();
  const [actionError, setActionError] = useState('');
  const [sourceError, setSourceError] = useState('');
  const title = isHindi ? mantra.titleHi || mantra.title : mantra.title;
  const readingText = mantra.isCustom ? mantra.text : getMantraScript(mantra, readingScript);
  const meaning = meaningLanguage === 'hi' ? mantra.meaningHi : meaningLanguage === 'bn' ? mantra.meaningBn : mantra.meaning;
  const isPlaying = playingId === mantra.id;
  const isLoading = loadingId === mantra.id;
  const isFavorite = favorites.includes(mantra.id);
  const verseIndex = mantra.categoryId === 'shlokas' ? SHLOKA_ORDER.findIndex((item) => item.id === mantra.id) : -1;

  const responsiveStyles = useMemo(() => {
    const compactWidth = Math.min(width, 520);
    const horizontalPadding = Math.max(14, Math.min(22, compactWidth * 0.045));
    const contentWidth = Math.max(280, Math.min(width - horizontalPadding * 2, 680));
    const bellWidth = Math.max(38, Math.min(58, compactWidth * 0.122));
    const heroImageSize = Math.max(142, Math.min(214, contentWidth * 0.48));
    const actionButtonSize = Math.max(44, Math.min(48, compactWidth * 0.12));

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
    setActionError('');
    try {
      const conversion = !mantra.isCustom && readingScript !== 'devanagari' ? `Script conversion: ${readingScript}. Original text at the source below.` : '';
      const attribution = [mantra.attribution || [mantra.sourceLabel, mantra.reference].filter(Boolean).join(' · '), mantra.textSource, mantra.license, mantra.licenseUrl, conversion].filter(Boolean).join('\n');
      await Share.share({
        title,
        message: `${title}${mantra.isExcerpt ? ' (partial text)' : ''}\n${isHindi ? deity.hindiName : deity.englishName} | ${ui(category.label)}\n\n${readingText}${attribution ? `\n\n${attribution}` : ''}`,
      });
    } catch {
      setActionError(isHindi ? 'साझा नहीं कर सके। फिर प्रयास करें।' : 'Could not share. Please try again.');
    }
  };

  const openSource = async (url) => {
    setSourceError('');
    if (!/^https:\/\//i.test(url || '')) return;
    try { await Linking.openURL(url); }
    catch { setSourceError(isHindi ? 'स्रोत नहीं खोल सके। फिर प्रयास करें।' : 'Could not open the source. Please try again.'); }
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
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.header, responsiveStyles.header]}>
            <Image source={HANGING_BELL_IMAGE} style={[styles.headerBell, styles.leftBell, responsiveStyles.bell]} resizeMode="contain" />
            <Image source={HANGING_BELL_IMAGE} style={[styles.headerBell, styles.rightBell, responsiveStyles.bell]} resizeMode="contain" />

            <BhaktiBackButton navigation={navigation} fallbackRoute="Mantras" style={[styles.backButton, { top: Math.max(14, headerTopPadding - 28) }]} />

            <Text style={[styles.headerTitle, responsiveStyles.headerTitle]}>{ui('Mantra Details')}</Text>
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

            <Text style={styles.mantraTitle}>
              {title}
            </Text>
            <Text style={styles.deityName} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.78}>
              {isHindi ? deity.hindiName : deity.englishName}
            </Text>

            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{ui(category.label)}</Text>
            </View>
            {!!mantra.reference && <Text style={styles.transliterationText}>{mantra.reference}</Text>}
            {mantra.isCustom && <TouchableOpacity accessibilityRole="button" style={styles.countChip} onPress={() => navigation.navigate('CustomMantra', { mantraId: mantra.id })}><Text style={styles.countChipText}>{isHindi ? 'अपना मंत्र संपादित करें' : 'Edit personal mantra'}</Text></TouchableOpacity>}
          </View>

          <View style={[styles.mantraCard, responsiveStyles.card]}>
            <View style={styles.mantraCardHeader}>
              <Text style={styles.panelTitle}>{ui('Sacred Chant')}</Text>
              <View style={styles.actionRow}>
                {!!mantra.audio && <TouchableOpacity
                  style={[styles.roundAction, responsiveStyles.actionButton]}
                  activeOpacity={0.82}
                  accessibilityRole="button"
                  accessibilityLabel={ui(isLoading ? 'Cancel loading recording' : isPlaying ? 'Stop recording' : mantra.audio ? 'Play recording' : 'Recording unavailable')}
                  onPress={() => toggleAudio(mantra.id, mantra.audio)}
                >
                  <Text style={styles.roundActionText}>{isLoading ? '…' : isPlaying ? '\u25a0' : mantra.audio ? '\u25b6' : '—'}</Text>
                </TouchableOpacity>}
                <TouchableOpacity
                  style={[styles.roundAction, responsiveStyles.actionButton, isFavorite && styles.favoriteAction]}
                  activeOpacity={0.82}
                  disabled={!ready}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: !ready, selected: isFavorite }}
                  accessibilityLabel={ui(isFavorite ? 'Remove from favorites' : 'Add to favorites')}
                  onPress={() => toggleMantraFavorite(mantra.id)}
                >
                  <Text style={[styles.roundActionText, isFavorite && styles.favoriteText]}>
                    {isFavorite ? '\u2665' : '\u2661'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.roundAction, responsiveStyles.actionButton]}
                  activeOpacity={0.82}
                  accessibilityRole="button"
                  accessibilityLabel={ui('Share')}
                  onPress={handleShare}
                >
                  <Text style={styles.roundActionText}>{'\u2197'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {!!(audioError || storageError || actionError) && <Text selectable accessibilityRole="alert" style={styles.transliterationText}>{ui(audioError || storageError || actionError)}</Text>}
            {!!storageError && <TouchableOpacity accessibilityRole="button" onPress={ready ? retryDevotionalSave : retryDevotionalLoad}><Text style={styles.countChipText}>{isHindi ? 'फिर प्रयास करें' : 'Retry saved collection'}</Text></TouchableOpacity>}
            {!mantra.audio && <Text style={styles.transliterationText}>{ui('A matching recording is not available yet.')}</Text>}
            {mantra.isExcerpt && <Text style={styles.transliterationText}>{mantra.sourceRevision
              ? (isHindi ? 'बड़ी रचना से चुना गया अंश। संदर्भ के लिए मूल स्रोत देखें।' : 'Selected passage from a longer work. See the source for context.')
              : ui('Partial text. The complete work is not available in this edition.')}</Text>}
            {!mantra.isCustom && <>
              <Text style={styles.chipTitle}>{isHindi ? 'पाठ की लिपि' : 'Reading script'}</Text>
              <View style={styles.chipRow}>{[
                ['devanagari', 'देवनागरी'], ['bengali', 'বাংলা'], ['roman', 'Roman'],
              ].map(([id, label]) => <TouchableOpacity key={id} accessibilityRole="button" accessibilityState={{ selected: readingScript === id, disabled: !ready }} disabled={!ready} style={[styles.countChip, readingScript === id && styles.countChipSelected]} onPress={() => updateReadingPreferences({ readingScript: id })}><Text style={styles.countChipText}>{label}</Text></TouchableOpacity>)}</View>
              <Text style={styles.transliterationText}>{readingScript === 'bengali'
                ? 'বাংলা লিপিতে মূল পাঠ · অনুবাদ নয়'
                : readingScript === 'roman' ? (isHindi ? 'रोमन लिप्यंतरण · अर्थ नहीं' : 'Roman transliteration · not a translation')
                  : (isHindi ? 'मूल पाठ · देवनागरी' : 'Original text · Devanagari')}</Text>
              {readingScript === 'bengali' && !!mantra.textBnNote && <Text selectable style={styles.transliterationText}>{mantra.textBnNote}</Text>}
            </>}
            <Text selectable style={[styles.mantraText, responsiveStyles.mantraText]}>{readingText}</Text>
            {!mantra.isCustom && readingScript === 'roman' && !!mantra.transliterationNote && <Text selectable style={styles.transliterationText}>{mantra.transliterationNote}</Text>}
            {mantra.isCustom && !!mantra.transliteration && <Text selectable style={styles.transliterationText}>{mantra.transliteration}</Text>}
          </View>

          <View style={[styles.infoSection, responsiveStyles.card]}>
            <Text style={styles.panelTitle}>{ui('Meaning')}</Text>
            {!mantra.isCustom && <View style={styles.chipRow}>{[['en', 'English'], ['hi', 'हिन्दी'], ['bn', 'বাংলা']].map(([id, label]) => <TouchableOpacity key={id} accessibilityRole="button" accessibilityState={{ selected: meaningLanguage === id, disabled: !ready }} disabled={!ready} style={[styles.countChip, meaningLanguage === id && styles.countChipSelected]} onPress={() => updateReadingPreferences({ meaningLanguage: id })}><Text style={styles.countChipText}>{label}</Text></TouchableOpacity>)}</View>}
            <Text selectable style={styles.meaningText}>{mantra.isCustom ? mantra.meaning || (isHindi ? 'कोई व्यक्तिगत नोट नहीं जोड़ा गया।' : 'No personal note added.') : meaning || (meaningLanguage === 'bn' ? 'এই পাঠের যাচাইকৃত বাংলা অর্থ এখনও যুক্ত করা হয়নি।' : meaningLanguage === 'hi' ? 'इस पाठ का सत्यापित हिंदी अर्थ अभी उपलब्ध नहीं है।' : 'A verified English meaning has not been added for this text yet.')}</Text>
            {!!meaning && !mantra.isCustom && <Text selectable style={styles.transliterationText}>{mantra.meaningNote || mantra.meaningType || (isHindi ? 'संक्षिप्त अर्थ' : 'Brief explanatory meaning')}</Text>}
            <View style={styles.infoGrid}>
              {[
                { label: isHindi ? 'भाषा' : 'Language', value: mantra.isCustom ? (isHindi ? 'आपका व्यक्तिगत पाठ' : 'Your personal text') : mantra.language },
                { label: isHindi ? 'पाठ' : 'Text', value: mantra.isExcerpt ? (isHindi ? 'चयनित अंश' : 'Selected excerpt') : (isHindi ? 'पूरा चयनित पाठ' : 'Complete selected text') },
              ].filter((item) => item.value).map((item) => (
                <View key={item.label} style={[styles.infoCard, responsiveStyles.infoCard]}>
                  <Text style={styles.infoLabel}>{item.label}</Text>
                  <Text style={styles.infoValue}>{item.value}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.chipTitle}>{ui('Chant count')}</Text>
            <View style={styles.chipRow}>
              {CHANT_COUNT_OPTIONS.map((count) => {
                const isSelected = selectedCount === count;

                return (
                  <TouchableOpacity
                    key={count}
                    style={[styles.countChip, isSelected && styles.countChipSelected]}
                    activeOpacity={0.82}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    onPress={() => setSelectedCount(count)}
                  >
                    <Text style={[styles.countChipText, isSelected && styles.countChipTextSelected]}>
                      {`${count} ${isHindi ? 'बार' : 'Times'}`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <TouchableOpacity style={[styles.startButton, responsiveStyles.card]} accessibilityRole="button" activeOpacity={0.86} onPress={startJaap}>
            <Text style={styles.startButtonText}>{ui('Start Jaap')}</Text>
          </TouchableOpacity>
          {!mantra.isCustom && <View style={[styles.infoSection, responsiveStyles.card]}>
            <Text style={styles.panelTitle}>{isHindi ? 'पाठ का स्रोत और श्रेय' : 'Source & attribution'}</Text>
            <Text selectable style={styles.transliterationText}>{mantra.attribution || [mantra.sourceLabel, mantra.reference, mantra.license].filter(Boolean).join('\n') || (isHindi ? 'परंपरागत पाठ; स्रोत समीक्षा लंबित है।' : 'Traditional text; source review pending.')}</Text>
            {!!mantra.textSource && <TouchableOpacity accessibilityRole="link" style={styles.sourceLink} onPress={() => openSource(mantra.textSource)}><Text style={styles.countChipText}>{ui('Read text source')} ↗</Text></TouchableOpacity>}
            {!!mantra.licenseUrl && <TouchableOpacity accessibilityRole="link" style={styles.sourceLink} onPress={() => openSource(mantra.licenseUrl)}><Text style={styles.countChipText}>{isHindi ? 'पुनः उपयोग की शर्तें' : 'Reuse license'} ↗</Text></TouchableOpacity>}
            {!!sourceError && <Text selectable accessibilityRole="alert" style={styles.transliterationText}>{sourceError}</Text>}
          </View>}
          {verseIndex >= 0 && <View style={[styles.verseNavigation, { width: responsiveStyles.card.width }]}>
            {[
              { key: 'previous', item: SHLOKA_ORDER[verseIndex - 1], label: isHindi ? 'पिछला श्लोक' : 'Previous verse' },
              { key: 'next', item: SHLOKA_ORDER[verseIndex + 1], label: isHindi ? 'अगला श्लोक' : 'Next verse' },
            ].map(({ key, item, label }) => <TouchableOpacity
              key={key}
              accessibilityRole="button"
              accessibilityLabel={label}
              accessibilityState={{ disabled: !item }}
              disabled={!item}
              activeOpacity={0.82}
              style={[styles.countChip, styles.verseButton, !item && styles.disabledAction]}
              onPress={() => navigation.replace('MantraDetail', { mantraId: item.id })}
            >
              <Text style={styles.countChipText}>{label}</Text>
              {!!item && <Text style={styles.verseReference}>{`${item.chapter}.${item.verse}`}</Text>}
            </TouchableOpacity>)}
          </View>}
        </ScrollView>
      </SafeAreaView>
    </DevotionalBackground>
  );
}

const baseStyles = StyleSheet.create({
  unavailable: { padding: 24, gap: 20 },
  meaningText: { color: '#4A2E14', fontSize: 16, lineHeight: 26, marginVertical: 16 },
  sourceLink: { minHeight: 44, justifyContent: 'center' },
  verseNavigation: { flexDirection: 'row', gap: 12, marginTop: 20 },
  verseButton: { flex: 1, minHeight: 58, gap: 4 },
  verseReference: { color: '#7A5520', fontSize: 13 },
  disabledAction: { opacity: 0.4 },
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
    backgroundColor: 'rgba(255, 225, 160, 0.62)',
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
    minHeight: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 248, 232, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(216, 177, 92, 0.58)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  countChipSelected: {
    backgroundColor: 'rgba(255, 225, 160, 0.72)',
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
