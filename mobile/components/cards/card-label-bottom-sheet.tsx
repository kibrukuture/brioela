import * as React from 'react';
import { View, Text, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import * as Burnt from 'burnt';
import { Sheet, useManagedSheetRef, BottomSheetView } from '@/components/ui/sheet';
import type { CardLabelBottomSheetProps } from '@/components/cards/types';
import { useSetCardLabel } from '@/network/cards/use-set-card-label';

export const CardLabelBottomSheet: React.FC<CardLabelBottomSheetProps> = ({
  isVisible,
  cardId,
  existingLabel,
  onClose,
}) => {
  const sheetRef = useManagedSheetRef(Boolean(isVisible && cardId));
  const snapPoints = React.useMemo(() => ['45%'], []);

  const setLabel = useSetCardLabel();

  const { control, handleSubmit, reset } = useForm<{ label: string }>({
    defaultValues: { label: existingLabel ?? '' },
    mode: 'onChange',
  });

  React.useEffect(() => {
    if (isVisible) {
      sheetRef.current?.present();
    } else {
      sheetRef.current?.dismiss();
    }
  }, [isVisible, sheetRef]);

  React.useEffect(() => {
    reset({ label: existingLabel ?? '' });
  }, [existingLabel, reset, cardId]);

  const onSubmit = handleSubmit(async (values) => {
    if (!cardId) {
      Burnt.toast({ title: 'Missing card', preset: 'error' });
      return;
    }

    try {
      await setLabel.mutateAsync({ cardId, input: { label: values.label } });
      Burnt.toast({ title: 'Updated', preset: 'done' });
      onClose();
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
    <Sheet ref={sheetRef} snapPoints={snapPoints} onDismiss={onClose} enablePanDownToClose>
      <BottomSheetView className="flex-1 px-6">
        <View className="mt-2">
          <Text className="font-parafina text-2xl font-bold text-[#1D1D1D]">Card label</Text>
          <Text className="mt-2 text-base text-[#6B7280]">
            Give your card a name you’ll recognize.
          </Text>
        </View>

        <View className="mt-6">
          <Controller
            control={control}
            name="label"
            rules={{ required: true }}
            render={({ field: { value, onChange } }) => (
              <View className="rounded-2xl bg-stone-100 px-4 py-4">
                <Text className="text-xs text-stone-500">Card label</Text>
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  placeholder="My travel card"
                  className="mt-2 text-xl font-semibold text-stone-900"
                  placeholderTextColor="#A3A3A3"
                />
              </View>
            )}
          />
        </View>

        <Pressable onPress={onSubmit} className="mt-8 items-center rounded-xl bg-neutral-900 py-4">
          {buttonContent}
        </Pressable>
      </BottomSheetView>
    </Sheet>
  );
};
