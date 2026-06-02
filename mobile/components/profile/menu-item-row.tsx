import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

type MenuItem = {
  id: string;
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress: () => void;
};

export function MenuItemRow({
  item,
  isLast = false,
}: {
  item: MenuItem;
  isLast?: boolean;
}): React.ReactElement {
  let borderClass = 'border-b border-neutral-100';
  if (isLast) {
    borderClass = '';
  }

  let subtitle: React.ReactElement | null = null;
  if (item.subtitle) {
    subtitle = <Text className="mt-0.5 text-sm text-neutral-500">{item.subtitle}</Text>;
  }

  return (
    <TouchableOpacity
      onPress={item.onPress}
      className={`flex-row items-center py-4 ${borderClass}`}
      activeOpacity={0.7}>
      <View className="h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
        {item.icon}
      </View>
      <View className="ml-4 flex-1">
        <Text className="text-base font-medium text-neutral-900">{item.title}</Text>
        {subtitle}
      </View>
      <ChevronRight size={20} color="#a3a3a3" />
    </TouchableOpacity>
  );
}
