import { View, Text, TouchableOpacity } from 'react-native';
import { CheckCircle2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import type { PaymentFlow } from '@/components/payments/payment';

interface PaymentConfirmationProps {
  paymentFlow: PaymentFlow;
  setPaymentFlow: (flow: PaymentFlow) => void;
}

export function PaymentConfirmation({ paymentFlow }: PaymentConfirmationProps) {
  const router = useRouter();

  const recipientName = paymentFlow.accountDetails?.fullName ?? paymentFlow.recipient?.name ?? '';

  return (
    <View className="flex-1 bg-white px-5">
      <View className="flex-1 items-center justify-center">
        <View className="h-24 w-24 items-center justify-center rounded-full bg-neutral-900">
          <CheckCircle2 size={56} color="#fff" />
        </View>

        <Text className="mt-6 text-center font-parafina text-4xl font-semibold text-neutral-900">
          Payment sent
        </Text>
        <Text className="mt-2 text-center text-sm text-neutral-500">
          Your transfer of {paymentFlow.sourceCurrency.symbol}
          {paymentFlow.amount.toFixed(2)} is on its way.
        </Text>

        <View className="mt-8 w-full rounded-2xl border border-neutral-100 bg-neutral-50 p-5">
          <View className="flex-row justify-between">
            <Text className="text-sm text-neutral-500">Recipient</Text>
            <Text className="text-sm font-medium text-neutral-900">{recipientName}</Text>
          </View>
          <View className="mt-3 flex-row justify-between">
            <Text className="text-sm text-neutral-500">Amount</Text>
            <Text className="text-sm font-medium text-neutral-900">
              {paymentFlow.sourceCurrency.symbol}
              {paymentFlow.amount.toFixed(2)}
            </Text>
          </View>
          <View className="mt-3 flex-row justify-between">
            <Text className="text-sm text-neutral-500">Estimated arrival</Text>
            <Text className="text-sm font-medium text-neutral-900">1-2 business days</Text>
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

        <TouchableOpacity
          onPress={() => router.push({ pathname: '/transactions/send-payment' })}
          activeOpacity={0.8}
          className="mt-3 items-center rounded-xl border border-neutral-200 bg-white px-5 py-4">
          <Text className="text-base font-semibold text-neutral-900">Send another</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
