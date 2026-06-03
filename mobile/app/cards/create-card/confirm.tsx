import * as React from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackButton } from '@/components/ui/back-button';
import { useCreateCardOrder } from '@/network/cards/use-create-card-order';
import * as Burnt from 'burnt';
import { useCreateCardFlowStore } from '@/stores/cards/use-create-card-flow-store';

export default function CreateCardConfirmScreen() {
  const router = useRouter();
  const { mutateAsync, isPending } = useCreateCardOrder();

  const type = useCreateCardFlowStore((state) => state.type);
  const shippingAddress = useCreateCardFlowStore((state) => state.shippingAddress);
  const resetCreateCardFlow = useCreateCardFlowStore((state) => state.resetCreateCardFlow);

  const feeText = type === 'virtual' ? 'Free' : '$15';

  let shippingAddressLine = '';
  if (type === 'physical' && shippingAddress) {
    const parts: string[] = [];
    if (shippingAddress.addressLine1) parts.push(shippingAddress.addressLine1);
    if (shippingAddress.addressLine2) parts.push(shippingAddress.addressLine2);
    if (shippingAddress.city) parts.push(shippingAddress.city);
    if (shippingAddress.state) parts.push(shippingAddress.state);
    if (shippingAddress.postalCode) parts.push(shippingAddress.postalCode);
    if (shippingAddress.country) parts.push(shippingAddress.country);
    shippingAddressLine = parts.join(', ');
  }

  if (!type) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <BackButton />

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="px-5 pt-4">
            <Text className="text-sm text-red-600">Missing card type</Text>
            <Pressable
              onPress={() => router.replace('/cards/create-card')}
              className="mt-4 items-center rounded-full bg-neutral-900 px-5 py-4">
              <Text className="text-base font-semibold text-white">Go back</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (type === 'physical' && !shippingAddress) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <BackButton />

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="px-5 pt-4">
            <Text className="text-sm text-red-600">Missing shipping address</Text>
            <Pressable
              onPress={() => router.replace('/cards/create-card/address')}
              className="mt-4 items-center rounded-full bg-neutral-900 px-5 py-4">
              <Text className="text-base font-semibold text-white">Add address</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const onConfirm = async () => {
    const payloadShippingAddress = type === 'physical' ? (shippingAddress ?? undefined) : undefined;

    try {
      await mutateAsync({
        type,
        currency: 'usd',
        shippingAddress: payloadShippingAddress,
      });

      Burnt.toast({ title: 'Card creation started', preset: 'done' });
      resetCreateCardFlow();
      router.replace('/tabs/cards');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to create order';
      Burnt.alert({ title: 'Oh no!', message, preset: 'error' });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <BackButton />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-5">
          <Text className="font-parafina text-4xl font-semibold text-neutral-900">Confirm</Text>
          <Text className="mt-1 text-sm text-neutral-500">
            {feeText === 'Free' ? "You won't be charged." : `You will be charged ${feeText}.`}
          </Text>
        </View>

        <View className="mx-5 mt-6 rounded-2xl border border-neutral-100 bg-white p-4">
          <Text className="text-sm text-neutral-600">Card type</Text>
          <Text className="mt-1 text-base font-semibold text-neutral-900">
            {type === 'virtual' ? 'Virtual Visa' : 'Physical Visa'}
          </Text>

          {type === 'physical' ? (
            <>
              <Text className="mt-4 text-sm text-neutral-600">Delivery address</Text>
              <Text className="mt-1 text-sm text-neutral-900">{shippingAddressLine}</Text>
            </>
          ) : null}

          <Text className="mt-4 text-sm text-neutral-600">Fee</Text>
          <Text className="mt-1 text-base font-semibold text-neutral-900">{feeText}</Text>

          <Pressable
            disabled={isPending}
            onPress={onConfirm}
            className={`mt-6 items-center rounded-full px-5 py-4 ${
              isPending ? 'bg-neutral-300' : 'bg-neutral-900'
            }`}>
            {isPending ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-base font-semibold text-white">Pay and create</Text>
            )}
          </Pressable>
        </View>

        <View className="h-10" />
      </ScrollView>
    </SafeAreaView>
  );
}
