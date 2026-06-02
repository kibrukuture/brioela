import { View, Text } from 'react-native';

interface CountryFlagProps {
  country: 'us' | 'eu' | 'ae';
  size?: 'sm' | 'md' | 'lg';
}

export const CountryFlag: React.FC<CountryFlagProps> = ({ country, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const textSizes = {
    sm: 'text-[8px]',
    md: 'text-[10px]',
    lg: 'text-xs',
  };

  const flagContent = {
    us: (
      <View className={`${sizeClasses[size]} overflow-hidden rounded-full border border-gray-200`}>
        <View className="flex-1 bg-[#B22234]" />
        <View className="flex-1 bg-white" />
        <View className="flex-1 bg-[#B22234]" />
        <View className="flex-1 bg-white" />
        <View className="flex-1 bg-[#B22234]" />
        <View className="absolute left-0 top-0 h-[55%] w-[45%] items-center justify-center bg-[#3C3B6E]">
          <Text className={`text-white ${textSizes[size]}`}>★</Text>
        </View>
      </View>
    ),
    eu: (
      <View
        className={`${sizeClasses[size]} items-center justify-center rounded-full border border-gray-200 bg-[#003399]`}>
        <Text className={`text-[#FFCC00] ${textSizes[size]}`}>★</Text>
      </View>
    ),
    ae: (
      <View
        className={`${sizeClasses[size]} items-center justify-center rounded-full border border-gray-200 bg-[#00732F]`}>
        <Text className={`text-white ${textSizes[size]}`}>AE</Text>
      </View>
    ),
  };

  return flagContent[country];
};
