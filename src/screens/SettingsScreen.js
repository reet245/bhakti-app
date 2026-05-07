import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';

// This is the Settings Screen - users come here when they tap "Go to Settings"
export default function SettingsScreen({ navigation }) {
  // "navigation" is given to us automatically by React Navigation
  // We use navigation.goBack() to go back to the previous screen

  return (
    <View style={styles.container}>
      {/* Main heading */}
      <Text style={styles.emoji}>⚙️</Text>
      <Text style={styles.heading}>Settings Screen</Text>
      <Text style={styles.subtitle}>Configure your preferences</Text>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Button to go back to Home */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.goBack()}
        // When pressed, this goes back to the previous screen (Home)
      >
        <Text style={styles.buttonText}>← Go Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  emoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  heading: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#e0d7ff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#a89ec9',
    textAlign: 'center',
    marginBottom: 30,
  },
  divider: {
    width: 120,
    height: 2,
    backgroundColor: '#6c63ff',
    borderRadius: 1,
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#4a4370',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#4a4370',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  buttonText: {
    color: '#e0d7ff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
