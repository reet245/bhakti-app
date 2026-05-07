// import { useEffect } from 'react';  // <-- Temporarily disabled for Expo Go compatibility
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
// import * as Notifications from 'expo-notifications';  // <-- Temporarily disabled for Expo Go compatibility
import AppNavigator from './src/navigation/AppNavigator';

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
    <NavigationContainer>
      {/* StatusBar controls the phone's top bar (time, battery, etc.) */}
      <StatusBar style="light" />

      {/* AppNavigator contains all our screens (Home, Settings) */}
      <AppNavigator />
    </NavigationContainer>
  );
}
