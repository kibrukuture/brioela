import { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { z } from '@brioela/shared/zod';
import { zodResolver } from '@/lib/forms/zod-resolver';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { getBankDetailsTypeForCurrency } from '@brioela/shared/lib/banking/payments/get-bank-details-type-for-currency';
import { BackButton } from '@/components/ui/back-button';
import { Camera } from 'lucide-react-native';
import { IbanScanModal } from '@/components/payments/iban-scan-modal';
import { useRecipientDraftStore } from '@/stores/recipients/use-recipient-draft-store';
import { SUPPORTED_BANKING_CURRENCY_CODES, SUPPORTED_CURRENCIES } from '@brioela/shared/constants';

const currencies = SUPPORTED_BANKING_CURRENCY_CODES;

type Currency = (typeof currencies)[number];

const achSchema = z.object({
  type: z.literal('ach'),
  bankName: z.string().trim().min(1),
  accountNumber: z.string().min(4),
  routingNumber: z.string().length(9),
  accountType: z.enum(['checking', 'savings']),
});

const ibanSepaSchema = z.object({
  type: z.literal('iban_sepa'),
  bankName: z.string().trim().min(1),
  iban: z.string().min(15),
  swift: z.string().min(6),
});

const ibanSingleSchema = z.object({
  type: z.literal('iban_single'),
  bankName: z.string().trim().min(1),
  iban: z.string().min(15),
  swift: z.string().min(6),
});

const formSchema = z.object({
  label: z.string().trim().min(1),
  recipientFullName: z.string().trim().min(1),
  currency: z.enum(currencies),
  bankDetails: z.discriminatedUnion('type', [achSchema, ibanSepaSchema, ibanSingleSchema]),
});

type FormValues = z.infer<typeof formSchema>;

type BankDetailsType = 'ach' | 'iban_sepa' | 'iban_single';

export default function AddRecipientScreen() {
  const router = useRouter();
  const { showActionSheetWithOptions } = useActionSheet();
  const setDraft = useRecipientDraftStore((state) => state.setDraft);

  const [showIbanScanner, setShowIbanScanner] = useState(false);

  const [currency, setCurrency] = useState<Currency>('usd');

  const bankDetailsType = useMemo(() => {
    const type = getBankDetailsTypeForCurrency(currency);
    return (type ?? 'ach') as BankDetailsType;
  }, [currency]);

  const defaultBankDetails = useMemo(() => {
    if (bankDetailsType === 'ach') {
      return {
        type: 'ach' as const,
        bankName: '',
        accountNumber: '',
        routingNumber: '',
        accountType: 'checking' as const,
      };
    }

    if (bankDetailsType === 'iban_sepa') {
      return {
        type: 'iban_sepa' as const,
        bankName: '',
        iban: '',
        swift: '',
      };
    }

    return {
      type: 'iban_single' as const,
      bankName: '',
      iban: '',
      swift: '',
    };
  }, [bankDetailsType]);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { isValid },
  } = useForm<FormValues>({
    defaultValues: {
      label: '',
      recipientFullName: '',
      currency,
      bankDetails: defaultBankDetails,
    },
    mode: 'onChange',
    resolver: zodResolver(formSchema),
  });

  const openCurrencyPicker = () => {
    showActionSheetWithOptions(
      {
        options: ['USD', 'EUR', 'AED', 'Cancel'],
        cancelButtonIndex: 3,
        title: 'Currency',
      },
      (buttonIndex) => {
        if (buttonIndex === 0) {
          setCurrency('usd');
          setValue('currency', 'usd', { shouldDirty: true, shouldValidate: true });
          setValue('bankDetails', {
            type: 'ach',
            bankName: '',
            accountNumber: '',
            routingNumber: '',
            accountType: 'checking',
          });
        }
        if (buttonIndex === 1) {
          setCurrency('eur');
          setValue('currency', 'eur', { shouldDirty: true, shouldValidate: true });
          setValue('bankDetails', { type: 'iban_sepa', bankName: '', iban: '', swift: '' });
        }
        if (buttonIndex === 2) {
          setCurrency('aed');
          setValue('currency', 'aed', { shouldDirty: true, shouldValidate: true });
          setValue('bankDetails', { type: 'iban_single', bankName: '', iban: '', swift: '' });
        }
      }
    );
  };

  const openAccountTypePicker = (onChange: (value: 'checking' | 'savings') => void) => {
    showActionSheetWithOptions(
      {
        options: ['Checking', 'Savings', 'Cancel'],
        cancelButtonIndex: 2,
        title: 'Account Type',
      },
      (buttonIndex) => {
        if (buttonIndex === 0) onChange('checking');
        if (buttonIndex === 1) onChange('savings');
      }
    );
  };

  const selectedCurrency = watch('currency');
  const selectedCurrencyLabel =
    SUPPORTED_CURRENCIES.find((c) => c.code.toLowerCase() === selectedCurrency)?.code ??
    selectedCurrency;

  const onSubmit = handleSubmit(async (values) => {
    setDraft({
      label: values.label,
      recipientFullName: values.recipientFullName,
      currency: values.currency,
      bankDetails: values.bankDetails,
    });

    router.push({ pathname: '/recipients/verify-recipient' });
  });

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <BackButton />
      <KeyboardAwareScrollView className="flex-1" contentContainerClassName="px-4 pb-16">
        <View className="mt-3">
          <Text className="font-parafina text-3xl font-bold text-gray-900">Add recipient</Text>
          <Text className="mt-1 text-sm text-neutral-500">
            Save a recipient to send money faster next time.
          </Text>
        </View>

        <View className="mt-6 gap-4">
          <View>
            <Text className="mb-2 text-sm font-medium text-neutral-700">Label</Text>
            <Controller
              control={control}
              name="label"
              render={({ field: { value, onChange }, fieldState: { error } }) => (
                <>
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    placeholder="Mom - USD"
                    className="rounded-xl border border-neutral-200 bg-white px-4 py-4 text-base text-neutral-900"
                    placeholderTextColor="#A3A3A3"
                  />
                  {error && <Text className="mt-1 text-xs text-red-600">{error.message}</Text>}
                </>
              )}
            />
          </View>

          <View>
            <Text className="mb-2 text-sm font-medium text-neutral-700">Recipient full name</Text>
            <Controller
              control={control}
              name="recipientFullName"
              render={({ field: { value, onChange }, fieldState: { error } }) => (
                <>
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    placeholder="Full name"
                    className="rounded-xl border border-neutral-200 bg-white px-4 py-4 text-base text-neutral-900"
                    placeholderTextColor="#A3A3A3"
                  />
                  {error && <Text className="mt-1 text-xs text-red-600">{error.message}</Text>}
                </>
              )}
            />
          </View>

          <View>
            <Text className="mb-2 text-sm font-medium text-neutral-700">Currency</Text>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={openCurrencyPicker}
              className="flex-row items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-4">
              <Text className="text-base text-neutral-900">{selectedCurrencyLabel}</Text>
              <Text className="text-base text-neutral-500">Change</Text>
            </TouchableOpacity>
          </View>

          <View>
            <Text className="mb-2 text-sm font-medium text-neutral-700">Bank name</Text>
            <Controller
              control={control}
              name="bankDetails.bankName"
              render={({ field: { value, onChange }, fieldState: { error } }) => (
                <>
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    placeholder="Bank name"
                    className="rounded-xl border border-neutral-200 bg-white px-4 py-4 text-base text-neutral-900"
                    placeholderTextColor="#A3A3A3"
                  />
                  {error && <Text className="mt-1 text-xs text-red-600">{error.message}</Text>}
                </>
              )}
            />
          </View>

          {bankDetailsType === 'ach' ? (
            <>
              <View>
                <Text className="mb-2 text-sm font-medium text-neutral-700">Account number</Text>
                <Controller
                  control={control}
                  name="bankDetails.accountNumber"
                  render={({ field: { value, onChange }, fieldState: { error } }) => (
                    <>
                      <TextInput
                        value={value}
                        onChangeText={onChange}
                        keyboardType="number-pad"
                        placeholder="000123456789"
                        className="rounded-xl border border-neutral-200 bg-white px-4 py-4 text-base text-neutral-900"
                        placeholderTextColor="#A3A3A3"
                      />
                      {error && <Text className="mt-1 text-xs text-red-600">{error.message}</Text>}
                    </>
                  )}
                />
              </View>

              <View>
                <Text className="mb-2 text-sm font-medium text-neutral-700">Routing number</Text>
                <Controller
                  control={control}
                  name="bankDetails.routingNumber"
                  render={({ field: { value, onChange }, fieldState: { error } }) => (
                    <>
                      <TextInput
                        value={value}
                        onChangeText={onChange}
                        keyboardType="number-pad"
                        maxLength={9}
                        placeholder="021000021"
                        className="rounded-xl border border-neutral-200 bg-white px-4 py-4 text-base text-neutral-900"
                        placeholderTextColor="#A3A3A3"
                      />
                      {error && <Text className="mt-1 text-xs text-red-600">{error.message}</Text>}
                    </>
                  )}
                />
              </View>

              <View>
                <Text className="mb-2 text-sm font-medium text-neutral-700">Account type</Text>
                <Controller
                  control={control}
                  name="bankDetails.accountType"
                  render={({ field: { value, onChange } }) => (
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => openAccountTypePicker(onChange)}
                      className="flex-row items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-4">
                      <Text className="text-base text-neutral-900">
                        {value === 'checking' ? 'Checking' : 'Savings'}
                      </Text>
                      <Text className="text-base text-neutral-500">Change</Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            </>
          ) : (
            <>
              <View>
                <Text className="mb-2 text-sm font-medium text-neutral-700">IBAN</Text>
                <Controller
                  control={control}
                  name="bankDetails.iban"
                  render={({ field: { value, onChange }, fieldState: { error } }) => (
                    <>
                      <View className="relative">
                        <TextInput
                          value={value}
                          onChangeText={onChange}
                          placeholder={
                            bankDetailsType === 'iban_single'
                              ? 'AE070331234567890123456'
                              : 'DE89370400440532013000'
                          }
                          autoCapitalize="characters"
                          className="rounded-xl border border-neutral-200 bg-white py-4 pl-4 pr-12 text-base text-neutral-900"
                          placeholderTextColor="#A3A3A3"
                        />
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => setShowIbanScanner(true)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-neutral-100 p-2">
                          <Camera size={18} color="#171717" />
                        </TouchableOpacity>
                      </View>
                      {error && <Text className="mt-1 text-xs text-red-600">{error.message}</Text>}
                    </>
                  )}
                />
              </View>

              <View>
                <Text className="mb-2 text-sm font-medium text-neutral-700">SWIFT/BIC</Text>
                <Controller
                  control={control}
                  name="bankDetails.swift"
                  render={({ field: { value, onChange }, fieldState: { error } }) => (
                    <>
                      <TextInput
                        value={value}
                        onChangeText={onChange}
                        placeholder={bankDetailsType === 'iban_single' ? 'EBILAEAD' : 'DEUTDEFF'}
                        autoCapitalize="characters"
                        className="rounded-xl border border-neutral-200 bg-white px-4 py-4 text-base text-neutral-900"
                        placeholderTextColor="#A3A3A3"
                      />
                      {error && <Text className="mt-1 text-xs text-red-600">{error.message}</Text>}
                    </>
                  )}
                />
              </View>
            </>
          )}
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          disabled={!isValid}
          onPress={onSubmit}
          className={`mb-6 mt-6 items-center rounded-xl px-5 py-4 ${
            !isValid ? 'bg-neutral-300' : 'bg-neutral-900'
          }`}>
          <Text className="text-base font-semibold text-white">Continue</Text>
        </TouchableOpacity>

        <IbanScanModal
          visible={showIbanScanner}
          onClose={() => setShowIbanScanner(false)}
          onIbanDetected={(iban) => {
            setValue('bankDetails.iban', iban, { shouldValidate: true, shouldDirty: true });
          }}
        />
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
