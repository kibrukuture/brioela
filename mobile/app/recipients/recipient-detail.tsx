import { useMemo } from 'react';
import { ActivityIndicator, View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowUp } from 'lucide-react-native';
import type { BankingRecipientListItem } from '@brioela/shared/validators/banking-recipient.validator';
import { useRecipient } from '@/network/banking/use-recipient';
import { useDeleteRecipient } from '@/network/banking/use-delete-recipient';
import { Avatar } from '@/components/recipients/avatar';
import { AccountDetailRow } from '@/components/recipients/account-detail-row';
import { BackButton } from '@/components/ui/back-button';
import * as Burnt from 'burnt';

export default function RecipientDetailScreen() {
  const { recipientId } = useLocalSearchParams<{ recipientId: string }>();
  const router = useRouter();
  const deleteRecipient = useDeleteRecipient();

  const { data } = useRecipient(recipientId ?? '');
  const recipient = useMemo<BankingRecipientListItem | null>(() => {
    return data?.recipient ?? null;
  }, [data?.recipient]);

  if (!recipient) {
    return null;
  }

  const handleSend = () => {
    router.push({
      pathname: '/transactions/send-payment',
    });
  };

  const onDeleteRecipient = () => {
    Alert.alert('Delete Recipient', 'Are you sure you want to delete this recipient?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          if (!recipientId) return;
          deleteRecipient.mutate(recipientId, {
            onSuccess: () => {
              router.back();
            },
            onError: (e: unknown) => {
              const message = e instanceof Error ? e.message : 'Failed to delete recipient';
              Burnt.alert({ title: 'Oh no!', message, preset: 'error' });
            },
          });
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1" edges={['top']}>
      <BackButton />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="items-center pb-4 pt-6">
          <Avatar name={recipient.accountHolderName} size="xl" />
          <Text className="mt-4 font-parafina text-2xl font-bold text-gray-900">
            {recipient.accountHolderName}
          </Text>
          <Text className="mt-1 text-base text-[#9FE870]">{recipient.currency}</Text>
        </View>

        <View className="items-center py-4">
          <TouchableOpacity onPress={handleSend} className="items-center">
            <View className="h-14 w-14 items-center justify-center rounded-full bg-[#9FE870]">
              <ArrowUp size={28} color="#1A1A1A" />
            </View>
            <Text className="mt-2 text-sm font-medium text-gray-900">Send</Text>
          </TouchableOpacity>
        </View>

        <View className="mt-4 px-4">
          <View className="mb-2 border-b border-gray-200 pb-2">
            <Text className="text-sm text-gray-500">Account details</Text>
          </View>

          <AccountDetailRow label="Account holder name" value={recipient.accountHolderName} />

          {recipient.accountType ? (
            <AccountDetailRow label="Account type" value={recipient.accountType} />
          ) : null}

          {recipient.iban ? <AccountDetailRow label="IBAN" value={recipient.iban} /> : null}

          {recipient.bankName ? (
            <AccountDetailRow label="Bank name" value={recipient.bankName} />
          ) : null}

          <TouchableOpacity
            onPress={onDeleteRecipient}
            disabled={deleteRecipient.isPending}
            className="mb-8 mt-8 items-center rounded-2xl bg-red-50 py-4">
            {deleteRecipient.isPending ? (
              <ActivityIndicator color="#ef4444" />
            ) : (
              <Text className="text-base font-medium text-red-500">Delete recipient</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
