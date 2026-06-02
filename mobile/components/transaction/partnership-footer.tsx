import type React from 'react';
import { View, Text, Image } from 'react-native';

interface PartnershipFooterProps {
  partnerName: string;
  partnerLogo?: string;
}

export const PartnershipFooter: React.FC<PartnershipFooterProps> = ({
  partnerName,
  partnerLogo,
}) => {
  return (
    <View className="flex-row items-center justify-center py-6">
      <Text className="mr-3 text-sm text-gray-500">In partnership with</Text>
      {partnerLogo ? (
        <Image source={{ uri: partnerLogo }} className="h-8 w-24" resizeMode="contain" />
      ) : (
        <View className="flex-row items-center">
          <View className="mr-2 h-6 w-6 items-center justify-center rounded-full bg-green-500">
            <Text className="text-xs font-bold text-white">+</Text>
          </View>
          <View>
            <Text className="text-sm font-bold text-teal-600">Moka</Text>
            <Text className="text-xs text-teal-600">United</Text>
          </View>
        </View>
      )}
    </View>
  );
};
