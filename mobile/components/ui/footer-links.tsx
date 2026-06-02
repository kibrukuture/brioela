import { Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as WebBrowser from 'expo-web-browser';
import { OUR_COMPANY_PRIVACY_POLICY, OUR_COMPANY_TERMS_OF_SERVICE } from '@schnl/shared/constants';

export default function FooterLinks() {
  return (
    <Animated.View
      entering={FadeInDown.delay(500)}
      className="mt-4 flex-row items-center justify-center gap-6 px-6">
      <TouchableOpacity
        onPress={async () => {
          try {
            await WebBrowser.openBrowserAsync(OUR_COMPANY_TERMS_OF_SERVICE);
          } catch (error) {
            console.error('Error opening terms:', error);
          }
        }}>
        <Text className="text-sm text-gray-500">Terms</Text>
      </TouchableOpacity>
      <View className="h-1 w-1 rounded-full bg-gray-300" />
      <TouchableOpacity
        onPress={async () => {
          try {
            await WebBrowser.openBrowserAsync(OUR_COMPANY_PRIVACY_POLICY);
          } catch (error) {
            console.error('Error opening privacy:', error);
          }
        }}>
        <Text className="text-sm text-gray-500">Privacy</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}
