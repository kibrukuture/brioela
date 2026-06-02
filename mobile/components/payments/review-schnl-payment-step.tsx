import { View, Text, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import { BackButton } from '@/components/ui/back-button';
import type { PaymentFlow } from '@/components/payments/payment';
import { usePaymentFlowStore } from '@/stores/payments/use-payment-flow-store';
import { TransferPurposeSheet } from '@/components/payments/transfer-purpose-sheet';
import { useState } from 'react';
import { useCreatePeerToPeerTransfer } from '@/hooks/banking/use-create-peer-to-peer-transfer';
import { usePrecheckPeerToPeerTransfer } from '@/hooks/banking/use-precheck-peer-to-peer-transfer';
import * as Burnt from 'burnt';
import { decimalStringToAtomicString } from '@schnl/shared/utils/money';
import type { CreatePeerToPeerTransferInput } from '@schnl/shared/validators/peer-to-peer-transfer.validator';

interface ReviewSchnlPaymentStepProps {
  paymentFlow: PaymentFlow;
  setPaymentFlow: (flow: PaymentFlow) => void;
}

export function ReviewSchnlPaymentStep({
  paymentFlow,
  setPaymentFlow,
}: ReviewSchnlPaymentStepProps) {
  const recipient = paymentFlow.recipient;
  const createTransfer = useCreatePeerToPeerTransfer();
  const precheck = usePrecheckPeerToPeerTransfer();
  const transferPurpose = usePaymentFlowStore((state) => state.transferPurpose);
  const setTransferPurpose = usePaymentFlowStore((state) => state.setTransferPurpose);
  const [isTransferPurposeSheetVisible, setIsTransferPurposeSheetVisible] = useState(false);

  const handleBack = () => {
    setPaymentFlow({ ...paymentFlow, step: 'find_recipient' });
  };

  const handleConfirm = async () => {
    if (!recipient?.id) return;
    if (!transferPurpose) {
      Burnt.alert({
        title: 'Missing info',
        message: 'Please select a transfer purpose',
        preset: 'error',
      });
      return;
    }

    const currency = (() => {
      switch (paymentFlow.sourceCurrency.code) {
        case 'USD':
          return 'usd';
        case 'EUR':
          return 'eur';
        case 'AED':
          return 'aed';
      }
    })();

    const input: CreatePeerToPeerTransferInput = {
      recipientUserId: recipient.id,
      amountAtomic: decimalStringToAtomicString(paymentFlow.amount.toFixed(2), currency),
      currency,
      transferPurpose,
    };

    try {
      const precheckResult = await precheck.mutateAsync({
        recipientUserId: recipient.id,
        currency,
      });
      if (!precheckResult.ok) {
        const message = precheckResult.issues[0]?.message ?? 'Recipient is not ready';
        Burnt.alert({ title: 'Oh no!', message, preset: 'error' });
        return;
      }

      await createTransfer.mutateAsync(input);
      setPaymentFlow({ ...paymentFlow, step: 'confirm' });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to send payment';
      Burnt.alert({ title: 'Oh no!', message, preset: 'error' });
    }
  };

  const fee = paymentFlow.amount * 0.005;
  const total = paymentFlow.amount + fee;

  if (!recipient) {
    return (
      <View className="flex-1 bg-white">
        <BackButton onPress={handleBack} />
        <View className="flex-1 items-center justify-center px-5">
          <Text className="text-base text-neutral-700">No recipient selected.</Text>
        </View>

        <View className="mt-6 rounded-2xl border border-neutral-100 bg-white p-5">
          <Text className="text-xs font-medium text-neutral-500">Transfer purpose</Text>
          <TouchableOpacity
            onPress={() => setIsTransferPurposeSheetVisible(true)}
            activeOpacity={0.8}
            className="mt-3 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4">
            <Text className="text-base text-neutral-900">
              {(transferPurpose ?? 'none').replace(/_/g, ' ')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <BackButton onPress={handleBack} />

      <ScrollView className="flex-1" contentContainerClassName="px-5 pb-10">
        <View className="mt-4">
          <Text className="mb-2 font-parafina text-4xl font-semibold text-neutral-900">
            Review transfer
          </Text>
          <Text className="text-sm text-neutral-500">Double-check details before sending.</Text>
        </View>

        <View className="mt-6 rounded-2xl border border-neutral-100 bg-white p-5">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-neutral-500">You send</Text>
            <Text className="text-lg font-semibold text-neutral-900">
              {paymentFlow.sourceCurrency.symbol}
              {paymentFlow.amount.toFixed(2)}
            </Text>
          </View>

          <View className="mt-3 flex-row items-center justify-between">
            <Text className="text-sm text-neutral-500">Fee</Text>
            <Text className="text-sm font-medium text-neutral-900">
              {paymentFlow.sourceCurrency.symbol}
              {fee.toFixed(2)}
            </Text>
          </View>

          <View className="mt-4 flex-row items-center justify-between border-t border-neutral-200 pt-4">
            <Text className="text-sm text-neutral-500">Total</Text>
            <Text className="text-lg font-semibold text-neutral-900">
              {paymentFlow.sourceCurrency.symbol}
              {total.toFixed(2)}
            </Text>
          </View>
        </View>

        <View className="mt-6 rounded-2xl border border-neutral-100 bg-white p-5">
          <Text className="text-xs font-medium text-neutral-500">Transfer purpose</Text>
          <TouchableOpacity
            onPress={() => setIsTransferPurposeSheetVisible(true)}
            activeOpacity={0.8}
            className="mt-3 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4">
            <Text className="text-base text-neutral-900">
              {(transferPurpose ?? 'none').replace(/_/g, ' ')}
            </Text>
          </TouchableOpacity>
        </View>

        <View className="mt-6 rounded-2xl border border-neutral-100 bg-neutral-50 p-5">
          <Text className="text-sm font-semibold text-neutral-900">Recipient</Text>

          <View className="mt-4 flex-row items-center gap-4">
            {recipient.avatar ? (
              <Image source={{ uri: recipient.avatar }} className="h-12 w-12 rounded-full" />
            ) : (
              <View className="h-12 w-12 items-center justify-center rounded-full bg-neutral-200">
                <Text className="text-base font-semibold text-neutral-700">
                  {(recipient.name || recipient.schnltag || '?').slice(0, 1).toUpperCase()}
                </Text>
              </View>
            )}

            <View className="flex-1">
              <Text className="text-base font-semibold text-neutral-900">{recipient.name}</Text>
              {!!recipient.schnltag && (
                <Text className="mt-0.5 text-sm text-neutral-500">@{recipient.schnltag}</Text>
              )}
            </View>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleConfirm}
          activeOpacity={0.8}
          disabled={createTransfer.isPending || precheck.isPending}
          className="mt-6 items-center rounded-xl bg-neutral-900 px-5 py-4">
          {createTransfer.isPending || precheck.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-base font-semibold text-white">Confirm and send</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      <TransferPurposeSheet
        isVisible={isTransferPurposeSheetVisible}
        value={transferPurpose}
        onConfirm={(next) => setTransferPurpose(next)}
        onClose={() => setIsTransferPurposeSheetVisible(false)}
      />
    </View>
  );
}
