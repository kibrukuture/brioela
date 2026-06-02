import { View, Text } from 'react-native';
import { TransactionListItem } from './transaction-list-item';
import type { BankingTransactionListItem } from '@schnl/shared/validators/banking-transaction.validator';

interface TransactionGroupProps {
  date: string;
  transactions: BankingTransactionListItem[];
  onTransactionPress: (transaction: BankingTransactionListItem) => void;
}

export function TransactionGroup({
  date,
  transactions,
  onTransactionPress,
}: TransactionGroupProps) {
  return (
    <View className="mb-4">
      <Text className="mb-3 px-4 text-2xl font-bold text-gray-900">{date}</Text>
      <View>
        {transactions.map((transaction) => (
          <TransactionListItem
            key={transaction.id}
            transaction={transaction}
            onPress={onTransactionPress}
          />
        ))}
      </View>
    </View>
  );
}
