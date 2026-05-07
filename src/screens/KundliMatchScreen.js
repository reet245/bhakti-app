import { useState, useContext } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { ThemeContext } from '../../App';

// ---------------------------------------------------------
// Compatibility calculation (logic unchanged)
// ---------------------------------------------------------
function calculateCompatibility(dob1, dob2) {
  const day1 = parseInt(dob1) || 1;
  const day2 = parseInt(dob2) || 1;
  const difference = Math.abs(day1 - day2);
  const sum = day1 + day2;
  let score = 100 - (difference * 3) + (sum % 11);
  if (score > 100) score = 100;
  if (score < 30)  score = 30;
  score = Math.round(score);
  let message = '', emoji = '';
  if (score >= 80)      { message = 'Excellent Match! Stars are strongly aligned in your favor.'; emoji = '💕'; }
  else if (score >= 60) { message = 'Good Compatibility. A harmonious bond with some adjustments needed.'; emoji = '💛'; }
  else if (score >= 45) { message = 'Medium Compatibility. Understanding and effort will strengthen this bond.'; emoji = '🤝'; }
  else                  { message = 'Low Compatibility. Patience and communication are key.'; emoji = '🌱'; }
  return { score, message, emoji };
}

export default function KundliMatchScreen() {
  const { theme, isDark } = useContext(ThemeContext);

  const [nameA, setNameA] = useState('');
  const [dobA,  setDobA]  = useState('');
  const [nameB, setNameB] = useState('');
  const [dobB,  setDobB]  = useState('');
  const [result, setResult] = useState(null);

  // Derived tokens
  const cardBg           = isDark ? '#16213e'  : '#ffffff';
  const cardBorder       = isDark ? '#2e3a5e'  : '#e2d9f3';
  const dividerColor     = isDark ? '#2e3a5e'  : '#e2d9f3';
  const inputBg          = isDark ? '#1a1a2e'  : '#f8f4ff';
  const inputBorder      = isDark ? '#2e3a5e'  : '#d0c8e8';
  const placeholderColor = isDark ? '#5a5282'  : '#b0a8cc';
  const matchBg          = isDark ? '#6c63ff'  : '#7c3aed';
  const resultCardBg     = isDark ? '#1e2a4a'  : '#f0ebff';
  const resultCardBorder = isDark ? '#6c63ff'  : '#7c3aed';
  const resultScoreColor = isDark ? '#6c63ff'  : '#7c3aed';
  const disclaimerColor  = isDark ? '#5a5282'  : '#9080c0';

  function handleMatch() {
    if (!nameA || !dobA || !nameB || !dobB) {
      Alert.alert('Missing Details', 'Please fill in all fields for both persons.');
      return;
    }
    setResult(calculateCompatibility(dobA, dobB));
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

        <Text style={styles.emoji}>❤️</Text>
        <Text style={[styles.heading, { color: theme.text }]}>Kundli Matching</Text>
        <Text style={[styles.subtitle, { color: theme.mutedText }]}>Compare two birth charts</Text>

        {/* Person A */}
        <View style={[styles.personCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <Text style={[styles.personTitle, { color: theme.text }]}>👤 Person A</Text>
          <View style={[styles.cardDivider, { backgroundColor: dividerColor }]} />
          <Text style={[styles.label, { color: theme.mutedText }]}>Full Name</Text>
          <TextInput
            style={[styles.input, { backgroundColor: inputBg, borderColor: inputBorder, color: theme.text }]}
            placeholder="e.g. Arjun"
            placeholderTextColor={placeholderColor}
            value={nameA}
            onChangeText={setNameA}
          />
          <Text style={[styles.label, { color: theme.mutedText }]}>Date of Birth</Text>
          <TextInput
            style={[styles.input, { backgroundColor: inputBg, borderColor: inputBorder, color: theme.text }]}
            placeholder="DD/MM/YYYY"
            placeholderTextColor={placeholderColor}
            value={dobA}
            onChangeText={setDobA}
          />
        </View>

        {/* Person B */}
        <View style={[styles.personCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <Text style={[styles.personTitle, { color: theme.text }]}>👤 Person B</Text>
          <View style={[styles.cardDivider, { backgroundColor: dividerColor }]} />
          <Text style={[styles.label, { color: theme.mutedText }]}>Full Name</Text>
          <TextInput
            style={[styles.input, { backgroundColor: inputBg, borderColor: inputBorder, color: theme.text }]}
            placeholder="e.g. Priya"
            placeholderTextColor={placeholderColor}
            value={nameB}
            onChangeText={setNameB}
          />
          <Text style={[styles.label, { color: theme.mutedText }]}>Date of Birth</Text>
          <TextInput
            style={[styles.input, { backgroundColor: inputBg, borderColor: inputBorder, color: theme.text }]}
            placeholder="DD/MM/YYYY"
            placeholderTextColor={placeholderColor}
            value={dobB}
            onChangeText={setDobB}
          />
        </View>

        <TouchableOpacity style={[styles.matchButton, { backgroundColor: matchBg }]} onPress={handleMatch}>
          <Text style={styles.matchButtonText}>💫 Check Compatibility</Text>
        </TouchableOpacity>

        {result && (
          <View style={[styles.resultCard, { backgroundColor: resultCardBg, borderColor: resultCardBorder }]}>
            <Text style={styles.resultEmoji}>{result.emoji}</Text>
            <Text style={[styles.resultScore, { color: resultScoreColor }]}>{result.score}%</Text>
            <Text style={[styles.resultLabel, { color: theme.mutedText }]}>Compatibility Score</Text>
            <View style={[styles.cardDivider, { backgroundColor: dividerColor }]} />
            <Text style={[styles.resultNames, { color: theme.text }]}>{nameA} & {nameB}</Text>
            <Text style={[styles.resultMessage, { color: theme.mutedText }]}>{result.message}</Text>
            <Text style={[styles.disclaimer, { color: disclaimerColor }]}>
              ⚠️ Simulated result for demonstration purposes.
            </Text>
          </View>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1 },
  scrollContent:  { padding: 24, alignItems: 'center', paddingBottom: 40 },
  emoji:          { fontSize: 56, marginBottom: 8 },
  heading:        { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 4 },
  subtitle:       { fontSize: 14, textAlign: 'center', marginBottom: 24 },
  personCard:     { width: '100%', padding: 20, borderRadius: 16, borderWidth: 1, marginBottom: 16 },
  personTitle:    { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  cardDivider:    { height: 1, marginBottom: 12 },
  label:          { fontSize: 14, fontWeight: '600', marginBottom: 6, marginTop: 8 },
  input:          { borderWidth: 1, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16 },
  matchButton:    { paddingVertical: 14, borderRadius: 12, alignItems: 'center', width: '100%', marginTop: 8, marginBottom: 20, elevation: 3 },
  matchButtonText:{ color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  resultCard:     { width: '100%', padding: 24, borderRadius: 16, borderWidth: 1, alignItems: 'center' },
  resultEmoji:    { fontSize: 48, marginBottom: 8 },
  resultScore:    { fontSize: 48, fontWeight: 'bold' },
  resultLabel:    { fontSize: 14, marginBottom: 12 },
  resultNames:    { fontSize: 18, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  resultMessage:  { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 16 },
  disclaimer:     { fontSize: 11, textAlign: 'center', fontStyle: 'italic' },
});
