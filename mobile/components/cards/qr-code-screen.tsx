import type * as React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { ChevronRight, Settings } from 'lucide-react-native';
import type { QRCodeScreenProps } from './types';
import { QRCodeDisplay } from './qr-code-display';
import { QRActions } from './qr-actions';

export const QRCodeScreen: React.FC<QRCodeScreenProps> = ({
  onScanPress,
  onImportPress,
  onHowItWorksPress,
}) => {
  return (
    <ScrollView className="flex-1 bg-white">
      {/* Title */}
      <Text className="mt-4 px-6 font-parafina text-3xl font-bold text-[#1D1D1D]">
        Pay with QR code
      </Text>

      {/* QR Code display */}
      <View className="mt-6">
        <QRCodeDisplay />
      </View>

      {/* Actions */}
      <QRActions onScanPress={onScanPress} onImportPress={onImportPress} />

      {/* PayNow info */}
      <View className="mt-6 px-6">
        <Text className="text-base text-[#6B7280]">Scan to pay with a QR code supporting</Text>
        <Text className="mt-2 text-xl font-bold text-[#1D1D1D]">
          PAY<Text className="text-[#4CB05C]">NOW</Text>
        </Text>
      </View>

      {/* Manage QR payments section */}
      <View className="mt-8">
        <View className="border-b border-[#E5E7EB] px-6 pb-2">
          <Text className="text-base text-[#6B7280]">Manage QR payments</Text>
        </View>
        <Pressable onPress={onHowItWorksPress} className="flex-row items-center px-6 py-4">
          <View className="h-12 w-12 items-center justify-center rounded-full bg-[#F3F4F6]">
            <Settings size={24} color="#1D1D1D" />
          </View>
          <Text className="ml-4 flex-1 text-base font-medium text-[#1D1D1D]">
            How does this work?
          </Text>
          <ChevronRight size={24} color="#9CA3AF" />
        </Pressable>
      </View>
    </ScrollView>
  );
};
