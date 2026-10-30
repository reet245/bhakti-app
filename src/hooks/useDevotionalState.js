import { useEffect, useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'bhakti.devotional.v1';
let snapshot = { favorites: [], sessions: {}, customMantras: [], readingScript: 'devanagari', meaningLanguage: 'en', ready: false, error: '' };
let loading;
let hydrating = false;
let writes = Promise.resolve();
const listeners = new Set();
const subscribe = (listener) => { listeners.add(listener); return () => listeners.delete(listener); };
const getSnapshot = () => snapshot;
const publish = (next) => { snapshot = next; listeners.forEach((listener) => listener()); };

const textField = (value, max) => typeof value === 'string' ? value.trim().slice(0, max) : '';

function normalizeCustomMantra(value) {
  if (!value || typeof value !== 'object') return null;
  const title = textField(value.title, 120);
  const text = textField(value.text, 16000);
  if (!title || !text || !/^custom-[a-z0-9-]{1,80}$/.test(value.id || '')) return null;
  return {
    id: value.id, title, text,
    transliteration: textField(value.transliteration, 16000),
    meaning: textField(value.meaning, 4000),
    deityId: textField(value.deityId, 50) || 'shiv',
    categoryId: 'mantras', language: 'Personal', chantCount: '108', isCustom: true,
  };
}

function serialize(value) {
  return JSON.stringify({ favorites: value.favorites, sessions: value.sessions, customMantras: value.customMantras, readingScript: value.readingScript, meaningLanguage: value.meaningLanguage });
}

async function hydrate() {
  if (!loading) {
    hydrating = true;
    loading = (async () => {
    try {
      const stored = JSON.parse(await AsyncStorage.getItem(STORAGE_KEY) || '{}');
      publish({
        favorites: Array.isArray(stored.favorites) ? stored.favorites.filter((id) => typeof id === 'string') : [],
        sessions: stored.sessions && typeof stored.sessions === 'object' && !Array.isArray(stored.sessions) ? stored.sessions : {},
        customMantras: Array.isArray(stored.customMantras)
          ? [...new Map(stored.customMantras.slice(0, 200).map(normalizeCustomMantra).filter(Boolean).map((item) => [item.id, item])).values()] : [],
        readingScript: ['devanagari', 'bengali', 'roman'].includes(stored.readingScript) ? stored.readingScript : 'devanagari',
        meaningLanguage: ['en', 'hi', 'bn'].includes(stored.meaningLanguage) ? stored.meaningLanguage : 'en',
        ready: true, error: '',
      });
    } catch { publish({ ...snapshot, ready: false, error: 'Saved devotional progress could not be loaded.' }); }
    finally { hydrating = false; }
    })();
  }
  return loading;
}

function update(changes) {
  if (!snapshot.ready) return;
  const next = { ...snapshot, ...changes, error: '' };
  publish(next);
  // Serialize writes so an earlier tap cannot overwrite a later one.
  writes = writes.catch(() => {}).then(() => AsyncStorage.setItem(STORAGE_KEY, serialize(snapshot))).catch(() => {
    publish({ ...snapshot, error: 'Progress is available for this session, but could not be saved on this device.' });
  });
}

export function retryDevotionalLoad() {
  if (snapshot.ready) return Promise.resolve();
  if (hydrating) return loading;
  loading = undefined;
  publish({ ...snapshot, error: '' });
  return hydrate();
}

export function retryDevotionalSave() {
  if (!snapshot.ready) return retryDevotionalLoad();
  update({});
  return writes;
}

// Personal entries are committed only after storage succeeds. A failed save must
// keep the editor open with its draft. Queued writes read the newest snapshot so
// a favorite tap during a save cannot overwrite the newly saved entry.
function commitCustom(reducer) {
  const operation = writes.catch(() => {}).then(async () => {
    await hydrate();
    if (!snapshot.ready) throw new Error('Saved devotional progress could not be loaded.');
    const next = reducer(snapshot);
    await AsyncStorage.setItem(STORAGE_KEY, serialize(next));
    publish({ ...reducer(snapshot), error: '' });
  });
  writes = operation.catch(() => {
    publish({ ...snapshot, error: 'Your personal mantra could not be saved. Please try again.' });
  });
  return operation;
}

export async function saveCustomMantra(draft) {
  const id = draft.id || `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  const mantra = normalizeCustomMantra({ ...draft, id });
  if (!mantra) throw new Error('Add a title and mantra text before saving.');
  await commitCustom((value) => {
    const exists = value.customMantras.some((item) => item.id === id);
    if (!exists && value.customMantras.length >= 200) throw new Error('Your collection is full (200 personal mantras).');
    return { ...value, customMantras: exists
      ? value.customMantras.map((item) => item.id === id ? mantra : item)
      : [...value.customMantras, mantra] };
  });
  return mantra;
}

export function deleteCustomMantra(id) {
  if (!/^custom-[a-z0-9-]{1,80}$/.test(id || '')) return Promise.reject(new Error('Personal mantra not found.'));
  return commitCustom((value) => ({
    ...value,
    customMantras: value.customMantras.filter((item) => item.id !== id),
    favorites: value.favorites.filter((item) => item !== id),
    sessions: Object.fromEntries(Object.entries(value.sessions).filter(([key]) => !key.startsWith(`${id}:`))),
  }));
}

export function toggleMantraFavorite(id) {
  const favorites = snapshot.favorites.includes(id)
    ? snapshot.favorites.filter((item) => item !== id) : [...snapshot.favorites, id];
  update({ favorites });
}

export function saveJaapSession(id, session) {
  update({ sessions: { ...snapshot.sessions, [id]: session } });
}

export function updateReadingPreferences(preferences) {
  const changes = {};
  if (['devanagari', 'bengali', 'roman'].includes(preferences.readingScript)) changes.readingScript = preferences.readingScript;
  if (['en', 'hi', 'bn'].includes(preferences.meaningLanguage)) changes.meaningLanguage = preferences.meaningLanguage;
  update(changes);
}

export function useDevotionalState() {
  const value = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  useEffect(() => { hydrate(); }, []);
  return value;
}
