import type * as React from 'react';
import { Pressable, Text, Image, ActivityIndicator } from 'react-native';
import type { AppleWalletButtonProps } from './types';

export const AppleWalletButton: React.FC<AppleWalletButtonProps> = ({ onPress, isPending }) => {
  const isDisabled = Boolean(isPending);

  return (
    <Pressable
      disabled={isDisabled}
      onPress={onPress}
      className={`mx-6 mt-4 flex-row items-center justify-center rounded-xl py-4 ${
        isDisabled ? 'bg-neutral-300' : 'bg-[#1D1D1D]'
      }`}>
      <Image
        source={require('@/assets/media/apple-logo.png')}
        className="mr-2 h-5 w-5"
        style={{ tintColor: '#FFFFFF' }}
        resizeMode="contain"
      />
      {isPending ? (
        <ActivityIndicator color="#ffffff" />
      ) : (
        <Text className="text-base font-semibold text-white">Add to Apple Wallet</Text>
      )}
    </Pressable>
  );
};
