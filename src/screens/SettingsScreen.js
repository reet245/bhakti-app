import { useContext } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';

// Pull in the global theme context created in App.js
import { ThemeContext } from '../../App';

// This is the Settings Screen - users come here when they tap "Go to Settings"
export default function SettingsScreen({ navigation }) {
  // "navigation" is given to us automatically by React Navigation
  // We use navigation.goBack() to go back to the previous screen

  // -------------------------------------------------------
  // THEME CONTEXT
  // -------------------------------------------------------
  // theme      → the active theme object (darkTheme or lightTheme)
  // isDark     → boolean, true = dark mode
  // toggleTheme → flips isDark in App.js, instantly propagates
  //               to every ThemeContext consumer in the tree
  // -------------------------------------------------------
  const { theme, isDark, toggleTheme } = useContext(ThemeContext);

  // -------------------------------------------------------
  // DERIVED COLOUR TOKENS
  // -------------------------------------------------------
  // Values that aren't in the five base tokens but differ
  // between dark and light mode for this screen specifically.
  // -------------------------------------------------------

  // Card / section surface inside the screen
  const cardBg      = isDark ? '#16213e' : '#ffffff';
  const cardBorder  = isDark ? '#2e3a5e' : '#e2d9f3';

  // "Go Back" button
  const btnBg       = isDark ? '#4a4370' : '#7c3aed';
  const btnShadow   = isDark ? '#4a4370' : '#7c3aed';

  // Inactive toggle pill
  const pillBg      = isDark ? '#1a1a2e' : '#f0ebff';
  const pillBorder  = isDark ? '#4a4370' : '#c4b5e8';
  const pillText    = isDark ? '#6c63a8' : '#7c6caf';

  // Active toggle pill (same purple glow in both modes)
  const pillActiveBg     = isDark ? '#6c63ff' : '#7c3aed';
  const pillActiveBorder = isDark ? '#6c63ff' : '#7c3aed';

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>

      {/* Main heading */}
      <Text style={styles.emoji}>⚙️</Text>
      <Text style={[styles.heading, { color: theme.text }]}>Settings</Text>
      <Text style={[styles.subtitle, { color: theme.mutedText }]}>
        Configure your preferences
      </Text>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: theme.accent }]} />

      {/* -------------------------------------------------------
          THEME SECTION
          -------------------------------------------------------
          The card surface, labels, and toggle pills all read from
          the live theme object so the whole screen repaints the
          moment toggleTheme() is called — no navigation required.
          ------------------------------------------------------- */}
      <View style={[styles.themeSection, {
        backgroundColor: cardBg,
        borderColor: cardBorder,
      }]}>

        {/* Section label */}
        <Text style={[styles.sectionLabel, { color: theme.mutedText }]}>
          🎨  Theme
        </Text>

        {/* Active theme badge */}
        <Text style={[styles.activeThemeText, { color: theme.text }]}>
          Currently active: {isDark ? '🌙 Dark Mode' : '☀️ Light Mode'}
        </Text>

        {/* Toggle row — two pill buttons, active one highlighted */}
        <View style={styles.toggleRow}>

          {/* Dark pill */}
          <TouchableOpacity
            style={[
              styles.toggleButton,
              {
                backgroundColor: isDark ? pillActiveBg   : pillBg,
                borderColor:     isDark ? pillActiveBorder : pillBorder,
              },
              isDark && styles.toggleButtonActiveShadow,
            ]}
            onPress={() => { if (!isDark) toggleTheme(); }}
            accessibilityLabel="Switch to Dark Mode"
          >
            <Text style={[
              styles.toggleButtonText,
              { color: isDark ? '#ffffff' : pillText },
            ]}>
              🌙  Dark
            </Text>
          </TouchableOpacity>

          {/* Light pill */}
          <TouchableOpacity
            style={[
              styles.toggleButton,
              {
                backgroundColor: !isDark ? pillActiveBg    : pillBg,
                borderColor:     !isDark ? pillActiveBorder : pillBorder,
              },
              !isDark && styles.toggleButtonActiveShadow,
            ]}
            onPress={() => { if (isDark) toggleTheme(); }}
            accessibilityLabel="Switch to Light Mode"
          >
            <Text style={[
              styles.toggleButtonText,
              { color: !isDark ? '#ffffff' : pillText },
            ]}>
              ☀️  Light
            </Text>
          </TouchableOpacity>

        </View>
      </View>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: theme.accent }]} />

      {/* Button to go back to Home */}
      <TouchableOpacity
        style={[styles.button, {
          backgroundColor: btnBg,
          shadowColor: btnShadow,
        }]}
        onPress={() => navigation.goBack()}
        // When pressed, this goes back to the previous screen (Home)
      >
        <Text style={styles.buttonText}>← Go Back</Text>
      </TouchableOpacity>

    </View>
  );
}

// -------------------------------------------------------
// STATIC STYLES
// -------------------------------------------------------
// Only layout-invariant properties live here: padding, font
// sizes, border radii, spacing. Every colour is applied
// inline above so it recomputes on every theme-driven render.
// -------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor → theme.background (inline)
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
    // color → theme.text (inline)
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    // color → theme.mutedText (inline)
    textAlign: 'center',
    marginBottom: 30,
  },
  divider: {
    width: 120,
    height: 2,
    // backgroundColor → theme.accent (inline)
    borderRadius: 1,
    marginBottom: 30,
  },
  button: {
    // backgroundColor, shadowColor → inline
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    elevation: 3,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },

  // --- Theme section card ---
  themeSection: {
    width: '100%',
    // backgroundColor, borderColor → inline
    borderRadius: 16,
    padding: 20,
    marginBottom: 28,
    borderWidth: 1,
    alignItems: 'center',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    // color → theme.mutedText (inline)
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  activeThemeText: {
    fontSize: 14,
    // color → theme.text (inline)
    fontWeight: '500',
    marginBottom: 16,
  },

  // --- Pill toggle ---
  toggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  toggleButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 24,
    borderWidth: 1.5,
    // backgroundColor, borderColor → inline
  },
  // Shadow applied only to the active pill (static non-colour props)
  toggleButtonActiveShadow: {
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    // color → inline
  },
});
