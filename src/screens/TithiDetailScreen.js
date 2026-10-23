import useDevotionalStyles from '../hooks/useDevotionalStyles';
import { Share, ImageBackground, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';

import { normalizePanchangData } from '../services/panchangService';
import BhaktiBackButton from '../components/BhaktiBackButton';
import { useBhaktiTopPadding } from '../components/BhaktiLayout';

const BG_IMAGE = require('../../assets/horoscope/background/horoscope-bg.png');
const DEVOTIONAL_FONT = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

function getTodayParts() {
  const today = new Date();
  return { year: today.getFullYear(), month: today.getMonth(), day: today.getDate() };
}

export default function TithiDetailScreen({ navigation, route }) {
  const styles = useDevotionalStyles(baseStyles);
  const { width } = useWindowDimensions();
  const topPadding = useBhaktiTopPadding(width, 'title');
  const panchang = normalizePanchangData(route?.params?.panchang, getTodayParts());
  const contentWidth = Math.max(282, Math.min(width - Math.max(28, width * 0.09), 660));

  const auspiciousFor = [
    'Mantra japa and quiet prayer',
    'Lighting a diya at home',
    'Charity, gratitude, and sankalp',
    panchang.recommendedPuja,
  ].filter(Boolean);
  const avoidList = [
    'Rushed decisions during Rahu Kaal',
    'Harsh speech or conflict',
    'Starting important work without checking muhurta',
  ];

  const shareTithi = async () => {
    try {
      await Share.share({
        title: `${panchang.tithi} Tithi`,
        message: `${panchang.tithi} | ${panchang.paksha}\nEnds: ${panchang.tithiEnd}\n${panchang.importance}`,
      });
    } catch (error) {
      console.warn('Tithi share failed:', error?.message);
    }
  };

  return (
    <ImageBackground source={BG_IMAGE} style={styles.background} resizeMode="cover">
      <View style={styles.overlay} />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingTop: topPadding, width: contentWidth }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <BhaktiBackButton navigation={navigation} />
            <Text style={styles.headerTitle}>Tithi Detail</Text>
            <TouchableOpacity style={styles.iconButton} activeOpacity={0.78} onPress={shareTithi}>
              <Text style={styles.shareIcon}>{'\u2197'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.heroCard}>
            <View style={styles.moonHero}>
              <View style={styles.moonShadow} />
              <Text style={styles.moonText}>{panchang.isPurnima ? '\u25CB' : panchang.isAmavasya ? '\u25CF' : '\u25D0'}</Text>
            </View>
            <Text style={styles.tithiName}>{panchang.tithi}</Text>
            <Text style={styles.tithiMeta}>{panchang.paksha} | Ends {panchang.tithiEnd}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>About This Tithi</Text>
            <Text style={styles.bodyText}>{panchang.importance}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>General Devotional Activities</Text>
            <Text style={styles.bodyText}>These are general suggestions; specific tithi suitability and muhurta times have not been calculated.</Text>
            {auspiciousFor.map((item) => (
              <View key={item} style={styles.listRow}>
                <Text style={styles.listIcon}>{'\u273A'}</Text>
                <Text style={styles.listText}>{item}</Text>
              </View>
            ))}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>General Guidance</Text>
            {avoidList.map((item) => (
              <View key={item} style={styles.listRow}>
                <Text style={[styles.listIcon, styles.avoidIcon]}>{'\u25D2'}</Text>
                <Text style={styles.listText}>{item}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.primaryButton} activeOpacity={0.84} onPress={shareTithi}>
            <Text style={styles.primaryButtonText}>Share</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const baseStyles = StyleSheet.create({
  background: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255, 247, 228, 0.76)' },
  safeArea: { flex: 1 },
  content: { alignSelf: 'center', paddingBottom: 28 },
  header: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 250, 239, 0.96)',
    borderWidth: 1,
    borderColor: 'rgba(216, 177, 92, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareIcon: { color: '#8A520B', fontSize: 16, fontWeight: '900' },
  headerTitle: {
    flex: 1,
    color: '#3F2713',
    fontFamily: DEVOTIONAL_FONT,
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
  },
  heroCard: {
    alignItems: 'center',
    marginTop: 12,
    borderRadius: 24,
    backgroundColor: '#F4D991',
    borderWidth: 1,
    borderColor: 'rgba(156, 106, 24, 0.25)',
    padding: 18,
    shadowColor: '#9C6420',
    shadowOpacity: 0.16,
    shadowRadius: 13,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  moonHero: {
    width: 122,
    height: 122,
    borderRadius: 61,
    backgroundColor: '#FFF8E8',
    borderWidth: 2,
    borderColor: '#F1CA6B',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  moonShadow: {
    position: 'absolute',
    right: -18,
    top: 0,
    width: 78,
    height: 122,
    borderRadius: 60,
    backgroundColor: 'rgba(184, 121, 24, 0.16)',
  },
  moonText: { color: '#8A520B', fontSize: 54, fontWeight: '900' },
  tithiName: { color: '#3F2713', fontSize: 25, fontWeight: '900', marginTop: 12, textAlign: 'center' },
  tithiMeta: { color: '#7A5520', fontSize: 12, fontWeight: '900', marginTop: 4, textAlign: 'center' },
  card: {
    marginTop: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 250, 239, 0.97)',
    borderWidth: 1,
    borderColor: 'rgba(216, 177, 92, 0.46)',
    padding: 14,
    shadowColor: '#7A552A',
    shadowOpacity: 0.1,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  sectionTitle: { color: '#3F2713', fontSize: 16, fontWeight: '900', marginBottom: 8 },
  bodyText: { color: '#6B461C', fontSize: 13, lineHeight: 20, fontWeight: '800' },
  listRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 6 },
  listIcon: { width: 22, color: '#A36A12', fontSize: 14, fontWeight: '900', marginTop: 1 },
  avoidIcon: { color: '#A94D3A' },
  listText: { flex: 1, color: '#5C3A0E', fontSize: 13, lineHeight: 18, fontWeight: '800' },
  primaryButton: {
    minHeight: 43,
    borderRadius: 22,
    backgroundColor: '#C58C1B',
    borderWidth: 1,
    borderColor: '#F1CA6B',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  primaryButtonText: { color: '#FFF8E8', fontSize: 14, fontWeight: '900' },
});
