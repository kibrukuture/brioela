import { View, Text, Image } from 'react-native';

interface TransactionAvatarProps {
  merchantName: string;
  merchantIcon?: string;
  merchantInitial?: string;
  size?: 'small' | 'medium' | 'large';
}

export function TransactionAvatar({
  merchantName,
  merchantIcon,
  merchantInitial,
  size = 'medium',
}: TransactionAvatarProps) {
  const sizeClasses = {
    small: 'w-10 h-10',
    medium: 'w-12 h-12',
    large: 'w-20 h-20',
  };

  const textSizeClasses = {
    small: 'text-base',
    medium: 'text-lg',
    large: 'text-3xl',
  };

  const initial = merchantInitial || merchantName.charAt(0).toUpperCase();

  if (merchantIcon) {
    return (
      <View className={`${sizeClasses[size]} overflow-hidden rounded-full bg-gray-100`}>
        <Image source={{ uri: merchantIcon }} className="h-full w-full" resizeMode="cover" />
      </View>
    );
  }

  return (
    <View className={`${sizeClasses[size]} items-center justify-center rounded-full bg-gray-200`}>
      <Text className={`${textSizeClasses[size]} font-semibold text-gray-700`}>{initial}</Text>
    </View>
  );
}
