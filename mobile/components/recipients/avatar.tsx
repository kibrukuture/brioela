import { View, Text, Image } from 'react-native';
import { CountryFlag } from './country-flag';

interface AvatarProps {
  name: string;
  initials?: string;
  avatar?: string;
  countryFlag?: 'us' | 'eu' | 'ae';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  initials,
  avatar,
  countryFlag,
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-24 h-24',
    xl: 'w-28 h-28',
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-4xl',
  };

  const flagPositions = {
    sm: '-bottom-0.5 -right-0.5',
    md: '-bottom-1 -right-1',
    lg: '-bottom-1 -right-1',
    xl: '-bottom-1 -right-1',
  };

  const getInitials = (): string => {
    if (initials) return initials;
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`;
    }
    return name.substring(0, 2);
  };

  return (
    <View className="relative">
      <View
        className={`${sizeClasses[size]} items-center justify-center overflow-hidden rounded-full border-2 border-gray-200 bg-gray-50`}>
        {avatar ? (
          <Image
            source={{ uri: '/diverse-person-profile.png' }}
            className="h-full w-full"
            resizeMode="cover"
          />
        ) : (
          <Text className={`${textSizes[size]} font-medium text-gray-600`}>{getInitials()}</Text>
        )}
      </View>
      {countryFlag && (
        <View className={`absolute ${flagPositions[size]}`}>
          <CountryFlag country={countryFlag} size={size === 'sm' ? 'sm' : 'md'} />
        </View>
      )}
    </View>
  );
};
