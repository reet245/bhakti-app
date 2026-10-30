import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from '../screens/HomeScreen';
import SettingsScreen from '../screens/SettingsScreen';
import PrivacyScreen from '../screens/PrivacyScreen';
import CalendarScreen from '../screens/CalendarScreen';
import PanchangCalendarScreen from '../screens/PanchangCalendarScreen';
import TithiDetailScreen from '../screens/TithiDetailScreen';
import PanchangMuhurtasScreen from '../screens/PanchangMuhurtasScreen';
import PanchangFestivalsScreen from '../screens/PanchangFestivalsScreen';
import KundliScreen from '../screens/KundliScreen';
import KundliResultScreen from '../screens/KundliResultScreen';
import KundliMatchScreen from '../screens/KundliMatchScreen';
import PujaScreen from '../screens/PujaScreen';
import MantrasScreen from '../screens/MantrasScreen';
import MantraDetailScreen from '../screens/MantraDetailScreen';
import CustomMantraScreen from '../screens/CustomMantraScreen';
import MantraSourcesScreen from '../screens/MantraSourcesScreen';
import JaapCounterScreen from '../screens/JaapCounterScreen';
import UpcomingFestivalsScreen from '../screens/UpcomingFestivalsScreen';
import FestivalDetailScreen from '../screens/FestivalDetailScreen';
import DailyHoroscopeScreen from '../screens/DailyHoroscopeScreen';
import HoroscopeDetailScreen from '../screens/HoroscopeDetailScreen';

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
      <Stack.Screen name="Privacy" component={PrivacyScreen} options={{ title: 'Privacy & data' }} />
      <Stack.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{ title: '📅 Calendar' }}
      />

      <Stack.Screen
        name="PanchangCalendar"
        component={PanchangCalendarScreen}
        options={{ title: 'Panchang Calendar', headerShown: false }}
      />

      <Stack.Screen
        name="TithiDetail"
        component={TithiDetailScreen}
        options={{ title: 'Tithi Detail', headerShown: false }}
      />

      <Stack.Screen
        name="PanchangMuhurtas"
        component={PanchangMuhurtasScreen}
        options={{ title: 'Today Muhurtas', headerShown: false }}
      />

      <Stack.Screen
        name="PanchangFestivals"
        component={PanchangFestivalsScreen}
        options={{ title: 'Today Festivals', headerShown: false }}
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
        name="MantraDetail"
        component={MantraDetailScreen}
        options={{ title: 'Mantra Detail', headerShown: false }}
      />

      <Stack.Screen
        name="JaapCounter"
        component={JaapCounterScreen}
        options={{ title: 'Jaap Counter', headerShown: false }}
      />
      <Stack.Screen name="CustomMantra" component={CustomMantraScreen} options={{ title: 'My mantra' }} />
      <Stack.Screen name="MantraSources" component={MantraSourcesScreen} options={{ title: 'Sources and credits' }} />

      <Stack.Screen
        name="UpcomingFestivals"
        component={UpcomingFestivalsScreen}
        options={{ title: 'Upcoming Festivals' }}
      />

      <Stack.Screen
        name="FestivalDetail"
        component={FestivalDetailScreen}
        options={{ title: 'Festival Story', headerShown: false }}
      />

      <Stack.Screen
        name="DailyHoroscope"
        component={DailyHoroscopeScreen}
        options={{ title: 'Daily Horoscope' }}
      />

      <Stack.Screen
        name="HoroscopeDetail"
        component={HoroscopeDetailScreen}
        options={{ title: 'Horoscope Detail', headerShown: false }}
      />
    </Stack.Navigator>
  );
}
