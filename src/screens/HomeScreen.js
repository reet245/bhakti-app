import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';

// This is the Home Screen - the first screen users see when they open the app
export default function HomeScreen({ navigation }) {
  // "navigation" is given to us automatically by React Navigation
  // It lets us move between screens

  // --- Get today's date ---
  // We create a Date object and format it as "5 May 2026"
  const today = new Date();
  const day = today.getDate(); // e.g. 5
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const month = monthNames[today.getMonth()]; // e.g. "May"
  const year = today.getFullYear(); // e.g. 2026
  const formattedDate = `${day} ${month} ${year}`; // e.g. "5 May 2026"

  return (
    <View style={styles.container}>
      {/* Today's date at the top */}
      <Text style={styles.dateText}>📆 {formattedDate}</Text>

      {/* Main heading */}
      <Text style={styles.emoji}>🙏</Text>
      <Text style={styles.heading}>SpiritualApp</Text>
      <Text style={styles.subtitle}>Your spiritual journey starts here</Text>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Navigation buttons */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Calendar')}
        // Goes to the Calendar screen when tapped
      >
        <Text style={styles.buttonText}>📅 Calendar</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Kundli')}
        // Goes to the Kundli screen when tapped
      >
        <Text style={styles.buttonText}>🔮 Kundli</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('KundliMatch')}
        // Goes to the Kundli Matching screen when tapped
      >
        <Text style={styles.buttonText}>❤️ Match Kundli</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Puja')}
        // Goes to the Puja screen when tapped
      >
        <Text style={styles.buttonText}>🪔 Puja</Text>
      </TouchableOpacity>

      {/* Settings button (smaller, at the bottom) */}
      <TouchableOpacity
        style={styles.settingsButton}
        onPress={() => navigation.navigate('Settings')}
      >
        <Text style={styles.settingsButtonText}>⚙️ Settings</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f1528',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  dateText: {
    fontSize: 14,
    color: '#8d86b0',
    marginBottom: 28,
    textAlign: 'center',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  emoji: {
    fontSize: 60,
    marginBottom: 12,
  },
  heading: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#e0d7ff',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: 1.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#6c63a8',
    textAlign: 'center',
    marginBottom: 32,
    fontStyle: 'italic',
    letterSpacing: 0.5,
  },
  divider: {
    width: 80,
    height: 2,
    backgroundColor: '#e8b849',
    borderRadius: 2,
    marginBottom: 32,
  },
  button: {
    backgroundColor: '#1e2a4a',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 14,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2e3a5e',
    // Shadow for Android
    elevation: 4,
    // Shadow for iOS
    shadowColor: '#6c63ff',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  buttonText: {
    color: '#e0d7ff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  settingsButton: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2e3a5e',
    backgroundColor: '#0f1528',
  },
  settingsButtonText: {
    color: '#6c63a8',
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});
