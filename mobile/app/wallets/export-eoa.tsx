import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ConnectButton, useActiveAccount } from 'thirdweb/react';
import { inAppWallet } from 'thirdweb/wallets';
import { preAuthenticate } from 'thirdweb/wallets/in-app';
import { polygon } from 'thirdweb/chains';
import * as WebBrowser from 'expo-web-browser';
import { BackButton } from '@/components/ui/back-button';
import { thirdwebClient } from '@/lib/clients/thirdweb';
import { useAuthStore } from '@/stores/account/use-auth-store';
import { useEoaConnect } from '@/hooks/wallet/use-eoa-connect';

function ExportEoaInner() {
  const account = useActiveAccount();
  const { connect } = useEoaConnect();
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const onSendEmail = async () => {
    const email = useAuthStore.getState().user?.email;
    if (!email) {
      setError('Email not found');
      return;
    }
    setError(null);
    setIsSendingCode(true);
    try {
      await preAuthenticate({
        client: thirdwebClient,
        strategy: 'email',
        email,
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to send code');
    } finally {
      setIsSendingCode(false);
    }
  };

  const onConnectWallet = async () => {
    const email = useAuthStore.getState().user?.email;
    if (!email) {
      setError('Email not found');
      return;
    }
    if (!code) {
      setError('Enter verification code');
      return;
    }
    setError(null);
    setIsConnecting(true);
    try {
      await connect(async () => {
        const wallet = inAppWallet();
        await wallet.connect({
          client: thirdwebClient,
          strategy: 'email',
          email,
          verificationCode: code,
        });
        return wallet;
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Wallet connect failed');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <BackButton />

      <View className="flex-1 px-5 pt-4">
        <Text className="text-2xl font-semibold text-neutral-900">Export Embedded Wallet</Text>
        <Text className="mt-2 text-sm text-neutral-500">
          Export is handled by Thirdweb UI. On React Native, the export option may not appear, so we
          open the web export page.
        </Text>

        <Pressable
          onPress={async () => {
            await WebBrowser.openBrowserAsync('https://schnl.com/wallet-export');
          }}
          className="mt-4 rounded-lg bg-neutral-900 px-4 py-3">
          <Text className="text-center font-semibold text-white">Open export page</Text>
        </Pressable>

        {error && (
          <View className="mt-4 rounded-xl bg-red-50 px-4 py-3">
            <Text className="text-sm text-red-700">{error}</Text>
          </View>
        )}

        {!account ? (
          <View className="mt-6">
            <Text className="mb-2 text-xs text-neutral-500">Email code</Text>
            <View className="mb-3 flex-row items-center justify-between">
              <Pressable
                onPress={onSendEmail}
                disabled={isSendingCode}
                className={`rounded-md ${isSendingCode ? 'bg-neutral-200' : 'bg-neutral-900'} px-3 py-2`}>
                <View className="flex-row items-center justify-center">
                  {isSendingCode && <ActivityIndicator color="#ffffff" className="mr-2" />}
                  <Text className="text-center text-white">
                    {isSendingCode ? 'Sending…' : 'Send code'}
                  </Text>
                </View>
              </Pressable>
            </View>

            <TextInput
              value={code}
              onChangeText={setCode}
              placeholder="Enter code"
              className="w-full rounded-md border border-neutral-200 p-3"
              keyboardType="number-pad"
            />

            <Pressable
              onPress={onConnectWallet}
              disabled={isConnecting}
              className={`mt-4 rounded-lg ${isConnecting ? 'bg-neutral-200' : 'bg-neutral-900'} px-4 py-3`}>
              <View className="flex-row items-center justify-center">
                {isConnecting && <ActivityIndicator color="#ffffff" className="mr-2" />}
                <Text className="text-center text-white">
                  {isConnecting ? 'Connecting…' : 'Continue'}
                </Text>
              </View>
            </Pressable>
          </View>
        ) : (
          <View className="mt-6">
            <Text className="text-sm text-neutral-600">
              If you want to try the native flow anyway, open wallet settings and look for "Manage
              Wallet" → "Export Private Key".
            </Text>

            <View className="mt-4">
              <ConnectButton
                client={thirdwebClient}
                theme="light"
                wallets={[inAppWallet()]}
                chain={polygon}
              />
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

export default function ExportEoaScreen() {
  return <ExportEoaInner />;
}
