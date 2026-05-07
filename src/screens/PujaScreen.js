import { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Animated, Easing } from 'react-native';
import { Audio } from 'expo-av';

// ============================================================
// PujaScreen — Interactive Virtual Puja
// ============================================================
// This screen lets users perform a virtual puja by tapping
// action buttons. Each button changes a piece of STATE which
// controls what is visible on screen.
//
// KEY CONCEPT: State controls UI
//   flowerVisible === true  →  flower emojis appear
//   diyaOn === true         →  diya glows
//   bellRinging === true    →  bell animation shows
//   aartiActive === true    →  aarti plate spins
//
// Every time we call setState, React re-renders the screen
// and shows/hides elements based on the new state values.
// ============================================================

export default function PujaScreen() {

  // ---------------------------------------------------------
  // STEP 4: State variables
  // ---------------------------------------------------------
  // Each boolean controls whether that offering is visible
  const [flowerVisible, setFlowerVisible] = useState(false);
  const [diyaOn, setDiyaOn] = useState(false);
  const [bellRinging, setBellRinging] = useState(false);
  const [aartiActive, setAartiActive] = useState(false);

  // Count how many offerings have been made (fun tracker)
  const [offeringCount, setOfferingCount] = useState(0);

  // ---------------------------------------------------------
  // Audio refs & state
  // ---------------------------------------------------------
  // WHY useRef FOR SOUND OBJECTS?
  //   Sound objects live outside of React's render cycle.
  //   We need the SAME object to call .playAsync(), .stopAsync() etc.
  //   useRef keeps a stable reference that doesn't trigger re-renders.
  const bellSoundRef = useRef(null);    // holds the bell Sound object
  const mantraSoundRef = useRef(null);  // holds the mantra Sound object
  const [mantraPlaying, setMantraPlaying] = useState(false);

  // ---------------------------------------------------------
  // Audio setup + cleanup
  // ---------------------------------------------------------
  useEffect(() => {
    // Configure audio mode so sound plays even in silent mode
    async function configureAudio() {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,   // play on iPhone even if muted
        staysActiveInBackground: false, // stop when app is in background
      });
    }
    configureAudio();

    // STEP 5: Cleanup function — runs when screen UNMOUNTS
    // WHY IS CLEANUP NEEDED?
    //   If the user navigates away from PujaScreen, the sound objects
    //   stay in memory and keep playing. This wastes RAM and battery.
    //   By calling unloadAsync(), we free the memory and stop playback.
    return () => {
      if (bellSoundRef.current) {
        bellSoundRef.current.unloadAsync();
      }
      if (mantraSoundRef.current) {
        mantraSoundRef.current.unloadAsync();
      }
    };
  }, []);

  // ---------------------------------------------------------
  // STEP 5: Aarti rotation animation
  // ---------------------------------------------------------
  // useRef creates a value that persists across re-renders
  // WITHOUT causing a re-render itself (unlike useState).
  // We need this because Animated values must stay the same
  // object — if we used useState, React would create a new
  // Animated.Value on every render and break the animation.
  const spinValue = useRef(new Animated.Value(0)).current;

  // This useEffect watches aartiActive — when it becomes true,
  // the rotation animation starts. When false, it stops.
  useEffect(() => {
    if (aartiActive) {
      // Start a looping rotation animation
      // HOW Animated.loop WORKS:
      //   It takes an animation and repeats it forever.
      //   Inside, Animated.timing smoothly changes spinValue
      //   from 0 → 1 over 2000ms (2 seconds), then loops.
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,              // animate from 0 to 1
          duration: 2000,          // take 2 seconds per full rotation
          easing: Easing.linear,   // constant speed (no acceleration)
          useNativeDriver: true,   // run on GPU for smooth performance
        })
      ).start();
    } else {
      // Stop the animation and reset to 0
      spinValue.stopAnimation();
      spinValue.setValue(0);
    }
  }, [aartiActive]); // re-run whenever aartiActive changes

  // Convert the 0→1 value into a rotation string "0deg" → "360deg"
  // interpolate maps one range of numbers to another
  const spin = spinValue.interpolate({
    inputRange: [0, 1],        // when spinValue goes from 0 to 1...
    outputRange: ['0deg', '360deg'], // ...rotate from 0° to 360°
  });

  // ---------------------------------------------------------
  // STEP 3: Action handlers
  // ---------------------------------------------------------
  function handleFlower() {
    setFlowerVisible(true);
    setOfferingCount(prev => prev + 1);
    // Hide flowers after 2 seconds
    setTimeout(() => setFlowerVisible(false), 2000);
  }

  function handleDiya() {
    setDiyaOn(!diyaOn); // Toggle on/off
    if (!diyaOn) setOfferingCount(prev => prev + 1);
  }

  function handleBell() {
    setBellRinging(true);
    setOfferingCount(prev => prev + 1);

    // Play bell sound effect
    // HOW Audio.Sound.createAsync WORKS:
    //   It loads an audio file from a URL (or local require())
    //   and returns { sound } — an object we can call .playAsync() on.
    //   We wrap it in try/catch so the app doesn't crash if
    //   the audio fails to load (e.g. no internet).
    (async () => {
      try {
        // Unload previous bell sound to free memory
        if (bellSoundRef.current) {
          await bellSoundRef.current.unloadAsync();
        }
        const { sound } = await Audio.Sound.createAsync(
          { uri: 'https://actions.google.com/sounds/v1/alarms/medium_bell_ringing_near.ogg' },
          { shouldPlay: true } // start playing immediately after loading
        );
        bellSoundRef.current = sound; // store reference for cleanup
      } catch (e) {
        console.log('Bell sound failed to load:', e);
      }
    })();

    // Stop bell after 1.5 seconds
    setTimeout(() => setBellRinging(false), 1500);
  }

  function handleAarti() {
    setAartiActive(!aartiActive); // Toggle on/off
    if (!aartiActive) setOfferingCount(prev => prev + 1);
  }

  // ---------------------------------------------------------
  // Mantra toggle handler
  // ---------------------------------------------------------
  async function handleMantra() {
    try {
      if (mantraPlaying) {
        // STOP: pause and unload to free memory
        if (mantraSoundRef.current) {
          await mantraSoundRef.current.stopAsync();
          await mantraSoundRef.current.unloadAsync();
          mantraSoundRef.current = null;
        }
        setMantraPlaying(false);
      } else {
        // PLAY: load mantra audio and loop it
        const { sound } = await Audio.Sound.createAsync(
          { uri: 'https://actions.google.com/sounds/v1/science_fiction/alien_beam.ogg' },
          {
            shouldPlay: true,  // start playing immediately
            isLooping: true,   // repeat forever until stopped
            volume: 0.4,       // soft background volume (40%)
          }
        );
        mantraSoundRef.current = sound;
        setMantraPlaying(true);
      }
    } catch (e) {
      console.log('Mantra audio failed:', e);
    }
  }

  return (
    <View style={styles.container}>

      {/* ---------------------------------------------------------
          Offering counter
          --------------------------------------------------------- */}
      <Text style={styles.counterText}>
        Offerings: {offeringCount}
      </Text>

      {/* ---------------------------------------------------------
          STEP 1: Deity display area (shrine)
          --------------------------------------------------------- */}
      <View style={styles.shrine}>

        {/* Flowers appear around the deity when offered */}
        {flowerVisible && (
          <Text style={styles.flowerLeft}>🌸🌺🌼</Text>
        )}

        {/* Main deity emoji */}
        <Text style={styles.deityEmoji}>🙏</Text>
        <Text style={styles.deityName}>🕉️ Shri Krishna</Text>

        {/* Flowers on the other side */}
        {flowerVisible && (
          <Text style={styles.flowerRight}>🌼🌺🌸</Text>
        )}

        {/* Diya glow — shown when diya is lit */}
        {diyaOn && (
          <Text style={styles.diyaGlow}>🪔✨🪔</Text>
        )}

        {/* Bell ringing indicator */}
        {bellRinging && (
          <Text style={styles.bellEffect}>🔔 Ding Ding Ding! 🔔</Text>
        )}

        {/* Aarti plate — rotates when active */}
        {aartiActive && (
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <Text style={styles.aartiPlate}>🔥🪔🔥</Text>
          </Animated.View>
        )}
      </View>

      {/* ---------------------------------------------------------
          STEP 2: Action buttons
          --------------------------------------------------------- */}
      <View style={styles.buttonsContainer}>

        <TouchableOpacity
          style={[styles.actionButton, flowerVisible && styles.activeButton]}
          onPress={handleFlower}
        >
          <Text style={styles.actionEmoji}>🌸</Text>
          <Text style={styles.actionLabel}>Offer Flower</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, diyaOn && styles.activeButton]}
          onPress={handleDiya}
        >
          <Text style={styles.actionEmoji}>🪔</Text>
          <Text style={styles.actionLabel}>{diyaOn ? 'Diya Lit ✓' : 'Light Diya'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, bellRinging && styles.activeButton]}
          onPress={handleBell}
        >
          <Text style={styles.actionEmoji}>🔔</Text>
          <Text style={styles.actionLabel}>Ring Bell</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, aartiActive && styles.activeButton]}
          onPress={handleAarti}
        >
          <Text style={styles.actionEmoji}>🔥</Text>
          <Text style={styles.actionLabel}>{aartiActive ? 'Stop Aarti' : 'Start Aarti'}</Text>
        </TouchableOpacity>

      </View>

      {/* ---------------------------------------------------------
          Mantra toggle button
          --------------------------------------------------------- */}
      <TouchableOpacity
        style={[styles.mantraButton, mantraPlaying && styles.mantraButtonActive]}
        onPress={handleMantra}
      >
        <Text style={styles.mantraButtonText}>
          {mantraPlaying ? '🔇 Stop Mantra' : '🎵 Play Mantra'}
        </Text>
      </TouchableOpacity>

      {/* Subtle hint */}
      <Text style={styles.hintText}>
        Tap the buttons above to perform your virtual puja
      </Text>

    </View>
  );
}

