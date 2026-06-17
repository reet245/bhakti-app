import { useMemo, useState } from 'react';
import {
  Image,
  ImageBackground,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

import {
  MANTRA_LIBRARY,
  getCategoryById,
  getDeityById,
} from '../data/mantrasData';

const BG_IMAGE = require('../../assets/horoscope/background/horoscope-bg.png');
const LOTUS_IMAGE = require('../../assets/horoscope/decorations/lotus-divider.png');
const ICONS = {
  calendar: require('../../assets/icon/calender.png'),
  kundli: require('../../assets/icon/kundli.png'),
  mantras: require('../../assets/icon/mantras.png'),
  puja: require('../../assets/icon/puja.png'),
};

const DEVOTIONAL_FONT = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });
const VIEW_ALL_ID = 'all';

const DEITY_ORDER = [
  'shiv',
  'hanuman',
  'durga',
  'krishna',
  'ganesh',
  'lakshmi',
  'saraswati',
  'ram',
];

const BOTTOM_NAV_ITEMS = [
  { label: 'Puja', screen: 'Puja', image: ICONS.puja },
  { label: 'Calendar', screen: 'Calendar', image: ICONS.calendar },
  { label: 'Mantras', screen: 'Mantras', image: ICONS.mantras },
  { label: 'Kundli', screen: 'Kundli', image: ICONS.kundli },
];

const POPULAR_MANTRA_ORDER = [
  'om-namah-shivaya',
  'maha-mrityunjaya',
  'hanuman-chalisa',
  'ganesh-aarti',
  'ganesh-vakratunda',
];

