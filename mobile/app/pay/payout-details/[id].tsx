import React from 'react';
import { useIsomorphicLayoutEffect } from 'usehooks-ts';
import { ActivityIndicator, Text, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { usePayRequest } from '@/network/banking/use-pay-request';
import { PayRequestPayoutDetailsForm } from '@/components/payments/pay-request-payout-details-form';
import { BackButton } from '@/components/ui/back-button';
import { atomicToDecimalString, parseAmountAtomic } from '@brioela/shared/utils/money';

export default function PayPayoutDetailsPage() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === 'string' ? params.id : undefined;

  const payRequestQuery = usePayRequest(id);
  const rawCurrency = payRequestQuery.data?.payRequest?.sourceCurrency;
  const sourceCurrency = (
    rawCurrency === 'usd' || rawCurrency === 'eur' || rawCurrency === 'aed'
      ? rawCurrency
      : undefined
  ) as 'usd' | 'eur' | 'aed' | undefined;

  const amountAtomic = payRequestQuery.data?.payRequest?.amountAtomic;
  const amountDecimal =
    amountAtomic && sourceCurrency
      ? atomicToDecimalString(parseAmountAtomic(amountAtomic), sourceCurrency)
      : undefined;

  const senderFirstName = payRequestQuery.data?.payRequest?.senderFirstName;
  const senderLastName = payRequestQuery.data?.payRequest?.senderLastName;
  const senderName = `${senderFirstName ?? ''} ${senderLastName ?? ''}`.trim();

  const status = payRequestQuery.data?.payRequest?.status;
  const payoutDetailsSubmittedAt = payRequestQuery.data?.payRequest?.payoutDetailsSubmittedAt;

  useIsomorphicLayoutEffect(() => {
    if (!id) return;
    if (!status) return;

    const alreadySubmitted = Boolean(payoutDetailsSubmittedAt);
    const notInDetailsStage = status !== 'claimed';
    if (alreadySubmitted || notInDetailsStage) {
      router.replace({ pathname: '/pay/payout-details/confirmation', params: { id } });
    }
  }, [id, payoutDetailsSubmittedAt, status]);

  let content: React.ReactElement;
  if (payRequestQuery.isPending) {
    content = (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  } else if (payRequestQuery.isError) {
    content = (
      <View className="mt-10">
        <Text className="text-sm text-red-600">{payRequestQuery.error.message}</Text>
      </View>
    );
  } else if (!id || !sourceCurrency) {
    content = (
      <View className="mt-10">
        <Text className="text-sm text-red-600">Missing pay request data</Text>
      </View>
    );
  } else if (status !== 'claimed' || payoutDetailsSubmittedAt) {
    content = (
      <View className="mt-10">
        <ActivityIndicator size="large" />
      </View>
    );
  } else {
    content = (
      <PayRequestPayoutDetailsForm key={sourceCurrency} id={id} sourceCurrency={sourceCurrency} />
    );
  }

  let amountBanner: React.ReactElement | null = null;
  if (amountDecimal && sourceCurrency) {
    amountBanner = (
      <View className="mt-6 rounded-2xl border border-neutral-100 bg-white p-5">
        <Text className="text-xs font-medium text-neutral-500">You will receive</Text>
        <Text className="mt-2 text-2xl font-semibold text-neutral-900">
          {amountDecimal} {sourceCurrency.toUpperCase()}
        </Text>
        {senderName ? (
          <Text className="mt-1 text-sm text-neutral-500">From {senderName}</Text>
        ) : null}
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <BackButton onPress={() => router.replace('/')} />

      <KeyboardAwareScrollView className="flex-1" contentContainerClassName="px-5 pb-10">
        <View className="mt-6">
          <Text className="font-parafina text-4xl font-semibold text-neutral-900">Get paid</Text>
          <Text className="mt-2 text-sm text-neutral-500">
            Add your bank details to receive this payment.
          </Text>
        </View>

        {amountBanner}

        {content}
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
