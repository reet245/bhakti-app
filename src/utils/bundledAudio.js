import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';

export function configureForegroundAudio() {
  return setAudioModeAsync({
    playsInSilentMode: true,
    shouldPlayInBackground: false,
  });
}

// Each interaction owns its player so cancelling a loading chant cannot start it later.
export function createBundledPlayback(asset, { loop = false, volume = 1, onStatus = () => {} } = {}) {
  const player = createAudioPlayer(asset, { updateInterval: 250 });
  let disposed = false;
  let subscription;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    try { subscription?.remove(); } catch {}
    try { player.pause(); } catch {}
    try { player.release(); } catch {}
  };
  const notify = (status) => { if (!disposed) onStatus(status); };

  try {
    player.loop = loop;
    player.volume = volume;
    subscription = player.addListener('playbackStatusUpdate', notify);
  } catch (error) {
    dispose();
    throw error;
  }

  return {
    play() {
      if (disposed) return;
      player.play();
      if (!disposed) notify(player.currentStatus);
    },
    dispose,
  };
}
