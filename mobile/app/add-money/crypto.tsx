import type React from 'react';
import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useActiveAccount } from 'thirdweb/react';
import { Copy, Warning } from 'phosphor-react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { BackButton } from '@/components/ui/back-button';

const CopyableField: React.FC<{
  label: string;
  value: string;
  mono?: boolean;
}> = ({ label, value, mono = false }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (): Promise<void> => {
    await Clipboard.setStringAsync(value);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View>
      {label ? <Text className="mb-1 text-sm text-neutral-500">{label}</Text> : null}
      <View className="flex-row items-center rounded-xl border border-neutral-200 p-3">
        <Text
          className={`flex-1 text-neutral-900 ${mono ? 'font-mono text-xs' : 'text-base font-semibold'}`}
          selectable
          numberOfLines={1}
          ellipsizeMode="middle">
          {value}
        </Text>
        <TouchableOpacity
          onPress={handleCopy}
          activeOpacity={0.7}
          className="ml-2 rounded-full bg-neutral-100 p-2">
          <Copy size={18} weight="bold" color="#171717" />
        </TouchableOpacity>
      </View>
      {copied && <Text className="mt-1 text-xs text-green-600">Copied!</Text>}
    </View>
  );
};

export default function CryptoDepositScreen(): React.ReactElement {
  const account = useActiveAccount();
  const smartAccountAddress = account?.address;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <BackButton />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-5">
          <Text className="font-parafina text-4xl font-semibold text-neutral-900">
            Crypto deposit
          </Text>
          <Text className="mt-1 text-sm text-neutral-500">
            Send USDC to your Schnl wallet on Polygon network.
          </Text>
        </View>

        {/* Wallet Info */}
        <View className="mx-5 mt-6">
          <Text className="mb-2 text-sm font-medium text-neutral-500">
            Your Schnl deposit address
          </Text>
          {smartAccountAddress ? (
            <CopyableField label="" value={smartAccountAddress} mono />
          ) : (
            <Text className="text-sm text-neutral-500">Wallet not connected.</Text>
          )}
        </View>

        {/* Warning */}
        <View className="mx-5 mt-4 flex-row items-start rounded-xl bg-amber-50 p-3">
          <Warning size={18} weight="fill" color="#D97706" />
          <Text className="ml-2 flex-1 text-xs leading-4 text-amber-800">
            Only <Text className="font-semibold">USDC on Polygon</Text>. Wrong token or network =
            lost funds.
          </Text>
        </View>

        <View className="h-6" />
      </ScrollView>
    </SafeAreaView>
  );
}
