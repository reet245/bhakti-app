import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DevotionalBackground from '../components/DevotionalBackground';
import BhaktiBackButton from '../components/BhaktiBackButton';
import useDevotionalCopy from '../hooks/useDevotionalCopy';
import useDevotionalStyles from '../hooks/useDevotionalStyles';
import { deleteCustomMantra, retryDevotionalLoad, saveCustomMantra, useDevotionalState } from '../hooks/useDevotionalState';
import { DEITY_OPTIONS } from '../data/mantrasData';

export default function CustomMantraScreen({ navigation, route }) {
  const { customMantras, ready, error } = useDevotionalState();
  const { isHindi } = useDevotionalCopy();
  const styles = useDevotionalStyles(baseStyles);
  const existing = customMantras.find((entry) => entry.id === route?.params?.mantraId);
  // Keep the editor mounted while a successful delete removes its store entry;
  // it still needs to finish navigation after the storage promise resolves.
  const resolved = useRef(null);
  if (existing) resolved.current = existing;
  if (resolved.current?.id !== route?.params?.mantraId) resolved.current = null;
  const editable = existing || resolved.current;
  if (!ready || (route?.params?.mantraId && !editable)) return <DevotionalBackground style={styles.fill}><SafeAreaView style={styles.fill}><View style={styles.content}>
    <BhaktiBackButton navigation={navigation} fallbackRoute="Mantras" />
    <Text selectable style={styles.body}>{!ready ? (isHindi ? 'आपका संग्रह लोड हो रहा है…' : 'Loading your collection…') : (isHindi ? 'यह व्यक्तिगत मंत्र नहीं मिला।' : 'This personal mantra was not found.')}</Text>
    {!!error && <><Text selectable accessibilityRole="alert" style={styles.body}>{error}</Text><TouchableOpacity accessibilityRole="button" style={styles.secondary} onPress={retryDevotionalLoad}><Text style={styles.secondaryText}>{isHindi ? 'फिर प्रयास करें' : 'Retry loading'}</Text></TouchableOpacity></>}
  </View></SafeAreaView></DevotionalBackground>;
  return <CustomMantraEditor key={editable?.id || 'new'} navigation={navigation} existing={editable} />;
}

