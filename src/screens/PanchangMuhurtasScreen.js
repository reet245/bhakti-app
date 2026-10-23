import useDevotionalStyles from '../hooks/useDevotionalStyles';
import { useMemo, useState } from 'react';
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
const FILTERS = ['All', 'Auspicious', 'Inauspicious'];

function getTodayParts() {
  const today = new Date();
  return { year: today.getFullYear(), month: today.getMonth(), day: today.getDate() };
}

function iconForMuhurtam(item) {
  if (item.type === 'inauspicious') return '\u25D2';
  if (item.id === 'brahma') return '\u2609';
  if (item.id === 'amrit') return '\u273A';
  if (item.id === 'vijay') return '\u2726';
  return '\u0950';
}

export default function PanchangMuhurtasScreen({ navigation, route }) {
  const styles = useDevotionalStyles(baseStyles);
  const { width } = useWindowDimensions();
  const topPadding = useBhaktiTopPadding(width, 'title');
  const [activeFilter, setActiveFilter] = useState('All');
  const panchang = normalizePanchangData(route?.params?.panchang, getTodayParts());
  const contentWidth = Math.max(282, Math.min(width - Math.max(28, width * 0.09), 660));

  const visibleMuhurtas = useMemo(() => {
    if (activeFilter === 'All') return panchang.muhurtas;
    return panchang.muhurtas.filter((item) => item.type === activeFilter.toLowerCase());
  }, [activeFilter, panchang.muhurtas]);

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
            <Text style={styles.headerTitle}>Muhurta</Text>
            <BhaktiBackSpacer />
          </View>
          <Text style={styles.emptyText}>{panchang.dateLabel}{panchang.locationName ? ` · ${panchang.locationName}` : ''}</Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {FILTERS.map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[styles.filterChip, activeFilter === filter && styles.filterChipActive]}
                activeOpacity={0.78}
                onPress={() => setActiveFilter(filter)}
              >
                <Text style={[styles.filterText, activeFilter === filter && styles.filterTextActive]}>{filter}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {visibleMuhurtas.length > 0 ? visibleMuhurtas.map((item) => (
            <View key={item.id} style={styles.muhurtaRow}>
              <View style={[styles.muhurtaIconWrap, item.type === 'inauspicious' && styles.warningIconWrap]}>
                <Text style={[styles.muhurtaIcon, item.type === 'inauspicious' && styles.warningIcon]}>{iconForMuhurtam(item)}</Text>
              </View>
              <View style={styles.muhurtaCopy}>
                <Text style={styles.muhurtaName}>{item.name}</Text>
                <Text style={styles.muhurtaDescription} numberOfLines={2}>{item.description}</Text>
                <Text style={styles.muhurtaTime}>{item.time}</Text>
              </View>
              <View style={[styles.badge, item.type === 'inauspicious' && styles.warningBadge]}>
                <Text style={[styles.badgeText, item.type === 'inauspicious' && styles.warningBadgeText]}>
                  {item.type === 'auspicious' ? 'Shubh' : 'Avoid'}
                </Text>
              </View>
            </View>
          )) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>Muhurta times are unavailable from the current data source. No auspicious or inauspicious periods have been calculated for this date.</Text>
            </View>
          )}
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
  header: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: {
    flex: 1,
    color: '#3F2713',
    fontFamily: DEVOTIONAL_FONT,
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
  },
  filterRow: { paddingVertical: 12 },
  filterChip: {
    minHeight: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 250, 239, 0.96)',
    borderWidth: 1,
    borderColor: 'rgba(216, 177, 92, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    marginRight: 8,
  },
  filterChipActive: { backgroundColor: '#F3D27D', borderColor: '#D0A23A' },
  filterText: { color: '#8A6425', fontSize: 12, fontWeight: '900' },
  filterTextActive: { color: '#3F2713' },
  muhurtaRow: {
    minHeight: 88,
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
  muhurtaIconWrap: {
    width: 45,
    height: 45,
    borderRadius: 16,
    backgroundColor: '#F3D27D',
    borderWidth: 1,
    borderColor: '#D0A23A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  warningIconWrap: { backgroundColor: '#F7DFD4', borderColor: '#D9A28A' },
  muhurtaIcon: { color: '#7B4D0D', fontSize: 20, fontWeight: '900' },
  warningIcon: { color: '#A94D3A' },
  muhurtaCopy: { flex: 1, minWidth: 0 },
  muhurtaName: { color: '#3F2713', fontSize: 15, fontWeight: '900' },
  muhurtaDescription: { color: '#8A6425', fontSize: 11, lineHeight: 16, fontWeight: '800', marginTop: 2 },
  muhurtaTime: { color: '#5C3A0E', fontSize: 12, fontWeight: '900', marginTop: 4 },
  badge: {
    borderRadius: 13,
    backgroundColor: '#FFF1C5',
    borderWidth: 1,
    borderColor: 'rgba(216, 168, 63, 0.55)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginLeft: 8,
  },
  warningBadge: { backgroundColor: '#F7DFD4', borderColor: '#D9A28A' },
  badgeText: { color: '#8A520B', fontSize: 10, fontWeight: '900' },
  warningBadgeText: { color: '#A94D3A' },
  emptyCard: {
    minHeight: 92,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 250, 239, 0.97)',
    borderWidth: 1,
    borderColor: 'rgba(216, 177, 92, 0.46)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
  },
  emptyText: {
    color: '#8A6425',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
});
