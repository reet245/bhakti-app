import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';

// STEP 2: Import expo-location
// "* as Location" means import EVERYTHING from expo-location
// under one name "Location" so we can use Location.requestForegroundPermissionsAsync() etc.
import * as Location from 'expo-location';

// Import AsyncStorage for persistent bookmarks
import AsyncStorage from '@react-native-async-storage/async-storage';

// STEP 1: Import the Panchang service we created in panchangService.js
// Instead of a dummy function living here, the logic now lives in
// its own dedicated file — making this screen clean and focused on UI only.
import { getPanchangFromAPI } from '../services/panchangService';

// ============================================================
// Panchang Helpers — Tithi names and festival mapping
// ============================================================
const TITHIS = [
  'Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami',
  'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami',
  'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi', 'Purnima',
  'Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami',
  'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami',
  'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi', 'Amavasya',
];

// Simulated festivals keyed by "month-day"
const FESTIVALS = {
  '0-1': 'New Year', '0-14': 'Makar Sankranti', '0-26': 'Republic Day',
  '1-14': 'Basant Panchami', '2-14': 'Holi', '2-29': 'Ugadi',
  '3-9': 'Ram Navami', '3-14': 'Ambedkar', '4-1': 'May Day',
  '4-23': 'Buddha Purnima', '5-21': 'Yoga Day',
  '6-17': 'Guru Purnima', '7-15': 'Independence',
  '7-19': 'Janmashtami', '8-7': 'Ganesh Ch.', '8-28': 'Navratri',
  '9-2': 'Gandhi Jayanti', '9-12': 'Dussehra', '9-24': 'Karwa Chauth',
  '9-31': 'Diwali', '10-1': 'Govardhan', '10-14': 'Children Day',
  '11-25': 'Christmas',
};

function getTithiForDate(day) {
  return TITHIS[(day - 1) % 30];
}

function getFestivalForDate(month, day) {
  return FESTIVALS[`${month}-${day}`] || null;
}

// ============================================================
// CalendarScreen
// ============================================================
// This screen shows a calendar grid for the CURRENT month.
// Users can tap any date to select it.
// No external libraries are used — everything is built from scratch.
// ============================================================

