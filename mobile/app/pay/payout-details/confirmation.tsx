import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { CheckCircle2, XCircle } from 'lucide-react-native';
import { usePayRequest } from '@/hooks/banking/use-pay-request';
import { atomicToDecimalString, parseAmountAtomic } from '@brioela/shared/utils/money';

export default function PayRequestPayoutDetailsConfirmationPage() {
  const params = useLocalSearchParams<{ id?: string; justSubmitted?: string }>();
  const id = typeof params.id === 'string' ? params.id : undefined;
  const justSubmitted = params.justSubmitted === '1';

  const payRequestQuery = usePayRequest(id);
  const payRequest = payRequestQuery.data?.payRequest;

  const rawCurrency = payRequest?.sourceCurrency;
  const sourceCurrency =
    rawCurrency === 'usd' || rawCurrency === 'eur' || rawCurrency === 'aed'
      ? rawCurrency
      : undefined;

  const amountDecimal =
    payRequest?.amountAtomic && sourceCurrency
      ? atomicToDecimalString(parseAmountAtomic(payRequest.amountAtomic), sourceCurrency)
      : undefined;

  const senderName =
    `${payRequest?.senderFirstName ?? ''} ${payRequest?.senderLastName ?? ''}`.trim();

  const status = payRequest?.status;
  const isFailed = !justSubmitted && (status === 'failed' || Boolean(payRequest?.failedAt));
  const isCompleted =
    !justSubmitted && (status === 'completed' || Boolean(payRequest?.completedAt));

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
  } else if (!id || !payRequest || !amountDecimal || !sourceCurrency) {
    content = (
      <View className="mt-10">
        <Text className="text-sm text-red-600">Missing pay request data</Text>
      </View>
    );
  } else {
    const title = isFailed ? 'Payout failed' : isCompleted ? 'Payout sent' : 'Details submitted';
    const subtitle = isFailed
      ? 'We could not complete this payout. Please contact support.'
      : isCompleted
        ? `Your payout of ${amountDecimal} ${sourceCurrency.toUpperCase()} has been sent.`
        : `Your payout of ${amountDecimal} ${sourceCurrency.toUpperCase()} is being processed.`;

    content = (
      <View className="flex-1 justify-between bg-white px-5">
        <View className="flex-1 items-center justify-center">
          <View
            className={`h-24 w-24 items-center justify-center rounded-full ${
              isFailed ? 'bg-red-600' : 'bg-neutral-900'
            }`}>
            {isFailed ? (
              <XCircle size={56} color="#fff" />
            ) : (
              <CheckCircle2 size={56} color="#fff" />
            )}
          </View>

          <Text className="mt-6 text-center font-parafina text-4xl font-semibold text-neutral-900">
            {title}
          </Text>
          <Text className="mt-2 text-center text-sm text-neutral-500">{subtitle}</Text>

          <View className="mt-8 w-full rounded-2xl border border-neutral-100 bg-neutral-50 p-5">
            {senderName ? (
              <View className="flex-row justify-between">
                <Text className="text-sm text-neutral-500">From</Text>
                <Text className="text-sm font-medium text-neutral-900">{senderName}</Text>
              </View>
            ) : null}

            <View className={`${senderName ? 'mt-3 ' : ''}flex-row justify-between`}>
              <Text className="text-sm text-neutral-500">Amount</Text>
              <Text className="text-sm font-medium text-neutral-900">
                {amountDecimal} {sourceCurrency.toUpperCase()}
              </Text>
            </View>

            <View className="mt-3 flex-row justify-between">
              <Text className="text-sm text-neutral-500">Next</Text>
              <Text className="text-sm font-medium text-neutral-900">
                {isFailed
                  ? 'Try again later'
                  : isCompleted
                    ? 'Done'
                    : 'We’ll send your payout soon'}
              </Text>
            </View>
          </View>
        </View>

        <View className="pb-10">
          <TouchableOpacity
            onPress={() => router.push('/')}
            activeOpacity={0.8}
            className="items-center rounded-xl bg-neutral-900 px-5 py-4">
            <Text className="text-base font-semibold text-white">Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return <SafeAreaView className="flex-1 bg-white">{content}</SafeAreaView>;
}
