import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackButton } from '@/components/ui/back-button';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import {
  useCommunicationCode,
  useUpdateCommunicationCode,
} from '@/network/communication-codes/use-communication-code';
import * as Burnt from 'burnt';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { setCommunicationCodeSchema } from '@brioela/shared/validators/communication-code.validator';
import { zodResolver } from '@/lib/forms/zod-resolver';

export default function CommunicationCodeScreen() {
  const { data: existingCode, isLoading } = useCommunicationCode();
  const updateCode = useUpdateCommunicationCode();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<{ code: string }>({
    defaultValues: { code: existingCode?.code ?? '' },
    values: existingCode ? { code: existingCode.code } : undefined,
    resolver: zodResolver(setCommunicationCodeSchema),
    mode: 'onChange',
  });

  const onSubmit = ({ code }: { code: string }) => {
    const trimmed = code.trim();
    if (!trimmed) {
      Burnt.alert({
        title: 'Error',
        message: 'Please enter a communication code',
        preset: 'error',
      });
      return;
    }

    updateCode.mutate(
      { code: trimmed },
      {
        onSuccess: () => {
          Burnt.toast({
            title: 'Success',
            message: 'Code applied',
            preset: 'done',
            haptic: 'success',
          });
          router.back();
        },
        onError: (error) => {
          Burnt.alert({
            title: 'Error',
            message: error instanceof Error ? error.message : 'Failed to update code',
            preset: 'error',
          });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#171717" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <BackButton />

      <KeyboardAwareScrollView
        className="flex-1"
        contentContainerClassName="px-5 pt-6 pb-10"
        keyboardDismissMode="interactive">
        {/* Title */}
        <Text className="font-parafina text-4xl font-semibold text-neutral-900">
          Communication code
        </Text>

        {/* Description */}
        <Text className="mt-3 text-base text-neutral-500">
          Set a personal code that will appear in all emails we send you. This helps you verify that
          emails are genuinely from Schnl and not phishing attempts.
        </Text>

        {/* Input */}
        <View className="mt-8">
          <Text className="mb-2 text-sm font-medium text-neutral-900">Your code</Text>
          <Controller
            control={control}
            name="code"
            render={({ field: { value, onChange } }) => (
              <TextInput
                value={value}
                onChangeText={onChange}
                placeholder="AlexJohnson2000"
                className="rounded-xl border border-neutral-200 bg-white px-4 py-4 text-base text-neutral-900"
                placeholderTextColor="#a3a3a3"
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={50}
              />
            )}
          />
          <Text className="mt-2 text-sm text-neutral-500">
            3-50 characters. Letters, numbers, spaces, hyphens, underscores, and periods allowed.
          </Text>
          {errors.code?.message ? (
            <Text className="mt-2 text-sm text-red-500">{errors.code.message}</Text>
          ) : null}
        </View>

        {/* Example */}
        <View className="mt-6 rounded-xl bg-neutral-50 p-4">
          <Text className="text-sm font-medium text-neutral-900">How it works</Text>
          <Text className="mt-2 text-sm text-neutral-500">
            When we send you an email, your code will be displayed prominently. If an email doesn't
            show your code or shows a different code, it's not from us.
          </Text>
        </View>

        {/* Save Button */}
        <View className="mb-6 mt-10">
          <TouchableOpacity
            onPress={handleSubmit(onSubmit)}
            disabled={updateCode.isPending || isSubmitting}
            className="w-full items-center justify-center rounded-full bg-neutral-900 py-4"
            activeOpacity={0.8}>
            {updateCode.isPending || isSubmitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-base font-semibold text-white">Save code</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
