import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { getPanchangFromAPI } from '../services/panchangService';
import { useLanguage } from '../context/LanguageContext';

const TITHIS = [
  'Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami',
  'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami',
  'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi', 'Purnima',
  'Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami',
  'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami',
  'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi', 'Amavasya',
];

function getTithiForDate(day) {
  return TITHIS[(day - 1) % TITHIS.length];
}

function getCalendarMarkersForDay(day) {
  const tithi = getTithiForDate(day);
  const markers = ['shubh'];

  if (['Ekadashi', 'Purnima', 'Amavasya', 'Chaturthi', 'Trayodashi'].includes(tithi)) {
    markers.push('festival');
  }

  if (['Ekadashi', 'Chaturthi', 'Trayodashi'].includes(tithi)) {
    markers.push('fast');
  }

  return markers;
}

function formatLocalizedDate(date, months, weekdaysShort) {
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}, ${weekdaysShort[date.getDay()]}`;
}

function getFallbackLocation(location) {
  return location || { latitude: 28.6139, longitude: 77.2090 };
}

function PanchangDetailItem({ icon, label, value, tone }) {
  return (
    <View style={styles.detailItem}>
      <Text style={[styles.detailIcon, tone === 'softRed' && styles.softRedText]}>{icon}</Text>
      <View style={styles.detailCopy}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue} numberOfLines={1}>{value || '—'}</Text>
      </View>
    </View>
  );
}

function SheetDetailItem({ label, value }) {
  return (
    <View style={styles.sheetDetailItem}>
      <Text style={styles.sheetDetailLabel}>{label}</Text>
      <Text style={styles.sheetDetailValue} numberOfLines={2}>{value || '—'}</Text>
    </View>
  );
}

export default function CalendarScreen() {
  const { t } = useLanguage();
  const today = new Date();
  const todayDay = today.getDate();
  const todayMonth = today.getMonth();
  const todayYear = today.getFullYear();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [panchangData, setPanchangData] = useState(null);
  const [todayPanchang, setTodayPanchang] = useState(null);
  const [loading, setLoading] = useState(false);
  const [todayLoading, setTodayLoading] = useState(true);
  const [location, setLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState(t('loading'));
  const [cityName, setCityName] = useState('');
  const [bookmarkedDates, setBookmarkedDates] = useState([]);
  const [isSheetVisible, setIsSheetVisible] = useState(false);
  const sheetAnim = useRef(new Animated.Value(0)).current;

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const months = t('months');
  const weekdaysShort = t('weekdaysShort');
  const monthName = months[currentMonth];
  const isViewingCurrentMonth = currentMonth === todayMonth && currentYear === todayYear;
  const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
  const datesArray = Array(totalDays).fill(0).map((_, index) => index + 1);
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const emptySlots = Array(firstDayOfMonth).fill(null);

  function valueOrNone(value) {
    return value && value !== 'None' ? value : t('none');
  }

  function openBottomSheet() {
    sheetAnim.setValue(0);
    setIsSheetVisible(true);
    Animated.timing(sheetAnim, {
      toValue: 1,
      duration: 240,
      useNativeDriver: true,
    }).start();
  }

  function closeBottomSheet() {
    Animated.timing(sheetAnim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(() => setIsSheetVisible(false));
  }

  async function saveDate() {
    if (!selectedDate) return;

    const dateStr = `${currentYear}-${currentMonth + 1}-${selectedDate}`;
    if (bookmarkedDates.includes(dateStr)) return;

    const newBookmarks = [...bookmarkedDates, dateStr];
    setBookmarkedDates(newBookmarks);

    try {
      await AsyncStorage.setItem('bookmarks', JSON.stringify(newBookmarks));
    } catch (e) {
      console.error('Failed to save bookmark:', e);
    }
  }

  async function fetchPanchangForDate({ year, month, day }) {
    const { latitude, longitude } = getFallbackLocation(location);

    return getPanchangFromAPI({
      year,
      month,
      day,
      latitude,
      longitude,
    });
  }

  function goToPreviousMonth() {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    setSelectedDate(null);
    setPanchangData(null);
    setIsSheetVisible(false);
  }

  function goToNextMonth() {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
    setSelectedDate(null);
    setPanchangData(null);
    setIsSheetVisible(false);
  }

  function goToToday() {
    setCurrentDate(new Date());
    setSelectedDate(null);
    setPanchangData(null);
    setIsSheetVisible(false);
  }

  useEffect(() => {
    async function loadBookmarks() {
      try {
        const savedBookmarks = await AsyncStorage.getItem('bookmarks');
        if (savedBookmarks !== null) {
          setBookmarkedDates(JSON.parse(savedBookmarks));
        }
      } catch (e) {
        console.error('Failed to load bookmarks:', e);
      }
    }

    loadBookmarks();
  }, []);

  useEffect(() => {
    async function fetchLocation() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== 'granted') {
          setLocationStatus(t('locationFallback'));
          return;
        }

        const coords = await Location.getCurrentPositionAsync({});
        const nextLocation = {
          latitude: coords.coords.latitude,
          longitude: coords.coords.longitude,
        };

        setLocation(nextLocation);

        try {
          const place = await Location.reverseGeocodeAsync(nextLocation);
          const name = place?.[0]?.city || place?.[0]?.district || place?.[0]?.region || t('unknownLocation');
          setCityName(name);
        } catch (err) {
          setCityName(t('unknownLocation'));
        }

        setLocationStatus(t('locationReady'));
      } catch (error) {
        setLocationStatus(t('usingFallback'));
      }
    }

    fetchLocation();
  }, []);

  useEffect(() => {
    async function loadTodayPanchang() {
      setTodayLoading(true);

      try {
        const { latitude, longitude } = getFallbackLocation(location);
        const data = await getPanchangFromAPI({
          year: todayYear,
          month: todayMonth,
          day: todayDay,
          latitude,
          longitude,
        });
        setTodayPanchang(data);
      } catch (error) {
        console.warn('CalendarScreen: Today Panchang fetch failed.', error);
      } finally {
        setTodayLoading(false);
      }
    }

    loadTodayPanchang();
  }, [location, todayDay, todayMonth, todayYear]);

  const todayDetails = todayPanchang ? [
    { id: 'tithi', icon: '🌙', label: t('tithi'), value: todayPanchang.tithi },
    { id: 'nakshatra', icon: '⭐', label: t('nakshatra'), value: todayPanchang.nakshatra },
    { id: 'yoga', icon: '🕉️', label: t('yoga'), value: todayPanchang.yoga },
    { id: 'karana', icon: '🪔', label: t('karana'), value: todayPanchang.karana },
    { id: 'paksha', icon: '🌗', label: t('paksha'), value: todayPanchang.paksha },
    { id: 'sunrise', icon: '☀️', label: t('sunrise'), value: todayPanchang.sunrise },
    { id: 'sunset', icon: '🌅', label: t('sunset'), value: todayPanchang.sunset },
    { id: 'rahuKaal', icon: '⚠️', label: t('rahuKaal'), value: todayPanchang.rahuKaal, tone: 'softRed' },
    { id: 'shubhMuhurat', icon: '🕒', label: t('shubhMuhurat'), value: todayPanchang.shubhMuhurat },
  ] : [];

  const selectedDateObject = selectedDate
    ? new Date(currentYear, currentMonth, selectedDate)
    : null;

  const sheetTranslateY = sheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [420, 0],
  });

  const sheetDetails = panchangData ? [
    { id: 'tithi', label: t('tithi'), value: panchangData.tithi },
    { id: 'nakshatra', label: t('nakshatra'), value: panchangData.nakshatra },
    { id: 'yoga', label: t('yoga'), value: panchangData.yoga },
    { id: 'karana', label: t('karana'), value: panchangData.karana },
    { id: 'paksha', label: t('paksha'), value: panchangData.paksha },
    { id: 'sunrise', label: t('sunrise'), value: panchangData.sunrise },
    { id: 'sunset', label: t('sunset'), value: panchangData.sunset },
    { id: 'moonrise', label: t('moonrise'), value: panchangData.moonrise },
    { id: 'moonset', label: t('moonset'), value: panchangData.moonset },
    { id: 'rahuKaal', label: t('rahuKaal'), value: panchangData.rahuKaal },
    { id: 'shubhMuhurat', label: t('shubhMuhurat'), value: panchangData.shubhMuhurat },
  ] : [];

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton}>
            <Text style={styles.iconButtonText}>☰</Text>
          </TouchableOpacity>

          <View style={styles.headerTitleWrap}>
            <Text style={styles.screenTitle}>{t('panchangCalendar')}</Text>
            <Text style={styles.screenSubtitle}>{t('todayPanchang')}</Text>
          </View>

          <TouchableOpacity style={styles.iconButton}>
            <Text style={styles.iconButtonText}>🔔</Text>
          </TouchableOpacity>
        </View>

        {cityName ? (
          <Text style={styles.cityNameText}>📍 {cityName}</Text>
        ) : (
          <Text style={styles.cityNameText}>📍 {locationStatus}</Text>
        )}

        <View style={styles.todayCard}>
          <View style={styles.cardTopRow}>
            <View>
              <Text style={styles.cardEyebrow}>🛕 {t('todayPanchang')}</Text>
              <Text style={styles.todayDateText}>{formatLocalizedDate(today, months, weekdaysShort)}</Text>
            </View>
            <Text style={styles.cardBadge}>🪔</Text>
          </View>

          {todayLoading ? (
            <View style={styles.todayLoading}>
              <ActivityIndicator size="small" color="#B87918" />
              <Text style={styles.loadingText}>{t('loadingPanchang')}</Text>
            </View>
          ) : todayPanchang ? (
            <>
              <Text style={styles.todaySubtitle}>
                {todayPanchang.masa} • {todayPanchang.paksha} • {todayPanchang.tithi}
              </Text>

              <View style={styles.detailGrid}>
                {todayDetails.map((item) => (
                  <PanchangDetailItem
                    key={item.id}
                    icon={item.icon}
                    label={item.label}
                    value={item.value}
                    tone={item.tone}
                  />
                ))}
              </View>
            </>
          ) : (
            <Text style={styles.hintText}>{t('todayPanchang')} {t('unavailableNow')}</Text>
          )}
        </View>

        <View style={styles.calendarCard}>
          <View style={styles.monthNavRow}>
            <TouchableOpacity style={styles.navButton} onPress={goToPreviousMonth}>
              <Text style={styles.navButtonText}>‹</Text>
            </TouchableOpacity>

            <View style={styles.monthTitleWrap}>
              <Text style={styles.monthYearText}>{monthName} {currentYear}</Text>
                          </View>

            <TouchableOpacity style={styles.navButton} onPress={goToNextMonth}>
              <Text style={styles.navButtonText}>›</Text>
            </TouchableOpacity>
          </View>

          {!isViewingCurrentMonth && (
            <TouchableOpacity style={styles.todayButton} onPress={goToToday}>
              <Text style={styles.todayButtonText}>{t('today')}</Text>
            </TouchableOpacity>
          )}

          <View style={styles.weekRow}>
            {weekdaysShort.map((day, index) => (
              <Text key={index} style={styles.weekDayText}>{day}</Text>
            ))}
          </View>

          <View style={styles.datesGrid}>
            {emptySlots.map((_, i) => (
              <View key={`empty-${i}`} style={styles.dateBox} />
            ))}

            {datesArray.map((day) => {
              const markers = getCalendarMarkersForDay(day);
              const isToday = isViewingCurrentMonth && day === todayDay;
              const isSelected = day === selectedDate;
              const isSaved = bookmarkedDates.includes(`${currentYear}-${currentMonth + 1}-${day}`);

              return (
                <TouchableOpacity
                  key={day}
                  style={styles.dateBox}
                  onPress={async () => {
                    setSelectedDate(day);
                    setLoading(true);
                    setPanchangData(null);

                    try {
                      const data = await fetchPanchangForDate({
                        year: currentYear,
                        month: currentMonth,
                        day,
                      });
                      setPanchangData(data);
                      openBottomSheet();
                    } catch (error) {
                      console.warn('CalendarScreen: Panchang fetch failed.', error);
                    } finally {
                      setLoading(false);
                    }
                  }}
                >
                  <View
                    style={[
                      styles.dateCircle,
                      isToday && styles.todayDateCircle,
                      isSelected && styles.selectedDateCircle,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dateNum,
                        isToday && styles.todayDateNum,
                        isSelected && styles.selectedDateNum,
                      ]}
                    >
                      {day}
                    </Text>
                  </View>

                  <View style={styles.markerRow}>
                    {markers.slice(0, 3).map((marker) => (
                      <View key={marker} style={[styles.markerDot, styles[`${marker}Dot`]]} />
                    ))}
                    {isSaved && <View style={[styles.markerDot, styles.savedDot]} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.markerLegend}>
            <Text style={styles.legendText}><Text style={styles.goldLegend}>*</Text> {t('festival')}</Text>
            <Text style={styles.legendText}><Text style={styles.redLegend}>*</Text> {t('vrat')}</Text>
            <Text style={styles.legendText}><Text style={styles.greenLegend}>*</Text> {t('shubh')}</Text>
          </View>
        </View>

        <View style={styles.selectedInfoBox}>
          <Text style={styles.selectedInfoLabel}>{t('selectedDate')}</Text>
          <Text style={styles.selectedInfoValue}>
            {selectedDate ? `${selectedDate} ${monthName} ${currentYear}` : t('tapDate')}
          </Text>
        </View>

        {loading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color="#B87918" />
            <Text style={styles.loadingText}>{t('loadingPanchang')}</Text>
          </View>
        )}

        {panchangData && (
          <View style={styles.panchangCard}>
            <Text style={styles.panchangTitle}>🪔 {t('panchangDetails')}</Text>
            <View style={styles.panchangDivider} />

            <View style={styles.panchangRow}>
              <Text style={styles.panchangLabel}>{t('tithi')}</Text>
              <Text style={styles.panchangValue}>{panchangData.tithi}</Text>
            </View>

            <View style={styles.panchangRow}>
              <Text style={styles.panchangLabel}>{t('festival')}</Text>
              <Text style={styles.panchangValue}>{panchangData.festival}</Text>
            </View>

            <View style={styles.panchangRow}>
              <Text style={styles.panchangLabel}>🌅 {t('sunrise')}</Text>
              <Text style={styles.panchangValue}>{panchangData.sunrise}</Text>
            </View>

            <View style={styles.panchangRow}>
              <Text style={styles.panchangLabel}>🌇 {t('sunset')}</Text>
              <Text style={styles.panchangValue}>{panchangData.sunset}</Text>
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={saveDate}>
              <Text style={styles.saveButtonText}>☆ {t('saveDate')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {!panchangData && !loading && (
          <View style={styles.locationBanner}>
            <Text style={styles.locationBannerText}>📍 {locationStatus}</Text>
          </View>
        )}

        {bookmarkedDates.length > 0 && (
          <View style={styles.savedDatesContainer}>
            <Text style={styles.savedDatesTitle}>{t('savedDates')}</Text>
            {bookmarkedDates.map((savedDate, index) => (
              <Text key={index} style={styles.savedDateItem}>• {savedDate}</Text>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={isSheetVisible}
        transparent
        animationType="none"
        onRequestClose={closeBottomSheet}
      >
        <View style={styles.sheetModalRoot}>
          <TouchableOpacity
            activeOpacity={1}
            style={styles.sheetBackdrop}
            onPress={closeBottomSheet}
          />

          <Animated.View
            style={[
              styles.bottomSheet,
              { transform: [{ translateY: sheetTranslateY }] },
            ]}
          >
            <View style={styles.sheetHandle} />
            <TouchableOpacity style={styles.sheetCloseButton} onPress={closeBottomSheet}>
              <Text style={styles.sheetCloseText}>×</Text>
            </TouchableOpacity>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.sheetDateTitle}>
                {selectedDateObject ? formatLocalizedDate(selectedDateObject, months, weekdaysShort) : '—'}
              </Text>
              <Text style={styles.sheetSubtitle}>
                {panchangData?.masa || '—'} {panchangData?.paksha || '—'}, {panchangData?.tithi || '?'} {t('tithi')}
              </Text>

              <View style={styles.sheetDetailGrid}>
                {sheetDetails.map((item) => (
                  <SheetDetailItem key={item.id} label={item.label} value={item.value} />
                ))}
              </View>

              <View style={styles.sheetSection}>
                <Text style={styles.sheetSectionTitle}>{t('festival')} / {t('vrat')}</Text>
                <View style={styles.sheetInfoRow}>
                  <Text style={styles.sheetInfoLabel}>{t('festival')}</Text>
                  <Text style={styles.sheetInfoValue}>{valueOrNone(panchangData?.festival)}</Text>
                </View>
                <View style={styles.sheetInfoRow}>
                  <Text style={styles.sheetInfoLabel}>{t('vratUpvas')}</Text>
                  <Text style={styles.sheetInfoValue}>{valueOrNone(panchangData?.fast)}</Text>
                </View>
              </View>

              <View style={styles.suggestionCard}>
                <View style={styles.suggestionCopy}>
                  <Text style={styles.suggestionLabel}>{t('todayPuja')}</Text>
                  <Text style={styles.suggestionTitle}>{panchangData?.recommendedPuja || '—'}</Text>
                  <Text style={styles.suggestionText}>{panchangData?.importance || '—'}</Text>
                </View>
                <Text style={styles.suggestionIcon}>🪔</Text>
              </View>

              <View style={styles.mantraCard}>
                <View style={styles.suggestionCopy}>
                  <Text style={styles.suggestionLabel}>{t('todayMantra')}</Text>
                  <Text style={styles.mantraText}>{panchangData?.recommendedMantra || '—'}</Text>
                  <Text style={styles.suggestionText}>{panchangData?.mantraMeaning || '—'}</Text>
                </View>
                <TouchableOpacity
                  style={styles.speakerButton}
                  onPress={() => console.log('Mantra audio placeholder:', panchangData?.recommendedMantra)}
                >
                  <Text style={styles.speakerButtonText}>🔊</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.sheetActions}>
                <TouchableOpacity
                  style={styles.primarySheetButton}
                  onPress={() => console.log('Start puja:', panchangData?.recommendedDeityId)}
                >
                  <Text style={styles.primarySheetButtonText}>{t('startPuja')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.secondarySheetButton}
                  onPress={() => console.log('Read mantra:', panchangData?.recommendedMantra)}
                >
                  <Text style={styles.secondarySheetButtonText}>{t('readMantra')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.secondarySheetButton}
                  onPress={() => console.log('Set reminder:', panchangData?.dateISO)}
                >
                  <Text style={styles.secondarySheetButtonText}>{t('setReminder')}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8EFD8',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 36,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFF8E8',
    borderWidth: 1,
    borderColor: '#E8D3A2',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8A6A3F',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  iconButtonText: {
    color: '#4B2E16',
    fontSize: 19,
    fontWeight: '700',
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  screenTitle: {
    color: '#4B2E16',
    fontSize: 22,
    fontWeight: '800',
  },
  screenSubtitle: {
    color: '#B87918',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  cityNameText: {
    color: '#8A6A3F',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  todayCard: {
    backgroundColor: '#FFF8E8',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E8D3A2',
    shadowColor: '#8A6A3F',
    shadowOpacity: 0.14,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    marginBottom: 16,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardEyebrow: {
    color: '#B87918',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  todayDateText: {
    color: '#4B2E16',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 6,
  },
  cardBadge: {
    fontSize: 30,
  },
  todaySubtitle: {
    color: '#8A6A3F',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 14,
  },
  todayLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 18,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  detailItem: {
    width: '48%',
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFDF6',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#F1DFB5',
  },
  detailIcon: {
    width: 25,
    fontSize: 16,
  },
  detailCopy: {
    flex: 1,
  },
  detailLabel: {
    color: '#8A6A3F',
    fontSize: 11,
    fontWeight: '700',
  },
  detailValue: {
    color: '#4B2E16',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  softRedText: {
    color: '#A94D3A',
  },
  calendarCard: {
    backgroundColor: '#FFF8E8',
    borderRadius: 22,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E8D3A2',
    shadowColor: '#8A6A3F',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
    marginBottom: 18,
  },
  monthNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8EFD8',
    borderWidth: 1,
    borderColor: '#E8D3A2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonText: {
    color: '#B87918',
    fontSize: 28,
    fontWeight: '600',
    lineHeight: 30,
  },
  monthTitleWrap: {
    alignItems: 'center',
  },
  monthYearText: {
    color: '#4B2E16',
    fontSize: 18,
    fontWeight: '800',
  },
  monthHindiText: {
    color: '#8A6A3F',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  todayButton: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: '#FFFDF6',
    borderWidth: 1,
    borderColor: '#E8D3A2',
    marginBottom: 12,
  },
  todayButtonText: {
    color: '#B87918',
    fontSize: 12,
    fontWeight: '800',
  },
  weekRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E8D3A2',
    paddingBottom: 8,
    marginBottom: 8,
  },
  weekDayText: {
    width: '14.28%',
    textAlign: 'center',
    color: '#8A6A3F',
    fontSize: 11,
    fontWeight: '800',
  },
  datesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dateBox: {
    width: '14.28%',
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
  },
  dateCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayDateCircle: {
    borderWidth: 1.5,
    borderColor: '#B87918',
    backgroundColor: '#FFFDF6',
  },
  selectedDateCircle: {
    backgroundColor: '#B87918',
    shadowColor: '#B87918',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  dateNum: {
    color: '#4B2E16',
    fontSize: 14,
    fontWeight: '800',
  },
  todayDateNum: {
    color: '#B87918',
  },
  selectedDateNum: {
    color: '#FFF8E8',
  },
  markerRow: {
    flexDirection: 'row',
    gap: 2,
    minHeight: 5,
    marginTop: 3,
  },
  markerDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  festivalDot: {
    backgroundColor: '#B87918',
  },
  fastDot: {
    backgroundColor: '#B85B4B',
  },
  shubhDot: {
    backgroundColor: '#6F8F45',
  },
  savedDot: {
    backgroundColor: '#9A907A',
  },
  markerLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
    paddingTop: 10,
  },
  legendText: {
    color: '#8A6A3F',
    fontSize: 11,
    fontWeight: '700',
  },
  goldLegend: {
    color: '#B87918',
  },
  redLegend: {
    color: '#B85B4B',
  },
  greenLegend: {
    color: '#6F8F45',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    color: '#4B2E16',
    fontSize: 18,
    fontWeight: '800',
  },
  sectionLink: {
    color: '#B87918',
    fontSize: 12,
    fontWeight: '800',
  },
  festivalList: {
    gap: 12,
    paddingRight: 8,
    paddingBottom: 4,
  },
  festivalPreviewCard: {
    width: 148,
    backgroundColor: '#FFF8E8',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E8D3A2',
    shadowColor: '#8A6A3F',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  festivalPreviewIcon: {
    fontSize: 26,
    marginBottom: 8,
  },
  festivalPreviewName: {
    color: '#4B2E16',
    fontSize: 15,
    fontWeight: '800',
  },
  festivalPreviewDate: {
    color: '#8A6A3F',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 5,
  },
  festivalPreviewLabel: {
    color: '#B87918',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 8,
  },
  selectedInfoBox: {
    marginTop: 16,
    backgroundColor: '#FFF8E8',
    padding: 15,
    borderRadius: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8D3A2',
  },
  selectedInfoLabel: {
    color: '#8A6A3F',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  selectedInfoValue: {
    color: '#4B2E16',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 4,
  },
  panchangCard: {
    backgroundColor: '#FFF8E8',
    padding: 18,
    marginTop: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8D3A2',
    shadowColor: '#8A6A3F',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  panchangTitle: {
    color: '#4B2E16',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
  },
  panchangDivider: {
    height: 1,
    backgroundColor: '#E8D3A2',
    marginBottom: 8,
  },
  panchangRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1DFB5',
    gap: 12,
  },
  panchangLabel: {
    color: '#8A6A3F',
    fontSize: 13,
    fontWeight: '700',
  },
  panchangValue: {
    flex: 1,
    color: '#4B2E16',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'right',
  },
  saveButton: {
    backgroundColor: '#B87918',
    paddingVertical: 11,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 14,
  },
  saveButtonText: {
    color: '#FFF8E8',
    fontSize: 13,
    fontWeight: '800',
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 16,
  },
  loadingText: {
    color: '#8A6A3F',
    fontSize: 13,
    fontWeight: '700',
  },
  locationBanner: {
    marginTop: 14,
    backgroundColor: '#FFF8E8',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8D3A2',
  },
  locationBannerText: {
    color: '#8A6A3F',
    fontSize: 12,
    fontWeight: '700',
  },
  hintText: {
    color: '#8A6A3F',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 14,
  },
  savedDatesContainer: {
    marginTop: 16,
    backgroundColor: '#FFF8E8',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E8D3A2',
  },
  savedDatesTitle: {
    color: '#B87918',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  savedDateItem: {
    color: '#4B2E16',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 5,
  },
  sheetModalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(75, 46, 22, 0.28)',
  },
  bottomSheet: {
    maxHeight: '86%',
    backgroundColor: '#FFF8E8',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 24,
    borderWidth: 1,
    borderColor: '#E8D3A2',
    shadowColor: '#4B2E16',
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -6 },
    elevation: 10,
  },
  sheetHandle: {
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#D8BE82',
    alignSelf: 'center',
    marginBottom: 12,
  },
  sheetCloseButton: {
    position: 'absolute',
    top: 12,
    right: 16,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F8EFD8',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  sheetCloseText: {
    color: '#8A6A3F',
    fontSize: 22,
    lineHeight: 24,
    fontWeight: '700',
  },
  sheetDateTitle: {
    color: '#4B2E16',
    fontSize: 21,
    fontWeight: '900',
    paddingRight: 36,
  },
  sheetSubtitle: {
    color: '#B87918',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 6,
    marginBottom: 14,
  },
  sheetDetailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  sheetDetailItem: {
    width: '48%',
    minHeight: 58,
    backgroundColor: '#FFFDF6',
    borderRadius: 14,
    paddingHorizontal: 11,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#F1DFB5',
  },
  sheetDetailLabel: {
    color: '#8A6A3F',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 3,
  },
  sheetDetailValue: {
    color: '#4B2E16',
    fontSize: 13,
    fontWeight: '800',
  },
  sheetSection: {
    marginTop: 16,
    backgroundColor: '#FFFDF6',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F1DFB5',
  },
  sheetSectionTitle: {
    color: '#4B2E16',
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 8,
  },
  sheetInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 12,
  },
  sheetInfoLabel: {
    color: '#8A6A3F',
    fontSize: 13,
    fontWeight: '700',
  },
  sheetInfoValue: {
    flex: 1,
    color: '#4B2E16',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'right',
  },
  suggestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    backgroundColor: '#F8EFD8',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E8D3A2',
  },
  suggestionCopy: {
    flex: 1,
  },
  suggestionLabel: {
    color: '#B87918',
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 4,
  },
  suggestionTitle: {
    color: '#4B2E16',
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 5,
  },
  suggestionText: {
    color: '#8A6A3F',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
  },
  suggestionIcon: {
    fontSize: 34,
    marginLeft: 12,
  },
  mantraCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: '#FFFDF6',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F1DFB5',
  },
  mantraText: {
    color: '#4B2E16',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 5,
  },
  speakerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8EFD8',
    borderWidth: 1,
    borderColor: '#E8D3A2',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  speakerButtonText: {
    fontSize: 18,
  },
  sheetActions: {
    marginTop: 16,
    gap: 9,
    paddingBottom: 6,
  },
  primarySheetButton: {
    backgroundColor: '#B87918',
    paddingVertical: 13,
    borderRadius: 16,
    alignItems: 'center',
  },
  primarySheetButtonText: {
    color: '#FFF8E8',
    fontSize: 15,
    fontWeight: '900',
  },
  secondarySheetButton: {
    backgroundColor: '#FFFDF6',
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8D3A2',
  },
  secondarySheetButtonText: {
    color: '#B87918',
    fontSize: 14,
    fontWeight: '900',
  },
});
