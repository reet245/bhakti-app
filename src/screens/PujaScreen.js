import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from 'react-native';
import { Audio, ResizeMode, Video } from 'expo-av';

import { deities, pujaItems } from '../data/pujaData';

const categories = ['All', 'Popular', 'Shiva', 'Shakti', 'Vishnu'];
export default function PujaScreen() {
  const [viewMode, setViewMode] = useState('chooseDeity');
  const [selectedDeity, setSelectedDeity] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [flowers, setFlowers] = useState([]);
  const [diyaActive, setDiyaActive] = useState(false);
  const [agarbattiActive, setAgarbattiActive] = useState(false);
  const [prasadVisible, setPrasadVisible] = useState(false);
  const [bellActive, setBellActive] = useState(false);
  const [aartiActive, setAartiActive] = useState(false);
  const diyaFlickerValue = useRef(new Animated.Value(0)).current;
  const smoke1 = useRef(new Animated.Value(0)).current;
  const smoke2 = useRef(new Animated.Value(0)).current;
  const smoke3 = useRef(new Animated.Value(0)).current;
  const smoke4 = useRef(new Animated.Value(0)).current;
  const smoke5 = useRef(new Animated.Value(0)).current;
  const bellSwingValue = useRef(new Animated.Value(0)).current;
  const aartiMotionValue = useRef(new Animated.Value(0)).current;
  const aartiSoundRef = useRef(null);
  const bellSoundRef = useRef(null);
  const aartiSessionRef = useRef(0);

  const visibleDeities =
    activeCategory === 'All'
      ? deities
      : deities.filter(deity => deity.category === activeCategory);

  useEffect(() => {
    if (!diyaActive) {
      diyaFlickerValue.stopAnimation();
      diyaFlickerValue.setValue(0);
      return;
    }

    const flicker = Animated.loop(
      Animated.sequence([
        Animated.timing(diyaFlickerValue, {
          toValue: 1,
          duration: 950,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(diyaFlickerValue, {
          toValue: 0,
          duration: 820,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    flicker.start();

    return () => {
      flicker.stop();
    };
  }, [diyaActive, diyaFlickerValue]);

  function startSmokeLoop(value, delay = 0, duration = 4200) {
    value.setValue(0);
    return Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(value, {
          toValue: 1,
          duration,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
  }

  useEffect(() => {
    const smokeValues = [smoke1, smoke2, smoke3, smoke4, smoke5];

    if (!agarbattiActive) {
      smokeValues.forEach(value => {
        value.stopAnimation();
        value.setValue(0);
      });
      return;
    }

    const smokeLoops = [
      startSmokeLoop(smoke1, 0, 4200),
      startSmokeLoop(smoke2, 700, 4200),
      startSmokeLoop(smoke3, 1400, 4200),
      startSmokeLoop(smoke4, 2100, 4200),
      startSmokeLoop(smoke5, 2800, 5000),
    ];
    smokeLoops.forEach(loop => loop.start());

    return () => {
      smokeLoops.forEach(loop => loop.stop());
    };
  }, [agarbattiActive, smoke1, smoke2, smoke3, smoke4, smoke5]);

  useEffect(() => {
    if (!bellActive) {
      bellSwingValue.stopAnimation();
      bellSwingValue.setValue(0);
      stopBellAudio();
      return;
    }

    playBellAudio();
    const swing = Animated.loop(
      Animated.sequence([
        Animated.timing(bellSwingValue, {
          toValue: 1,
          duration: 130,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(bellSwingValue, {
          toValue: 0,
          duration: 130,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    swing.start();

    return () => {
      swing.stop();
    };
  }, [bellActive, bellSwingValue]);

  useEffect(() => {
    if (!aartiActive) {
      aartiMotionValue.stopAnimation();
      aartiMotionValue.setValue(0);
      return;
    }

    const aarti = Animated.loop(
      Animated.sequence([
        Animated.timing(aartiMotionValue, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(aartiMotionValue, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    aarti.start();

    return () => {
      aarti.stop();
    };
  }, [aartiActive, aartiMotionValue]);

  useEffect(() => {
    if (!aartiActive) return;

    playAartiAudio();
  }, [aartiActive, selectedDeity]);

  useEffect(() => {
    return () => {
      diyaFlickerValue.stopAnimation();
      [smoke1, smoke2, smoke3, smoke4, smoke5].forEach(value => {
        value.stopAnimation();
        value.setValue(0);
      });
      bellSwingValue.stopAnimation();
      aartiMotionValue.stopAnimation();
      stopBellAudio();
      stopAartiAudio();
    };
  }, [aartiMotionValue, bellSwingValue, diyaFlickerValue, smoke1, smoke2, smoke3, smoke4, smoke5]);

  function openTemple(deity) {
    resetPuja();
    setSelectedDeity(deity);
    setViewMode('temple');
  }

  function backToChooseDeity() {
    resetPuja();
    setSelectedDeity(null);
    setViewMode('chooseDeity');
  }

  function handleTempleBack() {
    if (aartiActive && selectedDeity?.aartiVideo) {
      setAartiActive(false);
      stopAartiAudio();
      return;
    }

    backToChooseDeity();
  }

  function resetPuja() {
    setFlowers([]);
    setDiyaActive(false);
    setAgarbattiActive(false);
    setPrasadVisible(false);
    setBellActive(false);
    setAartiActive(false);
    stopBellAudio();
    stopAartiAudio();
  }

  function handleFlowerPress() {
    console.log('FLOWER PRESSED');
    setFlowers([
      {
        id: `${Date.now()}-${Math.random()}`,
        offsetX: 0,
        offsetY: 0,
        rotation: 0,
      },
    ]);
  }

  function handleDiyaPress() {
    setDiyaActive(value => !value);
  }

  function handleAgarbattiPress() {
    setAgarbattiActive(value => !value);
  }

  function handlePrasadPress() {
    console.log('PRASAD PRESSED');
    setPrasadVisible(prev => !prev);
  }

  function handlePujaAction(actionId) {
    if (actionId === 'flower') return handleFlowerPress();
    if (actionId === 'diya') return handleDiyaPress();
    if (actionId === 'agarbatti') return handleAgarbattiPress();
    if (actionId === 'prasad') return handlePrasadPress();
    if (actionId === 'bell') {
      setBellActive(value => {
        const nextValue = !value;
        if (nextValue) {
          Vibration.vibrate(35);
        }
        return nextValue;
      });
    }

    if (actionId === 'aarti') {
      if (aartiActive) {
        setAartiActive(false);
        stopAartiAudio();
        return;
      }

      setAartiActive(true);
    }
  }

  async function stopBellAudio() {
    try {
      if (bellSoundRef.current) {
        await bellSoundRef.current.stopAsync();
        await bellSoundRef.current.unloadAsync();
        bellSoundRef.current = null;
      }
    } catch (error) {
      console.log('Bell audio cleanup failed:', error);
      bellSoundRef.current = null;
    }
  }

  async function playBellAudio() {
    try {
      await stopBellAudio();

      if (!pujaItems.bell?.audio) return;

      const { sound } = await Audio.Sound.createAsync(pujaItems.bell.audio, {
        shouldPlay: true,
        isLooping: true,
        volume: 0.55,
      });
      bellSoundRef.current = sound;
    } catch (error) {
      console.log('Bell audio failed:', error);
      bellSoundRef.current = null;
    }
  }

  async function stopAartiAudio(invalidateSession = true) {
    if (invalidateSession) {
      aartiSessionRef.current += 1;
    }

    try {
      if (aartiSoundRef.current) {
        await aartiSoundRef.current.stopAsync();
        await aartiSoundRef.current.unloadAsync();
        aartiSoundRef.current = null;
      }
    } catch (error) {
      console.log('Aarti audio cleanup failed:', error);
      aartiSoundRef.current = null;
    }
  }

  async function playAartiAudio() {
    const deity = selectedDeity || deities[0];
    const sessionId = aartiSessionRef.current + 1;
    aartiSessionRef.current = sessionId;

    try {
      await stopAartiAudio(false);

      if (!deity?.aartiAudio) return;

      const { sound } = await Audio.Sound.createAsync(deity.aartiAudio, {
        shouldPlay: true,
        isLooping: false,
        volume: 0.75,
      });

      if (aartiSessionRef.current !== sessionId) {
        await sound.unloadAsync();
        return;
      }

      aartiSoundRef.current = sound;
      sound.setOnPlaybackStatusUpdate(status => {
        if (status.isLoaded && status.didJustFinish && aartiSessionRef.current === sessionId) {
          aartiSoundRef.current = null;
          sound.unloadAsync().catch(error => console.log('Aarti audio unload failed:', error));
          setAartiActive(false);
        }
      });
    } catch (error) {
      console.log('Aarti audio failed:', error);
      if (aartiSessionRef.current === sessionId) {
        setAartiActive(false);
      }
    }
  }

  function renderChooseDeity() {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.chooseContent}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>Choose Your Deity</Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
          {categories.map(category => (
            <TouchableOpacity
              key={category}
              style={[styles.categoryChip, activeCategory === category && styles.categoryChipActive]}
              onPress={() => setActiveCategory(category)}
              activeOpacity={0.8}
            >
              <Text style={[styles.categoryText, activeCategory === category && styles.categoryTextActive]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.deityGrid}>
          {visibleDeities.map(deity => (
            <TouchableOpacity
              key={deity.id}
              style={styles.deityCard}
              onPress={() => openTemple(deity)}
              activeOpacity={0.86}
            >
              <Image source={deity.image} style={styles.deityImage} />
              <Text style={styles.deityName}>{deity.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    );
  }

  function renderTemple() {
    const deity = selectedDeity || deities[0];
    const showAartiVideo = aartiActive && deity?.aartiVideo;
    const bellTwist = bellSwingValue.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: ['-10deg', '10deg', '-10deg'],
    });
    return (
      <View style={styles.templeScreen}>
        {!showAartiVideo && (
          <ImageBackground
            source={deity.image}
            style={styles.templeImageBackground}
            imageStyle={styles.templeImageFull}
            resizeMode="cover"
          />
        )}

        {showAartiVideo && (
          <Video
            source={deity.aartiVideo}
            style={styles.aartiVideo}
            resizeMode={ResizeMode.COVER}
            shouldPlay
            isLooping
            isMuted
          />
        )}

        {!showAartiVideo && (
        <View style={styles.offeringsLayer} pointerEvents="none">
          {flowers.map((flower, index) => (
            <OfferingImage
              key={flower.id}
              source={pujaItems.flower.image}
              scale={1.8}
              style={[
                styles.flowerOfferingFrame,
                {
                  transform: [
                    { translateX: flower.offsetX + index * 3 },
                    { translateY: -flower.offsetY },
                    { rotate: `${flower.rotation}deg` },
                  ],
                },
              ]}
            />
          ))}
          {diyaActive && (
            <Animated.View
              style={[
                styles.diyaOfferingWrap,
                {
                  opacity: diyaFlickerValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.92, 1],
                  }),
                  transform: [
                    {
                      scale: diyaFlickerValue.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.98, 1.03],
                      }),
                    },
                  ],
                },
              ]}
            >
              <OfferingImage
                source={pujaItems.diya.image}
                scale={2.0}
                flipX
                style={[
                  styles.offeringFill,
                ]}
              />
            </Animated.View>
          )}
          {agarbattiActive && (
            <View style={styles.agarbattiWrap}>
              <Animated.View
                style={[
                  styles.smokeWisp,
                  styles.smokeWisp1,
                  {
                    opacity: smoke1.interpolate({
                      inputRange: [0, 0.2, 0.75, 1],
                      outputRange: [0, 0.65, 0.38, 0],
                    }),
                    transform: [
                      {
                        translateY: smoke1.interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, -120],
                        }),
                      },
                      {
                        translateX: smoke1.interpolate({
                          inputRange: [0, 0.5, 1],
                          outputRange: [0, -12, 8],
                        }),
                      },
                      {
                        scale: smoke1.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.8, 1.25],
                        }),
                      },
                    ],
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.smokeWisp,
                  styles.smokeWispSoft,
                  styles.smokeWisp2,
                  {
                    opacity: smoke2.interpolate({
                      inputRange: [0, 0.2, 0.75, 1],
                      outputRange: [0, 0.56, 0.32, 0],
                    }),
                    transform: [
                      {
                        translateY: smoke2.interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, -112],
                        }),
                      },
                      {
                        translateX: smoke2.interpolate({
                          inputRange: [0, 0.5, 1],
                          outputRange: [4, 14, -10],
                        }),
                      },
                      {
                        scale: smoke2.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.75, 1.12],
                        }),
                      },
                    ],
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.smokeWisp,
                  styles.smokeWisp3,
                  {
                    opacity: smoke3.interpolate({
                      inputRange: [0, 0.2, 0.75, 1],
                      outputRange: [0, 0.58, 0.34, 0],
                    }),
                    transform: [
                      {
                        translateY: smoke3.interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, -116],
                        }),
                      },
                      {
                        translateX: smoke3.interpolate({
                          inputRange: [0, 0.5, 1],
                          outputRange: [-4, -16, 6],
                        }),
                      },
                      {
                        scale: smoke3.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.72, 1.16],
                        }),
                      },
                    ],
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.smokeWisp,
                  styles.smokeWispSoft,
                  styles.smokeWisp4,
                  {
                    opacity: smoke4.interpolate({
                      inputRange: [0, 0.2, 0.75, 1],
                      outputRange: [0, 0.46, 0.24, 0],
                    }),
                    transform: [
                      {
                        translateY: smoke4.interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, -104],
                        }),
                      },
                      {
                        translateX: smoke4.interpolate({
                          inputRange: [0, 0.5, 1],
                          outputRange: [8, 0, 18],
                        }),
                      },
                      {
                        scale: smoke4.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.68, 1.05],
                        }),
                      },
                    ],
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.smokeWisp,
                  styles.smokeWisp5,
                  {
                    opacity: smoke5.interpolate({
                      inputRange: [0, 0.2, 0.75, 1],
                      outputRange: [0, 0.52, 0.28, 0],
                    }),
                    transform: [
                      {
                        translateY: smoke5.interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, -128],
                        }),
                      },
                      {
                        translateX: smoke5.interpolate({
                          inputRange: [0, 0.5, 1],
                          outputRange: [-8, 10, -18],
                        }),
                      },
                      {
                        scale: smoke5.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.8, 1.32],
                        }),
                      },
                    ],
                  },
                ]}
              />
              <OfferingImage
                source={pujaItems.agarbatti.image}
                scale={2.2}
                style={styles.offeringFill}
              />
            </View>
          )}
          {prasadVisible && (
            <OfferingImage
              source={pujaItems.prasad.image}
              scale={1.3}
              style={styles.prasadOfferingFrame}
            />
          )}
          {aartiActive && !deity?.aartiVideo && (
            <Animated.View
              style={[
                styles.aartiOfferingWrap,
                {
                  transform: [
                    {
                      translateX: aartiMotionValue.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [-16, 16, -16],
                      }),
                    },
                    {
                      translateY: aartiMotionValue.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [10, -12, 10],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Animated.View style={styles.aartiGlow} />
              <Image source={pujaItems.aartiThali.image} style={styles.aartiOffering} />
            </Animated.View>
          )}
        </View>
        )}

        <View style={[styles.templeTopBar, showAartiVideo && styles.templeTopBarVideo]}>
          <TouchableOpacity
            style={[styles.templeBackButton, showAartiVideo && styles.templeBackButtonVideo]}
            onPress={handleTempleBack}
            activeOpacity={0.8}
          >
            <Text style={[styles.backText, showAartiVideo && styles.backTextVideo]}>{'<'}</Text>
          </TouchableOpacity>
          {!showAartiVideo && (
            <View style={styles.templeTitleWrap}>
              <Text style={styles.templeDeityName}>{deity.name}</Text>
            </View>
          )}
        </View>

        {!showAartiVideo && (
          <>
            <TouchableOpacity
              style={[styles.floatingBellButton, bellActive && styles.floatingBellButtonActive]}
              onPress={() => handlePujaAction('bell')}
              activeOpacity={0.86}
            >
              <Animated.Image
                source={pujaItems.bell.image}
                style={[
                  styles.floatingBellImage,
                  bellActive && {
                    transform: [{ scale: 2.1 }, { rotate: bellTwist }],
                  },
                ]}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.aartiButton, aartiActive && styles.aartiButtonActive]}
              onPress={() => handlePujaAction('aarti')}
              activeOpacity={0.86}
            >
              <View style={styles.aartiButtonGlow} />
              <View style={styles.aartiImageCenterBox}>
                <Image source={pujaItems.aartiThali.image} style={styles.aartiButtonImage} />
              </View>
            </TouchableOpacity>

            <View style={styles.actionTray}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.actionTrayContent}
              >
                <PujaActionButton
                  label="Flower"
                  image={pujaItems.flower.image}
                  active={isActionActive('flower', { flowers })}
                  onPress={handleFlowerPress}
                />
                <PujaActionButton
                  label="Diya"
                  image={pujaItems.diya.image}
                  active={isActionActive('diya', { diyaActive })}
                  onPress={handleDiyaPress}
                />
                <PujaActionButton
                  label="Agarbatti"
                  image={pujaItems.agarbatti.image}
                  active={isActionActive('agarbatti', { agarbattiActive })}
                  onPress={handleAgarbattiPress}
                />
                <PujaActionButton
                  label="Prasad"
                  image={pujaItems.prasad.image}
                  active={isActionActive('prasad', { prasadVisible })}
                  onPress={handlePrasadPress}
                />
              </ScrollView>
              <TouchableOpacity style={styles.resetButton} onPress={resetPuja} activeOpacity={0.82}>
                <Text style={styles.resetButtonText}>Reset Puja</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    );
  }

  if (viewMode === 'chooseDeity') return renderChooseDeity();
  if (viewMode === 'temple') return renderTemple();
  return renderChooseDeity();
}

