import type * as React from 'react';
import { View, Text } from 'react-native';
import type { ManageCardListProps } from './types';
import { ManageCardItem } from './manage-card-item';

export const ManageCardList: React.FC<ManageCardListProps> = ({ items, onItemPress }) => {
  return (
    <View className="mt-6">
      <View className="border-b border-[#E5E7EB] px-6 pb-2">
        <Text className="text-base text-[#6B7280]">Manage card</Text>
      </View>
      {items.map((item) => (
        <ManageCardItem key={item} itemId={item} onPress={() => onItemPress(item)} />
      ))}
    </View>
  );
};
