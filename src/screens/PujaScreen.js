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
  View,
} from 'react-native';
import { Audio } from 'expo-av';
import * as ExpoAV from 'expo-av';

import { deities, pujaItems, pujaModes } from '../data/pujaData';

const homeBackground = require('../../assets/home-bg.jpeg');
const categories = ['All', 'Popular', 'Shiva', 'Shakti', 'Vishnu'];

export default function PujaScreen() {
  const [viewMode, setViewMode] = useState('landing');
  const [selectedPujaMode, setSelectedPujaMode] = useState(null);
  const [selectedDeity, setSelectedDeity] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [flowers, setFlowers] = useState([]);
  const [diyas, setDiyas] = useState([]);
  const [showAgarbatti, setShowAgarbatti] = useState(false);
  const [showPrasad, setShowPrasad] = useState(false);
  const [bellActive, setBellActive] = useState(false);
  const [aartiActive, setAartiActive] = useState(false);
  const flowerAnimValues = useRef({});
  const diyaFlickerValue = useRef(new Animated.Value(0)).current;
  const agarbattiSmokeValue = useRef(new Animated.Value(0)).current;
  const bellSwingValue = useRef(new Animated.Value(0)).current;
  const aartiMotionValue = useRef(new Animated.Value(0)).current;
  const aartiSoundRef = useRef(null);
  const aartiSessionRef = useRef(0);

  const visibleDeities =
    activeCategory === 'All'
      ? deities
      : deities.filter(deity => deity.category === activeCategory);

  useEffect(() => {
    if (diyas.length === 0) {
      diyaFlickerValue.stopAnimation();
      diyaFlickerValue.setValue(0);
      return;
    }

    const flicker = Animated.loop(
      Animated.sequence([
        Animated.timing(diyaFlickerValue, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(diyaFlickerValue, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    flicker.start();

    return () => {
      flicker.stop();
    };
  }, [diyas.length, diyaFlickerValue]);

  useEffect(() => {
    if (!showAgarbatti) {
      agarbattiSmokeValue.stopAnimation();
      agarbattiSmokeValue.setValue(0);
      return;
    }

    const smoke = Animated.loop(
      Animated.timing(agarbattiSmokeValue, {
        toValue: 1,
        duration: 3600,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      })
    );
    smoke.start();

    return () => {
      smoke.stop();
    };
  }, [agarbattiSmokeValue, showAgarbatti]);

  useEffect(() => {
    if (!bellActive) {
      bellSwingValue.stopAnimation();
      bellSwingValue.setValue(0);
      return;
    }

    const swing = Animated.loop(
      Animated.sequence([
        Animated.timing(bellSwingValue, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(bellSwingValue, {
          toValue: 0,
          duration: 1200,
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
      Animated.timing(aartiMotionValue, {
        toValue: 1,
        duration: 5200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
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
      agarbattiSmokeValue.stopAnimation();
      bellSwingValue.stopAnimation();
      aartiMotionValue.stopAnimation();
      stopAartiAudio();
    };
  }, [agarbattiSmokeValue, aartiMotionValue, bellSwingValue, diyaFlickerValue]);

  function choosePujaMode(mode) {
    setSelectedPujaMode(mode);
    setViewMode('chooseDeity');
  }

  function openPreviousPuja(deity) {
    resetPuja();
    setSelectedPujaMode('full');
    setSelectedDeity(deity);
    setViewMode('temple');
  }

  function openTemple(deity) {
    resetPuja();
    setSelectedDeity(deity);
    setViewMode('temple');
  }

  function backToLanding() {
    setSelectedPujaMode(null);
    setSelectedDeity(null);
    setActiveCategory('All');
    setViewMode('landing');
    resetPuja();
  }

  function backToChooseDeity() {
    resetPuja();
    setViewMode('chooseDeity');
  }

  function resetPuja() {
    flowerAnimValues.current = {};
    setFlowers([]);
    setDiyas([]);
    setShowAgarbatti(false);
    setShowPrasad(false);
    setBellActive(false);
    setAartiActive(false);
    stopAartiAudio();
  }

  function handlePujaAction(actionId) {
    if (actionId === 'flower') {
      const id = Date.now() + Math.random();
      flowerAnimValues.current[id] = new Animated.Value(0);
      setFlowers(currentFlowers => {
        const nextIndex = currentFlowers.length;
        const row = Math.floor(nextIndex / 7);
        const column = nextIndex % 7;
        const centerOffset = column - 3;

        return [
          ...currentFlowers,
          {
            id,
            xOffset: centerOffset * 18 + (Math.random() * 8 - 4),
            yOffset: row * 10 + Math.random() * 6,
            rotation: `${Math.random() * 28 - 14}deg`,
            scale: 0.82 + Math.random() * 0.22,
          },
        ];
      });
      Animated.timing(flowerAnimValues.current[id], {
        toValue: 1,
        duration: 360,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
      return;
    }

    if (actionId === 'diya') {
      setDiyas(currentDiyas =>
        currentDiyas.length >= 2
          ? []
          : [...currentDiyas, { id: `${Date.now()}-${currentDiyas.length}` }]
      );
      return;
    }

    if (actionId === 'agarbatti') {
      setShowAgarbatti(value => !value);
      return;
    }

    if (actionId === 'prasad') {
      setShowPrasad(value => !value);
      return;
    }

    if (actionId === 'bell') {
      setBellActive(value => !value);
      return;
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

  function renderLanding() {
    const previousDeities = deities.filter(deity => deity.id === 'shiv' || deity.id === 'durga');

    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.landingContent}>
        <Text style={styles.title}>Puja</Text>
        <Text style={styles.subtitle}>Connect with divine energy</Text>

        <ImageBackground source={homeBackground} style={styles.heroCard} imageStyle={styles.heroImage}>
          <View style={styles.heroOverlay}>
            <Text style={styles.heroTitle}>Begin Your Sacred Puja</Text>
            <Text style={styles.heroText}>A peaceful space for prayer, offerings, and devotion.</Text>
          </View>
        </ImageBackground>

        <Text style={styles.sectionTitle}>How would you like to worship?</Text>
        <View style={styles.modeRow}>
          <PujaModeCard
            title="Quick Puja"
            subtitle="A short devotional ritual"
            onPress={() => choosePujaMode('quick')}
          />
          <PujaModeCard
            title="Full Puja"
            subtitle="A complete worship flow"
            onPress={() => choosePujaMode('full')}
          />
        </View>

        <Text style={styles.sectionTitle}>Previous Puja</Text>
        <View style={styles.previousList}>
          {previousDeities.map(deity => (
            <PreviousPujaCard key={deity.id} deity={deity} onPress={() => openPreviousPuja(deity)} />
          ))}
        </View>
      </ScrollView>
    );
  }

  function renderChooseDeity() {
    const subtitle =
      selectedPujaMode === 'quick' ? 'Choose deity for quick puja' : 'Choose deity for full puja';

    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.chooseContent}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={backToLanding} activeOpacity={0.8}>
            <Text style={styles.backText}>{'<'}</Text>
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.title}>Choose Your Deity</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
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
    const mode = selectedPujaMode ? pujaModes[selectedPujaMode] : pujaModes.full;
    const actionIds = mode?.actions || [];
    const hasFullScreenAartiVideo = aartiActive && Boolean(deity.aartiVideo);

    return (
      <View style={styles.templeScreen}>
        <ImageBackground
          source={deity.image}
          style={[
            styles.templeImageBackground,
            hasFullScreenAartiVideo && styles.templeImageBackgroundHidden,
          ]}
          imageStyle={styles.templeImageFull}
          resizeMode="cover"
        >
          <View style={styles.stageGlow} />
          <View style={styles.topGarland}>
            <View style={styles.garlandDot} />
            <View style={[styles.garlandDot, styles.garlandDotSmall]} />
            <View style={styles.garlandDot} />
            <View style={[styles.garlandDot, styles.garlandDotSmall]} />
            <View style={styles.garlandDot} />
          </View>
          <View style={styles.decorBellLeft}>
            <View style={styles.decorBellString} />
            <Animated.View
              style={[
                styles.decorBellShape,
                bellActive && {
                  transform: [
                    {
                      rotate: bellSwingValue.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: ['-4deg', '5deg', '-4deg'],
                      }),
                    },
                  ],
                },
              ]}
            />
          </View>
          <View style={styles.decorBellRight}>
            <View style={styles.decorBellString} />
            <Animated.View
              style={[
                styles.decorBellShape,
                bellActive && {
                  transform: [
                    {
                      rotate: bellSwingValue.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: ['4deg', '-5deg', '4deg'],
                      }),
                    },
                  ],
                },
              ]}
            />
          </View>
          <View style={styles.sideLampLeft}>
            <View style={styles.lampFlame} />
            <View style={styles.lampBowl} />
          </View>
          <View style={styles.sideLampRight}>
            <View style={styles.lampFlame} />
            <View style={styles.lampBowl} />
          </View>

          <View style={styles.offeringLayer} pointerEvents="none">
            {flowers.map(flower => (
              <Animated.Image
                key={flower.id}
                source={pujaItems.flower.image}
                style={[
                  styles.flowerOffering,
                  {
                    left: '50%',
                    bottom: 164 + flower.yOffset,
                    opacity: flowerAnimValues.current[flower.id] || 1,
                    transform: [
                      { translateX: flower.xOffset },
                      {
                        scale: flowerAnimValues.current[flower.id]
                          ? flowerAnimValues.current[flower.id].interpolate({
                              inputRange: [0, 1],
                              outputRange: [0.7, flower.scale],
                            })
                          : flower.scale,
                      },
                      { rotate: flower.rotation },
                    ],
                  },
                ]}
              />
            ))}
            {diyas.map((diya, index) => (
              <View
                key={diya.id}
                style={[styles.diyaOfferingWrap, index === 0 ? styles.diyaOfferingLeft : styles.diyaOfferingRight]}
              >
                <Animated.View
                  style={[
                    styles.diyaGlow,
                    {
                      opacity: diyaFlickerValue.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.28, 0.48],
                      }),
                      transform: [
                        {
                          scale: diyaFlickerValue.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.92, 1.08],
                          }),
                        },
                      ],
                    },
                  ]}
                />
                <Animated.Image
                  source={pujaItems.diya.image}
                  style={[
                    styles.diyaOffering,
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
                />
              </View>
            ))}
            {showAgarbatti && (
              <View style={styles.agarbattiWrap}>
                <Animated.View
                  style={[
                    styles.smokeWisp,
                    {
                      opacity: agarbattiSmokeValue.interpolate({
                        inputRange: [0, 0.3, 1],
                        outputRange: [0, 0.28, 0],
                      }),
                      transform: [
                        {
                          translateY: agarbattiSmokeValue.interpolate({
                            inputRange: [0, 1],
                            outputRange: [24, -42],
                          }),
                        },
                        {
                          translateX: agarbattiSmokeValue.interpolate({
                            inputRange: [0, 0.5, 1],
                            outputRange: [0, -8, 5],
                          }),
                        },
                      ],
                    },
                  ]}
                />
                <Image source={pujaItems.agarbatti.image} style={styles.agarbattiOffering} />
              </View>
            )}
            {showPrasad && (
              <Image source={pujaItems.prasad.image} style={styles.prasadOffering} />
            )}
            {aartiActive && !deity.aartiVideo && (
              <Animated.View
                style={[
                  styles.aartiOfferingWrap,
                  {
                    transform: [
                      {
                        translateX: aartiMotionValue.interpolate({
                          inputRange: [0, 0.25, 0.5, 0.75, 1],
                          outputRange: [0, -18, 0, 18, 0],
                        }),
                      },
                      {
                        translateY: aartiMotionValue.interpolate({
                          inputRange: [0, 0.25, 0.5, 0.75, 1],
                          outputRange: [0, -10, -18, -10, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Animated.View
                  style={[
                    styles.aartiGlow,
                    {
                      opacity: aartiMotionValue.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0.24, 0.42, 0.24],
                      }),
                    },
                  ]}
                />
                <Animated.Image
                  source={pujaItems.aartiThali.image}
                  style={[
                    styles.aartiOffering,
                    {
                      transform: [
                        {
                          rotate: aartiMotionValue.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0deg', '360deg'],
                          }),
                        },
                      ],
                    },
                  ]}
                />
              </Animated.View>
            )}
          </View>
        </ImageBackground>

        {hasFullScreenAartiVideo && (
          <ExpoAV.Video
            source={deity.aartiVideo}
            style={styles.aartiVideo}
            resizeMode="cover"
            shouldPlay={aartiActive}
            isLooping
            isMuted
            pointerEvents="none"
          />
        )}

        <View style={styles.templeTopBar}>
          <TouchableOpacity style={styles.templeBackButton} onPress={backToChooseDeity} activeOpacity={0.8}>
            <Text style={styles.backText}>{'<'}</Text>
          </TouchableOpacity>
          <View style={styles.templeTitleWrap}>
            <Text style={styles.templeDeityName}>{deity.name}</Text>
            <Text style={styles.templeModeName}>{mode?.name || 'Puja'}</Text>
          </View>
        </View>

        <View style={styles.actionTray}>
          {bellActive && (
            <View style={styles.bellStatus}>
              <Text style={styles.bellStatusText}>Bell selected</Text>
            </View>
          )}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.actionTrayContent}
          >
            {actionIds.map(actionId => (
              <PujaActionButton
                key={actionId}
                item={actionId === 'aarti' ? pujaItems.aartiThali : pujaItems[actionId]}
                label={actionId === 'aarti' ? (aartiActive ? 'Stop' : 'Aarti') : null}
                active={isActionActive(actionId, {
                  flowers,
                  diyas,
                  showAgarbatti,
                  showPrasad,
                  bellActive,
                  aartiActive,
                })}
                onPress={() => handlePujaAction(actionId)}
              />
            ))}
          </ScrollView>
          <TouchableOpacity style={styles.resetButton} onPress={resetPuja} activeOpacity={0.82}>
            <Text style={styles.resetButtonText}>Reset Puja</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (viewMode === 'chooseDeity') return renderChooseDeity();
  if (viewMode === 'temple') return renderTemple();
  return renderLanding();
}

function PujaModeCard({ title, subtitle, onPress }) {
  return (
    <TouchableOpacity style={styles.modeCard} onPress={onPress} activeOpacity={0.86}>
      <View style={styles.goldMark} />
      <Text style={styles.modeTitle}>{title}</Text>
      <Text style={styles.modeSubtitle}>{subtitle}</Text>
    </TouchableOpacity>
  );
}

function PreviousPujaCard({ deity, onPress }) {
  return (
    <TouchableOpacity style={styles.previousCard} onPress={onPress} activeOpacity={0.86}>
      <Image source={deity.image} style={styles.previousImage} />
      <View style={styles.previousCopy}>
        <Text style={styles.previousName}>{deity.name}</Text>
        <Text style={styles.previousMeta}>Full Puja</Text>
      </View>
    </TouchableOpacity>
  );
}

function isActionActive(actionId, state) {
  if (actionId === 'flower') return state.flowers.length > 0;
  if (actionId === 'diya') return state.diyas.length > 0;
  if (actionId === 'agarbatti') return state.showAgarbatti;
  if (actionId === 'prasad') return state.showPrasad;
  if (actionId === 'bell') return state.bellActive;
  if (actionId === 'aarti') return state.aartiActive;
  return false;
}

function PujaActionButton({ item, label, active, onPress }) {
  if (!item) return null;

  const fallback = item.name
    .split(' ')
    .map(word => word[0])
    .join('')
    .slice(0, 2);

  return (
    <TouchableOpacity style={styles.pujaActionButton} onPress={onPress} activeOpacity={0.82}>
      <View style={[styles.pujaActionIcon, active && styles.pujaActionIconActive]}>
        {item.image ? (
          <Image source={item.image} style={styles.pujaActionImage} />
        ) : (
          <Text style={styles.pujaActionFallback}>{fallback}</Text>
        )}
      </View>
      <Text style={styles.pujaActionLabel}>{label || item.name}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8EFD9',
  },
  landingContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 34,
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
  heroCard: {
    height: 236,
    borderRadius: 24,
    overflow: 'hidden',
    marginTop: 24,
    backgroundColor: '#FFF7E8',
    borderWidth: 1,
    borderColor: '#E8C982',
  },
  heroImage: {
    borderRadius: 24,
    resizeMode: 'cover',
  },
  heroOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 22,
    backgroundColor: 'rgba(248, 239, 217, 0.34)',
  },
  heroTitle: {
    color: '#3A220D',
    fontSize: 24,
    fontWeight: '900',
  },
  heroText: {
    color: '#5A3518',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
    marginTop: 7,
    maxWidth: 270,
  },
  sectionTitle: {
    color: '#3A220D',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 24,
    marginBottom: 12,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modeCard: {
    flex: 1,
    minHeight: 138,
    borderRadius: 18,
    padding: 16,
    backgroundColor: '#FFF7E8',
    borderWidth: 1,
    borderColor: '#E8C982',
  },
  goldMark: {
    width: 42,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#C8942E',
    marginBottom: 18,
  },
  modeTitle: {
    color: '#3A220D',
    fontSize: 18,
    fontWeight: '900',
  },
  modeSubtitle: {
    color: '#8B6A3E',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
    marginTop: 7,
  },
  previousList: {
    gap: 12,
  },
  previousCard: {
    minHeight: 96,
    borderRadius: 18,
    padding: 10,
    backgroundColor: '#FFF7E8',
    borderWidth: 1,
    borderColor: '#E8C982',
    flexDirection: 'row',
    alignItems: 'center',
  },
  previousImage: {
    width: 76,
    height: 76,
    borderRadius: 14,
    backgroundColor: '#F4DFAC',
  },
  previousCopy: {
    marginLeft: 14,
  },
  previousName: {
    color: '#3A220D',
    fontSize: 17,
    fontWeight: '900',
  },
  previousMeta: {
    color: '#8B6A3E',
    fontSize: 12,
    fontWeight: '800',
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
  templeImageBackgroundHidden: {
    opacity: 0,
  },
  templeImageFull: {
    resizeMode: 'cover',
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
    zIndex: 6,
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
  templeTitleWrap: {
    position: 'absolute',
    left: 76,
    right: 76,
    top: 25,
    minHeight: 58,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 247, 232, 0.78)',
    borderWidth: 1,
    borderColor: 'rgba(232, 201, 130, 0.84)',
    alignItems: 'center',
  },
  templeDeityName: {
    color: '#3A220D',
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
  },
  templeModeName: {
    color: '#5A3518',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 3,
    textAlign: 'center',
  },
  stageGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(248, 218, 154, 0.18)',
  },
  topGarland: {
    position: 'absolute',
    top: 104,
    left: 52,
    right: 52,
    height: 18,
    borderTopWidth: 2,
    borderColor: 'rgba(200, 148, 46, 0.76)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    zIndex: 2,
  },
  garlandDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#C8942E',
    marginTop: -8,
  },
  garlandDotSmall: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#E8C982',
  },
  decorBellLeft: {
    position: 'absolute',
    top: 124,
    left: 28,
    alignItems: 'center',
  },
  decorBellRight: {
    position: 'absolute',
    top: 124,
    right: 28,
    alignItems: 'center',
  },
  decorBellString: {
    width: 2,
    height: 28,
    backgroundColor: '#C8942E',
  },
  decorBellShape: {
    width: 24,
    height: 22,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    backgroundColor: '#C8942E',
    borderWidth: 1,
    borderColor: '#FFF7E8',
  },
  sideLampLeft: {
    position: 'absolute',
    left: 22,
    bottom: 170,
    alignItems: 'center',
  },
  sideLampRight: {
    position: 'absolute',
    right: 22,
    bottom: 170,
    alignItems: 'center',
  },
  lampFlame: {
    width: 12,
    height: 18,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 8,
    backgroundColor: '#F2B544',
    transform: [{ rotate: '45deg' }],
  },
  lampBowl: {
    width: 34,
    height: 14,
    borderBottomLeftRadius: 17,
    borderBottomRightRadius: 17,
    backgroundColor: '#5A3518',
    marginTop: -2,
  },
  actionTray: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 24,
    minHeight: 96,
    borderRadius: 34,
    paddingTop: 9,
    paddingBottom: 10,
    backgroundColor: 'rgba(255, 247, 232, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(216, 168, 74, 0.55)',
    zIndex: 7,
    shadowColor: '#5A3518',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 7,
  },
  actionTrayContent: {
    gap: 8,
    paddingHorizontal: 11,
    alignItems: 'center',
  },
  pujaActionButton: {
    width: 58,
    minHeight: 70,
    alignItems: 'center',
  },
  pujaActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(232, 201, 130, 0.62)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#C8942E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  pujaActionIconActive: {
    backgroundColor: 'rgba(248, 223, 172, 0.62)',
    borderColor: 'rgba(200, 148, 46, 0.92)',
    shadowColor: '#C8942E',
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
  },
  pujaActionImage: {
    width: 31,
    height: 31,
    resizeMode: 'contain',
  },
  pujaActionFallback: {
    color: '#5A3518',
    fontSize: 12,
    fontWeight: '900',
  },
  pujaActionLabel: {
    color: '#5A3518',
    fontSize: 10.5,
    lineHeight: 13,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 5,
  },
  offeringLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 3,
  },
  flowerOffering: {
    position: 'absolute',
    width: 30,
    height: 30,
    marginLeft: -15,
    resizeMode: 'contain',
  },
  diyaOffering: {
    width: 54,
    height: 54,
    resizeMode: 'contain',
  },
  diyaOfferingWrap: {
    position: 'absolute',
    bottom: 170,
    width: 62,
    height: 62,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diyaOfferingLeft: {
    left: 74,
  },
  diyaOfferingRight: {
    right: 74,
  },
  diyaGlow: {
    position: 'absolute',
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#F2B544',
  },
  agarbattiWrap: {
    position: 'absolute',
    right: 52,
    bottom: 214,
    width: 64,
    height: 116,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  agarbattiOffering: {
    width: 54,
    height: 92,
    resizeMode: 'contain',
  },
  smokeWisp: {
    position: 'absolute',
    top: 2,
    width: 26,
    height: 54,
    borderLeftWidth: 2,
    borderColor: '#8B6A3E',
    borderRadius: 20,
  },
  prasadOffering: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: 184,
    width: 70,
    height: 56,
    resizeMode: 'contain',
  },
  aartiOffering: {
    width: 72,
    height: 72,
    resizeMode: 'contain',
  },
  aartiOfferingWrap: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: 244,
    width: 82,
    height: 82,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aartiGlow: {
    position: 'absolute',
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#F2B544',
  },
  aartiVideo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    zIndex: 4,
  },
  bellStatus: {
    alignSelf: 'center',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 5,
    backgroundColor: 'rgba(255, 247, 232, 0.48)',
    borderWidth: 1,
    borderColor: 'rgba(232, 201, 130, 0.58)',
  },
  bellStatusText: {
    color: '#8B6A3E',
    fontSize: 10,
    fontWeight: '900',
  },
  resetButton: {
    alignSelf: 'center',
    marginTop: 6,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.32)',
    borderWidth: 1,
    borderColor: 'rgba(232, 201, 130, 0.54)',
  },
  resetButtonText: {
    color: '#5A3518',
    fontSize: 10.5,
    fontWeight: '900',
  },
});
