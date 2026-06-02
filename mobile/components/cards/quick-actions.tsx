import type * as React from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { Grid3X3, CreditCard, Snowflake } from 'lucide-react-native';
import type { QuickActionsProps } from './types';

export const QuickActions: React.FC<QuickActionsProps> = ({
  isFrozen,
  isFreezePending,
  onShowPin,
  onCardDetails,
  onFreezeToggle,
}) => {
  return (
    <View className="mt-6 flex-row justify-center gap-8 px-6">
      {/* Show PIN */}
      <Pressable onPress={onShowPin} className="items-center">
        <View className="h-16 w-16 items-center justify-center rounded-full bg-[#D1F4D9]">
          <Grid3X3 size={24} color="#1D1D1D" />
        </View>
        <Text className="mt-2 text-sm font-medium text-[#1D1D1D]">Show PIN</Text>
      </Pressable>

      {/* Card details */}
      <Pressable onPress={onCardDetails} className="items-center">
        <View className="h-16 w-16 items-center justify-center rounded-full bg-[#D1F4D9]">
          <CreditCard size={24} color="#1D1D1D" />
        </View>
        <Text className="mt-2 text-sm font-medium text-[#1D1D1D]">Card details</Text>
      </Pressable>

      {/* Freeze/Unfreeze card */}
      <Pressable onPress={onFreezeToggle} disabled={!!isFreezePending} className="items-center">
        <View className="relative h-16 w-16 items-center justify-center rounded-full bg-[#D1F4D9]">
          <Snowflake size={24} color="#1D1D1D" />
          {isFreezePending && (
            <View className="absolute inset-0 items-center justify-center" pointerEvents="none">
              <ActivityIndicator size="small" color="#1D1D1D" />
            </View>
          )}
        </View>
        <Text className="mt-2 text-sm font-medium text-[#1D1D1D]">
          {isFrozen ? 'Unfreeze card' : 'Freeze card'}
        </Text>
      </Pressable>
    </View>
  );
};