function CustomMantraEditor({ navigation, existing }) {
  const styles = useDevotionalStyles(baseStyles);
  const { isHindi } = useDevotionalCopy();
  const [draft, setDraft] = useState(() => ({ title: '', text: '', transliteration: '', meaning: '', deityId: 'shiv', ...existing }));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const update = (field, value) => setDraft((current) => ({ ...current, [field]: value }));
  const handleSave = async () => {
    if (pending) return;
    if (!draft.title.trim() || !draft.text.trim()) {
      setError(isHindi ? 'शीर्षक और मंत्र का पाठ जोड़ें।' : 'Add a title and mantra text before saving.');
      return;
    }
    setError('');
    setPending(true);
    try {
      const mantra = await saveCustomMantra(draft);
      if (mounted.current) {
        // Editing was opened from the reader. Return to that live reader rather
        // than leaving two identical detail screens in the back stack.
        if (existing && navigation.canGoBack()) navigation.goBack();
        else navigation.replace('MantraDetail', { mantraId: mantra.id });
      }
    } catch {
      if (mounted.current) setError(isHindi ? 'सहेज नहीं सके। आपका लिखा पाठ यहाँ सुरक्षित है। फिर प्रयास करें।' : 'Could not save. Your draft is still here; please try again.');
    } finally { if (mounted.current) setPending(false); }
  };
  const handleDelete = async () => {
    if (pending || !existing) return;
    setError('');
    setPending(true);
    try {
      await deleteCustomMantra(existing.id);
      if (mounted.current) navigation.popTo('Mantras', { collection: 'personal' });
    } catch {
      if (mounted.current) setError(isHindi ? 'हटा नहीं सके। मंत्र अभी आपके संग्रह में है। फिर प्रयास करें।' : 'Could not delete. Your mantra is still in your collection; please try again.');
    } finally { if (mounted.current) setPending(false); }
  };

  return <DevotionalBackground style={styles.fill}>
    <SafeAreaView style={styles.fill}>
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" contentInsetAdjustmentBehavior="automatic">
          <View style={styles.header}>
            <BhaktiBackButton navigation={navigation} fallbackRoute="Mantras" />
            <Text style={styles.title}>{isHindi ? existing ? 'मंत्र संपादित करें' : 'अपना मंत्र जोड़ें' : existing ? 'Edit your mantra' : 'Your mantra'}</Text>
          </View>
          <Text style={styles.body}>{isHindi ? 'अपने पाठ और नोट्स जोड़ें। यह केवल इस डिवाइस पर सहेजा जाएगा।' : 'Keep a personal chant and your own notes. Saved only on this device.'}</Text>
          <View style={styles.form}>
            <Field label={isHindi ? 'शीर्षक' : 'Title'} value={draft.title} onChangeText={(value) => update('title', value)} maxLength={120} editable={!pending} />
            <Text style={styles.label}>{isHindi ? 'देवता' : 'Deity'}</Text>
            <View style={styles.chips}>{DEITY_OPTIONS.map((deity) => <TouchableOpacity key={deity.id} accessibilityRole="button" accessibilityState={{ selected: draft.deityId === deity.id, disabled: pending }} disabled={pending} onPress={() => update('deityId', deity.id)} style={[styles.chip, draft.deityId === deity.id && styles.selectedChip]}><Text style={styles.chipText}>{isHindi ? deity.hindiName : deity.englishName}</Text></TouchableOpacity>)}</View>
            <Field label={isHindi ? 'मंत्र का पाठ' : 'Mantra text'} value={draft.text} onChangeText={(value) => update('text', value)} maxLength={16000} multiline editable={!pending} />
            <Field label={isHindi ? 'उच्चारण / लिप्यंतरण (वैकल्पिक)' : 'Pronunciation / transliteration (optional)'} value={draft.transliteration} onChangeText={(value) => update('transliteration', value)} maxLength={16000} multiline editable={!pending} />
            <Field label={isHindi ? 'आपके नोट्स / अर्थ (वैकल्पिक)' : 'Your notes / meaning (optional)'} value={draft.meaning} onChangeText={(value) => update('meaning', value)} maxLength={4000} multiline editable={!pending} />
          </View>
          {!!error && <Text selectable accessibilityRole="alert" style={styles.error}>{error}</Text>}
          <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled: pending, busy: pending }} disabled={pending} onPress={handleSave} style={[styles.primary, pending && styles.disabled]}><Text style={styles.primaryText}>{pending ? (isHindi ? 'सहेज रहे हैं…' : 'Saving…') : (isHindi ? 'मंत्र सहेजें' : 'Save mantra')}</Text></TouchableOpacity>
          {!!existing && (confirmDelete ? <View style={styles.form}>
            <Text style={styles.body}>{isHindi ? 'इस व्यक्तिगत मंत्र और उसकी जप प्रगति को इस डिवाइस से हटाएँ?' : 'Delete this personal mantra and its Jaap progress from this device?'}</Text>
            <TouchableOpacity accessibilityRole="button" disabled={pending} style={styles.secondary} onPress={handleDelete}><Text style={styles.secondaryText}>{isHindi ? 'हाँ, हटाएँ' : 'Delete mantra'}</Text></TouchableOpacity>
            <TouchableOpacity accessibilityRole="button" disabled={pending} style={styles.secondary} onPress={() => setConfirmDelete(false)}><Text style={styles.secondaryText}>{isHindi ? 'रद्द करें' : 'Cancel'}</Text></TouchableOpacity>
          </View> : <TouchableOpacity accessibilityRole="button" disabled={pending} style={styles.secondary} onPress={() => setConfirmDelete(true)}><Text style={styles.secondaryText}>{isHindi ? 'व्यक्तिगत मंत्र हटाएँ' : 'Delete personal mantra'}</Text></TouchableOpacity>)}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  </DevotionalBackground>;
}

function Field({ label, multiline, ...props }) {
  const styles = useDevotionalStyles(baseStyles);
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput {...props} multiline={multiline} accessibilityLabel={label} style={[styles.input, multiline && styles.multiline]} textAlignVertical={multiline ? 'top' : 'center'} autoCorrect={false} /></View>;
}

const baseStyles = StyleSheet.create({
  fill: { flex: 1 },
  content: { width: '100%', maxWidth: 680, alignSelf: 'center', padding: 20, paddingBottom: 40, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { flex: 1, color: '#3F2713', fontSize: 26, fontWeight: '800', fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }) },
  body: { color: '#7A5520', fontSize: 15, lineHeight: 24 },
  form: { borderRadius: 24, borderCurve: 'continuous', backgroundColor: 'rgba(255, 250, 239, 0.96)', borderWidth: 1, borderColor: 'rgba(184, 121, 24, 0.28)', padding: 20, gap: 16 },
  field: { gap: 8 },
  label: { color: '#5C3A0E', fontSize: 14, fontWeight: '700' },
  input: { color: '#3F2713', backgroundColor: '#FFF8E8', minHeight: 48, borderWidth: 1, borderColor: 'rgba(184, 121, 24, 0.28)', borderRadius: 12, padding: 12, fontSize: 16, lineHeight: 26 },
  multiline: { minHeight: 128 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 44, borderRadius: 22, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: 'rgba(184, 121, 24, 0.28)', justifyContent: 'center' },
  selectedChip: { backgroundColor: '#EFD487', borderColor: '#C9911E', borderWidth: 2 },
  chipText: { color: '#5C3A0E', fontSize: 13, fontWeight: '700' },
  primary: { minHeight: 50, borderRadius: 25, padding: 14, backgroundColor: '#C9911E', alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#FFF8E8', fontSize: 16, fontWeight: '800' },
  secondary: { minHeight: 48, borderRadius: 24, padding: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(184, 121, 24, 0.28)' },
  secondaryText: { color: '#7A5520', fontSize: 15, fontWeight: '700' },
  error: { color: '#7A5520', fontSize: 14, lineHeight: 22 },
  disabled: { opacity: 0.6 },
});
