import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Audio } from 'expo-av';

export default function useBundledAudio() {
  const soundRef = useRef(null);
  const sessionRef = useRef(0);
  const activeRef = useRef(true);
  const appActiveRef = useRef(!['background', 'inactive'].includes(AppState.currentState));
  const [playingId, setPlayingId] = useState(null);
  const [loadingId, setLoadingId] = useState(null);
  const [error, setError] = useState('');

  const stop = useCallback(async () => {
    sessionRef.current += 1;
    const sound = soundRef.current;
    soundRef.current = null;
    if (activeRef.current) { setPlayingId(null); setLoadingId(null); }
    if (sound) {
      sound.setOnPlaybackStatusUpdate(null);
      await sound.unloadAsync().catch(() => {});
    }
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
    const shouldStop = playingId === id || loadingId === id;
    const stopping = stop();
    const session = sessionRef.current;
    await stopping;
    if (shouldStop || session !== sessionRef.current || !activeRef.current || !appActiveRef.current) return;
    if (!asset) { setError('A matching recording is not available for this chant. You can still read it and use the Jaap counter.'); return; }
    setError(''); setLoadingId(id);
    let createdSound;
    try {
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: false });
      if (session !== sessionRef.current || !activeRef.current || !appActiveRef.current) return;
      const result = await Audio.Sound.createAsync(asset, { shouldPlay: false, isLooping: false });
      createdSound = result.sound;
      if (session !== sessionRef.current || !activeRef.current) { await createdSound.unloadAsync(); return; }
      soundRef.current = createdSound;
      createdSound.setOnPlaybackStatusUpdate((status) => {
        if (session !== sessionRef.current || !activeRef.current) return;
        if (!status.isLoaded && status.error) { setError('This recording could not be played. Please try again.'); stop(); }
        else if (status.isLoaded && status.didJustFinish) stop();
      });
      await createdSound.playAsync();
      if (session === sessionRef.current && activeRef.current) { setPlayingId(id); setLoadingId(null); }
    } catch {
      if (createdSound && soundRef.current !== createdSound) await createdSound.unloadAsync().catch(() => {});
      if (session === sessionRef.current && activeRef.current) { setError('This recording could not be played. Please try again.'); stop(); }
    }
  }, [loadingId, playingId, stop]);

  return { playingId, loadingId, error, toggle, stop };
}
