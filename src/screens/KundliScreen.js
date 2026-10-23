import useDevotionalStyles from '../hooks/useDevotionalStyles';
import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  BackHandler,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Share,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import { StatusBar } from 'expo-status-bar';
import { ThemeContext } from '../../App';
import { SafeAreaView } from 'react-native-safe-area-context';
import BhaktiBackButton, { navigateBackSafely } from '../components/BhaktiBackButton';
import BhaktiBottomNav, { getBhaktiBottomNavContentPadding } from '../components/BhaktiBottomNav';
import DevotionalBackground from '../components/DevotionalBackground';
import { generateKundli as requestKundli } from '../services/kundliService';
import { INITIAL_FORM, SAFE_VALUE, safeValue, birthFormError, buildKundliRequest, normalizeKundliData } from '../features/kundli/model';
import LocationPicker, { searchLocations } from '../features/panchang/LocationPicker';
import { deviceTimezone } from '../features/panchang/date';

const BELL_IMAGE = require('../../assets/horoscope/decorations/hanging-bell.png');
const KUNDLI_ZODIAC_WHEEL = require('../../assets/kundli/kundli-zodiac-wheel.png');

const COLORS = {
  parchment: 'rgba(255, 251, 239, 0.96)',
  parchmentStrong: '#FFF8E8',
  cream: '#F9EAC7',
  creamDeep: '#F3DDA9',
  gold: '#C58A24',
  goldDark: '#956016',
  goldLight: '#E6C270',
  border: 'rgba(190, 137, 42, 0.42)',
  text: '#4A2E14',
  textSoft: '#7B572A',
  muted: '#9B7A4E',
  white: '#FFFFFF',
  shadow: '#7D531A',
  disabled: '#E8DDC5',
  disabledText: '#A3957C',
  success: '#6F7C3A',
};

const SPACING = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
};

const HOME_FEATURES = [
  {
    icon: '\u2726',
    title: 'Accurate Vedic Calculations',
    description: 'Based on authentic astrological principles',
  },
  {
    icon: '\u263C',
    title: 'Detailed Kundli Analysis',
    description: 'Get comprehensive insights about your life',
  },
  {
    icon: '\u0950',
    title: 'Remedies & Guidance',
    description: 'Personalized remedies for better life & growth',
  },
];

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'planets', label: 'Planets' },
  { id: 'houses', label: 'Houses' },
  { id: 'predictions', label: 'Predictions' },
  { id: 'dosha', label: 'Dosha' },
  { id: 'dasha', label: 'Dasha' },
  { id: 'remedies', label: 'Remedies' },
];

const CHART_HOUSE_POSITIONS = [
  { number: 1, left: '38%', top: '13%', width: '24%', height: '20%' },
  { number: 2, left: '15%', top: '7%', width: '22%', height: '18%' },
  { number: 3, left: '3%', top: '26%', width: '22%', height: '20%' },
  { number: 4, left: '14%', top: '39%', width: '22%', height: '22%' },
  { number: 5, left: '3%', top: '56%', width: '22%', height: '20%' },
  { number: 6, left: '15%', top: '75%', width: '22%', height: '18%' },
  { number: 7, left: '38%', top: '67%', width: '24%', height: '20%' },
  { number: 8, left: '63%', top: '75%', width: '22%', height: '18%' },
  { number: 9, left: '75%', top: '56%', width: '22%', height: '20%' },
  { number: 10, left: '64%', top: '39%', width: '22%', height: '22%' },
  { number: 11, left: '75%', top: '26%', width: '22%', height: '20%' },
  { number: 12, left: '63%', top: '7%', width: '22%', height: '18%' },
];

export default function KundliScreen({ navigation }) {
  const styles = useDevotionalStyles(baseStyles);
  const { isDark } = useContext(ThemeContext);
  const { width, height } = useWindowDimensions();
  const [screen, setScreen] = useState('home');
  const [formStep, setFormStep] = useState(1);
  const [activeTab, setActiveTab] = useState('overview');
  const [unknownTime, setUnknownTime] = useState(false);
  const [selectedHouse, setSelectedHouse] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [locationStatus, setLocationStatus] = useState('idle');
  const [kundliData, setKundliData] = useState(null);
  const [kundliError, setKundliError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const generationRequest = useRef(null);
  const placeRequest = useRef(0);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; generationRequest.current?.abort(); placeRequest.current += 1; };
  }, []);
  useEffect(() => navigation.addListener('blur', () => {
    generationRequest.current?.abort();
    placeRequest.current += 1;
    setLocationStatus('idle');
  }), [navigation]);

  const layout = useMemo(() => {
    const horizontalPadding = Math.max(14, Math.min(28, width * 0.045));
    const contentWidth = Math.min(width - horizontalPadding * 2, 680);
    const compact = width < 370;
    const homeHorizontalPadding = Math.max(22, width * 0.065);
    const homeContentWidth = Math.min(width - homeHorizontalPadding * 2, 680);
    const wheelSize = Math.min(width * (compact ? 0.38 : 0.42), 180);
    const bellWidth = Math.max(34, Math.min(48, width * 0.11));
    const chartCell = Math.max(62, Math.min(104, (contentWidth - 34) / 4));
    const heroStacks = contentWidth < 430;
    const mandalaSize = heroStacks
      ? Math.max(138, Math.min(180, contentWidth * 0.48))
      : Math.max(150, Math.min(204, contentWidth * 0.34));

    return {
      horizontalPadding,
      contentWidth,
      compact,
      homeHorizontalPadding,
      homeContentWidth,
      wheelSize,
      bellWidth,
      chartCell,
      headerTop: Math.max(6, Math.min(18, height * 0.018)),
      titleSize: Math.max(24, Math.min(31, width * 0.075)),
      cardPadding: compact ? 14 : Math.max(16, Math.min(22, width * 0.05)),
      buttonHeight: compact ? 46 : 50,
      heroStacks,
      mandalaSize,
      heroTitleSize: Math.max(27, Math.min(38, width * 0.088)),
    };
  }, [height, width]);

  const updateField = (key, value) => {
    if (key === 'place') placeRequest.current += 1;
    setForm((current) => {
      if (key === 'place') {
        return {
          ...current,
          place: value,
          latitude: null,
          longitude: null,
          timezone: null,
        };
      }

      return { ...current, [key]: value };
    });
  };

  const goBack = () => {
    generationRequest.current?.abort();
    if (screen === 'result') {
      setScreen('review');
      return;
    }
    if (screen === 'review') {
      setScreen('form');
      setFormStep(3);
      return;
    }
    if (screen === 'form' && formStep === 1) {
      setScreen('home');
      return;
    }
    if (screen === 'form' && formStep > 1) {
      setFormStep((current) => current - 1);
      return;
    }
    navigateBackSafely(navigation);
  };

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!navigation.isFocused() || screen === 'home') return false;
      goBack();
      return true;
    });
    return () => subscription.remove();
  }, [navigation, screen, formStep]);

  const validateStep = (step) => {
    const message = birthFormError(form, unknownTime, step);
    setKundliError(message);
    return !message;
  };

  const generateKundli = async () => {
    if (isGenerating) return;
    for (const step of [1, 2, 3]) {
      if (!validateStep(step)) { setFormStep(step); setScreen('form'); return; }
    }

    setIsGenerating(true);
    setKundliError('');
    setActiveTab('overview');
    setSelectedHouse(null);
    const controller = new AbortController();
    generationRequest.current = controller;

    try {
      const request = buildKundliRequest(form, unknownTime);

      const responseData = await requestKundli(request, { signal: controller.signal });
      if (!mounted.current || controller.signal.aborted) return;
      const normalizedData = normalizeKundliData(responseData);
      const warnings = Array.isArray(normalizedData.calculationMeta?.warnings)
        ? normalizedData.calculationMeta.warnings.filter(Boolean)
        : [];

      setKundliData(normalizedData);
      setKundliError(warnings.join(' '));
      setScreen('result');
    } catch (error) {
      if (!mounted.current || controller.signal.aborted) return;
      const message = safeValue(
        error?.message,
        'Unable to generate your Kundli right now. Please try again.'
      );

      setKundliError(message);
      Alert.alert('Kundli Service', message);
    } finally {
      if (mounted.current) setIsGenerating(false);
    }
  };

  const shareKundli = async () => {
    try {
      await Share.share({
        message: `${resultDisplayName}'s Kundli preview: ${resultDisplayDate}, ${resultDisplayTime}, ${resultDisplayPlace}`,
        title: `${resultDisplayName}'s Kundli`,
      });
    } catch (error) {
      console.warn('Kundli: sharing is unavailable.', error?.message);
    }
  };

  const detectBirthPlace = async () => {
    if (locationStatus === 'loading') return;

    setLocationStatus('loading');
    const requestId = ++placeRequest.current;
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (!mounted.current || requestId !== placeRequest.current) return;
      if (status !== 'granted') {
        setLocationStatus('denied');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const coordinates = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      };
      const places = await Location.reverseGeocodeAsync({
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
      });
      const place = places?.[0];
      const placeParts = [
        place?.city || place?.district || place?.subregion,
        place?.region,
        place?.country,
      ].filter((part, index, parts) => part && parts.indexOf(part) === index);
      if (!mounted.current || requestId !== placeRequest.current) return;

      if (placeParts.length === 0) {
        setLocationStatus('unavailable');
        return;
      }

      let timezone = deviceTimezone();
      try {
        const candidates = await searchLocations(place?.city || place?.district || place?.region || '');
        const nearest = candidates.sort((a, b) =>
          Math.hypot(a.latitude - coordinates.latitude, a.longitude - coordinates.longitude)
          - Math.hypot(b.latitude - coordinates.latitude, b.longitude - coordinates.longitude))[0];
        if (nearest && Math.hypot(nearest.latitude - coordinates.latitude, nearest.longitude - coordinates.longitude) < 1) timezone = nearest.timezone;
      } catch { /* The editable manual timezone remains available. */ }
      if (!mounted.current || requestId !== placeRequest.current) return;
      setForm((current) => ({
        ...current,
        place: placeParts.join(', '),
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        timezone,
      }));
      setLocationStatus('success');
    } catch (error) {
      if (mounted.current && requestId === placeRequest.current) setLocationStatus('unavailable');
    }
  };

  const displayName = safeValue(form.name);
  const displayDate = safeValue(form.date);
  const displayTime = unknownTime ? 'Birth time unknown' : safeValue(form.time);
  const displayPlace = safeValue(form.place);
  const resultProfile = kundliData?.profile;
  const resultDisplayName = safeValue(resultProfile?.name);
  const resultDisplayDate = safeValue(resultProfile?.birthDate);
  const resultDisplayTime = safeValue(resultProfile?.birthTime);
  const resultDisplayPlace = safeValue(resultProfile?.placeName);

  return (
    <DevotionalBackground style={styles.background}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            style={styles.flex}
            contentContainerStyle={[
              styles.scrollContent,
              {
                paddingHorizontal: screen === 'home'
                  ? layout.homeHorizontalPadding
                  : layout.horizontalPadding,
                paddingBottom: screen === 'home'
                  ? getBhaktiBottomNavContentPadding(height, Math.max(30, height * 0.045))
                  : getBhaktiBottomNavContentPadding(height, Math.max(34, height * 0.055)),
              },
            ]}
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View
              style={[
                styles.contentShell,
                {
                  maxWidth: screen === 'home'
                    ? layout.homeContentWidth
                    : layout.contentWidth,
                },
              ]}
            >
              {screen === 'home' ? (
                <KundliHomePage
                  layout={layout}
                  onBack={goBack}
                  onCreate={() => {
                    setFormStep(1);
                    setScreen('form');
                  }}
                />
              ) : screen === 'form' || screen === 'review' ? (
                <KundliFormHeader
                  layout={layout}
                  onBack={goBack}
                  title={screen === 'review' ? 'Review Details' : 'Create Your Kundli'}
                />
              ) : (
                <KundliResultHeader
                  layout={layout}
                  onBack={goBack}
                  onShare={shareKundli}
                  title={`${resultDisplayName}\u2019s Kundli`}
                />
              )}

              {screen === 'form' && (
                <FormFlow
                  form={form}
                  formStep={formStep}
                  layout={layout}
                  unknownTime={unknownTime}
                  onChange={updateField}
                  onGenderChange={(gender) => updateField('gender', gender)}
                  onNext={() => { if (validateStep(formStep)) setFormStep((current) => Math.min(current + 1, 3)); }}
                  onToggleUnknown={() => setUnknownTime((value) => !value)}
                  locationStatus={locationStatus}
                  onDetectLocation={detectBirthPlace}
                  onReview={() => { if (validateStep(3)) setScreen('review'); }}
                  onLocationChange={(location) => { placeRequest.current += 1; setLocationStatus(location.latitude != null ? 'success' : 'idle'); setForm((current) => ({ ...current, ...location, place: location.locationName })); }}
                />
              )}
              {screen === 'form' && kundliError ? <Text accessibilityLiveRegion="polite" style={styles.kundliErrorText}>{kundliError}</Text> : null}

              {screen === 'review' && (
                <ReviewFlow
                  displayDate={displayDate}
                  displayName={displayName}
                  displayPlace={displayPlace}
                  displayTimezone={form.timezone}
                  displayTime={displayTime}
                  layout={layout}
                  onEdit={() => {
                    setScreen('form');
                    setFormStep(1);
                  }}
                  onGenerate={generateKundli}
                  isGenerating={isGenerating}
                  kundliError={kundliError}
                />
              )}

              {screen === 'result' && (
                <ResultFlow
                  activeTab={activeTab}
                  displayDate={resultDisplayDate}
                  displayName={resultDisplayName}
                  displayPlace={resultDisplayPlace}
                  displayTime={resultDisplayTime}
                  kundliData={kundliData}
                  kundliError={kundliError}
                  layout={layout}
                  navigation={navigation}
                  onHousePress={setSelectedHouse}
                  onTabChange={setActiveTab}
                />
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
        <BhaktiBottomNav activeTab="Kundli" navigation={navigation} />
      </SafeAreaView>

      <HouseModal house={selectedHouse} onClose={() => setSelectedHouse(null)} />
    </DevotionalBackground>
  );
}

function KundliHomePage({ layout, onBack, onCreate }) {
  const styles = useDevotionalStyles(baseStyles);
  return (
    <View style={styles.homePage}>
      <View style={styles.homeTopBar}>
        <BhaktiBackButton onPress={onBack} />
      </View>

      <View style={styles.homeHero}>
        <View style={styles.homeHeroCopy}>
          <Text
            style={[
              styles.homeHeroTitle,
              {
                fontSize: layout.compact ? 36 : 42,
                lineHeight: layout.compact ? 38 : 43,
              },
            ]}
          >
            Janam{'\n'}Kundli
          </Text>
          <Text
            style={[
              styles.homeHeroSubtitle,
              {
                fontSize: layout.compact ? 14 : 15,
                lineHeight: layout.compact ? 20 : 22,
              },
            ]}
          >
            Create your Vedic birth chart with Rashi, Lagna, Nakshatra & planetary positions
          </Text>
        </View>

        <Image
          source={KUNDLI_ZODIAC_WHEEL}
          style={[
            styles.homeZodiacWheel,
            { width: layout.wheelSize, height: layout.wheelSize },
          ]}
          resizeMode="contain"
        />
      </View>

      <View style={styles.featureList}>
        {HOME_FEATURES.map((feature) => (
          <View
            key={feature.title}
            style={[
              styles.featureCard,
              {
                minHeight: layout.compact ? 86 : 92,
                paddingHorizontal: layout.compact ? 14 : 16,
              },
            ]}
          >
            <View style={styles.featureIcon}>
              <Text style={styles.featureIconText}>{feature.icon}</Text>
            </View>
            <View style={styles.featureCopy}>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDescription}>{feature.description}</Text>
            </View>
            <Text style={styles.featureChevron}>{'\u203A'}</Text>
          </View>
        ))}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Create Your Kundli"
        onPress={onCreate}
        style={({ pressed }) => [
          styles.homeCta,
          pressed && styles.homeCtaPressed,
        ]}
      >
        <View pointerEvents="none" style={styles.homeCtaHighlight} />
        <Text style={styles.homeCtaText}>Create Your Kundli {'\u2728'}</Text>
      </Pressable>
    </View>
  );
}

