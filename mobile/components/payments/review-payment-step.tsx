import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import type { PaymentFlow } from '@/components/payments/payment';
import { BackButton } from '@/components/ui/back-button';
import { formatIbanForDisplay } from '@brioela/shared/lib';
import { usePaymentFlowStore } from '@/stores/payments/use-payment-flow-store';
import type { CreateOutgoingPayoutInput } from '@brioela/shared/validators/outgoing-payout.validator';
import { decimalStringToAtomicString } from '@brioela/shared/utils/money';
import { useCreateOutgoingPayout } from '@/network/banking/use-create-outgoing-payout';
import { usePrecheckOutgoingPayout } from '@/network/banking/use-precheck-outgoing-payout';
import * as Burnt from 'burnt';

interface ReviewPaymentStepProps {
  paymentFlow: PaymentFlow;
  setPaymentFlow: (flow: PaymentFlow) => void;
}

export function ReviewPaymentStep({ paymentFlow, setPaymentFlow }: ReviewPaymentStepProps) {
  const createPayout = useCreateOutgoingPayout();
  const precheck = usePrecheckOutgoingPayout();
  const storeAccountDetails = usePaymentFlowStore((state) => state.accountDetails);
  const transferPurpose = usePaymentFlowStore((state) => state.transferPurpose);
  const saveRecipient = usePaymentFlowStore((state) => state.saveRecipient);
  const label = usePaymentFlowStore((state) => state.label);

  const handleBack = () => {
    setPaymentFlow({ ...paymentFlow, step: 'account_details' });
  };

  const handleConfirm = async () => {
    if (!storeAccountDetails) return;
    if (!transferPurpose) {
      setPaymentFlow({ ...paymentFlow, step: 'account_details' });
      return;
    }

    if (saveRecipient && !label.trim()) {
      setPaymentFlow({ ...paymentFlow, step: 'account_details' });
      return;
    }

    const transferPurposeValue: CreateOutgoingPayoutInput['transferPurpose'] = transferPurpose;

    const currency = (() => {
      switch (paymentFlow.sourceCurrency.code) {
        case 'USD':
          return 'usd' as const;
        case 'EUR':
          return 'eur' as const;
        case 'AED':
          return 'aed' as const;
      }
    })();

    const amountAtomic = decimalStringToAtomicString(String(paymentFlow.amount), currency);

    const bankDetails: CreateOutgoingPayoutInput['bankDetails'] = (() => {
      switch (storeAccountDetails.type) {
        case 'ach':
          return {
            type: 'ach',
            bankName: storeAccountDetails.bankName,
            accountNumber: storeAccountDetails.accountNumber,
            routingNumber: storeAccountDetails.routingNumber,
            accountType: storeAccountDetails.accountType,
          };
        case 'iban_sepa':
          return {
            type: 'iban_sepa',
            bankName: storeAccountDetails.bankName,
            iban: storeAccountDetails.iban,
            swift: storeAccountDetails.swift ?? '',
          };
        case 'iban_single':
          return {
            type: 'iban_single',
            bankName: storeAccountDetails.bankName,
            iban: storeAccountDetails.iban,
            swift: storeAccountDetails.swift ?? '',
          };
      }
    })();

    const input: CreateOutgoingPayoutInput = {
      amountAtomic,
      currency,
      bankDetails,
      recipientFullName: storeAccountDetails.fullName,
      transferPurpose: transferPurposeValue,
      saveRecipient,
      label: saveRecipient ? label : undefined,
    };

    try {
      const precheckResult = await precheck.mutateAsync(input);
      if (!precheckResult.ok) {
        const message = precheckResult.issues[0]?.message ?? 'Transfer is not ready';
        Burnt.alert({ title: 'Oh no!', message, preset: 'error' });
        return;
      }

      await createPayout.mutateAsync(input);
      setPaymentFlow({ ...paymentFlow, step: 'confirm' });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to send payment';
      Burnt.alert({ title: 'Oh no!', message, preset: 'error' });
    }
  };

  const fee = paymentFlow.amount * 0.005;
  const total = paymentFlow.amount + fee;

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

        <View className="mt-6 rounded-2xl border border-neutral-100 bg-neutral-50 p-5">
          <Text className="text-sm font-semibold text-neutral-900">Recipient</Text>
          <Text className="mt-2 text-sm text-neutral-600">
            {paymentFlow.accountDetails?.fullName}
          </Text>

          {paymentFlow.accountDetails?.iban && (
            <View className="mt-4">
              <Text className="text-xs text-neutral-500">IBAN</Text>
              <Text className="mt-1 font-mono text-sm text-neutral-900">
                {formatIbanForDisplay(paymentFlow.accountDetails.iban)}
              </Text>
            </View>
          )}

          {paymentFlow.accountDetails?.swift && (
            <View className="mt-4">
              <Text className="text-xs text-neutral-500">SWIFT</Text>
              <Text className="mt-1 font-mono text-sm text-neutral-900">
                {paymentFlow.accountDetails.swift}
              </Text>
            </View>
          )}

          {paymentFlow.accountDetails?.accountNumber && (
            <View className="mt-4">
              <Text className="text-xs text-neutral-500">Account number</Text>
              <Text className="mt-1 font-mono text-sm text-neutral-900">
                {paymentFlow.accountDetails.accountNumber}
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          onPress={handleConfirm}
          activeOpacity={0.8}
          disabled={createPayout.isPending || precheck.isPending}
          className="mt-6 items-center rounded-xl bg-neutral-900 px-5 py-4">
          {createPayout.isPending || precheck.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-base font-semibold text-white">Confirm and send</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
