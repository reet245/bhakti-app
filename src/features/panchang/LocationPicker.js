import useDevotionalStyles from '../../hooks/useDevotionalStyles';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { requestJson } from '../../services/http';
import { validCoordinates, validTimezone } from './date';
import { searchOfflineCities } from './cities';
import { useLanguage } from '../../context/LanguageContext';

const HINDI = {
  'City or place': 'शहर या स्थान',
  'Offline Indian city search. For any other place, enter its coordinates and IANA timezone below.': 'भारत के शहरों में ऑफलाइन खोजें। दूसरे स्थान के लिए नीचे उसके निर्देशांक और IANA समय क्षेत्र लिखें।',
  'Place search sends your query to Open-Meteo through the Bhakti backend.': 'स्थान की खोज भक्ति सर्वर के माध्यम से Open-Meteo को भेजी जाती है।',
  'Search places': 'स्थान खोजें',
  'Selected': 'चयनित',
  'Close manual location': 'मैनुअल स्थान बंद करें',
  'Enter coordinates and timezone': 'निर्देशांक और समय क्षेत्र लिखें',
  'Latitude': 'अक्षांश',
  'Longitude': 'देशांतर',
  'Latitude, e.g. 22.566': 'अक्षांश, जैसे 22.566',
  'Longitude, e.g. 88.37': 'देशांतर, जैसे 88.37',
  'IANA timezone': 'IANA समय क्षेत्र',
  'Timezone, e.g. Asia/Kolkata': 'समय क्षेत्र, जैसे Asia/Kolkata',
  'Use the timezone of this place. Historical daylight saving is calculated for the selected date.': 'इसी स्थान का समय क्षेत्र चुनें। चुनी तारीख के अनुसार ऐतिहासिक डेलाइट सेविंग का समायोजन होता है।',
  'Use this location': 'यह स्थान चुनें',
  'Enter at least two characters.': 'कम से कम दो अक्षर लिखें।',
  'No matching place found. Refine the city name or enter coordinates and timezone.': 'मेल खाता स्थान नहीं मिला। शहर का नाम बदलकर खोजें या निर्देशांक और समय क्षेत्र लिखें।',
  'Place search is unavailable. Enter coordinates and timezone below.': 'स्थान खोज अभी उपलब्ध नहीं है। नीचे निर्देशांक और समय क्षेत्र लिखें।',
  'Enter a place, latitude (-90 to 90), longitude (-180 to 180), and an IANA timezone such as Asia/Kolkata.': 'स्थान, अक्षांश (-90 से 90), देशांतर (-180 से 180) और Asia/Kolkata जैसा IANA समय क्षेत्र लिखें।',
  'Location selected.': 'स्थान चुन लिया गया है।',
  'City coordinates: ': 'शहर के निर्देशांक: ',
  'Place search: Open-Meteo; geographic data: ': 'स्थान खोज: Open-Meteo; भौगोलिक जानकारी: ',
};

export async function searchLocations(query, signal) {
  const response = await requestJson(`/api/v1/locations/search?query=${encodeURIComponent(query.trim())}`, { signal });
  if (!Array.isArray(response?.data)) throw new Error('Place search is unavailable. Enter coordinates and timezone below.');
  return response.data.filter((item) => validCoordinates(item.latitude, item.longitude) && validTimezone(item.timezone));
}

