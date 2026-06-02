import React from 'react';
import { ActivityIndicator, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackButton } from '@/components/ui/back-button';
import { useUser } from '@/hooks/users/use-user';
import { useCustomerAddress } from '@/hooks/banking/use-customer-address';
import { Empty } from 'phosphor-react-native';

export default function PersonalDetailsScreen(): React.JSX.Element {
  const { data: user, isLoading: isLoadingUser } = useUser();
  const { data: addressData, isLoading: isLoadingAddress } = useCustomerAddress();

  let content: React.JSX.Element;

  if (isLoadingUser || isLoadingAddress) {
    content = (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#171717" />
      </View>
    );
  } else {
    let legalFirstName = '';
    if (user?.firstName) {
      legalFirstName = user.firstName;
    }

    let legalLastName = '';
    if (user?.lastName) {
      legalLastName = user.lastName;
    }

    const hasLegalName = Boolean(legalFirstName) || Boolean(legalLastName);

    let addressLine = '';
    const address = addressData?.address;
    if (address) {
      const parts: string[] = [];
      if (address.streetLine1) {
        parts.push(address.streetLine1);
      }
      if (address.city) {
        parts.push(address.city);
      }
      if (address.state) {
        parts.push(address.state);
      }
      if (address.postalCode) {
        parts.push(address.postalCode);
      }
      if (address.country) {
        parts.push(address.country);
      }
      addressLine = parts.join(', ');
    }

    const hasAddress = Boolean(addressLine);

    if (!hasLegalName && !hasAddress) {
      content = (
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-full max-w-[360px] items-center rounded-2xl px-6 py-6">
            <View className="mb-3 h-12 w-12 items-center justify-center rounded-full">
              <Empty size={22} color="#171717" />
            </View>
            <Text className="text-center font-parafina text-2xl font-semibold text-neutral-900">
              Personal details will appear here
            </Text>
            <Text className="mt-2 text-center text-sm text-neutral-600">
              When you complete KYC, your legal name and address will be populated here.
            </Text>
          </View>
        </View>
      );
    } else {
      if (!hasAddress) {
        addressLine = 'Address is missing';
      }

      let addressValue: React.JSX.Element;
      if (!hasAddress) {
        addressValue = (
          <View className="mt-2 flex-row items-center gap-2">
            <Empty size={16} color="#737373" />
            <Text className="text-sm text-neutral-700">{addressLine}</Text>
          </View>
        );
      } else {
        addressValue = <Text className="mt-2 text-sm text-neutral-900">{addressLine}</Text>;
      }

      content = (
        <ScrollView contentContainerClassName="px-5 pt-6 pb-10">
          <View className="mb-6">
            <Text className="font-parafina text-4xl font-semibold text-neutral-900">
              Personal details
            </Text>
            <Text className="mt-3 text-base text-neutral-500">
              Your legal details on file for banking. To change them, contact support.
            </Text>
          </View>

          <View className="rounded-2xl px-4 py-4">
            <Text className="text-sm font-medium text-neutral-900">Legal first name</Text>
            <TextInput
              value={legalFirstName}
              editable={false}
              className="mt-2 rounded-xl border border-neutral-200 bg-neutral-100 px-4 py-4 text-base text-neutral-500"
              placeholderTextColor="#a3a3a3"
            />
          </View>

          <View className="mt-4 rounded-2xl px-4 py-4">
            <Text className="text-sm font-medium text-neutral-900">Legal last name</Text>
            <TextInput
              value={legalLastName}
              editable={false}
              className="mt-2 rounded-xl border border-neutral-200 bg-neutral-100 px-4 py-4 text-base text-neutral-500"
              placeholderTextColor="#a3a3a3"
            />
          </View>

          <View className="mt-4 rounded-2xl px-4 py-4">
            <Text className="text-sm font-medium text-neutral-900">Address</Text>
            {addressValue}
          </View>
        </ScrollView>
      );
    }
  }

  return (
    <SafeAreaView className="flex-1">
      <BackButton />
      {content}
    </SafeAreaView>
  );
}
