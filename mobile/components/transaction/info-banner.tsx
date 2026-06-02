import type React from 'react';
import { View, Text } from 'react-native';

interface InfoBannerProps {
  message: string;
}

export const InfoBanner: React.FC<InfoBannerProps> = ({ message }) => {
  return (
    <View className="mx-4 my-4 flex-row items-start rounded-xl bg-gray-100 p-4">
      <View className="mr-3 h-8 w-8 items-center justify-center rounded-full bg-gray-500">
        <Text className="font-bold text-white">i</Text>
      </View>
      <Text className="flex-1 text-base leading-6 text-gray-700">{message}</Text>
    </View>
  );
};
