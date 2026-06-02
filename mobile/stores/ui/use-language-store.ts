import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';
import { I18nManager } from 'react-native';
import { create } from 'zustand';
import { LOCAL_STORAGE_KEYS } from '@/constants';
import i18n from '@/lib/i18n';
import type { Language } from '@/locales';

interface LanguageState {
  language: Language;
  isLoaded: boolean;
}

interface LanguageActions {
  loadLanguage: () => Promise<void>;
  setLanguage: (language: Language) => Promise<void>;
}

type LanguageStore = LanguageState & LanguageActions;

export const useLanguageStore = create<LanguageStore>((set) => ({
  language: 'en',
  isLoaded: false,

  loadLanguage: async () => {
    try {
      const saved = await AsyncStorage.getItem(LOCAL_STORAGE_KEYS.LANGUAGE_KEY);
      const next = (saved as Language | null) ?? 'en';

      set({ language: next, isLoaded: true });

      if (i18n.language !== next) {
        await i18n.changeLanguage(next);
      }
    } catch (error) {
      console.error('[language] failed to load language', error);
      set({ language: 'en', isLoaded: true });
    }
  },

  setLanguage: async (language) => {
    const isRTL = language === 'ar';

    set({ language });

    try {
      await AsyncStorage.setItem(LOCAL_STORAGE_KEYS.LANGUAGE_KEY, language);
    } catch (error) {
      console.error('[language] failed to persist language', error);
    }

    if (I18nManager.isRTL !== isRTL) {
      I18nManager.forceRTL(isRTL);
      await Updates.reloadAsync();
      return;
    }

    if (i18n.language !== language) {
      await i18n.changeLanguage(language);
    }
  },
}));
