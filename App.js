// import { useEffect } from 'react';  // <-- Temporarily disabled for Expo Go compatibility
import { useState, createContext, useContext } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
// import * as Notifications from 'expo-notifications';  // <-- Temporarily disabled for Expo Go compatibility
import AppNavigator from './src/navigation/AppNavigator';

// ============================================================
// THEME SYSTEM
// ============================================================
// Two theme objects — each has five shared design tokens:
//   background  → main screen background
//   card        → surface / card background
//   text        → primary text colour
//   accent      → highlight / brand colour
//   mutedText   → secondary / label text
//
// Values mirror the colours already used throughout the app
// so screens can adopt them incrementally without visual breaks.
// ============================================================

export const darkTheme = {
  // Base tokens (original 5)
  background: '#0f1528',
  card:       '#1a2240',
  text:       '#e0d7ff',
  accent:     '#e8b849',
  mutedText:  '#6c63a8',

  // Extended tokens — surfaces & borders
  cardBorder:  '#2e3a5e',
  cardAlt:     '#16213e',       // alternate card surface
  divider:     '#e8b849',       // gold divider lines
  border:      '#1e2a4a',       // subtle inner borders

  // Inputs
  inputBg:     '#1a1a2e',
  inputBorder: '#2e3a5e',
  placeholder: '#5a5282',

  // Accent secondary (purple glow in dark, purple in light)
  accent2:     '#6c63ff',

  // Navigation header
  headerBg:    '#0f1528',
  headerText:  '#e0d7ff',

  // Text variants
  textSecondary: '#c8c0e0',     // slightly muted body text
  textTertiary:  '#a89ec9',     // even more muted
  textHint:      '#4a4370',     // hint / italic text

  // Interactive
  buttonBg:    '#4a4370',
  activeHighlight: '#1e2a4a',   // active state backgrounds

  // Chart / special
  chartBg:     '#0a0f1e',
  chartBorder: 'rgba(232, 184, 73, 0.4)',
  goldGlow:    'rgba(232, 184, 73, 0.12)',
};

export const lightTheme = {
  // Base tokens (original 5)
  background: '#f4f0ff',
  card:       '#ffffff',
  text:       '#1a1040',
  accent:     '#7c3aed',
  mutedText:  '#7c6caf',

  // Extended tokens — surfaces & borders
  cardBorder:  '#e2d9f3',
  cardAlt:     '#f8f4ff',       // alternate card surface
  divider:     '#7c3aed',       // purple divider in light
  border:      '#e2d9f3',       // subtle inner borders

  // Inputs
  inputBg:     '#f8f4ff',
  inputBorder: '#d0c8e8',
  placeholder: '#b0a8cc',

  // Accent secondary
  accent2:     '#7c3aed',

  // Navigation header
  headerBg:    '#f4f0ff',
  headerText:  '#1a1040',

  // Text variants
  textSecondary: '#4a3a70',
  textTertiary:  '#7c6caf',
  textHint:      '#9080c0',

  // Interactive
  buttonBg:    '#7c3aed',
  activeHighlight: '#ece4ff',

  // Chart / special
  chartBg:     '#f8f4ff',
  chartBorder: 'rgba(124, 58, 237, 0.3)',
  goldGlow:    'rgba(124, 58, 237, 0.08)',
};

// ============================================================
// ThemeContext
// ============================================================
// Exported so any screen can import it and call:
//
//   const { theme, isDark, toggleTheme } = useContext(ThemeContext);
//
// "theme" will be either darkTheme or lightTheme depending on
// the current isDark state managed here in App.js.
// ============================================================
export const ThemeContext = createContext(null);

// ============================================================
// NOTIFICATIONS — Temporarily disabled for Expo Go compatibility
// To re-enable: uncomment the import above and the blocks below
// ============================================================

// Notifications.setNotificationHandler({
//   handleNotification: async () => ({
//     shouldShowAlert: true,
//     shouldPlaySound: true,
//     shouldSetBadge: false,
//   }),
// });

// App.js is the ENTRY POINT of your app - the very first file that runs
// It wraps everything inside NavigationContainer, which is required by React Navigation

export default function App() {

  // --------------------------------------------------------
  // THEME STATE
  // --------------------------------------------------------
  // isDark drives which theme object is active.
  // Default is TRUE (dark mode) — the app's current look.
  // Call toggleTheme() from any screen to switch at runtime.
  // --------------------------------------------------------
  const [isDark, setIsDark] = useState(true);
  const toggleTheme = () => setIsDark((prev) => !prev);

  // The active theme object — passed down via ThemeContext.
  const theme = isDark ? darkTheme : lightTheme;

  // ============================================================
  // NOTIFICATIONS useEffect — Temporarily disabled for Expo Go
  // To re-enable: uncomment the useEffect block below
  // ============================================================

  // useEffect(() => {
  //   async function setupNotifications() {
  //     const { status: existingStatus } = await Notifications.getPermissionsAsync();
  //     let finalStatus = existingStatus;
  //
  //     if (existingStatus !== 'granted') {
  //       const { status } = await Notifications.requestPermissionsAsync();
  //       finalStatus = status;
  //     }
  //
  //     if (finalStatus !== 'granted') {
  //       console.log('Notification permission denied');
  //       return;
  //     }
  //
  //     await Notifications.cancelAllScheduledNotificationsAsync();
  //
  //     await Notifications.scheduleNotificationAsync({
  //       content: {
  //         title: "Spiritual App 🕉️",
  //         body: "Check today's Panchang 📅",
  //       },
  //       trigger: {
  //         type: Notifications.SchedulableTriggerInputTypes.DAILY,
  //         hour: 9,
  //         minute: 0,
  //       },
  //     });
  //   }
  //
  //   setupNotifications();
  // }, []);

  return (
    // ThemeContext.Provider makes { theme, isDark, toggleTheme }
    // available to every screen in the tree without prop drilling.
    // Screens access it with: useContext(ThemeContext)
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      <NavigationContainer>
        {/* StatusBar style tracks the active theme */}
        <StatusBar style={isDark ? 'light' : 'dark'} />

        {/* AppNavigator contains all our screens (Home, Settings) */}
        <AppNavigator />
      </NavigationContainer>
    </ThemeContext.Provider>
  );
}
