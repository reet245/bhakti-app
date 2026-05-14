import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { languages, translations } from '../i18n/translations';

const STORAGE_KEY = 'appLanguage';
const DEFAULT_LANGUAGE = 'en';

export const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [currentLanguage, setCurrentLanguage] = useState(DEFAULT_LANGUAGE);

  useEffect(() => {
    async function loadSavedLanguage() {
      try {
        const savedLanguage = await AsyncStorage.getItem(STORAGE_KEY);
        const isSupported = languages.some((language) => language.code === savedLanguage);

        if (isSupported) {
          setCurrentLanguage(savedLanguage);
        }
      } catch (error) {
        console.warn('Unable to load saved language:', error);
      }
    }

    loadSavedLanguage();
  }, []);

  const setLanguage = useCallback(async (languageCode) => {
    const isSupported = languages.some((language) => language.code === languageCode);

    if (!isSupported) {
      return;
    }

    setCurrentLanguage(languageCode);

    try {
      await AsyncStorage.setItem(STORAGE_KEY, languageCode);
    } catch (error) {
      console.warn('Unable to save selected language:', error);
    }
  }, []);

  const t = useCallback(
    (key) => {
      const value = translations[currentLanguage]?.[key];
      const englishValue = translations.en?.[key];
      const isInvalid = (translation) => (
        translation == null
        || String(translation).trim() === ''
        || /^\?+$/.test(String(translation).trim())
      );

      if (isInvalid(value)) {
        return isInvalid(englishValue) ? key : englishValue;
      }

      return value;
    },
    [currentLanguage],
  );

  const value = useMemo(
    () => ({
      currentLanguage,
      setLanguage,
      t,
    }),
    [currentLanguage, setLanguage, t],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }

  return context;
}
