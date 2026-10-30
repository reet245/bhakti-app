import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import DevotionalBackground from '../components/DevotionalBackground';
import BhaktiBackButton from '../components/BhaktiBackButton';
import BhaktiBottomNav, { getBhaktiBottomNavContentPadding } from '../components/BhaktiBottomNav';
import useDevotionalStyles from '../hooks/useDevotionalStyles';
import useDevotionalCopy from '../hooks/useDevotionalCopy';
import { useDevotionalState, toggleMantraFavorite, retryDevotionalLoad, retryDevotionalSave } from '../hooks/useDevotionalState';
import { CATEGORY_OPTIONS, DEITY_OPTIONS, MANTRA_LIBRARY, getCategoryById, getDeityById, getDailyMantra, getMantraScript } from '../data/mantrasData';
import catalog from '../features/mantras/catalog.cjs';

const SEARCH_INDEX = Object.fromEntries(MANTRA_LIBRARY.map((item) => [item.id, catalog.buildSearchText(item, getDeityById(item.deityId), getCategoryById(item.categoryId))]));
const COLLECTIONS = ['all', 'saved', 'personal'];

export default function MantrasScreen({ navigation, route }) {
  const styles = useDevotionalStyles(baseStyles);
  const { ui, isHindi } = useDevotionalCopy();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { favorites, customMantras, ready, error, readingScript } = useDevotionalState();
  const [query, setQuery] = useState('');
  const [deityId, setDeityId] = useState(route?.params?.deityId || 'all');
  const [categoryId, setCategoryId] = useState('all');
  const [collection, setCollection] = useState(COLLECTIONS.includes(route?.params?.collection) ? route.params.collection : 'all');
  const [chapter, setChapter] = useState('all');
  const [daily, setDaily] = useState(() => getDailyMantra());
  useFocusEffect(useCallback(() => {
    setDaily(getDailyMantra());
    const timer = setInterval(() => setDaily(getDailyMantra()), 60000);
    return () => clearInterval(timer);
  }, []));
  useEffect(() => {
    if (DEITY_OPTIONS.some((item) => item.id === route?.params?.deityId)) { setDeityId(route.params.deityId); setCollection('all'); setCategoryId('all'); setQuery(''); setChapter('all'); }
    else if (COLLECTIONS.includes(route?.params?.collection)) { setCollection(route.params.collection); setDeityId('all'); setCategoryId('all'); setChapter('all'); setQuery(''); }
    if (route?.params?.deityId || route?.params?.collection) navigation.setParams({ deityId: undefined, collection: undefined });
  }, [navigation, route?.params?.deityId, route?.params?.collection]);

  const library = useMemo(() => [...MANTRA_LIBRARY, ...customMantras], [customMantras]);
  const index = useMemo(() => ({ ...SEARCH_INDEX, ...Object.fromEntries(customMantras.map((item) => [item.id, catalog.buildSearchText(item, getDeityById(item.deityId))])) }), [customMantras]);
  const results = useMemo(() => catalog.filterMantras(library, { query, deityId, categoryId, collection, favorites, chapter }, index), [library, query, deityId, categoryId, collection, favorites, chapter, index]);
  const types = CATEGORY_OPTIONS.filter((category) => library.some((item) => item.categoryId === category.id));
  const deities = DEITY_OPTIONS.filter((deity) => library.some((item) => item.deityId === deity.id || item.deityIds?.includes(deity.id)));
  const contentWidth = Math.min(width - 32, 680);
  const open = (item) => navigation.navigate('MantraDetail', { mantraId: item.id });
  const reset = () => { setQuery(''); setDeityId('all'); setCategoryId('all'); setChapter('all'); };
  const chooseCollection = (value) => { setCollection(value); reset(); };
  const title = (item) => isHindi ? item.titleHi || item.title : item.title;
  const collectionLabel = { all: isHindi ? 'सभी' : 'All texts', saved: isHindi ? 'पसंदीदा' : 'Saved', personal: isHindi ? 'मेरे मंत्र' : 'My mantras' };
  const chip = (key, label, selected, onPress) => <Pressable key={key} accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={({ pressed }) => [styles.chip, selected && styles.selected, pressed && styles.pressed]}><Text style={styles.chipText}>{label}</Text></Pressable>;

  return (
    <DevotionalBackground>
      <View style={{ flex: 1, paddingTop: insets.top }}>
        <View style={[styles.topRow, { width: contentWidth }]}>
          <BhaktiBackButton navigation={navigation} />
          <View style={styles.headingCopy}><Text accessibilityRole="header" style={styles.title}>{isHindi ? 'मंत्र व श्लोक' : 'Mantras & Shlokas'}</Text><Text style={styles.subtitle}>{isHindi ? 'पढ़ें, स्मरण करें, जप करें' : 'Read, reflect, and chant'}</Text></View>
          <Pressable accessibilityRole="button" accessibilityLabel={isHindi ? 'स्रोत और श्रेय' : 'Sources and credits'} onPress={() => navigation.navigate('MantraSources')} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}><Text style={styles.actionText}>ⓘ</Text></Pressable>
        </View>
        <View style={[styles.search, { width: contentWidth }]}>
          <Text style={styles.actionText}>⌕</Text>
          <TextInput accessibilityLabel={isHindi ? 'मंत्र खोजें' : 'Search mantras'} placeholder={isHindi ? 'नाम, मंत्र या श्लोक खोजें…' : 'Search a name, mantra, or verse…'} placeholderTextColor={styles.subtitle.color} value={query} onChangeText={setQuery} style={styles.input} returnKeyType="search" />
          {!!query && <Pressable accessibilityRole="button" accessibilityLabel={isHindi ? 'खोज साफ़ करें' : 'Clear search'} onPress={() => setQuery('')} style={styles.iconButton}><Text style={styles.actionText}>×</Text></Pressable>}
        </View>
        <FlatList
          data={!ready && collection !== 'all' ? [] : results}
          keyExtractor={(item) => item.id}
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          initialNumToRender={12}
          maxToRenderPerBatch={12}
          windowSize={7}
          contentContainerStyle={{ width: contentWidth, alignSelf: 'center', paddingBottom: getBhaktiBottomNavContentPadding(height, insets.bottom + 24) }}
          ListHeaderComponent={<View>
            {!query && collection === 'all' && <>
              <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>{isHindi ? 'आराध्य के अनुसार' : 'Explore by deity'}</Text><Pressable onPress={() => setDeityId('all')} accessibilityRole="button" style={styles.textButton}><Text style={styles.actionLabel}>{isHindi ? 'सभी' : 'All deities'}</Text></Pressable></View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.deityStrip} keyboardShouldPersistTaps="handled">
                {deities.map((deity) => <Pressable key={deity.id} accessibilityRole="button" accessibilityState={{ selected: deityId === deity.id }} onPress={() => setDeityId(deityId === deity.id ? 'all' : deity.id)} style={({ pressed }) => [styles.deity, deityId === deity.id && styles.selected, pressed && styles.pressed]}>
                  {deity.thumbnailImage || deity.image ? <Image source={deity.thumbnailImage || deity.image} style={styles.deityImage} resizeMode="cover" /> : <View style={[styles.deityImage, styles.symbolWrap]}><Text style={styles.symbol}>{deity.symbol}</Text></View>}
                  <Text style={styles.deityLabel}>{isHindi ? deity.hindiName : deity.englishName}</Text>
                </Pressable>)}
              </ScrollView>
              {deityId === 'all' && daily && <Pressable accessibilityRole="button" accessibilityLabel={(isHindi ? 'आज का मंत्र: ' : 'Daily mantra: ') + title(daily)} onPress={() => open(daily)} style={({ pressed }) => [styles.dailyCard, pressed && styles.pressed]}>
                <View style={styles.dailyCopy}><Text style={styles.eyebrow}>{isHindi ? 'आज का मंत्र' : 'DAILY MANTRA'}</Text><Text style={styles.dailyTitle}>{title(daily)}</Text><Text style={styles.preview} numberOfLines={2}>{getMantraScript(daily, readingScript)}</Text><Text style={styles.actionLabel}>{isHindi ? 'पढ़ें और जप करें' : 'Read & chant'} →</Text></View>
                {getDeityById(daily.deityId).thumbnailImage && <Image source={getDeityById(daily.deityId).thumbnailImage} style={styles.dailyImage} resizeMode="cover" />}
              </Pressable>}
            </>}
            <View style={styles.collectionRow}>{COLLECTIONS.map((value) => <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: collection === value }} onPress={() => chooseCollection(value)} style={({ pressed }) => [styles.collection, collection === value && styles.selected, pressed && styles.pressed]}><Text style={styles.collectionText}>{collectionLabel[value]}</Text></Pressable>)}</View>
            {collection === 'personal' && <View style={styles.personalIntro}><Text style={styles.body}>{isHindi ? 'अपने मंत्र जोड़ें। वे केवल इस डिवाइस पर सहेजे जाते हैं।' : 'Keep your own prayers here. They are saved only on this device.'}</Text><Pressable accessibilityRole="button" disabled={!ready} onPress={() => navigation.navigate('CustomMantra')} style={({ pressed }) => [styles.addButton, !ready && styles.disabled, pressed && styles.pressed]}><Text style={styles.actionLabel}>{isHindi ? '+ अपना मंत्र जोड़ें' : '+ Add your mantra'}</Text></Pressable></View>}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters} keyboardShouldPersistTaps="handled">
              {[{ id: 'all', label: 'All types', labelHi: 'सभी प्रकार' }, ...types].map((type) => chip(type.id, isHindi ? type.labelHi || ui(type.label) : type.label, categoryId === type.id, () => { setCategoryId(type.id); setChapter('all'); }))}
            </ScrollView>
            {categoryId === 'shlokas' && <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>{['all', ...Array.from({ length: 18 }, (_, i) => i + 1)].map((number) => chip(number, number === 'all' ? (isHindi ? 'सभी अध्याय' : 'All chapters') : (isHindi ? 'अध्याय ' : 'Chapter ') + number, chapter === number, () => setChapter(number)))}</ScrollView>}
            {!!error && <View style={styles.notice}><Text accessibilityRole="alert" style={styles.body}>{ui(error)}</Text><Pressable accessibilityRole="button" onPress={() => (ready ? retryDevotionalSave() : retryDevotionalLoad()).catch(() => {})} style={styles.textButton}><Text style={styles.actionLabel}>{isHindi ? 'फिर प्रयास करें' : 'Retry'}</Text></Pressable></View>}
            <View style={styles.sectionHeading}><Text accessibilityRole="header" style={styles.sectionTitle}>{collectionLabel[collection]}{ready || collection === 'all' ? ' · ' + results.length : ''}</Text>{(deityId !== 'all' || categoryId !== 'all' || !!query) && <Pressable accessibilityRole="button" onPress={reset} style={styles.textButton}><Text style={styles.actionLabel}>{isHindi ? 'फ़िल्टर हटाएँ' : 'Clear filters'}</Text></Pressable>}</View>
            {deityId !== 'all' && <Text style={styles.filterLabel}>{isHindi ? getDeityById(deityId).hindiName : getDeityById(deityId).englishName}</Text>}
          </View>}
          renderItem={({ item }) => <View style={styles.row}>
            <Pressable accessibilityRole="button" accessibilityLabel={title(item) + ' · ' + ui(getCategoryById(item.categoryId).label)} onPress={() => open(item)} style={({ pressed }) => [styles.rowMain, pressed && styles.pressed]}>
              <View style={styles.rowCopy}><Text style={styles.rowTitle}>{title(item)}</Text><Text style={styles.meta}>{isHindi ? getDeityById(item.deityId).hindiName : getDeityById(item.deityId).englishName} · {ui(getCategoryById(item.categoryId).label)}{item.isExcerpt ? (isHindi ? ' · आंशिक पाठ' : ' · Partial text') : ''}{item.isCustom ? (isHindi ? ' · निजी' : ' · Personal') : ''}</Text><Text style={styles.rowPreview} numberOfLines={1}>{getMantraScript(item, readingScript).slice(0, 140)}</Text></View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={ui(favorites.includes(item.id) ? 'Remove from favorites' : 'Add to favorites') + ': ' + title(item)} accessibilityState={{ disabled: !ready, selected: favorites.includes(item.id) }} disabled={!ready} onPress={() => toggleMantraFavorite(item.id)} style={({ pressed }) => [styles.favorite, pressed && styles.pressed]}><Text style={styles.favoriteText}>{favorites.includes(item.id) ? '♥' : '♡'}</Text></Pressable>
          </View>}
          ListEmptyComponent={!ready && collection !== 'all' ? <View style={styles.empty}>{!error && <ActivityIndicator />}<Text style={styles.body}>{error ? (isHindi ? 'अपने सहेजे हुए पाठ देखने के लिए फिर प्रयास करें।' : 'Retry to load your saved texts.') : ui('Loading saved progress…')}</Text></View> : <View style={styles.empty}><Text style={styles.sectionTitle}>{collection === 'saved' && !query && deityId === 'all' && categoryId === 'all' ? (isHindi ? 'अपने पसंदीदा मंत्र यहाँ रखें' : 'Your saved prayers belong here') : collection === 'personal' && !query ? (isHindi ? 'अपना पहला मंत्र जोड़ें' : 'Add your first mantra') : ui('No mantras found.')}</Text><Text style={styles.body}>{collection === 'saved' ? (isHindi ? 'किसी मंत्र के पास दिल पर टैप करें।' : 'Tap the heart beside a text to save it.') : (isHindi ? 'आप नाम या पाठ से खोज सकते हैं।' : 'Try a name or a few words from the text.')}</Text></View>}
          ListFooterComponent={<Pressable accessibilityRole="button" onPress={() => navigation.navigate('MantraSources')} style={styles.footer}><Text style={styles.meta}>{isHindi ? 'ऑफ़लाइन संग्रह · पाठ स्रोत व श्रेय' : 'Offline collection · Text sources & credits'} ↗</Text></Pressable>}
        />
        <BhaktiBottomNav activeTab="Mantras" navigation={navigation} />
      </View>
    </DevotionalBackground>
  );
}

