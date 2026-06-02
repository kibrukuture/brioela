import type * as React from 'react';
import { View } from 'react-native';

export const QRCodeDisplay: React.FC = () => {
  return (
    <View className="mx-6 items-center rounded-2xl border-2 border-dashed border-[#4CB05C] bg-[#F5F5F0] p-8">
      {/* QR Code placeholder */}
      <View className="h-32 w-32 items-center justify-center">
        <View className="flex-row">
          <View className="m-0.5 h-8 w-8 border-2 border-[#1D1D1D]" />
          <View className="m-0.5 h-8 w-8 border-2 border-[#1D1D1D]" />
        </View>
        <View className="flex-row">
          <View className="m-0.5 h-8 w-8 border-2 border-[#1D1D1D]" />
          <View className="m-0.5 h-8 w-8 bg-[#1D1D1D]" />
        </View>
      </View>
    </View>
  );
};
