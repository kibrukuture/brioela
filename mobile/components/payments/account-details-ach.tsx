import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Question, CaretDown } from 'phosphor-react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@/lib/forms/zod-resolver';
import { z } from '@brioela/shared/zod';
import { usePaymentFlowStore } from '@/stores/payments/use-payment-flow-store';
import { Sheet, useSheetRef } from '@/components/ui/sheet';
import { useMemo, useState } from 'react';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { PLACEHOLDERS } from '@brioela/shared/constants';

const achAccountDetailsSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  bankName: z.string().min(1, 'Bank name is required'),
  accountNumber: z.string().min(4, 'Account number is required'),
  routingNumber: z.string().length(9, 'Routing number must be 9 digits'),
  accountType: z.enum(['checking', 'savings']),
});

type AchAccountDetailsFormValues = z.infer<typeof achAccountDetailsSchema>;

export function AccountDetailsAch() {
  const setAccountDetails = usePaymentFlowStore((state) => state.setAccountDetails);
  const existingDetails = usePaymentFlowStore((state) =>
    state.accountDetails?.type === 'ach' ? state.accountDetails : null
  );
  const { showActionSheetWithOptions } = useActionSheet();

  type HelpTopic = 'account_number' | 'routing_number';
  const [helpTopic, setHelpTopic] = useState<HelpTopic>('account_number');
  const helpSheetRef = useSheetRef();
  const helpSnapPoints = useMemo(() => ['38%'], []);

  const { control, getValues } = useForm<AchAccountDetailsFormValues>({
    defaultValues: {
      fullName: existingDetails?.fullName ?? '',
      bankName: existingDetails?.bankName ?? '',
      accountNumber: existingDetails?.accountNumber ?? '',
      routingNumber: existingDetails?.routingNumber ?? '',
      accountType: existingDetails?.accountType ?? 'checking',
    },
    mode: 'onChange',
    resolver: zodResolver(achAccountDetailsSchema),
  });

  const maybePersist = () => {
    const parsed = achAccountDetailsSchema.safeParse(getValues());
    if (!parsed.success) return;
    setAccountDetails({ type: 'ach', ...parsed.data });
  };

  const openHelp = (topic: HelpTopic) => {
    setHelpTopic(topic);
    helpSheetRef.current?.present();
  };

  const openAccountTypePicker = (onChange: (value: 'checking' | 'savings') => void) => {
    showActionSheetWithOptions(
      {
        options: ['Checking', 'Savings', 'Cancel'],
        cancelButtonIndex: 2,
        title: 'Account Type',
      },
      (buttonIndex) => {
        if (buttonIndex === 0) {
          onChange('checking');
          maybePersist();
        }
        if (buttonIndex === 1) {
          onChange('savings');
          maybePersist();
        }
      }
    );
  };

  return (
    <View>
      <View className="mt-4">
        <Text className="mb-2 font-parafina text-4xl font-semibold text-neutral-900">
          ACH Account Details
        </Text>
        <Text className="text-sm text-neutral-500">Enter US bank account information.</Text>
      </View>

      <View className="mt-6 gap-4">
        <View>
          <Text className="mb-2 text-sm font-medium text-neutral-700">Full Name</Text>
          <Controller
            control={control}
            name="fullName"
            render={({ field: { value, onChange }, fieldState: { error } }) => (
              <>
                <TextInput
                  value={value}
                  onChangeText={(text) => {
                    onChange(text);
                    maybePersist();
                  }}
                  placeholder={PLACEHOLDERS.FULL_NAME}
                  className="rounded-xl border border-neutral-200 bg-white px-4 py-4 text-base text-neutral-900"
                  placeholderTextColor="#A3A3A3"
                />
                {error && <Text className="mt-1 text-xs text-red-600">{error.message}</Text>}
              </>
            )}
          />
        </View>

        <View>
          <Text className="mb-2 text-sm font-medium text-neutral-700">Bank Name</Text>
          <Controller
            control={control}
            name="bankName"
            render={({ field: { value, onChange }, fieldState: { error } }) => (
              <>
                <TextInput
                  value={value}
                  onChangeText={(text) => {
                    onChange(text);
                    maybePersist();
                  }}
                  placeholder="Chase Bank"
                  className="rounded-xl border border-neutral-200 bg-white px-4 py-4 text-base text-neutral-900"
                  placeholderTextColor="#A3A3A3"
                />
                {error && <Text className="mt-1 text-xs text-red-600">{error.message}</Text>}
              </>
            )}
          />
        </View>

        <View>
          <View className="mb-2 flex-row items-center gap-2">
            <Text className="text-sm font-medium text-neutral-700">Account Number</Text>
            <TouchableOpacity activeOpacity={0.8} onPress={() => openHelp('account_number')}>
              <Question size={14} weight="bold" color="#A3A3A3" />
            </TouchableOpacity>
          </View>
          <Controller
            control={control}
            name="accountNumber"
            render={({ field: { value, onChange }, fieldState: { error } }) => (
              <>
                <TextInput
                  value={value}
                  onChangeText={(text) => {
                    onChange(text);
                    maybePersist();
                  }}
                  placeholder="000123456789"
                  keyboardType="number-pad"
                  className="rounded-xl border border-neutral-200 bg-white px-4 py-4 text-base text-neutral-900"
                  placeholderTextColor="#A3A3A3"
                />
                {error && <Text className="mt-1 text-xs text-red-600">{error.message}</Text>}
              </>
            )}
          />
        </View>

        <View>
          <View className="mb-2 flex-row items-center gap-2">
            <Text className="text-sm font-medium text-neutral-700">Routing Number</Text>
            <TouchableOpacity activeOpacity={0.8} onPress={() => openHelp('routing_number')}>
              <Question size={14} weight="bold" color="#A3A3A3" />
            </TouchableOpacity>
          </View>
          <Controller
            control={control}
            name="routingNumber"
            render={({ field: { value, onChange }, fieldState: { error } }) => (
              <>
                <TextInput
                  value={value}
                  onChangeText={(text) => {
                    onChange(text);
                    maybePersist();
                  }}
                  placeholder="021000021"
                  keyboardType="number-pad"
                  maxLength={9}
                  className="rounded-xl border border-neutral-200 bg-white px-4 py-4 text-base text-neutral-900"
                  placeholderTextColor="#A3A3A3"
                />
                {error && <Text className="mt-1 text-xs text-red-600">{error.message}</Text>}
              </>
            )}
          />
        </View>

        <View>
          <Text className="mb-2 text-sm font-medium text-neutral-700">Account Type</Text>
          <Controller
            control={control}
            name="accountType"
            render={({ field: { value, onChange } }) => (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => openAccountTypePicker(onChange)}
                className="flex-row items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-4">
                <Text className="text-base text-neutral-900">
                  {value === 'checking' ? 'Checking' : 'Savings'}
                </Text>
                <CaretDown size={16} weight="bold" color="#A3A3A3" />
              </TouchableOpacity>
            )}
          />
        </View>
      </View>

      <Sheet ref={helpSheetRef} snapPoints={helpSnapPoints} enablePanDownToClose>
        <View className="px-5 pb-6">
          <Text className="mt-2 text-center font-parafina text-3xl font-semibold text-neutral-900">
            {helpTopic === 'account_number' ? 'Account Number' : 'Routing Number'}
          </Text>

          {helpTopic === 'account_number' ? (
            <Text className="mt-3 text-sm leading-relaxed text-neutral-700">
              Your account number identifies your specific bank account. It’s usually printed on
              your bank statement or available in your banking app.
            </Text>
          ) : (
            <Text className="mt-3 text-sm leading-relaxed text-neutral-700">
              Your routing number identifies your bank in the US. It is exactly 9 digits.
            </Text>
          )}

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => helpSheetRef.current?.dismiss()}
            className="mt-5 items-center rounded-xl bg-neutral-900 px-5 py-3">
            <Text className="text-base font-semibold text-white">Got it</Text>
          </TouchableOpacity>
        </View>
      </Sheet>
    </View>
  );
}
