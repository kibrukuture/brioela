import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, Image, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/auth/supabase';
import { StatusBar } from 'expo-status-bar';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';
import * as Google from 'expo-auth-session/providers/google';
import { AUTH_CONFIG, ERROR_CONFIG } from '@/constants';
import { AppleLogo, GoogleLogo } from 'phosphor-react-native';
import AuthWithEmailModal from '@/components/auth/auth-with-email';
import { forgotPasswordSchema, signInSchema, signUpSchema } from '@/ui-schema';

import { useAuthFlowStore } from '@/stores/account/use-auth-flow-store';
import { ZodError } from '@brioela/shared/zod';
import { useTranslation } from 'react-i18next';
import { OUR_COMPANY_PRIVACY_POLICY, OUR_COMPANY_TERMS_OF_SERVICE } from '@brioela/shared/constants';

WebBrowser.maybeCompleteAuthSession();

type Screen =
  | 'signIn'
  | 'signUp'
  | 'forgotPassword'
  | 'verifyEmail'
  | 'forgotPasswordCode'
  | 'resetPassword';

export default function SignIn() {
  const router = useRouter();

  const { t: authT } = useTranslation('auth');
  const { t: settingsT } = useTranslation('settings');

  const [emailModalVisible, setEmailModalVisible] = useState(false);
  const [screen, setScreen] = useState<Screen>('signIn');
  const [verificationEmail, setVerificationEmail] = useState('');
  const { setTempCredentials, clearAll } = useAuthFlowStore();

  const [btnStat, SetBtnStat] = useState({
    signin: {
      bool: false,
    },
    signup: {
      bool: false,
    },
    forgotPass: {
      bool: false,
    },
  });

  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: AUTH_CONFIG.IOS_CLIENT_ID,
    androidClientId: AUTH_CONFIG.ANDROID_CLIENT_ID,
    webClientId: AUTH_CONFIG.WEB_CLIENT_ID,
  });

  const showErrorAlert = (title: string, message: string) => {
    Alert.alert(title, message, [{ text: 'OK' }]);
  };

  const handlePostLogin = () => router.replace('/tabs/home');

  // Handle Google AuthSession response
  useEffect(() => {
    const handleGoogleResponse = async () => {
      try {
        if (response?.type === 'success') {
          const { authentication } = response;
          if (!authentication?.idToken) {
            showErrorAlert('Google Sign-in Error', 'No ID token received.');
            return;
          }

          // Sign in to Supabase
          const { data, error: supabaseError } = await supabase.auth.signInWithIdToken({
            provider: 'google',
            token: authentication.idToken,
          });

          if (supabaseError) {
            showErrorAlert(
              'Sign-in Failed',
              `Could not complete sign-in with Supabase. ${supabaseError.message}`
            );
            return;
          }

          if (data?.user && data?.session) {
            handlePostLogin();
          } else {
            showErrorAlert(
              'Sign-in Issue',
              'Sign-in with Supabase completed, but no user data was found.'
            );
          }
        }
      } catch (e: unknown) {
        showErrorAlert(
          'Sign-in Error',
          `An unexpected error occurred: ${(e as Error).message || 'Please try again.'}`
        );
      }
    };
    handleGoogleResponse();
  }, [response]);

  const openPrivacyPolicy = async () => {
    try {
      await WebBrowser.openBrowserAsync(OUR_COMPANY_PRIVACY_POLICY);
    } catch {
      // Ignore errors
    }
  };

  const openTermsOfService = async () => {
    try {
      await WebBrowser.openBrowserAsync(OUR_COMPANY_TERMS_OF_SERVICE);
    } catch {
      // Ignore errors
    }
  };

  const signInWithApple = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (credential && credential.identityToken) {
        const { data, error: supabaseError } = await supabase.auth.signInWithIdToken({
          provider: 'apple',
          token: credential.identityToken,
        });

        if (supabaseError) {
          showErrorAlert(
            'Sign-in Failed',
            `Could not complete sign-in with Supabase. ${supabaseError.message}`
          );
          return; // Stop execution here
        }

        if (data?.user) {
          handlePostLogin();
        } else {
          showErrorAlert(
            'Sign-in Issue',
            'Sign-in with Supabase completed, but no user data was found.'
          );
        }
      } else {
      }
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: unknown }).code === 'ERR_CANCELED'
      ) {
      } else {
        showErrorAlert('Apple Sign-In Issue', `${(error as Error).message || 'Please try again.'}`);
      }
    }
  };

  // with email

  const onSignIn = async (email: string, password: string) => {
    try {
      SetBtnStat((prev) => ({
        ...prev,
        signin: {
          bool: true,
        },
      }));
      signInSchema.parse({ email, password });
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        Alert.alert('Sign-in Failed', error.message || 'Unable to sign in. Please try again.');

        return;
      }

      if (data.user) {
        // Clear auth flow store and proceed with post-login flow
        clearAll();
        handlePostLogin();
      } else {
        Alert.alert(
          'Sign-in Issue',
          'We couldn’t retrieve your account details after sign-in. Please try again or contact support.'
        );
      }
    } catch (e: unknown) {
      if (e instanceof ZodError) {
        Alert.alert(ERROR_CONFIG.AUTH_ERROR_TITLE, e.issues[0]?.message ?? 'Invalid input');
        return;
      }

      Alert.alert(
        'Sign-in Error',
        (e as Error).message || 'Something went wrong. Please try again.'
      );
    } finally {
      SetBtnStat((prev) => ({
        ...prev,
        signin: {
          bool: false,
        },
      }));
    }
  };

  const onSignUp = async (email: string, password: string) => {
    try {
      SetBtnStat((prev) => ({
        ...prev,
        signup: {
          bool: true,
        },
      }));
      signUpSchema.parse({ email, password });

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {},
      });

      if (error) {
        Alert.alert(
          'Sign-up Failed',
          error.message || 'Unable to create your account. Please try again.'
        );

        return;
      }

      if (data.user) {
        // Store credentials for later use and switch to verification code screen
        setTempCredentials(email, password);
        setVerificationEmail(email);
        setScreen('verifyEmail');
      } else {
        Alert.alert(
          'Sign-up Issue',
          'We couldn’t retrieve your account details after sign-up. Please try again or contact support.'
        );
      }
    } catch (e: unknown) {
      if (e instanceof ZodError) {
        Alert.alert(ERROR_CONFIG.AUTH_ERROR_TITLE, e.issues[0]?.message ?? 'Invalid input');
      } else if (e instanceof Error) {
        Alert.alert('Error', e.message || 'Something went wrong. Please try again.');
      }
    } finally {
      SetBtnStat((prev) => ({
        ...prev,
        signup: {
          bool: false,
        },
      }));
    }
  };

  const onForgotPassword = async (email: string) => {
    console.log('email', email);
    try {
      SetBtnStat((prev) => ({
        ...prev,
        forgotPass: {
          bool: true,
        },
      }));

      forgotPasswordSchema.parse({ email });

      const { error } = await supabase.auth.resetPasswordForEmail(email);

      if (error) {
        Alert.alert(
          'Password Reset Issue',
          error.message || 'Unable to send password reset instructions. Please try again.'
        );
        throw new Error(error.message);
      }

      // Don't show alert here, let the screen change handle it
      // Alert.alert(
      //   'Reset Email Sent',
      //   'We've sent password reset instructions to your email. Please check your inbox (and spam folder).'
      // );

      // Optionally, switch back to sign-in screen
    } catch (e: unknown) {
      if (e instanceof ZodError) {
        const message = e.issues[0]?.message ?? 'Invalid input';
        Alert.alert(ERROR_CONFIG.AUTH_ERROR_TITLE, message);
        throw new Error(message);
      } else if (e instanceof Error) {
        Alert.alert('Error', e.message || 'Something went wrong. Please try again.');
        throw e; // Re-throw the error so calling component can handle it
      }
    } finally {
      SetBtnStat((prev) => ({
        ...prev,
        forgotPass: {
          bool: false,
        },
      }));
    }
  };

  return (
    <>
      <SafeAreaView className="flex-1 bg-white">
        <StatusBar style="dark" />
        <View className="flex-1 px-8">
          <View className="flex-1 items-center justify-center">
            <View className="mb-10 items-center justify-center">
              <Image
                source={require('@/assets/media/logo.png')}
                className=" h-20 w-20"
                resizeMode="contain"
              />
              <Text className="mb-4 text-4xl font-extralight text-[#1E2A3B]">Schnl</Text>
            </View>
            <View className="flex w-10/12 flex-col gap-4">
              {[
                {
                  logo: <GoogleLogo />,
                  text: authT('providers.google'),
                  bg: 'white',
                  textColor: 'gray-800',
                  disabled: !request,
                  onPress: () => promptAsync(),
                },
                {
                  logo: <AppleLogo color="white" weight="fill" />,
                  text: authT('providers.apple'),
                  bg: 'black',
                  textColor: 'gray-100',
                  disabled: false,
                  onPress: signInWithApple,
                  iosOnly: true,
                },
              ].map(
                (btn, i) =>
                  (!btn.iosOnly || Platform.OS === 'ios') && (
                    <Pressable
                      key={i}
                      className={`flex-row items-center justify-center rounded-full border border-gray-300 py-3 ${btn.bg === 'black' ? 'bg-black' : 'bg-white'}`}
                      disabled={btn.disabled}
                      onPress={btn.onPress}>
                      <View style={{ width: 40, alignItems: 'center' }}>{btn.logo}</View>

                      <View style={{ width: 100, alignItems: 'center' }}>
                        <Text
                          className={`text-base font-medium ${btn.textColor === 'gray-100' ? 'text-gray-100' : 'text-gray-800'}`}
                          style={{ includeFontPadding: false, textAlignVertical: 'center' }}>
                          {btn.text}
                        </Text>
                      </View>
                    </Pressable>
                  )
              )}
            </View>
          </View>

          <View className="mx-auto my-6 flex w-10/12 flex-row items-center">
            <View className="h-px flex-1 bg-gray-200" />
            <Text className="mx-3 font-medium text-gray-400">{authT('providers.divider')}</Text>
            <View className="h-px flex-1 bg-gray-200" />
          </View>
          <Pressable
            className="mx-auto mb-10 w-10/12 flex-row items-center justify-center rounded-full border border-indigo-200 bg-indigo-50 py-3 "
            onPress={() => setEmailModalVisible(true)}>
            <Text className="text-base font-semibold text-indigo-700">
              {authT('providers.email')}
            </Text>
          </Pressable>

          <View className="mb-8 flex flex-row justify-center gap-4 space-x-6">
            <Pressable onPress={openPrivacyPolicy}>
              <Text className="text-xs text-gray-400 underline">{settingsT('privacyPolicy')}</Text>
            </Pressable>
            <Pressable onPress={openTermsOfService}>
              <Text className="text-xs text-gray-400 underline">{settingsT('termsOfService')}</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>

      <AuthWithEmailModal
        visible={emailModalVisible}
        onClose={() => setEmailModalVisible(false)}
        onSignIn={onSignIn}
        onForgotPassword={onForgotPassword}
        onSignUp={onSignUp}
        screen={screen}
        setScreen={setScreen}
        btnStat={btnStat}
        verificationEmail={verificationEmail}
      />
    </>
  );
}