function isActionActive(actionId, state) {
  if (actionId === 'flower') return state.flowers.length > 0;
  if (actionId === 'diya') return state.diyaActive;
  if (actionId === 'agarbatti') return state.agarbattiActive;
  if (actionId === 'prasad') return state.prasadVisible;
  if (actionId === 'bell') return state.bellActive;
  if (actionId === 'aarti') return state.aartiActive;
  return false;
}

function PujaActionButton({ item, image, label, active, animatedStyle, onPress }) {
  if (!item && !image) return null;

  const actionLabel = label || item?.name || '';
  const fallback = actionLabel
    .split(' ')
    .map(word => word[0])
    .join('')
    .slice(0, 2);

  return (
    <TouchableOpacity style={styles.pujaActionButton} onPress={onPress} activeOpacity={0.82}>
      <Animated.View style={[styles.pujaActionIcon, active && styles.pujaActionIconActive, animatedStyle]}>
        {image || item?.image ? (
          <ScaledPujaIcon source={image || item.image} scale={2.2} />
        ) : (
          <Text style={styles.pujaActionFallback}>{fallback}</Text>
        )}
      </Animated.View>
      <Text style={styles.pujaActionLabel}>{actionLabel}</Text>
    </TouchableOpacity>
  );
}

function ScaledPujaIcon({ source, scale = 1.8 }) {
  return (
    <Image
      source={source}
      style={[
        styles.scaledPujaIcon,
        { transform: [{ scale }] },
      ]}
    />
  );
}

