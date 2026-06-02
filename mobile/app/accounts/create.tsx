import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useCreateVirtualAccount } from '@/hooks/banking/use-create-virtual-account';
import { CURRENCY_OPTIONS } from '@/lib/banking/currency-options';
import { createVirtualAccountSchema } from '@schnl/shared/validators/banking.validator';

type CurrencyOption = (typeof CURRENCY_OPTIONS)[number];

export default function CreateAccountScreen() {
  const router = useRouter();
  const { mutateAsync, isPending, variables } = useCreateVirtualAccount();

  const onCreateVirtualAccount = async (currency: CurrencyOption) => {
    if (isPending) return;
    const validation = createVirtualAccountSchema.safeParse({
      currency: currency.code.toLowerCase(),
    });
    if (!validation.success) {
      Alert.alert('Error', validation.error.issues[0]?.message ?? 'Invalid currency');
      return;
    }

    try {
      await mutateAsync(validation.data);

      router.replace(`/accounts/${currency.code}`);
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : 'Failed to create account. Please try again.';
      Alert.alert('Error', message);
    }
  };

  const onBack = (): void => {
    router.back();
  };

  return (
    <SafeAreaView className="flex-1">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3">
        <TouchableOpacity
          onPress={onBack}
          className="h-11 w-11 items-center justify-center rounded-full bg-stone-100">
          <ArrowLeft size={22} color="#1c1917" />
        </TouchableOpacity>
      </View>

      {/* Title */}
      <View className="mt-2 px-4">
        <Text className="font-parafina text-4xl font-semibold text-stone-900">Add a currency</Text>
      </View>

      {/* Section Header */}
      <View className="mt-6 border-b border-stone-200 px-4 pb-2">
        <Text className="text-sm text-stone-500">Available currencies</Text>
      </View>

      {/* Currency List */}
      <FlatList
        data={CURRENCY_OPTIONS}
        keyExtractor={(item) => item.code}
        renderItem={({ item }) => {
          const isLoading = isPending && variables?.currency === item.code.toLowerCase();
          return (
            <TouchableOpacity
              onPress={() => onCreateVirtualAccount(item)}
              activeOpacity={0.7}
              disabled={isPending}
              className="flex-row items-center border-b border-stone-100 py-4">
              <View className="mr-4 h-12 w-12 items-center justify-center rounded-full ">
                <Image source={item.flag} className="h-6 w-6" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-stone-900">{item.name}</Text>
                <Text className="mt-0.5 text-sm text-stone-500">{item.details}</Text>
              </View>
              {isLoading && <ActivityIndicator />}
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
