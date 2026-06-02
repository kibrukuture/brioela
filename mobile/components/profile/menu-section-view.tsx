import React from 'react';
import { View, Text } from 'react-native';
import { MenuItemRow } from '@/components/profile/menu-item-row';

type MenuItem = {
  id: string;
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress: () => void;
};

type MenuSection = {
  title: string;
  items: MenuItem[];
};

export function MenuSectionView({ section }: { section: MenuSection }): React.ReactElement {
  return (
    <View className="mt-8">
      <Text className="mb-2 text-xl font-semibold text-neutral-900">{section.title}</Text>
      <View>
        {section.items.map((item, index) => (
          <MenuItemRow key={item.id} item={item} isLast={index === section.items.length - 1} />
        ))}
      </View>
    </View>
  );
}
