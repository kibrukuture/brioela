import { View, Text } from 'react-native';
import { usePaymentFlowStore } from '@/stores/payments/use-payment-flow-store';
import { AccountDetailsAch } from '@/components/payments/account-details-ach';
import { AccountDetailsIbanSepa } from '@/components/payments/account-details-iban-sepa';
import { AccountDetailsIbanSingle } from '@/components/payments/account-details-iban-single';

export function AccountDetailsForm() {
  const accountDetailsType = usePaymentFlowStore((state) => state.getAccountDetailsType());

  if (!accountDetailsType) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-sm text-neutral-500">Please select a currency first.</Text>
      </View>
    );
  }

  switch (accountDetailsType) {
    case 'ach':
      return <AccountDetailsAch />;
    case 'iban_sepa':
      return <AccountDetailsIbanSepa />;
    case 'iban_single':
      return <AccountDetailsIbanSingle />;
  }
}
