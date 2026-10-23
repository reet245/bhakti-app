import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import jaapModel from '../utils/jaapModel.cjs';
import { saveJaapSession, useDevotionalState } from './useDevotionalState';

const { sanitizeSession, activeElapsedMs, pauseSession } = jaapModel;

export default function useJaapSession(key) {
  const { sessions, ready, error } = useDevotionalState();
  const [session, setSession] = useState(sanitizeSession());
  const [now, setNow] = useState(Date.now());
  const loadedKey = useRef(null);
  const current = useRef(session);
  const keyRef = useRef(key);

  const commit = useCallback((next) => {
    current.current = next;
    setSession(next);
    // Save time accrued so far, never a running timestamp that includes time away.
    saveJaapSession(keyRef.current, pauseSession(next));
  }, []);

  useEffect(() => {
    if (!ready || loadedKey.current === key) return;
    const restored = sanitizeSession(sessions[key]);
    keyRef.current = key;
    current.current = restored;
    loadedKey.current = key;
    setSession(restored);
  }, [key, ready, sessions]);

  const pause = useCallback(() => {
    if (loadedKey.current && current.current.runningSince != null) commit(pauseSession(current.current));
  }, [commit]);

  useFocusEffect(useCallback(() => () => pause(), [pause]));
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => { if (state !== 'active') pause(); });
    return () => subscription.remove();
  }, [pause]);

  useEffect(() => {
    if (session.runningSince == null) return undefined;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [session.runningSince]);

  const start = () => {
    if (!ready || loadedKey.current !== key) return;
    commit({ ...current.current, runningSince: current.current.runningSince ?? Date.now() });
    setNow(Date.now());
  };
  const increment = () => {
    if (!ready || loadedKey.current !== key) return;
    commit({ ...current.current, count: Math.min(current.current.count + 1, 99999), runningSince: current.current.runningSince ?? Date.now() });
    setNow(Date.now());
  };
  const reset = () => { if (ready) commit(sanitizeSession()); };

  return { count: session.count, isActive: session.runningSince != null, elapsedMs: activeElapsedMs(session, now), ready, error, start, pause, increment, reset };
}
