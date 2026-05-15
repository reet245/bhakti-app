import { useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { festivals } from '../data/festivalData';
import { useLanguage } from '../context/LanguageContext';

const tabs = [
  { id: 'upcoming', labelKey: 'upcoming' },
  { id: 'past', labelKey: 'pastFestivals' },
];

const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function parseFestivalDate(dateISO) {
  return new Date(`${dateISO}T00:00:00`);
}

function getTodayStart() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function groupFestivalsByMonth(items) {
  return items.reduce((sections, festival) => {
    const date = parseFestivalDate(festival.dateISO);
    const monthIndex = date.getMonth();
    const monthTitle = monthNames[monthIndex];
    const sectionId = `${date.getFullYear()}-${String(monthIndex + 1).padStart(2, '0')}`;
    const existingSection = sections.find((section) => section.id === sectionId);

    if (existingSection) {
      existingSection.festivals.push(festival);
      return sections;
    }

    sections.push({
      id: sectionId,
      title: monthTitle,
      festivals: [festival],
    });

    return sections;
  }, []);
}

function FestivalSticker({ festival }) {
  return (
    <View style={styles.festivalImageWrap}>
      {festival.image ? (
        <Image source={festival.image} style={styles.festivalImage} resizeMode="cover" />
      ) : (
        <View style={styles.placeholderMark}>
          <View style={styles.placeholderFlame} />
          <View style={styles.placeholderBase} />
        </View>
      )}
    </View>
  );
}

export default function UpcomingFestivalsScreen() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('upcoming');

  const festivalSections = useMemo(() => {
    const today = getTodayStart();
    const sortedFestivals = [...festivals].sort(
      (first, second) => parseFestivalDate(first.dateISO) - parseFestivalDate(second.dateISO),
    );
    const visibleFestivals = sortedFestivals.filter((festival) => {
      const festivalDate = parseFestivalDate(festival.dateISO);
      return activeTab === 'upcoming' ? festivalDate >= today : festivalDate < today;
    });

    return groupFestivalsByMonth(visibleFestivals);
  }, [activeTab]);

  const emptyMessage = activeTab === 'upcoming'
    ? 'No upcoming festivals found.'
    : 'No past festivals found.';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{t('upcomingFestivals')}</Text>
        <Text style={styles.subtitle}>{t('stayConnectedCelebrations')}</Text>
      </View>

      <View style={styles.tabRow}>
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;

          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabButton, isActive && styles.tabButtonActive]}
              onPress={() => setActiveTab(tab.id)}
              activeOpacity={0.82}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {t(tab.labelKey)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {festivalSections.length > 0 ? (
        <View style={styles.sectionList}>
          {festivalSections.map((section) => (
            <View key={section.id} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>

              <View style={styles.cardList}>
                {section.festivals.map((festival) => (
                  <View key={festival.id} style={styles.card}>
                    <FestivalSticker festival={festival} />

                    <View style={styles.cardCopy}>
                      <Text style={styles.cardTitle} numberOfLines={2}>
                        {festival.name}
                      </Text>
                      <Text style={styles.cardDate}>{festival.dateText}</Text>
                      <Text style={styles.cardMeaning} numberOfLines={2}>
                        {festival.meaning}
                      </Text>
                    </View>

                    <Text style={styles.arrow}>›</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>{emptyMessage}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8EFD8',
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 30,
    paddingBottom: 34,
  },
  header: {
    alignItems: 'center',
    marginBottom: 18,
  },
  title: {
    color: '#4B2E16',
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
  },
  subtitle: {
    color: '#8A6A3F',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 7,
    lineHeight: 18,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#EFE0BC',
    borderRadius: 18,
    padding: 4,
    marginBottom: 18,
  },
  tabButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#FFF8E8',
    shadowColor: '#8A6A3F',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  tabText: {
    color: '#8A6A3F',
    fontSize: 12,
    fontWeight: '900',
  },
  tabTextActive: {
    color: '#4B2E16',
  },
  sectionList: {
    gap: 22,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    color: '#4B2E16',
    fontSize: 20,
    fontWeight: '900',
    paddingHorizontal: 2,
  },
  cardList: {
    gap: 12,
  },
  card: {
    minHeight: 116,
    backgroundColor: '#FFF8E8',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E8D3A2',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#8A6A3F',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  festivalImageWrap: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: 'rgba(216, 168, 74, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(200, 148, 46, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginRight: 14,
  },
  festivalImage: {
    width: '100%',
    height: '100%',
  },
  placeholderMark: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderFlame: {
    width: 18,
    height: 26,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 18,
    backgroundColor: 'rgba(184, 121, 24, 0.55)',
    transform: [{ rotate: '45deg' }],
  },
  placeholderBase: {
    width: 34,
    height: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(184, 121, 24, 0.35)',
    marginTop: 2,
  },
  cardCopy: {
    flex: 1,
  },
  cardTitle: {
    color: '#4B2E16',
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 20,
  },
  cardDate: {
    color: '#8A6A3F',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 5,
  },
  cardMeaning: {
    color: '#5E4220',
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 17,
    marginTop: 6,
  },
  arrow: {
    color: '#B87918',
    fontSize: 28,
    fontWeight: '300',
    marginLeft: 10,
  },
  emptyCard: {
    minHeight: 160,
    backgroundColor: '#FFF8E8',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8D3A2',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 22,
    shadowColor: '#8A6A3F',
    shadowOpacity: 0.10,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  emptyText: {
    color: '#8A6A3F',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
});
