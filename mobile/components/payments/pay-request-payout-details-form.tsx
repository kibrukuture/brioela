import { useMemo, useState } from 'react';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as Burnt from 'burnt';
import { Controller, useForm, type SubmitHandler } from 'react-hook-form';
import { router } from 'expo-router';
import { zodResolver } from '@/lib/forms/zod-resolver';
import { z } from '@brioela/shared/zod';
import { isValidIban } from '@brioela/shared/lib/banking/payments/iban';
import { useSubmitPayRequestPayoutDetails } from '@/network/banking/use-submit-pay-request-payout-details';
import { usePrecheckPayRequestPayout } from '@/network/banking/use-precheck-pay-request-payout';
import { IbanInput } from '@/components/payments/iban-input';
import { TRANSFER_PURPOSES } from '@brioela/shared/constants';
import { TransferPurposeSheet } from '@/components/payments/transfer-purpose-sheet';

type PayRequestCurrency = 'usd' | 'eur' | 'aed';

const getDefaultTypeForCurrency = (currency: PayRequestCurrency) => {
  switch (currency) {
    case 'usd':
      return 'ach' as const;
    case 'eur':
      return 'iban_sepa' as const;
    case 'aed':
      return 'iban_single' as const;
  }
};

export function PayRequestPayoutDetailsForm({
  id,
  sourceCurrency,
}: {
  id: string;
  sourceCurrency: PayRequestCurrency;
}) {
  const submit = useSubmitPayRequestPayoutDetails();
  const precheck = usePrecheckPayRequestPayout();
  const [isTransferPurposeSheetVisible, setIsTransferPurposeSheetVisible] = useState(false);

  const formSchema = useMemo(() => {
    return z
      .object({
        type: z.enum(['ach', 'iban_sepa', 'iban_single']),

        transferPurpose: z.enum(TRANSFER_PURPOSES),

        bankName: z.string().trim().min(1, 'Bank name is required'),

        routingNumber: z.string().optional(),
        accountNumber: z.string().optional(),
        accountType: z.enum(['checking', 'savings']).optional(),

        iban: z.string().optional(),
        swift: z.string().optional(),
      })
      .superRefine((val, ctx) => {
        if (val.type === 'ach') {
          if (!val.routingNumber || val.routingNumber.trim().length !== 9) {
            ctx.addIssue({
              code: 'custom',
              message: 'Routing number must be 9 digits',
              path: ['routingNumber'],
            });
          }

          if (!val.accountNumber || val.accountNumber.trim().length < 4) {
            ctx.addIssue({
              code: 'custom',
              message: 'Account number is required',
              path: ['accountNumber'],
            });
          }

          if (!val.accountType) {
            ctx.addIssue({
              code: 'custom',
              message: 'Account type is required',
              path: ['accountType'],
            });
          }
        }

        if (val.type === 'iban_sepa') {
          const iban = (val.iban ?? '').trim();
          if (!iban) {
            ctx.addIssue({ code: 'custom', message: 'IBAN is required', path: ['iban'] });
          } else if (!isValidIban(iban)) {
            ctx.addIssue({ code: 'custom', message: 'Invalid IBAN', path: ['iban'] });
          }

          if (!val.swift || val.swift.trim().length < 6) {
            ctx.addIssue({ code: 'custom', message: 'SWIFT/BIC is required', path: ['swift'] });
          }
        }

        if (val.type === 'iban_single') {
          const iban = (val.iban ?? '').trim();
          if (!iban) {
            ctx.addIssue({ code: 'custom', message: 'IBAN is required', path: ['iban'] });
          } else if (!isValidIban(iban)) {
            ctx.addIssue({ code: 'custom', message: 'Invalid IBAN', path: ['iban'] });
          }

          if (!val.swift || val.swift.trim().length < 6) {
            ctx.addIssue({ code: 'custom', message: 'SWIFT/BIC is required', path: ['swift'] });
          }
        }
      });
  }, []);

  type FormValues = z.infer<typeof formSchema>;

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    defaultValues: {
      type: getDefaultTypeForCurrency(sourceCurrency),
      transferPurpose: 'none',
      bankName: '',
      iban: '',
      swift: '',
      accountNumber: '',
      routingNumber: '',
      accountType: 'checking',
    },
    mode: 'onChange',
    resolver: zodResolver(formSchema),
  });

  const transferPurposeValue = watch('transferPurpose');

  const onSubmit: SubmitHandler<FormValues> = async (values) => {
    try {
      const bankDetails =
        values.type === 'ach'
          ? {
              type: 'ach' as const,
              bankName: values.bankName,
              routingNumber: values.routingNumber ?? '',
              accountNumber: values.accountNumber ?? '',
              accountType: values.accountType ?? 'checking',
            }
          : values.type === 'iban_sepa'
            ? {
                type: 'iban_sepa' as const,
                bankName: values.bankName,
                iban: values.iban ?? '',
                swift: values.swift ?? '',
              }
            : {
                type: 'iban_single' as const,
                bankName: values.bankName,
                iban: values.iban ?? '',
                swift: values.swift ?? '',
              };

      const precheckResult = await precheck.mutateAsync({
        id,
        input: { bankDetails, transferPurpose: values.transferPurpose },
      });
      if (!precheckResult.ok) {
        const message = precheckResult.issues[0]?.message ?? 'Pay request is not ready for payout';
        Burnt.alert({ title: 'Oh no!', message, preset: 'error' });
        return;
      }

      await submit.mutateAsync({
        id,
        input: { bankDetails, transferPurpose: values.transferPurpose },
      });
      Burnt.toast({ title: '', message: 'Details submitted', preset: 'done' });
      router.replace({
        pathname: '/pay/payout-details/confirmation',
        params: { id, justSubmitted: '1' },
      });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to submit details';
      Burnt.alert({ title: 'Oh no!', message, preset: 'error' });
    }
  };

  return (
    <>
      <View className="mt-6 rounded-2xl border border-neutral-100 bg-white p-5">
        <View>
          <Text className="text-xs font-medium text-neutral-500">Bank name</Text>
          <View className="mt-3 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4">
            <Controller
              control={control}
              name="bankName"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  placeholder={sourceCurrency === 'usd' ? 'Chase Bank' : 'Deutsche Bank'}
                  placeholderTextColor="#A3A3A3"
                  className="text-base text-neutral-900"
                />
              )}
            />
          </View>
          {!!errors.bankName?.message && (
            <Text className="mt-2 text-xs text-red-500">{String(errors.bankName.message)}</Text>
          )}
        </View>

        {sourceCurrency === 'usd' ? (
          <View>
            <View className="mt-5">
              <Text className="text-xs font-medium text-neutral-500">Routing number</Text>
              <View className="mt-3 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4">
                <Controller
                  control={control}
                  name="routingNumber"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      value={value}
                      onChangeText={onChange}
                      keyboardType="number-pad"
                      placeholder="021000021"
                      placeholderTextColor="#A3A3A3"
                      className="text-base text-neutral-900"
                    />
                  )}
                />
              </View>
              {!!errors.routingNumber?.message && (
                <Text className="mt-2 text-xs text-red-500">
                  {String(errors.routingNumber.message)}
                </Text>
              )}
            </View>

            <View className="mt-5">
              <Text className="text-xs font-medium text-neutral-500">Account number</Text>
              <View className="mt-3 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4">
                <Controller
                  control={control}
                  name="accountNumber"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      value={value}
                      onChangeText={onChange}
                      placeholder="000123456789"
                      placeholderTextColor="#A3A3A3"
                      className="text-base text-neutral-900"
                    />
                  )}
                />
              </View>
              {!!errors.accountNumber?.message && (
                <Text className="mt-2 text-xs text-red-500">
                  {String(errors.accountNumber.message)}
                </Text>
              )}
            </View>
          </View>
        ) : (
          <View>
            <View className="mt-5">
              <Controller
                control={control}
                name="iban"
                render={({ field: { onChange, value } }) => (
                  <IbanInput
                    value={value ?? ''}
                    onChange={onChange}
                    placeholder={
                      sourceCurrency === 'aed'
                        ? 'AE070331234567890123456'
                        : 'DE89370400440532013000'
                    }
                    errorMessage={errors.iban?.message ? String(errors.iban.message) : undefined}
                  />
                )}
              />
            </View>

            <View className="mt-5">
              <Text className="text-xs font-medium text-neutral-500">SWIFT</Text>
              <View className="mt-3 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4">
                <Controller
                  control={control}
                  name="swift"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      value={value}
                      onChangeText={onChange}
                      autoCapitalize="characters"
                      placeholder={sourceCurrency === 'aed' ? 'EBILAEAD' : 'DEUTDEFF'}
                      placeholderTextColor="#A3A3A3"
                      className="text-base text-neutral-900"
                    />
                  )}
                />
              </View>
              {!!errors.swift?.message && (
                <Text className="mt-2 text-xs text-red-500">{String(errors.swift.message)}</Text>
              )}
            </View>
          </View>
        )}

        <View className="mt-5">
          <Text className="text-xs font-medium text-neutral-500">Transfer purpose</Text>
          <Controller
            control={control}
            name="transferPurpose"
            render={({ field: { onChange, value } }) => (
              <TouchableOpacity
                onPress={() => setIsTransferPurposeSheetVisible(true)}
                activeOpacity={0.8}
                className="mt-3 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4">
                <Text className="text-base text-neutral-900">{value.replace(/_/g, ' ')}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>

      <TouchableOpacity
        onPress={handleSubmit(onSubmit)}
        activeOpacity={0.8}
        disabled={submit.isPending || precheck.isPending || !isValid}
        className={`mt-6 items-center rounded-xl px-5 py-4 ${
          !isValid ? 'bg-neutral-300' : 'bg-neutral-900'
        }`}>
        {submit.isPending || precheck.isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-base font-semibold text-white">Submit</Text>
        )}
      </TouchableOpacity>

      <TransferPurposeSheet
        isVisible={isTransferPurposeSheetVisible}
        value={transferPurposeValue}
        onConfirm={(next) =>
          setValue('transferPurpose', next, { shouldValidate: true, shouldDirty: true })
        }
        onClose={() => setIsTransferPurposeSheetVisible(false)}
      />
    </>
  );
}
