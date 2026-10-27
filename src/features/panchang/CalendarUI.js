import { useState } from 'react';
import { Image, ImageBackground, Linking, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import useDevotionalStyles from '../../hooks/useDevotionalStyles';
import { useLanguage } from '../../context/LanguageContext';
import BhaktiBackButton from '../../components/BhaktiBackButton';
import BhaktiBottomNav, { getBhaktiBottomNavContentPadding } from '../../components/BhaktiBottomNav';
import { useBhaktiTopPadding } from '../../components/BhaktiLayout';
import { dateISO, parseLocalDate } from './date';
import { festivalImages } from '../../data/festivalImages';

export const deityArt = {
  shiv: require('../../../assets/deities/thumbnails/shiv-ji.png'),
  ganesh: require('../../../assets/deities/thumbnails/ganesh-ji.png'),
  hanuman: require('../../../assets/deities/thumbnails/hanuman-ji.png'),
  krishna: require('../../../assets/deities/thumbnails/krishna-ji.png'),
  lakshmi: require('../../../assets/deities/thumbnails/laxmi-ma.png'),
  durga: require('../../../assets/deities/thumbnails/durga-ma.png'),
};
export const weekdayDeities = [null, 'shiv', 'hanuman', 'ganesh', 'krishna', 'lakshmi', 'hanuman'];
export function useCalendarCopy() {
  const { currentLanguage } = useLanguage();
  const hi = currentLanguage === 'hi';
  return { hi, locale: hi ? 'hi-IN' : 'en-IN', c: (en, hindi) => hi ? hindi : en, value: (data, key) => hi && data?.[`${key}Hi`] ? data[`${key}Hi`] : data?.[key] };
}
export function Action({ children, onPress, label, selected, disabled, style }) {
  const s = useDevotionalStyles(calendarStyles);
  return <TouchableOpacity accessibilityRole="button" accessibilityLabel={label || (typeof children === 'string' ? children : undefined)} accessibilityState={{ selected: !!selected, disabled: !!disabled }} onPress={onPress} disabled={disabled} activeOpacity={0.78} style={[s.action, style, selected && s.actionSelected, disabled && { opacity: 0.4 }]}><Text style={s.actionText}>{children}</Text></TouchableOpacity>;
}
export function CalendarPage({ navigation, title, children, action, wide = false }) {
  const s = useDevotionalStyles(calendarStyles);
  const { width, height } = useWindowDimensions();
  const top = useBhaktiTopPadding(width, 'title');
  return <ImageBackground source={require('../../../assets/horoscope/background/horoscope-bg.png')} style={s.background} resizeMode="cover">
    <View style={s.overlay} /><SafeAreaView style={s.background}>
      <ScrollView contentContainerStyle={{ paddingTop: top, paddingBottom: getBhaktiBottomNavContentPadding(height, 35), paddingHorizontal: 14 }}>
        <View style={[s.page, { maxWidth: wide ? 980 : 680 }]}>
          <View style={s.header}><BhaktiBackButton navigation={navigation} /><Text accessibilityRole="header" style={s.title}>{title}</Text>{action || <View style={{ width: 40 }} />}</View>
          {children}
        </View>
      </ScrollView><BhaktiBottomNav navigation={navigation} activeTab="Calendar" />
    </SafeAreaView>
  </ImageBackground>;
}
export function CalendarTabs({ active, navigation, selectedDateISO }) {
  const s = useDevotionalStyles(calendarStyles); const { c } = useCalendarCopy();
  return <View style={s.tabs}>{[['Month', c('Month', 'महीना')], ['Daily', c('Daily Panchang', 'दैनिक पंचांग')], ['Almanac', c('Almanac', 'पत्रक')]].map(([id, label]) =>
    <Action key={id} selected={active === id} style={s.tab} onPress={() => navigation.navigate(id === 'Daily' ? 'Calendar' : 'PanchangCalendar', { selectedDateISO, view: id })}>{label}</Action>)}</View>;
}
export function DateJump({ date, onChange }) {
  const s = useDevotionalStyles(calendarStyles); const { c } = useCalendarCopy();
  const [open, setOpen] = useState(false); const [draft, setDraft] = useState(''); const [error, setError] = useState('');
  return <View><Action onPress={() => { setDraft(dateISO(date)); setError(''); setOpen(!open); }}>{c('Go to date', 'तारीख चुनें')} ▾</Action>
    {open && <View style={s.card}><Text style={s.hint}>{c('Date as YYYY-MM-DD · 1900–2100', 'तारीख YYYY-MM-DD में · 1900–2100')}</Text><TextInput style={s.input} accessibilityLabel={c('Calendar date', 'कैलेंडर तारीख')} value={draft} onChangeText={setDraft} placeholder="2026-10-23" autoCapitalize="none" />
      <Action onPress={() => { const next = parseLocalDate(draft, null); if (!next || next.getFullYear() < 1900 || next.getFullYear() > 2100) { setError(c('Enter a valid date from 1900 to 2100.', '1900 से 2100 तक की सही तारीख लिखें।')); return; } onChange(next); setOpen(false); }}>{c('Open date', 'तारीख खोलें')}</Action>{error ? <Text accessibilityRole="alert" style={s.hint}>{error}</Text> : null}</View>}
  </View>;
}
export function CalendarArt({ festival, deity, size = 42 }) {
  const s = useDevotionalStyles(calendarStyles);
  const image = festivalImages[festival?.imageKey] || deityArt[festival?.deityId || festival?.pujaDeityId || deity];
  return image ? <Image accessible={false} source={image} resizeMode="contain" style={{ width: size, height: size }} /> : <Text accessible={false} style={[s.symbol, { width: size, fontSize: size * 0.65 }]}>{festival?.key?.includes('amavasya') ? '●' : festival?.key?.includes('purnima') ? '○' : '☀'}</Text>;
}
export function FestivalRows({ items = [], navigation, empty = true }) {
  const s = useDevotionalStyles(calendarStyles); const { c, value, locale } = useCalendarCopy();
  return <View>{!items.length && empty ? <Text style={s.hint}>{c('No observance listed by this calculation for the selected day.', 'इस गणना में चुने दिन का कोई पर्व सूचीबद्ध नहीं है।')}</Text> : null}
    {items.map((item, i) => <TouchableOpacity key={`${item.id || item.key}-${i}`} accessibilityRole="button" onPress={() => navigation.navigate('FestivalDetail', { festival: item })} style={s.festivalRow}>
      <CalendarArt festival={item} /><View style={{ flex: 1 }}><Text style={s.bodyBold}>{value(item, 'name')}</Text><Text style={s.hint}>{item.dateISO ? parseLocalDate(item.dateISO).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }) : item.dateText}</Text></View><Text style={s.body}>›</Text>
    </TouchableOpacity>)}
  </View>;
}
export function DataNotes() {
  const s = useDevotionalStyles(calendarStyles); const { c } = useCalendarCopy(); const [open, setOpen] = useState(false);
  return <View style={s.card}><Action onPress={() => setOpen(!open)}>{c('Calculation & sources', 'गणना व स्रोत')} {open ? '−' : '+'}</Action>{open && <View style={{ gap: 8, marginTop: 10 }}>
    <Text style={s.hint}>{c('Calculated offline with panchang-ts 5.4.0 (MIT). Lahiri ayanamsa; North Indian Purnimanta calendar. Both lunar month systems are shown. Times use the selected place’s timezone; events after midnight are marked next day.', 'panchang-ts 5.4.0 (MIT) से ऑफलाइन गणना। लाहिड़ी अयनांश; उत्तर भारतीय पूर्णिमांत पंचांग। दोनों चंद्र मास दिखाए गए हैं। समय चुने स्थान के समय क्षेत्र में है; मध्यरात्रि के बाद का समय अगले दिन के रूप में दिखाया गया है।')}</Text>
    <Text style={s.hint}>{c('Festival rules vary by tradition. This is a calculated calendar, not a published ritual authority. Some regional observances and fasting exceptions are not covered. Sampled Delhi festival dates in 2026–2027 use documented, location-specific Drik Panchang reference corrections. Corrections are labelled in festival details. Confirm ritual and fasting dates locally.', 'पर्वों के नियम परंपरा के अनुसार बदलते हैं। यह गणना आधारित कैलेंडर है। कुछ क्षेत्रीय व्रत नियम शामिल नहीं हैं। दिल्ली के कुछ 2026–2027 पर्वों में द्रिक पंचांग के स्थानीय संदर्भ सुधार लागू हैं। सुधार पर्व के विवरण में दिखते हैं। व्रत और अनुष्ठान की तारीख स्थानीय पंचांग से मिलाएँ।')}</Text>
    <Text style={s.hint}>{c('Astronomical times can differ by several minutes from another ephemeris or horizon convention. Public holidays and religious observances are different categories.', 'खगोलीय समय अन्य गणना और क्षितिज मानक से कुछ मिनट अलग हो सकते हैं। सरकारी अवकाश और धार्मिक पर्व अलग श्रेणियाँ हैं।')}</Text>
    <Text accessibilityRole="link" style={s.link} onPress={() => Linking.openURL('https://dharmagya.app/docs/panchang/accuracy')}>{c('Read accuracy and calculation notes ↗', 'गणना की सटीकता व सीमाएँ पढ़ें ↗')}</Text>
    <Text style={s.hint}>MIT License · Copyright (c) 2026 Ishank</Text>
    <Text style={s.hint}>Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions: The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.</Text>
  </View>}</View>;
}
export const calendarStyles = StyleSheet.create({
  background: { flex: 1 }, overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(247,232,190,0.86)' },
  page: { width: '100%', alignSelf: 'center', gap: 12 }, header: { flexDirection: 'row', alignItems: 'center', minHeight: 46 },
  title: { flex: 1, fontSize: 24, color: '#3F2713', fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }), fontWeight: '800', textAlign: 'center' },
  tabs: { flexDirection: 'row', backgroundColor: '#FFF7E3', padding: 4, borderRadius: 18, borderWidth: 1, borderColor: '#DCC28A', gap: 3 },
  tab: { flex: 1, paddingHorizontal: 4, borderWidth: 0, backgroundColor: 'transparent' },
  action: { minHeight: 44, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#FFF7E3', borderRadius: 13, borderWidth: 1, borderColor: '#DCC28A', alignItems: 'center', justifyContent: 'center' },
  actionSelected: { backgroundColor: '#EFD487', borderColor: '#B48222' }, actionText: { color: '#80520F', fontSize: 12, fontWeight: '800', textAlign: 'center' },
  card: { borderRadius: 20, padding: 16, backgroundColor: '#FFF7E3', borderColor: '#DCC28A', borderWidth: 1, gap: 8 },
  hero: { backgroundColor: '#F1D894', borderRadius: 22, padding: 18, borderColor: '#D0A23A', borderWidth: 1, gap: 7 },
  heroTitle: { color: '#3F2713', fontSize: 25, fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }), fontWeight: '800' },
  sectionTitle: { color: '#3F2713', fontSize: 18, fontWeight: '800', marginBottom: 4 },
  body: { color: '#5C3A0E', fontSize: 14, lineHeight: 21 }, bodyBold: { color: '#3F2713', fontSize: 14, lineHeight: 21, fontWeight: '700' },
  hint: { color: '#725C38', fontSize: 12, lineHeight: 18 }, link: { color: '#80520F', fontSize: 13, fontWeight: '800', textDecorationLine: 'underline' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 }, between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  input: { minHeight: 44, borderWidth: 1, borderColor: '#DCC28A', borderRadius: 10, padding: 10, color: '#3F2713', backgroundColor: '#FFFCF3', marginVertical: 5 },
  symbol: { color: '#A36A12', textAlign: 'center' }, festivalRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: '#EADAB5', paddingVertical: 10, minHeight: 60 },
  tableRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#EADAB5', gap: 12 },
  rowLabel: { width: '38%', color: '#80520F', fontSize: 13, lineHeight: 21 }, rowValue: { flex: 1, color: '#3F2713', fontSize: 14, lineHeight: 21, fontWeight: '600' },
});
