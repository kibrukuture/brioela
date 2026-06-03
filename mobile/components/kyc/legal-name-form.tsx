import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { KeyboardAwareScrollView, KeyboardStickyView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TriangleAlert, ChevronLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import { useKycLegalNameAndWallet } from '@/hooks/users/use-kyc-legal-name-and-wallet';
import { kycLegalNameSchema } from '@brioela/shared/validators/user.validator';
import { PLACEHOLDERS } from '@brioela/shared/constants';

export const LegalNameForm: React.FC = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { mutate: kycLegalNameAndWallet, isPending: isUpdating } = useKycLegalNameAndWallet();

  const handleSave = () => {
    setError(null);

    // Validate using Shared Schema
    const validation = kycLegalNameSchema.safeParse({ firstName, lastName });
    if (!validation.success) {
      setError(validation.error.issues[0].message);
      return;
    }

    kycLegalNameAndWallet(
      { firstName, lastName }, // Wallet pre-generated on backend
      {
        onError: (err: Error) => setError(err.message),
      }
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center px-4 py-3">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <ChevronLeft size={24} color="#1D1D1D" />
        </TouchableOpacity>
      </View>

      <KeyboardAwareScrollView className="flex-1" contentContainerClassName="px-6 pt-4 pb-10">
        <Text className="mb-2 font-parafina text-4xl font-semibold text-neutral-900">Identity</Text>
        <Text className="mb-6 text-base text-neutral-500">
          Please enter your full legal name as it appears on your government ID.
        </Text>

        {/* Warning Banner */}
        <View className="mb-8 flex-row items-start rounded-xl bg-amber-50 p-4">
          <TriangleAlert size={20} color="#d97706" className="mt-0.5" />
          <View className="ml-3 flex-1">
            <Text className="text-sm font-medium text-amber-800">Important</Text>
            <Text className="mt-1 text-sm text-amber-700">
              Ensure these details match your ID. You'll need to contact support to make changes
              later.
            </Text>
          </View>
        </View>

        {/* Form */}
        <View className="gap-4">
          <View>
            <Text className="mb-2 text-sm font-medium text-neutral-900">First Name</Text>
            <TextInput
              className="h-12 rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-base text-neutral-900"
              placeholder={PLACEHOLDERS.FIRST_NAME}
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
            />
          </View>

          <View>
            <Text className="mb-2 text-sm font-medium text-neutral-900">Last Name</Text>
            <TextInput
              className="h-12 rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-base text-neutral-900"
              placeholder={PLACEHOLDERS.LAST_NAME}
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
            />
          </View>
        </View>

        {error && <Text className="mt-4 text-sm font-medium text-red-500">{error}</Text>}
      </KeyboardAwareScrollView>

      <KeyboardStickyView className="bg-white px-6 pb-8 pt-4">
        <Pressable
          onPress={handleSave}
          disabled={!firstName || !lastName || isUpdating}
          className="items-center justify-center rounded-full bg-neutral-900 py-4">
          {isUpdating ? (
            <ActivityIndicator color={!firstName || !lastName ? '#a3a3a3' : '#fff'} />
          ) : (
            <Text
              className={`text-base font-semibold ${
                !firstName || !lastName || isUpdating ? 'text-neutral-400' : 'text-white'
              }`}>
              Continue
            </Text>
          )}
        </Pressable>
      </KeyboardStickyView>
    </SafeAreaView>
  );
};
