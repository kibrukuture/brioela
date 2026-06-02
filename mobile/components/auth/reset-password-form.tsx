import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '@/lib/auth/supabase';
import { Controller, useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@/lib/forms/zod-resolver';
import { resetPasswordSchema } from '@/ui-schema';

interface ResetPasswordFormProps {
  email: string;
  token: string;
  onBack: () => void;
  onSuccess: () => void;
}

type ResetPasswordFormValues = {
  password: string;
  confirmPassword: string;
};

export default function ResetPasswordForm({
  email,
  token,
  onBack,
  onSuccess,
}: ResetPasswordFormProps) {
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<ResetPasswordFormValues>({
    defaultValues: { password: '', confirmPassword: '' },
    mode: 'onChange',
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit: SubmitHandler<ResetPasswordFormValues> = async (values) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: values.password,
      });

      if (error) {
        Alert.alert('Reset Failed', error.message);
      } else {
        Alert.alert('Success', 'Password updated successfully! You can now sign in.');
        onSuccess();
      }
    } catch {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 px-6 pt-8">
      <View className="mb-6">
        <Text className="mb-3 text-center text-lg text-gray-600">
          Enter your new password for <Text className="font-mono text-gray-800">{email}</Text>
        </Text>
      </View>

      <View className="mb-4">
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, value } }) => (
            <TextInput
              className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-800"
              placeholder="New Password"
              placeholderTextColor="#A0AEC0"
              secureTextEntry
              value={value}
              onChangeText={onChange}
              editable={!loading}
            />
          )}
        />
        {!!errors.password?.message && (
          <Text className="mt-2 text-xs text-red-500">{errors.password.message}</Text>
        )}
      </View>

      <View className="mb-6">
        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onChange, value } }) => (
            <TextInput
              className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-800"
              placeholder="Confirm New Password"
              placeholderTextColor="#A0AEC0"
              secureTextEntry
              value={value}
              onChangeText={onChange}
              editable={!loading}
            />
          )}
        />
        {!!errors.confirmPassword?.message && (
          <Text className="mt-2 text-xs text-red-500">{errors.confirmPassword.message}</Text>
        )}
        <Text className="mt-2 text-[10px] font-light text-gray-500">
          Must be 8+ characters with at least 1 uppercase letter and 1 number
        </Text>
      </View>

      <TouchableOpacity
        className="mb-3 rounded-full bg-blue-600 py-4"
        onPress={handleSubmit(onSubmit)}
        disabled={loading || !isValid}>
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-center font-semibold text-white">Update Password</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity className="rounded-full bg-transparent py-3" onPress={onBack}>
        <Text className="text-center text-gray-500">Back</Text>
      </TouchableOpacity>
    </View>
  );
}
