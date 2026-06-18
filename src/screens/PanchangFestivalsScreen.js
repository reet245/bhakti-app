import {
  ImageBackground,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

import { normalizePanchangData } from '../services/panchangService';
import BhaktiBackButton, { BhaktiBackSpacer } from '../components/BhaktiBackButton';
import { useBhaktiTopPadding } from '../components/BhaktiLayout';

const BG_IMAGE = require('../../assets/horoscope/background/horoscope-bg.png');
const DEVOTIONAL_FONT = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

const UPCOMING_FESTIVALS = [
  {
    id: 'nirjala-ekadashi',
    name: 'Nirjala Ekadashi',
    date: 'Upcoming',
    icon: '\u273A',
    description: 'A sacred Ekadashi vrat dedicated to Vishnu bhakti and discipline.',
  },
  {
    id: 'pradosh-vrat',
    name: 'Pradosh Vrat',
    date: 'Upcoming',
    icon: '\u263D',
    description: 'An evening vrat observed with prayers to Shiv Ji.',
  },
  {
    id: 'sankashti-chaturthi',
    name: 'Sankashti Chaturthi',
    date: 'Upcoming',
    icon: '\u0950',
    description: 'A Ganesh Ji vrat for obstacle removal and blessings.',
  },
  {
    id: 'ganga-dussehra',
    name: 'Ganga Dussehra',
    date: 'Upcoming',
    icon: '\u2609',
    description: 'A holy observance honoring Maa Ganga and purification.',
  },
];

function getTodayParts() {
  const today = new Date();
  return { year: today.getFullYear(), month: today.getMonth(), day: today.getDate() };
}

export default function PanchangFestivalsScreen({ navigation, route }) {
  const { width } = useWindowDimensions();
  const topPadding = useBhaktiTopPadding(width, 'title');
  const panchang = normalizePanchangData(route?.params?.panchang, getTodayParts());
  const featuredFestival = panchang.festivals?.[0] || UPCOMING_FESTIVALS[0];
  const contentWidth = Math.max(282, Math.min(width - Math.max(28, width * 0.09), 660));

  return (
    <ImageBackground source={BG_IMAGE} style={styles.background} resizeMode="cover">
      <View style={styles.overlay} />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={[styles.content, { width: contentWidth, paddingTop: topPadding }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <BhaktiBackButton navigation={navigation} />
            <Text style={styles.headerTitle}>Today's Festivals</Text>
            <BhaktiBackSpacer />
          </View>

          <View style={styles.featuredCard}>
            <View style={styles.featuredImage}>
              <View style={styles.featuredGlow} />
              <Text style={styles.featuredIcon}>{featuredFestival.icon || '\u273A'}</Text>
            </View>
            <Text style={styles.featuredName}>{featuredFestival.name}</Text>
            <Text style={styles.featuredDate}>{featuredFestival.date || panchang.dateLabel}</Text>
            <Text style={styles.featuredDescription}>{featuredFestival.description}</Text>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Festivals</Text>
          </View>

          {UPCOMING_FESTIVALS.map((festival) => (
            <View key={festival.id} style={styles.festivalRow}>
              <View style={styles.festivalIconWrap}>
                <Text style={styles.festivalIcon}>{festival.icon}</Text>
              </View>
              <View style={styles.festivalCopy}>
                <Text style={styles.festivalName}>{festival.name}</Text>
                <Text style={styles.festivalDate}>{festival.date}</Text>
                <Text style={styles.festivalDescription} numberOfLines={2}>{festival.description}</Text>
              </View>
            </View>
          ))}

          <TouchableOpacity style={styles.primaryButton} activeOpacity={0.84} onPress={() => navigation.navigate('UpcomingFestivals')}>
            <Text style={styles.primaryButtonText}>View All Festivals</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255, 247, 228, 0.76)' },
  safeArea: { flex: 1 },
  content: { alignSelf: 'center', paddingBottom: 28 },
  header: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: {
    flex: 1,
    color: '#3F2713',
    fontFamily: DEVOTIONAL_FONT,
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
  },
  featuredCard: {
    alignItems: 'center',
    marginTop: 12,
    borderRadius: 24,
    backgroundColor: '#F4D991',
    borderWidth: 1,
    borderColor: 'rgba(156, 106, 24, 0.25)',
    padding: 16,
    shadowColor: '#9C6420',
    shadowOpacity: 0.16,
    shadowRadius: 13,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
    overflow: 'hidden',
  },
  featuredImage: {
    width: '100%',
    minHeight: 142,
    borderRadius: 20,
    backgroundColor: '#F7E7BD',
    borderWidth: 1,
    borderColor: 'rgba(216, 168, 63, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  featuredGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255, 250, 239, 0.34)',
  },
  featuredIcon: { color: '#8A520B', fontSize: 56, fontWeight: '900' },
  featuredName: { color: '#3F2713', fontSize: 22, fontWeight: '900', textAlign: 'center', marginTop: 12 },
  featuredDate: { color: '#8A6425', fontSize: 12, fontWeight: '900', marginTop: 4 },
  featuredDescription: { color: '#6B461C', fontSize: 13, lineHeight: 19, fontWeight: '800', textAlign: 'center', marginTop: 8 },
  sectionHeader: { marginTop: 14, marginBottom: 8 },
  sectionTitle: { color: '#3F2713', fontSize: 17, fontWeight: '900' },
  festivalRow: {
    minHeight: 86,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 19,
    backgroundColor: 'rgba(255, 250, 239, 0.97)',
    borderWidth: 1,
    borderColor: 'rgba(216, 177, 92, 0.46)',
    padding: 11,
    marginBottom: 10,
    shadowColor: '#7A552A',
    shadowOpacity: 0.1,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  festivalIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: '#F3D27D',
    borderWidth: 1,
    borderColor: '#D0A23A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  festivalIcon: { color: '#7B4D0D', fontSize: 21, fontWeight: '900' },
  festivalCopy: { flex: 1, minWidth: 0 },
  festivalName: { color: '#3F2713', fontSize: 15, fontWeight: '900' },
  festivalDate: { color: '#A36A12', fontSize: 11, fontWeight: '900', marginTop: 2 },
  festivalDescription: { color: '#8A6425', fontSize: 11, lineHeight: 16, fontWeight: '800', marginTop: 2 },
  primaryButton: {
    minHeight: 43,
    borderRadius: 22,
    backgroundColor: '#C58C1B',
    borderWidth: 1,
    borderColor: '#F1CA6B',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 3,
  },
  primaryButtonText: { color: '#FFF8E8', fontSize: 14, fontWeight: '900' },
});
