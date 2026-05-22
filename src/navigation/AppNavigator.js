import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from '../screens/HomeScreen';
import SettingsScreen from '../screens/SettingsScreen';
import CalendarScreen from '../screens/CalendarScreen';
import KundliScreen from '../screens/KundliScreen';
import KundliResultScreen from '../screens/KundliResultScreen';
import KundliMatchScreen from '../screens/KundliMatchScreen';
import PujaScreen from '../screens/PujaScreen';
import MantrasScreen from '../screens/MantrasScreen';
import UpcomingFestivalsScreen from '../screens/UpcomingFestivalsScreen';
import DailyHoroscopeScreen from '../screens/DailyHoroscopeScreen';

// Create a Stack Navigator
// Think of it like a stack of cards - you put new screens "on top" and go back by removing the top card
const Stack = createNativeStackNavigator();

// This component defines which screens exist in our app and how they connect
export default function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      // initialRouteName tells the app which screen to show first
      screenOptions={{
        headerShown: false,
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

      <Stack.Screen
        name="UpcomingFestivals"
        component={UpcomingFestivalsScreen}
        options={{ title: 'Upcoming Festivals' }}
      />

      <Stack.Screen
        name="DailyHoroscope"
        component={DailyHoroscopeScreen}
        options={{ title: 'Daily Horoscope' }}
      />
    </Stack.Navigator>
  );
}