// ---------------------------------------------------------
// STEP 6: Styling
// ---------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f1528',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  // --- Offering counter ---
  counterText: {
    color: '#e8b849',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // --- Shrine area ---
  shrine: {
    width: '100%',
    backgroundColor: '#1a2240',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#2e3a5e',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 260,
    marginBottom: 24,
    elevation: 5,
    shadowColor: '#6c63ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  deityEmoji: {
    fontSize: 72,
    marginBottom: 8,
  },
  deityName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e0d7ff',
    marginBottom: 12,
  },

  // --- Flower emojis ---
  flowerLeft: {
    fontSize: 28,
    position: 'absolute',
    top: 20,
    left: 16,
  },
  flowerRight: {
    fontSize: 28,
    position: 'absolute',
    top: 20,
    right: 16,
  },

  // --- Diya glow ---
  diyaGlow: {
    fontSize: 28,
    marginTop: 8,
  },

  // --- Bell effect ---
  bellEffect: {
    fontSize: 16,
    color: '#ffd700',
    fontWeight: 'bold',
    marginTop: 8,
  },

  // --- Aarti plate ---
  aartiPlate: {
    fontSize: 36,
    marginTop: 8,
  },

  // --- Buttons grid ---
  buttonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
  },
  actionButton: {
    width: '45%',
    backgroundColor: '#1a2240',
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2e3a5e',
    elevation: 3,
    shadowColor: '#6c63ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  activeButton: {
    borderColor: '#e8b849',
    backgroundColor: '#1e2a4a',
  },
  actionEmoji: {
    fontSize: 32,
    marginBottom: 6,
  },
  actionLabel: {
    color: '#e0d7ff',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  // --- Hint ---
  hintText: {
    color: '#4a4370',
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 20,
    textAlign: 'center',
  },

  // --- Mantra button ---
  mantraButton: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
    backgroundColor: '#1a2240',
    borderWidth: 1,
    borderColor: '#2e3a5e',
  },
  mantraButtonActive: {
    borderColor: '#e8b849',
    backgroundColor: '#1e2a4a',
  },
  mantraButtonText: {
    color: '#e0d7ff',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
