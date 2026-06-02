import { View, Text } from 'react-native';
import dayjs from 'dayjs';

export function TransactionRoute({ route }: { route: Record<string, unknown>[] }) {
  const formatTimestamp = (timestamp: unknown) => {
    if (typeof timestamp !== 'string') return '';
    return dayjs(timestamp).format('D MMM YYYY HH:mm');
  };

  return (
    <View className="py-4">
      {route.map((item, index) => (
        <View key={typeof item.id === 'string' ? item.id : String(index)} className="flex-row">
          <View className="mr-3 items-center">
            <View
              className={`h-2 w-2 rounded-full ${item.type === 'from' ? 'bg-gray-400' : 'bg-blue-500'}`}
            />
            {index < route.length - 1 && <View className="mt-1 h-full w-0.5 bg-gray-300" />}
          </View>
          <View className="flex-1 pb-4">
            <Text className="mb-0.5 text-base font-semibold text-gray-900">
              {typeof item.name === 'string' ? item.name : ''}{' '}
              {typeof item.accountNumber === 'string' && item.accountNumber
                ? `••${item.accountNumber}`
                : ''}
            </Text>
            <Text className="text-sm text-gray-600">{formatTimestamp(item.timestamp)}</Text>
            {index === 0 && route.length > 1 && (
              <Text className="mt-0.5 text-sm text-gray-600">Sent by KIBRU JOBA K.</Text>
            )}
          </View>
        </View>
      ))}
    </View>
  );
}
