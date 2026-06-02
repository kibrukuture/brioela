import type React from 'react';
import { useMemo, useState } from 'react';
import { ActivityIndicator, TextInput, TouchableOpacity, View, Text } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CreditCard } from 'phosphor-react-native';
import { BackButton } from '@/components/ui/back-button';
import * as Burnt from 'burnt';
import { useStripe } from '@stripe/stripe-react-native';
import { useStripeTopupIntent } from '@/hooks/payments/use-stripe-topup-intent';

export default function CardTopUpScreen(): React.ReactElement {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const topupIntentMutation = useStripeTopupIntent();
  const [amount, setAmount] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const parsedAmountCents = useMemo(() => {
    const normalized = amount.replace(/[^0-9.]/g, '');
    const value = Number.parseFloat(normalized);
    if (!Number.isFinite(value) || value <= 0) return 0;
    return Math.round(value * 100);
  }, [amount]);

  const feeAmount = useMemo(() => {
    if (parsedAmountCents === 0) return 0;
    return Math.round(parsedAmountCents * 0.035);
  }, [parsedAmountCents]);

  const isValid = parsedAmountCents > 0;

  const startTopUp = async (): Promise<void> => {
    if (!isValid || isLoading) return;
    setIsLoading(true);
    try {
      const { customerId, ephemeralKeySecret, paymentIntentClientSecret, defaultBillingDetails } =
        await topupIntentMutation.mutateAsync({ amount: parsedAmountCents, currency: 'usd' });

      const init = await initPaymentSheet({
        merchantDisplayName: 'Schnl',
        customerId,
        customerEphemeralKeySecret: ephemeralKeySecret,
        paymentIntentClientSecret,
        defaultBillingDetails,
        allowsDelayedPaymentMethods: false,
      });

      if (init.error) {
        Burnt.alert({
          title: 'Payment setup failed',
          message: init.error.message,
          preset: 'error',
        });
        return;
      }

      const result = await presentPaymentSheet();
      if (result.error) {
        Burnt.alert({
          title: 'Payment not completed',
          message: result.error.message,
          preset: 'error',
        });
        return;
      }

      Burnt.toast({
        title: 'Top up successful',
        preset: 'done',
      });
      setAmount('');
    } catch (error: unknown) {
      Burnt.alert({
        title: 'Top up failed',
        message: error instanceof Error ? error.message : 'Something went wrong',
        preset: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <BackButton />

      <KeyboardAwareScrollView className="flex-1" contentContainerClassName="px-5 pb-10">
        <Text className="font-parafina text-4xl font-semibold text-neutral-900">Card top up</Text>
        <Text className="mt-1 text-sm text-neutral-500">
          Add money instantly using your debit or credit card.
        </Text>

        <View className="mt-8 rounded-2xl border border-neutral-100 bg-white p-5">
          <View className="flex-row items-center">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
              <CreditCard size={22} weight="bold" color="#171717" />
            </View>
            <View className="ml-4 flex-1">
              <Text className="text-base font-semibold text-neutral-900">Amount</Text>
              <Text className="mt-0.5 text-sm text-neutral-500">USD</Text>
            </View>
          </View>

          <TextInput
            value={amount}
            onChangeText={setAmount}
            placeholder="10.00"
            keyboardType="decimal-pad"
            className="mt-4 rounded-xl border border-neutral-200 bg-white px-4 py-4 text-base text-neutral-900"
            placeholderTextColor="#A3A3A3"
          />

          <View className="mt-3 flex-row items-center justify-between px-1">
            <Text className="text-sm text-neutral-500">Fee (3.5%)</Text>
            <Text className="text-sm font-medium text-neutral-900">
              {feeAmount > 0 ? `$${(feeAmount / 100).toFixed(2)}` : '$0.00'}
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            disabled={!isValid || isLoading}
            onPress={startTopUp}
            className="mt-4 items-center justify-center rounded-xl bg-neutral-900 py-4">
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-base font-semibold text-white">Continue</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>

      <View className="items-center py-4">
        <Text className="text-xs text-neutral-400">Powered by Stripe</Text>
      </View>
    </SafeAreaView>
  );
}
