import { useContext, useState, useEffect } from 'react';
import { Modal, SafeAreaView, ScrollView, StyleSheet, Text, View, TouchableOpacity, Switch, useWindowDimensions } from 'react-native';

import { ThemeContext } from '../../App';
import BhaktiBackButton from '../components/BhaktiBackButton';
import { useBhaktiTopPadding } from '../components/BhaktiLayout';
import { useLanguage } from '../context/LanguageContext';
import { languages } from '../i18n/translations';
import { clearSavedPanchangLocation } from '../features/panchang/locationStore';
import { getReminderEnabled, setReminderEnabled, supportsReminders } from '../services/reminderService';

export default function SettingsScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const topPadding = useBhaktiTopPadding(width, 'title');
  const { theme, isDark, toggleTheme } = useContext(ThemeContext);
  const { currentLanguage, setLanguage, t } = useLanguage();
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [reminderEnabled, setReminder] = useState(false);
  const [reminderBusy, setReminderBusy] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState('');
  const hindi = currentLanguage === 'hi';
  useEffect(() => {
    let active = true;
    getReminderEnabled().then((enabled) => { if (active) setReminder(enabled); }).catch(() => {});
    return () => { active = false; };
  }, []);
  const changeReminder = async (enabled) => {
    setReminderBusy(true);
    setSettingsMessage('');
    try { setReminder(await setReminderEnabled(enabled)); }
    catch (error) { setSettingsMessage(error.message); }
    finally { setReminderBusy(false); }
  };

  const selectedLanguage = languages.find((language) => language.code === currentLanguage) ?? languages[0];

  const cardBg = isDark ? '#16213e' : '#fffaf0';
  const cardBorder = isDark ? '#2e3a5e' : '#e9d39a';

  const pillBg = isDark ? '#1a1a2e' : '#fff7df';
  const pillBorder = isDark ? '#4a4370' : '#e4c879';
  const pillText = isDark ? '#a89ec9' : '#7a5a19';

  const pillActiveBg = isDark ? '#6c63ff' : '#7c3aed';
  const pillActiveBorder = isDark ? '#6c63ff' : '#7c3aed';
  const gold = '#e8b849';
  const sheetBg = isDark ? '#141c35' : '#fff9ea';
  const sheetBorder = isDark ? '#2e3a5e' : '#ead28a';
  const rowBg = isDark ? '#1a2240' : '#fffdf7';

  const handleLanguageSelect = async (languageCode) => {
    await setLanguage(languageCode);
    setLanguageModalVisible(false);
  };

  return (
    <>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.contentContainer, { paddingTop: topPadding }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <BhaktiBackButton navigation={navigation} />
        </View>

        <Text style={styles.emoji}>⚙️</Text>
        <Text style={[styles.heading, { color: theme.text }]}>{t('settings')}</Text>
        <Text style={[styles.subtitle, { color: theme.mutedText }]}>
          {t('configurePreferences')}
        </Text>

        <View style={[styles.divider, { backgroundColor: theme.accent }]} />

        <View style={[styles.section, {
          backgroundColor: cardBg,
          borderColor: cardBorder,
        }]}>
          <Text style={[styles.sectionLabel, { color: theme.mutedText }]}>
            {t('appearance')}
          </Text>

          <Text style={[styles.activeText, { color: theme.text }]}>
            {isDark ? t('darkMode') : t('lightMode')}
          </Text>

          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                {
                  backgroundColor: isDark ? pillActiveBg : pillBg,
                  borderColor: isDark ? pillActiveBorder : pillBorder,
                },
                isDark && styles.toggleButtonActiveShadow,
              ]}
              onPress={() => { if (!isDark) toggleTheme(); }}
              accessibilityLabel={t('darkMode')}
            >
              <Text style={[
                styles.toggleButtonText,
                { color: isDark ? '#ffffff' : pillText },
              ]}>
                {t('darkMode')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.toggleButton,
                {
                  backgroundColor: !isDark ? pillActiveBg : pillBg,
                  borderColor: !isDark ? pillActiveBorder : pillBorder,
                },
                !isDark && styles.toggleButtonActiveShadow,
              ]}
              onPress={() => { if (isDark) toggleTheme(); }}
              accessibilityLabel={t('lightMode')}
            >
              <Text style={[
                styles.toggleButtonText,
                { color: !isDark ? '#ffffff' : pillText },
              ]}>
                {t('lightMode')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.accent }]} />

        <TouchableOpacity
          style={[styles.languageRow, {
            backgroundColor: cardBg,
            borderColor: cardBorder,
          }]}
          onPress={() => setLanguageModalVisible(true)}
          activeOpacity={0.82}
          accessibilityLabel={t('chooseLanguage')}
        >
          <View style={styles.languageRowText}>
            <Text style={[styles.languageRowTitle, { color: theme.text }]}>
              {t('language')}
            </Text>
            <Text style={[styles.languageRowValue, { color: theme.mutedText }]}>
              {selectedLanguage.nativeName} · {selectedLanguage.label}
            </Text>
          </View>
          <Text style={[styles.chevron, { color: gold }]}>›</Text>
        </TouchableOpacity>

        <View style={[styles.section, { backgroundColor: cardBg, borderColor: cardBorder, marginTop: 18 }]}>
          <Text style={[styles.languageRowTitle, { color: theme.text }]}>{hindi ? 'दैनिक अनुस्मारक' : 'Daily reminder'}</Text>
          <Text style={[styles.languageRowValue, { color: theme.mutedText }]}>{supportsReminders()
            ? (hindi ? 'हर दिन स्थानीय समयानुसार सुबह 9 बजे। अनुमति केवल चालू करते समय माँगी जाएगी।' : 'Every day at 9 AM local time. Permission is requested only when you turn this on.')
            : (hindi ? 'अनुस्मारक इंस्टॉल किए हुए भक्ति ऐप में उपलब्ध हैं।' : 'Reminders are available in an installed Bhakti development or release build.')}</Text>
          <Switch accessibilityLabel={hindi ? 'दैनिक अनुस्मारक' : 'Daily reminder'} value={reminderEnabled} onValueChange={changeReminder} disabled={reminderBusy || !supportsReminders()} />
        </View>
        <TouchableOpacity accessibilityRole="button" onPress={() => navigation.navigate('Privacy')} style={[styles.languageRow, { backgroundColor: cardBg, borderColor: cardBorder, marginTop: 18 }]}>
          <Text style={[styles.languageRowTitle, { color: theme.text }]}>{hindi ? 'गोपनीयता और डेटा' : 'Privacy & data'}</Text>
          <Text style={[styles.chevron, { color: gold }]}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" onPress={async () => {
          try {
            await clearSavedPanchangLocation();
            setSettingsMessage(hindi ? 'सहेजा हुआ पंचांग स्थान मिटा दिया गया।' : 'Saved Panchang location cleared.');
          } catch { setSettingsMessage(hindi ? 'स्थान नहीं मिटाया जा सका।' : 'Could not clear saved location. Please try again.'); }
        }} style={[styles.languageRow, { backgroundColor: cardBg, borderColor: cardBorder, marginTop: 18 }]}>
          <Text style={[styles.languageRowTitle, { color: theme.text }]}>{hindi ? 'सहेजा पंचांग स्थान मिटाएँ' : 'Clear saved Panchang location'}</Text>
        </TouchableOpacity>
        {!!settingsMessage && <Text accessibilityRole="alert" style={{ color: theme.text, marginTop: 14 }}>{settingsMessage}</Text>}
      </ScrollView>
      </SafeAreaView>

      <Modal
        visible={languageModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setLanguageModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setLanguageModalVisible(false)}
        >
          <TouchableOpacity
            style={[styles.bottomSheet, {
              backgroundColor: sheetBg,
              borderColor: sheetBorder,
              shadowColor: gold,
            }]}
            activeOpacity={1}
          >
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: theme.text }]}>
                {t('chooseLanguage')}
              </Text>
              <TouchableOpacity
                style={[styles.closeButton, { borderColor: sheetBorder }]}
                onPress={() => setLanguageModalVisible(false)}
                accessibilityLabel={t('close')}
              >
                <Text style={[styles.closeButtonText, { color: theme.mutedText }]}>×</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.languageList}>
              {languages.map((language) => {
                const isSelected = language.code === currentLanguage;

                return (
                  <TouchableOpacity
                    key={language.code}
                    style={[
                      styles.languageOption,
                      {
                        backgroundColor: isSelected ? theme.activeHighlight : rowBg,
                        borderColor: isSelected ? gold : sheetBorder,
                      },
                    ]}
                    onPress={() => handleLanguageSelect(language.code)}
                    activeOpacity={0.78}
                    accessibilityLabel={`Select ${language.label}`}
                  >
                    <View style={styles.languageOptionText}>
                      <Text style={[styles.languageNativeName, { color: theme.text }]}>
                        {language.nativeName}
                      </Text>
                      <Text style={[styles.languageLabel, { color: theme.mutedText }]}>
                        {language.label}
                      </Text>
                    </View>

                    {isSelected && (
                      <Text style={[styles.checkmark, { color: gold }]}>✓</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingBottom: 36,
  },
  headerRow: {
    width: '100%',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  emoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  heading: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
  },
  divider: {
    width: 120,
    height: 2,
    borderRadius: 1,
    marginBottom: 26,
  },
  section: {
    width: '100%',
    borderRadius: 16,
    padding: 20,
    marginBottom: 26,
    borderWidth: 1,
    alignItems: 'center',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
    textAlign: 'center',
  },
  activeText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 16,
    textAlign: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  toggleButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 24,
    borderWidth: 1.5,
  },
  toggleButtonActiveShadow: {
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  languageRow: {
    width: '100%',
    minHeight: 78,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginBottom: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  languageRowText: {
    flex: 1,
    paddingRight: 12,
  },
  languageRowTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 5,
  },
  languageRowValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  chevron: {
    fontSize: 32,
    fontWeight: '300',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.52)',
  },
  bottomSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 28,
    elevation: 16,
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(232, 184, 73, 0.55)',
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    lineHeight: 26,
    fontWeight: '300',
  },
  languageList: {
    gap: 9,
  },
  languageOption: {
    minHeight: 58,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  languageOptionText: {
    flex: 1,
    paddingRight: 12,
  },
  languageNativeName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  languageLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 22,
    fontWeight: '800',
  },
});
