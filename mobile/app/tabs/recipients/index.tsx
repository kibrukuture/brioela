import { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { UsersThree } from 'phosphor-react-native';

import type { BankingRecipientListItem } from '@schnl/shared/validators/banking-recipient.validator';
import { useRecipients } from '@/hooks/recipients/use-recipients';
import { RecentsGrid } from '@/components/recipients/recents-grid';
import { RecipientListItem } from '@/components/recipients/recipient-list-item';
import { RecipientBottomSheet } from '@/components/recipients/recipient-bottom-sheet';

export default function RecipientsScreen() {
  const router = useRouter();
  const [isSheetVisible, setIsSheetVisible] = useState(false);

  const { data } = useRecipients();
  const apiRecipients: BankingRecipientListItem[] = data?.recipients ?? [];

  const [selectedRecipient, setSelectedRecipient] = useState<BankingRecipientListItem | null>(null);

  const handleRecipientPress = useCallback(
    (recipient: BankingRecipientListItem) => {
      setSelectedRecipient(recipient);
      if (isSheetVisible) {
        setIsSheetVisible(false);
        requestAnimationFrame(() => {
          setIsSheetVisible(true);
        });
      } else {
        setIsSheetVisible(true);
      }
    },
    [isSheetVisible]
  );

  const handleSend = useCallback(
    (recipient: BankingRecipientListItem) => {
      setIsSheetVisible(false);
      router.push({
        pathname: '/transactions/send-payment',
      });
    },
    [router]
  );

  const handleView = useCallback(
    (recipient: BankingRecipientListItem) => {
      setIsSheetVisible(false);
      router.push({
        pathname: '/recipients/recipient-detail',
        params: { recipientId: recipient.id },
      });
    },
    [router]
  );

  const handleListItemPress = useCallback(
    (recipient: BankingRecipientListItem) => {
      router.push({
        pathname: '/recipients/recipient-detail',
        params: { recipientId: recipient.id },
      });
    },
    [router]
  );

  const handleCloseSheet = useCallback(() => {
    setIsSheetVisible(false);
    setSelectedRecipient(null);
  }, []);

  if (apiRecipients.length === 0) {
    return (
      <GestureHandlerRootView className="flex-1">
        <SafeAreaView className="flex-1" edges={['top']}>
          <View className="flex-1 items-center justify-center px-6 pb-12">
            <View className="mb-4 h-14 w-14 items-center justify-center rounded-full bg-neutral-100">
              <UsersThree size={26} weight="bold" color="#171717" />
            </View>

            <Text className="max-w-[280px] text-center text-base text-neutral-600">
              You don't have any recipients saved. Add one to get started.
            </Text>

            <TouchableOpacity
              className="mt-6 rounded-xl bg-neutral-900 px-5 py-3"
              onPress={() => router.push('/recipients/add-recipient')}
              activeOpacity={0.85}>
              <Text className="text-sm font-semibold text-white">Add recipient</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </GestureHandlerRootView>
    );
  }

  const renderListHeader = () => (
    <View className="mb-4">
      <View className="mb-4 px-4">
        <Text className="font-parafina text-3xl font-bold text-gray-900">Recipients</Text>
      </View>

      <View className="mb-4 px-4">
        <TouchableOpacity
          className="self-start rounded-xl bg-neutral-900 px-5 py-3"
          onPress={() => router.push('/recipients/add-recipient')}>
          <Text className="text-sm font-semibold text-white">Add recipient</Text>
        </TouchableOpacity>
      </View>

      <RecentsGrid recipients={apiRecipients.slice(0, 6)} onRecipientPress={handleRecipientPress} />
    </View>
  );

  return (
    <GestureHandlerRootView className="flex-1">
      <SafeAreaView className="flex-1" edges={['top']}>
        <FlatList
          data={apiRecipients}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <RecipientListItem recipient={item} onPress={handleListItemPress} />
          )}
          ListHeaderComponent={renderListHeader}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        />

        <RecipientBottomSheet
          recipient={selectedRecipient}
          isVisible={isSheetVisible}
          onSend={handleSend}
          onView={handleView}
          onClose={handleCloseSheet}
        />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}
