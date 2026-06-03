import { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Sliders,
  MagnifyingGlass,
  BookmarkSimple,
  CurrencyDollar,
  TrendDown,
  Bank,
  IconProps,
} from 'phosphor-react-native';
import { useTransactions } from '@/network/banking/use-transactions';
import type { BankingTransactionListItem } from '@brioela/shared/validators/banking-transaction.validator';
import { TransactionGroup } from '@/components/transaction/activ/transaction-group';
import { FilterChip } from '@/components/transaction/activ/filter-chip';
import { SearchHeader } from '@/components/transaction/activ/search-header';
import { TransactionDetailBottomSheet } from '@/components/transaction/activ/transaction-detail-bottom-sheet';
import { FiltersBottomSheet } from '@/components/transaction/activ/filters-bottom-sheet';
import dayjs from 'dayjs';

export default function TransactionsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<BankingTransactionListItem | null>(
    null
  );
  const [isDetailSheetVisible, setIsDetailSheetVisible] = useState(false);
  const [isFiltersSheetVisible, setIsFiltersSheetVisible] = useState(false);

  const { data } = useTransactions({ limit: 100 });
  const apiTransactions: BankingTransactionListItem[] = data?.transactions ?? [];

  const handleTransactionPress = (transaction: BankingTransactionListItem) => {
    setSelectedTransaction(transaction);
    setIsDetailSheetVisible(true);
  };

  const handleSearchPress = () => {
    setIsSearchMode(true);
  };

  const handleSearchClose = () => {
    setIsSearchMode(false);
    setSearchQuery('');
  };

  const handleFiltersPress = () => {
    setIsFiltersSheetVisible(true);
  };

  const groupedTransactions = useMemo(() => {
    const filtered = searchQuery
      ? apiTransactions.filter((t) => {
          const merchantName = t.displayTitle ?? t.description ?? 'Unknown';
          const subtitle = t.displaySubtitle ?? '';

          return (
            merchantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            subtitle.toLowerCase().includes(searchQuery.toLowerCase())
          );
        })
      : apiTransactions;

    const groups: { [key: string]: BankingTransactionListItem[] } = {};

    filtered.forEach((transaction) => {
      const date = dayjs(transaction.occurredAt ?? transaction.createdAt).format('D MMM YYYY');

      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(transaction);
    });

    return Object.entries(groups).sort((a, b) => {
      return (
        dayjs(b[1][0]?.occurredAt ?? b[1][0]?.createdAt).valueOf() -
        dayjs(a[1][0]?.occurredAt ?? a[1][0]?.createdAt).valueOf()
      );
    });
  }, [apiTransactions, searchQuery]);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-white">
      {isSearchMode ? (
        <View className="flex-1">
          <SearchHeader
            value={searchQuery}
            onChangeText={setSearchQuery}
            onClose={handleSearchClose}
          />

          {searchQuery === '' && (
            <View className="px-4 py-6">
              <Text className="text-base text-gray-600">
                Search for merchants, recipients, descriptions, and notes.
              </Text>
            </View>
          )}

          {searchQuery !== '' && (
            <ScrollView className="flex-1">
              {groupedTransactions.map(([date, transactions]) => (
                <TransactionGroup
                  key={date}
                  date={date}
                  transactions={transactions}
                  onTransactionPress={handleTransactionPress}
                />
              ))}
            </ScrollView>
          )}
        </View>
      ) : (
        <>
          {/* Header */}
          <View className="flex-row items-center justify-between px-4 py-4">
            <Text className="font-parafina text-4xl font-bold text-gray-900">Transactions</Text>
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={handleFiltersPress}
                className="h-10 w-10 items-center justify-center">
                <Sliders size={24} color="#111827" weight="regular" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Search Bar */}
          <View className="mb-4 px-4">
            <TouchableOpacity
              onPress={handleSearchPress}
              className="flex-row items-center rounded-full bg-gray-100 px-4 py-3">
              <MagnifyingGlass size={20} color="#9CA3AF" weight="regular" />
              <Text className="ml-2 text-base text-gray-400">Search</Text>
            </TouchableOpacity>
          </View>

          {/* Filter Chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4 px-4">
            <FilterChip icon={BookmarkSimple} label="Views" onPress={() => console.log('Views')} />
            <FilterChip
              icon={CurrencyDollar}
              label="Methods"
              onPress={() => console.log('Methods')}
            />
            <FilterChip icon={TrendDown} label="Amount" onPress={() => console.log('Amount')} />
            <FilterChip icon={Bank} label="Accounts" onPress={() => console.log('Accounts')} />
          </ScrollView>

          {/* Transaction List */}
          <ScrollView className="flex-1">
            {groupedTransactions.map(([date, transactions]) => (
              <TransactionGroup
                key={date}
                date={date}
                transactions={transactions}
                onTransactionPress={handleTransactionPress}
              />
            ))}
          </ScrollView>
        </>
      )}

      {/* Bottom Sheets */}
      <TransactionDetailBottomSheet
        transaction={selectedTransaction}
        isVisible={isDetailSheetVisible}
        onClose={() => {
          setIsDetailSheetVisible(false);
          setSelectedTransaction(null);
        }}
      />

      <FiltersBottomSheet
        isVisible={isFiltersSheetVisible}
        onClose={() => setIsFiltersSheetVisible(false)}
        onClearFilters={() => {
          console.log('Clear filters');
          setIsFiltersSheetVisible(false);
        }}
        onSeeResults={() => {
          console.log('See results');
          setIsFiltersSheetVisible(false);
        }}
      />
    </SafeAreaView>
  );
}
