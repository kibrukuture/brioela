import type * as React from 'react';
import { View, Text } from 'react-native';
import type { CardData } from './types';

interface CardInfoDisplayProps {
  readonly card: CardData;
}

export const CardInfoDisplay: React.FC<CardInfoDisplayProps> = ({ card }) => {
  const label = (card.label ?? '').trim();

  return (
    <View className="mt-4 items-center">
      <View className="flex-row items-center gap-3">
        {label.length > 0 ? <Text className="text-base text-[#6B7280]">{label}</Text> : null}
      </View>
    </View>
  );
};
