import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Bank, CreditCard, Coins } from 'phosphor-react-native';
import { Sheet, useSheetRef, BottomSheetView } from '@/components/ui/sheet';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';

export interface AddMoneySheetRef {
  present: () => void;
  dismiss: () => void;
}

interface AddMoneySheetProps {
  onSelectOption: (option: 'bank' | 'card' | 'crypto') => void;
}

export const AddMoneySheet = React.forwardRef<BottomSheetModal, AddMoneySheetProps>(
  ({ onSelectOption }, ref) => {
    const snapPoints = useMemo(() => ['35%'], []);

    const handleOption = (option: 'bank' | 'card' | 'crypto') => {
      if (ref && 'current' in ref && ref.current) {
        ref.current.dismiss();
      }
      onSelectOption(option);
    };

    return (
      <Sheet ref={ref} snapPoints={snapPoints} enablePanDownToClose>
        <BottomSheetView className="px-5 pb-10">
          <Text className="mb-5 text-center font-parafina text-xl font-semibold text-neutral-900">
            Add money
          </Text>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => handleOption('bank')}
            className="mb-3 flex-row items-center px-4 py-3">
            <Bank size={22} weight="bold" color="#374151" />
            <View className="ml-3 flex-1">
              <Text className="text-base font-medium text-gray-800">Bank transfer</Text>
              <Text className="text-xs text-neutral-400">Free • 1-2 days</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => handleOption('card')}
            className="mb-3 flex-row items-center px-4 py-3">
            <CreditCard size={22} weight="bold" color="#374151" />
            <View className="ml-3 flex-1">
              <Text className="text-base font-medium text-gray-800">Card top up</Text>
              <Text className="text-xs text-neutral-400">3.5% fee • Instant</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => handleOption('crypto')}
            className="flex-row items-center px-4 py-3">
            <Coins size={22} weight="bold" color="#374151" />
            <View className="ml-3 flex-1">
              <Text className="text-base font-medium text-gray-800">Crypto</Text>
              <Text className="text-xs text-neutral-400">0.5% fee • Instant</Text>
            </View>
          </TouchableOpacity>
        </BottomSheetView>
      </Sheet>
    );
  }
);

AddMoneySheet.displayName = 'AddMoneySheet';

export { useSheetRef as useAddMoneySheetRef };
