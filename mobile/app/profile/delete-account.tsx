import React from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackButton } from '@/components/ui/back-button';
import { useUser } from '@/network/users/use-user';
import { useDeleteUser } from '@/network/users/use-delete-user';
import * as Burnt from 'burnt';
import { useAuthStore } from '@/stores/account/use-auth-store';

export default function DeleteAccountScreen(): React.JSX.Element {
  const { data: user } = useUser();
  const deleteUser = useDeleteUser();

  const onConfirmDeleteAccount = () => {
    const id = user?.id;
    if (!id) {
      Burnt.alert({ title: 'Oh no!', message: 'User ID is required', preset: 'error' });
      return;
    }

    deleteUser.mutate(id, {
      onSuccess: () => {
        Burnt.toast({ title: '', message: 'Account deleted', preset: 'done', haptic: 'success' });
        useAuthStore.getState().resetApp();
      },
      onError: (error: unknown) => {
        let message = 'Failed to delete account';
        if (error instanceof Error) {
          message = error.message;
        }
        Burnt.alert({ title: 'Oh no!', message, preset: 'error' });
      },
    });
  };

  const onDeleteAccount = () => {
    Alert.alert('Delete account?', 'This action is immediate and cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete permanently', style: 'destructive', onPress: onConfirmDeleteAccount },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <BackButton />

      <ScrollView contentContainerClassName="px-5 pt-6 pb-10">
        <View className="mb-6">
          <Text className="font-parafina text-4xl font-semibold text-neutral-900">
            Delete account
          </Text>
          <Text className="mt-3 text-base text-neutral-500">
            Deleting your account is permanent. Once deleted, you can't get it back.
          </Text>
        </View>

        <View className="rounded-2xl border border-neutral-100 bg-white px-4 py-4">
          <Text className="text-base font-semibold text-neutral-900">Before you continue</Text>
          <Text className="mt-2 text-sm text-neutral-500">
            You must withdraw or transfer all money first. If you still have a balance, deletion
            will be blocked.
          </Text>
        </View>

        <View className="mt-4 rounded-2xl border border-neutral-100 bg-white px-4 py-4">
          <Text className="text-base font-semibold text-neutral-900">What will happen</Text>
          <Text className="mt-2 text-sm text-neutral-500">
            Your access will be removed immediately. This action cannot be undone. If you create a
            new account later, you’ll need to complete identity verification (KYC) again.
          </Text>
        </View>

        <Pressable
          onPress={onDeleteAccount}
          disabled={deleteUser.isPending}
          className="mt-8 items-center rounded-2xl bg-red-50 py-4">
          {deleteUser.isPending ? (
            <ActivityIndicator color="#ef4444" />
          ) : (
            <Text className="text-base font-medium text-red-500">Delete permanently</Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
