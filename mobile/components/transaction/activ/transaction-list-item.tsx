import { View, Text, TouchableOpacity } from 'react-native';
import { TransactionAvatar } from './transaction-avatar';
import type { BankingTransactionListItem } from '@brioela/shared/validators/banking-transaction.validator';
import { formatBankingAmount } from '@brioela/shared/utils/format-banking-amount';

interface TransactionListItemProps {
  transaction: BankingTransactionListItem;
  onPress: (transaction: BankingTransactionListItem) => void;
}

export function TransactionListItem({ transaction, onPress }: TransactionListItemProps) {
  const isNegative = transaction.direction === 'debit';
  const isFailed = transaction.status === 'failed';

  const merchantName = transaction.displayTitle ?? transaction.description ?? 'Unknown';
  const subtitle = transaction.displaySubtitle ?? '';

  const amount = formatBankingAmount({
    amountAtomic: transaction.amountAtomic,
    currency: transaction.currency,
  });

  return (
    <TouchableOpacity
      onPress={() => onPress(transaction)}
      className="flex-row items-center px-4 py-3 active:bg-gray-50">
      <TransactionAvatar
        merchantName={merchantName}
        merchantIcon={undefined}
        merchantInitial={transaction.merchantInitial ?? undefined}
        size="medium"
      />

      <View className="ml-3 flex-1">
        <Text className="mb-0.5 text-base font-semibold text-gray-900">{merchantName}</Text>
        <View className="flex-row items-center gap-2">
          <Text className="text-sm text-gray-600">{subtitle}</Text>
          {isFailed && (
            <View className="rounded bg-red-100 px-2 py-0.5">
              <Text className="text-xs font-medium text-red-600">Failed</Text>
            </View>
          )}
        </View>
      </View>

      <View className="items-end">
        <Text
          className={`text-base font-semibold ${
            isFailed
              ? 'text-gray-400 line-through'
              : isNegative
                ? 'text-gray-900'
                : 'text-green-600'
          }`}>
          {amount.display}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
