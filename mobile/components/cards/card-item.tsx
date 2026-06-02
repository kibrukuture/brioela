import type * as React from 'react';
import { View, Text } from 'react-native';
import { Snowflake, Wifi } from 'lucide-react-native';
import type { CardItemProps } from './types';

export const CardItem: React.FC<CardItemProps> = ({ card, isActive }) => {
  const getCardBackground = (): string => {
    switch (card.design) {
      case 'hello_world':
        return 'bg-[#4CB05C]';
      case 'schnl_tropical':
        return 'bg-[#4CB05C]';
      case 'schnl_frozen':
        return 'bg-[#C8C8D4]';
      case 'schnl_default':
        return 'bg-[#4CB05C]';
      default:
        return 'bg-[#4CB05C]';
    }
  };

  const isFrozen = card.status === 'frozen';

  const cardholder = (card.cardholderName ?? '').trim() || 'SCHNL USER';

  const maskedNumber = card.cardNumber ?? `•••• •••• •••• ${card.lastFourDigits}`;

  const expiryText = card.expiryDate ? `VALID THRU  ${card.expiryDate}` : '';

  return (
    <View
      className={`h-[200px] w-[320px] rounded-2xl ${getCardBackground()} mx-2 p-5 ${
        isActive ? 'opacity-100' : 'opacity-60'
      }`}>
      <View className="flex-row items-start justify-between">
        <View className="flex-row items-center gap-2">
          <Text className={`text-sm font-semibold ${isFrozen ? 'text-[#6B7280]' : 'text-white'}`}>
            SCHNL
          </Text>
        </View>

        <View className="h-9 w-9 items-center justify-center rounded-full bg-white/10">
          <Wifi
            size={20}
            color={isFrozen ? '#6B7280' : '#FFFFFF'}
            style={{ transform: [{ rotate: '90deg' }] }}
          />
        </View>
      </View>

      <View className="mt-6">
        {isFrozen ? (
          <View className="flex-row items-center gap-2">
            <Snowflake size={18} color="#6B7280" />
            <Text className="text-sm font-semibold text-[#6B7280]">Frozen</Text>
          </View>
        ) : (
          <Text className={`text-lg tracking-[2px] ${isFrozen ? 'text-[#6B7280]' : 'text-white'}`}>
            {maskedNumber}
          </Text>
        )}
      </View>

      <View className="mt-4 flex-1 flex-row items-end justify-between">
        <View>
          <Text className={`text-[10px] ${isFrozen ? 'text-[#6B7280]' : 'text-white/80'}`}>
            CARDHOLDER
          </Text>
          <Text
            className={`mt-1 text-sm font-semibold ${isFrozen ? 'text-[#6B7280]' : 'text-white'}`}>
            {cardholder.toUpperCase()}
          </Text>
        </View>

        <View className="items-end">
          <Text className={`text-[10px] ${isFrozen ? 'text-[#6B7280]' : 'text-white/80'}`}>
            {expiryText}
          </Text>
          <Text
            className={`mt-1 text-lg font-bold italic ${isFrozen ? 'text-[#6B7280]' : 'text-white'}`}>
            VISA
          </Text>
        </View>
      </View>
    </View>
  );
};