export default function CalendarScreen() {

  // ---------------------------------------------------------
  // TODAY: fixed reference so we can highlight the real today
  // ---------------------------------------------------------
  // We capture today once, outside of state, so it never
  // changes as the user navigates months.
  const today = new Date();
  const todayDay   = today.getDate();
  const todayMonth = today.getMonth();
  const todayYear  = today.getFullYear();

  // ---------------------------------------------------------
  // STEP 1: currentDate state — drives which month is shown
  // ---------------------------------------------------------
  // WHY STORE DATE IN STATE?
  //   Previously we used "const today = new Date()" which is
  //   fixed at the moment the component renders and NEVER
  //   changes. To let the user navigate months, we need a
  //   value that CAN change — that means it must be in state.
  //   Every time setCurrentDate() is called, React re-renders
  //   the screen and recalculates the grid for the new month.
  const [currentDate, setCurrentDate] = useState(new Date());

  // Extract month and year from the state-driven date
  // These update automatically whenever currentDate changes
  const currentMonth = currentDate.getMonth();    // 0–11
  const currentYear  = currentDate.getFullYear(); // e.g. 2026

  // ---------------------------------------------------------
  // STEP 4: Month navigation handlers
  // ---------------------------------------------------------
  // HOW THE DATE OBJECT HANDLES MONTH CHANGES AUTOMATICALLY:
  //   new Date(2026, 0)  → January 2026  (month 0)
  //   new Date(2026, -1) → December 2025 (JavaScript wraps back!)
  //   new Date(2026, 12) → January 2027  (JavaScript wraps forward!)
  //
  //   This means we NEVER have to manually check "if month < 0
  //   then go to previous year" — Date handles it for us.

  function goToPreviousMonth() {
    // Create a new Date set to the 1st of the previous month
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    // STEP 6: Clear selection so old date doesn't show in new month
    setSelectedDate(null);
    setPanchangData(null);
  }

  function goToNextMonth() {
    // Create a new Date set to the 1st of the next month
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
    // STEP 6: Clear selection so old date doesn't show in new month
    setSelectedDate(null);
    setPanchangData(null);
  }

  function goToToday() {
    // WHY RESET ALL THREE STATE VALUES?
    //   1. setCurrentDate(new Date()) → jump the grid back to today's month.
    //      Without this, the calendar stays on whatever month the user was
    //      browsing — the grid would NOT change.
    //   2. setSelectedDate(null) → clear any date the user had tapped in a
    //      different month. Keeping it would look wrong (e.g. "31" highlighted
    //      in a month that only has 28 days).
    //   3. setPanchangData(null) → hide the Panchang card that belonged to
    //      the old selection. We don't auto-select today, so no card should show.
    setCurrentDate(new Date());
    setSelectedDate(null);
    setPanchangData(null);
  }

  // ---------------------------------------------------------
  // STEP 7: State for selected date
  // ---------------------------------------------------------
  // null = no date selected yet (cleared on month change too)
  const [selectedDate, setSelectedDate] = useState(null);

  // Filter state — controls visual emphasis on calendar
  const [activeFilter, setActiveFilter] = useState('All');

  // ---------------------------------------------------------
  // STEP 1: New state for Panchang data
  // ---------------------------------------------------------
  // "panchangData" starts as null (nothing to show yet)
  // When user taps a date, we call the service and store
  // the returned object here so the Panchang card appears.
  const [panchangData, setPanchangData] = useState(null);

  // ---------------------------------------------------------
  // STEP 4: Loading state
  // ---------------------------------------------------------
  // "loading" is true while we are waiting for the service
  // to return data (the 500ms mock delay in panchangService).
  // During that time we show "Loading Panchang..." instead
  // of the card, so the user knows something is happening.
  const [loading, setLoading] = useState(false);

  // ---------------------------------------------------------
  // STEP 3: Location state
  // ---------------------------------------------------------
  // "location" stores { latitude, longitude } once we have it.
  // It starts as null — location is not available immediately.
  // "locationStatus" is a string we show to the user so they
  // know what is happening (getting location, denied, ready).
  const [location, setLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('Getting your location...');

  // STEP 2: Create new state for city name
  // This stores the human-readable location (e.g. "New Delhi")
  const [cityName, setCityName] = useState("");

  // ---------------------------------------------------------
  // STEP 1: Bookmark state
  // ---------------------------------------------------------
  // Stores an array of saved date strings like "5 May 2026"
  const [bookmarkedDates, setBookmarkedDates] = useState([]);

  // STEP 3: Save logic
  async function saveDate() {
    if (!selectedDate) return;
    const dateStr = `${selectedDate} ${monthName} ${currentYear}`;
    
    // Prevent duplicates
    if (!bookmarkedDates.includes(dateStr)) {
      const newBookmarks = [...bookmarkedDates, dateStr];
      setBookmarkedDates(newBookmarks);
      
      // Save to device storage
      try {
        await AsyncStorage.setItem('bookmarks', JSON.stringify(newBookmarks));
      } catch (e) {
        console.error("Failed to save bookmark:", e);
      }
    }
  }

  // STEP 4: Load bookmarks on startup
  useEffect(() => {
    async function loadBookmarks() {
      try {
        const savedBookmarks = await AsyncStorage.getItem('bookmarks');
        // Handle empty/null case
        if (savedBookmarks !== null) {
          // Convert the string back into a JavaScript array
          setBookmarkedDates(JSON.parse(savedBookmarks));
        }
      } catch (e) {
        console.error("Failed to load bookmarks:", e);
      }
    }
    
    loadBookmarks();
  }, []); // [] = run once on screen load

  // ---------------------------------------------------------
  // STEP 4: Ask for permission and fetch location
  // ---------------------------------------------------------
  // useEffect runs ONCE when the screen first opens.
  // (The empty array [] at the end means "only run on mount".)
  //
  // WHY WE NEED PERMISSION:
  //   Location is private data. Android and iOS require the app
  //   to ask the user before reading their GPS coordinates.
  //   "Foreground" permission = only while the app is open.
  //
  // WHY WE NEED LATITUDE & LONGITUDE:
  //   The sunrise-sunset.org API calculates times based on
  //   where you are on Earth. Without real coordinates it would
  //   give wrong times (lat=0, lng=0 is in the ocean!).
  useEffect(() => {
    async function fetchLocation() {
      // Ask the user for location permission
      // Returns { status: 'granted' } or { status: 'denied' }
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        // User denied — update message, leave location as null
        setLocationStatus('Location permission denied. Using fallback.');
        return; // stop here, do not try to get coordinates
      }

      // Permission granted — now get the actual GPS coordinates
      // getCurrentPositionAsync() reads the device GPS one time
      const coords = await Location.getCurrentPositionAsync({});

      // Store { latitude, longitude } in state
      // coords.coords gives us the object with lat and lng
      setLocation({
        latitude:  coords.coords.latitude,
        longitude: coords.coords.longitude,
      });

      // STEP 3: Get city from coordinates
      // reverseGeocodeAsync takes lat/lng and returns real-world address details
      try {
        const place = await Location.reverseGeocodeAsync({
          latitude: coords.coords.latitude,
          longitude: coords.coords.longitude,
        });

        // If it found a place, extract the most relevant name
        if (place && place.length > 0) {
          // Different countries/areas return different fields
          // We try city first, then fall back to district or region
          const name = place[0].city || place[0].district || place[0].region || place[0].subregion || 'Unknown Location';
          setCityName(name);
        } else {
          setCityName('Unknown Location');
        }
      } catch (err) {
        // STEP 5: Handle fallback if API fails
        setCityName('Unknown Location');
      }

      setLocationStatus('Location ready ✓');
    }

    fetchLocation();
  }, []); // [] = run only once when screen opens

  // ---------------------------------------------------------
  // STEP 3: Month names array
  // ---------------------------------------------------------
  // JavaScript months are 0-based (January=0, February=1, etc.)
  // We use this array to convert the number to a name
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const monthName = monthNames[currentMonth]; // e.g. "May"

  // ---------------------------------------------------------
  // STEP 4: Days of the week
  // ---------------------------------------------------------
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // ---------------------------------------------------------
  // STEP 5: Generate dates array — now uses currentDate state
  // ---------------------------------------------------------
  // These all read from currentMonth/currentYear which come
  // from state, so they automatically recalculate when the
  // user taps the prev/next buttons.
  const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
  const datesArray = Array(totalDays).fill(0).map((_, index) => index + 1);
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const emptySlots = Array(firstDayOfMonth).fill(null);

  // Is the currently displayed month the same as the real today?
  // Used to only show the "today" ring when viewing the right month.
  const isViewingCurrentMonth =
    currentMonth === todayMonth && currentYear === todayYear;

  return (
    <View style={styles.container}>

      {/* ---------------------------------------------------------
          STEP 4: Show city in UI
          --------------------------------------------------------- */}
      {cityName ? (
        <Text style={styles.cityNameText}>📍 {cityName}</Text>
      ) : null}

      {/* ---------------------------------------------------------
          STEP 3: Month/Year heading with ◀ ▶ navigation
          --------------------------------------------------------- */}
      <View style={styles.monthNavRow}>

        {/* Previous month button */}
        <TouchableOpacity style={styles.navButton} onPress={goToPreviousMonth}>
          <Text style={styles.navButtonText}>◀</Text>
        </TouchableOpacity>

        {/* Month name + year in the centre */}
        <Text style={styles.monthYearText}>{monthName} {currentYear}</Text>

        {/* Next month button */}
        <TouchableOpacity style={styles.navButton} onPress={goToNextMonth}>
          <Text style={styles.navButtonText}>▶</Text>
        </TouchableOpacity>

      </View>

      {/* ---------------------------------------------------------
          "Today" button — shown ONLY when not viewing current month
          ---------------------------------------------------------
          WHY HIDE IT WHEN ALREADY ON CURRENT MONTH?
            If the user is already looking at today's month, pressing
            "Today" would do nothing visible. Hiding it keeps the UI
            clean and avoids a button that has no effect.

          HOW isViewingCurrentMonth WORKS:
            It is true when currentMonth === todayMonth AND
            currentYear === todayYear. Calculated just above the return(). */}
      {!isViewingCurrentMonth && (
        <TouchableOpacity style={styles.todayButton} onPress={goToToday}>
          <Text style={styles.todayButtonText}>📍 Today</Text>
        </TouchableOpacity>
      )}

      {/* ---------------------------------------------------------
          Filter toggle buttons
          --------------------------------------------------------- */}
      <View style={styles.filterRow}>
        {['All', 'Holidays', 'Fasting'].map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterButton,
              activeFilter === filter && styles.filterButtonActive,
            ]}
            onPress={() => setActiveFilter(filter)}
          >
            <Text
              style={[
                styles.filterText,
                activeFilter === filter && styles.filterTextActive,
              ]}
            >
              {filter === 'Holidays' ? '🎉 ' : filter === 'Fasting' ? '🌿 ' : ''}{filter}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ---------------------------------------------------------
          STEP 4: Days of week row (Sun Mon Tue Wed Thu Fri Sat)
          --------------------------------------------------------- */}
      <View style={styles.weekRow}>
        <View style={styles.sidebarSpacer} />
        {weekDays.map((day) => (
          <Text key={day} style={styles.weekDayText}>{day}</Text>
        ))}
      </View>

      {/* ---------------------------------------------------------
          Calendar body: Sidebar + Grid
          --------------------------------------------------------- */}
      <View style={styles.calendarBody}>

        {/* Weekday sidebar strip */}
        <View style={styles.sidebar}>
          {[
            { day: 'SUN', color: '#c0392b' },
            { day: 'MON', color: '#2c3e7a' },
            { day: 'TUE', color: '#34495e' },
            { day: 'WED', color: '#2c3e7a' },
            { day: 'THU', color: '#34495e' },
            { day: 'FRI', color: '#2c3e7a' },
            { day: 'SAT', color: '#34495e' },
          ].map((item) => (
            <View
              key={item.day}
              style={[styles.sidebarCell, { backgroundColor: item.color }]}
            >
              {item.day.split('').map((letter, i) => (
                <Text key={i} style={styles.sidebarLetter}>{letter}</Text>
              ))}
            </View>
          ))}
        </View>

        {/* Dates grid */}
        <View style={styles.datesGrid}>

          {/* Empty boxes before day 1 */}
          {emptySlots.map((_, index) => (
            <View key={'empty-' + index} style={styles.dateBox} />
          ))}

          {/* Actual date buttons */}
          {datesArray.map((date) => {
            const isSelected = date === selectedDate;
            const isToday = isViewingCurrentMonth && date === todayDay;
            const dateStrForGrid = `${date} ${monthName} ${currentYear}`;
            const isBookmarked = bookmarkedDates.includes(dateStrForGrid);

            // Filter logic: check if this date matches the active filter
            const tithi = getTithiForDate(date);
            const festival = getFestivalForDate(currentMonth, date);
            const isFastingDay = tithi === 'Ekadashi' || tithi === 'Chaturthi'
              || tithi === 'Purnima' || tithi === 'Amavasya';
            const isHoliday = !!festival;

            const matchesFilter =
              activeFilter === 'All' ||
              (activeFilter === 'Holidays' && isHoliday) ||
              (activeFilter === 'Fasting' && isFastingDay);

            return (
              <TouchableOpacity
                key={date}
                style={[
                  styles.dateBox,
                  // Category-based background (applied BEFORE selected/today)
                  !isSelected && isHoliday && styles.festivalBox,
                  !isSelected && !isHoliday && tithi === 'Purnima' && styles.purnimaBox,
                  !isSelected && !isHoliday && tithi === 'Amavasya' && styles.amavasyaBox,
                  !isSelected && !isHoliday && (tithi === 'Ekadashi' || tithi === 'Chaturthi') && styles.fastingBox,
                  // Today and selected override everything
                  isSelected && styles.selectedDateBox,
                  isToday && !isSelected && styles.todayDateBox,
                  // Filter emphasis
                  activeFilter !== 'All' && matchesFilter && !isSelected && styles.filterMatchBox,
                  activeFilter !== 'All' && !matchesFilter && !isSelected && styles.filterDimBox,
                ]}
                onPress={async () => {
                  setSelectedDate(date);
                  if (!location) { return; }
                  setLoading(true);
                  setPanchangData(null);
                  const data = await getPanchangFromAPI(
                    date,
                    location.latitude,
                    location.longitude,
                  );
                  setPanchangData(data);
                  setLoading(false);
                }}
              >
                {/* --- Panchang-style cell content --- */}
                {(() => {
                  const tithi = getTithiForDate(date);
                  const festival = getFestivalForDate(currentMonth, date);
                  const isFasting = tithi === 'Ekadashi' || tithi === 'Chaturthi';
                  const isAuspicious = tithi === 'Purnima';
                  const isDark = tithi === 'Amavasya';
                  return (
                    <>
                      {/* Tiny spiritual icon in top-right */}
                      {!isSelected && (
                        <Text style={styles.categoryIcon}>
                          {festival ? '🪩' : isFasting ? '🌿' : isAuspicious ? '🌕' : isDark ? '🌑' : ''}
                        </Text>
                      )}
                      <Text
                        style={[
                          styles.dateNum,
                          isSelected && styles.selectedDateText,
                          isToday && !isSelected && styles.todayDateText,
                        ]}
                      >
                        {date}
                      </Text>
                      <Text
                        style={[
                          styles.tithiText,
                          isFasting && styles.fastingText,
                          isAuspicious && styles.auspiciousText,
                          isDark && styles.amavasText,
                          isSelected && styles.selectedSubText,
                        ]}
                      >
                        {tithi.length > 7 ? tithi.substring(0, 6) + '.' : tithi}
                      </Text>
                      {festival && (
                        <Text
                          style={[
                            styles.festivalText,
                            isSelected && styles.selectedSubText,
                          ]}
                        >
                          {festival}
                        </Text>
                      )}
                    </>
                  );
                })()}

                {/* Bookmark indicator */}
                {isBookmarked && (
                  <Text style={styles.bookmarkDot}>⭐</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ---------------------------------------------------------
          STEP 9: Show selected date at bottom
          --------------------------------------------------------- */}
      {/* Wrap lower content in ScrollView so it scrolls if screen is short */}
      <ScrollView style={styles.bottomScroll} showsVerticalScrollIndicator={false}>

        {/* Existing: selected date display */}
        <View style={styles.selectedInfoBox}>
          <Text style={styles.selectedInfoLabel}>Selected Date:</Text>
          <Text style={styles.selectedInfoValue}>
            {selectedDate} {monthName} {currentYear}
          </Text>
        </View>

        {/* ---------------------------------------------------------
            STEP 4 & 5: Panchang card
            Only rendered when panchangData is NOT null
            (i.e., after the user taps any date)
            --------------------------------------------------------- */}
        {panchangData && (
          <View style={styles.panchangCard}>

            {/* Card heading */}
            <Text style={styles.panchangTitle}>🕉️ Panchang Details</Text>
            <View style={styles.panchangDivider} />

            {/* Row: Tithi */}
            <View style={styles.panchangRow}>
              <Text style={styles.panchangLabel}>Tithi</Text>
              <Text style={styles.panchangValue}>{panchangData.tithi}</Text>
            </View>

            {/* Row: Festival */}
            <View style={styles.panchangRow}>
              <Text style={styles.panchangLabel}>Festival</Text>
              <Text style={styles.panchangValue}>{panchangData.festival}</Text>
            </View>

            {/* Row: Sunrise */}
            <View style={styles.panchangRow}>
              <Text style={styles.panchangLabel}>🌅 Sunrise</Text>
              <Text style={styles.panchangValue}>{panchangData.sunrise}</Text>
            </View>

            {/* Row: Sunset */}
            <View style={styles.panchangRow}>
              <Text style={styles.panchangLabel}>🌇 Sunset</Text>
              <Text style={styles.panchangValue}>{panchangData.sunset}</Text>
            </View>

            {/* STEP 2: Save button */}
            <TouchableOpacity style={styles.saveButton} onPress={saveDate}>
              <Text style={styles.saveButtonText}>⭐ Save Date</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 5: Loading indicator — shown while service is running */}
        {loading && (
          <View style={styles.loadingBox}>
            {/* ActivityIndicator is a built-in React Native spinner */}
            <ActivityIndicator size="small" color="#6c63ff" />
            <Text style={styles.loadingText}>Loading Panchang...</Text>
          </View>
        )}

        {/* STEP 6: Location status banner
             Shows what is happening with location:
             - "Getting your location..." while GPS is loading
             - "Location permission denied" if user said no
             - "Location ready ✓" once we have coordinates
             Hidden once panchangData is showing (no need to clutter) */}
        {!panchangData && !loading && (
          <View style={styles.locationBanner}>
            <Text style={styles.locationBannerText}>📍 {locationStatus}</Text>
          </View>
        )}

        {/* Hint shown before user taps any date for the first time */}
        {!panchangData && !loading && location && (
          <Text style={styles.hintText}>Tap any date to see Panchang details</Text>
        )}

        {/* Shown when location not available and user hasn't tapped a date */}
        {!panchangData && !loading && !location && (
          <Text style={styles.hintText}>Waiting for location before fetching data...</Text>
        )}

        {/* ---------------------------------------------------------
            STEP 5: List of saved dates
            --------------------------------------------------------- */}
        {bookmarkedDates.length > 0 && (
          <View style={styles.savedDatesContainer}>
            <Text style={styles.savedDatesTitle}>Saved Dates:</Text>
            {bookmarkedDates.map((savedDate, index) => (
              <Text key={index} style={styles.savedDateItem}>• {savedDate}</Text>
            ))}
          </View>
        )}

      </ScrollView>
    </View>
  );
}

// ============================================================
// STEP 10: Styles
// ============================================================
const styles = StyleSheet.create({

  // --- Main container ---
  container: {
    flex: 1,
    backgroundColor: '#0f1528',
    paddingHorizontal: 16,
    paddingTop: 20,
  },

  // --- STEP 6: City name display ---
  cityNameText: {
    fontSize: 12,
    color: '#6c63a8',
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '500',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // --- Month navigation row (◀  Month Year  ▶) ---
  monthNavRow: {
    flexDirection: 'row',       // put buttons and text side by side
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  navButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#1a2240',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2e3a5e',
  },
  navButtonText: {
    color: '#e8b849',
    fontSize: 16,
    fontWeight: 'bold',
  },
  monthYearText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e0d7ff',
    textAlign: 'center',
    flex: 1,
    letterSpacing: 1,
  },

  // --- "Today" button (shown when not on current month) ---
  todayButton: {
    alignSelf: 'center',        // centre horizontally
    paddingVertical: 5,
    paddingHorizontal: 16,
    borderRadius: 20,           // pill shape
    backgroundColor: '#16213e',
    borderWidth: 1,
    borderColor: '#6c63ff',
    marginBottom: 12,           // space above the weekday row
  },
  todayButtonText: {
    color: '#6c63ff',
    fontSize: 13,
    fontWeight: '600',
  },

  // --- STEP 4: Week day row (Sun Mon Tue...) ---
  weekRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  sidebarSpacer: {
    width: 22,
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
    color: '#6c63ff',
  },

  // --- Dates grid (sits inside calendarBody alongside sidebar) ---
  calendarBody: {
    flexDirection: 'row',
    marginBottom: 4,
  },

  // --- Weekday sidebar ---
  sidebar: {
    width: 22,
    marginRight: 2,
  },
  sidebarCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 3,
    marginBottom: 2,
    paddingVertical: 2,
  },
  sidebarLetter: {
    fontSize: 7,
    color: '#ffffff',
    fontWeight: 'bold',
    lineHeight: 9,
  },

  datesGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  // --- Each date box (Panchang-style) ---
  dateBox: {
    width: '14.28%',
    paddingVertical: 6,
    paddingHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 2,
    minHeight: 58,
    borderWidth: 0.5,
    borderColor: '#1e2a4a',
    borderRadius: 6,
  },

  dateNum: {
    fontSize: 14,
    color: '#e0d7ff',
    fontWeight: '700',
  },

  tithiText: {
    fontSize: 7,
    color: '#6c63a8',
    marginTop: 1,
  },

  fastingText: {
    color: '#4ade80',
  },

  auspiciousText: {
    color: '#e8b849',
  },

  amavasText: {
    color: '#f87171',
  },

  festivalText: {
    fontSize: 6,
    color: '#f87171',
    fontWeight: 'bold',
    marginTop: 1,
    textAlign: 'center',
  },

  selectedSubText: {
    color: 'rgba(255,255,255,0.8)',
  },

  // --- Category icon (top-right) ---
  categoryIcon: {
    position: 'absolute',
    top: 1,
    right: 2,
    fontSize: 8,
  },

  // --- Category box styles ---
  festivalBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: '#ef4444',
    borderWidth: 1,
  },
  fastingBox: {
    backgroundColor: 'rgba(74, 222, 128, 0.08)',
    borderColor: 'rgba(74, 222, 128, 0.4)',
    borderWidth: 1,
  },
  purnimaBox: {
    backgroundColor: 'rgba(232, 184, 73, 0.1)',
    borderColor: '#e8b849',
    borderWidth: 1,
  },
  amavasyaBox: {
    backgroundColor: 'rgba(100, 50, 50, 0.15)',
    borderColor: '#8b4545',
    borderWidth: 1,
  },

  // --- STEP 8: Today indicator ---
  todayDateBox: {
    borderWidth: 2,
    borderColor: '#e8b849',
    borderRadius: 8,
    backgroundColor: 'rgba(232, 184, 73, 0.12)',
    elevation: 4,
    shadowColor: '#e8b849',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  todayDateText: {
    color: '#e8b849',
    fontWeight: '800',
    fontSize: 15,
  },

  // --- STEP 8: Selected date highlight ---
  selectedDateBox: {
    backgroundColor: '#7c6cff',
    borderRadius: 8,
    borderColor: '#a898ff',
    borderWidth: 1.5,
    elevation: 6,
    shadowColor: '#6c63ff',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  selectedDateText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 15,
  },

  // --- ScrollView wrapper for bottom section ---
  bottomScroll: {
    flex: 1,
    marginTop: 8,
  },

  // --- STEP 9: Selected date info at bottom ---
  selectedInfoBox: {
    marginTop: 16,
    backgroundColor: '#1a2240',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2e3a5e',
    elevation: 3,
    shadowColor: '#6c63ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  selectedInfoLabel: {
    fontSize: 12,
    color: '#6c63a8',
    marginBottom: 4,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  selectedInfoValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e0d7ff',
    letterSpacing: 0.5,
  },

  // --- STEP 5 & 6: Panchang card ---
  panchangCard: {
    backgroundColor: '#1a2240',
    padding: 18,
    marginTop: 14,
    marginBottom: 24,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2e3a5e',
    elevation: 4,
    shadowColor: '#6c63ff',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  panchangTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e0d7ff',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  panchangDivider: {
    height: 1.5,
    backgroundColor: '#e8b849',
    marginBottom: 12,
    borderRadius: 2,
  },
  // Each row: label on left, value on right
  panchangRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2e3a5e',
  },
  panchangLabel: {
    fontSize: 13,
    color: '#6c63a8',
    fontWeight: '500',
  },
  panchangValue: {
    fontSize: 13,
    color: '#e0d7ff',
    fontWeight: '600',
  },

  // Hint before any date is tapped
  hintText: {
    textAlign: 'center',
    color: '#4a4370',
    fontSize: 13,
    marginTop: 16,
    fontStyle: 'italic',
  },

  // STEP 5: Loading box shown while service is fetching
  loadingBox: {
    flexDirection: 'row',    // spinner and text side by side
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 10,                 // space between spinner and text
  },
  loadingText: {
    color: '#a89ec9',
    fontSize: 14,
    fontStyle: 'italic',
  },

  // STEP 6: Location status banner
  locationBanner: {
    marginTop: 14,
    backgroundColor: '#16213e',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2e3a5e',
  },
  locationBannerText: {
    fontSize: 13,
    color: '#a89ec9',
  },

  // --- Bookmark Feature Styles ---
  bookmarkDot: {
    fontSize: 8,
    position: 'absolute',
    bottom: 2,
  },
  saveButton: {
    backgroundColor: '#1a2240',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#e8b849',
  },
  saveButtonText: {
    color: '#e8b849',
    fontWeight: 'bold',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  savedDatesContainer: {
    marginTop: 20,
    backgroundColor: '#1a2240',
    padding: 16,
    borderRadius: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2e3a5e',
  },
  savedDatesTitle: {
    color: '#e8b849',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  savedDateItem: {
    color: '#c8c0e0',
    fontSize: 13,
    marginBottom: 6,
  },

  // --- Filter toggle buttons ---
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  filterButton: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e8b849',
    backgroundColor: '#111a30',
  },
  filterButtonActive: {
    backgroundColor: '#4ade80',
    borderColor: '#4ade80',
  },
  filterText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#e8b849',
  },
  filterTextActive: {
    color: '#0f1528',
  },
  filterMatchBox: {
    borderColor: '#e8b849',
    borderWidth: 1.5,
    backgroundColor: 'rgba(232, 184, 73, 0.08)',
  },
  filterDimBox: {
    opacity: 0.35,
  },
});
