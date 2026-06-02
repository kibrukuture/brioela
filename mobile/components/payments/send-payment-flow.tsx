import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from 'expo-router';
import { AmountEntryStep } from '@/components/payments/amount-entry-step';
import { RecipientTypeStep } from '@/components/payments/recipient-type-step';
import { FindRecipientStep } from '@/components/payments/find-recipient-step';
import { AccountDetailsStep } from '@/components/payments/account-details-step';
import { UploadRecipientStep } from '@/components/payments/upload-recipient-step';
import { EmailPaymentStep } from '@/components/payments/email-payment-step';
import { ReviewPaymentStep } from '@/components/payments/review-payment-step';
import { ReviewSchnlPaymentStep } from '@/components/payments/review-schnl-payment-step';
import { PaymentConfirmation } from '@/components/payments/payment-confirmation';
import type { PaymentFlow } from '@/components/payments/payment';
import { SUPPORTED_CURRENCIES } from '@schnl/shared/constants';

export function SendPaymentFlow() {
  const navigation = useNavigation();
  const [paymentFlow, setPaymentFlow] = useState<PaymentFlow>({
    amount: 0,
    sourceCurrency: SUPPORTED_CURRENCIES[0],
    targetCurrency: SUPPORTED_CURRENCIES[0],
    recipient: null,
    accountDetails: null,
    step: 'amount',
  });

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (paymentFlow.step === 'amount' || paymentFlow.step === 'confirm') {
        return;
      }

      e.preventDefault();

      const previousStep: PaymentFlow['step'] =
        paymentFlow.step === 'recipient_type'
          ? 'amount'
          : paymentFlow.step === 'find_recipient'
            ? 'recipient_type'
            : paymentFlow.step === 'account_details'
              ? 'find_recipient'
              : paymentFlow.step === 'upload_recipient'
                ? 'find_recipient'
                : paymentFlow.step === 'email_payment'
                  ? 'find_recipient'
                  : paymentFlow.step === 'review_schnl'
                    ? 'find_recipient'
                    : paymentFlow.step === 'review'
                      ? 'account_details'
                      : 'amount';

      setPaymentFlow((prev) => ({ ...prev, step: previousStep }));
    });

    return unsubscribe;
  }, [navigation, paymentFlow.step]);

  if (paymentFlow.step === 'confirm') {
    return <PaymentConfirmation paymentFlow={paymentFlow} setPaymentFlow={setPaymentFlow} />;
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1">
        {paymentFlow.step === 'amount' && (
          <AmountEntryStep paymentFlow={paymentFlow} setPaymentFlow={setPaymentFlow} />
        )}
        {paymentFlow.step === 'recipient_type' && (
          <RecipientTypeStep paymentFlow={paymentFlow} setPaymentFlow={setPaymentFlow} />
        )}
        {paymentFlow.step === 'find_recipient' && (
          <FindRecipientStep paymentFlow={paymentFlow} setPaymentFlow={setPaymentFlow} />
        )}
        {paymentFlow.step === 'account_details' && (
          <AccountDetailsStep paymentFlow={paymentFlow} setPaymentFlow={setPaymentFlow} />
        )}
        {paymentFlow.step === 'upload_recipient' && (
          <UploadRecipientStep paymentFlow={paymentFlow} setPaymentFlow={setPaymentFlow} />
        )}
        {paymentFlow.step === 'email_payment' && (
          <EmailPaymentStep paymentFlow={paymentFlow} setPaymentFlow={setPaymentFlow} />
        )}
        {paymentFlow.step === 'review_schnl' && (
          <ReviewSchnlPaymentStep paymentFlow={paymentFlow} setPaymentFlow={setPaymentFlow} />
        )}
        {paymentFlow.step === 'review' && (
          <ReviewPaymentStep paymentFlow={paymentFlow} setPaymentFlow={setPaymentFlow} />
        )}
      </View>
    </SafeAreaView>
  );
}
