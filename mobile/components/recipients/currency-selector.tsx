import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { CountryFlag } from './country-flag';
import type { SupportedBankingCurrencyCode } from '@brioela/shared/constants';

interface CurrencySelectorProps {
  currency: SupportedBankingCurrencyCode;
  onPress?: () => void;
  showInitials?: string;
}

export const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  currency,
  onPress,
  showInitials,
}) => {
  const flagMap: Record<string, 'us' | 'eu' | 'ae'> = {
    usd: 'us',
    eur: 'eu',
    aed: 'ae',
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center gap-2 rounded-full bg-gray-100 px-3 py-2">
      {showInitials && (
        <View className="h-6 w-6 items-center justify-center rounded-full bg-gray-200">
          <Text className="text-xs font-medium text-gray-700">{showInitials}</Text>
        </View>
      )}
      <CountryFlag country={flagMap[currency] ?? 'eu'} size="sm" />
      <Text className="text-sm font-semibold text-gray-900">{currency}</Text>
      <ChevronDown size={16} color="#666" />
    </TouchableOpacity>
  );
};
