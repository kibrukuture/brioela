import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '@/lib/auth/supabase';
// import translations
import { useTranslation } from 'react-i18next';
import { Controller, useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@/lib/forms/zod-resolver';
import { verificationCodeSchema } from '@/ui-schema';

interface EmailVerificationCodeProps {
  email: string;
  onBack: () => void;
}

type VerificationCodeFormValues = {
  code: string;
};

export default function EmailVerificationCode({ email, onBack }: EmailVerificationCodeProps) {
  // get translations
  const { t } = useTranslation(['auth']);
  const [btnStat, setBtnStat] = useState({
    verify: { bool: false },
    resend: { bool: false },
  });

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<VerificationCodeFormValues>({
    defaultValues: { code: '' },
    mode: 'onChange',
    resolver: zodResolver(verificationCodeSchema),
  });

  const onSubmit: SubmitHandler<VerificationCodeFormValues> = async (values) => {
    setBtnStat((prev) => ({ ...prev, verify: { bool: true } }));
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: values.code,
        type: 'signup',
      });

      if (error) {
        Alert.alert('Verification Failed', error.message);
      } else {
        Alert.alert('Success', 'Email verified! You can now sign in.');
        onBack(); // Go back to sign in screen
      }
    } catch {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setBtnStat((prev) => ({ ...prev, verify: { bool: false } }));
    }
  };

  const handleResendCode = async () => {
    setBtnStat((prev) => ({ ...prev, resend: { bool: true } }));
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });

      if (error) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert('Success', 'Verification code sent!');
      }
    } catch {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setBtnStat((prev) => ({ ...prev, resend: { bool: false } }));
    }
  };

  return (
    <View className="flex-1 px-6 pt-8">
      <View className="mb-6">
        <Text className="mb-3 text-center text-lg text-gray-600">
          {t('verify.message')} <Text className="font-mono text-gray-800">{email}</Text>
        </Text>
      </View>

      <View className="mb-6">
        <Controller
          control={control}
          name="code"
          render={({ field: { onChange, value } }) => (
            <TextInput
              className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-4 text-center text-2xl font-semibold tracking-widest"
              placeholder="######"
              placeholderTextColor="#A0AEC0"
              value={value}
              onChangeText={onChange}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
            />
          )}
        />
        {!!errors.code?.message && (
          <Text className="mt-2 text-xs text-red-500">{errors.code.message}</Text>
        )}
      </View>

      <TouchableOpacity
        className="mb-3 rounded-full bg-blue-600 py-4"
        onPress={handleSubmit(onSubmit)}
        disabled={btnStat.verify.bool || !isValid}>
        {btnStat.verify.bool ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-center font-semibold text-white">Verify Email</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        className="mb-3 rounded-full border border-gray-200 bg-white py-4"
        onPress={handleResendCode}
        disabled={btnStat.resend.bool}>
        {btnStat.resend.bool ? (
          <ActivityIndicator color="#6B7280" />
        ) : (
          <Text className="text-center font-semibold text-gray-700">Resend Code</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity className="rounded-full bg-transparent py-3" onPress={onBack}>
        <Text className="text-center text-gray-500">Back to Sign In</Text>
      </TouchableOpacity>
    </View>
  );
}
