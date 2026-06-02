import * as React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackButton } from '@/components/ui/back-button';
import { CreditCard } from 'lucide-react-native';
import { useCreateCardFlowStore } from '@/stores/cards/use-create-card-flow-store';

export default function CreateCardScreen() {
  const router = useRouter();
  const setType = useCreateCardFlowStore((state) => state.setType);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <BackButton />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-5">
          <Text className="font-parafina text-4xl font-semibold text-neutral-900">
            Create a card
          </Text>
          <Text className="mt-1 text-sm text-neutral-500">Choose virtual or physical Visa.</Text>
        </View>

        <View className="mx-5 mt-6">
          <Pressable
            onPress={() => {
              setType('virtual');
              router.push('/cards/create-card/confirm');
            }}
            className="rounded-2xl border border-neutral-200 bg-white p-4">
            <View className="flex-row items-start">
              <View className="mr-3 mt-0.5 h-10 w-10 items-center justify-center rounded-xl bg-neutral-900">
                <CreditCard size={18} color="#ffffff" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-neutral-900">Virtual Visa</Text>
                <Text className="mt-1 text-sm text-neutral-500">Free. Created instantly.</Text>
              </View>
            </View>
          </Pressable>

          <Pressable
            onPress={() => {
              setType('physical');
              router.push('/cards/create-card/address');
            }}
            className="mt-3 rounded-2xl border border-neutral-200 bg-white p-4">
            <View className="flex-row items-start">
              <View className="mr-3 mt-0.5 h-10 w-10 items-center justify-center rounded-xl bg-neutral-900">
                <CreditCard size={18} color="#ffffff" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-neutral-900">Physical Visa</Text>
                <Text className="mt-1 text-sm text-neutral-500">$15 shipping & printing.</Text>
              </View>
            </View>
          </Pressable>

          <Text className="mt-4 text-xs leading-4 text-neutral-500">
            Fees are charged from your USD balance.
          </Text>
        </View>

        <View className="h-10" />
      </ScrollView>
    </SafeAreaView>
  );
}
