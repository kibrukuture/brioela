import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { CaretRight, UserCircle, UsersThree, Buildings } from 'phosphor-react-native';
import type { PaymentFlow } from '@/components/payments/payment';
import { BackButton } from '@/components/ui/back-button';

interface RecipientTypeStepProps {
  paymentFlow: PaymentFlow;
  setPaymentFlow: (flow: PaymentFlow) => void;
}

export function RecipientTypeStep({ paymentFlow, setPaymentFlow }: RecipientTypeStepProps) {
  const handleSelectType = (type: 'myself' | 'someone_else' | 'business_or_charity') => {
    setPaymentFlow({
      ...paymentFlow,
      recipient: { id: '', type, name: '', avatar: '' },
      step: 'find_recipient',
    });
  };

  const handleBack = () => {
    setPaymentFlow({ ...paymentFlow, step: 'amount' });
  };

  return (
    <View className="flex-1">
      <BackButton onPress={handleBack} />

      <ScrollView className="flex-1" contentContainerClassName="px-5 pb-10">
        <View className="mt-4">
          <Text className="mb-2 font-parafina text-4xl font-semibold text-neutral-900">
            Recipient
          </Text>
          <Text className="text-sm text-neutral-500">Who are you sending to?</Text>
        </View>

        <View className="mt-6 gap-3">
          <TouchableOpacity
            onPress={() => handleSelectType('myself')}
            activeOpacity={0.8}
            className="flex-row items-center gap-4 rounded-2xl border border-neutral-100 bg-white p-5">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-neutral-50">
              <UserCircle size={24} weight="bold" color="#171717" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-neutral-900">Myself</Text>
              <Text className="mt-1 text-sm text-neutral-500">Send to a bank account you own</Text>
            </View>
            <CaretRight size={18} weight="bold" color="#A3A3A3" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleSelectType('someone_else')}
            activeOpacity={0.8}
            className="flex-row items-center gap-4 rounded-2xl border border-neutral-100 bg-white p-5">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-neutral-50">
              <UsersThree size={24} weight="bold" color="#171717" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-neutral-900">Someone else</Text>
              <Text className="mt-1 text-sm text-neutral-500">Send to another person</Text>
            </View>
            <CaretRight size={18} weight="bold" color="#A3A3A3" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleSelectType('business_or_charity')}
            activeOpacity={0.8}
            className="flex-row items-center gap-4 rounded-2xl border border-neutral-100 bg-white p-5">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-neutral-50">
              <Buildings size={24} weight="bold" color="#171717" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-neutral-900">Business or charity</Text>
              <Text className="mt-1 text-sm text-neutral-500">Send to an organisation</Text>
            </View>
            <CaretRight size={18} weight="bold" color="#A3A3A3" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
