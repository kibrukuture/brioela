'use client';

import { View, Text, TextInput, TouchableOpacity, Modal } from 'react-native';
import { X, Search } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import {
  CURRENCIES,
  getRecentCurrencies,
  searchCurrencies,
} from '@/components/payments/currencies';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@/lib/forms/zod-resolver';
import { currencySearchSchema } from '@/ui-schema';

interface CurrencySelectorProps {
  selectedCurrency: Currency;
  onSelect: (currency: Currency) => void;
  onClose: () => void;
}

type Currency = (typeof CURRENCIES)[number];

type CurrencySearchFormValues = {
  query: string;
};

export function CurrencySelector({ selectedCurrency, onSelect, onClose }: CurrencySelectorProps) {
  const { control, watch } = useForm<CurrencySearchFormValues>({
    defaultValues: { query: '' },
    mode: 'onChange',
    resolver: zodResolver(currencySearchSchema),
  });

  const searchQuery = watch('query');
  const recentCurrencies = getRecentCurrencies();
  const filteredCurrencies = searchQuery ? searchCurrencies(searchQuery) : CURRENCIES;

  return (
    <Modal visible animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView className="flex-1 bg-white">
        {/* Header */}
        <View className="flex-row items-center justify-between border-b border-gray-200 px-6 py-4">
          <Text className="text-2xl font-bold">Select their currency</Text>
          <TouchableOpacity onPress={onClose} className="h-10 w-10 items-center justify-center">
            <X size={24} color="#000" />
          </TouchableOpacity>
        </View>

        <KeyboardAwareScrollView className="flex-1">
          {/* Search */}
          <View className="border-b border-gray-200 px-6 py-4">
            <View className="relative">
              <Search
                size={20}
                color="#999"
                className="absolute left-3 top-3.5"
                style={{ position: 'absolute', left: 12, top: 14 }}
              />
              <Controller
                control={control}
                name="query"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    placeholder="Search currency"
                    className="h-12 rounded-lg border border-gray-300 bg-gray-50 pl-10 text-base"
                  />
                )}
              />
            </View>
          </View>

          {/* Currency List */}
          {!searchQuery && recentCurrencies.length > 0 && (
            <View className="border-b border-gray-200">
              <View className="px-6 py-3">
                <Text className="text-sm font-medium text-gray-500">Recent currencies</Text>
              </View>
              {recentCurrencies.map((currency) => (
                <TouchableOpacity
                  key={currency.code}
                  onPress={() => onSelect(currency)}
                  className="flex-row items-center gap-4 px-6 py-4">
                  <View className="flex-1">
                    <Text className="font-semibold">{currency.code}</Text>
                    <Text className="text-sm text-gray-500">{currency.name}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View>
            {!searchQuery && (
              <View className="px-6 py-3">
                <Text className="text-sm font-medium text-gray-500">All currencies</Text>
              </View>
            )}
            {filteredCurrencies.map((currency) => (
              <TouchableOpacity
                key={currency.code}
                onPress={() => onSelect(currency)}
                className="flex-row items-center gap-4 px-6 py-4">
                <View className="flex-1">
                  <Text className="font-semibold">{currency.code}</Text>
                  <Text className="text-sm text-gray-500">{currency.name}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </KeyboardAwareScrollView>
      </SafeAreaView>
    </Modal>
  );
}
