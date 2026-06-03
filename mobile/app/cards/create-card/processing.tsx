import * as React from 'react';
import { View, Text, ActivityIndicator, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackButton } from '@/components/ui/back-button';
import { useCards } from '@/network/cards/use-cards';
import { useCardOrder } from '@/network/cards/use-card-order';
import { useCreateCardFlowStore } from '@/stores/cards/use-create-card-flow-store';

export default function CreateCardProcessingScreen() {
  const router = useRouter();
  const id = useCreateCardFlowStore((state) => state.orderId) ?? '';
  const resetCreateCardFlow = useCreateCardFlowStore((state) => state.resetCreateCardFlow);

  const { data, refetch } = useCardOrder(id);
  useCards();

  React.useEffect(() => {
    if (!id) return;
    const interval = setInterval(() => {
      refetch();
    }, 2500);
    return () => clearInterval(interval);
  }, [id, refetch]);

  const status = data?.order.status ?? 'processing';

  React.useEffect(() => {
    if (status === 'completed' || status === 'preparing' || status === 'shipped') {
      resetCreateCardFlow();
      router.replace('/tabs/cards');
    }
  }, [status, router, resetCreateCardFlow]);

  const content = !id ? (
    <View className="px-5 pt-4">
      <Text className="text-sm text-red-600">Missing order</Text>
      <Pressable
        onPress={() => {
          resetCreateCardFlow();
          router.replace('/tabs/cards');
        }}
        className="mt-4 items-center rounded-full bg-neutral-900 px-5 py-4">
        <Text className="text-base font-semibold text-white">Go back</Text>
      </Pressable>
    </View>
  ) : (
    <>
      <View className="px-5">
        <Text className="font-parafina text-4xl font-semibold text-neutral-900">
          Processing payment
        </Text>
        <Text className="mt-1 text-sm text-neutral-500">
          Hold tight—this can take a few seconds.
        </Text>
      </View>

      <View className="mx-5 mt-6 rounded-2xl border border-neutral-100 bg-white p-4">
        <View className="flex-row items-center">
          <ActivityIndicator size="small" color="#111827" />
          <Text className="ml-3 text-base font-semibold text-neutral-900">Working…</Text>
        </View>

        <View className="mt-4 rounded-xl bg-neutral-50 p-3">
          <Text className="text-sm text-neutral-900">Status: {status}</Text>
        </View>
      </View>

      <View className="h-10" />
    </>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <BackButton />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {content}
      </ScrollView>
    </SafeAreaView>
  );
}
