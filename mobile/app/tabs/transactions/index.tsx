import { useState, useRef, useMemo } from 'react';
import { View, Text, TouchableOpacity, SectionList, ScrollView, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Sliders,
  MagnifyingGlass,
  BookmarkSimple,
  CurrencyDollar,
  TrendDown,
  Bank,
} from 'phosphor-react-native';
import { useTransactions } from '@/hooks/transactions/use-transactions';
import type { BankingTransactionListItem } from '@brioela/shared/validators/banking-transaction.validator';
import { FilterChip } from '@/components/transaction/activ/filter-chip';
import { SearchHeader } from '@/components/transaction/activ/search-header';
import { TransactionListItem } from '@/components/transaction/activ/transaction-list-item';
import { TransactionDetailBottomSheet } from '@/components/transaction/activ/transaction-detail-bottom-sheet';
import { FiltersBottomSheet } from '@/components/transaction/activ/filters-bottom-sheet';
import dayjs from 'dayjs';

const AnimatedSectionList = Animated.createAnimatedComponent(
  SectionList<BankingTransactionListItem, { title: string; data: BankingTransactionListItem[] }>
);

interface TransactionSection {
  title: string;
  data: BankingTransactionListItem[];
}

export default function TransactionsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<BankingTransactionListItem | null>(
    null
  );

  const { data } = useTransactions({ limit: 100 });
  const apiTransactions: BankingTransactionListItem[] = data?.transactions ?? [];

  const scrollY = useRef(new Animated.Value(0)).current;
  const [isDetailSheetVisible, setIsDetailSheetVisible] = useState(false);
  const [isFiltersSheetVisible, setIsFiltersSheetVisible] = useState(false);

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

  const sections: TransactionSection[] = useMemo(() => {
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

    return Object.entries(groups)
      .sort(
        (a, b) =>
          dayjs(b[1][0]?.occurredAt ?? b[1][0]?.createdAt).valueOf() -
          dayjs(a[1][0]?.occurredAt ?? a[1][0]?.createdAt).valueOf()
      )
      .map(([title, data]) => ({ title, data }));
  }, [apiTransactions, searchQuery]);

  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [80, 50],
    extrapolate: 'clamp',
  });

  const headerTitleScale = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.7],
    extrapolate: 'clamp',
  });

  const headerTitleTranslateX = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -50],
    extrapolate: 'clamp',
  });

  const headerTitleTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 10],
    extrapolate: 'clamp',
  });

  const searchBarOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const filterChipsOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const renderItem = ({ item }: { item: BankingTransactionListItem }) => (
    <TransactionListItem transaction={item} onPress={() => handleTransactionPress(item)} />
  );

  const renderSectionHeader = ({ section }: { section: TransactionSection }) => (
    <View className="bg-white px-4 py-3">
      <Text className="text-2xl font-bold text-gray-900">{section.title}</Text>
    </View>
  );

  const ListHeaderComponent = () => (
    <>
      <Animated.View style={{ opacity: searchBarOpacity }} className="mb-3 px-4">
        <TouchableOpacity
          onPress={handleSearchPress}
          className="flex-row items-center rounded-full bg-gray-100 px-4 py-3.5">
          <MagnifyingGlass size={20} color="#9CA3AF" weight="regular" />
          <Text className="ml-2 text-base text-gray-400">Search</Text>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View style={{ opacity: filterChipsOpacity }} className="mb-4">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          <FilterChip icon={BookmarkSimple} label="Views" onPress={() => console.log('Views')} />
          <FilterChip
            icon={CurrencyDollar}
            label="Methods"
            onPress={() => console.log('Methods')}
          />
          <FilterChip icon={TrendDown} label="Amount" onPress={() => console.log('Amount')} />
          <FilterChip icon={Bank} label="Accounts" onPress={() => console.log('Accounts')} />
        </ScrollView>
      </Animated.View>
    </>
  );

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
            <SectionList
              sections={sections}
              renderItem={renderItem}
              renderSectionHeader={renderSectionHeader}
              keyExtractor={(item) => item.id}
              stickySectionHeadersEnabled
              className="flex-1"
            />
          )}
        </View>
      ) : (
        <>
          <Animated.View
            style={{ height: headerHeight }}
            className="flex-row items-center justify-between overflow-hidden px-4">
            <Animated.Text
              style={{
                transform: [
                  { scale: headerTitleScale },
                  { translateX: headerTitleTranslateX },
                  { translateY: headerTitleTranslateY },
                ],
              }}
              className="font-parafina text-4xl font-bold text-gray-900">
              Transactions
            </Animated.Text>
            <TouchableOpacity
              onPress={handleFiltersPress}
              className="h-10 w-10 items-center justify-center">
              <Sliders size={24} color="#111827" weight="regular" />
            </TouchableOpacity>
          </Animated.View>

          <AnimatedSectionList
            sections={sections}
            renderItem={renderItem}
            renderSectionHeader={renderSectionHeader}
            ListHeaderComponent={ListHeaderComponent}
            keyExtractor={(item) => item.id}
            stickySectionHeadersEnabled
            onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
              useNativeDriver: false,
            })}
            scrollEventThrottle={16}
            className="flex-1"
          />
        </>
      )}

      {/* Bottom Sheets */}
      <TransactionDetailBottomSheet
        key={selectedTransaction?.id ?? 'transaction-detail-sheet'}
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
