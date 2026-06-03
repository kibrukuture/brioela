'use client';

import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import type { PaymentFlow } from '@/components/payments/payment';
import { BackButton } from '@/components/ui/back-button';
import { SUPPORTED_CURRENCIES } from '@brioela/shared/constants';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Controller, useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@/lib/forms/zod-resolver';
import { amountEntrySchema } from '@/ui-schema';
import { NativeSegmentedTabs } from '@/components/ui/native-segmented-tabs';

interface AmountEntryStepProps {
  paymentFlow: PaymentFlow;
  setPaymentFlow: (flow: PaymentFlow) => void;
}

type AmountEntryFormValues = {
  amount: string;
};

export function AmountEntryStep({ paymentFlow, setPaymentFlow }: AmountEntryStepProps) {
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<AmountEntryFormValues>({
    defaultValues: {
      amount: paymentFlow.amount > 0 ? String(paymentFlow.amount) : '',
    },
    mode: 'onChange',
    resolver: zodResolver(amountEntrySchema),
  });

  const onSubmit: SubmitHandler<AmountEntryFormValues> = (values) => {
    const numAmount = Number.parseFloat(values.amount);
    setPaymentFlow({ ...paymentFlow, amount: numAmount, step: 'recipient_type' });
  };

  const feeRate = 0.01;
  const watchedAmount = watch('amount');
  const parsedAmount = Number.parseFloat(watchedAmount);
  const fee = Number.isFinite(parsedAmount) && parsedAmount > 0 ? parsedAmount * feeRate : 0;

  const handleAmountChange = (value: string) => {
    const sanitized = value.replace(/[^0-9.]/g, '');
    const parts = sanitized.split('.');
    if (parts.length > 2) return;
    setValue('amount', sanitized, { shouldValidate: true });
  };

  return (
    <View className="flex-1">
      <BackButton />

      <KeyboardAwareScrollView className="flex-1" contentContainerClassName="px-5 pb-10">
        <View className="mt-4">
          <Text className="mb-2 font-parafina text-4xl font-semibold text-neutral-900">
            Send money
          </Text>
          <Text className="text-sm text-neutral-500">Choose a currency and enter an amount.</Text>
        </View>

        <View className="mt-6 rounded-2xl border border-neutral-100 bg-white p-5">
          <Text className="text-xs font-medium text-neutral-500">Currency</Text>
          <View className="mt-3">
            <NativeSegmentedTabs
              options={SUPPORTED_CURRENCIES.map((c) => ({ label: c.code, value: c.code }))}
              value={paymentFlow.sourceCurrency.code}
              onChange={(nextCode) => {
                const next = SUPPORTED_CURRENCIES.find((c) => c.code === nextCode);
                if (!next) return;
                setPaymentFlow({
                  ...paymentFlow,
                  sourceCurrency: next,
                  targetCurrency: next,
                });
              }}
            />
          </View>

          <View className="mt-6">
            <Text className="text-xs font-medium text-neutral-500">Amount</Text>
            <View className="mt-3 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-5">
              <View className="flex-row items-center justify-between">
                <Text className="text-2xl font-semibold text-neutral-900">
                  {paymentFlow.sourceCurrency.symbol}
                </Text>
                <Controller
                  control={control}
                  name="amount"
                  render={({ field: { value } }) => (
                    <TextInput
                      value={value}
                      onChangeText={handleAmountChange}
                      placeholder="0"
                      keyboardType="decimal-pad"
                      className="flex-1 text-right text-4xl font-semibold text-neutral-900"
                    />
                  )}
                />
              </View>
              <View className="mt-2 flex-row items-center justify-between">
                <Text className="text-[11px] text-neutral-500">Transaction fee</Text>
                <Text className="text-[11px] text-neutral-700">
                  {paymentFlow.sourceCurrency.symbol}
                  {fee.toFixed(2)}
                </Text>
              </View>
            </View>
            {!!errors.amount?.message && (
              <Text className="mt-2 text-xs text-red-500">{errors.amount.message}</Text>
            )}
          </View>
        </View>

        <TouchableOpacity
          onPress={handleSubmit(onSubmit)}
          activeOpacity={0.8}
          disabled={!isValid}
          className={`mt-6 items-center rounded-xl px-5 py-4 ${
            !isValid ? 'bg-neutral-300' : 'bg-neutral-900'
          }`}>
          <Text className="text-center text-base font-semibold text-white">Continue</Text>
        </TouchableOpacity>
      </KeyboardAwareScrollView>
    </View>
  );
}
