'use client';

import type * as React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
type CardControlsScreenProps = {
  controls: readonly {
    id: string;
    icon:
      | 'globe'
      | 'magnetic_stripe'
      | 'contactless'
      | 'chip'
      | 'mobile_wallet'
      | 'cash_withdrawal'
      | 'non_3d_secure'
      | 'overseas';
    title: string;
    description: string;
    enabled: boolean;
  }[];
  onControlToggle: (controlId: string, enabled: boolean) => void;
  onBack: () => void;
  loadingControlId?: string | null;
};
import { CardControlItem } from './card-control-item';

export const CardControlsScreen: React.FC<CardControlsScreenProps> = ({
  controls,
  onControlToggle,
  onBack,
  loadingControlId,
}) => {
  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3">
        <Pressable
          onPress={onBack}
          className="h-12 w-12 items-center justify-center rounded-full border border-[#E5E7EB] bg-white">
          <ChevronLeft size={24} color="#1D1D1D" />
        </Pressable>
        <Text className="mr-12 flex-1 text-center text-lg font-semibold text-[#1D1D1D]">
          Card controls
        </Text>
      </View>

      {/* Controls list */}
      <ScrollView className="flex-1">
        {controls.map((control) => (
          <CardControlItem
            key={control.id}
            control={control}
            onToggle={onControlToggle}
            isLoading={loadingControlId === control.id}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};
