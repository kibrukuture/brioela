import type React from 'react';
import { View, Text } from 'react-native';

interface HowYouPaidSectionProps {
  currency: string;
  currencyFlag?: string;
  amountTaken: string;
}

export const HowYouPaidSection: React.FC<HowYouPaidSectionProps> = ({
  currency,
  currencyFlag,
  amountTaken,
}) => {
  return (
    <View className="px-4 py-4">
      <Text className="mb-4 text-xl font-bold text-black">How you paid</Text>

      {/* Currency row */}
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-base text-gray-600">{currency}</Text>
        {currencyFlag && (
          <View className="h-6 w-6 overflow-hidden rounded-full">
            <View className="h-1/2 w-full bg-red-500" />
            <View className="h-1/2 w-full items-center justify-center bg-white">
              <View className="h-2 w-2 rounded-full bg-red-500" />
            </View>
          </View>
        )}
      </View>

      {/* Amount taken */}
      <View className="flex-row items-center justify-between">
        <Text className="text-base text-gray-600">Amount taken</Text>
        <Text className="text-base text-black">{amountTaken}</Text>
      </View>
    </View>
  );
};
