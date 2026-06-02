import type React from 'react';
import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Share, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { X, Copy, ChevronRight, CheckCircle } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useVirtualAccounts } from '@/hooks/banking/use-virtual-accounts';
import {
  getVirtualAccountDetails,
  formatBankingAccountShareMessage,
} from '@/lib/banking/get-virtual-account-details';
import { CURRENCY_OPTIONS } from '@/lib/banking/currency-options';

type QuickFactTab = 'fees' | 'speed' | 'limits';

const CopyableField: React.FC<{
  label: string;
  value: string;
  subtext?: string;
  link?: string;
}> = ({ label, value, subtext, link }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (): Promise<void> => {
    await Clipboard.setStringAsync(value);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View className="py-3">
      <Text className="text-sm text-stone-500">{label}</Text>
      <View className="mt-1 flex-row items-start justify-between">
        <View className="mr-4 flex-1">
          <Text className="text-base font-semibold text-stone-900">{value}</Text>
          {subtext && (
            <Text className="mt-1 text-sm text-stone-500">
              {subtext}
              {link && <Text className="text-green-700 underline"> {link}</Text>}
            </Text>
          )}
        </View>
        <TouchableOpacity onPress={handleCopy} className="p-2">
          {copied ? <CheckCircle size={20} color="#166534" /> : <Copy size={20} color="#166534" />}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function AccountDetailsScreen(): React.ReactElement {
  const router = useRouter();
  const { currency } = useLocalSearchParams<{ currency: string }>();
  const [activeTab, setActiveTab] = useState<QuickFactTab>('fees');
  const { data: accounts } = useVirtualAccounts();
  const details = getVirtualAccountDetails(currency, accounts);
  const currencyOption = CURRENCY_OPTIONS.find(
    (c) => c.code.toLowerCase() === currency.toLowerCase()
  );

  const onClose = (): void => {
    router.back();
  };

  const onShare = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const message = formatBankingAccountShareMessage(details);
    await Share.share({
      message,
      title: `${details.code} Account Details`,
    });
  };

  return (
    <SafeAreaView className="flex-1">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <TouchableOpacity
          onPress={onClose}
          className="h-11 w-11 items-center justify-center rounded-full bg-stone-100">
          <X size={22} color="#1c1917" />
        </TouchableOpacity>
        <View className="items-center">
          <Text className="text-base font-semibold text-stone-900">{details.code}</Text>
          <Text className="text-sm text-stone-500">Account details</Text>
        </View>
        <View className="h-6 w-6">
          {currencyOption?.flag ? (
            <Image source={currencyOption.flag} className="h-6 w-6" resizeMode="cover" />
          ) : null}
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Receive Section */}
        <View className="mt-4 px-4">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-xl font-bold text-stone-900">Receive {details.code}</Text>
              <Text className="mt-1 text-stone-500">
                From SEPA and <Text className="text-green-700 underline">100+ countries</Text>
              </Text>
            </View>
            <TouchableOpacity className="rounded-full bg-lime-200 px-4 py-2" onPress={onShare}>
              <Text className="font-semibold text-green-900">Share</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Account Details Card */}
        <View className="mx-4 mt-6 rounded-2xl bg-stone-100 p-4">
          <CopyableField label="Name" value={details.holderName} />
          {details.iban ? (
            <CopyableField
              label="IBAN"
              value={details.iban}
              subtext="Can receive EUR and other currencies."
              link="How it works"
            />
          ) : null}
          {details.routingNumber ? (
            <CopyableField label="Routing number" value={details.routingNumber} />
          ) : null}
          {details.accountNumber ? (
            <CopyableField label="Account number" value={details.accountNumber} />
          ) : null}
          {details.swiftBic ? (
            <CopyableField
              label="Swift/BIC"
              value={details.swiftBic}
              subtext="Only used for international Swift transfers"
            />
          ) : null}
          <CopyableField
            label="Bank name and address"
            value={`${details.bankName}, ${details.bankAddress}`}
            subtext="Some senders may need this."
            link="Learn more"
          />
        </View>

        {/* Quick Facts */}
        <View className="mt-8 px-4">
          <Text className="text-xl font-bold text-stone-900">Quick facts</Text>

          {/* Tabs */}
          <View className="mt-4 flex-row gap-2">
            {(['fees', 'speed', 'limits'] as QuickFactTab[]).map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                className={`rounded-full px-5 py-2 ${activeTab === tab ? 'bg-green-900' : 'bg-stone-100'}`}>
                <Text
                  className={`font-medium capitalize ${activeTab === tab ? 'text-white' : 'text-stone-700'}`}>
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Tab Content */}
          <View className="mt-4">
            <Text className="text-stone-500">What does it cost?</Text>
          </View>

          <View className="mt-3 rounded-2xl bg-stone-100 p-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-stone-500">From SEPA (domestic)</Text>
                <Text className="mt-1 text-lg font-bold text-stone-900">No fees</Text>
                <View className="my-4 h-px bg-stone-200" />
                <Text className="text-stone-500">From outside SEPA (Swift)</Text>
                <Text className="mt-1 text-lg font-bold text-stone-900">2.39 EUR Schnl fee</Text>
                <Text className="mt-1 text-sm text-stone-500">Bank fees may also apply</Text>
              </View>
              <ChevronRight size={20} color="#a8a29e" />
            </View>
          </View>
        </View>

        {/* Availability */}
        <View className="mt-8 px-4">
          <Text className="text-xl font-bold text-stone-900">Availability</Text>

          <View className="mt-4 rounded-2xl bg-stone-100 p-4">
            <View className="flex-row items-start">
              <CheckCircle size={24} color="#166534" className="mt-0.5" />
              <View className="ml-3 flex-1">
                <Text className="text-base font-semibold text-stone-900">
                  SEPA Direct Debits available
                </Text>
                <Text className="mt-1 text-stone-500">
                  Make regular payments. Works with Amazon, PayPal, Stripe and more.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Feedback */}
        <View className="mt-4 items-center py-8">
          <Text className="text-stone-500">How can we improve? Details not accepted?</Text>
          <TouchableOpacity>
            <Text className="mt-1 font-medium text-green-700 underline">Give feedback</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
