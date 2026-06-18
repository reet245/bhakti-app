import { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import BhaktiBackButton from '../components/BhaktiBackButton';
import { useLanguage } from '../context/LanguageContext';

// ============================================================
// HELPER FUNCTIONS (outside component for performance)
// ============================================================

// ---------------------------------------------------------
// STEP 1: Prediction function (KEPT from original)
// ---------------------------------------------------------
function getPredictions(dob) {
  const day = parseInt(dob) || 1;

  const careerOptions = [
    "You have strong leadership qualities. A career in management or business suits you well.",
    "Your creative mind makes you ideal for artistic or design-related fields.",
    "You are analytical and detail-oriented. Technology or finance is your strength.",
    "Your communication skills are exceptional. Teaching, writing, or media will bring success.",
    "You are a natural problem solver. Engineering or research fields will flourish.",
  ];
  const career = careerOptions[day % careerOptions.length];

  const healthOptions = [
    "Your constitution is strong. Maintain it with regular exercise and a balanced diet.",
    "Pay attention to your digestive health. Warm foods and herbal teas will benefit you.",
    "Your energy levels are high but can fluctuate. Yoga and meditation will bring balance.",
    "You may be sensitive to seasonal changes. Keep your immunity strong with proper nutrition.",
  ];
  const health = healthOptions[day % healthOptions.length];

  const relationshipOptions = [
    "You are loyal and caring. Deep, meaningful relationships bring you the most joy.",
    "You value independence in relationships. A partner who respects your space is ideal.",
    "Your warm personality attracts many people. Family bonds are especially important to you.",
    "You are a thoughtful partner. Open communication will strengthen your relationships.",
    "You have a nurturing nature. You bring harmony and peace to those around you.",
  ];
  const relationship = relationshipOptions[day % relationshipOptions.length];

  return { career, health, relationship };
}

// ---------------------------------------------------------
// STEP 3: Planet placement logic
// ---------------------------------------------------------
// The 9 Vedic planets (Navagraha):
//   Sun (Su), Moon (Mo), Mars (Ma), Mercury (Me),
//   Jupiter (Ju), Venus (Ve), Saturn (Sa), Rahu (Ra), Ketu (Ke)
//
// HOW THIS WORKS:
//   We extract the day and a "time number" from the user's DOB and TOB.
//   Then we use modulo (%) to assign each planet to a house (1–12).
//   Different planets use different offsets so they spread across the chart.
//   This is SIMULATED — a real engine would use astronomical ephemeris data.
function generateKundliData(dob, tob) {
  // Extract numbers from DOB and TOB
  const day = parseInt(dob) || 1;
  const timeNum = parseInt(tob) || 6; // e.g. "09:30" → 9

  // Base seed combines day and time for variety
  const seed = day + timeNum;

  // The 9 planets with their abbreviations and unique offset
  const planets = [
    { name: 'Su', full: 'Sun',     offset: 0 },
    { name: 'Mo', full: 'Moon',    offset: 3 },
    { name: 'Ma', full: 'Mars',    offset: 5 },
    { name: 'Me', full: 'Mercury', offset: 7 },
    { name: 'Ju', full: 'Jupiter', offset: 2 },
    { name: 'Ve', full: 'Venus',   offset: 9 },
    { name: 'Sa', full: 'Saturn',  offset: 4 },
    { name: 'Ra', full: 'Rahu',    offset: 6 },
    { name: 'Ke', full: 'Ketu',    offset: 11 },
  ];

  // Initialize 12 houses (each house is an empty array)
  const houses = {};
  for (let i = 1; i <= 12; i++) {
    houses[i] = [];
  }

  // Assign each planet to a house
  // Formula: (seed + planet's unique offset) % 12 gives a number 0–11
  // We add 1 to make it 1–12 (matching house numbers)
  planets.forEach((planet) => {
    const houseNum = ((seed + planet.offset) % 12) + 1;
    houses[houseNum].push(planet.name);
  });

  return houses;
}

// ---------------------------------------------------------
// STEP 5: {t('kundliDetails')} — Lagna, Moon Sign, Sun Sign
// ---------------------------------------------------------
// The 12 Zodiac signs (Rashis) in Vedic order
const RASHIS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer',
  'Leo', 'Virgo', 'Libra', 'Scorpio',
  'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

// Hindi/Sanskrit names for the signs
const RASHI_HINDI = [
  'Mesh', 'Vrishabh', 'Mithun', 'Kark',
  'Simha', 'Kanya', 'Tula', 'Vrishchik',
  'Dhanu', 'Makar', 'Kumbh', 'Meen',
];

function getKundliDetails(dob, tob) {
  const day = parseInt(dob) || 1;
  const timeNum = parseInt(tob) || 6;

  // Ascendant (Lagna) — primarily determined by time of birth
  // The lagna changes roughly every 2 hours, so we use timeNum
  const lagnaIndex = (timeNum + day) % 12;

  // Moon Sign — primarily determined by date
  const moonIndex = (day * 3 + timeNum) % 12;

  // Sun Sign — roughly based on month (simplified)
  // Extract month from "DD/MM/YYYY" format
  const parts = String(dob).split('/');
  const month = parseInt(parts[1]) || 1;
  const sunIndex = (month - 1) % 12;

  return {
    lagna: RASHIS[lagnaIndex],
    lagnaHindi: RASHI_HINDI[lagnaIndex],
    moonSign: RASHIS[moonIndex],
    moonSignHindi: RASHI_HINDI[moonIndex],
    sunSign: RASHIS[sunIndex],
    sunSignHindi: RASHI_HINDI[sunIndex],
  };
}

// ============================================================
// COMPONENT
// ============================================================
export default function KundliResultScreen({ navigation, route }) {
  const { t } = useLanguage();
  const {
    name = "Unknown",
    dob = "Unknown",
    tob = "Unknown",
    place = "Unknown",
  } = route.params || {};

  // Generate all data
  const predictions = getPredictions(dob);
  const houses = generateKundliData(dob, tob);
  const details = getKundliDetails(dob, tob);

  // Tab state — controls which section is visible
  const [activeTab, setActiveTab] = useState('Chart');
  console.log(activeTab);

  // Compute zodiac sign for each house based on Lagna
  // House 1 gets the Lagna sign, House 2 gets next sign, etc.
  const lagnaIndex = RASHIS.indexOf(details.lagna);
  function getHouseSign(houseNum) {
    return RASHIS[(lagnaIndex + houseNum - 1) % 12];
  }

  // Render a single planet as a golden pill badge
  function PlanetBadge({ name }) {
    return (
      <View style={styles.planetBadge}>
        <Text style={styles.planetBadgeText}>{name}</Text>
      </View>
    );
  }

  // Render a single house cell with number, zodiac label, and planet badges
  function renderHouse(houseNum) {
    const planetList = houses[houseNum] || [];
    const sign = getHouseSign(houseNum);
    return (
      <View style={styles.houseCell}>
        {/* House number + zodiac in top-left corner */}
        <View style={styles.houseHeader}>
          <Text style={styles.houseNumber}>{houseNum}</Text>
          <Text style={styles.houseSign}>{sign}</Text>
        </View>
        {/* Planet badges */}
        <View style={styles.planetContainer}>
          {planetList.map((planet, i) => (
            <PlanetBadge key={i} name={planet} />
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <BhaktiBackButton navigation={navigation} style={styles.backButton} />
        <Text style={styles.emoji}>📜</Text>
        <Text style={styles.heading}>{t('kundli')}</Text>
        <Text style={styles.subtitle}>{t('celestialBlueprint')}</Text>

        {/* =====================================================
            BIRTH DETAILS CARD (kept from original)
            ===================================================== */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('birthDetails')}</Text>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.label}>{t('name')}:</Text>
            <Text style={styles.value}>{name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>{t('dateOfBirth')}:</Text>
            <Text style={styles.value}>{dob}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>{t('timeOfBirth')}:</Text>
            <Text style={styles.value}>{tob}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>{t('placeOfBirth')}:</Text>
            <Text style={styles.value}>{place}</Text>
          </View>
        </View>

        {/* =====================================================
            TAB BAR
            ===================================================== */}
        <View style={styles.tabRow}>
          {[
            { id: 'Chart', labelKey: 'chart' },
            { id: 'Predictions', labelKey: 'predictions' },
            { id: 'Planets', labelKey: 'planets' },
            { id: 'Dosha', labelKey: 'dosha' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tabButton,
                activeTab === tab.id && styles.tabButtonActive,
              ]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab.id && styles.tabTextActive,
                ]}
              >{t(tab.labelKey)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Show chart + details ONLY when Chart tab is active */}
        {activeTab === 'Chart' && (
        <>
        {/* =====================================================
            STEP 1 & 2: NORTH INDIAN KUNDLI CHART
            =====================================================
            Layout: 4×4 grid representing the 12 houses.
            
            ┌──────┬──────┬──────┬──────┐
            │  12  │   1  │   2  │   3  │
            ├──────┼──────┴──────┼──────┤
            │  11  │   (center)  │   4  │
            ├──────┤    Name     ├──────┤
            │  10  │   Lagna     │   5  │
            ├──────┼──────┬──────┼──────┤
            │   9  │   8  │   7  │   6  │
            └──────┴──────┴──────┴──────┘

            Houses go COUNTER-CLOCKWISE starting from
            House 1 (Ascendant) at top-center.
            ===================================================== */}
        <View style={styles.chartWrapper}>
          <Text style={styles.chartTitle}>🕉️ {t('birthChart')}</Text>
          <Text style={styles.chartSubtitle}>{t('northIndianStyle')} ? Lagna: {details.lagna}</Text>

          <View style={styles.chartContainer}>
            {/* --- Top Row: Houses 12, 1, 2, 3 --- */}
            <View style={styles.chartRow}>
              {renderHouse(12)}
              {renderHouse(1)}
              {renderHouse(2)}
              {renderHouse(3)}
            </View>

            {/* --- Middle Section --- */}
            <View style={styles.chartMiddle}>
              <View style={styles.chartSideCol}>
                {renderHouse(11)}
                {renderHouse(10)}
              </View>

              {/* Center: name, lagna, and rashi */}
              <View style={styles.chartCenter}>
                <Text style={styles.centerLabel}>LAGNA</Text>
                <Text style={styles.centerSign}>{details.lagna}</Text>
                <Text style={styles.centerSignHindi}>({details.lagnaHindi})</Text>
                <View style={styles.centerDivider} />
                <Text style={styles.centerName}>{name}</Text>
                <Text style={styles.centerDob}>{dob} • {tob}</Text>
              </View>

              <View style={styles.chartSideCol}>
                {renderHouse(4)}
                {renderHouse(5)}
              </View>
            </View>

            {/* --- Bottom Row: Houses 9, 8, 7, 6 --- */}
            <View style={styles.chartRow}>
              {renderHouse(9)}
              {renderHouse(8)}
              {renderHouse(7)}
              {renderHouse(6)}
            </View>
          </View>

          {/* Planet legend — 3 columns */}
          <View style={styles.legendContainer}>
            <Text style={styles.legendTitle}>{t('navagrahaLegend')}</Text>
            <View style={styles.legendGrid}>
              <Text style={styles.legendItem}>☉ Su = Sun</Text>
              <Text style={styles.legendItem}>☽ Mo = Moon</Text>
              <Text style={styles.legendItem}>♂ Ma = Mars</Text>
              <Text style={styles.legendItem}>☿ Me = Mercury</Text>
              <Text style={styles.legendItem}>♃ Ju = Jupiter</Text>
              <Text style={styles.legendItem}>♀ Ve = Venus</Text>
              <Text style={styles.legendItem}>♄ Sa = Saturn</Text>
              <Text style={styles.legendItem}>☊ Ra = Rahu</Text>
              <Text style={styles.legendItem}>☋ Ke = Ketu</Text>
            </View>
          </View>
        </View>

        {/* =====================================================
            STEP 5: KUNDLI DETAILS CARD
            ===================================================== */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>?? {t('kundliDetails')}</Text>
          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('ascendantLagna')}:</Text>
            <Text style={styles.detailValue}>{details.lagna} ({details.lagnaHindi})</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('moonSignRashi')}:</Text>
            <Text style={styles.detailValue}>{details.moonSign} ({details.moonSignHindi})</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('sunSign')}:</Text>
            <Text style={styles.detailValue}>{details.sunSign} ({details.sunSignHindi})</Text>
          </View>
        </View>
        </>
        )}

        {/* Show predictions ONLY when Predictions tab is active */}
        {activeTab === 'Predictions' && (
        <>
        {/* =====================================================
            KUNDLI INSIGHTS (kept from original)
            ===================================================== */}
        <View style={styles.insightsCard}>
          <Text style={styles.insightsTitle}>🔮 {t('kundliInsights')}</Text>
          <View style={styles.divider} />

          <View style={styles.insightBlock}>
            <Text style={styles.insightLabel}>💼 {t('career')}</Text>
            <Text style={styles.insightText}>{predictions.career}</Text>
          </View>

          <View style={styles.insightBlock}>
            <Text style={styles.insightLabel}>🏥 {t('health')}</Text>
            <Text style={styles.insightText}>{predictions.health}</Text>
          </View>

          <View style={styles.insightBlock}>
            <Text style={styles.insightLabel}>❤️ {t('relationship')}</Text>
            <Text style={styles.insightText}>{predictions.relationship}</Text>
          </View>
        </View>
        </>
        )}

        {/* Show planets list ONLY when Planets tab is active */}
        {activeTab === 'Planets' && (
        <View style={styles.planetsCard}>
          <Text style={styles.planetsTitle}>🪐 {t('planetaryPositions')}</Text>
          <View style={styles.divider} />

          {/* Build list: for each planet, find which house it's in */}
          {[
            { symbol: '☉', abbr: 'Su', full: 'Sun' },
            { symbol: '☽', abbr: 'Mo', full: 'Moon' },
            { symbol: '♂', abbr: 'Ma', full: 'Mars' },
            { symbol: '☿', abbr: 'Me', full: 'Mercury' },
            { symbol: '♃', abbr: 'Ju', full: 'Jupiter' },
            { symbol: '♀', abbr: 'Ve', full: 'Venus' },
            { symbol: '♄', abbr: 'Sa', full: 'Saturn' },
            { symbol: '☊', abbr: 'Ra', full: 'Rahu' },
            { symbol: '☋', abbr: 'Ke', full: 'Ketu' },
          ].map((planet) => {
            // Find which house this planet is in
            const houseNum = Object.keys(houses).find(
              (h) => houses[h].includes(planet.abbr)
            ) || '?';
            const sign = getHouseSign(Number(houseNum));
            return (
              <View key={planet.abbr} style={styles.planetRow}>
                <View style={styles.planetRowLeft}>
                  <Text style={styles.planetSymbol}>{planet.symbol}</Text>
                  <Text style={styles.planetFullName}>{planet.full}</Text>
                </View>
                <View style={styles.planetRowRight}>
                  <Text style={styles.planetHouse}>{t('house')} {houseNum}</Text>
                  <Text style={styles.planetSignText}>{sign}</Text>
                </View>
              </View>
            );
          })}
        </View>
        )}

        {/* Show dosha analysis ONLY when Dosha tab is active */}
        {activeTab === 'Dosha' && (
        <View style={styles.doshaContainer}>
          <Text style={styles.doshaMainTitle}>⚠️ {t('doshaAnalysis')}</Text>
          <View style={styles.divider} />

          {/* --- {t('mangalDosha')} --- */}
          {(() => {
            // Mangal Dosha: Mars in houses 1, 2, 4, 7, 8, or 12 = Manglik
            const marsHouse = Number(Object.keys(houses).find(
              (h) => houses[h].includes('Ma')
            ) || 0);
            const isManglik = [1, 2, 4, 7, 8, 12].includes(marsHouse);
            return (
              <View style={[styles.doshaCard, isManglik && styles.doshaCardActive]}>
                <View style={styles.doshaHeader}>
                  <Text style={styles.doshaIcon}>♂</Text>
                  <Text style={styles.doshaName}>{t('mangalDosha')}</Text>
                  <View style={[styles.doshaStatus, isManglik ? styles.statusActive : styles.statusClear]}>
                    <Text style={styles.doshaStatusText}>{isManglik ? t('active') : t('clear')}</Text>
                  </View>
                </View>
                <Text style={styles.doshaDetail}>Mars is in {t('house')} {marsHouse} ({getHouseSign(marsHouse)})</Text>
                <Text style={styles.doshaDesc}>
                  {isManglik
                    ? 'Mangal Dosha is present. Mars in this house may affect marriage and relationships. Remedies include Hanuman Chalisa and visiting Mangal temples.'
                    : 'No Mangal Dosha detected. Mars is in a favorable position for relationships and partnerships.'}
                </Text>
              </View>
            );
          })()}

          {/* --- {t('shaniInfluence')} --- */}
          {(() => {
            // Shani in houses 1, 4, 7, 8, 10, 12 = strong influence
            const saturnHouse = Number(Object.keys(houses).find(
              (h) => houses[h].includes('Sa')
            ) || 0);
            const isStrong = [1, 4, 7, 8, 10, 12].includes(saturnHouse);
            return (
              <View style={[styles.doshaCard, isStrong && styles.doshaCardActive]}>
                <View style={styles.doshaHeader}>
                  <Text style={styles.doshaIcon}>♄</Text>
                  <Text style={styles.doshaName}>{t('shaniInfluence')}</Text>
                  <View style={[styles.doshaStatus, isStrong ? styles.statusActive : styles.statusClear]}>
                    <Text style={styles.doshaStatusText}>{isStrong ? t('strong') : t('mild')}</Text>
                  </View>
                </View>
                <Text style={styles.doshaDetail}>Saturn is in {t('house')} {saturnHouse} ({getHouseSign(saturnHouse)})</Text>
                <Text style={styles.doshaDesc}>
                  {isStrong
                    ? 'Saturn has a strong influence from this house. This may bring delays but also discipline and long-term rewards. Shani Puja is recommended.'
                    : 'Saturn\'s influence is mild. You are likely to experience steady progress with fewer obstacles from Shani.'}
                </Text>
              </View>
            );
          })()}

          {/* --- {t('rahuKetuEffect')} --- */}
          {(() => {
            const rahuHouse = Number(Object.keys(houses).find(
              (h) => houses[h].includes('Ra')
            ) || 0);
            const ketuHouse = Number(Object.keys(houses).find(
              (h) => houses[h].includes('Ke')
            ) || 0);
            // Kaal Sarp hint: Rahu and Ketu are always 7 houses apart
            const isIntense = [1, 5, 7, 9].includes(rahuHouse);
            return (
              <View style={[styles.doshaCard, isIntense && styles.doshaCardActive]}>
                <View style={styles.doshaHeader}>
                  <Text style={styles.doshaIcon}>☊</Text>
                  <Text style={styles.doshaName}>{t('rahuKetuEffect')}</Text>
                  <View style={[styles.doshaStatus, isIntense ? styles.statusActive : styles.statusClear]}>
                    <Text style={styles.doshaStatusText}>{isIntense ? t('intense') : t('normal')}</Text>
                  </View>
                </View>
                <Text style={styles.doshaDetail}>Rahu ? {t('house')} {rahuHouse} ? Ketu ? {t('house')} {ketuHouse}</Text>
                <Text style={styles.doshaDesc}>
                  {isIntense
                    ? 'Rahu is in a significant house, amplifying desires and ambitions. Ketu opposite brings detachment. Rahu-Ketu Puja and Naga Dosha remedies may help.'
                    : 'Rahu-Ketu axis is in a moderate position. Their effects will be subtle and manageable through regular spiritual practice.'}
                </Text>
              </View>
            );
          })()}
        </View>
        )}

        {/* Disclaimer */}
        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerText}>
            ?? {t('simulatedKundliDisclaimer')}
          </Text>
        </View>

      </ScrollView>
    </View>
  );
}

// ============================================================
// STYLES
// ============================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f1528',
  },
  scrollContent: {
    padding: 20,
    alignItems: 'center',
    paddingBottom: 40,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  emoji: {
    fontSize: 56,
    marginBottom: 8,
  },
  heading: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#e0d7ff',
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 13,
    color: '#6c63a8',
    textAlign: 'center',
    marginBottom: 24,
    fontStyle: 'italic',
    letterSpacing: 0.5,
  },

  // --- Birth Details card ---
  card: {
    width: '100%',
    backgroundColor: '#1a2240',
    padding: 20,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#2e3a5e',
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#6c63ff',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  cardTitle: {
    color: '#e0d7ff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  divider: {
    height: 1.5,
    backgroundColor: '#e8b849',
    marginBottom: 14,
    borderRadius: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#1e2a4a',
  },
  label: {
    color: '#6c63a8',
    fontSize: 14,
    fontWeight: '500',
  },
  value: {
    color: '#e0d7ff',
    fontSize: 14,
    fontWeight: '600',
  },

  // =====================================================
  // KUNDLI CHART STYLES — AstroSage-inspired
  // =====================================================
  chartWrapper: {
    width: '100%',
    backgroundColor: '#111a30',
    padding: 18,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#e8b849',
    marginBottom: 20,
    elevation: 6,
    shadowColor: '#e8b849',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  chartTitle: {
    color: '#e8b849',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: 1.5,
  },
  chartSubtitle: {
    color: '#6c63a8',
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  chartContainer: {
    borderWidth: 2,
    borderColor: '#e8b849',
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#0a0f1e',
  },

  // --- Chart rows ---
  chartRow: {
    flexDirection: 'row',
  },
  chartMiddle: {
    flexDirection: 'row',
  },
  chartSideCol: {
    flex: 1,
  },

  // --- Individual house cell ---
  houseCell: {
    flex: 1,
    aspectRatio: 1,
    borderWidth: 0.8,
    borderColor: 'rgba(232, 184, 73, 0.4)',
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  houseHeader: {
    position: 'absolute',
    top: 2,
    left: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  houseNumber: {
    fontSize: 9,
    color: '#e8b849',
    fontWeight: 'bold',
  },
  houseSign: {
    fontSize: 7,
    color: '#4a4370',
    fontWeight: '500',
  },

  // --- Planet badges ---
  planetContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 3,
    marginTop: 6,
  },
  planetBadge: {
    backgroundColor: '#e8b849',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 10,
  },
  planetBadgeText: {
    fontSize: 9,
    color: '#0a0f1e',
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },

  // --- Center of chart ---
  chartCenter: {
    flex: 2,
    borderWidth: 0.8,
    borderColor: 'rgba(232, 184, 73, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    backgroundColor: 'rgba(232, 184, 73, 0.03)',
  },
  centerLabel: {
    fontSize: 9,
    color: '#6c63a8',
    letterSpacing: 2,
    fontWeight: '600',
    marginBottom: 2,
  },
  centerSign: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e8b849',
  },
  centerSignHindi: {
    fontSize: 11,
    color: '#6c63a8',
    fontStyle: 'italic',
    marginBottom: 6,
  },
  centerDivider: {
    width: 50,
    height: 1,
    backgroundColor: 'rgba(232, 184, 73, 0.3)',
    marginBottom: 6,
  },
  centerName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#e0d7ff',
    textAlign: 'center',
  },
  centerDob: {
    fontSize: 9,
    color: '#4a4370',
    marginTop: 2,
  },

  // --- Planet legend ---
  legendContainer: {
    marginTop: 14,
    backgroundColor: 'rgba(232, 184, 73, 0.05)',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(232, 184, 73, 0.15)',
  },
  legendTitle: {
    color: '#e8b849',
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 2,
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  legendItem: {
    width: '33%',
    fontSize: 9,
    color: '#6c63a8',
    marginBottom: 4,
    textAlign: 'center',
  },

  // --- Kundli Details card ---
  detailsCard: {
    width: '100%',
    backgroundColor: '#1a2240',
    padding: 20,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#2e3a5e',
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#6c63ff',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  detailsTitle: {
    color: '#e0d7ff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1e2a4a',
  },
  detailLabel: {
    color: '#6c63a8',
    fontSize: 13,
    fontWeight: '500',
  },
  detailValue: {
    color: '#e8b849',
    fontSize: 13,
    fontWeight: '600',
  },

  // --- Kundli Insights card ---
  insightsCard: {
    width: '100%',
    backgroundColor: '#1a2240',
    padding: 22,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#2e3a5e',
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#6c63ff',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  insightsTitle: {
    color: '#e0d7ff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  insightBlock: {
    marginBottom: 18,
    backgroundColor: '#0f1528',
    padding: 14,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#6c63ff',
  },
  insightLabel: {
    color: '#e8b849',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  insightText: {
    color: '#c8c0e0',
    fontSize: 13,
    lineHeight: 20,
  },

  // --- Disclaimer box ---
  disclaimerBox: {
    backgroundColor: '#1a2240',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2e3a5e',
    marginBottom: 20,
  },
  disclaimerText: {
    color: '#6c63a8',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 18,
    fontStyle: 'italic',
  },

  // --- Tab bar ---
  tabRow: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 20,
    gap: 6,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e8b849',
    backgroundColor: '#111a30',
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#e8b849',
    borderColor: '#e8b849',
  },
  tabText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#e8b849',
    letterSpacing: 0.5,
  },
  tabTextActive: {
    color: '#0f1528',
  },

  // --- Planets tab ---
  planetsCard: {
    width: '100%',
    backgroundColor: '#1a2240',
    padding: 20,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#2e3a5e',
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#6c63ff',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  planetsTitle: {
    color: '#e0d7ff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  planetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1e2a4a',
  },
  planetRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  planetSymbol: {
    fontSize: 18,
    color: '#e8b849',
  },
  planetFullName: {
    fontSize: 14,
    color: '#e0d7ff',
    fontWeight: '600',
  },
  planetRowRight: {
    alignItems: 'flex-end',
  },
  planetHouse: {
    fontSize: 13,
    color: '#e8b849',
    fontWeight: 'bold',
  },
  planetSignText: {
    fontSize: 10,
    color: '#6c63a8',
    fontStyle: 'italic',
  },

  // --- Dosha tab ---
  doshaContainer: {
    width: '100%',
    marginBottom: 20,
  },
  doshaMainTitle: {
    color: '#e0d7ff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  doshaCard: {
    backgroundColor: '#1a2240',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2e3a5e',
    marginBottom: 12,
  },
  doshaCardActive: {
    borderColor: '#e8b849',
    borderWidth: 1.5,
  },
  doshaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  doshaIcon: {
    fontSize: 20,
    color: '#e8b849',
  },
  doshaName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#e0d7ff',
    flex: 1,
  },
  doshaStatus: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusActive: {
    backgroundColor: 'rgba(232, 184, 73, 0.2)',
  },
  statusClear: {
    backgroundColor: 'rgba(108, 99, 168, 0.2)',
  },
  doshaStatusText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#e8b849',
    letterSpacing: 1,
  },
  doshaDetail: {
    fontSize: 12,
    color: '#6c63a8',
    marginBottom: 6,
  },
  doshaDesc: {
    fontSize: 12,
    color: '#c8c0e0',
    lineHeight: 18,
  },
});
