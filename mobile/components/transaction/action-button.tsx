import type React from 'react';
import { TouchableOpacity, Text } from 'react-native';

interface ActionButtonProps {
  title: string;
  variant?: 'primary' | 'secondary';
  onPress?: () => void;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  title,
  variant = 'primary',
  onPress,
}) => {
  const bgColor = variant === 'primary' ? 'bg-green-100' : 'bg-green-100';
  const textColor = 'text-green-900';

  return (
    <TouchableOpacity
      onPress={onPress}
      className={`mx-4 mb-3 items-center rounded-xl py-4 ${bgColor}`}>
      <Text className={`text-base font-semibold ${textColor}`}>{title}</Text>
    </TouchableOpacity>
  );
};
