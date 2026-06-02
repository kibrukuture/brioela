import React, { useEffect } from 'react';
import { View, Text, Pressable, ActivityIndicator, Alert } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useForm } from 'react-hook-form';
import { AlertCircle } from 'lucide-react-native';
import { zodResolver } from '@/lib/forms/zod-resolver';
import {
  walletActivationFormSchema,
  type WalletActivationForm,
} from '@schnl/shared/validators/wallet-activation.validator';
import { useWalletActivation } from '@/hooks/wallet/use-wallet-activation';
import { OtpCodeField } from '@/components/ui/otp-code-field';
import { getWalletActivationCopy } from '@/components/wallets/wallet-activation-copy';
import { Info } from 'phosphor-react-native';

export function WalletActivation(): React.ReactElement {
  const {
    email,
    error,
    phase,
    sessionStatus,
    isSessionStatusLoading,
    account,
    isBusy,
    sendEmailCode,
    activateOrRenewSession,
    disconnectWallet,
    setError,
  } = useWalletActivation();

  const {
    handleSubmit,
    setValue,
    formState: { errors },
    watch,
  } = useForm<WalletActivationForm>({
    resolver: zodResolver(walletActivationFormSchema),
    defaultValues: { code: '' },
    mode: 'onSubmit',
  });

  const code = watch('code');

  useEffect(() => {
    if (phase === 'awaiting_otp') return;
    setValue('code', '', { shouldValidate: false, shouldDirty: false });
  }, [phase, setValue]);

  const isConnected = Boolean(account);
  const isSessionActive = sessionStatus?.status === 'active';
  const isActivated = Boolean(isConnected && isSessionActive);
  const isActivatedUi = Boolean(isActivated && !isBusy);

  const { title, subtitle, helperText, primaryLabel, disclaimerText } = getWalletActivationCopy({
    phase,
    email,
    isConnected,
    isActivatedUi,
    isBusy,
    isSessionStatusLoading,
  });

  const isPrimaryDisabled = isBusy;

  const canResend = phase === 'awaiting_otp' && !isActivatedUi && !isConnected;

  const showCodeField = phase === 'awaiting_otp' && !isConnected;

  const showActivatingInfoRow =
    !showCodeField &&
    helperText.trim().length > 0 &&
    (phase === 'connecting' || phase === 'awaiting_account_activation' || phase === 'activating');

  let errorText: string | null = error;
  const codeError = errors.code?.message;
  if (!errorText && codeError) {
    errorText = codeError;
  }

  const onPrimaryPress = async (): Promise<void> => {
    if (isActivatedUi) {
      Alert.alert(
        'Disconnect Wallet',
        'Are you sure you want to disconnect your wallet? You will need to verify your email again to reconnect.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disconnect',
            style: 'destructive',
            onPress: async () => {
              await disconnectWallet();
            },
          },
        ]
      );
      return;
    }

    if (isConnected) {
      setError(null);
      await activateOrRenewSession();
      return;
    }

    if (phase !== 'awaiting_otp') {
      await sendEmailCode();
      return;
    }

    const submit = handleSubmit(async (values) => {
      setError(null);
      await activateOrRenewSession({ code: values.code });
    });

    await submit();
  };

  const containerClass = 'flex-1 bg-white px-5';
  const cardClass = 'mt-8 w-full rounded-2xl bg-white p-5';

  return (
    <KeyboardAwareScrollView className={containerClass} showsVerticalScrollIndicator={false}>
      <View className={cardClass}>
        <Text className="font-parafina text-xl font-semibold text-neutral-900">{title}</Text>
        <Text className="mt-2 text-sm text-neutral-600">{subtitle}</Text>

        {showActivatingInfoRow && (
          <View className="mt-3 flex-row items-center rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
            <Info size={16} color="#b45309" weight="bold" />
            <Text className="ml-2 flex-1 text-xs text-amber-900">{helperText}</Text>
          </View>
        )}

        {!showCodeField && !showActivatingInfoRow && helperText.trim().length > 0 && (
          <Text className="mt-2 text-xs text-neutral-500">{helperText}</Text>
        )}

        {errorText && (
          <View className="mt-4 flex-row items-center rounded-xl bg-red-50 px-3 py-2">
            <AlertCircle size={18} color="#ef4444" />
            <Text className="ml-2 flex-1 text-sm text-red-600">{errorText}</Text>
          </View>
        )}

        {showCodeField && (
          <View className="mt-5">
            <Text className="mb-2 text-sm font-medium text-neutral-900">Verification code</Text>
            <View className="mt-2">
              <OtpCodeField
                value={code}
                onChangeText={(text) => {
                  setValue('code', text, { shouldValidate: false, shouldDirty: true });
                }}
                length={6}
                autoFocus
                isDisabled={isBusy || phase !== 'awaiting_otp' || isActivated || isConnected}
              />
            </View>
            <Text className="mt-2 text-xs text-neutral-500">{helperText}</Text>
          </View>
        )}

        <Pressable
          onPress={onPrimaryPress}
          disabled={isPrimaryDisabled}
          className="mt-6 rounded-full bg-neutral-900 px-5 py-4">
          <View className="flex-row items-center justify-center">
            {isBusy && !isActivatedUi && <ActivityIndicator color="#ffffff" />}
            <Text className="ml-2 text-center text-base font-semibold text-white">
              {primaryLabel}
            </Text>
          </View>
        </Pressable>

        <Text className="mt-4 text-center text-xs text-neutral-500">{disclaimerText}</Text>

        {canResend && (
          <Pressable
            onPress={async () => {
              await sendEmailCode();
            }}
            disabled={isBusy}
            className="mt-5 self-center"
            android_ripple={{ color: '#e5e5e5', borderless: true }}>
            <Text className="text-xs font-medium text-neutral-900 underline">Resend code</Text>
          </Pressable>
        )}
      </View>
    </KeyboardAwareScrollView>
  );
}
