import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
// import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { resources, defaultNS } from '@/locales';
import { LOCAL_STORAGE_KEYS } from '@/constants';

const LANGUAGE_KEY = LOCAL_STORAGE_KEYS.LANGUAGE_KEY;

// // Get saved language or fallback to device language
// const getInitialLanguage = async (): Promise<string> => {
//   try {
//     const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
//     if (savedLanguage) {
//       return savedLanguage;
//     }
//     // Get device language (e.g., "en-US" -> "en")
//     const deviceLanguage = Localization.getLocales()[0]?.languageCode || 'en';
//     return deviceLanguage;
//   } catch (error) {
//     console.error('Error getting initial language:', error);
//     return 'en';
//   }
// };

// Save language preference
export const saveLanguage = async (language: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, language);
  } catch (error) {
    console.error('Error saving language:', error);
  }
};

// // Initialize i18n
// export const initI18n = async (): Promise<void> => {
//   const initialLanguage = await getInitialLanguage();

//   await i18n.use(initReactI18next).init({
//     resources,
//     lng: initialLanguage,
//     fallbackLng: 'en',
//     defaultNS,
//     ns: ['common', 'auth', 'settings', 'onboarding', 'tabs'],
//     interpolation: {
//       escapeValue: false, // React already escapes values
//     },
//     compatibilityJSON: 'v4', // Important for Android
//     react: {
//       useSuspense: false,
//     },
//   });
// };

// export default i18n;

// Remove the async getInitialLanguage function
// Initialize synchronously with a default, then update

export const initI18n = (): void => {
  // Start with English immediately (no await)
  i18n.use(initReactI18next).init({
    resources,
    lng: 'en', // ← Start with English immediately
    fallbackLng: 'en',
    defaultNS,
    ns: ['common', 'auth', 'settings', 'onboarding', 'tabs', 'superwall'],
    interpolation: {
      escapeValue: false,
    },
    compatibilityJSON: 'v4',
    react: {
      useSuspense: false,
    },
  });

  // THEN load saved language in background (non-blocking)
  loadSavedLanguage();
};

// Load saved language after app starts
const loadSavedLanguage = async () => {
  try {
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (savedLanguage && savedLanguage !== i18n.language) {
      await i18n.changeLanguage(savedLanguage);
    }
  } catch (error) {
    console.error('Error loading saved language:', error);
  }
};

export default i18n;
