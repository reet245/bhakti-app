import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { useLanguage } from '../context/LanguageContext';

// ============================================================
// MantrasScreen — dedicated screen for sacred mantras
// Accessible via: HomeScreen → Mantras button
// ============================================================

// Mantra data — expand this array to add more mantras
const MANTRAS = [
  {
    id: 'gayatri',
    nameKey: 'gayatriMantra',
    deityKey: 'suryaSavitri',
    icon: '☀️',
    sanskrit: 'ॐ भूर्भुवः स्वः\nतत्सवितुर्वरेण्यं\nभर्गो देवस्य धीमहि\nधियो यो नः प्रचोदयात्',
    transliteration: 'Om Bhūr Bhuvaḥ Svaḥ\nTat Savitur Vareṇyaṁ\nBhargo Devasya Dhīmahi\nDhiyo Yo Naḥ Prachodayāt',
    meaningKey: 'gayatriMeaning',
    benefit: 'Wisdom · Clarity · Spiritual awakening',
  },
  {
    id: 'hanuman',
    nameKey: 'hanumanChalisa',
    deityKey: 'hanuman',
    icon: '🚩',
    sanskrit: 'श्रीगुरु चरन सरोज रज\nनिज मनु मुकुरु सुधारि\nबरनउँ रघुबर बिमल जसु\nजो दायकु फल चारि',
    transliteration: 'Shri Guru Charan Saroj Raj\nNija Manu Mukuru Sudhari\nBaranaun Raghubar Bimal Jasu\nJo Daayaku Phala Chari',
    meaningKey: 'hanumanMeaning',
    benefit: 'Courage · Protection · Devotion',
  },
];

export default function MantrasScreen({ navigation }) {
  const { t } = useLanguage();

  return (
    <View style={styles.container}>

      {/* Screen header */}
      <View style={styles.header}>
        <Text style={styles.headerEmoji}>🕉️</Text>
        <Text style={styles.headerTitle}>{t('sacredMantras')}</Text>
        <Text style={styles.headerSubtitle}>
          {t('ancientVibrations')}
        </Text>
        <View style={styles.headerDivider} />
      </View>

      {/* Mantra cards in a horizontal row */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.cardsRow}>
          {MANTRAS.map((mantra) => (
            <View key={mantra.id} style={styles.card}>

              {/* Card top — deity icon + mantra name */}
              <View style={styles.cardHeader}>
                <Text style={styles.cardIcon}>{mantra.icon}</Text>
                <Text style={styles.cardName}>{t(mantra.nameKey)}</Text>
                <Text style={styles.cardDeity}>{t(mantra.deityKey)}</Text>
              </View>

              {/* Gold divider */}
              <View style={styles.cardDivider} />

              {/* Sanskrit text */}
              <Text style={styles.sanskritLabel}>{t('sanskrit')}</Text>
              <Text style={styles.sanskritText}>{mantra.sanskrit}</Text>

              {/* Transliteration */}
              <Text style={styles.translitLabel}>{t('transliteration')}</Text>
              <Text style={styles.translitText}>{mantra.transliteration}</Text>

              {/* Meaning */}
              <Text style={styles.meaningLabel}>{t('meaning')}</Text>
              <Text style={styles.meaningText}>{t(mantra.meaningKey)}</Text>

              {/* Benefit chip */}
              <View style={styles.benefitChip}>
                <Text style={styles.benefitText}>{t(mantra.benefitKey)}</Text>
              </View>

            </View>
          ))}
        </View>
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#0f1528',
  },

  // --- Header section ---
  header: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#e0d7ff',
    letterSpacing: 1.2,
    textAlign: 'center',
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6c63a8',
    fontStyle: 'italic',
    letterSpacing: 0.5,
    textAlign: 'center',
    marginBottom: 18,
  },
  headerDivider: {
    width: 60,
    height: 1.5,
    backgroundColor: '#e8b849',
    borderRadius: 2,
  },

  // --- Scroll content ---
  scrollContent: {
    paddingHorizontal: 14,
    paddingBottom: 32,
  },

  // Two cards side by side in one row
  cardsRow: {
    flexDirection: 'row',
    gap: 12,
  },

  // --- Individual mantra card ---
  card: {
    flex: 1,                     // each card takes equal width in the row
    backgroundColor: '#1a2240',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2e3a5e',
    // Subtle purple glow shadow
    shadowColor: '#6c63ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 5,
  },

  // Card top block
  cardHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  cardIcon: {
    fontSize: 32,
    marginBottom: 6,
  },
  cardName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#e0d7ff',
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  cardDeity: {
    fontSize: 11,
    color: '#e8b849',
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  // Gold rule inside card
  cardDivider: {
    height: 1,
    backgroundColor: 'rgba(232, 184, 73, 0.35)',
    marginBottom: 12,
    borderRadius: 1,
  },

  // Sanskrit block
  sanskritLabel: {
    fontSize: 9,
    color: '#6c63a8',
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  sanskritText: {
    fontSize: 11,
    color: '#c8b8ff',
    lineHeight: 18,
    marginBottom: 10,
    fontStyle: 'italic',
  },

  // Transliteration block
  translitLabel: {
    fontSize: 9,
    color: '#6c63a8',
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  translitText: {
    fontSize: 10,
    color: '#a89ec9',
    lineHeight: 16,
    marginBottom: 10,
  },

  // Meaning block
  meaningLabel: {
    fontSize: 9,
    color: '#6c63a8',
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  meaningText: {
    fontSize: 11,
    color: '#c0b8e0',
    lineHeight: 16,
    marginBottom: 12,
  },

  // Benefit chip at card bottom
  benefitChip: {
    backgroundColor: 'rgba(232, 184, 73, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(232, 184, 73, 0.30)',
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 10,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  benefitText: {
    fontSize: 10,
    color: '#e8b849',
    fontWeight: '600',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
});
