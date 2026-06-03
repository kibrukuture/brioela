import type React from 'react';
import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Plus,
  ArrowUp,
  ArrowDown,
  ChevronRight,
  FileText,
  Trash2,
} from 'lucide-react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Sheet, useSheetRef, BottomSheetView, BottomSheetScrollView } from '@/components/ui/sheet';
import { NativeSegmentedTabs } from '@/components/ui/native-segmented-tabs';
import { useVirtualAccounts } from '@/hooks/banking/use-virtual-accounts';
import { useBalances } from '@/hooks/banking/use-balances';
import { usePrivacyStore } from '@/stores/ui/use-privacy-store';
import { getVirtualAccountSummary } from '@/lib/banking/get-virtual-account-summary';
import { CURRENCY_OPTIONS } from '@/lib/banking/currency-options';
import { bankingBalances } from '@/lib/banking/banking-balances';
import * as Burnt from 'burnt';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@/lib/forms/zod-resolver';
import { removeVirtualAccountSchema } from '@brioela/shared/validators/banking.validator';
import { useRemoveVirtualAccount } from '@/hooks/banking/use-remove-virtual-account';

const ActionButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  disabled?: boolean;
  onPress?: () => void;
}> = ({ icon, label, disabled = false, onPress }) => (
  <TouchableOpacity onPress={onPress} disabled={disabled} className="items-center">
    <View
      className={`h-14 w-14 items-center justify-center rounded-full ${disabled ? 'bg-stone-200' : 'bg-lime-200'}`}>
      {icon}
    </View>
    <Text className={`mt-2 text-sm ${disabled ? 'text-stone-400' : 'text-stone-900'}`}>
      {label}
    </Text>
  </TouchableOpacity>
);

