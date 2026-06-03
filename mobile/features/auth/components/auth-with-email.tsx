import React from 'react';
import { useIsomorphicLayoutEffect } from 'usehooks-ts';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import EmailVerificationCode from '@/features/auth/components/email-verification-code';
import ForgotPasswordCode from '@/features/auth/components/forgot-password-code';
import ResetPasswordForm from '@/features/auth/components/reset-password-form';
import ModalHandle from '@/components/ui/modal-handle';
import { useTranslation } from 'react-i18next';
import { Controller, useForm, type Resolver, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@/lib/forms/zod-resolver';
import { forgotPasswordSchema, signInSchema, signUpSchema } from '@/ui-schema';

type Screen =
  | 'signIn'
  | 'signUp'
  | 'forgotPassword'
  | 'verifyEmail'
  | 'forgotPasswordCode'
  | 'resetPassword';

interface AuthWithEmailModalProps {
  visible: boolean;
  onClose: () => void;
  onSignIn: (email: string, password: string) => void;
  onSignUp: (email: string, password: string) => void;
  onForgotPassword: (email: string) => Promise<void>;
  screen: Screen;
  setScreen: React.Dispatch<React.SetStateAction<Screen>>;
  btnStat: {
    signin: {
      bool: boolean;
    };
    signup: {
      bool: boolean;
    };
    forgotPass: {
      bool: boolean;
    };
  };
  verificationEmail?: string;

  loading?: boolean;
}

const btn_style =
  'mx-auto mb-10 w-full flex-row items-center justify-center rounded-full border border-indigo-200 bg-indigo-50 py-3';
const btn_text = 'text-base font-semibold text-indigo-700';

const AuthWithEmailModal: React.FC<AuthWithEmailModalProps> = ({
  visible,
  onClose,
  onSignIn,
  onSignUp,
  onForgotPassword,
  loading = false,
  screen,
  setScreen,
  btnStat,
  verificationEmail,
}) => {
  const { t: authT } = useTranslation('auth');

  type AuthWithEmailFormValues = {
    email: string;
    password?: string;
  };

  const schemaForScreen = (current: Screen) => {
    if (current === 'signUp') return signUpSchema;
    if (current === 'forgotPassword') return forgotPasswordSchema;
    return signInSchema;
  };

  const resolver: Resolver<AuthWithEmailFormValues> = async (values, context, options) => {
    const activeSchema = schemaForScreen(screen);
    const baseResolver = zodResolver(activeSchema) as unknown as Resolver<AuthWithEmailFormValues>;
    return baseResolver(values, context, options);
  };

  const {
    control,
    handleSubmit,
    reset,
    getValues,
    formState: { errors, isValid },
  } = useForm<AuthWithEmailFormValues>({
    defaultValues: { email: '', password: '' },
    mode: 'onChange',
    resolver,
  });

  // Reset inputs when modal closes or screen changes
  useIsomorphicLayoutEffect(() => {
    if (!visible) {
      setScreen('signIn');
      reset({ email: '', password: '' });
    }
  }, [reset, setScreen, visible]);

  // Only reset password when switching to/from forgot password screen
  useIsomorphicLayoutEffect(() => {
    if (screen === 'forgotPassword') {
      reset({ ...getValues(), password: '' });
    }
  }, [getValues, reset, screen]);

  const onSubmitSignIn: SubmitHandler<AuthWithEmailFormValues> = (values) => {
    if (!values.password) return;
    onSignIn(values.email, values.password);
  };

  const onSubmitSignUp: SubmitHandler<AuthWithEmailFormValues> = (values) => {
    if (!values.password) return;
    onSignUp(values.email, values.password);
  };

  const onSubmitForgotPassword: SubmitHandler<AuthWithEmailFormValues> = async (values) => {
    try {
      await onForgotPassword(values.email);
      setScreen('forgotPasswordCode');
    } catch (e: unknown) {
      console.error('Failed to send reset email:', e);
    }
  };

  // Render form inputs based on current screen
  const renderForm = () => {
    switch (screen) {
      case 'signIn':
        return (
          <>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  className="mb-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-800"
                  placeholder={authT('signIn.email')}
                  placeholderTextColor="#A0AEC0"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={value}
                  onChangeText={onChange}
                  editable={!loading}
                  autoFocus
                  autoComplete="email"
                  textContentType="emailAddress"
                  importantForAutofill="yes"
                />
              )}
            />
            {!!errors.email?.message && (
              <Text className="mb-2 text-xs text-red-500">{errors.email.message}</Text>
            )}

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  className="mb-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-800"
                  placeholder={authT('signIn.password')}
                  placeholderTextColor="#A0AEC0"
                  secureTextEntry
                  value={value}
                  onChangeText={onChange}
                  editable={!loading}
                  autoComplete="password"
                  textContentType="password"
                  importantForAutofill="yes"
                />
              )}
            />
            {!!errors.password?.message && (
              <Text className="mb-4 text-xs text-red-500">{errors.password.message}</Text>
            )}
            <TouchableOpacity
              className={btn_style}
              onPress={handleSubmit(onSubmitSignIn)}
              disabled={!isValid || loading}
              activeOpacity={0.85}>
              {btnStat.signin.bool ? (
                <View className="h-5 w-16 items-center justify-center">
                  <ActivityIndicator color="#4F46E5" size="small" />
                </View>
              ) : (
                <Text className={btn_text}>{authT('signIn.submit')}</Text>
              )}
            </TouchableOpacity>
            <View className="mb-6 mt-2 flex-row items-center justify-between">
              <TouchableOpacity onPress={() => setScreen('forgotPassword')} disabled={loading}>
                <Text className="text-xs font-medium text-indigo-500">
                  {authT('forgotPassword.title')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setScreen('signUp')} disabled={loading}>
                <Text className="text-xs font-medium text-gray-500">{authT('signUp.title')}</Text>
              </TouchableOpacity>
            </View>
          </>
        );

      case 'signUp':
        return (
          <>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  className="mb-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-800"
                  placeholder={authT('signUp.email')}
                  placeholderTextColor="#A0AEC0"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={value}
                  onChangeText={onChange}
                  editable={!loading}
                  autoFocus
                  autoComplete="email"
                  textContentType="emailAddress"
                  importantForAutofill="yes"
                />
              )}
            />
            {!!errors.email?.message && (
              <Text className="mb-2 text-xs text-red-500">{errors.email.message}</Text>
            )}

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  className="mb-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-800"
                  placeholder={authT('signUp.password')}
                  placeholderTextColor="#A0AEC0"
                  secureTextEntry
                  value={value}
                  onChangeText={onChange}
                  editable={!loading}
                  autoComplete="password-new"
                  textContentType="newPassword"
                  importantForAutofill="yes"
                  passwordRules="minlength: 8; required: upper; required: lower; required: digit;"
                />
              )}
            />
            {!!errors.password?.message && (
              <Text className="mb-2 text-xs text-red-500">{errors.password.message}</Text>
            )}
            <Text className="mb-4 text-[10px] font-light text-gray-500">
              {authT('signUp.passwordHint')}
            </Text>

            <TouchableOpacity
              className={btn_style}
              onPress={handleSubmit(onSubmitSignUp)}
              disabled={!isValid || loading}
              activeOpacity={0.85}>
              {btnStat.signup.bool ? (
                <View className="h-5 w-16 items-center justify-center">
                  <ActivityIndicator color="#4F46E5" size="small" />
                </View>
              ) : (
                <Text className={btn_text}>{authT('signUp.submit')}</Text>
              )}
            </TouchableOpacity>
            <View className="mb-6 mt-2 flex-row items-center justify-center">
              <Text className="mr-2 text-xs text-gray-500">{authT('signUp.signInLink')}</Text>
              <TouchableOpacity onPress={() => setScreen('signIn')} disabled={loading}>
                <Text className="text-xs font-medium text-indigo-500">{authT('signIn.title')}</Text>
              </TouchableOpacity>
            </View>
          </>
        );

      case 'forgotPassword':
        return (
          <>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  className="mb-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-800"
                  placeholder={authT('forgotPassword.email')}
                  placeholderTextColor="#A0AEC0"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={value}
                  onChangeText={onChange}
                  editable={!loading}
                  autoFocus
                  autoComplete="email"
                  textContentType="emailAddress"
                  importantForAutofill="yes"
                />
              )}
            />
            {!!errors.email?.message && (
              <Text className="mb-2 text-xs text-red-500">{errors.email.message}</Text>
            )}

            <Text className="-mt-2 mb-4 text-[10px] font-light text-gray-500">
              {authT('forgotPassword.emailHint')}
            </Text>

            <TouchableOpacity
              className={btn_style}
              onPress={handleSubmit(onSubmitForgotPassword)}
              disabled={btnStat.forgotPass.bool}
              activeOpacity={0.85}>
              {btnStat.forgotPass.bool ? (
                <View className="h-5 w-20 items-center justify-center">
                  <ActivityIndicator color="#4F46E5" size="small" />
                </View>
              ) : (
                <Text className={btn_text}>{authT('forgotPassword.submit')}</Text>
              )}
            </TouchableOpacity>
            <View className="mb-6 mt-2 flex-row items-center justify-center">
              <TouchableOpacity onPress={() => setScreen('signIn')} disabled={loading}>
                <Text className="text-xs font-medium text-indigo-500">
                  {authT('forgotPassword.backLink')}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        );

      case 'verifyEmail':
        return (
          <EmailVerificationCode
            email={verificationEmail || ''}
            onBack={() => setScreen('signIn')}
          />
        );
      case 'forgotPasswordCode':
        return (
          <ForgotPasswordCode
            email={getValues().email}
            onBack={() => setScreen('forgotPassword')}
            onCodeVerified={(email, token) => {
              // Store reset password data and move to reset form
              setScreen('resetPassword');
            }}
          />
        );
      case 'resetPassword':
        return (
          <ResetPasswordForm
            email={getValues().email}
            token=""
            onBack={() => setScreen('forgotPasswordCode')}
            onSuccess={() => {
              // Password reset successful, go back to sign in
              setScreen('signIn');
            }}
          />
        );
      default:
        return null;
    }
  };

  // Title based on screen
  const getTitle = () => {
    switch (screen) {
      case 'signIn':
        return authT('signIn.title');
      case 'signUp':
        return authT('signUp.title');
      case 'forgotPassword':
        // return 'Reset Password';
        return authT('reset.title');
      case 'verifyEmail':
        return authT('verify.emailTitle');
      case 'forgotPasswordCode':
        return authT('verify.codeTitle');
      case 'resetPassword':
        return authT('reset.title');
    }
  };

  return (
    <Modal
      statusBarTranslucent
      visible={visible}
      animationType="slide"
      presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}
      onRequestClose={onClose}
      transparent={false}>
      <SafeAreaView className="flex-1 pt-4">
        <ModalHandle onClose={onClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1 px-6">
          <Text className="mb-8 text-center font-parafina text-6xl  text-[#1E2A3B]">
            {getTitle()}
          </Text>
          {renderForm()}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

export default AuthWithEmailModal;
