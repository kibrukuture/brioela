import type React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import type { IconProps } from 'phosphor-react-native';

interface FilterChipProps {
  icon: React.ComponentType<IconProps>;
  label: string;
  onPress: () => void;
}

export function FilterChip({ icon: Icon, label, onPress }: FilterChipProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="mr-2.5 flex-row items-center rounded-full bg-gray-100 px-5 py-2.5"
      style={{ height: 40 }}>
      <Icon size={18} color="#374151" weight="regular" />
      <Text className="ml-2 text-sm font-medium text-gray-700">{label}</Text>
    </TouchableOpacity>
  );
}
