import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useActiveAccount } from 'thirdweb/react';
import * as Clipboard from 'expo-clipboard';
import * as Burnt from 'burnt';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import { BackButton } from '@/components/ui/back-button';
import { Copy, KeyRound, Wallet as WalletIcon } from 'lucide-react-native';
import { useEmbeddedWallet } from '@/hooks/banking/use-embedded-wallet';
import { Sheet, useSheetRef } from '@/components/ui/sheet';

function formatAddress(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function ManageWalletScreen() {
  const account = useActiveAccount();
  const { data, isLoading, error } = useEmbeddedWallet();
  const exportSheetRef = useSheetRef();
  const [copied, setCopied] = useState<string | null>(null);
  const exportSnapPoints = React.useMemo(() => ['40%'], []);

  const smartAccountAddress = account?.address;
  const canExport = Boolean(data?.address) && !isLoading && !error;

  const copyToClipboard = async (label: string, value: string) => {
    await Clipboard.setStringAsync(value);
    setCopied(label);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Burnt.toast({ title: 'Copied', preset: 'done', haptic: 'none' });
    setTimeout(() => setCopied(null), 1500);
  };

  const openExportSheet = () => {
    exportSheetRef.current?.present();
  };

  const closeExportSheet = () => {
    exportSheetRef.current?.dismiss();
  };

  const onOpenManageWallet = async () => {
    closeExportSheet();
    await WebBrowser.openBrowserAsync('https://schnl.com/wallet-export');
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <BackButton />

      <ScrollView contentContainerClassName="px-5 pb-10" showsVerticalScrollIndicator={false}>
        <View className="mt-4">
          <Text className="text-2xl font-semibold text-neutral-900">Manage wallet</Text>
          <Text className="mt-2 text-sm text-neutral-500">
            Your banking wallet address is your Smart Account on Polygon.
          </Text>
        </View>

        <View className="mt-8 rounded-2xl border border-neutral-100 bg-neutral-50 p-5">
          <View className="flex-row items-center">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-white">
              <WalletIcon size={22} color="#171717" />
            </View>
            <View className="ml-4 flex-1">
              <Text className="text-base font-medium text-neutral-900">Smart Account address</Text>
              <Text className="mt-0.5 text-sm text-neutral-500">
                Used for deposits and onchain balance
              </Text>
            </View>
          </View>

          <View className="mt-4 rounded-xl bg-white p-4">
            <Text className="text-xs text-neutral-500">Address</Text>
            <Text className="mt-1 font-mono text-sm text-neutral-900" selectable>
              {smartAccountAddress ?? 'Not connected'}
            </Text>

            {smartAccountAddress && (
              <View className="mt-4 flex-row items-center justify-between">
                <Text className="text-sm text-neutral-500">
                  {formatAddress(smartAccountAddress)}
                </Text>
                <TouchableOpacity
                  onPress={() => copyToClipboard('smart', smartAccountAddress)}
                  activeOpacity={0.7}
                  className="flex-row items-center rounded-full bg-neutral-100 px-4 py-2">
                  <Copy size={18} color="#171717" />
                  <Text className="ml-2 text-sm font-medium text-neutral-900">
                    {copied === 'smart' ? 'Copied' : 'Copy'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        <View className="mt-8 rounded-2xl border border-neutral-100 bg-white p-5">
          <View className="flex-row items-center">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
              <KeyRound size={22} color="#171717" />
            </View>
            <View className="ml-4 flex-1">
              <Text className="text-base font-medium text-neutral-900">Embedded wallet (EOA)</Text>
              <Text className="mt-0.5 text-sm text-neutral-500">
                Owner key behind your Smart Account
              </Text>
            </View>
          </View>

          <View className="mt-4 rounded-xl bg-neutral-50 p-4">
            {isLoading ? (
              <Text className="text-sm text-neutral-700">Loading…</Text>
            ) : error ? (
              <Text className="text-sm text-neutral-700">
                Unable to load embedded wallet address.
              </Text>
            ) : data?.address ? (
              <>
                <Text className="text-xs text-neutral-500">Address</Text>
                <Text className="mt-1 font-mono text-sm text-neutral-900" selectable>
                  {data.address}
                </Text>
                <View className="mt-4 flex-row items-center justify-between">
                  <Text className="text-sm text-neutral-500">{formatAddress(data.address)}</Text>
                  <TouchableOpacity
                    onPress={() => copyToClipboard('eoa', data.address)}
                    activeOpacity={0.7}
                    className="flex-row items-center rounded-full bg-white px-4 py-2">
                    <Copy size={18} color="#171717" />
                    <Text className="ml-2 text-sm font-medium text-neutral-900">
                      {copied === 'eoa' ? 'Copied' : 'Copy'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <Text className="text-sm text-neutral-700">Embedded wallet not found.</Text>
            )}
          </View>

          <TouchableOpacity
            onPress={openExportSheet}
            disabled={!canExport}
            activeOpacity={0.7}
            className={`mt-4 rounded-xl px-5 py-4 ${canExport ? 'bg-neutral-900' : 'bg-neutral-300'}`}>
            <Text className="text-center text-base font-semibold text-white">Manage wallet</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Sheet
        ref={exportSheetRef}
        snapPoints={exportSnapPoints}
        enablePanDownToClose
        onDismiss={closeExportSheet}>
        <View className="px-6 pb-8 pt-2">
          <Text className="text-xl font-semibold text-neutral-900">Manage embedded wallet</Text>
          <Text className="mt-3 text-sm leading-5 text-neutral-600">
            Use the same email you used to sign in to the app. Then open wallet details, choose
            "Manage Wallet" and select "Export Private Key".
          </Text>
          <Text className="mt-3 text-sm leading-5 text-neutral-600">
            Your Smart Account does not have a private key. Export is only for the Embedded wallet.
          </Text>

          <TouchableOpacity
            onPress={onOpenManageWallet}
            activeOpacity={0.7}
            className="mt-6 items-center rounded-xl bg-neutral-900 py-4">
            <Text className="text-base font-semibold text-white">Open manage page</Text>
          </TouchableOpacity>
        </View>
      </Sheet>
    </SafeAreaView>
  );
}
