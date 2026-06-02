import type React from 'react';
import { View, Text } from 'react-native';

interface HowSenderPaidSectionProps {
  senderName: string;
}

export const HowSenderPaidSection: React.FC<HowSenderPaidSectionProps> = ({ senderName }) => {
  return (
    <View className="px-4 py-4">
      <Text className="mb-4 text-xl font-bold text-black">How the sender paid</Text>

      <View className="flex-row items-center justify-between">
        <Text className="text-base text-gray-600">Sender</Text>
        <Text className="text-base text-black">{senderName}</Text>
      </View>
    </View>
  );
};
