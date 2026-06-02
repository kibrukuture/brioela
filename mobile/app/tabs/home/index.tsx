import type React from 'react';
import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Pressable, Image } from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import dayjs from 'dayjs';
import {
  Bank,
  Plus,
  CreditCard,
  ArrowDown,
  ArrowUp,
  PaperPlaneTilt,
  LinkSimple,
} from 'phosphor-react-native';
import { useSheetRef } from '@/components/ui/sheet';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AddMoneySheet } from '@/components/home/add-money-sheet';
import { RequestMoneySheet } from '@/components/home/request-money-sheet';
import { useVirtualAccounts } from '@/hooks/banking/use-virtual-accounts';
import { useBalances } from '@/hooks/banking/use-balances';
import { virtualAccountsToCards } from '@/lib/banking/virtual-accounts-to-cards';
import { CURRENCY_OPTIONS } from '@/lib/banking/currency-options';
import { useTransactions } from '@/hooks/transactions/use-transactions';
import type { BankingTransactionListItem } from '@schnl/shared/validators/banking-transaction.validator';
import { formatBankingAmount } from '@schnl/shared/utils/format-banking-amount';
import { TransactionDetailBottomSheet } from '@/components/transaction/activ/transaction-detail-bottom-sheet';
import { usePrivacyStore } from '@/stores/ui/use-privacy-store';
import { bankingBalances } from '@/lib/banking/banking-balances';

type CurrencyAccount = ReturnType<typeof virtualAccountsToCards>[number];

// Components
type PhosphorIcon = React.ComponentType<{
  size?: number;
  color?: string;
  weight?: 'regular' | 'bold' | 'fill';
}>;

