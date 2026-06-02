import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackButton } from '@/components/ui/back-button';
import { resources, type Language } from '@/locales';
import { useLanguageStore } from '@/stores/ui/use-language-store';
import {
  useUserPreferencesStore,
  type ThemePreference,
} from '@/stores/account/use-user-preferences';
import { useTranslation } from 'react-i18next';

const AVAILABLE_THEMES: ThemePreference[] = ['system', 'light', 'dark'];

export default function LanguageAndAppearanceScreen(): React.JSX.Element {
  const { t } = useTranslation('settings');

  const language = useLanguageStore((s) => s.language);
  const setLanguage = useLanguageStore((s) => s.setLanguage);

  const theme = useUserPreferencesStore((s) => s.theme);
  const setTheme = useUserPreferencesStore((s) => s.setTheme);

  const supportedLanguages = Object.keys(resources) as Language[];

  return (
    <SafeAreaView className="flex-1 bg-white">
      <BackButton />

      <ScrollView contentContainerClassName="px-5 pb-10">
        <View className="mt-4">
          <Text className="font-parafina text-4xl tracking-wide text-neutral-900">
            {t('language.label')}
          </Text>
          <Text className="mt-2 text-sm text-neutral-500">{t('language.description')}</Text>
        </View>

        <View className="mt-8">
          <Text className="mb-2 text-xl font-semibold text-neutral-900">{t('language.label')}</Text>
          <View className="rounded-2xl border border-neutral-100 bg-white">
            {supportedLanguages.map((code, index) => {
              const isSelected = language === code;
              const isLast = index === supportedLanguages.length - 1;
              return (
                <TouchableOpacity
                  key={code}
                  onPress={() => setLanguage(code)}
                  activeOpacity={0.7}
                  className={`flex-row items-center justify-between px-4 py-4 ${
                    !isLast ? 'border-b border-neutral-100' : ''
                  }`}>
                  <View>
                    <Text
                      className={`text-base ${
                        isSelected ? 'font-semibold text-neutral-900' : 'text-neutral-900'
                      }`}>
                      {t(`languageNames.${code}`, { defaultValue: code })}
                    </Text>
                    <Text className="mt-0.5 text-sm text-neutral-500">{code.toUpperCase()}</Text>
                  </View>
                  <View
                    className={`h-5 w-5 rounded-full border ${
                      isSelected ? 'border-neutral-900 bg-neutral-900' : 'border-neutral-300'
                    }`}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View className="mt-8">
          <Text className="mb-2 text-xl font-semibold text-neutral-900">
            {t('appearanceSection.label')}
          </Text>
          <Text className="mb-3 text-sm text-neutral-500">
            {t('appearanceSection.description')}
          </Text>
          <View className="rounded-2xl border border-neutral-100 bg-white">
            {AVAILABLE_THEMES.map((code, index) => {
              const isSelected = theme === code;
              const isLast = index === AVAILABLE_THEMES.length - 1;
              return (
                <TouchableOpacity
                  key={code}
                  onPress={() => setTheme(code)}
                  activeOpacity={0.7}
                  className={`flex-row items-center justify-between px-4 py-4 ${
                    !isLast ? 'border-b border-neutral-100' : ''
                  }`}>
                  <Text
                    className={`text-base ${
                      isSelected ? 'font-semibold text-neutral-900' : 'text-neutral-900'
                    }`}>
                    {t(`appearanceSection.themes.${code}`, { defaultValue: code })}
                  </Text>
                  <View
                    className={`h-5 w-5 rounded-full border ${
                      isSelected ? 'border-neutral-900 bg-neutral-900' : 'border-neutral-300'
                    }`}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
