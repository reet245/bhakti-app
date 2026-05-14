import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { upcomingFestivals } from '../data/festivalData';
import { useLanguage } from '../context/LanguageContext';

export default function UpcomingFestivalsScreen() {
  const { t } = useLanguage();
  const months = t('months');

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.headerIcon}>*</Text>
        <Text style={styles.title}>{t('upcomingFestivals')}</Text>
        <Text style={styles.subtitle}>{t('importantVratFestivals')}</Text>
      </View>

      <View style={styles.cardList}>
        {upcomingFestivals.map((festival) => (
          <View key={festival.id} style={styles.card}>
            <View style={styles.iconWrap}>
              <Text style={styles.icon}>{festival.icon}</Text>
            </View>

            <View style={styles.cardCopy}>
              <Text style={styles.cardTitle}>
                {t(festival.titleKey) || festival.fallbackTitle}
              </Text>
              <Text style={styles.cardDate}>
                {festival.day} {months[festival.month]} {festival.year}
              </Text>
              <Text style={styles.cardNote}>
                {t(festival.noteKey) || festival.fallbackNote}
              </Text>
            </View>

            <Text style={styles.actionText}>{t('viewDetails')}</Text>
          </View>
        ))}
      </View>
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
    paddingTop: 26,
    paddingBottom: 34,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerIcon: {
    color: '#B87918',
    fontSize: 36,
    fontWeight: '900',
    marginBottom: 8,
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
    marginTop: 6,
  },
  cardList: {
    gap: 14,
  },
  card: {
    minHeight: 112,
    backgroundColor: '#FFF8E8',
    borderRadius: 20,
    padding: 16,
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
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F8EFD8',
    borderWidth: 1,
    borderColor: '#E8D3A2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  icon: {
    color: '#B87918',
    fontSize: 24,
    fontWeight: '900',
  },
  cardCopy: {
    flex: 1,
  },
  cardTitle: {
    color: '#4B2E16',
    fontSize: 17,
    fontWeight: '900',
  },
  cardDate: {
    color: '#8A6A3F',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 5,
  },
  cardNote: {
    color: '#B87918',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 7,
  },
  actionText: {
    color: '#B87918',
    fontSize: 11,
    fontWeight: '900',
    marginLeft: 12,
  },
});
