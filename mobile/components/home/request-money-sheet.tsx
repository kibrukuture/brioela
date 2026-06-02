import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LinkSimple } from 'phosphor-react-native';
import { QrCode, Scan } from 'lucide-react-native';
import { Sheet, useSheetRef, BottomSheetView } from '@/components/ui/sheet';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';

interface RequestMoneySheetProps {
  onSelectOption: (option: 'qr' | 'link' | 'scan') => void;
}

export const RequestMoneySheet = React.forwardRef<BottomSheetModal, RequestMoneySheetProps>(
  ({ onSelectOption }, ref) => {
    const snapPoints = useMemo(() => ['35%'], []);

    const handleOption = (option: 'qr' | 'link' | 'scan') => {
      if (ref && 'current' in ref && ref.current) {
        ref.current.dismiss();
      }
      onSelectOption(option);
    };

    return (
      <Sheet ref={ref} snapPoints={snapPoints} enablePanDownToClose>
        <BottomSheetView className="px-5 pb-10">
          <Text className="mb-5 text-center font-parafina text-xl font-semibold text-neutral-900">
            Get paid
          </Text>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => handleOption('qr')}
            className="mb-3 flex-row items-center px-4 py-3">
            <QrCode size={22} color="#374151" />
            <View className="ml-3 flex-1">
              <Text className="text-base font-medium text-gray-800">Show my QR</Text>
              <Text className="text-xs text-neutral-400">Let others scan to pay you</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => handleOption('link')}
            className="mb-3 flex-row items-center px-4 py-3">
            <LinkSimple size={22} weight="bold" color="#374151" />
            <View className="ml-3 flex-1">
              <Text className="text-base font-medium text-gray-800">Create request link</Text>
              <Text className="text-xs text-neutral-400">Share a link to get paid</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => handleOption('scan')}
            className="flex-row items-center px-4 py-3">
            <Scan size={22} color="#374151" />
            <View className="ml-3 flex-1">
              <Text className="text-base font-medium text-gray-800">Scan to request</Text>
              <Text className="text-xs text-neutral-400">Scan someone's QR to request</Text>
            </View>
          </TouchableOpacity>
        </BottomSheetView>
      </Sheet>
    );
  }
);

RequestMoneySheet.displayName = 'RequestMoneySheet';

export { useSheetRef as useRequestMoneySheetRef };
