import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { configureForegroundAudio, createBundledPlayback } from '../utils/bundledAudio';

export default function useBundledAudio() {
  const playbackRef = useRef(null);
  const requestedIdRef = useRef(null);
  const sessionRef = useRef(0);
  const activeRef = useRef(true);
  const appActiveRef = useRef(!['background', 'inactive'].includes(AppState.currentState));
  const [playingId, setPlayingId] = useState(null);
  const [loadingId, setLoadingId] = useState(null);
  const [error, setError] = useState('');

  const stop = useCallback(() => {
    sessionRef.current += 1;
    const playback = playbackRef.current;
    playbackRef.current = null;
    requestedIdRef.current = null;
    if (activeRef.current) { setPlayingId(null); setLoadingId(null); }
    playback?.dispose();
  }, []);

  useFocusEffect(useCallback(() => {
    activeRef.current = true;
    return () => { stop(); activeRef.current = false; };
  }, [stop]));

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      appActiveRef.current = state === 'active';
      if (!appActiveRef.current) stop();
    });
    return () => subscription.remove();
  }, [stop]);

  const toggle = useCallback(async (id, asset) => {
    const shouldStop = requestedIdRef.current === id;
    stop();
    const session = sessionRef.current;
    if (shouldStop || session !== sessionRef.current || !activeRef.current || !appActiveRef.current) return;
    if (!asset) { setError('A matching recording is not available for this chant. You can still read it and use the Jaap counter.'); return; }
    requestedIdRef.current = id;
    setError(''); setLoadingId(id);
    try {
      await configureForegroundAudio();
      if (session !== sessionRef.current || !activeRef.current || !appActiveRef.current) return;
      const playback = createBundledPlayback(asset, {
        onStatus: (status) => {
          if (session !== sessionRef.current || !activeRef.current || !appActiveRef.current) return;
          if (status.error) { setError('This recording could not be played. Please try again.'); stop(); }
          else if (status.didJustFinish) stop();
          else if (status.isLoaded && status.playing) { setPlayingId(id); setLoadingId(null); }
        },
      });
      playbackRef.current = playback;
      playback.play();
    } catch {
      if (session === sessionRef.current && activeRef.current) { setError('This recording could not be played. Please try again.'); stop(); }
    }
  }, [stop]);

  return { playingId, loadingId, error, toggle, stop };
}
