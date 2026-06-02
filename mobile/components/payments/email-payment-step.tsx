import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Info } from 'phosphor-react-native';
import type { PaymentFlow } from '@/components/payments/payment';
import { BackButton } from '@/components/ui/back-button';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Controller, useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@/lib/forms/zod-resolver';
import { emailPaymentSchema } from '@/ui-schema';
import * as Burnt from 'burnt';
import { useCreatePayRequestByEmail } from '@/hooks/banking/use-create-pay-request-by-email';
import { decimalStringToAtomicString } from '@schnl/shared/utils/money';
import { PAYOUT_CURRENCIES } from '@schnl/shared/constants';
import { AccountDetails } from '@/components/payments/payment';

interface EmailPaymentStepProps {
  paymentFlow: PaymentFlow;
  setPaymentFlow: (flow: PaymentFlow) => void;
}

type EmailPaymentFormValues = {
  email: string;
  fullName: string;
};

export function EmailPaymentStep({ paymentFlow, setPaymentFlow }: EmailPaymentStepProps) {
  const createPayRequest = useCreatePayRequestByEmail();

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<EmailPaymentFormValues>({
    defaultValues: {
      email: '',
      fullName: '',
    },
    mode: 'onChange',
    resolver: zodResolver(emailPaymentSchema),
  });

  const handleBack = () => {
    setPaymentFlow({ ...paymentFlow, step: 'find_recipient' });
  };

  const onSubmit: SubmitHandler<EmailPaymentFormValues> = async (values) => {
    const accountDetails: AccountDetails = {
      region: 'inside_europe',
      fullName: values.fullName,
      email: values.email,
      bankName: '',
    };

    try {
      const sourceCurrency = paymentFlow.sourceCurrency.code.toLowerCase() as unknown as Parameters<
        typeof createPayRequest.mutateAsync
      >[0]['sourceCurrency'];

      await createPayRequest.mutateAsync({
        recipientEmail: values.email,
        recipientName: values.fullName,
        amountAtomic: decimalStringToAtomicString(paymentFlow.amount.toFixed(2), sourceCurrency),
        sourceCurrency,
        payoutCurrency: PAYOUT_CURRENCIES.usd,
      });

      setPaymentFlow({ ...paymentFlow, accountDetails, step: 'confirm' });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to create pay request';
      Burnt.alert({ title: 'Oh no!', message, preset: 'error' });
    }
  };

  return (
    <View className="flex-1">
      <BackButton onPress={handleBack} />

      <KeyboardAwareScrollView className="flex-1" contentContainerClassName="px-5 pb-10">
        <View className="mt-4">
          <Text className="mb-2 font-parafina text-4xl font-semibold text-neutral-900">
            Pay by email
          </Text>
          <Text className="text-sm text-neutral-500">
            We'll email your recipient to request their bank details.
          </Text>
        </View>

        <View className="mt-6 rounded-2xl border border-neutral-100 bg-white p-5">
          <Text className="text-xs font-medium text-neutral-500">Recipient email</Text>

          {/* Email */}
          <View className="mt-3 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4">
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoFocus
                  placeholder="name@email.com"
                  placeholderTextColor="#A3A3A3"
                  className="text-base text-neutral-900"
                  autoComplete="email"
                  textContentType="emailAddress"
                  importantForAutofill="yes"
                />
              )}
            />
          </View>
          {!!errors.email?.message && (
            <Text className="mt-2 text-xs text-red-500">{errors.email.message}</Text>
          )}

          {/* Info Box */}
          <View className="mt-5 flex-row gap-3 rounded-2xl bg-neutral-50 p-4">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-neutral-900">
              <Info size={18} weight="bold" color="#fff" />
            </View>
            <Text className="flex-1 text-sm leading-relaxed text-neutral-700">
              We'll request bank details by email. If they don't respond, the money will be
              refunded.
            </Text>
          </View>

          {/* Full Name */}
          <View className="mt-5">
            <Text className="text-xs font-medium text-neutral-500">Recipient name</Text>
            <View className="mt-3 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4">
              <Controller
                control={control}
                name="fullName"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    placeholder="Full name"
                    placeholderTextColor="#A3A3A3"
                    className="text-base text-neutral-900"
                  />
                )}
              />
            </View>
            {!!errors.fullName?.message && (
              <Text className="mt-2 text-xs text-red-500">{errors.fullName.message}</Text>
            )}
          </View>
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          onPress={handleSubmit(onSubmit)}
          activeOpacity={0.8}
          disabled={!isValid || createPayRequest.isPending}
          className="mt-6 items-center rounded-xl bg-neutral-900 px-5 py-4">
          {createPayRequest.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-base font-semibold text-white">Continue</Text>
          )}
        </TouchableOpacity>
      </KeyboardAwareScrollView>
    </View>
  );
}
