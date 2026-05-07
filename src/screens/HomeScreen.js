import { useContext } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';

// Pull in the global theme context created in App.js
import { ThemeContext } from '../../App';

// This is the Home Screen - the first screen users see when they open the app
export default function HomeScreen({ navigation }) {
  // "navigation" is given to us automatically by React Navigation
  // It lets us move between screens

  // -------------------------------------------------------
  // THEME CONTEXT
  // -------------------------------------------------------
  // "theme" is either darkTheme or lightTheme from App.js.
  // Any time the user toggles in Settings, App re-renders,
  // ThemeContext pushes the new object, and this component
  // re-renders automatically — no extra wiring needed.
  // -------------------------------------------------------
  const { theme, isDark } = useContext(ThemeContext);

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

  // -------------------------------------------------------
  // DYNAMIC COLOUR TOKENS
  // -------------------------------------------------------
  // These values swap instantly when isDark changes.
  // Everything else (padding, font sizes, radii) stays in
  // the static StyleSheet below — untouched.
  // -------------------------------------------------------

  // Button surface — slightly lighter than background in both modes
  const buttonBg         = isDark ? '#1e2a4a' : '#ffffff';
  const buttonBorder     = isDark ? '#2e3a5e' : '#e2d9f3';
  const buttonShadow     = isDark ? '#6c63ff' : '#a89ec9';

  // Settings pill surface
  const settingsBg       = isDark ? '#0f1528' : '#f0ebff';
  const settingsBorder   = isDark ? '#2e3a5e' : '#d8cff0';

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>

      {/* Today's date at the top */}
      <Text style={[styles.dateText, { color: theme.mutedText }]}>
        📆 {formattedDate}
      </Text>

      {/* Main heading */}
      <Text style={styles.emoji}>🙏</Text>
      <Text style={[styles.heading, { color: theme.text }]}>SpiritualApp</Text>
      <Text style={[styles.subtitle, { color: theme.mutedText }]}>
        Your spiritual journey starts here
      </Text>

      {/* Divider — accent colour in both modes */}
      <View style={[styles.divider, { backgroundColor: theme.accent }]} />

      {/* Navigation buttons */}
      <TouchableOpacity
        style={[styles.button, {
          backgroundColor: buttonBg,
          borderColor: buttonBorder,
          shadowColor: buttonShadow,
        }]}
        onPress={() => navigation.navigate('Calendar')}
        // Goes to the Calendar screen when tapped
      >
        <Text style={[styles.buttonText, { color: theme.text }]}>📅 Calendar</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, {
          backgroundColor: buttonBg,
          borderColor: buttonBorder,
          shadowColor: buttonShadow,
        }]}
        onPress={() => navigation.navigate('Kundli')}
        // Goes to the Kundli screen when tapped
      >
        <Text style={[styles.buttonText, { color: theme.text }]}>🔮 Kundli</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, {
          backgroundColor: buttonBg,
          borderColor: buttonBorder,
          shadowColor: buttonShadow,
        }]}
        onPress={() => navigation.navigate('KundliMatch')}
        // Goes to the Kundli Matching screen when tapped
      >
        <Text style={[styles.buttonText, { color: theme.text }]}>❤️ Match Kundli</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, {
          backgroundColor: buttonBg,
          borderColor: buttonBorder,
          shadowColor: buttonShadow,
        }]}
        onPress={() => navigation.navigate('Puja')}
        // Goes to the Puja screen when tapped
      >
        <Text style={[styles.buttonText, { color: theme.text }]}>🪔 Puja</Text>
      </TouchableOpacity>

      {/* Settings button (smaller, at the bottom) */}
      <TouchableOpacity
        style={[styles.settingsButton, {
          backgroundColor: settingsBg,
          borderColor: settingsBorder,
        }]}
        onPress={() => navigation.navigate('Settings')}
      >
        <Text style={[styles.settingsButtonText, { color: theme.mutedText }]}>
          ⚙️ Settings
        </Text>
      </TouchableOpacity>

    </View>
  );
}

// -------------------------------------------------------
// STATIC STYLES
// -------------------------------------------------------
// Only non-colour properties live here — padding, font sizes,
// border radii, layout. Colours are applied inline above so
// they react to theme changes on every render.
// -------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor → theme.background (inline)
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  dateText: {
    fontSize: 14,
    // color → theme.mutedText (inline)
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
    // color → theme.text (inline)
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: 1.5,
  },
  subtitle: {
    fontSize: 14,
    // color → theme.mutedText (inline)
    textAlign: 'center',
    marginBottom: 32,
    fontStyle: 'italic',
    letterSpacing: 0.5,
  },
  divider: {
    width: 80,
    height: 2,
    // backgroundColor → theme.accent (inline)
    borderRadius: 2,
    marginBottom: 32,
  },
  button: {
    // backgroundColor, borderColor, shadowColor → inline
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 14,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    // Shadow for Android
    elevation: 4,
    // Shadow for iOS
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  buttonText: {
    // color → theme.text (inline)
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
    // backgroundColor, borderColor → inline
  },
  settingsButtonText: {
    // color → theme.mutedText (inline)
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});