function OfferingImage({ source, style, scale = 2.4, flipX = false }) {
  const transform = flipX ? [{ scaleX: -1 }, { scale }] : [{ scale }];

  return (
    <View style={[styles.offeringFrame, style]}>
      <Image
        source={source}
        style={[
          styles.offeringImageScaled,
          { transform },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8EFD9',
  },
  chooseContent: {
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 34,
  },
  title: {
    color: '#3A220D',
    fontSize: 30,
    fontWeight: '900',
    textAlign: 'center',
  },
  subtitle: {
    color: '#8B6A3E',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
  },
  header: {
    minHeight: 72,
    justifyContent: 'center',
  },
  headerText: {
    paddingHorizontal: 42,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF7E8',
    borderWidth: 1,
    borderColor: '#E8C982',
    zIndex: 2,
  },
  backText: {
    color: '#5A3518',
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '900',
  },
  backTextVideo: {
    color: '#FFF7E8',
  },
  categoryRow: {
    gap: 10,
    paddingVertical: 18,
  },
  categoryChip: {
    paddingHorizontal: 17,
    paddingVertical: 9,
    borderRadius: 18,
    backgroundColor: '#FFF7E8',
    borderWidth: 1,
    borderColor: '#E8C982',
  },
  categoryChipActive: {
    backgroundColor: '#C8942E',
    borderColor: '#C8942E',
  },
  categoryText: {
    color: '#8B6A3E',
    fontSize: 12,
    fontWeight: '800',
  },
  categoryTextActive: {
    color: '#FFF7E8',
  },
  deityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 14,
  },
  deityCard: {
    width: '48%',
    borderRadius: 18,
    padding: 10,
    backgroundColor: '#FFF7E8',
    borderWidth: 1,
    borderColor: '#E8C982',
  },
  deityImage: {
    width: '100%',
    height: 154,
    borderRadius: 14,
    backgroundColor: '#F4DFAC',
  },
  deityName: {
    color: '#3A220D',
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 2,
  },
  templeScreen: {
    flex: 1,
    backgroundColor: '#F8EFD9',
  },
  templeImageBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  templeImageFull: {
    resizeMode: 'cover',
  },
  aartiVideo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
    zIndex: 100,
  },
  templeTopBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    minHeight: 112,
    paddingHorizontal: 20,
    paddingTop: 26,
    flexDirection: 'row',
    alignItems: 'flex-start',
    zIndex: 50,
  },
  templeTopBarVideo: {
    zIndex: 120,
  },
  templeBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 247, 232, 0.88)',
    borderWidth: 1,
    borderColor: '#E8C982',
    marginTop: 3,
    zIndex: 2,
  },
  templeBackButtonVideo: {
    backgroundColor: 'rgba(0, 0, 0, 0.38)',
    borderColor: 'rgba(255, 247, 232, 0.5)',
    zIndex: 121,
  },
  templeTitleWrap: {
    position: 'absolute',
    left: 76,
    right: 76,
    top: 31,
    alignItems: 'center',
  },
  templeDeityName: {
    color: '#FFF7E8',
    fontSize: 19,
    fontWeight: '900',
    textAlign: 'center',
    textShadowColor: 'rgba(58, 34, 13, 0.78)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  actionTray: {
    position: 'absolute',
    left: 22,
    right: 22,
    bottom: 18,
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderRadius: 22,
    backgroundColor: 'rgba(45, 25, 8, 0.32)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 140, 0.42)',
    zIndex: 35,
    shadowColor: '#D6A84A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 7,
  },
  actionTrayContent: {
    gap: 8,
    paddingHorizontal: 0,
    alignItems: 'center',
    justifyContent: 'space-around',
    minWidth: '100%',
  },
  pujaActionButton: {
    width: 58,
    minHeight: 63,
    alignItems: 'center',
  },
  pujaActionIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 220, 150, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 140, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#C8942E',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 3,
  },
  pujaActionIconActive: {
    backgroundColor: 'rgba(255, 220, 150, 0.28)',
    borderColor: 'rgba(255, 215, 140, 0.88)',
    shadowColor: '#D6A84A',
    shadowOpacity: 0.42,
    shadowRadius: 15,
    elevation: 7,
  },
  scaledPujaIcon: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  pujaActionFallback: {
    color: '#5A3518',
    fontSize: 12,
    fontWeight: '900',
  },
  pujaActionLabel: {
    color: '#FFE8B0',
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 2,
  },
  offeringsLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 80,
    elevation: 80,
    overflow: 'visible',
    pointerEvents: 'none',
  },
  offeringFrame: {
    position: 'absolute',
    overflow: 'visible',
    alignItems: 'center',
    justifyContent: 'center',
  },
  offeringImageScaled: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  offeringFill: {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  flowerOfferingFrame: {
    left: '28%',
    bottom: '24%',
    width: '44%',
    aspectRatio: 1,
    zIndex: 90,
    elevation: 90,
  },
  aartiOffering: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  aartiOfferingWrap: {
    position: 'absolute',
    left: '20%',
    bottom: '18%',
    width: '60%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 48,
  },
  aartiGlow: {
    position: 'absolute',
    width: '74%',
    height: '74%',
    borderRadius: 999,
    backgroundColor: '#F2B544',
  },
  diyaOfferingWrap: {
    position: 'absolute',
    left: '2%',
    bottom: '24%',
    width: '30%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 88,
    elevation: 88,
  },
  agarbattiWrap: {
    position: 'absolute',
    right: '2%',
    bottom: '19%',
    width: '38%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    zIndex: 89,
    elevation: 89,
    overflow: 'visible',
  },
  smokeWisp: {
    position: 'absolute',
    bottom: '62%',
    width: 34,
    height: 110,
    borderLeftWidth: 3,
    borderColor: 'rgba(255, 245, 220, 0.65)',
    borderRadius: 40,
    zIndex: 120,
    elevation: 120,
  },
  smokeWispSoft: {
    borderLeftWidth: 2,
    borderColor: 'rgba(255, 245, 220, 0.45)',
  },
  smokeWisp1: {
    right: '38%',
    height: 118,
  },
  smokeWisp2: {
    right: '30%',
    bottom: '63%',
    width: 36,
    height: 116,
  },
  smokeWisp3: {
    right: '46%',
    bottom: '64%',
    width: 30,
    height: 108,
    borderColor: 'rgba(255, 245, 220, 0.58)',
  },
  smokeWisp4: {
    right: '25%',
    bottom: '61%',
    width: 28,
    height: 100,
  },
  smokeWisp5: {
    right: '36%',
    bottom: '65%',
    width: 34,
    height: 128,
    borderColor: 'rgba(255, 245, 220, 0.52)',
  },
  prasadOfferingFrame: {
    right: '7%',
    bottom: '32%',
    width: '26%',
    aspectRatio: 1,
    zIndex: 92,
    elevation: 92,
  },
  floatingBellButton: {
    position: 'absolute',
    right: 16,
    top: '45%',
    width: 58,
    height: 58,
    borderRadius: 29,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(45, 25, 8, 0.42)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 140, 0.65)',
    shadowColor: '#D6A84A',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 12,
    zIndex: 45,
  },
  floatingBellButtonActive: {
    backgroundColor: 'rgba(66, 38, 12, 0.58)',
    borderColor: 'rgba(255, 225, 150, 0.95)',
    shadowOpacity: 0.55,
    shadowRadius: 18,
    elevation: 14,
  },
  floatingBellImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
    transform: [{ scale: 2.1 }],
  },
  aartiButton: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: 115,
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(45, 25, 8, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 140, 0.75)',
    shadowColor: '#D6A84A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.36,
    shadowRadius: 16,
    elevation: 10,
    zIndex: 50,
    overflow: 'hidden',
  },
  aartiButtonActive: {
    backgroundColor: 'rgba(66, 38, 12, 0.62)',
    borderColor: 'rgba(255, 225, 150, 0.96)',
    shadowOpacity: 0.52,
  },
  aartiButtonGlow: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(242, 181, 68, 0.16)',
  },
  aartiImageCenterBox: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  aartiButtonImage: {
    width: 68,
    height: 68,
    resizeMode: 'contain',
    alignSelf: 'center',
  },
  resetButton: {
    alignSelf: 'center',
    marginTop: 3,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 3,
    backgroundColor: 'rgba(255, 220, 150, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 140, 0.38)',
  },
  resetButtonText: {
    color: '#FFE8B0',
    fontSize: 10,
    fontWeight: '900',
  },
});
