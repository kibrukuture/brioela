import type * as React from 'react';
import { View, Text, Pressable } from 'react-native';

interface CardsHeaderProps {
  readonly onTravelHubPress: () => void;
  readonly onOrderCardPress: () => void;
}

export const CardsHeader: React.FC<CardsHeaderProps> = ({ onTravelHubPress, onOrderCardPress }) => {
  return (
    <View className="flex-row items-center justify-between px-6 py-4">
      <View />

      <Pressable
        onPress={onOrderCardPress}
        className="flex-row items-center rounded-full bg-neutral-900 px-5 py-3">
        <Text className="ml-2 text-sm font-semibold text-white">Order card</Text>
      </Pressable>
    </View>
  );
};
