import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  StatusBar,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

import {
  getPanchangFromAPI,
  normalizePanchangData,
} from '../services/panchangService';

const BG_IMAGE = require('../../assets/horoscope/background/horoscope-bg.png');
const FALLBACK_LOCATION = { latitude: 28.6139, longitude: 77.2090 };
const DEVOTIONAL_FONT = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

const VIEW_TABS = ['Month', 'Week', 'Day'];
const QUICK_TABS = ['Tithi', 'Nakshatra', 'Yoga', 'Karana', 'More'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getDateParts(date) {
  return {
    year: date.getFullYear(),
    month: date.getMonth(),
    day: date.getDate(),
  };
}

function formatDate(date) {
  return date.toLocaleDateString([], {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function markerForDay(day) {
  if ([4, 11, 13, 15, 26].includes(day)) return ['festival', 'vrat'];
  if ([5, 9, 21].includes(day)) return ['muhurta'];
  if (day % 7 === 0) return ['festival'];
  return [];
}

export default function PanchangCalendarScreen({ navigation, route }) {
  const { width, height } = useWindowDimensions();
  const today = useMemo(() => new Date(), []);
  const initialDate = route?.params?.selectedDateISO
    ? new Date(route.params.selectedDateISO)
    : today;
  const [currentDate, setCurrentDate] = useState(new Date(initialDate.getFullYear(), initialDate.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [calendarView, setCalendarView] = useState('Month');
  const [activeQuickTab, setActiveQuickTab] = useState('Tithi');
  const [selectedPanchang, setSelectedPanchang] = useState(null);
  const [loading, setLoading] = useState(false);

  const responsiveStyles = useMemo(() => {
    const statusTop = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;
    const compactWidth = Math.min(width, 540);
    const horizontalPadding = Math.max(14, Math.min(22, compactWidth * 0.045));
    const contentWidth = Math.max(282, Math.min(width - horizontalPadding * 2, 680));

    return {
      content: {
        paddingHorizontal: horizontalPadding,
        paddingTop: statusTop + Math.max(8, height * 0.012),
        paddingBottom: Math.max(26, height * 0.035),
      },
      contentWidth,
      dateBox: {
        minHeight: Math.max(43, Math.min(52, height * 0.058)),
      },
    };
  }, [height, width]);

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const monthLabel = currentDate.toLocaleDateString([], { month: 'long', year: 'numeric' });
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstWeekday = new Date(currentYear, currentMonth, 1).getDay();
  const selectedParts = getDateParts(selectedDate);

  const visibleDays = useMemo(() => {
    if (calendarView === 'Day') return [selectedDate.getDate()];

    if (calendarView === 'Week') {
      const weekStart = new Date(selectedDate);
      weekStart.setDate(selectedDate.getDate() - selectedDate.getDay());
      return Array.from({ length: 7 }, (_, index) => {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + index);
        return date.getMonth() === currentMonth ? date.getDate() : null;
      });
    }

    return [
      ...Array(firstWeekday).fill(null),
      ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
    ];
  }, [calendarView, currentMonth, daysInMonth, firstWeekday, selectedDate]);

  useEffect(() => {
    async function loadSelectedPanchang() {
      setLoading(true);

      try {
        const dateParts = getDateParts(selectedDate);
        const data = await getPanchangFromAPI({
          ...dateParts,
          latitude: FALLBACK_LOCATION.latitude,
          longitude: FALLBACK_LOCATION.longitude,
        });
        setSelectedPanchang(normalizePanchangData(data, dateParts));
      } catch (error) {
        console.warn('Panchang Calendar: selected date fetch failed.', error?.message);
        setSelectedPanchang(normalizePanchangData(null, getDateParts(selectedDate)));
      } finally {
        setLoading(false);
      }
    }

    loadSelectedPanchang();
  }, [selectedDate]);

  const quickRows = selectedPanchang ? {
    Tithi: [{ name: selectedPanchang.tithi, time: `Ends ${selectedPanchang.tithiEnd}` }],
    Nakshatra: [{ name: selectedPanchang.nakshatra, time: `Ends ${selectedPanchang.nakshatraEnd}` }],
    Yoga: [{ name: selectedPanchang.yoga, time: 'Active through the day' }],
    Karana: [{ name: selectedPanchang.karana, time: 'Changes with tithi phase' }],
    More: [
      { name: 'Sunrise', time: selectedPanchang.sunrise },
      { name: 'Sunset', time: selectedPanchang.sunset },
      { name: 'Rahu Kaal', time: selectedPanchang.rahuKaal },
    ],
  } : {};

  const goMonth = (offset) => {
    setCurrentDate(new Date(currentYear, currentMonth + offset, 1));
  };

  const selectDay = (day) => {
    if (!day) return;
    setSelectedDate(new Date(currentYear, currentMonth, day));
  };

  return (
    <ImageBackground source={BG_IMAGE} style={styles.background} resizeMode="cover">
      <View style={styles.overlay} />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={[styles.content, responsiveStyles.content]} showsVerticalScrollIndicator={false}>
          <View style={[styles.header, { width: responsiveStyles.contentWidth }]}>
            <TouchableOpacity style={styles.iconButton} activeOpacity={0.78} onPress={() => navigation.goBack()}>
              <Text style={styles.iconText}>{'<'}</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Panchang Calendar</Text>
            <TouchableOpacity style={styles.iconButton} activeOpacity={0.78}>
              <Text style={styles.filterIcon}>{'\u2699'}</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.tabs, { width: responsiveStyles.contentWidth }]}>
            {VIEW_TABS.map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tabButton, calendarView === tab && styles.tabButtonActive]}
                activeOpacity={0.8}
                onPress={() => setCalendarView(tab)}
              >
                <Text style={[styles.tabText, calendarView === tab && styles.tabTextActive]}>{tab}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={[styles.calendarCard, { width: responsiveStyles.contentWidth }]}>
            <View style={styles.monthRow}>
              <TouchableOpacity style={styles.monthButton} activeOpacity={0.78} onPress={() => goMonth(-1)}>
                <Text style={styles.monthButtonText}>{'<'}</Text>
              </TouchableOpacity>
              <Text style={styles.monthTitle}>{monthLabel}</Text>
              <TouchableOpacity style={styles.monthButton} activeOpacity={0.78} onPress={() => goMonth(1)}>
                <Text style={styles.monthButtonText}>{'>'}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.weekRow}>
              {WEEKDAYS.map((day) => (
                <Text key={day} style={styles.weekText}>{day}</Text>
              ))}
            </View>

            <View style={styles.daysGrid}>
              {visibleDays.map((day, index) => {
                const date = day ? new Date(currentYear, currentMonth, day) : null;
                const isToday = date
                  && date.getDate() === today.getDate()
                  && date.getMonth() === today.getMonth()
                  && date.getFullYear() === today.getFullYear();
                const isSelected = day
                  && day === selectedParts.day
                  && currentMonth === selectedParts.month
                  && currentYear === selectedParts.year;
                const markers = day ? markerForDay(day) : [];

                return (
                  <TouchableOpacity
                    key={`${day || 'empty'}-${index}`}
                    style={[styles.dateBox, responsiveStyles.dateBox]}
                    activeOpacity={day ? 0.78 : 1}
                    onPress={() => selectDay(day)}
                  >
                    {day ? (
                      <>
                        <View style={[styles.dateCircle, isToday && styles.todayCircle, isSelected && styles.selectedCircle]}>
                          <Text style={[styles.dateText, isSelected && styles.selectedDateText]}>{day}</Text>
                        </View>
                        <View style={styles.markerRow}>
                          {markers.map((marker) => <View key={marker} style={[styles.markerDot, styles[`${marker}Dot`]]} />)}
                        </View>
                      </>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={[styles.detailCard, { width: responsiveStyles.contentWidth }]}>
            <View style={styles.detailHeader}>
              <View>
                <Text style={styles.detailDate}>{formatDate(selectedDate)}</Text>
                <Text style={styles.detailSubtitle}>
                  {selectedPanchang ? `${selectedPanchang.paksha} | ${selectedPanchang.tithi} | ${selectedPanchang.masa}` : 'Loading Panchang'}
                </Text>
              </View>
              {loading ? <ActivityIndicator size="small" color="#B87918" /> : null}
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickTabs}>
              {QUICK_TABS.map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={[styles.quickTab, activeQuickTab === tab && styles.quickTabActive]}
                  activeOpacity={0.78}
                  onPress={() => setActiveQuickTab(tab)}
                >
                  <Text style={[styles.quickTabText, activeQuickTab === tab && styles.quickTabTextActive]}>{tab}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {(quickRows[activeQuickTab] || []).map((row) => (
              <TouchableOpacity
                key={`${row.name}-${row.time}`}
                style={styles.detailRow}
                activeOpacity={0.8}
                onPress={() => activeQuickTab === 'Tithi' && navigation.navigate('TithiDetail', { panchang: selectedPanchang })}
              >
                <Text style={styles.detailRowName}>{row.name}</Text>
                <Text style={styles.detailRowTime}>{row.time}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.primaryButton}
              activeOpacity={0.84}
              onPress={() => navigation.navigate('TithiDetail', { panchang: selectedPanchang })}
            >
              <Text style={styles.primaryButtonText}>View Full Panchang</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 247, 228, 0.76)',
  },
  safeArea: { flex: 1 },
  content: { alignItems: 'center' },
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
  iconText: {
    color: '#5C3A0E',
    fontSize: 22,
    fontWeight: '900',
  },
  filterIcon: {
    color: '#8A520B',
    fontSize: 15,
    fontWeight: '900',
  },
  headerTitle: {
    flex: 1,
    color: '#3F2713',
    fontFamily: DEVOTIONAL_FONT,
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 250, 239, 0.86)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(216, 177, 92, 0.45)',
    padding: 4,
    marginTop: 11,
  },
  tabButton: {
    flex: 1,
    minHeight: 34,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#F3D27D',
  },
  tabText: {
    color: '#8A6425',
    fontSize: 12,
    fontWeight: '900',
  },
  tabTextActive: {
    color: '#3F2713',
  },
  calendarCard: {
    marginTop: 12,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 250, 239, 0.97)',
    borderWidth: 1,
    borderColor: 'rgba(216, 177, 92, 0.46)',
    padding: 12,
    shadowColor: '#7A552A',
    shadowOpacity: 0.11,
    shadowRadius: 11,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  monthRow: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  monthButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFF1C5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthButtonText: {
    color: '#8A520B',
    fontSize: 19,
    fontWeight: '900',
  },
  monthTitle: {
    color: '#3F2713',
    fontSize: 17,
    fontWeight: '900',
  },
  weekRow: {
    flexDirection: 'row',
    paddingBottom: 7,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(216, 177, 92, 0.35)',
  },
  weekText: {
    width: '14.28%',
    color: '#8A6425',
    fontSize: 10,
    fontWeight: '900',
    textAlign: 'center',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingTop: 5,
  },
  dateBox: {
    width: '14.28%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayCircle: {
    borderWidth: 1.3,
    borderColor: '#B87918',
    backgroundColor: '#FFF8E8',
  },
  selectedCircle: {
    backgroundColor: '#C58C1B',
  },
  dateText: {
    color: '#3F2713',
    fontSize: 13,
    fontWeight: '900',
  },
  selectedDateText: {
    color: '#FFF8E8',
  },
  markerRow: {
    minHeight: 5,
    flexDirection: 'row',
    columnGap: 2,
    marginTop: 2,
  },
  markerDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  festivalDot: { backgroundColor: '#B87918' },
  vratDot: { backgroundColor: '#B85B4B' },
  muhurtaDot: { backgroundColor: '#6F8F45' },
  detailCard: {
    marginTop: 12,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 250, 239, 0.97)',
    borderWidth: 1,
    borderColor: 'rgba(216, 177, 92, 0.46)',
    padding: 13,
    shadowColor: '#7A552A',
    shadowOpacity: 0.11,
    shadowRadius: 11,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    columnGap: 10,
  },
  detailDate: {
    color: '#3F2713',
    fontSize: 17,
    fontWeight: '900',
  },
  detailSubtitle: {
    color: '#8A6425',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 3,
  },
  quickTabs: {
    paddingVertical: 10,
    columnGap: 6,
  },
  quickTab: {
    minHeight: 30,
    borderRadius: 15,
    backgroundColor: '#FFF1C5',
    borderWidth: 1,
    borderColor: 'rgba(216, 168, 63, 0.42)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    marginRight: 6,
  },
  quickTabActive: {
    backgroundColor: '#F3D27D',
    borderColor: '#D0A23A',
  },
  quickTabText: {
    color: '#8A6425',
    fontSize: 11,
    fontWeight: '900',
  },
  quickTabTextActive: {
    color: '#3F2713',
  },
  detailRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 15,
    backgroundColor: '#FFF6DF',
    borderWidth: 1,
    borderColor: 'rgba(216, 177, 92, 0.34)',
    paddingHorizontal: 11,
    marginBottom: 8,
    columnGap: 12,
  },
  detailRowName: {
    flex: 1,
    minWidth: 0,
    color: '#3F2713',
    fontSize: 13,
    fontWeight: '900',
  },
  detailRowTime: {
    color: '#8A6425',
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'right',
  },
  primaryButton: {
    minHeight: 41,
    borderRadius: 21,
    backgroundColor: '#C58C1B',
    borderWidth: 1,
    borderColor: '#F1CA6B',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 3,
  },
  primaryButtonText: {
    color: '#FFF8E8',
    fontSize: 13,
    fontWeight: '900',
  },
});
