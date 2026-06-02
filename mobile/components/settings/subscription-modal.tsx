import { View, Text, Modal, Platform, TouchableOpacity, Linking } from 'react-native';
import Animated from 'react-native-reanimated';
import { OUR_COMPANY_EMAIL } from '@schnl/shared/constants';

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
      <Animated.View className="flex-1  ">
        <Animated.View className="  rounded-t-3xl  px-6 pt-6">
          <View className="mt-4 px-4">
            {Platform.OS === 'ios' ? (
              <View className="mx-auto mb-6 h-1 w-12 self-center rounded-full bg-gray-300" />
            ) : (
              <View
                className="mb-4"
                style={{
                  flexDirection: 'row',
                  justifyContent: 'flex-end',
                }}>
                <TouchableOpacity
                  onPress={onClose}
                  activeOpacity={0.7}
                  className="z-10 h-10  items-end justify-end rounded-full ">
                  <Text className="text-2xl font-bold text-red-500">×</Text>
                </TouchableOpacity>
              </View>
            )}

            <View className="overflow-hidden rounded-xl bg-gray-100 px-4 py-6">
              <Text className="mb-3 text-base text-gray-800">
                If you have any technical issues, suggestions, or need help, please feel free to
                reach out. We’re always happy to assist!
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
                className="flex-row items-center">
                <Text className="text-base font-semibold text-blue-600 underline">
                  {OUR_COMPANY_EMAIL}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