export default function MantrasScreen({ navigation }) {
  const { width, height } = useWindowDimensions();
  const [searchText, setSearchText] = useState('');
  const [selectedDeityId, setSelectedDeityId] = useState(VIEW_ALL_ID);
  const [playingId, setPlayingId] = useState(null);
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [showAllMantras, setShowAllMantras] = useState(false);

  const responsiveStyles = useMemo(() => {
    const statusTop = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;
    const compactWidth = Math.min(width, 520);
    const horizontalPadding = Math.max(14, Math.min(20, compactWidth * 0.045));
    const contentWidth = Math.max(282, Math.min(width - horizontalPadding * 2, 620));
    const deityWidth = Math.max(88, Math.min(108, contentWidth * 0.255));
    const deityHeight = Math.max(108, Math.min(126, height * 0.145));
    const bottomNavHeight = Math.max(70, Math.min(82, height * 0.092));

    return {
      content: {
        paddingHorizontal: horizontalPadding,
        paddingTop: statusTop + Math.max(8, height * 0.012),
        paddingBottom: bottomNavHeight + Math.max(18, height * 0.026),
      },
      contentWidth,
      scrollerEdgePadding: Math.max(0, (width - contentWidth) / 2),
      search: {
        minHeight: Math.max(42, Math.min(48, height * 0.055)),
      },
      deityCard: {
        width: deityWidth,
        height: deityHeight,
      },
      bottomNav: {
        minHeight: bottomNavHeight,
        paddingHorizontal: horizontalPadding,
        paddingBottom: Math.max(8, height * 0.012),
      },
    };
  }, [height, width]);

  const deityOptions = useMemo(() => (
    DEITY_ORDER.map((deityId) => getDeityById(deityId)).filter(Boolean)
  ), []);

  const filteredMantras = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();

    const orderedMantras = [...MANTRA_LIBRARY].sort((firstMantra, secondMantra) => {
      const firstIndex = POPULAR_MANTRA_ORDER.indexOf(firstMantra.id);
      const secondIndex = POPULAR_MANTRA_ORDER.indexOf(secondMantra.id);
      const firstRank = firstIndex === -1 ? POPULAR_MANTRA_ORDER.length : firstIndex;
      const secondRank = secondIndex === -1 ? POPULAR_MANTRA_ORDER.length : secondIndex;

      return firstRank - secondRank;
    });

    return orderedMantras.filter((mantra) => {
      const deity = getDeityById(mantra.deityId);
      const category = getCategoryById(mantra.categoryId);
      const matchesDeity = selectedDeityId === VIEW_ALL_ID || mantra.deityId === selectedDeityId;
      const matchesSearch = normalizedSearch.length === 0
        || [
          mantra.title,
          deity.englishName,
          deity.hindiName,
          category.label,
          mantra.transliteration,
        ].some((value) => value.toLowerCase().includes(normalizedSearch));

      return matchesDeity && matchesSearch;
    });
  }, [searchText, selectedDeityId]);

  const visibleMantras = showAllMantras ? filteredMantras : filteredMantras.slice(0, 5);

  const handleBack = () => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
      return;
    }

    navigation?.navigate?.('Home');
  };

  const showAllItems = () => {
    setSelectedDeityId(VIEW_ALL_ID);
    setShowAllMantras(false);
  };

  const openMantraDetails = (mantraId) => {
    navigation?.navigate?.('MantraDetail', { mantraId });
  };

  const toggleFavorite = (mantraId) => {
    setFavoriteIds((currentIds) => (
      currentIds.includes(mantraId)
        ? currentIds.filter((id) => id !== mantraId)
        : [...currentIds, mantraId]
    ));
  };

  const togglePlay = (mantraId) => {
    setPlayingId((currentId) => (currentId === mantraId ? null : mantraId));
  };

  return (
    <ImageBackground source={BG_IMAGE} style={styles.background} resizeMode="cover">
      <View style={styles.overlay} />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={[styles.content, responsiveStyles.content]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.topRow, { width: responsiveStyles.contentWidth }]}>
            <TouchableOpacity style={styles.backButton} activeOpacity={0.78} onPress={handleBack}>
              <Image source={LOTUS_IMAGE} style={styles.backLotus} resizeMode="contain" />
              <Text style={styles.backChevron}>{'<'}</Text>
            </TouchableOpacity>

            <View style={[styles.searchBox, responsiveStyles.search]}>
              <Text style={styles.searchIcon}>{'\u2315'}</Text>
              <TextInput
                value={searchText}
                onChangeText={setSearchText}
                placeholder="Search mantras, aarti, chalisa..."
                placeholderTextColor="#A67939"
                returnKeyType="search"
                style={styles.searchInput}
              />
            </View>
          </View>

          <View style={[styles.sectionBlock, { width: responsiveStyles.contentWidth }]}>
            <SectionHeader title="Deity Categories" onViewAll={showAllItems} />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.deityScroller}
            >
              {deityOptions.map((deity) => (
                <DeityCard
                  key={deity.id}
                  deity={deity}
                  selected={selectedDeityId === deity.id}
                  responsiveStyles={responsiveStyles}
                  onPress={() => setSelectedDeityId(deity.id)}
                />
              ))}
            </ScrollView>
          </View>

          <View style={[styles.sectionBlock, styles.compactSectionBlock, { width: responsiveStyles.contentWidth }]}>
            <SectionHeader
              title="Popular Mantras"
              actionLabel={showAllMantras ? 'Show Less' : 'View All'}
              onViewAll={() => setShowAllMantras((value) => !value)}
            />
            {visibleMantras.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No mantras found.</Text>
              </View>
            ) : visibleMantras.map((mantra, index) => (
              <MantraListRow
                key={mantra.id}
                mantra={mantra}
                rank={index + 1}
                isPlaying={playingId === mantra.id}
                isFavorite={favoriteIds.includes(mantra.id)}
                onPress={() => openMantraDetails(mantra.id)}
                onPlay={() => togglePlay(mantra.id)}
                onFavorite={() => toggleFavorite(mantra.id)}
              />
            ))}
          </View>
        </ScrollView>

        <BottomNav navigation={navigation} responsiveStyles={responsiveStyles} />
      </SafeAreaView>
    </ImageBackground>
  );
}

