import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Controller, useForm } from 'react-hook-form';
import * as Burnt from 'burnt';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { CURRENCY_OPTIONS } from '@/lib/banking/currency-options';
import { bankingCurrencyValues } from '@brioela/shared/drizzle/schema/banking-enums.schema';
import type { BankingCurrencyCode } from '@brioela/shared/constants/banking-currency-decimals';
import {
  atomicToDecimalString,
  decimalStringToAtomicString,
  parseAmountAtomic,
} from '@brioela/shared/utils/money';
import { NativeSegmentedTabs } from '@/components/ui/native-segmented-tabs';
import { useBankingLimits } from '@/network/banking/use-banking-limits';
import { useUpdateBankingLimit } from '@/network/banking/use-update-banking-limit';
import type {
  BankingLimitScope,
  BankingLimitPeriod,
} from '@brioela/shared/validators/banking-limit.validator';
import { BackButton } from '@/components/ui/back-button';

const PRESET_DECIMAL_VALUES = ['5', '100', '200', '500', '1000', '5000', '10000'] as const;

export default function LimitsScreen(): React.ReactElement {
  const { data: limitsData, isLoading: isLoadingLimits } = useBankingLimits();
  const updateLimit = useUpdateBankingLimit();
  const { showActionSheetWithOptions } = useActionSheet();

  const [selectedScope, setSelectedScope] = useState<BankingLimitScope>('card');
  const [selectedPeriod, setSelectedPeriod] = useState<BankingLimitPeriod>('daily');
  const [selectedCurrency, setSelectedCurrency] = useState<BankingCurrencyCode>('usd');

  const currencyOptions = useMemo(() => {
    return CURRENCY_OPTIONS;
  }, []);

  const currencyMeta = useMemo(() => {
    return currencyOptions.find((c) => c.code.toLowerCase() === selectedCurrency);
  }, [currencyOptions, selectedCurrency]);

  const currencyCodeByUpper = useMemo(() => {
    const result: Record<string, BankingCurrencyCode> = {};
    for (const value of bankingCurrencyValues) {
      result[value.toUpperCase()] = value;
    }
    return result;
  }, []);

  const openCurrencyPicker = (): void => {
    const options = currencyOptions.map((c) => c.code);
    const cancelLabel = 'Cancel';
    const nextOptions = [...options, cancelLabel];
    const cancelButtonIndex = nextOptions.length - 1;

    showActionSheetWithOptions(
      {
        options: nextOptions,
        cancelButtonIndex,
      },
      (selectedIndex) => {
        if (typeof selectedIndex !== 'number') return;
        if (selectedIndex === cancelButtonIndex) return;

        const selectedUpper = nextOptions[selectedIndex];
        if (!selectedUpper) return;

        const next = currencyCodeByUpper[selectedUpper];
        if (!next) return;

        setSelectedCurrency(next);
      }
    );
  };

  const existingAtomic = useMemo(() => {
    const limits = limitsData?.limits ?? [];
    for (const item of limits) {
      if (
        item.currency === selectedCurrency &&
        item.scope === selectedScope &&
        item.period === selectedPeriod
      ) {
        return item.amountAtomic;
      }
    }
    return null;
  }, [limitsData, selectedCurrency, selectedScope, selectedPeriod]);

  const existingDecimal = useMemo(() => {
    if (!existingAtomic) return '';
    try {
      return atomicToDecimalString(parseAmountAtomic(existingAtomic), selectedCurrency);
    } catch {
      return '';
    }
  }, [existingAtomic, selectedCurrency]);

  const { control, handleSubmit, setValue, watch, reset } = useForm<{ amountDecimal: string }>({
    defaultValues: { amountDecimal: existingDecimal },
    mode: 'onChange',
  });

  useEffect(() => {
    reset({ amountDecimal: existingDecimal });
  }, [existingDecimal, reset, selectedCurrency, selectedScope, selectedPeriod]);

  const amountDecimal = watch('amountDecimal');

  const onSelectPreset = (value: string): void => {
    setValue('amountDecimal', value, { shouldValidate: true, shouldDirty: true });
  };

  const onSubmit = handleSubmit(async (values) => {
    let amountAtomic = '0';
    try {
      amountAtomic = decimalStringToAtomicString(values.amountDecimal, selectedCurrency);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid amount';
      Burnt.toast({ title: message, preset: 'error' });
      return;
    }

    try {
      await updateLimit.mutateAsync({
        currency: selectedCurrency,
        scope: selectedScope,
        period: selectedPeriod,
        amountAtomic,
      });

      Burnt.toast({ title: 'Updated', preset: 'done' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update limit';
      Burnt.toast({ title: message, preset: 'error' });
    }
  });

  let content: React.ReactElement | null = null;
  let updateButtonContent: React.ReactElement | null = null;
  if (updateLimit.isPending) {
    updateButtonContent = <ActivityIndicator color="#ffffff" />;
  } else {
    updateButtonContent = <Text className="text-base font-semibold text-white">Update</Text>;
  }

  if (isLoadingLimits) {
    content = (
      <View className="mt-8 items-center">
        <ActivityIndicator />
      </View>
    );
  } else {
    content = (
      <View className="mt-6">
        <Text className="text-sm text-stone-500">Currency</Text>
        <TouchableOpacity
          onPress={openCurrencyPicker}
          activeOpacity={0.8}
          className="mt-3 rounded-2xl bg-stone-100 px-4 py-4">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-sm font-medium text-stone-900">Selected currency</Text>
              <Text className="mt-2 text-base text-stone-900">
                {selectedCurrency.toUpperCase()}
              </Text>
            </View>
            <Text className="text-sm font-medium text-stone-700">Change</Text>
          </View>
        </TouchableOpacity>

        <View className="mt-6">
          <Text className="text-sm text-stone-500">Limit type</Text>
          <View className="mt-3">
            <NativeSegmentedTabs
              options={[
                { label: 'Daily', value: 'daily' },
                { label: 'Weekly', value: 'weekly' },
                { label: 'Monthly', value: 'monthly' },
              ]}
              value={selectedPeriod}
              onChange={setSelectedPeriod}
            />
          </View>
        </View>

        <View className="mt-6">
          <Text className="text-sm text-stone-500">Scope</Text>
          <View className="mt-3">
            <NativeSegmentedTabs
              options={[
                { label: 'Card', value: 'card' },
                { label: 'Transfer', value: 'transfer' },
              ]}
              value={selectedScope}
              onChange={setSelectedScope}
            />
          </View>
        </View>

        <View className="mt-8">
          <Text className="text-sm text-stone-500">
            {selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)} {selectedScope} limit
          </Text>

          <View className="mt-4 flex-row flex-wrap gap-2">
            {PRESET_DECIMAL_VALUES.map((value) => {
              const isActive = amountDecimal === value;
              let chipClass = 'bg-stone-100';
              let textClass = 'text-stone-900';
              if (isActive) {
                chipClass = 'bg-stone-900';
                textClass = 'text-white';
              }

              let label = `${value} ${selectedCurrency.toUpperCase()}`;
              if (currencyMeta?.symbol) {
                label = `${currencyMeta.symbol}${value}`;
              }

              return (
                <TouchableOpacity
                  key={value}
                  onPress={() => onSelectPreset(value)}
                  activeOpacity={0.7}
                  className={`rounded-full px-4 py-2 ${chipClass}`}>
                  <Text className={`font-medium ${textClass}`}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View className="mt-4">
            <Controller
              control={control}
              name="amountDecimal"
              rules={{ required: true }}
              render={({ field: { value, onChange } }) => {
                return (
                  <View className="rounded-2xl bg-stone-100 px-4 py-4">
                    <Text className="text-xs text-stone-500">Amount</Text>
                    <TextInput
                      value={value}
                      onChangeText={onChange}
                      keyboardType="decimal-pad"
                      className="mt-2 text-xl font-semibold text-stone-900"
                    />
                  </View>
                );
              }}
            />
          </View>
        </View>

        <TouchableOpacity
          onPress={onSubmit}
          activeOpacity={0.8}
          disabled={updateLimit.isPending}
          className="mt-8 w-full items-center justify-center rounded-full bg-neutral-900 py-4">
          {updateButtonContent}
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1">
      <BackButton />
      <KeyboardAwareScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-5 pt-6 pb-10"
        keyboardDismissMode="interactive">
        <View className="mb-6">
          <Text className="font-parafina text-4xl font-semibold text-neutral-900">Limits</Text>
          <Text className="mt-3 text-base text-neutral-500">
            Manage your transfer and card limits
          </Text>
        </View>

        {content}
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
