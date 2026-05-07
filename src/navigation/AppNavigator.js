import { useContext } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ThemeContext } from '../../App';

import HomeScreen from '../screens/HomeScreen';
import SettingsScreen from '../screens/SettingsScreen';
import CalendarScreen from '../screens/CalendarScreen';
import KundliScreen from '../screens/KundliScreen';
import KundliResultScreen from '../screens/KundliResultScreen';
import KundliMatchScreen from '../screens/KundliMatchScreen';
import PujaScreen from '../screens/PujaScreen';
import MantrasScreen from '../screens/MantrasScreen';

// Create a Stack Navigator
// Think of it like a stack of cards - you put new screens "on top" and go back by removing the top card
const Stack = createNativeStackNavigator();

// This component defines which screens exist in our app and how they connect
export default function AppNavigator() {
  // -------------------------------------------------------
  // THEME-AWARE HEADER
  // -------------------------------------------------------
  // Reading from ThemeContext so the navigation header
  // instantly updates whenever the user toggles light/dark
  // mode from SettingsScreen — no restart required.
  // -------------------------------------------------------
  const { theme } = useContext(ThemeContext);

  return (
    <Stack.Navigator
      initialRouteName="Home"
      // initialRouteName tells the app which screen to show first
      screenOptions={{
        // These options apply to ALL screens
        headerStyle: {
          backgroundColor: theme.headerBg,
          // Darker header for more depth and contrast
        },
        headerTintColor: theme.headerText,
        // Header text and back arrow color (light purple)
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 17,
          letterSpacing: 0.5,
        },
        headerShadowVisible: false,  // remove default border, we add our own
      }}
    >
      {/* Screen 1: Home */}
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: '🏠 Home' }}
        // "name" is used in navigation.navigate('Home')
        // "title" is what shows in the header bar
      />

      {/* Screen 2: Settings */}
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: '⚙️ Settings' }}
      />

      {/* Screen 3: Calendar */}
      <Stack.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{ title: '📅 Calendar' }}
      />

      {/* Screen 4: Kundli Form */}
      <Stack.Screen
        name="Kundli"
        component={KundliScreen}
        options={{ title: '🔮 Kundli' }}
      />

      {/* Screen 4b: Kundli Result */}
      <Stack.Screen
        name="KundliResult"
        component={KundliResultScreen}
        options={{ title: '📜 Result' }}
      />

      {/* Screen 4c: Kundli Matching */}
      <Stack.Screen
        name="KundliMatch"
        component={KundliMatchScreen}
        options={{ title: '❤️ Match Kundli' }}
      />

      {/* Screen 5: Puja */}
      <Stack.Screen
        name="Puja"
        component={PujaScreen}
        options={{ title: '🪔 Puja' }}
      />

      {/* Screen 6: Mantras */}
      <Stack.Screen
        name="Mantras"
        component={MantrasScreen}
        options={{ title: '🕉️ Mantras' }}
      />
    </Stack.Navigator>
  );
}
