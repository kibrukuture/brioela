import { View, Text, TouchableOpacity, TextInput, Switch } from 'react-native';
import type { PaymentFlow } from '@/components/payments/payment';
import { BackButton } from '@/components/ui/back-button';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { AccountDetailsForm } from '@/components/payments/account-details-form';
import { usePaymentFlowStore } from '@/stores/payments/use-payment-flow-store';
import { TransferPurposeSheet } from '@/components/payments/transfer-purpose-sheet';
import { recipientAccountDetails } from '@/helpers/payments/recipient-account-details';
import { useState } from 'react';

interface AccountDetailsStepProps {
  paymentFlow: PaymentFlow;
  setPaymentFlow: (flow: PaymentFlow) => void;
}

export function AccountDetailsStep({ paymentFlow, setPaymentFlow }: AccountDetailsStepProps) {
  const storeAccountDetails = usePaymentFlowStore((state) => state.accountDetails);
  const isAccountDetailsComplete = usePaymentFlowStore((state) => state.isAccountDetailsComplete);
  const transferPurpose = usePaymentFlowStore((state) => state.transferPurpose);
  const setTransferPurpose = usePaymentFlowStore((state) => state.setTransferPurpose);
  const saveRecipient = usePaymentFlowStore((state) => state.saveRecipient);
  const setSaveRecipient = usePaymentFlowStore((state) => state.setSaveRecipient);
  const label = usePaymentFlowStore((state) => state.label);
  const setLabel = usePaymentFlowStore((state) => state.setLabel);

  const [isTransferPurposeSheetVisible, setIsTransferPurposeSheetVisible] = useState(false);

  const handleBack = () => {
    setPaymentFlow({ ...paymentFlow, step: 'find_recipient' });
  };

  const handleContinue = () => {
    const mapped = recipientAccountDetails(storeAccountDetails);
    if (!mapped) return;

    setPaymentFlow({
      ...paymentFlow,
      accountDetails: mapped,
      step: 'review',
    });
  };

  const canContinue =
    isAccountDetailsComplete() &&
    Boolean(transferPurpose) &&
    (!saveRecipient || label.trim().length > 0);

  return (
    <View className="flex-1">
      <BackButton onPress={handleBack} />

      <KeyboardAwareScrollView className="flex-1" contentContainerClassName="px-5 pb-10">
        <AccountDetailsForm />

        <View className="mt-6 rounded-2xl border border-neutral-100 bg-white p-5">
          <Text className="text-xs font-medium text-neutral-500">Transfer purpose</Text>
          <TouchableOpacity
            onPress={() => setIsTransferPurposeSheetVisible(true)}
            activeOpacity={0.8}
            className="mt-3 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4">
            <Text className="text-base text-neutral-900">
              {transferPurpose ? transferPurpose.replace(/_/g, ' ') : 'Select a purpose'}
            </Text>
          </TouchableOpacity>

          <View className="mt-5 flex-row items-center justify-between">
            <View className="flex-1 pr-4">
              <Text className="text-sm font-semibold text-neutral-900">Save for later</Text>
              <Text className="mt-1 text-xs text-neutral-500">
                Save this recipient so you can send again without re-entering details.
              </Text>
            </View>
            <Switch value={saveRecipient} onValueChange={setSaveRecipient} />
          </View>

          {saveRecipient && (
            <View className="mt-4">
              <Text className="text-xs font-medium text-neutral-500">Label</Text>
              <View className="mt-3 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4">
                <TextInput
                  value={label}
                  onChangeText={setLabel}
                  placeholder="e.g. Mom, Rent, Business"
                  placeholderTextColor="#A3A3A3"
                  className="text-base text-neutral-900"
                />
              </View>
            </View>
          )}
        </View>

        <TouchableOpacity
          onPress={handleContinue}
          activeOpacity={0.8}
          disabled={!canContinue}
          className={`mt-6 items-center rounded-xl px-5 py-4 ${
            !canContinue ? 'bg-neutral-300' : 'bg-neutral-900'
          }`}>
          <Text className="text-base font-semibold text-white">Continue</Text>
        </TouchableOpacity>
      </KeyboardAwareScrollView>

      <TransferPurposeSheet
        isVisible={isTransferPurposeSheetVisible}
        value={transferPurpose}
        onConfirm={(value) => setTransferPurpose(value)}
        onClose={() => setIsTransferPurposeSheetVisible(false)}
      />
    </View>
  );
}
