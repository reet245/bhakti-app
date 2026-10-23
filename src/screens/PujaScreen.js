import useDevotionalStyles from '../hooks/useDevotionalStyles';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  AppState,
  BackHandler,
  Easing,
  Image,
  ImageBackground,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  useWindowDimensions,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Audio, ResizeMode, Video } from 'expo-av';

import BhaktiBackButton, { BhaktiBackSpacer } from '../components/BhaktiBackButton';
import BhaktiBottomNav, { getBhaktiBottomNavContentPadding } from '../components/BhaktiBottomNav';
import { useBhaktiTopPadding } from '../components/BhaktiLayout';
import DevotionalBackground from '../components/DevotionalBackground';
import { deities, pujaItems } from '../data/pujaData';
import { useLanguage } from '../context/LanguageContext';

const categories = [
  { id: 'All', labelKey: 'all' },
  { id: 'Popular', labelKey: 'popular' },
  { id: 'Shiva', labelKey: 'shiva' },
  { id: 'Shakti', labelKey: 'shakti' },
  { id: 'Vishnu', labelKey: 'vishnu' },
];
export default function PujaScreen({ navigation }) {
  const styles = useDevotionalStyles(baseStyles);
  const { t } = useLanguage();
  const { width, height } = useWindowDimensions();
  const topPadding = useBhaktiTopPadding(width, 'title');
  const templeTopPadding = useBhaktiTopPadding(width, 'overlay', { usesCoreSafeArea: false });
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
  const bellSessionRef = useRef(0);
  const screenActiveRef = useRef(true);

  const visibleDeities =
    activeCategory === 'All'
      ? deities
      : deities.filter(deity => deity.category === activeCategory);

  const responsiveStyles = useMemo(() => {
    const horizontalPadding = Math.max(16, Math.min(30, width * 0.05));
    const maxContentWidth = width >= 720 ? 760 : 520;
    const contentWidth = Math.max(260, Math.min(width - horizontalPadding * 2, maxContentWidth));
    const columns = contentWidth >= 680 ? 3 : 2;
    const gridGap = Math.max(12, Math.min(20, contentWidth * 0.032));
    const cardWidth = (contentWidth - gridGap * (columns - 1)) / columns;
    const cardPadding = Math.max(8, Math.min(12, cardWidth * 0.045));
    const cardRadius = Math.max(16, Math.min(22, cardWidth * 0.09));
    const imageRadius = Math.max(12, cardRadius - 4);
    const titleSize = Math.max(24, Math.min(34, width * 0.078));
    const chipTextSize = Math.max(11, Math.min(13, width * 0.032));
    const nameSize = Math.max(13, Math.min(16, cardWidth * 0.085));

    return {
      chooseContent: {
        paddingHorizontal: horizontalPadding,
        paddingTop: topPadding,
        paddingBottom: getBhaktiBottomNavContentPadding(height, Math.max(24, height * 0.035)),
      },
      contentWidth,
      header: {
        width: contentWidth,
        minHeight: Math.max(58, Math.min(82, height * 0.1)),
      },
      headerText: {
        paddingHorizontal: 0,
      },
      title: {
        fontSize: titleSize,
        lineHeight: titleSize * 1.14,
      },
      categoryScroller: {
        width: contentWidth,
      },
      categoryRow: {
        gap: Math.max(8, Math.min(12, contentWidth * 0.026)),
        paddingVertical: Math.max(14, Math.min(20, height * 0.024)),
        paddingHorizontal: Math.max(1, Math.min(4, contentWidth * 0.008)),
      },
      categoryChip: {
        paddingHorizontal: Math.max(14, Math.min(18, contentWidth * 0.042)),
        paddingVertical: Math.max(8, Math.min(10, height * 0.012)),
        borderRadius: Math.max(16, Math.min(20, contentWidth * 0.046)),
      },
      categoryText: {
        fontSize: chipTextSize,
        lineHeight: chipTextSize * 1.25,
      },
      deityGrid: {
        width: contentWidth,
        columnGap: gridGap,
        rowGap: Math.max(14, Math.min(22, height * 0.024)),
      },
      deityCard: {
        width: cardWidth,
        borderRadius: cardRadius,
        padding: cardPadding,
      },
      deityImageFrame: {
        borderRadius: imageRadius,
      },
      deityName: {
        fontSize: nameSize,
        lineHeight: nameSize * 1.22,
        marginTop: Math.max(8, Math.min(12, cardWidth * 0.045)),
        marginBottom: Math.max(2, Math.min(4, cardWidth * 0.015)),
      },
    };
  }, [height, topPadding, width]);

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
    if (!aartiActive) { stopAartiAudio(); return; }

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

  useFocusEffect(useCallback(() => {
    screenActiveRef.current = true;
    return () => {
      screenActiveRef.current = false;
      stopBellAudio(); stopAartiAudio();
      setBellActive(false); setAartiActive(false);
    };
  }, []));

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') {
        stopBellAudio(); stopAartiAudio();
        setBellActive(false); setAartiActive(false);
      }
    });
    return () => subscription.remove();
  }, []);

  useFocusEffect(useCallback(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (viewMode !== 'temple') return false;
      handleTempleBack(); return true;
    });
    return () => subscription.remove();
  }, [viewMode, aartiActive, selectedDeity]));

  function openTemple(deity) {
    resetPuja();
    setSelectedDeity(deity);
    setViewMode('temple');
  }

  function handleChooseDeityBack() {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
      return;
    }

    navigation?.navigate?.('Home');
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

  async function stopBellAudio(invalidateSession = true) {
    if (invalidateSession) bellSessionRef.current += 1;
    const sound = bellSoundRef.current;
    bellSoundRef.current = null;
    if (sound) await sound.unloadAsync().catch(() => {});
  }

  async function playBellAudio() {
    const sessionId = ++bellSessionRef.current;
    try {
      await stopBellAudio(false);
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: false });
      if (!screenActiveRef.current || bellSessionRef.current !== sessionId) return;
      const { sound } = await Audio.Sound.createAsync(pujaItems.bell.audio, {
        shouldPlay: false, isLooping: true, volume: 0.55,
      });
      if (!screenActiveRef.current || bellSessionRef.current !== sessionId) {
        await sound.unloadAsync(); return;
      }
      bellSoundRef.current = sound;
      await sound.playAsync();
    } catch {
      if (screenActiveRef.current && bellSessionRef.current === sessionId) {
        await stopBellAudio(); setBellActive(false);
        Alert.alert('Audio unavailable', 'The bell could not be played. Please try again.');
      }
    }
  }

  async function stopAartiAudio(invalidateSession = true) {
    if (invalidateSession) aartiSessionRef.current += 1;
    const sound = aartiSoundRef.current;
    aartiSoundRef.current = null;
    if (sound) {
      sound.setOnPlaybackStatusUpdate(null);
      await sound.unloadAsync().catch(() => {});
    }
  }

  async function playAartiAudio() {
    const deity = selectedDeity || deities[0];
    const sessionId = ++aartiSessionRef.current;
    try {
      await stopAartiAudio(false);
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: false });
      if (!deity?.aartiAudio || !screenActiveRef.current || aartiSessionRef.current !== sessionId) return;
      const { sound } = await Audio.Sound.createAsync(deity.aartiAudio, {
        shouldPlay: false, isLooping: false, volume: 0.75,
      });
      if (!screenActiveRef.current || aartiSessionRef.current !== sessionId) {
        await sound.unloadAsync(); return;
      }
      aartiSoundRef.current = sound;
      sound.setOnPlaybackStatusUpdate(status => {
        if (!screenActiveRef.current || aartiSessionRef.current !== sessionId) return;
        if ((status.isLoaded && status.didJustFinish) || (!status.isLoaded && status.error)) {
          stopAartiAudio(); setAartiActive(false);
          if (status.error) Alert.alert('Audio unavailable', 'The aarti could not be played. Please try again.');
        }
      });
      await sound.playAsync();
    } catch {
      if (screenActiveRef.current && aartiSessionRef.current === sessionId) {
        await stopAartiAudio(); setAartiActive(false);
        Alert.alert('Audio unavailable', 'The aarti could not be played. Please try again.');
      }
    }
  }

  function renderChooseDeity() {
    return (
      <DevotionalBackground style={styles.chooseBackground}>
        <SafeAreaView style={styles.screen}>
          <ScrollView
            style={styles.screen}
            contentContainerStyle={[styles.chooseContent, responsiveStyles.chooseContent]}
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.header, responsiveStyles.header]}>
              <View style={styles.chooseHeaderTopRow}>
                <BhaktiBackButton onPress={handleChooseDeityBack} />
                <View style={[styles.headerText, responsiveStyles.headerText]}>
                  <Text
                    style={[styles.title, responsiveStyles.title]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.75}
                  >
                    {t('chooseYourDeity')}
                  </Text>
                </View>
                <BhaktiBackSpacer />
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={[styles.categoryScroller, responsiveStyles.categoryScroller]}
              contentContainerStyle={[styles.categoryRow, responsiveStyles.categoryRow]}
            >
              {categories.map(category => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryChip,
                    responsiveStyles.categoryChip,
                    activeCategory === category.id && styles.categoryChipActive,
                  ]}
                  onPress={() => setActiveCategory(category.id)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      responsiveStyles.categoryText,
                      activeCategory === category.id && styles.categoryTextActive,
                    ]}
                  >
                    {t(category.labelKey)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={[styles.deityGrid, responsiveStyles.deityGrid]}>
              {visibleDeities.map(deity => (
                <TouchableOpacity
                  key={deity.id}
                  style={[styles.deityCard, responsiveStyles.deityCard]}
                  onPress={() => openTemple(deity)}
                  activeOpacity={0.86}
                >
                  <View style={[styles.deityImageFrame, responsiveStyles.deityImageFrame]}>
                    <Image source={deity.thumbnailImage || deity.image} style={styles.deityImage} resizeMode="cover" />
                  </View>
                  <Text
                    style={[styles.deityName, responsiveStyles.deityName]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.78}
                  >
                    {t(deity.labelKey || deity.name)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          <BhaktiBottomNav activeTab="Puja" navigation={navigation} />
        </SafeAreaView>
      </DevotionalBackground>
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

        <View style={[styles.templeTopBar, { paddingTop: templeTopPadding }, showAartiVideo && styles.templeTopBarVideo]}>
          <BhaktiBackButton
            onPress={handleTempleBack}
            style={[styles.templeBackButton, showAartiVideo && styles.templeBackButtonVideo]}
          />
          {!showAartiVideo && (
            <View style={styles.templeTitleWrap}>
              <Text style={styles.templeDeityName}>{t(deity.labelKey || deity.name)}</Text>
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
                  label={t('flower')}
                  image={pujaItems.flower.image}
                  active={isActionActive('flower', { flowers })}
                  onPress={handleFlowerPress}
                />
                <PujaActionButton
                  label={t('diya')}
                  image={pujaItems.diya.image}
                  active={isActionActive('diya', { diyaActive })}
                  onPress={handleDiyaPress}
                />
                <PujaActionButton
                  label={t('agarbatti')}
                  image={pujaItems.agarbatti.image}
                  active={isActionActive('agarbatti', { agarbattiActive })}
                  onPress={handleAgarbattiPress}
                />
                <PujaActionButton
                  label={t('prasad')}
                  image={pujaItems.prasad.image}
                  active={isActionActive('prasad', { prasadVisible })}
                  onPress={handlePrasadPress}
                />
              </ScrollView>
              <TouchableOpacity style={styles.resetButton} onPress={resetPuja} activeOpacity={0.82}>
                <Text style={styles.resetButtonText}>{t('resetPuja')}</Text>
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
  const styles = useDevotionalStyles(baseStyles);
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
  const styles = useDevotionalStyles(baseStyles);
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
  const styles = useDevotionalStyles(baseStyles);
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

const baseStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  chooseBackground: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  chooseContent: {
    alignItems: 'center',
  },
  title: {
    color: '#3A220D',
    fontWeight: '900',
    textAlign: 'center',
    maxWidth: '100%',
  },
  subtitle: {
    color: '#8B6A3E',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
  },
  header: {
    justifyContent: 'center',
  },
  chooseHeaderTopRow: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
  },
  headerText: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryScroller: {
    flexGrow: 0,
  },
  categoryRow: {
    alignItems: 'center',
  },
  categoryChip: {
    backgroundColor: 'rgba(255, 247, 232, 0.92)',
    borderWidth: 1,
    borderColor: '#E8C982',
  },
  categoryChipActive: {
    backgroundColor: '#C8942E',
    borderColor: '#C8942E',
  },
  categoryText: {
    color: '#8B6A3E',
    fontWeight: '800',
  },
  categoryTextActive: {
    color: '#FFF7E8',
  },
  deityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  deityCard: {
    backgroundColor: 'rgba(255, 247, 232, 0.94)',
    borderWidth: 1,
    borderColor: 'rgba(200, 148, 46, 0.45)',
    shadowColor: '#8A5A12',
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  deityImageFrame: {
    width: '100%',
    aspectRatio: 0.88,
    backgroundColor: '#F4DFAC',
    overflow: 'hidden',
  },
  deityImage: {
    width: '100%',
    height: '100%',
  },
  deityName: {
    color: '#3A220D',
    fontWeight: '900',
    textAlign: 'center',
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
    flexDirection: 'row',
    alignItems: 'flex-start',
    zIndex: 50,
  },
  templeTopBarVideo: {
    zIndex: 120,
  },
  templeBackButton: {
    marginTop: 3,
    zIndex: 2,
  },
  templeBackButtonVideo: {
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
