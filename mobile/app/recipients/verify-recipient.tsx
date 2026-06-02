import { useMemo } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { BackButton } from '@/components/ui/back-button';
import { useRecipientDraftStore } from '@/stores/recipients/use-recipient-draft-store';
import { useCreateRecipient } from '@/hooks/recipients/use-create-recipient';
import * as Burnt from 'burnt';

export default function VerifyRecipientScreen() {
  const router = useRouter();
  const draft = useRecipientDraftStore((state) => state.draft);
  const clearDraft = useRecipientDraftStore((state) => state.clearDraft);
  const createRecipient = useCreateRecipient();

  const title = useMemo(() => {
    if (!draft) return 'Verify recipient';
    return 'Verify recipient';
  }, [draft]);

  const onConfirm = async () => {
    if (!draft) return;

    try {
      await createRecipient.mutateAsync(draft);
      clearDraft();
      router.replace('/tabs/recipients');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to add recipient';
      Burnt.alert({ title: 'Oh no!', message, preset: 'error' });
    }
  };

  const onBack = () => {
    router.back();
  };

  const bankDetailsLines = useMemo(() => {
    if (!draft) return [] as { label: string; value: string }[];

    if (draft.bankDetails.type === 'ach') {
      return [
        { label: 'Type', value: 'ACH' },
        { label: 'Bank name', value: draft.bankDetails.bankName },
        { label: 'Account number', value: draft.bankDetails.accountNumber },
        { label: 'Routing number', value: draft.bankDetails.routingNumber },
        { label: 'Account type', value: draft.bankDetails.accountType },
      ];
    }

    if (draft.bankDetails.type === 'iban_sepa') {
      return [
        { label: 'Type', value: 'IBAN (SEPA)' },
        { label: 'Bank name', value: draft.bankDetails.bankName },
        { label: 'IBAN', value: draft.bankDetails.iban },
        { label: 'SWIFT/BIC', value: draft.bankDetails.swift },
      ];
    }

    return [
      { label: 'Type', value: 'IBAN' },
      { label: 'Bank name', value: draft.bankDetails.bankName },
      { label: 'IBAN', value: draft.bankDetails.iban },
      { label: 'SWIFT/BIC', value: draft.bankDetails.swift },
    ];
  }, [draft]);

  if (!draft) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <BackButton onPress={() => router.replace('/tabs/recipients')} />
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center text-base text-neutral-600">Missing recipient details.</Text>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.replace('/recipients/add-recipient')}
            className="mt-5 rounded-xl bg-neutral-900 px-5 py-3">
            <Text className="text-sm font-semibold text-white">Add recipient</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <BackButton onPress={onBack} />

      <View className="flex-1 px-5">
        <View className="mt-2">
          <Text className="font-parafina text-3xl font-bold text-neutral-900">{title}</Text>
          <Text className="mt-1 text-sm text-neutral-500">Check the details before saving.</Text>
        </View>

        <View className="mt-6 rounded-2xl border border-neutral-100 bg-white p-5">
          <View>
            <Text className="text-xs font-medium text-neutral-500">Label</Text>
            <Text className="mt-2 text-base text-neutral-900">{draft.label}</Text>
          </View>

          <View className="mt-5">
            <Text className="text-xs font-medium text-neutral-500">Recipient</Text>
            <Text className="mt-2 text-base text-neutral-900">{draft.recipientFullName}</Text>
          </View>

          <View className="mt-5">
            <Text className="text-xs font-medium text-neutral-500">Currency</Text>
            <Text className="mt-2 text-base text-neutral-900">{draft.currency}</Text>
          </View>

          <View className="mt-5">
            <Text className="text-xs font-medium text-neutral-500">Bank details</Text>
            <View className="mt-3 gap-3">
              {bankDetailsLines.map((line) => (
                <View key={line.label} className="flex-row justify-between gap-4">
                  <Text className="text-sm text-neutral-500">{line.label}</Text>
                  <Text className="flex-1 text-right text-sm text-neutral-900">{line.value}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <TouchableOpacity
          onPress={onConfirm}
          activeOpacity={0.8}
          disabled={createRecipient.isPending}
          className={`mt-6 items-center rounded-xl px-5 py-4 ${
            createRecipient.isPending ? 'bg-neutral-300' : 'bg-neutral-900'
          }`}>
          {createRecipient.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-base font-semibold text-white">Add recipient</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            clearDraft();
            router.replace('/tabs/recipients');
          }}
          activeOpacity={0.8}
          className="mt-3 items-center rounded-xl bg-neutral-100 px-5 py-4">
          <Text className="text-base font-semibold text-neutral-900">Discard</Text>
        </TouchableOpacity>

        <View className="h-10" />
      </View>
    </SafeAreaView>
  );
}
