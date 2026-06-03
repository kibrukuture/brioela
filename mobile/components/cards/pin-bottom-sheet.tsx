import * as React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Sheet, useManagedSheetRef, BottomSheetView } from '@/components/ui/sheet';
import type { PinBottomSheetProps } from '@/components/cards/types';
import { SensitiveSheetGate } from '@/features/auth/components/sensitive-sheet-gate';

export const PinBottomSheet: React.FC<PinBottomSheetProps> = ({ isVisible, pin, onClose }) => {
  const sheetRef = useManagedSheetRef(isVisible);
  const snapPoints = React.useMemo(() => ['35%'], []);

  return (
    <>
      <SensitiveSheetGate
        isVisible={isVisible}
        promptMessage="Authenticate to view your PIN"
        progressTitle="Getting your PIN"
        onAuthed={() => sheetRef.current?.present()}
        onDenied={() => onClose?.()}>
        <Sheet ref={sheetRef} snapPoints={snapPoints} onDismiss={onClose} enablePanDownToClose>
          <BottomSheetView className="flex-1 px-6">
            {/* PIN display */}
            <View className="mt-2">
              <Text className="font-parafina text-2xl font-bold text-[#1D1D1D]">
                Your PIN is {pin}
              </Text>
              <Text className="mt-2 text-base text-[#6B7280]">
                Come back to the app if you forget it.
              </Text>
            </View>

            {/* Got it button */}
            <Pressable
              onPress={onClose}
              className="mt-8 items-center rounded-xl bg-neutral-900 py-4">
              <Text className="text-base font-semibold text-white">Got it</Text>
            </Pressable>
          </BottomSheetView>
        </Sheet>
      </SensitiveSheetGate>
    </>
  );
};
