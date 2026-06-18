import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
import * as Location from 'expo-location';

import {
  getPanchangFromAPI,
  normalizePanchangData,
} from '../services/panchangService';
import BhaktiBackButton, { BhaktiBackSpacer } from '../components/BhaktiBackButton';
import BhaktiBottomNav, {
  getBhaktiBottomNavContentPadding,
} from '../components/BhaktiBottomNav';
import { useBhaktiTopPadding } from '../components/BhaktiLayout';

const BG_IMAGE = require('../../assets/horoscope/background/horoscope-bg.png');

const DEVOTIONAL_FONT = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });
const FALLBACK_LOCATION = { latitude: 28.6139, longitude: 77.2090 };

const COLORS = {
  background: '#F7E8BE',
  cardCream: '#FFF7E3',
  cardGoldLight: '#EFD487',
  gold: '#C99416',
  darkGold: '#80520F',
  textDark: '#2B2115',
  textMuted: '#725C38',
  borderGold: 'rgba(201, 148, 22, 0.22)',
  shadow: '#8A5A10',
};

function getDateParts(date) {
  return {
    year: date.getFullYear(),
    month: date.getMonth(),
    day: date.getDate(),
  };
}

function formatHeaderDate(date) {
  const day = date.getDate();
  const month = date.toLocaleDateString('en-GB', { month: 'short' });
  const year = date.getFullYear();
  const weekday = date.toLocaleDateString('en-GB', { weekday: 'long' });
  return `${day} ${month} ${year}, ${weekday}`;
}

function PanchangItem({ icon, label, value }) {
  return (
    <View style={styles.panchangItem}>
      <Text style={styles.panchangIcon}>{icon}</Text>
      <View style={styles.panchangCopy}>
        <Text style={styles.panchangLabel}>{label}</Text>
        <Text style={styles.panchangValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}>
          {value || '-'}
        </Text>
      </View>
    </View>
  );
}

function PanchangInfoRow({ left, right, isLast }) {
  return (
    <View style={[styles.panchangInfoRow, !isLast && styles.panchangInfoRowBorder]}>
      <PanchangItem {...left} />
      <View style={styles.verticalDivider} />
      <PanchangItem {...right} />
    </View>
  );
}

