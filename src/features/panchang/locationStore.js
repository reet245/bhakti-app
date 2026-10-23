import { useEffect, useState, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { parseLocalDate, validCoordinates, validTimezone } from './date';
import { DEFAULT_PANCHANG_LOCATION } from './constants';

export { DEFAULT_PANCHANG_LOCATION } from './constants';
const STORAGE_KEY = 'bhakti-panchang-location-v1';
let selectedLocation = DEFAULT_PANCHANG_LOCATION;
let hydratePromise;
let storageQueue = Promise.resolve();
let revision = 0;
const subscribers = new Set();
const subscribe = (listener) => { subscribers.add(listener); return () => subscribers.delete(listener); };
const publish = (value) => { selectedLocation = value; subscribers.forEach((listener) => listener()); };
export function setPanchangLocation(value) {
  if (!validCoordinates(value?.latitude, value?.longitude) || !validTimezone(value?.timezone)) return false;
  revision += 1;
  const location = { ...DEFAULT_PANCHANG_LOCATION, ...value, latitude: Number(value.latitude), longitude: Number(value.longitude) };
  publish(location);
  storageQueue = storageQueue.catch(() => {}).then(() => AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(location)));
  storageQueue.catch(() => {});
  return true;
}
export async function clearSavedPanchangLocation() {
  revision += 1;
  publish(DEFAULT_PANCHANG_LOCATION);
  storageQueue = storageQueue.catch(() => {}).then(() => AsyncStorage.removeItem(STORAGE_KEY));
  await storageQueue;
}
export function usePanchangLocation() {
  const location = useSyncExternalStore(subscribe, () => selectedLocation, () => DEFAULT_PANCHANG_LOCATION);
  useEffect(() => {
    if (!hydratePromise) {
      const initialRevision = revision;
      hydratePromise = AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
        const value = saved ? JSON.parse(saved) : null;
        if (initialRevision === revision && validCoordinates(value?.latitude, value?.longitude) && validTimezone(value?.timezone)) publish({ ...DEFAULT_PANCHANG_LOCATION, ...value });
      }).catch(() => {});
    }
  }, []);
  return [location, setPanchangLocation];
}

function todayInTimezone(timezone) {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
    const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return parseLocalDate(`${value.year}-${value.month}-${value.day}`);
  } catch { return new Date(); }
}

// Refresh after midnight in the selected place, screen focus, and app resume.
export function usePanchangToday(timezone, navigation) {
  const [today, setToday] = useState(() => todayInTimezone(timezone));
  useEffect(() => {
    const refresh = () => setToday(todayInTimezone(timezone));
    refresh();
    const timer = setInterval(() => {
      const next = todayInTimezone(timezone);
      setToday((current) => current.toDateString() === next.toDateString() ? current : next);
    }, 30000);
    const stateSubscription = AppState.addEventListener('change', (state) => { if (state === 'active') refresh(); });
    const unsubscribe = navigation?.addListener('focus', refresh);
    return () => { clearInterval(timer); stateSubscription.remove(); unsubscribe?.(); };
  }, [timezone, navigation]);
  return today;
}
