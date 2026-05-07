import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import AppNavigator from './src/navigation/AppNavigator';

// STEP 2 & 3: Configure notifications
// This tells the app how to handle notifications when the app is OPEN (in the foreground)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// App.js is the ENTRY POINT of your app - the very first file that runs
// It wraps everything inside NavigationContainer, which is required by React Navigation

export default function App() {

  // STEP 2 & 3: Ask for permission and schedule notification
  useEffect(() => {
    async function setupNotifications() {
      // 1. Ask user for permission to send notifications
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Notification permission denied');
        return; // Stop here if user says no
      }

      // 2. Clear any old scheduled notifications so we don't get duplicates
      await Notifications.cancelAllScheduledNotificationsAsync();

      // 3. Schedule new daily notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Spiritual App 🕉️",
          body: "Check today's Panchang 📅",
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY, // Trigger daily
          hour: 9,      // 9 AM
          minute: 0,    // 00 minutes
        },
      });
    }

    setupNotifications();
  }, []); // [] means run only once when app opens

  return (
    <NavigationContainer>
      {/* StatusBar controls the phone's top bar (time, battery, etc.) */}
      <StatusBar style="light" />

      {/* AppNavigator contains all our screens (Home, Settings) */}
      <AppNavigator />
    </NavigationContainer>
  );
}
