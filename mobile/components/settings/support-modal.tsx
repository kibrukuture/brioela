import { View, Text, Modal, Platform, TouchableOpacity, Linking } from 'react-native';
import ModalHandle from '@/components/ui/modal-handle';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OUR_COMPANY_EMAIL } from '@brioela/shared/constants';

interface SupportModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function SupportModal({ visible, onClose }: SupportModalProps) {
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

        <View className="mb-16 items-center justify-center px-6">
          <Text className="mb-8 text-center font-parafina text-6xl italic text-[#1E2A3B]">
            Support
          </Text>
          <Text className="mb-6 mt-6 text-center text-xl text-[#1E2A3B]">We're here to help</Text>

          <Text className="mb-8 text-center text-lg leading-7 text-[#1E2A3B]">
            Having trouble? Found a bug? Want to suggest a feature? We actually read every message
            and respond quickly.
          </Text>

          <TouchableOpacity
            onPress={() => {
              const email = OUR_COMPANY_EMAIL;
              const subject = encodeURIComponent('Support Request');
              const body = encodeURIComponent('');
              const mailtoUrl = `mailto:${email}?subject=${subject}&body=${body}`;

              Linking.openURL(mailtoUrl).catch((err) =>
                console.error('Failed to open email app:', err)
              );
            }}
            activeOpacity={0.7}
            className="rounded-full border border-blue-600 px-8 py-4">
            <Text className="text-center text-xl font-semibold text-blue-600">
              {OUR_COMPANY_EMAIL}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
