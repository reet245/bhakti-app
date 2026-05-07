import { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';

// ---------------------------------------------------------
// STEP 3: Matching logic
// ---------------------------------------------------------
// This generates a SIMULATED compatibility score between two people.
// In a real astrology app, this would use Ashtakoota (8-factor) matching.
//
// HOW IT WORKS:
//   1. We extract the day number from each DOB string.
//   2. We calculate the absolute difference between the two days.
//   3. We use math to convert that difference into a score out of 100.
//   4. A small difference = high compatibility, big difference = lower.
//   5. We also mix in sum-based logic so same-day births aren't always 100%.
function calculateCompatibility(dob1, dob2) {
  // Extract day numbers from DOB strings
  // parseInt("15/06/1999") → 15 (stops at first non-number character)
  const day1 = parseInt(dob1) || 1;
  const day2 = parseInt(dob2) || 1;

  // Calculate difference between the two days (always positive)
  // Math.abs(-10) → 10
  const difference = Math.abs(day1 - day2);

  // Sum of both days — adds variety to scoring
  const sum = day1 + day2;

  // Base score: starts at 100, loses points for each day of difference
  // Multiplied by 3 so a difference of 10 days loses 30 points
  let score = 100 - (difference * 3);

  // Add bonus based on sum (0 to 10 points)
  // This ensures two people born on day 5 and day 5 get a different
  // score than two people born on day 15 and day 15
  score += (sum % 11);

  // Clamp score between 30 and 100 (never below 30, never above 100)
  // Math.max picks the bigger number, Math.min picks the smaller
  if (score > 100) score = 100;
  if (score < 30) score = 30;

  // Round to whole number
  score = Math.round(score);

  // Generate message based on score range
  let message = '';
  let emoji = '';
  if (score >= 80) {
    message = 'Excellent Match! Stars are strongly aligned in your favor.';
    emoji = '💕';
  } else if (score >= 60) {
    message = 'Good Compatibility. A harmonious bond with some adjustments needed.';
    emoji = '💛';
  } else if (score >= 45) {
    message = 'Medium Compatibility. Understanding and effort will strengthen this bond.';
    emoji = '🤝';
  } else {
    message = 'Low Compatibility. Patience and communication are key.';
    emoji = '🌱';
  }

  return { score, message, emoji };
}

// ============================================================
// KundliMatchScreen
// ============================================================
export default function KundliMatchScreen() {

  // ---------------------------------------------------------
  // STEP 2: State for both people
  // ---------------------------------------------------------
  const [nameA, setNameA] = useState('');
  const [dobA, setDobA] = useState('');
  const [nameB, setNameB] = useState('');
  const [dobB, setDobB] = useState('');

  // State for the result (null = not calculated yet)
  const [result, setResult] = useState(null);

  // ---------------------------------------------------------
  // Handle match button press
  // ---------------------------------------------------------
  function handleMatch() {
    // Basic validation
    if (!nameA || !dobA || !nameB || !dobB) {
      Alert.alert('Missing Details', 'Please fill in all fields for both persons.');
      return;
    }

    // Calculate and store result
    const compatibility = calculateCompatibility(dobA, dobB);
    setResult(compatibility);
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

        <Text style={styles.emoji}>❤️</Text>
        <Text style={styles.heading}>Kundli Matching</Text>
        <Text style={styles.subtitle}>Compare two birth charts</Text>

        {/* ---------------------------------------------------------
            Person A form
            --------------------------------------------------------- */}
        <View style={styles.personCard}>
          <Text style={styles.personTitle}>👤 Person A</Text>
          <View style={styles.cardDivider} />

          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Arjun"
            placeholderTextColor="#5a5282"
            value={nameA}
            onChangeText={setNameA}
          />

          <Text style={styles.label}>Date of Birth</Text>
          <TextInput
            style={styles.input}
            placeholder="DD/MM/YYYY"
            placeholderTextColor="#5a5282"
            value={dobA}
            onChangeText={setDobA}
          />
        </View>

        {/* ---------------------------------------------------------
            Person B form
            --------------------------------------------------------- */}
        <View style={styles.personCard}>
          <Text style={styles.personTitle}>👤 Person B</Text>
          <View style={styles.cardDivider} />

          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Priya"
            placeholderTextColor="#5a5282"
            value={nameB}
            onChangeText={setNameB}
          />

          <Text style={styles.label}>Date of Birth</Text>
          <TextInput
            style={styles.input}
            placeholder="DD/MM/YYYY"
            placeholderTextColor="#5a5282"
            value={dobB}
            onChangeText={setDobB}
          />
        </View>

        {/* ---------------------------------------------------------
            Match button
            --------------------------------------------------------- */}
        <TouchableOpacity style={styles.matchButton} onPress={handleMatch}>
          <Text style={styles.matchButtonText}>💫 Check Compatibility</Text>
        </TouchableOpacity>

        {/* ---------------------------------------------------------
            STEP 4: Show result (only after calculation)
            --------------------------------------------------------- */}
        {result && (
          <View style={styles.resultCard}>
            <Text style={styles.resultEmoji}>{result.emoji}</Text>
            <Text style={styles.resultScore}>{result.score}%</Text>
            <Text style={styles.resultLabel}>Compatibility Score</Text>
            <View style={styles.cardDivider} />

            {/* Names row */}
            <Text style={styles.resultNames}>
              {nameA} & {nameB}
            </Text>

            {/* Message */}
            <Text style={styles.resultMessage}>{result.message}</Text>

            {/* Disclaimer */}
            <Text style={styles.disclaimer}>
              ⚠️ Simulated result for demonstration purposes.
            </Text>
          </View>
        )}

      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------
// STEP 7: Styling
// ---------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  scrollContent: {
    padding: 24,
    alignItems: 'center',
    paddingBottom: 40,
  },
  emoji: {
    fontSize: 56,
    marginBottom: 8,
  },
  heading: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#e0d7ff',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#a89ec9',
    textAlign: 'center',
    marginBottom: 24,
  },

  // --- Person card (used for both A and B) ---
  personCard: {
    width: '100%',
    backgroundColor: '#16213e',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2e3a5e',
    marginBottom: 16,
  },
  personTitle: {
    color: '#e0d7ff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#2e3a5e',
    marginBottom: 12,
  },
  label: {
    color: '#a89ec9',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#2e3a5e',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#e0d7ff',
    fontSize: 16,
  },

  // --- Match button ---
  matchButton: {
    backgroundColor: '#6c63ff',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
    marginTop: 8,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#6c63ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  matchButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // --- Result card ---
  resultCard: {
    width: '100%',
    backgroundColor: '#1e2a4a',
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#6c63ff',
    alignItems: 'center',
  },
  resultEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  resultScore: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#6c63ff',
  },
  resultLabel: {
    fontSize: 14,
    color: '#a89ec9',
    marginBottom: 12,
  },
  resultNames: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e0d7ff',
    marginBottom: 10,
    textAlign: 'center',
  },
  resultMessage: {
    fontSize: 14,
    color: '#c8c0e0',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  disclaimer: {
    fontSize: 11,
    color: '#5a5282',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
