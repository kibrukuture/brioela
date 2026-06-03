import type React from 'react';
import { useEffect, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Controller, useForm } from 'react-hook-form';
import * as Burnt from 'burnt';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BackButton } from '@/components/ui/back-button';
import { useSetCardLabel } from '@/network/cards/use-set-card-label';
import { useCards } from '@/network/cards/use-cards';

export default function CardLabelScreen(): React.ReactElement {
  const router = useRouter();
  const params = useLocalSearchParams<{ cardId?: string }>();
  const cardId = typeof params.cardId === 'string' ? params.cardId : '';

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    cardId
  );

  const { data: cardsData } = useCards();
  const setLabel = useSetCardLabel();

  const existingLabel = useMemo(() => {
    const cards = cardsData?.cards ?? [];
    const match = cards.find((c) => c.id === cardId);
    return match?.label ?? '';
  }, [cardsData, cardId]);

  const { control, handleSubmit, reset } = useForm<{ label: string }>({
    defaultValues: { label: existingLabel },
    mode: 'onChange',
  });

  useEffect(() => {
    reset({ label: existingLabel });
  }, [existingLabel, reset]);

  const onSubmit = handleSubmit(async (values) => {
    if (!cardId || !isUuid) {
      Burnt.toast({ title: 'Missing card', preset: 'error' });
      return;
    }

    try {
      await setLabel.mutateAsync({ cardId, input: { label: values.label } });
      Burnt.toast({ title: 'Updated', preset: 'done' });
      router.back();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update label';
      Burnt.toast({ title: message, preset: 'error' });
    }
  });

  const buttonContent = setLabel.isPending ? (
    <ActivityIndicator color="#ffffff" />
  ) : (
    <Text className="text-base font-semibold text-white">Update</Text>
  );

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <BackButton />

      <KeyboardAwareScrollView className="flex-1" contentContainerClassName="px-5 pb-16">
        <View className="mt-3">
          <Text className="font-parafina text-3xl font-bold text-neutral-900">Card label</Text>
          <Text className="mt-1 text-sm text-neutral-500">
            Give your card a name you’ll recognize.
          </Text>
        </View>

        <View className="mt-8">
          <Text className="mb-2 text-sm font-medium text-neutral-700">Card label</Text>
          <Controller
            control={control}
            name="label"
            rules={{ required: true }}
            render={({ field: { value, onChange } }) => (
              <TextInput
                value={value}
                onChangeText={onChange}
                placeholder="My travel card"
                className="rounded-xl border border-neutral-200 bg-white px-4 py-4 text-base text-neutral-900"
                placeholderTextColor="#A3A3A3"
              />
            )}
          />
        </View>

        <TouchableOpacity
          onPress={onSubmit}
          activeOpacity={0.8}
          className="mt-10 items-center rounded-xl bg-neutral-900 px-5 py-4">
          {buttonContent}
        </TouchableOpacity>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
