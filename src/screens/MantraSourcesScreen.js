import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DevotionalBackground from '../components/DevotionalBackground';
import BhaktiBackButton from '../components/BhaktiBackButton';
import useDevotionalStyles from '../hooks/useDevotionalStyles';
import useDevotionalCopy from '../hooks/useDevotionalCopy';
import { MANTRA_LIBRARY } from '../data/mantrasData';

export default function MantraSourcesScreen({ navigation }) {
  const styles = useDevotionalStyles(baseStyles);
  const { isHindi } = useDevotionalCopy();
  const [error, setError] = useState('');
  const shlokas = MANTRA_LIBRARY.filter((item) => item.categoryId === 'shlokas').length;
  const translated = MANTRA_LIBRARY.filter((item) => item.meaningBn).length;
  const sources = [...new Map(MANTRA_LIBRARY.filter((item) => item.sourceLabel && item.textSource).map((item) => [item.textSource, item])).values()];
  const open = async (url) => { try { await Linking.openURL(url); setError(''); } catch { setError(isHindi ? 'लिंक नहीं खुल सका। फिर प्रयास करें।' : 'Could not open this link. Please try again.'); } };
  return <DevotionalBackground><SafeAreaView style={{ flex: 1 }}>
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
      <BhaktiBackButton navigation={navigation} fallbackRoute="Mantras" />
      <Text accessibilityRole="header" style={styles.title}>{isHindi ? 'पाठ स्रोत और श्रेय' : 'Text sources & credits'}</Text>
      <Text selectable style={styles.body}>{isHindi
        ? 'यह संग्रह ऑफ़लाइन उपलब्ध है। ' + (MANTRA_LIBRARY.length - shlokas) + ' मंत्र, स्तोत्र और अन्य पाठ; ' + shlokas + ' गीता श्लोक।'
        : 'Available offline: ' + (MANTRA_LIBRARY.length - shlokas) + ' mantras, hymns and other readings, plus ' + shlokas + ' Bhagavad Gita shlokas.'}</Text>
      <Text style={styles.heading}>{isHindi ? 'स्रोत का सम्मान' : 'Respecting the source'}</Text>
      <Text selectable style={styles.body}>{isHindi
        ? 'विकिस्रोत के पाठों में योगदानकर्ताओं का श्रेय और CC BY-SA 4.0 लाइसेंस शामिल है। Nitya के पाठ-केवल JSON सार्वजनिक डोमेन के रूप में प्रकाशित हैं। हर पाठ के साथ उसका स्रोत और पुनः उपयोग की शर्तें दी गई हैं। पाठांतर संभव हैं।'
        : 'Wikisource texts include contributor attribution and the CC BY-SA 4.0 license. Nitya publishes its text-only JSON as public domain. Each reading identifies its source and reuse terms. These are traditional texts with different editions and readings.'}</Text>
      <Pressable accessibilityRole="link" onPress={() => open('https://creativecommons.org/licenses/by-sa/4.0/')} style={styles.link}><Text style={styles.linkText}>Creative Commons Attribution-ShareAlike 4.0 ↗</Text></Pressable>
      <Pressable accessibilityRole="link" onPress={() => open('https://getnitya.com/en/about/data/')} style={styles.link}><Text style={styles.linkText}>Nitya · {isHindi ? 'खुला पाठ डेटा' : 'Open text data'} ↗</Text></Pressable>
      <Text style={styles.heading}>{isHindi ? 'लिपि और अर्थ' : 'Scripts and meanings'}</Text>
      <Text selectable style={styles.body}>{isHindi
        ? 'बंगाली लिपि में संस्कृत पाठ और रोमन उच्चारण स्वचालित लिप्यंतरण हैं, अनुवाद नहीं। ' + translated + ' पाठों में बंगाली भाव-सार उपलब्ध है। मूल भाव-सार शाब्दिक या विद्वत् अनुवाद नहीं हैं। जहाँ समीक्षा किया हुआ अर्थ उपलब्ध नहीं है, वहाँ इसे स्पष्ट बताया गया है।'
        : 'Bengali-script Sanskrit and Roman pronunciation are mechanical script conversions, not translations. Bengali meaning summaries are available for ' + translated + ' readings. Original summaries are brief explanations, not literal or scholarly translations. Missing meanings are explicitly identified in the reader.'}</Text>
      <Text style={styles.heading}>{isHindi ? 'चित्र और रिकॉर्डिंग' : 'Art and recordings'}</Text>
      <Text selectable style={styles.body}>{isHindi
        ? 'यह अनुभाग भक्ति ऐप के मौजूदा चित्रों, चिह्नों और रिकॉर्डिंग का उपयोग करता है। हर पाठ की रिकॉर्डिंग उपलब्ध नहीं है। व्यक्तिगत मंत्र केवल आपके डिवाइस पर रहते हैं।'
        : 'This section reuses Bhakti’s existing deity artwork, symbols and recordings. A recording is offered only where one is already attached to that reading. Your personal mantras stay on this device.'}</Text>
      {!!error && <Text accessibilityRole="alert" style={styles.body}>{error}</Text>}
      <Text style={styles.heading}>{isHindi ? 'स्रोत संस्करण' : 'Source editions'}</Text>
      {sources.map((item) => <Pressable key={item.textSource} accessibilityRole="link" onPress={() => open(item.textSource)} style={styles.source}>
        <Text style={styles.linkText}>{isHindi ? item.titleHi || item.title : item.title} ↗</Text>
        <Text selectable style={styles.small}>{item.attribution || item.sourceLabel} · {item.license}</Text>
      </Pressable>)}
    </ScrollView>
  </SafeAreaView></DevotionalBackground>;
}
const baseStyles = StyleSheet.create({
  content: { width: '100%', maxWidth: 720, alignSelf: 'center', padding: 20, paddingBottom: 40, gap: 16 },
  title: { fontSize: 25, fontWeight: '800', color: '#3F2713' },
  heading: { fontSize: 18, fontWeight: '800', color: '#3F2713', marginTop: 8 },
  body: { fontSize: 15, lineHeight: 25, color: '#725C38' },
  link: { minHeight: 44, justifyContent: 'center' },
  linkText: { fontSize: 14, color: '#8A520B', fontWeight: '700', lineHeight: 22 },
  small: { fontSize: 12, color: '#725C38', lineHeight: 20 },
  source: { borderBottomWidth: 1, borderBottomColor: 'rgba(166,121,57,0.22)', paddingVertical: 10, gap: 4 },
});
