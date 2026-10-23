import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'bhakti-daily-reminder';
export function supportsReminders() {
  return Platform.OS !== 'web' && Constants.executionEnvironment !== 'storeClient';
}
export async function initializeReminderHandler() {
  if (!supportsReminders()) return;
  const Notifications = await import('expo-notifications');
  Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }) });
}
export async function getReminderEnabled() {
  if (!supportsReminders()) return false;
  const id = await AsyncStorage.getItem(KEY);
  if (!id) return false;
  const Notifications = await import('expo-notifications');
  const [requests, permission] = await Promise.all([Notifications.getAllScheduledNotificationsAsync(), Notifications.getPermissionsAsync()]);
  return permission.granted && requests.some((item) => item.identifier === id);
}
export async function setReminderEnabled(enabled) {
  if (!supportsReminders()) throw new Error('Daily reminders need an installed Bhakti development or release build.');
  const Notifications = await import('expo-notifications');
  const existing = await AsyncStorage.getItem(KEY);
  if (!enabled) {
    if (existing) await Notifications.cancelScheduledNotificationAsync(existing);
    await AsyncStorage.removeItem(KEY);
    return false;
  }
  if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync('daily-panchang', { name: 'Daily Panchang', importance: Notifications.AndroidImportance.DEFAULT });
  const permission = await Notifications.requestPermissionsAsync();
  if (!permission.granted) throw new Error('Notification permission was not granted. Enable it in device settings to use reminders.');
  const id = await Notifications.scheduleNotificationAsync({
    content: { title: 'Bhakti', body: "Take a moment for prayer and today's Panchang.", sound: 'default' },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: 9, minute: 0, ...(Platform.OS === 'android' ? { channelId: 'daily-panchang' } : {}) },
  });
  try { await AsyncStorage.setItem(KEY, id); }
  catch (error) { await Notifications.cancelScheduledNotificationAsync(id); throw error; }
  if (existing) await Notifications.cancelScheduledNotificationAsync(existing);
  return true;
}
