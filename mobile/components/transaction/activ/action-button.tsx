import type React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import type { IconProps } from 'phosphor-react-native';

interface ActionButtonProps {
  icon: React.ComponentType<IconProps>;
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
}

export function ActionButton({
  icon: Icon,
  label,
  onPress,
  variant = 'secondary',
}: ActionButtonProps) {
  const bgColor = variant === 'primary' ? 'bg-blue-100' : 'bg-gray-100';
  const textColor = variant === 'primary' ? 'text-blue-600' : 'text-gray-700';
  const iconColor = variant === 'primary' ? '#2563EB' : '#4B5563';

  return (
    <TouchableOpacity
      onPress={onPress}
      className={`${bgColor} flex-row items-center gap-2 rounded-full px-4 py-2.5`}>
      <Icon size={18} color={iconColor} weight="regular" />
      <Text className={`text-sm font-medium ${textColor}`}>{label}</Text>
    </TouchableOpacity>
  );
}