const baseStyles = StyleSheet.create({
  topRow: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14 },
  headingCopy: { flex: 1 },
  title: { fontSize: 23, fontWeight: '800', color: '#3F2713' },
  subtitle: { fontSize: 12, color: '#725C38', marginTop: 3 },
  search: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFFBF1', borderColor: '#D8B15C', borderWidth: 1, borderRadius: 16, minHeight: 48, paddingHorizontal: 12, marginBottom: 8 },
  input: { flex: 1, minWidth: 0, color: '#3F2713', fontSize: 14, paddingVertical: 12 },
  iconButton: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  actionText: { fontSize: 22, color: '#8A520B' },
  actionLabel: { color: '#8A520B', fontWeight: '800', fontSize: 13 },
  textButton: { minHeight: 44, paddingHorizontal: 6, justifyContent: 'center' },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 48, gap: 8 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#3F2713', flexShrink: 1 },
  deityStrip: { gap: 10, paddingBottom: 12 },
  deity: { width: 86, padding: 4, borderRadius: 18, backgroundColor: '#FFFAEF', borderWidth: 1, borderColor: '#D8B15C' },
  deityImage: { height: 78, width: 76, borderRadius: 14 },
  symbolWrap: { backgroundColor: '#F6E2A8', alignItems: 'center', justifyContent: 'center' },
  symbol: { fontSize: 25, color: '#8A520B' },
  deityLabel: { textAlign: 'center', fontSize: 11, fontWeight: '700', paddingVertical: 8, color: '#3F2713' },
  selected: { backgroundColor: '#F6E2A8', borderColor: '#A36A12', borderWidth: 2 },
  dailyCard: { backgroundColor: '#F6E2A8', borderWidth: 1, borderColor: '#D8B15C', borderRadius: 22, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 4 },
  dailyCopy: { flex: 1, minWidth: 0, gap: 8 },
  eyebrow: { fontSize: 10, letterSpacing: 1.4, color: '#8A520B', fontWeight: '800' },
  dailyTitle: { fontSize: 18, color: '#3F2713', fontWeight: '800' },
  preview: { fontSize: 14, lineHeight: 23, color: '#725C38' },
  dailyImage: { width: 72, height: 92, borderRadius: 36 },
  collectionRow: { flexDirection: 'row', gap: 8, marginTop: 16, marginBottom: 8 },
  collection: { flex: 1, minHeight: 44, borderRadius: 12, borderWidth: 1, borderColor: '#D8B15C', backgroundColor: '#FFFAEF', justifyContent: 'center', alignItems: 'center', padding: 8 },
  collectionText: { color: '#3F2713', fontSize: 13, fontWeight: '800', textAlign: 'center' },
  filters: { gap: 8, paddingVertical: 6 },
  chip: { minHeight: 44, borderRadius: 22, paddingHorizontal: 14, paddingVertical: 10, justifyContent: 'center', borderWidth: 1, borderColor: '#D8B15C', backgroundColor: '#FFFAEF' },
  chipText: { fontSize: 12, fontWeight: '700', color: '#3F2713' },
  row: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(166,121,57,0.22)', minHeight: 94 },
  rowMain: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 10 },
  rowCopy: { flex: 1, gap: 4 },
  rowTitle: { fontSize: 15, lineHeight: 21, color: '#3F2713', fontWeight: '800' },
  meta: { fontSize: 11, lineHeight: 17, color: '#725C38' },
  rowPreview: { fontSize: 13, lineHeight: 22, color: '#725C38' },
  chevron: { fontSize: 22, color: '#8A520B' },
  favorite: { minWidth: 44, minHeight: 48, justifyContent: 'center', alignItems: 'center', marginLeft: 4 },
  favoriteText: { fontSize: 23, color: '#A36A12' },
  filterLabel: { fontSize: 12, fontWeight: '700', color: '#8A520B', paddingBottom: 8 },
  body: { fontSize: 14, lineHeight: 22, color: '#725C38' },
  personalIntro: { paddingVertical: 12, gap: 10 },
  addButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F6E2A8', borderRadius: 14 },
  empty: { paddingVertical: 32, gap: 12, alignItems: 'center' },
  notice: { padding: 12, backgroundColor: '#FFFAEF', borderRadius: 12, marginTop: 8 },
  footer: { paddingVertical: 24, alignItems: 'center', minHeight: 48 },
  pressed: { opacity: 0.65 },
  disabled: { opacity: 0.45 },
});
