import type React from 'react';
import { View, Text } from 'react-native';
import type { BankDetails } from './types';

interface BankDetailsSectionProps {
  bankDetails: BankDetails;
}

export const BankDetailsSection: React.FC<BankDetailsSectionProps> = ({ bankDetails }) => {
  return (
    <View className="px-4 py-4">
      <Text className="mb-4 text-xl font-bold text-black">Your bank details</Text>

      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-base text-gray-600">Account holder name</Text>
        <Text className="text-base text-black">{bankDetails.accountHolderName}</Text>
      </View>

      <View className="mb-3 flex-row items-start justify-between">
        <Text className="text-base text-gray-600">IBAN</Text>
        <Text className="ml-4 flex-1 text-right text-base text-black">{bankDetails.iban}</Text>
      </View>

      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-base text-gray-600">Email</Text>
        <Text className="text-base text-black">{bankDetails.email}</Text>
      </View>

      <View className="flex-row items-center justify-between">
        <Text className="text-base text-gray-600">Bank name</Text>
        <Text className="text-base text-black">{bankDetails.bankName}</Text>
      </View>
    </View>
  );
};