function SectionHeader({ title, actionLabel = 'View All', onPress }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {onPress ? (
        <TouchableOpacity style={styles.sectionAction} activeOpacity={0.8} onPress={onPress}>
          {actionLabel === 'View Calendar' ? <Text style={styles.sectionActionIcon}>{'\u25A3'}</Text> : null}
          <Text style={styles.sectionActionText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export default function CalendarScreen({ navigation }) {
  const { width, height } = useWindowDimensions();
  const topPadding = useBhaktiTopPadding(width, 'title');
  const today = useMemo(() => new Date(), []);
  const dateParts = useMemo(() => getDateParts(today), [today]);
  const [panchang, setPanchang] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [locationLabel, setLocationLabel] = useState('New Delhi, India');
  const [coords, setCoords] = useState(FALLBACK_LOCATION);

  const responsiveStyles = useMemo(() => {
    const compactWidth = Math.min(width, 430);
    const horizontalPadding = 16;
    const contentWidth = Math.max(286, Math.min(width - horizontalPadding * 2, 430));
    const dateBadgeSize = Math.max(88, Math.min(104, compactWidth * 0.25));
    return {
      content: {
        paddingHorizontal: horizontalPadding,
        paddingTop: topPadding,
        paddingBottom: getBhaktiBottomNavContentPadding(height, 94),
      },
      contentWidth,
      dateDashboard: {
        width: contentWidth,
        minHeight: Math.max(118, Math.min(132, height * 0.155)),
      },
      dateBadge: {
        width: dateBadgeSize,
        height: dateBadgeSize,
        borderRadius: dateBadgeSize / 2,
      },
      bottomNav: {
        paddingHorizontal: horizontalPadding,
      },
    };
  }, [height, topPadding, width]);

  useEffect(() => {
    async function loadLocation() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;

        const currentLocation = await Location.getCurrentPositionAsync({});
        const nextCoords = {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        };
        setCoords(nextCoords);

        const place = await Location.reverseGeocodeAsync(nextCoords);
        const name = place?.[0]?.city || place?.[0]?.district || place?.[0]?.region;
        const country = place?.[0]?.country || 'India';
        if (name) setLocationLabel(`${name}, ${country}`);
      } catch (error) {
        console.warn('Panchang Home: location fallback used.', error?.message);
      }
    }

    loadLocation();
  }, []);

  useEffect(() => {
    async function loadPanchang() {
      setLoading(true);
      setErrorMessage(null);

      try {
        const data = await getPanchangFromAPI({
          ...dateParts,
          latitude: coords.latitude,
          longitude: coords.longitude,
          locationName: locationLabel,
          timezone: 'Asia/Kolkata',
          ayanamsa: 'LAHIRI',
        });
        const mappedPanchang = normalizePanchangData(data, dateParts);
        if (typeof __DEV__ === 'undefined' || __DEV__) {
          console.log('[Bhakti Panchang] CalendarScreen received mapped object', mappedPanchang);
        }
        setPanchang(mappedPanchang);
      } catch (error) {
        console.warn('Panchang Home: API failed.', error?.message);
        setErrorMessage('Real Panchang data unavailable. Please try again.');
        setPanchang(normalizePanchangData(null, dateParts));
      } finally {
        setLoading(false);
      }
    }

    loadPanchang();
  }, [coords, dateParts, locationLabel]);

  const panchangRows = panchang ? [
    [
      { label: 'Tithi', value: panchang.tithi, icon: '\u263E' },
      { label: 'Nakshatra', value: panchang.nakshatra, icon: '\u2726' },
    ],
    [
      { label: 'Yoga', value: panchang.yoga, icon: '\u0950' },
      { label: 'Karana', value: panchang.karana, icon: '\u25D2' },
    ],
    [
      { label: 'Paksha', value: panchang.paksha, icon: '\u25D0' },
      { label: 'Maas', value: panchang.masa, icon: '\u273A' },
    ],
    [
      { label: 'Samvat', value: panchang.samvat, icon: '\u2609' },
      { label: 'Ayanamsa', value: panchang.ayanamsa, icon: '\u2191' },
    ],
    [
      { label: 'Ritu', value: panchang.ritu, icon: '\u274B' },
      { label: 'Vaar', value: panchang.vaar, icon: '\u263C' },
    ],
  ] : [];

  const auspiciousMuhurtas = panchang?.muhurtas?.filter((item) => item.type === 'auspicious').slice(1, 4) ?? [];
  const featuredFestival = panchang?.festivals?.[0];
  const monthYear = today.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
  const weekday = today.toLocaleDateString('en-GB', { weekday: 'long' });
  return (
    <ImageBackground source={BG_IMAGE} style={styles.background} resizeMode="cover">
      <View style={styles.overlay} />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={[styles.content, responsiveStyles.content]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.header, { width: responsiveStyles.contentWidth }]}>
            <View style={styles.headerTopRow}>
              <BhaktiBackButton navigation={navigation} />
              <Text style={styles.screenTitle}>Panchang</Text>
              <BhaktiBackSpacer />
            </View>
            <Text style={styles.screenDate}>{formatHeaderDate(today)}</Text>
            <TouchableOpacity style={styles.locationPill} activeOpacity={0.82}>
              <Text style={styles.locationIcon}>{'\u25CE'}</Text>
              <Text style={styles.locationText} numberOfLines={1}>{locationLabel}</Text>
              <Text style={styles.locationArrow}>{'\u2304'}</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.dateDashboard, responsiveStyles.dateDashboard]}>
            <View style={styles.sunColumn}>
              <Text style={styles.sunIcon}>{'\u2600'}</Text>
              <Text style={styles.sunLabel}>Sunrise</Text>
              <Text style={styles.sunTime}>{panchang?.sunrise || '-'}</Text>
            </View>

            <View style={[styles.dateBadge, responsiveStyles.dateBadge]}>
              <Text style={styles.badgeIcon}>{'\u25A3'}</Text>
              <Text style={styles.badgeDay}>{today.getDate()}</Text>
              <Text style={styles.badgeMonth}>{monthYear}</Text>
              <Text style={styles.badgeWeekday}>{weekday}</Text>
            </View>

            <View style={styles.sunColumn}>
              <Text style={styles.sunIcon}>{'\u263D'}</Text>
              <Text style={styles.sunLabel}>Sunset</Text>
              <Text style={styles.sunTime}>{panchang?.sunset || '-'}</Text>
            </View>
          </View>

          <View style={[styles.sectionWrap, { width: responsiveStyles.contentWidth }]}>
            <SectionHeader
              title="Today's Panchang"
              actionLabel="View Calendar"
              onPress={() => navigation.navigate('PanchangCalendar', { selectedDateISO: panchang?.dateISO })}
            />
            <View style={styles.panchangCard}>
              {loading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color={COLORS.gold} />
                  <Text style={styles.loadingText}>Loading Panchang</Text>
                </View>
              ) : (
                <>
                  {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
                  {panchangRows.map((row, index) => (
                    <PanchangInfoRow
                      key={`${row[0].label}-${row[1].label}`}
                      left={row[0]}
                      right={row[1]}
                      isLast={index === panchangRows.length - 1}
                    />
                  ))}
                </>
              )}
            </View>
          </View>

          <View style={[styles.sectionWrap, styles.muhurtaSection, { width: responsiveStyles.contentWidth }]}>
            <SectionHeader title="Today's Muhurta" onPress={() => navigation.navigate('PanchangMuhurtas', { panchang })} />
            <View style={styles.muhurtaRow}>
              {auspiciousMuhurtas.length > 0 ? auspiciousMuhurtas.map((item) => (
                <TouchableOpacity key={item.id} style={styles.muhurtaCard} activeOpacity={0.82}>
                  <Text style={styles.muhurtaIcon}>{item.id === 'abhijit' ? '\u2726' : item.id === 'amrit' ? '\u273A' : '\u2609'}</Text>
                  <Text style={styles.muhurtaName} numberOfLines={2}>{item.name}</Text>
                  <Text style={styles.muhurtaTime} numberOfLines={1}>{item.time}</Text>
                </TouchableOpacity>
              )) : (
                <View style={styles.muhurtaUnavailableCard}>
                  <Text style={styles.muhurtaUnavailableText}>Muhurta data is not included in Phase 1.</Text>
                </View>
              )}
            </View>
          </View>

          <View style={[styles.sectionWrap, styles.festivalSection, { width: responsiveStyles.contentWidth }]}>
            <SectionHeader title="Today's Festivals" onPress={() => navigation.navigate('PanchangFestivals', { panchang })} />
            <TouchableOpacity
              style={styles.festivalCard}
              activeOpacity={0.84}
              onPress={() => navigation.navigate('PanchangFestivals', { panchang })}
            >
              <View style={styles.festivalIconWrap}>
                <Text style={styles.festivalIcon}>{'\u273A'}</Text>
              </View>
              <View style={styles.festivalCopy}>
                <Text style={styles.festivalName} numberOfLines={1}>{featuredFestival?.name || 'Daily Panchang Observance'}</Text>
                <Text style={styles.festivalText} numberOfLines={1}>{featuredFestival?.date || 'Today'} | Tap to view details</Text>
              </View>
              <Text style={styles.festivalArrow}>{'>'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <BhaktiBottomNav
          activeTab="Calendar"
          horizontalPadding={responsiveStyles.bottomNav.paddingHorizontal}
          navigation={navigation}
        />
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
    backgroundColor: 'rgba(247, 232, 190, 0.68)',
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
  header: {
    alignItems: 'center',
  },
  headerTopRow: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
  },
  screenTitle: {
    color: COLORS.textDark,
    fontFamily: DEVOTIONAL_FONT,
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0,
  },
  screenDate: {
    color: COLORS.textMuted,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 1,
  },
  locationPill: {
    minHeight: 32,
    maxWidth: '72%',
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: 16,
    backgroundColor: 'rgba(255, 247, 227, 0.94)',
    borderWidth: 1,
    borderColor: COLORS.borderGold,
    paddingHorizontal: 11,
    marginTop: 6,
  },
  locationIcon: {
    color: COLORS.gold,
    fontSize: 11,
    fontWeight: '900',
    marginRight: 6,
  },
  locationText: {
    color: COLORS.darkGold,
    fontSize: 11,
    fontWeight: '900',
    maxWidth: '88%',
  },
  locationArrow: {
    color: COLORS.darkGold,
    fontSize: 11,
    fontWeight: '900',
    marginLeft: 6,
    marginTop: -4,
  },
  dateDashboard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    backgroundColor: 'rgba(255, 247, 227, 0.9)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.borderGold,
    paddingHorizontal: 10,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  sunColumn: {
    width: '28%',
    alignItems: 'center',
  },
  sunIcon: {
    color: COLORS.gold,
    fontSize: 19,
    fontWeight: '900',
  },
  sunLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '900',
    marginTop: 4,
  },
  sunTime: {
    color: COLORS.textDark,
    fontSize: 11,
    fontWeight: '900',
    marginTop: 3,
    textAlign: 'center',
  },
  dateBadge: {
    backgroundColor: COLORS.cardCream,
    borderWidth: 4,
    borderColor: COLORS.cardGoldLight,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.gold,
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  badgeIcon: {
    color: COLORS.gold,
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 1,
  },
  badgeDay: {
    color: COLORS.textDark,
    fontSize: 26,
    lineHeight: 29,
    fontWeight: '900',
  },
  badgeMonth: {
    color: COLORS.darkGold,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '900',
  },
  badgeWeekday: {
    color: COLORS.textMuted,
    fontSize: 9,
    lineHeight: 11,
    fontWeight: '800',
  },
  sectionWrap: {
    marginTop: 14,
  },
  sectionHeader: {
    minHeight: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 7,
  },
  sectionTitle: {
    color: COLORS.textDark,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '900',
  },
  sectionAction: {
    minHeight: 29,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 15,
    backgroundColor: 'rgba(255, 247, 227, 0.92)',
    borderWidth: 1,
    borderColor: COLORS.borderGold,
    paddingHorizontal: 9,
  },
  sectionActionIcon: {
    color: COLORS.gold,
    fontSize: 11,
    fontWeight: '900',
    marginRight: 5,
  },
  sectionActionText: {
    color: COLORS.darkGold,
    fontSize: 11,
    fontWeight: '900',
  },
  panchangCard: {
    backgroundColor: 'rgba(255, 247, 227, 0.96)',
    borderRadius: 17,
    borderWidth: 1,
    borderColor: COLORS.borderGold,
    paddingHorizontal: 13,
    paddingVertical: 7,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.09,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  loadingRow: {
    minHeight: 160,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: 9,
  },
  loadingText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '800',
  },
  errorText: {
    color: '#A94D3A',
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '800',
    textAlign: 'center',
    paddingVertical: 7,
  },
  panchangInfoRow: {
    minHeight: 37,
    flexDirection: 'row',
    alignItems: 'center',
  },
  panchangInfoRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(201, 148, 22, 0.16)',
  },
  panchangItem: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  panchangIcon: {
    width: 23,
    color: COLORS.gold,
    fontSize: 15,
    fontWeight: '900',
  },
  panchangCopy: {
    flex: 1,
    minWidth: 0,
  },
  panchangLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '800',
  },
  panchangValue: {
    color: COLORS.textDark,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '900',
    marginTop: 1,
  },
  verticalDivider: {
    width: 1,
    height: '62%',
    backgroundColor: 'rgba(201, 148, 22, 0.18)',
    marginHorizontal: 9,
  },
  muhurtaSection: {
    marginTop: 14,
  },
  festivalSection: {
    marginTop: 12,
  },
  muhurtaRow: {
    flexDirection: 'row',
    columnGap: 7,
  },
  muhurtaCard: {
    flex: 1,
    minHeight: 80,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 247, 227, 0.96)',
    borderWidth: 1,
    borderColor: COLORS.borderGold,
    padding: 8,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  muhurtaUnavailableCard: {
    flex: 1,
    minHeight: 58,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 247, 227, 0.96)',
    borderWidth: 1,
    borderColor: COLORS.borderGold,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  muhurtaUnavailableText: {
    color: COLORS.textMuted,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  muhurtaIcon: {
    color: COLORS.gold,
    fontSize: 15,
    fontWeight: '900',
  },
  muhurtaName: {
    color: COLORS.textDark,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '900',
    marginTop: 5,
  },
  muhurtaTime: {
    color: COLORS.textMuted,
    fontSize: 8,
    lineHeight: 11,
    fontWeight: '800',
    marginTop: 4,
  },
  festivalCard: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: 'rgba(255, 247, 227, 0.96)',
    borderWidth: 1,
    borderColor: COLORS.borderGold,
    padding: 9,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.09,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  festivalIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: COLORS.cardGoldLight,
    borderWidth: 1,
    borderColor: COLORS.borderGold,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },
  festivalIcon: {
    color: COLORS.darkGold,
    fontSize: 17,
    fontWeight: '900',
  },
  festivalCopy: {
    flex: 1,
    minWidth: 0,
  },
  festivalName: {
    color: COLORS.textDark,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '900',
  },
  festivalText: {
    color: COLORS.textMuted,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '800',
    marginTop: 1,
  },
  festivalArrow: {
    color: COLORS.gold,
    fontSize: 16,
    fontWeight: '900',
    marginLeft: 8,
  },
});
