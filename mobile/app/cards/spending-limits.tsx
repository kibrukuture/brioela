import type React from 'react';
import { useIsomorphicLayoutEffect } from 'usehooks-ts';
import { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Controller, useForm } from 'react-hook-form';
import * as Burnt from 'burnt';
import { useLocalSearchParams } from 'expo-router';
import {
  atomicToDecimalString,
  decimalStringToAtomicString,
  parseAmountAtomic } from '@brioela/shared/utils/money';
import { BackButton } from '@/components/ui/back-button';
import { NativeSegmentedTabs } from '@/components/ui/native-segmented-tabs';
import { useCardSpendingLimits } from '@/network/cards/use-card-spending-limits';
import { useUpdateCardSpendingLimits } from '@/network/cards/use-update-card-spending-limits';

const PRESET_DECIMAL_VALUES = ['5', '100', '200', '500', '1000', '5000', '10000'] as const;

type Period = 'daily' | 'monthly';

export default function SpendingLimitsScreen(): React.ReactElement {
  const params = useLocalSearchParams<{ cardId?: string }>();
  const cardId = typeof params.cardId === 'string' ? params.cardId : '';

  const { data, isLoading } = useCardSpendingLimits(cardId);
  const updateLimits = useUpdateCardSpendingLimits();

  const [selectedPeriod, setSelectedPeriod] = useState<Period>('daily');

  const existingAtomic = useMemo(() => {
    if (!data) return null;
    if (selectedPeriod === 'daily') return data.dailyLimitAtomic;
    return data.monthlyLimitAtomic;
  }, [data, selectedPeriod]);

  const existingDecimal = useMemo(() => {
    if (!existingAtomic) return '';
    try {
      return atomicToDecimalString(parseAmountAtomic(existingAtomic), 'usd');
    } catch {
      return '';
    }
  }, [existingAtomic]);

  const { control, handleSubmit, setValue, watch, reset } = useForm<{ amountDecimal: string }>({
    defaultValues: { amountDecimal: existingDecimal },
    mode: 'onChange' });

  useIsomorphicLayoutEffect(() => {
    reset({ amountDecimal: existingDecimal });
  }, [existingDecimal, reset, selectedPeriod]);

  const amountDecimal = watch('amountDecimal');

  const onSelectPreset = (value: string): void => {
    setValue('amountDecimal', value, { shouldValidate: true, shouldDirty: true });
  };

  const onSubmit = handleSubmit(async (values) => {
    if (!cardId) {
      Burnt.toast({ title: 'Missing card', preset: 'error' });
      return;
    }

    let amountAtomic = '0';
    try {
      amountAtomic = decimalStringToAtomicString(values.amountDecimal, 'usd');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid amount';
      Burnt.toast({ title: message, preset: 'error' });
      return;
    }

    try {
      await updateLimits.mutateAsync({
        cardId,
        input:
          selectedPeriod === 'daily'
            ? { dailyLimitAtomic: amountAtomic }
            : { monthlyLimitAtomic: amountAtomic } });
      Burnt.toast({ title: 'Updated', preset: 'done' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update limit';
      Burnt.toast({ title: message, preset: 'error' });
    }
  });

  const updateButtonContent = updateLimits.isPending ? (
    <ActivityIndicator color="#ffffff" />
  ) : (
    <Text className="text-base font-semibold text-white">Update</Text>
  );

  let content: React.ReactElement;
  if (isLoading) {
    content = (
      <View className="mt-8 items-center">
        <ActivityIndicator />
      </View>
    );
  } else {
    content = (
      <>
        <View className="mt-6">
          <Text className="text-sm text-stone-500">Limit type</Text>
          <View className="mt-3">
            <NativeSegmentedTabs
              options={[
                { label: 'Daily', value: 'daily' },
                { label: 'Monthly', value: 'monthly' },
              ]}
              value={selectedPeriod}
              onChange={setSelectedPeriod}
            />
          </View>
        </View>

        <View className="mt-8">
          <Text className="text-sm text-stone-500">
            {selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)} card limit
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

              return (
                <TouchableOpacity
                  key={value}
                  onPress={() => onSelectPreset(value)}
                  activeOpacity={0.7}
                  className={`rounded-full px-4 py-2 ${chipClass}`}>
                  <Text className={`font-medium ${textClass}`}>${value}</Text>
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
          className="mt-10 items-center rounded-xl bg-neutral-900 px-5 py-4">
          {updateButtonContent}
        </TouchableOpacity>
      </>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <BackButton />

      <KeyboardAwareScrollView className="flex-1" contentContainerClassName="px-5 pb-16">
        <View className="mt-3">
          <Text className="font-parafina text-3xl font-bold text-neutral-900">Spending limits</Text>
          <Text className="mt-1 text-sm text-neutral-500">
            Control how much can be spent with your card.
          </Text>
        </View>

        {content}
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
