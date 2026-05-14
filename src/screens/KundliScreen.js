import { useState, useContext } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { ThemeContext } from '../../App';
import { useLanguage } from '../context/LanguageContext';

export default function KundliScreen({ navigation }) {
  const { theme, isDark } = useContext(ThemeContext);
  const { t } = useLanguage();

  const [name, setName]   = useState('');
  const [dob, setDob]     = useState('');
  const [tob, setTob]     = useState('');
  const [place, setPlace] = useState('');

  // Derived tokens
  const cardBg          = isDark ? '#16213e'  : '#ffffff';
  const cardBorder      = isDark ? '#2e3a5e'  : '#e2d9f3';
  const inputBg         = isDark ? '#1a1a2e'  : '#f8f4ff';
  const inputBorder     = isDark ? '#2e3a5e'  : '#d0c8e8';
  const placeholderColor = isDark ? '#5a5282' : '#b0a8cc';
  const submitBg        = isDark ? '#6c63ff'  : '#7c3aed';

  function handleGenerate() {
    if (!name || !dob || !tob || !place) {
      Alert.alert(t('missingDetails'), t('fillAllFieldsKundli'));
      return;
    }
    navigation.navigate('KundliResult', { name, dob, tob, place });
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.emoji}>🔮</Text>
        <Text style={[styles.heading, { color: theme.text }]}>{t('generateKundli')}</Text>
        <Text style={[styles.subtitle, { color: theme.mutedText }]}>{t('enterBirthDetails')}</Text>

        <View style={[styles.formContainer, { backgroundColor: cardBg, borderColor: cardBorder }]}>

          <Text style={[styles.label, { color: theme.mutedText }]}>{t('fullName')}</Text>
          <TextInput
            style={[styles.input, { backgroundColor: inputBg, borderColor: inputBorder, color: theme.text }]}
            placeholder="e.g. Arjun Sharma"
            placeholderTextColor={placeholderColor}
            value={name}
            onChangeText={setName}
          />

          <Text style={[styles.label, { color: theme.mutedText }]}>{t('dateOfBirth')}</Text>
          <TextInput
            style={[styles.input, { backgroundColor: inputBg, borderColor: inputBorder, color: theme.text }]}
            placeholder="DD/MM/YYYY"
            placeholderTextColor={placeholderColor}
            value={dob}
            onChangeText={setDob}
          />

          <Text style={[styles.label, { color: theme.mutedText }]}>{t('timeOfBirth')}</Text>
          <TextInput
            style={[styles.input, { backgroundColor: inputBg, borderColor: inputBorder, color: theme.text }]}
            placeholder="HH:MM AM/PM"
            placeholderTextColor={placeholderColor}
            value={tob}
            onChangeText={setTob}
          />

          <Text style={[styles.label, { color: theme.mutedText }]}>{t('placeOfBirth')}</Text>
          <TextInput
            style={[styles.input, { backgroundColor: inputBg, borderColor: inputBorder, color: theme.text }]}
            placeholder="City, State"
            placeholderTextColor={placeholderColor}
            value={place}
            onChangeText={setPlace}
          />

          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: submitBg }]}
            onPress={handleGenerate}
          >
            <Text style={styles.submitButtonText}>{t('generateKundli')}</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 40, paddingBottom: 40, alignItems: 'center' },
  emoji:         { fontSize: 56, marginBottom: 8 },
  heading:       { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 4 },
  subtitle:      { fontSize: 14, textAlign: 'center', marginBottom: 32 },
  formContainer: { width: '100%', padding: 20, borderRadius: 16, borderWidth: 1 },
  label:         { fontSize: 14, fontWeight: '600', marginBottom: 6, marginTop: 12 },
  input:         { borderWidth: 1, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16 },
  submitButton:  { paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 24 },
  submitButtonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
});