// Selection is explicit: typing a different place invalidates old coordinates.
export default function LocationPicker({ value, onChange, offlineOnly = false }) {
  const styles = useDevotionalStyles(baseStyles);
  const { currentLanguage } = useLanguage();
  const isHindi = currentLanguage === 'hi';
  const ui = (text) => isHindi ? HINDI[text] || text : text;
  const [query, setQuery] = useState(value.locationName || value.place || '');
  const [candidates, setCandidates] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [manual, setManual] = useState(false);
  const [latitude, setLatitude] = useState(String(value.latitude ?? ''));
  const [longitude, setLongitude] = useState(String(value.longitude ?? ''));
  const [timezone, setTimezone] = useState(value.timezone || '');
  const pending = useRef(null);
  const generation = useRef(0);
  useEffect(() => () => { generation.current += 1; pending.current?.abort(); }, []);
  useEffect(() => {
    generation.current += 1; pending.current?.abort(); setCandidates([]); setLoading(false);
    setQuery(value.locationName || value.place || '');
    setLatitude(String(value.latitude ?? ''));
    setLongitude(String(value.longitude ?? ''));
    setTimezone(value.timezone || '');
  }, [value.locationName, value.place, value.latitude, value.longitude, value.timezone]);
  const search = async () => {
    pending.current?.abort();
    const id = ++generation.current;
    if (query.trim().length < 2) { setMessage('Enter at least two characters.'); return; }
    const controller = new AbortController();
    pending.current = controller;
    setLoading(true); setMessage(''); setCandidates([]);
    try {
      const items = offlineOnly ? searchOfflineCities(query) : await searchLocations(query, controller.signal);
      if (id !== generation.current) return;
      setCandidates(items);
      if (!items.length) setMessage('No matching place found. Refine the city name or enter coordinates and timezone.');
    } catch (error) {
      if (id === generation.current && !controller.signal.aborted) setMessage(error.message);
    } finally { if (id === generation.current) setLoading(false); }
  };
  const applyManual = () => {
    if (!query.trim() || !validCoordinates(latitude, longitude) || !validTimezone(timezone)) {
      setMessage('Enter a place, latitude (-90 to 90), longitude (-180 to 180), and an IANA timezone such as Asia/Kolkata.');
      return;
    }
    onChange({ locationName: query.trim(), latitude: Number(latitude), longitude: Number(longitude), timezone: timezone.trim() });
    setMessage('Location selected.');
    setManual(false);
  };
  return (
    <View style={styles.wrap}>
      <TextInput accessibilityLabel={ui('City or place')} value={query} placeholder={ui('City or place')} style={styles.input}
        onChangeText={(text) => {
          generation.current += 1; pending.current?.abort(); setLoading(false); setCandidates([]); setMessage(''); setQuery(text);
          onChange({ locationName: text, latitude: null, longitude: null, timezone: null });
        }} onSubmitEditing={search} />
      <Text style={styles.hint}>{ui(offlineOnly ? 'Offline Indian city search. For any other place, enter its coordinates and IANA timezone below.' : 'Place search sends your query to Open-Meteo through the Bhakti backend.')}</Text>
      <Pressable accessibilityRole="button" onPress={search} style={styles.button} disabled={loading}>
        <Text style={styles.buttonText}>{ui('Search places')}</Text>{loading && <ActivityIndicator color="#7B4D0D" />}
      </Pressable>
      {candidates.map((item, index) => (
        <Pressable accessibilityRole="button" key={`${item.latitude}-${item.longitude}-${index}`} style={styles.candidate}
          onPress={() => { onChange({ ...item, locationName: item.resolvedPlaceName }); setCandidates([]); setMessage('Location selected.'); }}>
          <Text style={styles.text}>{isHindi && item.nameHi ? `${item.nameHi}, भारत` : item.resolvedPlaceName}</Text><Text style={styles.hint}>{item.timezone} · {item.latitude}, {item.longitude}</Text>
        </Pressable>
      ))}
      {validCoordinates(value.latitude, value.longitude) && value.timezone ? <Text style={styles.hint}>{ui('Selected')}: {value.latitude}, {value.longitude} · {value.timezone}</Text> : null}
      <Pressable accessibilityRole="button" onPress={() => setManual((current) => !current)} style={styles.button}>
        <Text style={styles.buttonText}>{ui(manual ? 'Close manual location' : 'Enter coordinates and timezone')}</Text>
      </Pressable>
      {manual && <View>
        <TextInput accessibilityLabel={ui('Latitude')} placeholder={ui('Latitude, e.g. 22.566')} value={latitude} onChangeText={setLatitude} style={styles.input} />
        <TextInput accessibilityLabel={ui('Longitude')} placeholder={ui('Longitude, e.g. 88.37')} value={longitude} onChangeText={setLongitude} style={styles.input} />
        <TextInput accessibilityLabel={ui('IANA timezone')} autoCapitalize="none" autoCorrect={false} placeholder={ui('Timezone, e.g. Asia/Kolkata')} value={timezone} onChangeText={setTimezone} style={styles.input} />
        <Text style={styles.hint}>{ui('Use the timezone of this place. Historical daylight saving is calculated for the selected date.')}</Text>
        <Pressable accessibilityRole="button" style={styles.button} onPress={applyManual}><Text style={styles.buttonText}>{ui('Use this location')}</Text></Pressable>
      </View>}
      {message ? <Text accessibilityLiveRegion="polite" style={styles.hint}>{isHindi ? HINDI[message] || HINDI['Place search is unavailable. Enter coordinates and timezone below.'] : message}</Text> : null}
      <Text style={styles.hint}>{ui(offlineOnly ? 'City coordinates: ' : 'Place search: Open-Meteo; geographic data: ')}<Text accessibilityRole="link" onPress={() => Linking.openURL('https://www.geonames.org/')} style={styles.buttonText}>GeoNames (CC BY 4.0)</Text>.</Text>
    </View>
  );
}

const baseStyles = StyleSheet.create({
  wrap: { width: '100%', marginVertical: 8, gap: 6 },
  input: { borderColor: '#D0A23A', borderWidth: 1, borderRadius: 12, minHeight: 44, padding: 10, color: '#3F2713', backgroundColor: '#FFF8E8' },
  button: { minHeight: 40, padding: 10, borderRadius: 12, backgroundColor: '#F3DDA9', flexDirection: 'row', gap: 10, alignItems: 'center' },
  buttonText: { color: '#7B4D0D', fontWeight: '700' }, text: { color: '#3F2713', fontWeight: '600' },
  hint: { color: '#6B461C', fontSize: 12, lineHeight: 18 }, candidate: { padding: 10, borderRadius: 12, backgroundColor: '#FFF8E8' },
});