function KundliFormHeader({ layout, onBack, title }) {
  const styles = useDevotionalStyles(baseStyles);
  return (
    <View style={[styles.formHeader, { paddingTop: layout.headerTop }]}>
      <Image
        source={BELL_IMAGE}
        style={[
          styles.formBell,
          styles.formBellLeft,
          { width: layout.bellWidth, height: layout.bellWidth * 2.25 },
        ]}
        resizeMode="contain"
      />
      <Image
        source={BELL_IMAGE}
        style={[
          styles.formBell,
          styles.formBellRight,
          { width: layout.bellWidth, height: layout.bellWidth * 2.25 },
        ]}
        resizeMode="contain"
      />
      <BhaktiBackButton onPress={onBack} style={styles.formBackButton} />
      <View style={styles.formHeaderCopy}>
        <Text style={styles.formHeaderEyebrow}>{'\u2726'} JANAM KUNDLI {'\u2726'}</Text>
        <Text style={styles.formHeaderTitle}>{title}</Text>
      </View>
    </View>
  );
}

function KundliResultHeader({ layout, onBack, onShare, title }) {
  const styles = useDevotionalStyles(baseStyles);
  return (
    <View style={[styles.resultHeader, { paddingTop: layout.headerTop }]}>
      <Image
        source={BELL_IMAGE}
        style={[
          styles.resultBell,
          styles.resultBellLeft,
          { width: layout.bellWidth, height: layout.bellWidth * 2.25 },
        ]}
        resizeMode="contain"
      />
      <Image
        source={BELL_IMAGE}
        style={[
          styles.resultBell,
          styles.resultBellRight,
          { width: layout.bellWidth, height: layout.bellWidth * 2.25 },
        ]}
        resizeMode="contain"
      />

      <BhaktiBackButton
        accessibilityLabel="Back to Review Details"
        onPress={onBack}
        style={styles.resultHeaderBack}
      />

      <View style={styles.resultHeaderCopy}>
        <Text style={styles.resultHeaderEyebrow}>{'\u2726'} JANAM KUNDLI {'\u2726'}</Text>
        <Text
          style={[styles.resultHeaderTitle, { fontSize: Math.min(24, layout.titleSize) }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.72}
        >
          {title}
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Share Kundli"
        onPress={onShare}
        style={({ pressed }) => [
          styles.resultHeaderButton,
          styles.resultHeaderShare,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.resultShareIcon}>{'\u21E7'}</Text>
      </Pressable>
    </View>
  );
}

function FormFlow({
  form,
  formStep,
  layout,
  unknownTime,
  onChange,
  onDetectLocation,
  onGenderChange,
  onNext,
  onReview,
  onToggleUnknown,
  locationStatus,
  onLocationChange,
}) {
  const styles = useDevotionalStyles(baseStyles);
  return (
    <>
      <StepIndicator activeStep={formStep} />

      <View style={[styles.card, { padding: layout.cardPadding }]}>
        {formStep === 1 ? (
          <>
            <View style={styles.basicCardHeader}>
              <View style={styles.basicCardTitleWrap}>
                <Text
                  style={styles.basicCardTitle}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.82}
                >
                  1. Basic Details
                </Text>
                <Text style={styles.basicCardSubtitle} numberOfLines={2}>
                  Begin with the details of the person whose Kundli you are creating.
                </Text>
              </View>
              <View style={styles.basicUserBadge}>
                <Text style={styles.basicUserBadgeText}>{'\u263A'}</Text>
              </View>
            </View>

            <FieldLabel label="Full Name" />
            <View style={styles.iconInputWrap}>
              <TextInput
                value={form.name}
                onChangeText={(value) => onChange('name', value)}
                placeholder="Enter your full name"
                placeholderTextColor={COLORS.muted}
                selectionColor={COLORS.gold}
                autoCapitalize="words"
                returnKeyType="done"
                style={styles.iconInput}
              />
              <Text pointerEvents="none" style={styles.inputTrailingIcon}>{'\u263A'}</Text>
            </View>

            <FieldLabel label="Gender" />
            <View style={styles.genderRow}>
              {['Male', 'Female', 'Other'].map((gender) => {
                const selected = form.gender === gender;
                return (
                  <Pressable
                    key={gender}
                    onPress={() => onGenderChange(gender)}
                    style={({ pressed }) => [
                      styles.genderButton,
                      selected && styles.genderButtonSelected,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={[styles.genderText, selected && styles.genderTextSelected]}>
                      {gender}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <PrimaryButton
              label="Next"
              icon={'\u2192'}
              onPress={onNext}
              height={layout.buttonHeight}
            />
          </>
        ) : formStep === 2 ? (
          <>
            <View style={styles.basicCardHeader}>
              <View style={styles.basicCardTitleWrap}>
                <Text
                  style={styles.basicCardTitle}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.82}
                >
                  2. Birth Date & Time
                </Text>
                <Text style={styles.basicCardSubtitle} numberOfLines={2}>
                  Add the birth date and time used for this Kundli preview.
                </Text>
              </View>
              <View style={styles.basicUserBadge}>
                <Text style={styles.calendarBadgeText}>{'\u25A3'}</Text>
              </View>
            </View>

            <FieldLabel label="Date of Birth" />
            <EditableValueRow
              value={form.date}
              icon={'\u25A3'}
              accessibilityLabel="Date of birth, YYYY-MM-DD"
              placeholder="YYYY-MM-DD, e.g. 2000-07-23"
              onChangeText={(value) => onChange('date', value)}
            />

            <FieldLabel label="Time of Birth" />
            <EditableValueRow
              value={form.time}
              icon={'\u25F7'}
              accessibilityLabel="Time of birth, HH:MM"
              placeholder="HH:MM, e.g. 07:30 or 7:30 AM"
              onChangeText={(value) => onChange('time', value)}
              softened={unknownTime}
              disabled={unknownTime}
            />

            <Pressable
              onPress={onToggleUnknown}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: unknownTime }}
              style={({ pressed }) => [
                styles.timeCheckboxRow,
                pressed && styles.pressed,
              ]}
            >
              <View style={[styles.checkbox, unknownTime && styles.checkboxChecked]}>
                {unknownTime && <Text style={styles.checkmark}>{'\u2713'}</Text>}
              </View>
              <View style={styles.checkboxCopy}>
                <Text style={styles.checkboxLabel}>I don{'\u2019'}t know exact time</Text>
                <Text style={styles.checkboxHint}>
                  Approximate birth time may reduce Kundli accuracy.
                </Text>
              </View>
            </Pressable>

            <PrimaryButton
              label="Next"
              icon={'\u2192'}
              onPress={onNext}
              height={layout.buttonHeight}
            />
          </>
        ) : (
          <>
            <View style={styles.basicCardHeader}>
              <View style={styles.basicCardTitleWrap}>
                <Text
                  style={styles.basicCardTitle}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.82}
                >
                  3. Birth Place
                </Text>
                <Text style={styles.basicCardSubtitle} numberOfLines={2}>
                  Tell us where you were born for accurate chart calculations.
                </Text>
              </View>
              <View style={styles.basicUserBadge}>
                <Text style={styles.locationBadgeText}>{'\u2316'}</Text>
              </View>
            </View>

            <FieldLabel label="City / Place" />
            <LocationPicker value={form} onChange={onLocationChange} />

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Detect my current location"
              accessibilityState={{ busy: locationStatus === 'loading' }}
              disabled={locationStatus === 'loading'}
              onPress={onDetectLocation}
              style={({ pressed }) => [
                styles.detectLocationButton,
                pressed && styles.detectLocationButtonPressed,
              ]}
            >
              <View style={styles.detectLocationIconWrap}>
                <Text style={styles.detectLocationIcon}>{'\u2316'}</Text>
              </View>
              <View style={styles.detectLocationCopy}>
                <Text style={styles.detectLocationTitle}>
                  {locationStatus === 'loading' ? 'Detecting Location...' : 'Detect My Location'}
                </Text>
                <Text style={styles.detectLocationSubtitle}>
                  {getLocationStatusText(locationStatus)}
                </Text>
              </View>
              <Text style={styles.detectLocationChevron}>{'\u203A'}</Text>
            </Pressable>

            <View style={styles.placeHelperNote}>
              <Text style={styles.placeHelperIcon}>{'\u2726'}</Text>
              <Text style={styles.placeHelperText}>
                For accurate Kundli, enter your birth place, not your current place.
              </Text>
            </View>

            <PrimaryButton
              label="Review Details"
              icon={'\u2192'}
              onPress={onReview}
              height={layout.buttonHeight}
            />
          </>
        )}
      </View>

      <Text style={styles.formDisclaimer}>
        {'\u2727'} Kundli calculations are generated through the Bhakti backend.
      </Text>
    </>
  );
}

function getLocationStatusText(status) {
  if (status === 'success') return 'Location added; verify its timezone above';
  if (status === 'denied') return 'Location permission was not granted';
  if (status === 'unavailable') return 'Could not detect location. Enter it above.';
  if (status === 'loading') return 'Using your device location';
  return 'Use current location';
}

function StepIndicator({ activeStep }) {
  const styles = useDevotionalStyles(baseStyles);
  const steps = ['Details', 'Time', 'Place'];

  return (
    <View style={styles.stepWrap}>
      {steps.map((label, index) => {
        const step = index + 1;
        const active = activeStep === step;
        const completed = activeStep > step;
        const highlighted = active || completed;

        return (
          <View key={label} style={styles.stepItem}>
            {index < steps.length - 1 && (
              <View style={[styles.stepLine, completed && styles.stepLineActive]} />
            )}
            <View style={[styles.stepCircle, highlighted && styles.stepCircleActive]}>
              <Text style={[styles.stepNumber, highlighted && styles.stepNumberActive]}>
                {completed ? '\u2713' : step}
              </Text>
            </View>
            <Text style={[styles.stepLabel, highlighted && styles.stepLabelActive]}>
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function SectionHeading({ icon, title, subtitle }) {
  const styles = useDevotionalStyles(baseStyles);
  return (
    <View style={styles.sectionHeading}>
      <View style={styles.sectionIcon}>
        <Text style={styles.sectionIconText}>{icon}</Text>
      </View>
      <View style={styles.sectionHeadingCopy}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionSubtitle} numberOfLines={2}>{subtitle}</Text>
      </View>
    </View>
  );
}

function FieldLabel({ label }) {
  const styles = useDevotionalStyles(baseStyles);
  return <Text style={styles.fieldLabel}>{label}</Text>;
}

function EditableValueRow({
  accessibilityLabel,
  disabled = false,
  icon,
  softened = false,
  value,
  placeholder,
  onChangeText,
}) {
  const styles = useDevotionalStyles(baseStyles);
  return (
    <View
      style={[
        styles.valueRow,
        softened && styles.valueRowSoftened,
      ]}
    >
      <TextInput accessibilityLabel={accessibilityLabel} accessibilityState={{ disabled }} editable={!disabled}
        autoCapitalize="none" autoCorrect={false} value={value} onChangeText={onChangeText} placeholder={placeholder}
        placeholderTextColor={COLORS.muted} style={[styles.valueRowText, { flex: 1 }, softened && styles.valueRowTextSoftened]} />
      <View style={[styles.valueRowIconWrap, softened && styles.valueRowIconWrapSoftened]}>
        <Text style={[styles.valueRowIcon, softened && styles.valueRowIconSoftened]}>{icon}</Text>
      </View>
    </View>
  );
}

function PrimaryButton({ disabled = false, height, icon, label, onPress, style }) {
  const styles = useDevotionalStyles(baseStyles);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.primaryButton,
        disabled && styles.primaryButtonDisabled,
        { minHeight: height },
        style,
        pressed && !disabled && styles.primaryButtonPressed,
      ]}
    >
      <Text style={[styles.primaryButtonText, disabled && styles.primaryButtonTextDisabled]}>
        {label}
      </Text>
      {icon ? (
        <Text style={[styles.primaryButtonIcon, disabled && styles.primaryButtonTextDisabled]}>
          {icon}
        </Text>
      ) : null}
    </Pressable>
  );
}

function SecondaryButton({ height, label, onPress }) {
  const styles = useDevotionalStyles(baseStyles);
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.secondaryButton,
        { minHeight: height },
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.secondaryButtonText}>{label}</Text>
    </Pressable>
  );
}

function ReviewFlow({
  displayDate,
  displayName,
  displayPlace,
  displayTime,
  displayTimezone,
  isGenerating,
  kundliError,
  layout,
  onEdit,
  onGenerate,
}) {
  const styles = useDevotionalStyles(baseStyles);
  const details = [
    { label: 'Timezone', value: displayTimezone },
    { label: 'Name', value: displayName },
    { label: 'Date of Birth', value: displayDate },
    { label: 'Time of Birth', value: displayTime },
    { label: 'Place of Birth', value: displayPlace },
  ];

  return (
    <>
      <View style={[styles.reviewCard, { padding: layout.cardPadding }]}>
        <View style={styles.reviewTitleRow}>
          <View style={styles.reviewEyeBadge}>
            <Text style={styles.reviewEyeIcon}>{'\uD83D\uDC41\uFE0F'}</Text>
          </View>
          <View style={styles.reviewTitleCopy}>
            <Text style={styles.reviewTitle}>Preview Birth Details</Text>
            <Text style={styles.reviewSubtitle}>
              Please confirm that every detail is correct.
            </Text>
          </View>
        </View>

        <View style={styles.reviewDetails}>
          {details.map((detail, index) => (
            <View
              key={detail.label}
              style={[
                styles.reviewRow,
                index === details.length - 1 && styles.reviewRowLast,
              ]}
            >
              <Text style={styles.reviewLabel}>{detail.label}</Text>
              <Text style={styles.reviewValue}>{detail.value}</Text>
            </View>
          ))}
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Edit details"
          onPress={onEdit}
          style={({ pressed }) => [
            styles.reviewEditButton,
            { minHeight: layout.buttonHeight },
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.reviewEditButtonText}>{'\u270E'} Edit Details</Text>
        </Pressable>
      </View>

      <PrimaryButton
        label={isGenerating ? 'Generating Kundli...' : `Generate Kundli ${'\u2728'}`}
        onPress={onGenerate}
        disabled={isGenerating}
        height={Math.max(52, layout.buttonHeight)}
        style={styles.reviewGenerateButton}
      />

      {kundliError ? (
        <Text style={styles.kundliErrorText}>{kundliError}</Text>
      ) : null}

      <Text style={styles.reviewAssurance}>
        {'\u2727'} Generating sends these birth details to the Bhakti backend and its astrology provider for calculation.
      </Text>
    </>
  );
}

function ResultFlow({
  activeTab,
  displayDate,
  displayName,
  displayPlace,
  displayTime,
  kundliData,
  kundliError,
  layout,
  navigation,
  onHousePress,
  onTabChange,
}) {
  const styles = useDevotionalStyles(baseStyles);
  const kundliTitle = `${displayName}\u2019s Kundli`;
  const [chartType, setChartType] = useState('D1');
  const summary = kundliData?.summary || {};
  const resultSummaryItems = [
    { label: 'Lagna', value: safeValue(summary.lagna) },
    { label: 'Rashi', value: safeValue(summary.rashi) },
    { label: 'Nakshatra', value: safeValue(summary.nakshatra) },
  ];

  return (
    <>
      <View style={[styles.resultProfileCard, { padding: layout.cardPadding }]}>
        <View style={styles.resultProfileTop}>
          <View style={styles.resultProfileSeal}>
            <View style={styles.resultProfileSealInner}>
              <Text style={styles.resultProfileSealText}>{'\u2737'}</Text>
            </View>
          </View>
          <View style={styles.resultProfileCopy}>
            <Text style={styles.resultProfileName} numberOfLines={1}>{kundliTitle}</Text>
            <Text style={styles.resultProfileMeta} numberOfLines={2}>
              {displayDate} {'\u2022'} {displayTime}
            </Text>
            <Text style={styles.resultProfilePlace} numberOfLines={2}>{displayPlace}</Text>
          </View>
        </View>

        <View style={styles.resultSummaryRow}>
          {resultSummaryItems.map((item, index) => (
            <View
              key={item.label}
              style={[
                styles.resultSummaryItem,
                index < 2 && styles.resultSummaryItemBorder,
              ]}
            >
              <Text style={styles.resultSummaryLabel}>{item.label}</Text>
              <Text style={styles.resultSummaryValue} numberOfLines={1}>{item.value}</Text>
            </View>
          ))}
        </View>
      </View>

      {kundliError ? (
        <Text style={styles.kundliErrorText}>{kundliError}</Text>
      ) : null}

      <NorthIndianChartCard
        calculationMeta={kundliData?.calculationMeta}
        houses={chartType === 'D9' ? kundliData?.d9Houses : kundliData?.houses}
        chartName={chartType === 'D9' ? 'Navamsa (D9)' : 'Lagna (D1)'}
        layout={layout}
        onHousePress={onHousePress}
      />
      <View style={styles.genderRow}>
        {['D1', 'D9'].map((type) => <Pressable accessibilityRole="button" key={type} onPress={() => setChartType(type)} style={[styles.genderButton, type === chartType && styles.genderButtonSelected]}><Text style={styles.genderText}>{type}</Text></Pressable>)}
      </View>
      {chartType === 'D9' && !kundliData?.d9Houses?.length ? <Text style={styles.kundliErrorText}>Navamsa data is unavailable for this calculation.</Text> : null}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabScroll}
        style={styles.tabScroller}
      >
        {TABS.map((tab) => {
          const selected = activeTab === tab.id;
          return (
            <Pressable
              key={tab.id}
              onPress={() => onTabChange(tab.id)}
              style={({ pressed }) => [
                styles.tabButton,
                selected && styles.tabButtonSelected,
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.tabText, selected && styles.tabTextSelected]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {activeTab === 'overview' && <OverviewTab items={kundliData?.overviewItems} layout={layout} />}
      {activeTab === 'predictions' && <View style={[styles.card, { padding: layout.cardPadding }]}>
        <SectionHeading icon={'\u2726'} title="Predictions" subtitle="Interpretations supplied by the calculation service." />
        {kundliData?.predictions?.length ? kundliData.predictions.map((item, index) => <View key={`${item.category}-${index}`} style={styles.remedyCardCopy}><Text style={styles.remedyCardTitle}>{item.title || item.category}</Text><Text style={styles.modalDescription}>{item.text}</Text></View>) : <Text style={styles.modalDescription}>Predictions are unavailable for this calculation. An exact birth time may be required.</Text>}
      </View>}
      {activeTab === 'planets' && <PlanetsTab layout={layout} planets={kundliData?.planets} />}
      {activeTab === 'houses' && (
        <HousesTab houses={kundliData?.houses} layout={layout} onHousePress={onHousePress} />
      )}
      {activeTab === 'dosha' && <DoshasTab doshas={kundliData?.doshas} layout={layout} />}
      {activeTab === 'dasha' && (
        <DashaTab
          dashas={kundliData?.dashas}
          dashaTimeline={kundliData?.dashaTimeline}
          layout={layout}
        />
      )}
      {activeTab === 'remedies' && (
        <RemediesTab layout={layout} navigation={navigation} remedies={kundliData?.remedies} />
      )}
    </>
  );
}

function OverviewTab({ items, layout }) {
  const styles = useDevotionalStyles(baseStyles);
  const overviewItems = items?.length ? items : [{ label: 'Overview', value: SAFE_VALUE }];

  return (
    <View style={[styles.card, { padding: layout.cardPadding }]}>
      <SectionHeading
        icon={'\u263C'}
        title="Overview"
        subtitle="Essential birth chart details at a glance."
      />
      <View style={styles.overviewTable}>
        {overviewItems.map((item, index) => (
          <View
            key={item.label}
            style={[
              styles.overviewRow,
              index === overviewItems.length - 1 && styles.overviewRowLast,
            ]}
          >
            <Text style={styles.overviewLabel}>{item.label}</Text>
            <Text style={styles.overviewValue} numberOfLines={2}>{item.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function NorthIndianChartCard({ calculationMeta, houses, layout, onHousePress, chartName = 'Lagna (D1)' }) {
  const styles = useDevotionalStyles(baseStyles);
  const chartHouses = houses?.length ? houses : normalizeKundliData({}).houses;
  const metaProvider = safeValue(calculationMeta?.provider, '');
  const chartSubtitle = metaProvider
    ? `${calculationMeta?.precision === 'ACCURATE' ? 'Calculated' : 'Approximate'} planetary positions - ${metaProvider}`
    : 'Planetary positions';

  return (
    <View style={[styles.resultChartCard, { padding: layout.cardPadding }]}>
      <View style={styles.resultChartTitleRow}>
        <View>
          <Text style={styles.resultChartTitle} numberOfLines={1}>North Indian Chart</Text>
          <Text style={styles.resultChartSubtitle} numberOfLines={1}>
            {chartName} {'\u2022'} {chartSubtitle}
          </Text>
        </View>
        <View style={styles.resultChartBadge}>
          <Text style={styles.resultChartBadgeText}>{'\u2726'}</Text>
        </View>
      </View>

      <View style={styles.northChart}>
        <View pointerEvents="none" style={styles.northChartDiamond} />
        <View pointerEvents="none" style={[styles.northChartDiagonal, styles.northChartDiagonalDown]} />
        <View pointerEvents="none" style={[styles.northChartDiagonal, styles.northChartDiagonalUp]} />

        {CHART_HOUSE_POSITIONS.map((position) => {
          const house = chartHouses.find((item) => item.number === position.number) || {};
          return (
            <Pressable
              key={position.number}
              accessibilityRole="button"
              accessibilityLabel={`House ${safeValue(house.number)}, ${safeValue(house.name)}, ${safeValue(house.sign)}`}
              onPress={() => onHousePress(house)}
              style={({ pressed }) => [
                styles.northChartHouse,
                {
                  left: position.left,
                  top: position.top,
                  width: position.width,
                  height: position.height,
                },
                pressed && styles.northChartHousePressed,
              ]}
            >
              <Text style={styles.northChartHouseNumber}>{safeValue(house.number)}</Text>
              <Text style={styles.northChartHouseNumber} numberOfLines={1}>{safeValue(house.sign)}</Text>
              <Text style={styles.northChartHousePlanets} numberOfLines={1}>
                {house.planets?.join(' ') || '\u00B7'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.chartTapHint}>
        <Text style={styles.chartTapHintIcon}>{'\u261D'}</Text>
        <Text style={styles.chartTapHintText}>Tap any house to see details</Text>
      </View>
    </View>
  );
}

function PlanetsTab({ layout, planets }) {
  const styles = useDevotionalStyles(baseStyles);
  const [selectedPlanet, setSelectedPlanet] = useState(null);
  const planetItems = planets?.length ? planets : normalizeKundliData({}).planets;

  return (
    <>
      <View style={[styles.card, { padding: layout.cardPadding }]}>
        <SectionHeading
          icon={'\u2609'}
          title="Planets"
          subtitle="Tap a planet to explore its meaning."
        />
        <View style={styles.planetList}>
          {planetItems.map((planet) => (
            <Pressable
              key={planet.name}
              accessibilityRole="button"
              accessibilityLabel={`${planet.name}, ${planet.sign}, ${planet.degree}`}
              accessibilityHint="Opens planet meaning"
              onPress={() => setSelectedPlanet(planet)}
              style={({ pressed }) => [
                styles.planetRow,
                pressed && styles.planetRowPressed,
              ]}
            >
              <View style={styles.planetSymbolWrap}>
                <Text style={styles.planetSymbol}>{planet.symbol}</Text>
              </View>
              <View style={styles.planetIdentity}>
                <Text style={styles.planetName} numberOfLines={1}>{planet.name}</Text>
                <Text style={styles.planetSign} numberOfLines={1}>{planet.sign}</Text>
              </View>
              <Text style={styles.planetDegree} numberOfLines={1}>{planet.degree}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <PlanetModal planet={selectedPlanet} onClose={() => setSelectedPlanet(null)} />
    </>
  );
}

function HousesTab({ houses, layout, onHousePress }) {
  const styles = useDevotionalStyles(baseStyles);
  const houseItems = houses?.length ? houses : normalizeKundliData({}).houses;

  return (
    <View style={[styles.card, { padding: layout.cardPadding }]}>
      <SectionHeading
        icon={'\u25C7'}
        title="Houses"
        subtitle="Explore the twelve areas of life in this chart."
      />
      <View style={styles.housesList}>
        {houseItems.map((house) => (
          <Pressable
            key={house.number}
            accessibilityRole="button"
            accessibilityLabel={`Open House ${house.number}`}
            onPress={() => onHousePress(house)}
            style={({ pressed }) => [
              styles.houseListItem,
              pressed && styles.houseListItemPressed,
            ]}
          >
            <View style={styles.houseListNumber}>
              <Text style={styles.houseListNumberText}>{house.number}</Text>
            </View>
            <View style={styles.houseListCopy}>
              <Text style={styles.houseListTitle} numberOfLines={1}>{house.title}</Text>
              <Text style={styles.houseListMeaning} numberOfLines={2}>{house.meaning}</Text>
              <View style={styles.houseFactsRow}>
                <View style={styles.houseFact}>
                  <Text style={styles.houseFactLabel}>SIGN</Text>
                  <Text style={styles.houseFactValue} numberOfLines={1}>{house.sign}</Text>
                </View>
                <View style={[styles.houseFact, styles.houseFactLast]}>
                  <Text style={styles.houseFactLabel}>PLANET</Text>
                  <Text style={styles.houseFactValue} numberOfLines={1}>
                    {house.planetNames?.join(', ') || '\u2014'}
                  </Text>
                </View>
              </View>
            </View>
            <Text style={styles.houseListChevron}>{'\u203A'}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function DoshasTab({ doshas, layout }) {
  const styles = useDevotionalStyles(baseStyles);
  const doshaItems = doshas?.length ? doshas : normalizeKundliData({}).doshas;

  return (
    <View style={[styles.card, { padding: layout.cardPadding }]}>
      <SectionHeading
        icon={'\u2737'}
        title="Dosha"
        subtitle="A calm overview of notable chart combinations."
      />
      <View style={styles.doshaList}>
        {doshaItems.map((item) => {
          const mild = item.tone === 'mild';
          return (
            <View
              key={item.title}
              style={[styles.doshaCard, mild && styles.doshaCardMild]}
            >
              <View style={styles.doshaHeader}>
                <View style={[styles.doshaIcon, mild && styles.doshaIconMild]}>
                  <Text style={[styles.doshaIconText, mild && styles.doshaIconTextMild]}>
                    {item.icon}
                  </Text>
                </View>
                <View style={styles.doshaCopy}>
                  <View style={styles.doshaTitleRow}>
                    <Text style={styles.doshaTitle} numberOfLines={1}>{item.title}</Text>
                    <View style={[styles.doshaStatus, mild && styles.doshaStatusMild]}>
                      <Text style={[styles.doshaStatusText, mild && styles.doshaStatusTextMild]}>
                        {item.status}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.doshaDetail} numberOfLines={2}>{item.description}</Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>
      <View style={styles.doshaHelperNote}>
        <View style={styles.doshaHelperIcon}>
          <Text style={styles.doshaHelperIconText}>i</Text>
        </View>
        <Text style={styles.doshaHelperText}>
          Dosha results are shown with gentle guidance. For final decisions, consult a qualified astrologer.
        </Text>
      </View>
    </View>
  );
}

function DashaTab({ dashas, dashaTimeline, layout }) {
  const styles = useDevotionalStyles(baseStyles);
  const [timelineVisible, setTimelineVisible] = useState(false);
  const dashaItems = dashas?.length ? dashas : normalizeKundliData({}).dashas;

  return (
    <>
      <View style={[styles.card, { padding: layout.cardPadding }]}>
        <SectionHeading
          icon={'\u263D'}
          title="Dasha"
          subtitle="Current planetary periods and upcoming transitions."
        />
        <View style={styles.dashaList}>
          {dashaItems.map((item, index) => (
            <View key={`${item.label}-${item.name}-${item.range}-${index}`} style={styles.dashaCard}>
              <View style={styles.dashaIconBadge}>
                <Text style={styles.dashaIconText}>{item.icon}</Text>
              </View>
              <View style={styles.dashaCopy}>
                <Text style={styles.dashaLabel}>{item.label}</Text>
                <Text style={styles.dashaName} numberOfLines={1}>{item.name}</Text>
                <Text
                  style={styles.dashaRange}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.84}
                >
                  {item.range}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="View Full Dasha Timeline"
          onPress={() => setTimelineVisible(true)}
          style={({ pressed }) => [
            styles.dashaTimelineButton,
            pressed && styles.primaryButtonPressed,
          ]}
        >
          <Text style={styles.dashaTimelineButtonText}>View Full Dasha Timeline</Text>
        </Pressable>
      </View>

      <DashaTimelineModal
        timeline={dashaTimeline}
        visible={timelineVisible}
        onClose={() => setTimelineVisible(false)}
      />
    </>
  );
}

function RemediesTab({ layout, navigation, remedies }) {
  const styles = useDevotionalStyles(baseStyles);
  const remedyItems = remedies?.length ? remedies : normalizeKundliData({}).remedies;
  const navigateSafely = (routeName) => {
    if (!navigation?.navigate || !routeName) return;
    try {
      navigation.navigate(routeName);
    } catch (error) {
      console.warn(`Kundli remedies: unable to open ${routeName}.`, error?.message);
    }
  };

  return (
    <View style={[styles.card, { padding: layout.cardPadding }]}>
      <SectionHeading
        icon={'\u0950'}
        title="Remedies"
        subtitle="Simple devotional suggestions for steady positivity."
      />
      <View style={styles.remedyList}>
        {remedyItems.map((item) => (
          <View key={item.title} style={styles.remedyCard}>
            <View style={styles.remedyCardIcon}>
              <Text style={styles.remedyCardIconText}>{item.icon}</Text>
            </View>
            <View style={styles.remedyCardCopy}>
              <Text style={styles.remedyCardTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.remedyCardSubtitle} numberOfLines={2}>{item.subtitle}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.remedyActions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Start Puja"
          onPress={() => navigateSafely('Puja')}
          style={({ pressed }) => [
            styles.remedyActionButton,
            pressed && styles.primaryButtonPressed,
          ]}
        >
          <Text style={styles.remedyActionButtonText}>Start Puja</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Read Mantra"
          onPress={() => navigateSafely('Mantras')}
          style={({ pressed }) => [
            styles.remedyActionButton,
            styles.remedyActionButtonSecondary,
            pressed && styles.pressed,
          ]}
        >
          <Text style={[styles.remedyActionButtonText, styles.remedyActionButtonTextSecondary]}>
            Read Mantra
          </Text>
        </Pressable>
      </View>

      <Text style={styles.remedyFooterNote}>
        Remedies are spiritual suggestions and should be followed with faith and positivity.
      </Text>
    </View>
  );
}

function DashaTimelineModal({ timeline, visible, onClose }) {
  const styles = useDevotionalStyles(baseStyles);
  const timelineItems = timeline?.length ? timeline : ['Dasha timeline is unavailable for this calculation.'];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={[styles.modalSheet, styles.dashaModalSheet]} onPress={() => {}}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <View style={styles.dashaModalBadge}>
              <Text style={styles.dashaModalBadgeText}>{'\u263D'}</Text>
            </View>
            <View style={styles.modalHeaderCopy}>
              <Text style={styles.modalEyebrow}>DASHA TIMELINE</Text>
              <Text style={styles.modalTitle}>Full Dasha Timeline</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close dasha timeline"
              onPress={onClose}
              style={({ pressed }) => [styles.modalClose, pressed && styles.pressed]}
            >
              <Text style={styles.modalCloseText}>{'\u00D7'}</Text>
            </Pressable>
          </View>

          <View style={styles.dashaTimelineList}>
            {timelineItems.map((item, index) => (
              <View key={`${item}-${index}`} style={styles.dashaTimelineItem}>
                <View style={styles.dashaTimelineDotWrap}>
                  <View style={styles.dashaTimelineDot} />
                  {index < timelineItems.length - 1 && <View style={styles.dashaTimelineLine} />}
                </View>
                <View style={styles.dashaTimelineCopy}>
                  <Text style={styles.dashaTimelineStep}>Step {index + 1}</Text>
                  <Text style={styles.dashaTimelineName}>{item}</Text>
                </View>
              </View>
            ))}
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            onPress={onClose}
            style={({ pressed }) => [
              styles.modalCloseButton,
              pressed && styles.primaryButtonPressed,
            ]}
          >
            <Text style={styles.modalCloseButtonText}>Close</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function HouseModal({ house, onClose }) {
  const styles = useDevotionalStyles(baseStyles);
  return (
    <Modal
      visible={Boolean(house)}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={styles.modalSheet} onPress={() => {}}>
          <View style={styles.modalHandle} />
          {house ? (
            <>
              <View style={styles.modalHeader}>
                <View style={styles.modalHouseBadge}>
                  <Text style={styles.modalHouseNumber}>{house.number}</Text>
                </View>
                <View style={styles.modalHeaderCopy}>
                  <Text style={styles.modalEyebrow}>HOUSE DETAILS</Text>
                  <Text style={styles.modalTitle}>{house.title}</Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Close house details"
                  onPress={onClose}
                  style={({ pressed }) => [styles.modalClose, pressed && styles.pressed]}
                >
                  <Text style={styles.modalCloseText}>{'\u00D7'}</Text>
                </Pressable>
              </View>

              <View style={styles.houseModalFacts}>
                <View style={styles.houseModalFact}>
                  <Text style={styles.modalSignLabel}>Sign</Text>
                  <Text style={styles.modalSignValue}>{house.sign}</Text>
                </View>
                <View style={[styles.houseModalFact, styles.houseModalFactBorder]}>
                  <Text style={styles.modalSignLabel}>Planet</Text>
                  <Text style={styles.modalSignValue} numberOfLines={1}>
                    {house.planetNames?.join(', ') || '\u2014'}
                  </Text>
                </View>
              </View>

              <Text style={styles.modalSectionLabel}>MEANING</Text>
              <Text style={styles.houseModalMeaning}>{house.meaning}</Text>
              <Text style={styles.modalDescription}>{house.detail}</Text>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close"
                onPress={onClose}
                style={({ pressed }) => [
                  styles.modalCloseButton,
                  pressed && styles.primaryButtonPressed,
                ]}
              >
                <Text style={styles.modalCloseButtonText}>Close</Text>
              </Pressable>
            </>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function PlanetModal({ planet, onClose }) {
  const styles = useDevotionalStyles(baseStyles);
  return (
    <Modal
      visible={Boolean(planet)}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={[styles.modalSheet, styles.planetModalSheet]} onPress={() => {}}>
          <View style={styles.modalHandle} />
          {planet ? (
            <>
              <View style={styles.modalHeader}>
                <View style={styles.planetModalBadge}>
                  <Text style={styles.planetModalSymbol}>{planet.symbol}</Text>
                </View>
                <View style={styles.modalHeaderCopy}>
                  <Text style={styles.modalEyebrow}>PLANET DETAILS</Text>
                  <Text style={styles.modalTitle}>{planet.name}</Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Close planet details"
                  onPress={onClose}
                  style={({ pressed }) => [styles.modalClose, pressed && styles.pressed]}
                >
                  <Text style={styles.modalCloseText}>{'\u00D7'}</Text>
                </Pressable>
              </View>

              <View style={styles.planetModalFacts}>
                <View style={styles.planetModalFact}>
                  <Text style={styles.modalSignLabel}>Sign</Text>
                  <Text style={styles.modalSignValue}>{planet.sign}</Text>
                </View>
                <View style={[styles.planetModalFact, styles.planetModalFactBorder]}>
                  <Text style={styles.modalSignLabel}>Degree</Text>
                  <Text style={styles.modalSignValue}>{planet.degree}</Text>
                </View>
              </View>

              <Text style={styles.modalSectionLabel}>MEANING</Text>
              <Text style={styles.modalDescription}>{planet.meaning}</Text>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close"
                onPress={onClose}
                style={({ pressed }) => [
                  styles.modalCloseButton,
                  pressed && styles.primaryButtonPressed,
                ]}
              >
                <Text style={styles.modalCloseButtonText}>Close</Text>
              </Pressable>
            </>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const serifFont = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

const baseStyles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 4,
  },
  contentShell: {
    width: '100%',
    alignSelf: 'center',
  },
  homePage: {
    width: '100%',
  },
  homeTopBar: {
    height: 54,
    justifyContent: 'center',
    marginBottom: 8,
  },
  homeHero: {
    width: '100%',
    minHeight: 236,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  homeHeroCopy: {
    flex: 1,
    minWidth: 0,
    paddingRight: 6,
  },
  homeHeroTitle: {
    color: COLORS.text,
    fontFamily: serifFont,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  homeHeroSubtitle: {
    color: COLORS.textSoft,
    fontWeight: '500',
    marginTop: 15,
  },
  homeZodiacWheel: {
    flexShrink: 0,
    marginRight: -4,
    marginLeft: 4,
  },
  featureList: {
    width: '100%',
    rowGap: 12,
  },
  featureCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'rgba(190, 137, 42, 0.34)',
    backgroundColor: '#FFFAEF',
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245, 220, 159, 0.42)',
    borderWidth: 1,
    borderColor: 'rgba(190, 137, 42, 0.3)',
    marginRight: 13,
  },
  featureIconText: {
    color: COLORS.goldDark,
    fontSize: 18,
    fontWeight: '800',
  },
  featureCopy: {
    flex: 1,
    minWidth: 0,
  },
  featureTitle: {
    color: COLORS.text,
    fontFamily: serifFont,
    fontSize: 15,
    fontWeight: '900',
  },
  featureDescription: {
    color: COLORS.textSoft,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },
  featureChevron: {
    color: COLORS.gold,
    fontSize: 23,
    fontWeight: '400',
    marginLeft: 7,
  },
  homeCta: {
    width: '100%',
    minHeight: 56,
    borderRadius: 14,
    backgroundColor: '#B87918',
    borderWidth: 1,
    borderColor: '#F0C96C',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginTop: 22,
    paddingHorizontal: 18,
    shadowColor: COLORS.goldDark,
    shadowOpacity: 0.28,
    shadowRadius: 11,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  homeCtaHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '48%',
    backgroundColor: 'rgba(238, 188, 78, 0.56)',
  },
  homeCtaPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.99 }],
  },
  homeCtaText: {
    color: '#FFF9EA',
    fontFamily: serifFont,
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
    textShadowColor: 'rgba(91, 54, 7, 0.22)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  formHeader: {
    minHeight: 112,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 7,
    overflow: 'visible',
  },
  formBell: {
    position: 'absolute',
    top: -10,
    opacity: 0.55,
  },
  formBellLeft: {
    left: 3,
  },
  formBellRight: {
    right: 3,
    transform: [{ scaleX: -1 }],
  },
  formBackButton: {
    position: 'absolute',
    top: 9,
    left: 0,
    zIndex: 4,
  },
  formHeaderCopy: {
    width: '74%',
    alignItems: 'center',
  },
  formHeaderEyebrow: {
    color: COLORS.goldDark,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.4,
    marginBottom: 4,
  },
  formHeaderTitle: {
    color: COLORS.text,
    fontFamily: serifFont,
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 28,
    textAlign: 'center',
    textShadowColor: 'rgba(173, 113, 18, 0.12)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  resultHeader: {
    minHeight: 112,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 7,
    overflow: 'visible',
  },
  resultBell: {
    position: 'absolute',
    top: -10,
    opacity: 0.52,
  },
  resultBellLeft: {
    left: 3,
  },
  resultBellRight: {
    right: 3,
    transform: [{ scaleX: -1 }],
  },
  resultHeaderButton: {
    position: 'absolute',
    top: 9,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 250, 237, 0.94)',
    borderWidth: 1,
    borderColor: COLORS.border,
    zIndex: 4,
  },
  resultHeaderBack: {
    position: 'absolute',
    top: 9,
    left: 0,
    zIndex: 4,
  },
  resultHeaderShare: {
    right: 0,
  },
  resultHeaderCopy: {
    width: '68%',
    alignItems: 'center',
  },
  resultHeaderEyebrow: {
    color: COLORS.goldDark,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.4,
    marginBottom: 4,
  },
  resultHeaderTitle: {
    width: '100%',
    color: COLORS.text,
    fontFamily: serifFont,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '900',
    textAlign: 'center',
    textShadowColor: 'rgba(173, 113, 18, 0.12)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  resultShareIcon: {
    color: COLORS.text,
    fontSize: 20,
    lineHeight: 22,
    fontWeight: '900',
    marginTop: -2,
  },
  stepWrap: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: 430,
    alignSelf: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
    paddingHorizontal: 12,
  },
  stepItem: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.parchmentStrong,
    borderWidth: 1,
    borderColor: COLORS.border,
    zIndex: 2,
  },
  stepCircleActive: {
    backgroundColor: COLORS.gold,
    borderColor: COLORS.gold,
  },
  stepNumber: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: '800',
  },
  stepNumberActive: {
    color: COLORS.white,
  },
  stepLabel: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '800',
    marginTop: 6,
    zIndex: 2,
  },
  stepLabelActive: {
    color: COLORS.goldDark,
  },
  stepLine: {
    position: 'absolute',
    height: 1,
    left: '50%',
    width: '100%',
    top: 14,
    backgroundColor: COLORS.border,
    zIndex: 0,
  },
  stepLineActive: {
    backgroundColor: COLORS.gold,
  },
  card: {
    width: '100%',
    backgroundColor: COLORS.parchment,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
    marginBottom: SPACING.md,
  },
  basicCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  basicCardTitleWrap: {
    flex: 1,
    minWidth: 0,
    paddingRight: 10,
  },
  basicCardTitle: {
    color: COLORS.text,
    fontFamily: serifFont,
    fontSize: 19,
    fontWeight: '900',
  },
  basicCardSubtitle: {
    color: COLORS.textSoft,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 4,
    maxWidth: 390,
  },
  basicUserBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cream,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  basicUserBadgeText: {
    color: COLORS.goldDark,
    fontSize: 18,
    fontWeight: '800',
  },
  calendarBadgeText: {
    color: COLORS.goldDark,
    fontSize: 18,
    fontWeight: '900',
  },
  locationBadgeText: {
    color: COLORS.goldDark,
    fontSize: 21,
    fontWeight: '900',
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cream,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: SPACING.sm,
  },
  sectionIconText: {
    color: COLORS.goldDark,
    fontSize: 18,
    fontWeight: '700',
  },
  sectionHeadingCopy: {
    flex: 1,
    minWidth: 0,
  },
  sectionTitle: {
    color: COLORS.text,
    fontFamily: serifFont,
    fontSize: 18,
    fontWeight: '800',
  },
  sectionSubtitle: {
    color: COLORS.textSoft,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },
  fieldLabel: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 7,
    marginTop: 4,
  },
  iconInputWrap: {
    width: '100%',
    minHeight: 47,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: 'rgba(255, 253, 246, 0.94)',
    marginBottom: SPACING.md,
  },
  iconInput: {
    flex: 1,
    minWidth: 0,
    minHeight: 45,
    color: COLORS.text,
    fontSize: 14,
    paddingLeft: 14,
    paddingRight: 8,
    paddingVertical: 10,
  },
  inputTrailingIcon: {
    width: 38,
    color: COLORS.goldDark,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    opacity: 0.78,
  },
  placeSearchWrap: {
    width: '100%',
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: 'rgba(255, 253, 246, 0.96)',
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  placeSearchInput: {
    flex: 1,
    minWidth: 0,
    minHeight: 48,
    color: COLORS.text,
    fontSize: 14,
    paddingLeft: 14,
    paddingRight: 8,
    paddingVertical: 11,
  },
  placeSearchIcon: {
    width: 44,
    color: COLORS.goldDark,
    fontSize: 16,
    textAlign: 'center',
  },
  detectLocationButton: {
    width: '100%',
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 17,
    borderWidth: 1.25,
    borderColor: COLORS.gold,
    backgroundColor: 'rgba(255, 249, 232, 0.82)',
    paddingHorizontal: 13,
    paddingVertical: 12,
    marginBottom: SPACING.md,
  },
  detectLocationButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.995 }],
  },
  detectLocationIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cream,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 11,
    flexShrink: 0,
  },
  detectLocationIcon: {
    color: COLORS.goldDark,
    fontSize: 21,
    fontWeight: '900',
  },
  detectLocationCopy: {
    flex: 1,
    minWidth: 0,
  },
  detectLocationTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '900',
  },
  detectLocationSubtitle: {
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 14,
    marginTop: 3,
  },
  detectLocationChevron: {
    color: COLORS.goldDark,
    fontSize: 25,
    lineHeight: 27,
    marginLeft: 7,
    flexShrink: 0,
  },
  placeHelperNote: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 14,
    backgroundColor: 'rgba(247, 229, 183, 0.52)',
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginBottom: SPACING.lg,
  },
  placeHelperIcon: {
    color: COLORS.gold,
    fontSize: 14,
    marginRight: 9,
    marginTop: 1,
    flexShrink: 0,
  },
  placeHelperText: {
    flex: 1,
    minWidth: 0,
    color: COLORS.textSoft,
    fontSize: 10,
    lineHeight: 15,
  },
  valueRow: {
    width: '100%',
    minHeight: 47,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: 'rgba(255, 253, 246, 0.94)',
    paddingLeft: 14,
    paddingRight: 7,
    marginBottom: SPACING.md,
  },
  valueRowSoftened: {
    backgroundColor: COLORS.disabled,
    borderColor: 'rgba(160, 145, 116, 0.25)',
  },
  valueRowPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.995 }],
  },
  valueRowText: {
    flex: 1,
    minWidth: 0,
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
    paddingVertical: 11,
  },
  valueRowTextSoftened: {
    color: COLORS.disabledText,
  },
  valueRowIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(247, 229, 183, 0.62)',
  },
  valueRowIconWrapSoftened: {
    backgroundColor: 'rgba(188, 175, 149, 0.2)',
  },
  valueRowIcon: {
    color: COLORS.goldDark,
    fontSize: 16,
    fontWeight: '900',
  },
  valueRowIconSoftened: {
    color: COLORS.disabledText,
  },
  genderRow: {
    flexDirection: 'row',
    columnGap: 8,
    marginBottom: SPACING.lg,
  },
  genderButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: 'rgba(255, 253, 246, 0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  genderButtonSelected: {
    backgroundColor: COLORS.cream,
    borderColor: COLORS.gold,
  },
  genderText: {
    color: COLORS.textSoft,
    fontSize: 12,
    fontWeight: '700',
  },
  genderTextSelected: {
    color: COLORS.goldDark,
    fontWeight: '900',
  },
  timeCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 13,
    backgroundColor: 'rgba(247, 229, 183, 0.42)',
    paddingHorizontal: 11,
    paddingVertical: 10,
    marginTop: -2,
    marginBottom: SPACING.lg,
  },
  checkbox: {
    width: 21,
    height: 21,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    marginRight: 9,
    backgroundColor: COLORS.parchmentStrong,
  },
  checkboxChecked: {
    backgroundColor: COLORS.gold,
  },
  checkmark: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '900',
  },
  checkboxCopy: {
    flex: 1,
  },
  checkboxLabel: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '700',
  },
  checkboxHint: {
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 14,
    marginTop: 2,
  },
  primaryButton: {
    borderRadius: 15,
    backgroundColor: COLORS.gold,
    borderWidth: 1,
    borderColor: COLORS.goldLight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    shadowColor: COLORS.goldDark,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  primaryButtonPressed: {
    opacity: 0.84,
    transform: [{ scale: 0.99 }],
  },
  primaryButtonDisabled: {
    backgroundColor: COLORS.disabled,
    borderColor: COLORS.disabled,
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'center',
  },
  primaryButtonIcon: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '900',
    marginLeft: 8,
  },
  primaryButtonTextDisabled: {
    color: COLORS.disabledText,
  },
  secondaryButton: {
    minWidth: 88,
    borderRadius: 15,
    backgroundColor: COLORS.parchmentStrong,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  secondaryButtonText: {
    color: COLORS.goldDark,
    fontSize: 13,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.72,
  },
  formDisclaimer: {
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 15,
    textAlign: 'center',
    paddingHorizontal: 22,
    marginTop: 1,
  },
  reviewCard: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    backgroundColor: COLORS.parchment,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.13,
    shadowRadius: 13,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    marginBottom: SPACING.lg,
  },
  reviewTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  reviewEyeBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cream,
    borderWidth: 1,
    borderColor: COLORS.goldLight,
    marginRight: 11,
    flexShrink: 0,
  },
  reviewEyeIcon: {
    color: COLORS.goldDark,
    fontSize: 22,
    fontWeight: '900',
  },
  reviewTitleCopy: {
    flex: 1,
    minWidth: 0,
  },
  reviewTitle: {
    color: COLORS.text,
    fontFamily: serifFont,
    fontSize: 18,
    fontWeight: '900',
  },
  reviewSubtitle: {
    color: COLORS.textSoft,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 3,
  },
  reviewDetails: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(190, 137, 42, 0.3)',
    backgroundColor: 'rgba(255, 253, 246, 0.74)',
    paddingHorizontal: 13,
    marginBottom: SPACING.lg,
  },
  reviewRow: {
    minHeight: 62,
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(190, 137, 42, 0.18)',
    paddingVertical: 10,
  },
  reviewRowLast: {
    borderBottomWidth: 0,
  },
  reviewLabel: {
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.45,
    textTransform: 'uppercase',
  },
  reviewValue: {
    color: COLORS.text,
    fontFamily: serifFont,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '900',
    marginTop: 3,
  },
  reviewEditButton: {
    width: '100%',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.gold,
    backgroundColor: 'rgba(255, 249, 232, 0.86)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  reviewEditButtonText: {
    color: COLORS.goldDark,
    fontSize: 13,
    fontWeight: '900',
  },
  reviewGenerateButton: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    marginBottom: 12,
  },
  kundliErrorText: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    color: '#8A3F2D',
    fontSize: 10,
    lineHeight: 15,
    textAlign: 'center',
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  reviewAssurance: {
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 15,
    textAlign: 'center',
    paddingHorizontal: 24,
    marginBottom: 4,
  },
  resultProfileCard: {
    width: '100%',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.parchment,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.11,
    shadowRadius: 11,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
    marginBottom: 12,
  },
  resultProfileTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultProfileSeal: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245, 218, 151, 0.62)',
    borderWidth: 1,
    borderColor: COLORS.goldLight,
    marginRight: 12,
    flexShrink: 0,
  },
  resultProfileSealInner: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.parchmentStrong,
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  resultProfileSealText: {
    color: COLORS.goldDark,
    fontSize: 23,
    fontWeight: '900',
  },
  resultProfileCopy: {
    flex: 1,
    minWidth: 0,
  },
  resultProfileName: {
    color: COLORS.text,
    fontFamily: serifFont,
    fontSize: 18,
    fontWeight: '900',
  },
  resultProfileMeta: {
    color: COLORS.textSoft,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '700',
    marginTop: 3,
  },
  resultProfilePlace: {
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 1,
  },
  resultSummaryRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(190, 137, 42, 0.28)',
    backgroundColor: 'rgba(247, 229, 183, 0.48)',
    marginTop: 15,
    overflow: 'hidden',
  },
  resultSummaryItem: {
    flex: 1,
    minWidth: 0,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    paddingVertical: 8,
  },
  resultSummaryItemBorder: {
    borderRightWidth: 1,
    borderRightColor: 'rgba(190, 137, 42, 0.24)',
  },
  resultSummaryLabel: {
    color: COLORS.muted,
    fontSize: 8,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  resultSummaryValue: {
    color: COLORS.text,
    fontFamily: serifFont,
    fontSize: 13,
    fontWeight: '900',
    marginTop: 3,
  },
  resultChartCard: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.parchment,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
    marginBottom: 13,
  },
  resultChartTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  resultChartTitle: {
    color: COLORS.text,
    fontFamily: serifFont,
    fontSize: 18,
    fontWeight: '900',
  },
  resultChartSubtitle: {
    color: COLORS.muted,
    fontSize: 9,
    lineHeight: 14,
    marginTop: 3,
  },
  resultChartBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cream,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginLeft: 10,
    flexShrink: 0,
  },
  resultChartBadgeText: {
    color: COLORS.goldDark,
    fontSize: 18,
    fontWeight: '900',
  },
  northChart: {
    width: '100%',
    maxWidth: 420,
    aspectRatio: 1,
    alignSelf: 'center',
    position: 'relative',
    borderWidth: 1.4,
    borderColor: COLORS.gold,
    backgroundColor: 'rgba(255, 251, 239, 0.92)',
    overflow: 'hidden',
  },
  northChartDiamond: {
    position: 'absolute',
    left: '14.65%',
    top: '14.65%',
    width: '70.7%',
    height: '70.7%',
    borderWidth: 1,
    borderColor: COLORS.gold,
    transform: [{ rotate: '45deg' }],
  },
  northChartDiagonal: {
    position: 'absolute',
    left: '-20.7%',
    top: '49.8%',
    width: '141.4%',
    height: 1,
    backgroundColor: COLORS.gold,
  },
  northChartDiagonalDown: {
    transform: [{ rotate: '45deg' }],
  },
  northChartDiagonalUp: {
    transform: [{ rotate: '-45deg' }],
  },
  northChartHouse: {
    position: 'absolute',
    zIndex: 3,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingHorizontal: 2,
  },
  northChartHousePressed: {
    backgroundColor: 'rgba(237, 200, 110, 0.34)',
  },
  northChartHouseNumber: {
    color: COLORS.goldDark,
    fontSize: 9,
    lineHeight: 11,
    fontWeight: '900',
  },
  northChartHousePlanets: {
    color: COLORS.text,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '900',
    marginTop: 2,
    textAlign: 'center',
  },
  chartTapHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 13,
  },
  chartTapHintIcon: {
    color: COLORS.goldDark,
    fontSize: 13,
    marginRight: 6,
  },
  chartTapHintText: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '700',
  },
  tabScroller: {
    width: '100%',
    marginBottom: 12,
  },
  tabScroll: {
    flexGrow: 1,
    columnGap: 7,
    paddingVertical: 2,
  },
  tabButton: {
    flexGrow: 1,
    minWidth: 78,
    minHeight: 38,
    paddingHorizontal: 14,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: 'rgba(255, 250, 237, 0.76)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonSelected: {
    backgroundColor: COLORS.gold,
    borderColor: COLORS.gold,
  },
  tabText: {
    color: COLORS.goldDark,
    fontSize: 11,
    fontWeight: '800',
  },
  tabTextSelected: {
    color: COLORS.white,
  },
  overviewTable: {
    width: '100%',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(190, 137, 42, 0.3)',
    backgroundColor: 'rgba(255, 253, 246, 0.72)',
    overflow: 'hidden',
  },
  overviewRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(190, 137, 42, 0.18)',
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  overviewRowLast: {
    borderBottomWidth: 0,
  },
  overviewLabel: {
    width: '38%',
    flexShrink: 0,
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.45,
    textTransform: 'uppercase',
  },
  overviewValue: {
    flex: 1,
    minWidth: 0,
    color: COLORS.text,
    fontFamily: serifFont,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '900',
    textAlign: 'right',
  },
  planetList: {
    width: '100%',
    rowGap: 8,
  },
  planetRow: {
    width: '100%',
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(190, 137, 42, 0.28)',
    backgroundColor: 'rgba(255, 252, 242, 0.84)',
    paddingHorizontal: 10,
    paddingVertical: 7,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  planetRowPressed: {
    opacity: 0.78,
    backgroundColor: COLORS.cream,
    transform: [{ scale: 0.99 }],
  },
  planetSymbolWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    backgroundColor: 'rgba(247, 229, 183, 0.68)',
    borderWidth: 1,
    borderColor: 'rgba(190, 137, 42, 0.3)',
    marginRight: 9,
  },
  planetIdentity: {
    flex: 1,
    minWidth: 0,
  },
  planetSymbol: {
    color: COLORS.goldDark,
    fontSize: 16,
    fontWeight: '900',
  },
  planetName: {
    color: COLORS.text,
    fontFamily: serifFont,
    fontSize: 13,
    fontWeight: '900',
  },
  planetSign: {
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
  },
  planetDegree: {
    flexShrink: 0,
    color: COLORS.goldDark,
    fontSize: 11,
    fontWeight: '900',
    textAlign: 'right',
    marginLeft: 10,
  },
  housesList: {
    width: '100%',
    rowGap: 8,
  },
  houseListItem: {
    minHeight: 94,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(190, 137, 42, 0.28)',
    backgroundColor: 'rgba(255, 252, 242, 0.78)',
    paddingHorizontal: 10,
    paddingVertical: 10,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  houseListItemPressed: {
    opacity: 0.78,
    backgroundColor: COLORS.cream,
  },
  houseListNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cream,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 9,
    flexShrink: 0,
  },
  houseListNumberText: {
    color: COLORS.goldDark,
    fontSize: 12,
    fontWeight: '900',
  },
  houseListCopy: {
    flex: 1,
    minWidth: 0,
  },
  houseListTitle: {
    color: COLORS.text,
    fontFamily: serifFont,
    fontSize: 13,
    fontWeight: '900',
  },
  houseListMeaning: {
    color: COLORS.textSoft,
    fontSize: 9,
    lineHeight: 13,
    marginTop: 3,
  },
  houseFactsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: 9,
    backgroundColor: 'rgba(247, 229, 183, 0.45)',
    marginTop: 7,
    overflow: 'hidden',
  },
  houseFact: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRightWidth: 1,
    borderRightColor: 'rgba(190, 137, 42, 0.2)',
  },
  houseFactLast: {
    flex: 1.35,
    borderRightWidth: 0,
  },
  houseFactLabel: {
    color: COLORS.muted,
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.45,
  },
  houseFactValue: {
    color: COLORS.text,
    fontSize: 9,
    fontWeight: '900',
    marginTop: 1,
  },
  houseListChevron: {
    color: COLORS.goldDark,
    fontSize: 23,
    lineHeight: 25,
    marginLeft: 7,
  },
  doshaCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(111, 124, 58, 0.28)',
    backgroundColor: 'rgba(246, 249, 229, 0.82)',
    padding: 12,
  },
  doshaCardMild: {
    borderColor: 'rgba(197, 138, 36, 0.34)',
    backgroundColor: 'rgba(255, 242, 214, 0.82)',
  },
  doshaList: {
    width: '100%',
    rowGap: 9,
  },
  doshaHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  doshaIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(111, 124, 58, 0.13)',
    borderWidth: 1,
    borderColor: 'rgba(111, 124, 58, 0.28)',
    marginRight: 9,
    flexShrink: 0,
  },
  doshaIconMild: {
    backgroundColor: 'rgba(221, 150, 45, 0.14)',
    borderColor: 'rgba(197, 138, 36, 0.3)',
  },
  doshaIconText: {
    color: COLORS.success,
    fontSize: 15,
    fontWeight: '900',
  },
  doshaIconTextMild: {
    color: '#B36B18',
  },
  doshaCopy: {
    flex: 1,
    minWidth: 0,
  },
  doshaTitle: {
    flex: 1,
    minWidth: 90,
    color: COLORS.text,
    fontFamily: serifFont,
    fontSize: 13,
    fontWeight: '900',
  },
  doshaTitleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  doshaDetail: {
    color: COLORS.textSoft,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 3,
  },
  doshaStatus: {
    borderRadius: 99,
    backgroundColor: 'rgba(111, 124, 58, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(111, 124, 58, 0.34)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    flexShrink: 0,
  },
  doshaStatusMild: {
    backgroundColor: 'rgba(221, 150, 45, 0.13)',
    borderColor: 'rgba(197, 138, 36, 0.34)',
  },
  doshaStatusText: {
    color: COLORS.success,
    fontSize: 8,
    fontWeight: '900',
  },
  doshaStatusTextMild: {
    color: '#A85F12',
  },
  doshaHelperNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 14,
    backgroundColor: 'rgba(247, 229, 183, 0.52)',
    padding: 12,
    marginTop: 12,
  },
  doshaHelperIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.parchmentStrong,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 9,
    flexShrink: 0,
  },
  doshaHelperIconText: {
    color: COLORS.goldDark,
    fontFamily: serifFont,
    fontSize: 13,
    fontWeight: '900',
  },
  doshaHelperText: {
    flex: 1,
    color: COLORS.textSoft,
    fontSize: 10,
    lineHeight: 16,
  },
  dashaList: {
    width: '100%',
    rowGap: 9,
  },
  dashaCard: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(190, 137, 42, 0.3)',
    backgroundColor: 'rgba(255, 252, 242, 0.82)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  dashaIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(247, 229, 183, 0.72)',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 10,
    flexShrink: 0,
  },
  dashaIconText: {
    color: COLORS.goldDark,
    fontSize: 18,
    fontWeight: '900',
  },
  dashaCopy: {
    flex: 1,
    minWidth: 0,
  },
  dashaLabel: {
    color: COLORS.muted,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  dashaName: {
    color: COLORS.text,
    fontFamily: serifFont,
    fontSize: 14,
    fontWeight: '900',
    marginTop: 3,
  },
  dashaRange: {
    color: COLORS.textSoft,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 2,
  },
  dashaTimelineButton: {
    width: '100%',
    minHeight: 48,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gold,
    borderWidth: 1,
    borderColor: COLORS.goldLight,
    marginTop: 14,
    paddingHorizontal: 14,
  },
  dashaTimelineButtonText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '900',
  },
  remedyList: {
    width: '100%',
    rowGap: 9,
  },
  remedyCard: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(190, 137, 42, 0.32)',
    backgroundColor: 'rgba(255, 248, 232, 0.84)',
    paddingHorizontal: 11,
    paddingVertical: 9,
  },
  remedyCardIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cream,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 10,
    flexShrink: 0,
  },
  remedyCardIconText: {
    color: COLORS.goldDark,
    fontSize: 17,
    fontWeight: '900',
  },
  remedyCardCopy: {
    flex: 1,
    minWidth: 0,
  },
  remedyCardTitle: {
    color: COLORS.text,
    fontFamily: serifFont,
    fontSize: 13,
    fontWeight: '900',
  },
  remedyCardSubtitle: {
    color: COLORS.textSoft,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 2,
  },
  remedyActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
    marginTop: 14,
  },
  remedyActionButton: {
    flex: 1,
    minWidth: 132,
    minHeight: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gold,
    borderWidth: 1,
    borderColor: COLORS.goldLight,
    paddingHorizontal: 14,
  },
  remedyActionButtonSecondary: {
    backgroundColor: 'rgba(255, 250, 237, 0.84)',
    borderColor: COLORS.border,
  },
  remedyActionButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '900',
  },
  remedyActionButtonTextSecondary: {
    color: COLORS.goldDark,
  },
  remedyFooterNote: {
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 15,
    textAlign: 'center',
    marginTop: 13,
    paddingHorizontal: 4,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(65, 43, 18, 0.38)',
  },
  modalSheet: {
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: COLORS.parchmentStrong,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    shadowColor: '#000000',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -5 },
    elevation: 12,
  },
  planetModalSheet: {
    paddingBottom: Platform.OS === 'ios' ? 30 : 22,
  },
  dashaModalSheet: {
    paddingBottom: Platform.OS === 'ios' ? 30 : 22,
  },
  modalHandle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginBottom: 17,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalHouseBadge: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  modalHouseNumber: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '900',
  },
  planetModalBadge: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gold,
    marginRight: 11,
  },
  planetModalSymbol: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: '900',
  },
  dashaModalBadge: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gold,
    marginRight: 11,
  },
  dashaModalBadgeText: {
    color: COLORS.white,
    fontSize: 21,
    fontWeight: '900',
  },
  modalHeaderCopy: {
    flex: 1,
    minWidth: 0,
  },
  modalEyebrow: {
    color: COLORS.goldDark,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },
  modalTitle: {
    color: COLORS.text,
    fontFamily: serifFont,
    fontSize: 19,
    fontWeight: '900',
    marginTop: 1,
  },
  modalClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    color: COLORS.text,
    fontSize: 23,
    lineHeight: 25,
  },
  modalDescription: {
    color: COLORS.textSoft,
    fontSize: 12,
    lineHeight: 19,
  },
  houseModalFacts: {
    flexDirection: 'row',
    borderRadius: 13,
    backgroundColor: 'rgba(247, 229, 183, 0.52)',
    marginTop: 16,
    overflow: 'hidden',
  },
  houseModalFact: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  houseModalFactBorder: {
    flex: 1.35,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(190, 137, 42, 0.24)',
  },
  planetModalFacts: {
    flexDirection: 'row',
    borderRadius: 13,
    backgroundColor: 'rgba(247, 229, 183, 0.52)',
    marginTop: 16,
    overflow: 'hidden',
  },
  planetModalFact: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  planetModalFactBorder: {
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(190, 137, 42, 0.24)',
  },
  modalSignLabel: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  modalSignValue: {
    color: COLORS.text,
    fontFamily: serifFont,
    fontSize: 15,
    fontWeight: '900',
  },
  modalSectionLabel: {
    color: COLORS.goldDark,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.9,
    marginTop: 18,
    marginBottom: 9,
  },
  houseModalMeaning: {
    color: COLORS.text,
    fontFamily: serifFont,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '900',
    marginBottom: 6,
  },
  dashaTimelineList: {
    width: '100%',
    borderRadius: 15,
    backgroundColor: 'rgba(247, 229, 183, 0.42)',
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginTop: 18,
  },
  dashaTimelineItem: {
    flexDirection: 'row',
    minHeight: 48,
  },
  dashaTimelineDotWrap: {
    width: 24,
    alignItems: 'center',
    marginRight: 9,
  },
  dashaTimelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.gold,
    borderWidth: 2,
    borderColor: COLORS.parchmentStrong,
    marginTop: 4,
  },
  dashaTimelineLine: {
    flex: 1,
    width: 1,
    backgroundColor: 'rgba(190, 137, 42, 0.34)',
    marginTop: 3,
  },
  dashaTimelineCopy: {
    flex: 1,
    minWidth: 0,
    paddingBottom: 12,
  },
  dashaTimelineStep: {
    color: COLORS.muted,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  dashaTimelineName: {
    color: COLORS.text,
    fontFamily: serifFont,
    fontSize: 14,
    fontWeight: '900',
    marginTop: 2,
  },
  modalCloseButton: {
    width: '100%',
    minHeight: 48,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gold,
    borderWidth: 1,
    borderColor: COLORS.goldLight,
    marginTop: 20,
  },
  modalCloseButtonText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '900',
  },
});
