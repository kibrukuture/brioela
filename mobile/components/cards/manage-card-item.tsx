import type * as React from 'react';
import { View, Text, Pressable } from 'react-native';
import { ChevronRight, Settings, Pencil, Gauge, Trash2 } from 'lucide-react-native';
import type { ManageCardItemType } from './types';

const getItemUi = (itemId: ManageCardItemType) => {
  switch (itemId) {
    case 'card_controls':
      return { label: 'Card controls', Icon: Settings };
    case 'card_label':
      return { label: 'Card label', Icon: Pencil };
    case 'spending_limits':
      return { label: 'Your spending limits', Icon: Gauge };
    case 'delete_card':
      return { label: 'Delete card', Icon: Trash2 };
  }
};

interface ManageCardItemComponentProps {
  readonly itemId: ManageCardItemType;
  readonly onPress: () => void;
}

export const ManageCardItem: React.FC<ManageCardItemComponentProps> = ({ itemId, onPress }) => {
  const { label, Icon } = getItemUi(itemId);

  return (
    <Pressable onPress={onPress} className="flex-row items-center px-6 py-4">
      <View className="h-12 w-12 items-center justify-center rounded-full bg-[#F3F4F6]">
        <Icon size={24} color="#1D1D1D" />
      </View>
      <Text className="ml-4 flex-1 text-base font-medium text-[#1D1D1D]">{label}</Text>
      <ChevronRight size={24} color="#9CA3AF" />
    </Pressable>
  );
};
