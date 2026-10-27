import { useContext } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeContext } from '../../App';
import BhaktiBackButton from '../components/BhaktiBackButton';
import { useLanguage } from '../context/LanguageContext';

const POLICY_URL = process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL || '';
const sections = {
  en: [
    ['Birth details and location', 'Creating a Kundli sends the entered name, gender, birth date, time and birthplace to the Bhakti backend. The backend sends birth time and location to VedAstro for calculations. Name and gender are used to label your result. Location search sends the place you search for to Open-Meteo.'],
    ['Device location and calendar', 'Device location is optional and is requested only after you choose to detect it. Panchang and Hindu festival calculations run on this device, without sending the selected date or coordinates to the backend or a calculation provider. Calendar city search uses a bundled offline list. You can enter coordinates and timezone manually. Kundli place search still uses the backend geocoder.'],
    ['Saved on this device', 'Language, theme, favorite mantra IDs, Jaap counts/targets/elapsed time, reminder settings, and your selected Panchang calculation location are stored on this device. The selected location can include precise coordinates. Kundli results and birth details are not saved by the app. Clearing this app’s device data removes local preferences and saved Jaap sessions.'],
    ['Horoscopes, audio and sharing', 'The backend retrieves horoscope content from the configured feed provider. Devotional audio is bundled with the app. The share buttons open the device share sheet; review the text and destination before sending birth details or other information.'],
    ['Server and provider retention', 'This source app has no user-account database. Hosting providers and calculation providers can process requests and network metadata under their own policies. Production retention, operator contact and the published privacy policy must be supplied by the app owner before release.'],
  ],
  hi: [
    ['जन्म विवरण और स्थान', 'कुंडली बनाते समय नाम, लिंग, जन्म तिथि, समय और जन्मस्थान भक्ति सर्वर को भेजे जाते हैं। गणना के लिए जन्म समय और स्थान VedAstro को भेजे जाते हैं। स्थान खोज में खोजा गया शहर Open-Meteo को भेजा जाता है।'],
    ['डिवाइस का स्थान और कैलेंडर', 'डिवाइस का स्थान वैकल्पिक है और चुनने पर ही लिया जाता है। पंचांग और हिंदू त्योहारों की गणना इसी डिवाइस पर होती है; चुनी तारीख और निर्देशांक गणना के लिए सर्वर को नहीं भेजे जाते। कैलेंडर में शहरों की ऑफलाइन सूची है। आप निर्देशांक और समय क्षेत्र स्वयं भी भर सकते हैं। कुंडली की स्थान खोज अब भी सर्वर का उपयोग करती है।'],
    ['इस डिवाइस पर सहेजी जानकारी', 'भाषा, थीम, पसंदीदा मंत्र, जाप की गिनती/लक्ष्य/समय, अनुस्मारक और चुना हुआ पंचांग स्थान इस डिवाइस पर सहेजे जाते हैं। स्थान में सटीक निर्देशांक हो सकते हैं। कुंडली परिणाम और जन्म विवरण ऐप द्वारा सहेजे नहीं जाते। ऐप का डिवाइस डेटा मिटाने पर स्थानीय जानकारी और सहेजे जाप सत्र हट जाते हैं।'],
    ['राशिफल, ऑडियो और साझा करना', 'सर्वर निर्धारित फ़ीड से राशिफल लेता है। भक्ति ऑडियो ऐप में शामिल है। साझा करने से पहले विवरण और प्राप्तकर्ता जाँचें।'],
    ['सर्वर और प्रदाता', 'इस ऐप में उपयोगकर्ता खातों का डेटाबेस नहीं है। होस्टिंग और गणना प्रदाता अपनी नीतियों के अनुसार अनुरोध संसाधित कर सकते हैं। प्रकाशन से पहले ऐप मालिक को डेटा रखने की अवधि, संपर्क और गोपनीयता नीति उपलब्ध करानी होगी।'],
  ],
};

export default function PrivacyScreen({ navigation }) {
  const { theme } = useContext(ThemeContext);
  const { currentLanguage } = useLanguage();
  const hindi = currentLanguage === 'hi';
  const validPolicy = /^https:\/\//i.test(POLICY_URL);
  return <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
    <ScrollView contentContainerStyle={styles.content}>
      <BhaktiBackButton navigation={navigation} />
      <Text style={[styles.title, { color: theme.text }]}>{hindi ? 'गोपनीयता और डेटा' : 'Privacy & data'}</Text>
      {sections[hindi ? 'hi' : 'en'].map(([title, body]) => <View key={title} style={[styles.card, { backgroundColor: theme.card }]}>
        <Text style={[styles.heading, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.body, { color: theme.textSecondary }]}>{body}</Text>
      </View>)}
      {validPolicy && <Pressable accessibilityRole="link" onPress={() => Linking.openURL(POLICY_URL)}><Text style={{ color: theme.accent }}>{hindi ? 'प्रकाशित गोपनीयता नीति खोलें' : 'Open published privacy policy'}</Text></Pressable>}
    </ScrollView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({ content: { padding: 22, gap: 16 }, title: { fontSize: 26, fontWeight: '700' }, card: { padding: 18, borderRadius: 16, gap: 8 }, heading: { fontSize: 18, fontWeight: '700' }, body: { fontSize: 15, lineHeight: 23 } });
