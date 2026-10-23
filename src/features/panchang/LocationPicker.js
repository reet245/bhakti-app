import useDevotionalStyles from '../../hooks/useDevotionalStyles';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { requestJson } from '../../services/http';
import { validCoordinates, validTimezone } from './date';

export async function searchLocations(query, signal) {
  const response = await requestJson(`/api/v1/locations/search?query=${encodeURIComponent(query.trim())}`, { signal });
  if (!Array.isArray(response?.data)) throw new Error('Place search is unavailable. Enter coordinates and timezone below.');
  return response.data.filter((item) => validCoordinates(item.latitude, item.longitude) && validTimezone(item.timezone));
}

// Selection is explicit: typing a different place invalidates old coordinates.
export default function LocationPicker({ value, onChange }) {
  const styles = useDevotionalStyles(baseStyles);
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
      const items = await searchLocations(query, controller.signal);
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
      <TextInput accessibilityLabel="City or place" value={query} placeholder="City or place" style={styles.input}
        onChangeText={(text) => {
          generation.current += 1; pending.current?.abort(); setLoading(false); setCandidates([]); setMessage(''); setQuery(text);
          onChange({ locationName: text, latitude: null, longitude: null, timezone: null });
        }} onSubmitEditing={search} />
      <Text style={styles.hint}>Place search sends your query to Open-Meteo through the Bhakti backend.</Text>
      <Pressable accessibilityRole="button" onPress={search} style={styles.button} disabled={loading}>
        <Text style={styles.buttonText}>Search places</Text>{loading && <ActivityIndicator color="#7B4D0D" />}
      </Pressable>
      {candidates.map((item, index) => (
        <Pressable accessibilityRole="button" key={`${item.latitude}-${item.longitude}-${index}`} style={styles.candidate}
          onPress={() => { onChange({ ...item, locationName: item.resolvedPlaceName }); setCandidates([]); setMessage('Location selected.'); }}>
          <Text style={styles.text}>{item.resolvedPlaceName}</Text><Text style={styles.hint}>{item.timezone} · {item.latitude}, {item.longitude}</Text>
        </Pressable>
      ))}
      {validCoordinates(value.latitude, value.longitude) && value.timezone ? <Text style={styles.hint}>Selected: {value.latitude}, {value.longitude} · {value.timezone}</Text> : null}
      <Pressable accessibilityRole="button" onPress={() => setManual((current) => !current)} style={styles.button}>
        <Text style={styles.buttonText}>{manual ? 'Close manual location' : 'Enter coordinates and timezone'}</Text>
      </Pressable>
      {manual && <View>
        <TextInput accessibilityLabel="Latitude" placeholder="Latitude, e.g. 22.566" value={latitude} onChangeText={setLatitude} style={styles.input} />
        <TextInput accessibilityLabel="Longitude" placeholder="Longitude, e.g. 88.37" value={longitude} onChangeText={setLongitude} style={styles.input} />
        <TextInput accessibilityLabel="IANA timezone" autoCapitalize="none" autoCorrect={false} placeholder="Timezone, e.g. Asia/Kolkata" value={timezone} onChangeText={setTimezone} style={styles.input} />
        <Text style={styles.hint}>Use the timezone of this place. Historical daylight saving is calculated for the selected date.</Text>
        <Pressable accessibilityRole="button" style={styles.button} onPress={applyManual}><Text style={styles.buttonText}>Use this location</Text></Pressable>
      </View>}
      {message ? <Text accessibilityLiveRegion="polite" style={styles.hint}>{message}</Text> : null}
      <Text style={styles.hint}>Place search by <Text accessibilityRole="link" onPress={() => Linking.openURL('https://open-meteo.com/')} style={styles.buttonText}>Open-Meteo</Text>; geographic data by <Text accessibilityRole="link" onPress={() => Linking.openURL('https://www.geonames.org/')} style={styles.buttonText}>GeoNames</Text>.</Text>
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
