import type * as React from 'react';
import { Pressable, Text, ActivityIndicator } from 'react-native';
import type { AppleWalletButtonProps } from './types';

export const GooglePayButton: React.FC<AppleWalletButtonProps> = ({ onPress, isPending }) => {
  const isDisabled = Boolean(isPending);

  return (
    <Pressable
      disabled={isDisabled}
      onPress={onPress}
      className={`mx-6 mt-4 flex-row items-center justify-center rounded-xl py-4 ${
        isDisabled ? 'bg-neutral-300' : 'bg-[#1D1D1D]'
      }`}>
      {isPending ? (
        <ActivityIndicator color="#ffffff" />
      ) : (
        <Text className="text-base font-semibold text-white">Add to Google Pay</Text>
      )}
    </Pressable>
  );
};