function SectionHeader({ title, actionLabel = 'View All', onViewAll }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {onViewAll ? (
        <TouchableOpacity activeOpacity={0.76} onPress={onViewAll}>
          <Text style={styles.viewAllText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function DeityCard({ deity, selected, responsiveStyles, onPress }) {
  const cardImage = deity.thumbnailImage || deity.image;

  return (
    <TouchableOpacity
      style={[styles.deityCard, responsiveStyles.deityCard, selected && styles.selectedDeityCard]}
      activeOpacity={0.84}
      onPress={onPress}
    >
      <View style={styles.deityImageArea}>
        {cardImage ? (
          <Image source={cardImage} style={styles.deityImage} resizeMode="cover" />
        ) : (
          <View style={styles.deitySymbolArea}>
            <Text style={styles.deitySymbolText}>{deity.symbol}</Text>
          </View>
        )}
      </View>
      <View style={styles.deityNameBar}>
        <Text style={[styles.deityName, selected && styles.selectedLabel]} numberOfLines={1}>
          {deity.englishName}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function MantraListRow({
  mantra,
  rank,
  isPlaying,
  isFavorite,
  onPress,
  onPlay,
  onFavorite,
}) {
  const deity = getDeityById(mantra.deityId);
  const category = getCategoryById(mantra.categoryId);

  return (
    <TouchableOpacity style={styles.mantraRow} activeOpacity={0.84} onPress={onPress}>
      <View style={styles.rankCircle}>
        <Text style={styles.rankText}>{rank}</Text>
      </View>

      <View style={styles.rowCopy}>
        <Text style={styles.rowTitle} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.78}>
          {mantra.title}
        </Text>
        <Text style={styles.rowMeta} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.76}>
          {`${deity.englishName}  |  ${category.label}`}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.rowIconButton, isPlaying && styles.activeIconButton]}
        activeOpacity={0.8}
        onPress={(event) => {
          event?.stopPropagation?.();
          onPlay();
        }}
      >
        <Text style={styles.rowIconText}>{isPlaying ? '\u275a\u275a' : '\u25b6'}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.rowIconButton, isFavorite && styles.favoriteButton]}
        activeOpacity={0.8}
        onPress={(event) => {
          event?.stopPropagation?.();
          onFavorite();
        }}
      >
        <Text style={[styles.rowIconText, isFavorite && styles.favoriteText]}>
          {isFavorite ? '\u2665' : '\u2661'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

function BottomNav({ navigation, responsiveStyles }) {
  return (
    <View style={[styles.bottomNav, responsiveStyles.bottomNav]}>
      <View style={styles.bottomNavInner}>
        {BOTTOM_NAV_ITEMS.map((item) => {
          const isSelected = item.screen === 'Mantras';

          return (
            <TouchableOpacity
              key={item.screen}
              style={[styles.bottomNavItem, isSelected && styles.bottomNavItemSelected]}
              activeOpacity={0.82}
              onPress={() => navigation?.navigate?.(item.screen)}
            >
              <Image source={item.image} style={styles.bottomNavIcon} resizeMode="contain" />
              <Text style={[styles.bottomNavLabel, isSelected && styles.bottomNavLabelSelected]} numberOfLines={1}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 247, 228, 0.76)',
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    alignItems: 'center',
  },
  topRow: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 9,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 250, 238, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(216, 177, 92, 0.54)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8A5A12',
    shadowOpacity: 0.11,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  backLotus: {
    width: 27,
    height: 17,
    opacity: 0.9,
  },
  backChevron: {
    position: 'absolute',
    left: 8,
    top: 8,
    color: '#5C3A0E',
    fontSize: 17,
    fontWeight: '900',
  },
  searchBox: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 251, 241, 0.97)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(216, 177, 92, 0.52)',
    paddingHorizontal: 13,
    shadowColor: '#8A5A12',
    shadowOpacity: 0.09,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  searchIcon: {
    color: '#A36A12',
    fontSize: 17,
    fontWeight: '900',
    marginRight: 7,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    color: '#4A2E14',
    fontSize: 13,
    fontWeight: '800',
    paddingVertical: 0,
  },
  sectionBlock: {
    alignSelf: 'center',
    marginTop: 12,
  },
  compactSectionBlock: {
    marginTop: 10,
  },
  sectionHeader: {
    minHeight: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 7,
  },
  sectionTitle: {
    color: '#3F2713',
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '900',
  },
  viewAllText: {
    color: '#A36A12',
    fontSize: 12,
    fontWeight: '900',
  },
  deityScroller: {
    paddingBottom: 3,
  },
  deityCard: {
    backgroundColor: 'rgba(255, 250, 239, 0.98)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(216, 177, 92, 0.48)',
    overflow: 'hidden',
    marginRight: 9,
    shadowColor: '#7A552A',
    shadowOpacity: 0.11,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  selectedDeityCard: {
    borderColor: '#D0A23A',
    backgroundColor: '#FFF2C8',
  },
  deityImageArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5DFA4',
    overflow: 'hidden',
  },
  deityImage: {
    width: '100%',
    height: '100%',
    alignSelf: 'center',
    transform: [{ scale: 1.15 }],
  },
  deitySymbolArea: {
    flex: 1,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8E7BD',
  },
  deitySymbolText: {
    color: '#8A520B',
    fontFamily: DEVOTIONAL_FONT,
    fontSize: 27,
    fontWeight: '900',
  },
  deityNameBar: {
    minHeight: 27,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    backgroundColor: 'rgba(255, 250, 239, 0.97)',
  },
  deityName: {
    color: '#4B2E16',
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '900',
    textAlign: 'center',
  },
  selectedLabel: {
    color: '#3F2713',
  },
  mantraRow: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 250, 239, 0.97)',
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'rgba(216, 177, 92, 0.45)',
    paddingVertical: 8,
    paddingHorizontal: 9,
    marginBottom: 8,
    shadowColor: '#7A552A',
    shadowOpacity: 0.1,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  rankCircle: {
    width: 25,
    height: 25,
    borderRadius: 12.5,
    backgroundColor: '#F5D98F',
    borderWidth: 1,
    borderColor: 'rgba(198, 140, 27, 0.44)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },
  rankText: {
    color: '#6B4210',
    fontSize: 11,
    fontWeight: '900',
  },
  rowCopy: {
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  rowTitle: {
    color: '#3F2713',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '900',
  },
  rowMeta: {
    color: '#8A6425',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '800',
    marginTop: 2,
  },
  rowIconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF1C5',
    borderWidth: 1,
    borderColor: 'rgba(216, 168, 63, 0.58)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 5,
  },
  activeIconButton: {
    backgroundColor: '#F3D27D',
    borderColor: '#D0A23A',
  },
  favoriteButton: {
    backgroundColor: 'rgba(255, 225, 120, 0.62)',
    borderColor: '#D8A12D',
  },
  rowIconText: {
    color: '#8A520B',
    fontSize: 12,
    fontWeight: '900',
  },
  favoriteText: {
    color: '#B15C12',
  },
  emptyCard: {
    minHeight: 58,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(216, 177, 92, 0.4)',
    backgroundColor: 'rgba(255, 250, 239, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  emptyText: {
    color: '#8A6425',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(255, 247, 228, 0.7)',
  },
  bottomNavInner: {
    minHeight: 58,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 250, 239, 0.98)',
    borderWidth: 1,
    borderColor: 'rgba(216, 177, 92, 0.5)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowColor: '#6F4716',
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: -3 },
    elevation: 8,
  },
  bottomNavItem: {
    flex: 1,
    minWidth: 0,
    height: 52,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
  },
  bottomNavItemSelected: {
    backgroundColor: '#F3D27D',
  },
  bottomNavIcon: {
    width: 23,
    height: 23,
    marginBottom: 3,
  },
  bottomNavLabel: {
    color: '#7A5520',
    fontSize: 10,
    fontWeight: '900',
    textAlign: 'center',
  },
  bottomNavLabelSelected: {
    color: '#3F2713',
  },
});
