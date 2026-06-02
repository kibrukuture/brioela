import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Platform,
  ScrollView,
  I18nManager,
} from 'react-native';
import * as Burnt from 'burnt';
import ModalHandle from '@/components/ui/modal-handle';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import * as Updates from 'expo-updates';
import i18n, { saveLanguage } from '@/lib/i18n';
import { Language } from '@/locales';

const AVAILABLE_LANGUAGES: { code: Language; name: string; nativeName: string }[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
];

interface LanguagesModalProps {
  visible: boolean;
  onClose: () => void;
}

const LanguagesModal: React.FC<LanguagesModalProps> = ({ visible, onClose }) => {
  const { t: settingsT } = useTranslation('settings');

  // Add this new function
  const changeLanguageWithRTL = async (language: string): Promise<void> => {
    const isRTL = language === 'ar' || language === 'he' || language === 'fa';

    if (I18nManager.isRTL !== isRTL) {
      I18nManager.forceRTL(isRTL);
      await saveLanguage(language);

      // App needs to reload for RTL to take effect
      if (!__DEV__) {
        await Updates.reloadAsync();
      } else {
        Burnt.toast({
          title: 'Restart Required',
          message: 'Please restart the app for language changes to take effect.',
          preset: 'error',
          duration: 2,
        });
      }
    } else {
      await i18n.changeLanguage(language);
      await saveLanguage(language);
    }
  };

  return (
    <Modal
      visible={visible}
      statusBarTranslucent
      transparent={false}
      animationType="slide"
      presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}
      onRequestClose={onClose}>
      <SafeAreaView className=" flex-1 ">
        <ModalHandle onClose={onClose} />

        <View className="mb-16 items-center justify-center px-6 py-12">
          <Text className="mb-8 mt-8 text-center font-parafina text-6xl italic text-[#1E2A3B]">
            {settingsT('language.label')}
          </Text>

          <View className="w-full">
            <Text className="mb-4 text-center text-sm text-gray-600">
              {settingsT('language.description')}
            </Text>

            <ScrollView>
              {AVAILABLE_LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  onPress={() => changeLanguageWithRTL(lang.code)}
                  className={`mb-2 rounded-lg border p-4 ${
                    i18n.language === lang.code
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-300 bg-white'
                  }`}>
                  <Text
                    className={`text-base ${
                      i18n.language === lang.code
                        ? 'font-semibold text-indigo-700'
                        : 'text-gray-800'
                    }`}>
                    {lang.name}
                  </Text>
                  <Text className="text-sm text-gray-500">{lang.nativeName}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

export default LanguagesModal;
