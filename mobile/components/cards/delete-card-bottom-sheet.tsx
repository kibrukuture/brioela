import * as React from 'react';
import { useIsomorphicLayoutEffect } from 'usehooks-ts';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { BottomSheetView, Sheet, useManagedSheetRef } from '@/components/ui/sheet';

export interface DeleteCardBottomSheetProps {
  readonly isVisible: boolean;
  readonly cardType: 'physical' | 'virtual';
  readonly isPending: boolean;
  readonly onClose: () => void;
  readonly onConfirm: () => void;
}

export const DeleteCardBottomSheet: React.FC<DeleteCardBottomSheetProps> = ({
  isVisible,
  cardType,
  isPending,
  onClose,
  onConfirm,
}) => {
  const sheetRef = useManagedSheetRef(isVisible);
  const snapPoints = React.useMemo(() => ['40%'], []);

  useIsomorphicLayoutEffect(() => {
    if (isVisible) {
      sheetRef.current?.present();
    } else {
      sheetRef.current?.dismiss();
    }
  }, [isVisible, sheetRef]);

  return (
    <Sheet ref={sheetRef} snapPoints={snapPoints} onDismiss={onClose} enablePanDownToClose>
      <BottomSheetView className="flex-1 px-6">
        <View className="mt-2">
          <Text className="text-center font-parafina text-2xl font-bold text-[#1D1D1D]">
            Delete card
          </Text>
          <Text className="mt-3 text-center text-base text-[#6B7280]">
            This will cancel your card.
          </Text>
        </View>

        <Pressable
          onPress={onConfirm}
          disabled={isPending}
          className="mt-8 items-center rounded-xl bg-red-600 py-4">
          {isPending ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text className="text-base font-semibold text-white">Delete card</Text>
          )}
        </Pressable>

        <Pressable onPress={onClose} className="mt-3 items-center rounded-xl bg-[#F3F4F6] py-4">
          <Text className="text-base font-semibold text-[#1D1D1D]">Cancel</Text>
        </Pressable>
      </BottomSheetView>
    </Sheet>
  );
};
