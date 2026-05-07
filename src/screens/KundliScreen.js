import { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';

// Need to add navigation prop so we can switch screens
export default function KundliScreen({ navigation }) {
  // ---------------------------------------------------------
  // STEP 2: Create state
  // ---------------------------------------------------------
  // State variables hold what the user types.
  // Initially, they are empty strings ('').
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [tob, setTob] = useState('');
  const [place, setPlace] = useState('');

  // ---------------------------------------------------------
  // STEP 4: Handle submit
  // ---------------------------------------------------------
  function handleGenerate() {
    // Basic validation: Check if any field was left blank
    if (!name || !dob || !tob || !place) {
      Alert.alert('Missing Details', 'Please fill in all fields to generate your Kundli.');
      return;
    }

    // STEP 4: Navigate to result screen and pass the details
    navigation.navigate('KundliResult', {
      name: name,
      dob: dob,
      tob: tob,
      place: place
    });
  }

  return (
    // KeyboardAvoidingView prevents the on-screen keyboard from covering the inputs
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.emoji}>🔮</Text>
        <Text style={styles.heading}>Generate Kundli</Text>
        <Text style={styles.subtitle}>Enter your birth details</Text>

        {/* ---------------------------------------------------------
            STEP 1: Create form fields
            --------------------------------------------------------- */}
        <View style={styles.formContainer}>
          
          {/* Name Input */}
          <Text style={styles.label}>Full Name</Text>
          <TextInput 
            style={styles.input}
            placeholder="e.g. Arjun Sharma"
            placeholderTextColor="#5a5282"
            value={name}
            // HOW THIS WORKS: Whenever you type a letter, onChangeText automatically 
            // calls setName() with the new text. This updates the state instantly.
            onChangeText={setName} 
          />

          {/* Date of Birth Input */}
          <Text style={styles.label}>Date of Birth</Text>
          <TextInput 
            style={styles.input}
            placeholder="DD/MM/YYYY"
            placeholderTextColor="#5a5282"
            value={dob}
            onChangeText={setDob}
          />

          {/* Time of Birth Input */}
          <Text style={styles.label}>Time of Birth</Text>
          <TextInput 
            style={styles.input}
            placeholder="HH:MM AM/PM"
            placeholderTextColor="#5a5282"
            value={tob}
            onChangeText={setTob}
          />

          {/* Place of Birth Input */}
          <Text style={styles.label}>Place of Birth</Text>
          <TextInput 
            style={styles.input}
            placeholder="City, State"
            placeholderTextColor="#5a5282"
            value={place}
            onChangeText={setPlace}
          />

          {/* ---------------------------------------------------------
              STEP 3: Add submit button
              --------------------------------------------------------- */}
          <TouchableOpacity style={styles.submitButton} onPress={handleGenerate}>
            <Text style={styles.submitButtonText}>Generate Kundli</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ---------------------------------------------------------
// STEP 5: Styling
// ---------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
    alignItems: 'center',
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
    marginBottom: 32,
  },
  formContainer: {
    width: '100%',
    backgroundColor: '#16213e',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2e3a5e',
  },
  label: {
    color: '#a89ec9',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 12,
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
  submitButton: {
    backgroundColor: '#6c63ff',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
