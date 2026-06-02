'use client';
import { useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Sheet, useSheetRef, BottomSheetScrollView, BottomSheetView } from '@/components/ui/sheet';
import {
  CurrencyDollar,
  Bank,
  CalendarBlank,
  CreditCard,
  CircleNotch,
  Paperclip,
  CaretDown,
} from 'phosphor-react-native';

interface FiltersBottomSheetProps {
  isVisible: boolean;
  onClose: () => void;
  onClearFilters: () => void;
  onSeeResults: () => void;
}

const filterOptions = [
  { type: 'amount', icon: CurrencyDollar, label: 'Amount' },
  { type: 'accounts', icon: Bank, label: 'Accounts' },
  { type: 'date', icon: CalendarBlank, label: 'Date' },
  { type: 'methods', icon: CreditCard, label: 'Methods' },
  { type: 'status', icon: CircleNotch, label: 'Status' },
  { type: 'attachments', icon: Paperclip, label: 'Attachments' },
] as const;

export function FiltersBottomSheet({
  isVisible,
  onClose,
  onClearFilters,
  onSeeResults,
}: FiltersBottomSheetProps) {
  const sheetRef = useSheetRef();
  const snapPoints = useMemo(() => ['70%'], []);

  useEffect(() => {
    if (isVisible) {
      sheetRef.current?.present();
    } else {
      sheetRef.current?.dismiss();
    }
  }, [isVisible]);

  return (
    <Sheet ref={sheetRef} snapPoints={snapPoints} onDismiss={onClose} enablePanDownToClose>
      <BottomSheetView style={{ flex: 1 }}>
        {/* Header */}
        <View className="border-b border-gray-200 px-4 py-4">
          <Text className="text-lg font-semibold text-gray-900">Filters</Text>
        </View>

        {/* Filter Options */}
        <BottomSheetScrollView className="flex-1 px-4 py-2">
          {filterOptions.map((option) => {
            const IconComponent = option.icon;
            return (
              <TouchableOpacity
                key={option.type}
                className="flex-row items-center border-b border-gray-100 py-4"
                onPress={() => console.log(`Filter: ${option.type}`)}>
                <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                  <IconComponent size={20} color="#4B5563" weight="regular" />
                </View>
                <Text className="flex-1 text-base font-medium text-gray-900">{option.label}</Text>
                <CaretDown size={20} color="#9CA3AF" weight="regular" />
              </TouchableOpacity>
            );
          })}
        </BottomSheetScrollView>

        {/* Footer Actions */}
        <View className="border-t border-gray-200 px-4 pb-6 pt-4">
          <TouchableOpacity
            onPress={onSeeResults}
            className="mb-3 items-center rounded-full bg-blue-600 py-4">
            <Text className="text-base font-semibold text-white">See Results</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClearFilters} className="items-center py-2">
            <Text className="text-base font-medium text-gray-600">Clear Filters</Text>
          </TouchableOpacity>
        </View>
      </BottomSheetView>
    </Sheet>
  );
}
