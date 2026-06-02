import type React from 'react';
import { View, Text } from 'react-native';

interface TransactionNumberProps {
  number: string;
  merchantName?: string;
}

export const TransactionNumber: React.FC<TransactionNumberProps> = ({ number, merchantName }) => {
  return (
    <View className="items-center py-4">
      <Text className="text-sm text-gray-500">Transaction no. #{number}</Text>
      {merchantName && <Text className="mt-1 text-xs text-gray-400">{merchantName}</Text>}
    </View>
  );
};
