import type * as React from 'react';
import { View, Text, Pressable } from 'react-native';
import type { ExpiryWarningProps } from './types';

export const ExpiryWarning: React.FC<ExpiryWarningProps> = ({ message, onReplace }) => {
  return (
    <View className="mt-3 items-center px-6">
      <Text className="text-center text-sm text-[#6B7280]">{message}</Text>
      <Pressable onPress={onReplace} className="mt-3 rounded-full bg-[#E8F5E9] px-8 py-3">
        <Text className="text-base font-medium text-[#1D1D1D]">Replace for free</Text>
      </Pressable>
    </View>
  );
};
