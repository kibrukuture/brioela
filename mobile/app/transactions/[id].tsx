import { useLocalSearchParams, useRouter } from 'expo-router';
import { TransactionDetailScreen } from '@/components/transaction/transaction-detail-screen';
import { getTransactionById } from '@/components/transaction/transaction-data';
import { View, Text } from 'react-native';

export default function TransactionDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const transaction = getTransactionById(id);

  if (!transaction) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-gray-500">Transaction not found</Text>
      </View>
    );
  }

  return (
    <TransactionDetailScreen
      transaction={transaction}
      onBack={() => router.back()}
      onHelp={() => {}}
      onMore={() => {}}
    />
  );
}
