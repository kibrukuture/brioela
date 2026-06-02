import React, { useEffect, useState, useCallback, JSX } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { supabase } from '@/lib/auth/supabase';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { Controller, useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@/lib/forms/zod-resolver';
import { resetPasswordSchema } from '@/ui-schema';

export default function ResetPassword(): JSX.Element {
  const router = useRouter();

  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  type ResetPasswordFormValues = {
    password: string;
    confirmPassword: string;
  };

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<ResetPasswordFormValues>({
    defaultValues: { password: '', confirmPassword: '' },
    mode: 'onChange',
    resolver: zodResolver(resetPasswordSchema),
  });

  // Handler to parse token from URL
  const handleUrl = useCallback((event: { url: string }) => {
    try {
      const parsed = Linking.parse(event.url);
      if (parsed.queryParams && typeof parsed.queryParams.token === 'string') {
        setToken(parsed.queryParams.token);
      }
    } catch (error) {
      console.warn('Failed to parse URL:', error);
    }
  }, []);

  useEffect(() => {
    // Subscribe to URL events
    const subscription = Linking.addEventListener('url', handleUrl);

    // Check if app was opened from a deep link initially
    Linking.getInitialURL()
      .then((url) => {
        if (url) handleUrl({ url });
      })
      .catch((error) => {
        console.warn('Error getting initial URL:', error);
      });

    // Cleanup subscription on unmount
    return () => {
      subscription.remove();
    };
  }, [handleUrl]);

  const onSubmit: SubmitHandler<ResetPasswordFormValues> = async (values): Promise<void> => {
    if (!token) {
      Alert.alert('Error', 'Invalid or missing reset token.');
      return;
    }

    setLoading(true);
    try {
      // Supabase password reset with token is typically handled via backend or web flow.
      // Here we attempt to update password assuming user is authenticated.
      const { error } = await supabase.auth.updateUser({ password: values.password });

      if (error) {
        Alert.alert('Reset Failed', error.message || 'Unable to reset password. Please try again.');
        setLoading(false);
        return;
      }

      Alert.alert(
        'Success',
        'Your password has been reset successfully. You can now sign in with your new password.',
        [{ text: 'OK', onPress: () => router.replace('/onboarding') }]
      );
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : 'An unexpected error occurred. Please try again.';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        <Text className="mb-4 text-center text-lg text-gray-700">
          Waiting for password reset link...
        </Text>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 justify-center bg-white px-6">
      <Text className="mb-6 text-center text-2xl font-bold text-gray-800">Reset Password</Text>

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, value } }) => (
          <TextInput
            placeholder="New Password"
            secureTextEntry
            className="mb-2 rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-base text-gray-800"
            value={value}
            onChangeText={onChange}
            editable={!loading}
            autoFocus
            autoComplete="password-new"
            textContentType="newPassword"
          />
        )}
      />
      {!!errors.password?.message && (
        <Text className="mb-2 text-xs text-red-500">{errors.password.message}</Text>
      )}

      <Controller
        control={control}
        name="confirmPassword"
        render={({ field: { onChange, value } }) => (
          <TextInput
            placeholder="Confirm New Password"
            secureTextEntry
            className="mb-2 rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-base text-gray-800"
            value={value}
            onChangeText={onChange}
            editable={!loading}
            autoComplete="password-new"
            textContentType="newPassword"
          />
        )}
      />
      {!!errors.confirmPassword?.message && (
        <Text className="mb-4 text-xs text-red-500">{errors.confirmPassword.message}</Text>
      )}

      <TouchableOpacity
        className={`rounded-full py-3 ${loading ? 'bg-indigo-600/60' : 'bg-indigo-600'}`}
        onPress={handleSubmit(onSubmit)}
        disabled={loading || !isValid}
        activeOpacity={0.8}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-center text-lg font-semibold text-white">Reset Password</Text>
        )}
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}
