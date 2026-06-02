import type * as React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Camera, Plus } from 'lucide-react-native';

interface QRActionsProps {
  readonly onScanPress: () => void;
  readonly onImportPress: () => void;
}

export const QRActions: React.FC<QRActionsProps> = ({ onScanPress, onImportPress }) => {
  return (
    <View className="mt-6 flex-row justify-center gap-8 px-6">
      <Pressable onPress={onScanPress} className="items-center">
        <View className="h-16 w-16 items-center justify-center rounded-full bg-[#D1F4D9]">
          <Camera size={24} color="#1D1D1D" />
        </View>
        <Text className="mt-2 text-sm font-medium text-[#1D1D1D]">Scan QR code</Text>
      </Pressable>

      <Pressable onPress={onImportPress} className="items-center">
        <View className="h-16 w-16 items-center justify-center rounded-full bg-[#D1F4D9]">
          <Plus size={24} color="#1D1D1D" />
        </View>
        <Text className="mt-2 text-sm font-medium text-[#1D1D1D]">Import QR code</Text>
      </Pressable>
    </View>
  );
};