export default function AccountScreen(): React.ReactElement {
  const router = useRouter();
  const { currency } = useLocalSearchParams<{ currency: string }>();
  const [activeTab, setActiveTab] = useState<'transactions' | 'options'>('transactions');
  const { isDataVisible } = usePrivacyStore();
  const { data: accounts } = useVirtualAccounts();
  const { data: balancesData } = useBalances();
  const balances = bankingBalances(balancesData, isDataVisible);
  const moreSheetRef = useSheetRef();
  const removeSheetRef = useSheetRef();
  const removeVirtualAccount = useRemoveVirtualAccount();
  const currencyData = getVirtualAccountSummary(currency, accounts);
  const currencyOption = CURRENCY_OPTIONS.find(
    (c) => c.code.toLowerCase() === currency.toLowerCase()
  );

  const normalizedCurrency = (() => {
    const c = currency.toLowerCase();
    if (c === 'usd' || c === 'eur' || c === 'aed') return c;
    return null;
  })();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<{ currency: 'usd' | 'eur' | 'aed'; email: string }>({
    defaultValues: {
      currency: (normalizedCurrency ?? 'usd') as 'usd' | 'eur' | 'aed',
      email: '',
    },
    resolver: zodResolver(removeVirtualAccountSchema),
    mode: 'onChange',
  });

  const onBack = (): void => {
    router.back();
  };

  const onMore = (): void => {
    moreSheetRef.current?.present();
  };

  const onOpenRemoveCurrency = (): void => {
    if (!normalizedCurrency) {
      Burnt.alert({
        title: 'Error',
        message: 'Unsupported currency',
        preset: 'error',
      });
      return;
    }
    moreSheetRef.current?.dismiss();
    removeSheetRef.current?.present();
  };

  const onSubmitRemove = ({ email }: { currency: 'usd' | 'eur' | 'aed'; email: string }) => {
    if (!normalizedCurrency) return;

    removeVirtualAccount.mutate(
      { currency: normalizedCurrency, email },
      {
        onSuccess: () => {
          Burnt.toast({
            title: 'Removed',
            message: `${currency.toUpperCase()} removed`,
            preset: 'done',
            haptic: 'success',
          });
          removeSheetRef.current?.dismiss();
          router.back();
        },
        onError: (error) => {
          Burnt.alert({
            title: 'Error',
            message: error instanceof Error ? error.message : 'Failed to remove currency',
            preset: 'error',
          });
        },
      }
    );
  };

  const onVerifyDetails = (): void => {
    if (!currencyData.verified) {
      router.push('/accounts/create');
      return;
    }
    router.push(`/accounts/details/${currency}`);
  };

  return (
    <SafeAreaView className="flex-1">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <TouchableOpacity
          onPress={onBack}
          className="h-11 w-11 items-center justify-center rounded-full bg-stone-100">
          <ArrowLeft size={22} color="#1c1917" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onMore}
          className="h-11 w-11 items-center justify-center rounded-full bg-stone-100">
          <Text className="text-lg font-semibold text-stone-900">⋯</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Balance Section */}
        <View className="mt-8 items-center">
          <View className="flex-row items-center gap-2">
            <View className="h-6 w-6">
              {currencyOption?.flag ? (
                <Image source={currencyOption.flag} className="h-6 w-6" resizeMode="cover" />
              ) : null}
            </View>
            <Text className="text-base text-stone-600">{currencyData.code}</Text>
          </View>
          <Text className="mt-2 text-4xl font-bold text-stone-900">
            {balances.byCurrencyCode[currencyData.code] ?? '***'}
          </Text>

          {/* Verify Banner */}
          {!currencyData.verified && (
            <TouchableOpacity
              onPress={onVerifyDetails}
              className="mt-4 flex-row items-center rounded-full bg-lime-100 px-4 py-2">
              <MaterialCommunityIcons name="bank-outline" size={18} color="#166534" />
              <Text className="ml-2 font-medium text-green-800">Verify for account details</Text>
              <ChevronRight size={18} color="#166534" className="ml-1" />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={onVerifyDetails}
            className="mt-4 flex-row items-center rounded-full bg-stone-100 px-4 py-2">
            <MaterialCommunityIcons name="bank-outline" size={18} color="#1c1917" />
            <Text className="ml-2 font-medium text-stone-900">Account details</Text>
            <ChevronRight size={18} color="#a8a29e" className="ml-1" />
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View className="mt-8 flex-row justify-center gap-6 px-8">
          <ActionButton icon={<Plus size={24} color="#166534" />} label="Add" />
          <ActionButton icon={<ArrowUp size={24} color="#166534" />} label="Send" />
          <ActionButton icon={<ArrowDown size={24} color="#166534" />} label="Request" />
        </View>

        {/* Tabs */}
        <View className="mx-4 mt-8">
          <NativeSegmentedTabs
            options={[
              { label: 'Transactions', value: 'transactions' },
              { label: 'Options', value: 'options' },
            ]}
            value={activeTab}
            onChange={setActiveTab}
          />
        </View>

        {/* Tab Content */}
        <View className="mt-6 px-4 pb-8">
          {activeTab === 'transactions' ? (
            <View className="items-center py-12">
              <Text className="text-lg font-semibold text-stone-900">Nothing to show here yet</Text>
              <Text className="mt-1 text-stone-500">Your transactions will show here</Text>
            </View>
          ) : (
            <View />
          )}
        </View>
      </ScrollView>

      {/* More Bottom Sheet */}
      <Sheet ref={moreSheetRef} snapPoints={['30%']} enablePanDownToClose>
        <BottomSheetView className="px-5 pb-10">
          <Text className="mb-5 text-center font-parafina text-xl font-semibold text-neutral-900">
            More
          </Text>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => moreSheetRef.current?.dismiss()}
            className="mb-3 flex-row items-center px-4 py-3">
            <FileText size={22} color="#374151" />
            <View className="ml-3 flex-1">
              <Text className="text-base font-medium text-gray-800">Statements and reports</Text>
            </View>
            <ChevronRight size={20} color="#a8a29e" />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onOpenRemoveCurrency}
            className="flex-row items-center px-4 py-3">
            <Trash2 size={22} color="#374151" />
            <View className="ml-3 flex-1">
              <Text className="text-base font-medium text-gray-800">Remove currency</Text>
            </View>
            <ChevronRight size={20} color="#a8a29e" />
          </TouchableOpacity>
        </BottomSheetView>
      </Sheet>

      <Sheet
        ref={removeSheetRef}
        snapPoints={['65%']}
        enablePanDownToClose
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore">
        <BottomSheetScrollView
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          className="px-5"
          contentContainerClassName="pb-10">
          <Text className="mb-2 text-center font-parafina text-xl font-semibold text-neutral-900">
            Remove {currency.toUpperCase()} account?
          </Text>
          <Text className="mb-6 text-center text-sm text-neutral-500">
            You’ll lose these account details. If you remove it, you may need to complete KYC again
            before you can create a new {currency.toUpperCase()} account. Enter your email to
            confirm.
          </Text>

          <View className="mt-2">
            <Text className="mb-2 text-sm font-medium text-neutral-900">Email</Text>
            <Controller
              control={control}
              name="email"
              render={({ field: { value, onChange } }) => (
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  placeholder="you@example.com"
                  className="rounded-xl border border-neutral-200 bg-white px-4 py-4 text-base text-neutral-900"
                  placeholderTextColor="#a3a3a3"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                />
              )}
            />
            {errors.email?.message ? (
              <Text className="mt-2 text-sm text-red-500">{errors.email.message}</Text>
            ) : null}
          </View>

          <View className="mt-8">
            <TouchableOpacity
              onPress={handleSubmit(onSubmitRemove)}
              disabled={removeVirtualAccount.isPending || isSubmitting}
              className="w-full items-center justify-center rounded-full bg-neutral-900 py-4"
              activeOpacity={0.8}>
              {removeVirtualAccount.isPending || isSubmitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-base font-semibold text-white">Confirm remove</Text>
              )}
            </TouchableOpacity>
          </View>
        </BottomSheetScrollView>
      </Sheet>
    </SafeAreaView>
  );
}
