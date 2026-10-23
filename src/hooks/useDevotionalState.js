import { useEffect, useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'bhakti.devotional.v1';
let snapshot = { favorites: [], sessions: {}, ready: false, error: '' };
let loading;
let writes = Promise.resolve();
const listeners = new Set();
const subscribe = (listener) => { listeners.add(listener); return () => listeners.delete(listener); };
const getSnapshot = () => snapshot;
const publish = (next) => { snapshot = next; listeners.forEach((listener) => listener()); };

async function hydrate() {
  if (!loading) loading = (async () => {
    try {
      const stored = JSON.parse(await AsyncStorage.getItem(STORAGE_KEY) || '{}');
      publish({
        favorites: Array.isArray(stored.favorites) ? stored.favorites.filter((id) => typeof id === 'string') : [],
        sessions: stored.sessions && typeof stored.sessions === 'object' && !Array.isArray(stored.sessions) ? stored.sessions : {},
        ready: true, error: '',
      });
    } catch { publish({ ...snapshot, ready: true, error: 'Saved devotional progress could not be loaded.' }); }
  })();
  return loading;
}

function update(changes) {
  if (!snapshot.ready) return;
  const next = { ...snapshot, ...changes, error: '' };
  publish(next);
  const value = JSON.stringify({ favorites: next.favorites, sessions: next.sessions });
  // Serialize writes so an earlier tap cannot overwrite a later one.
  writes = writes.catch(() => {}).then(() => AsyncStorage.setItem(STORAGE_KEY, value)).catch(() => {
    publish({ ...snapshot, error: 'Progress is available for this session, but could not be saved on this device.' });
  });
}

export function toggleMantraFavorite(id) {
  const favorites = snapshot.favorites.includes(id)
    ? snapshot.favorites.filter((item) => item !== id) : [...snapshot.favorites, id];
  update({ favorites });
}

export function saveJaapSession(id, session) {
  update({ sessions: { ...snapshot.sessions, [id]: session } });
}

export function useDevotionalState() {
  const value = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  useEffect(() => { hydrate(); }, []);
  return value;
}
