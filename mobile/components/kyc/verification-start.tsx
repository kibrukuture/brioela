import {
  View,
  Text,
  ScrollView,
  StatusBar,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useKycLink } from '@/network/banking/use-kyc-link';

interface KYCStep {
  id: number;
  title: string;
  description: string;
}

const kycSteps: KYCStep[] = [
  {
    id: 1,
    title: 'Government ID',
    description: "Passport, driver's license, or national ID",
  },
  {
    id: 2,
    title: 'Proof of address',
    description: 'Recent utility bill or bank statement',
  },
  {
    id: 3,
    title: 'Complete questionnaire',
    description: 'Standard financial questions required by regulations',
  },
];

export const VerificationStart: React.FC = () => {
  const { data, isLoading, error } = useKycLink();

  const handleStartVerification = async (): Promise<void> => {
    if (error) {
      Alert.alert('Error', 'Failed to load verification link. Please try again.');
      return;
    }

    if (!data?.kycLink) {
      return;
    }

    await WebBrowser.openBrowserAsync(data.kycLink, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
      controlsColor: '#22c55e',
      toolbarColor: '#ffffff',
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header */}
      <View className="px-6 pt-4">
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center active:opacity-70">
          <Feather name="arrow-left" size={24} color="#1a1a1a" />
        </Pressable>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 pt-8 pb-6"
        showsVerticalScrollIndicator={false}>
        {/* Title */}
        <Text className="mb-2 font-parafina text-4xl font-semibold text-gray-900">
          Verify your identity
        </Text>

        {/* Description */}
        <Text className="mb-6 text-base leading-6 text-gray-500">
          Quick 5-minute verification required by financial regulations.
        </Text>

        {/* Why section */}
        <View className="mb-6 rounded-2xl bg-gray-50 p-4">
          <Text className="mb-1 text-sm font-medium text-gray-900">Activate Full Access</Text>
          <Text className="text-sm leading-5 text-gray-600">
            Enable higher spending limits, global transfers, and instant payments.
          </Text>
        </View>

        {/* Steps */}
        <Text className="mb-3 text-sm font-medium text-gray-900">What you'll need</Text>

        <View className="gap-3">
          {kycSteps.map((step) => (
            <View key={step.id} className="flex-row items-start gap-3">
              <View className="mt-0.5 h-6 w-6 items-center justify-center rounded-full bg-gray-100">
                <Text className="text-xs font-medium text-gray-600">{step.id}</Text>
              </View>
              <View className="flex-1">
                <Text className="mb-0.5 text-sm font-medium text-gray-900">{step.title}</Text>
                <Text className="text-sm leading-5 text-gray-500">{step.description}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Footer */}
      <View className="px-6 pb-8 pt-4">
        <Pressable
          onPress={handleStartVerification}
          disabled={isLoading || !!error}
          className={`flex-row items-center justify-center rounded-full py-4 active:opacity-90 ${
            isLoading || !!error ? 'bg-gray-400' : 'bg-gray-900'
          }`}>
          {isLoading ? <ActivityIndicator color="#ffffff" className="mr-2" /> : null}
          <Text className="text-base font-semibold text-white">
            {isLoading ? 'Loading...' : error ? 'Unavailable' : 'Start verification'}
          </Text>
        </Pressable>

        <Text className="mt-3 text-center text-xs leading-4 text-gray-400">
          Your data is encrypted and secure.
        </Text>
      </View>
    </SafeAreaView>
  );
};
