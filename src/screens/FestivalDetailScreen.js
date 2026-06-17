import {
  Alert,
  Image,
  ImageBackground,
  Platform,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  StatusBar,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

import { festivals, getFestivalById } from '../data/festivalData';
import { festivalImages } from '../data/festivalImages';

const BG_IMAGE = require('../../assets/horoscope/background/horoscope-bg.png');
const DEVOTIONAL_FONT = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });
const STORY_FALLBACK = 'A devotional story for this festival will be added soon.';

function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

function buildShareMessage(festival, storyText) {
  const titleLine = [festival?.name, festival?.subtitle].filter(Boolean).join(' - ');
  const dateLine = festival?.dateText || festival?.date;
  const preview = storyText.length > 520 ? `${storyText.slice(0, 517).trim()}...` : storyText;

  return [
    titleLine,
    dateLine,
    '',
    preview,
    '',
    'Shared from Bhakti.',
  ].filter((line) => line !== undefined && line !== null).join('\n');
}

function showShareFallback() {
  Alert.alert('Sharing is not available on this platform.');
}

export default function FestivalDetailScreen({ navigation, route }) {
  const { width, height } = useWindowDimensions();
  const festival = getFestivalById(route?.params?.festivalId) ?? route?.params?.festival ?? festivals[0];
  const imageSource = festivalImages[festival?.imageKey];
  const storyText = festival?.story || STORY_FALLBACK;
  const dateText = festival?.dateText || festival?.date;
  const statusTop = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;
  const contentWidth = Math.max(282, Math.min(width - Math.max(24, width * 0.07), 720));
  const compactWidth = Math.min(width, 520);
  const heroHeight = Math.max(260, Math.min(380, height * 0.42, width * 0.98));
  const cardOverlap = Math.max(22, Math.min(34, heroHeight * 0.09));
  const titleSize = Math.max(27, Math.min(38, compactWidth * 0.078));
  const subtitleSize = Math.max(13, Math.min(16, compactWidth * 0.035));
  const storySize = Math.max(15, Math.min(17, compactWidth * 0.039));
  const iconTop = statusTop + Math.max(10, height * 0.014);

  const handleBack = () => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
      return;
    }

    navigation?.navigate?.('UpcomingFestivals');
  };

  const handleShare = async () => {
    const message = buildShareMessage(festival, storyText);

    try {
      if (Platform.OS === 'web' && typeof globalThis.navigator?.share === 'function') {
        await globalThis.navigator.share({
          title: festival?.name || 'Festival Story',
          text: message,
        });
        return;
      }

      if (typeof Share?.share === 'function') {
        await Share.share({
          title: festival?.name || 'Festival Story',
          message,
        });
        return;
      }

      showShareFallback();
    } catch (error) {
      if (error?.name === 'AbortError') return;
      showShareFallback();
    }
  };

  return (
    <ImageBackground source={BG_IMAGE} style={styles.background} resizeMode="cover">
      <View style={styles.overlay} />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={[styles.content, { paddingBottom: Math.max(34, height * 0.055) }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.heroStage, { height: heroHeight }]}>
            {imageSource ? (
              <Image source={imageSource} style={styles.heroImage} resizeMode="cover" />
            ) : (
              <View style={styles.heroFallback}>
                <Text style={styles.heroInitials}>{getInitials(festival?.name)}</Text>
              </View>
            )}
            <View style={styles.heroShade} />

            <TouchableOpacity
              style={[styles.floatButton, styles.backButton, { top: iconTop }]}
              activeOpacity={0.82}
              onPress={handleBack}
            >
              <Text style={styles.floatButtonText}>{'<'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.floatButton, styles.shareButton, { top: iconTop }]}
              activeOpacity={0.82}
              onPress={handleShare}
            >
              <Text style={styles.shareIcon}>Share</Text>
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.storyCard,
              {
                width: contentWidth,
                marginTop: -cardOverlap,
                borderRadius: Math.max(24, Math.min(32, contentWidth * 0.055)),
                paddingHorizontal: Math.max(18, Math.min(26, contentWidth * 0.048)),
                paddingVertical: Math.max(20, Math.min(28, height * 0.034)),
              },
            ]}
          >
            <Text
              style={[styles.festivalName, { fontSize: titleSize, lineHeight: titleSize * 1.14 }]}
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.78}
            >
              {festival?.name}
            </Text>
            {!!festival?.subtitle && (
              <Text style={[styles.subtitle, { fontSize: subtitleSize, lineHeight: subtitleSize * 1.38 }]} numberOfLines={2}>
                {festival.subtitle}
              </Text>
            )}
            {!!dateText && (
              <Text style={[styles.dateText, { fontSize: subtitleSize, lineHeight: subtitleSize * 1.35 }]} numberOfLines={1}>
                {dateText}
              </Text>
            )}
            <Text style={[styles.storyText, { fontSize: storySize, lineHeight: storySize * 1.66 }]}>
              {storyText}
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 244, 218, 0.7)',
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    alignItems: 'center',
  },
  heroStage: {
    width: '100%',
    backgroundColor: '#E8CF99',
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2DDA8',
  },
  heroInitials: {
    color: '#9A6114',
    fontFamily: DEVOTIONAL_FONT,
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: 0,
  },
  heroShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(47, 28, 9, 0.16)',
  },
  floatButton: {
    position: 'absolute',
    minWidth: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 250, 239, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255, 231, 177, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    shadowColor: '#2F1C09',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  backButton: {
    left: 16,
  },
  shareButton: {
    right: 16,
  },
  floatButtonText: {
    color: '#4A2D11',
    fontSize: 23,
    fontWeight: '900',
    lineHeight: 27,
  },
  shareIcon: {
    color: '#5B3511',
    fontSize: 12,
    fontWeight: '900',
    lineHeight: 16,
  },
  storyCard: {
    backgroundColor: 'rgba(255, 250, 239, 0.98)',
    borderWidth: 1,
    borderColor: 'rgba(190, 137, 44, 0.42)',
    shadowColor: '#7A552A',
    shadowOpacity: 0.14,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  festivalName: {
    color: '#3F2713',
    fontFamily: DEVOTIONAL_FONT,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0,
  },
  subtitle: {
    color: '#75501E',
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 8,
  },
  dateText: {
    color: '#A36A12',
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 6,
  },
  storyText: {
    color: '#4E3217',
    fontWeight: '700',
    marginTop: 17,
  },
});