const ActionButton: React.FC<{
  label: string;
  icon?: PhosphorIcon;
  variant?: 'primary' | 'secondary';
  onPress?: () => void;
}> = ({ label, icon: Icon, variant = 'secondary', onPress }) => {
  const isPrimary = variant === 'primary';
  return (
    <Pressable
      onPress={onPress}
      className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-full px-3 py-3 ${
        isPrimary ? 'bg-[#D4F5D4]' : 'bg-gray-100'
      }`}>
      {Icon && <Icon size={18} weight="bold" color={isPrimary ? '#166534' : '#374151'} />}
      <Text className={`text-sm font-medium ${isPrimary ? 'text-green-800' : 'text-gray-800'}`}>
        {label}
      </Text>
    </Pressable>
  );
};

const CurrencyCard: React.FC<{
  account: CurrencyAccount;
  onPress: () => void;
  balanceText: string;
}> = ({ account, onPress, balanceText }) => {
  const currencyOption = CURRENCY_OPTIONS.find((c) => c.code === account.currency);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="min-h-[140px] w-44 justify-between rounded-2xl bg-[#F5F5F0] p-4">
      <View className="flex-row items-center gap-2">
        <View className="h-6 w-6">
          {currencyOption?.flag ? (
            <Image source={currencyOption.flag} className="h-6 w-6" resizeMode="cover" />
          ) : null}
        </View>
        <Text className="text-lg font-medium text-gray-800">{account.currency}</Text>
      </View>
      <View className="mt-auto">
        <View className="flex-row items-center gap-1">
          <Bank size={16} color="#888" />
          <Text className="text-sm text-gray-500">·· {account.accountNumber}</Text>
        </View>
        <Text className="text-2xl font-bold text-gray-900">{balanceText}</Text>
      </View>
    </TouchableOpacity>
  );
};

const NewAccountCard: React.FC<{ onPress: () => void }> = ({ onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.7}
    className="min-h-[140px] w-44 justify-between rounded-2xl border-2 border-dashed border-gray-300 p-4">
    <View className="flex-row items-center gap-2">
      <View className="h-10 w-10 items-center justify-center rounded-full bg-gray-100">
        <Plus size={20} color="#888" />
      </View>
      <Text className="text-lg font-medium text-gray-800">New</Text>
    </View>
    <View className="mt-auto">
      <Text className="text-sm text-gray-500">Spend, save and share money in 40+ currencies.</Text>
    </View>
  </TouchableOpacity>
);

const TransactionItem: React.FC<{
  transaction: BankingTransactionListItem;
  onPress: () => void;
}> = ({ transaction, onPress }) => {
  const getIcon = () => {
    if (transaction.direction === 'credit') return <ArrowDown size={24} color="#10B981" />;
    if (transaction.direction === 'debit') return <ArrowUp size={24} color="#EF4444" />;
    return <CreditCard size={24} color="#888" />;
  };

  const getDescription = () => {
    return dayjs(transaction.occurredAt ?? transaction.createdAt).format('MMM D');
  };

  const getMerchantName = () => {
    return transaction.displayTitle ?? transaction.description ?? 'Unknown';
  };

  const amount = formatBankingAmount({
    amountAtomic: transaction.amountAtomic,
    currency: transaction.currency,
  });

  return (
    <TouchableOpacity className="flex-row items-center py-3" onPress={onPress} activeOpacity={0.7}>
      <View className="mr-3 h-12 w-12 items-center justify-center rounded-full bg-gray-100">
        {getIcon()}
      </View>
      <View className="flex-1">
        <Text className="text-base font-semibold text-gray-900">{getMerchantName()}</Text>
        <Text className="text-sm text-gray-500">{getDescription()}</Text>
      </View>
      <Text className="text-base font-medium text-gray-900">{amount.display}</Text>
    </TouchableOpacity>
  );
};

export default function HomeScreen() {
  const headerHeight = useHeaderHeight();
  const router = useRouter();
  const { isDataVisible } = usePrivacyStore();

  const [selectedTransaction, setSelectedTransaction] = useState<BankingTransactionListItem | null>(
    null
  );
  const [isDetailSheetVisible, setIsDetailSheetVisible] = useState(false);

  const { data: balancesData } = useBalances();
  const balanceSummary = bankingBalances(balancesData, isDataVisible);

  // USD is the temporary default for the "Total balance" display.
  const totalBalanceText = balanceSummary.totalBalance;

  const { data: transactionsData } = useTransactions({ limit: 6 });
  const transactions: BankingTransactionListItem[] = transactionsData?.transactions ?? [];

  const { data: virtualAccounts } = useVirtualAccounts();
  const currencyAccounts = virtualAccountsToCards(virtualAccounts);

  const addMoneySheetRef = useSheetRef();
  const requestSheetRef = useSheetRef();

  const handleAddMoney = (): void => {
    addMoneySheetRef.current?.present();
  };

  const handleAddMoneyOption = (option: 'bank' | 'card' | 'crypto'): void => {
    if (option === 'bank') {
      router.push('/add-money/bank-transfer');
    } else if (option === 'card') {
      router.push('/add-money/card');
    } else {
      router.push('/add-money/crypto');
    }
  };

  const handleRequest = (): void => {
    requestSheetRef.current?.present();
  };

  const handleRequestOption = (option: 'qr' | 'link' | 'scan'): void => {
    if (option === 'qr') {
      router.push('/profile/schnl-tag');
    } else if (option === 'link') {
      router.push('/request-money/create-link');
    } else {
      router.push('/profile/scan');
    }
  };

  const handleAccountPress = (account: CurrencyAccount): void => {
    router.push(`/accounts/${account.currencyCode}`);
  };

  const handleNewAccountPress = (): void => {
    router.push('/accounts/create');
  };

  const handleTransactionPress = (transaction: BankingTransactionListItem): void => {
    setSelectedTransaction(transaction);
    setIsDetailSheetVisible(true);
  };

  const handleSeeAllPress = (): void => {
    router.push('/tabs/transactions');
  };

  return (
    <SafeAreaView className="flex-1">
      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: headerHeight }}
        contentInsetAdjustmentBehavior="automatic"
        scrollIndicatorInsets={{ top: headerHeight }}>
        {/* Balance Section */}
        <View>
          <Text className="text-base text-gray-500">Total balance</Text>
          <View className="mt-1 flex-row items-center gap-2">
            <Text className="font-parafina text-4xl font-bold text-gray-900">
              {totalBalanceText}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="mt-5 flex-row gap-2">
          <ActionButton
            label="Send"
            icon={PaperPlaneTilt}
            variant="primary"
            onPress={() => router.push('/transactions/send-payment')}
          />
          <ActionButton label="Add money" icon={Plus} onPress={handleAddMoney} />
          <ActionButton label="Get paid" icon={LinkSimple} onPress={handleRequest} />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="-mx-4 mt-6"
          contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
          {currencyAccounts.map((account) => (
            <CurrencyCard
              key={account.id}
              account={account}
              onPress={() => handleAccountPress(account)}
              balanceText={balanceSummary.byCurrencyCode[account.currency] ?? '***'}
            />
          ))}
          <NewAccountCard onPress={handleNewAccountPress} />
        </ScrollView>

        {/* Transactions Section */}
        <View className="mt-8">
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="text-xl font-bold text-gray-900">Activities</Text>
            <TouchableOpacity onPress={handleSeeAllPress}>
              <Text className="text-base font-medium text-green-700 underline">See all</Text>
            </TouchableOpacity>
          </View>
          <View>
            {transactions.map((transaction: BankingTransactionListItem) => (
              <TransactionItem
                key={transaction.id}
                transaction={transaction}
                onPress={() => handleTransactionPress(transaction)}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      <TransactionDetailBottomSheet
        key={selectedTransaction?.id ?? 'transaction-detail-sheet'}
        transaction={selectedTransaction}
        isVisible={isDetailSheetVisible}
        onClose={() => {
          setIsDetailSheetVisible(false);
          setSelectedTransaction(null);
        }}
      />

      <AddMoneySheet ref={addMoneySheetRef} onSelectOption={handleAddMoneyOption} />
      <RequestMoneySheet ref={requestSheetRef} onSelectOption={handleRequestOption} />
    </SafeAreaView>
  );
}
