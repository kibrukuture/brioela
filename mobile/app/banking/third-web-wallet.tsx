import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useActiveAccount, useActiveWallet } from 'thirdweb/react';
import { useAuthStore } from '@/stores/account/use-auth-store';

export default function ThirdwebWalletScreen() {
  const account = useActiveAccount();
  const wallet = useActiveWallet();
  const userEmail = useAuthStore((state) => state.user?.email);

  const [signature, setSignature] = useState<string | null>(null);
  const [message, setMessage] = useState<string>('');
  const [isSigning, setIsSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('=== THIRDWEB WALLET DEBUG ===');
    console.log('User Email:', userEmail);
    console.log('Wallet Connected:', !!wallet);
    console.log('Account Active:', !!account);
    console.log('Wallet Address:', account?.address || 'Not connected');
    console.log('Account Object:', JSON.stringify(account, null, 2));
    console.log('=============================');
  }, [account, wallet, userEmail]);

  const handleSignMessage = async () => {
    if (!account) {
      setError('No active account found');
      console.error('❌ Sign failed: No active account');
      return;
    }

    const testMessage = `Schnl Banking Test: ${Date.now()}`;
    setMessage(testMessage);
    setError(null);
    setIsSigning(true);

    console.log('🔐 Starting signature process...');
    console.log('Message to sign:', testMessage);
    console.log('Signing with address:', account.address);

    try {
      const sig = await account.signMessage({ message: testMessage });

      setSignature(sig);
      console.log('✅ Signature successful!');
      console.log('Signature:', sig);
      console.log('Message:', testMessage);
      console.log('Address:', account.address);
      console.log('Signature length:', sig.length);
    } catch (e: unknown) {
      const errorMsg = e instanceof Error ? e.message : 'Signature failed';
      setError(errorMsg);
      console.error('❌ Signature failed:', errorMsg);
      console.error('Full error:', e);
    } finally {
      setIsSigning(false);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="p-6">
        <Text className="mb-6 text-2xl font-bold text-foreground">Thirdweb Wallet Debug</Text>

        {/* Connection Status */}
        <View className="mb-6 rounded-lg border border-border bg-card p-4">
          <Text className="mb-3 text-lg font-semibold text-foreground">Connection Status</Text>

          <View className="space-y-2">
            <View className="flex-row items-center justify-between py-2">
              <Text className="text-muted-foreground">User Email:</Text>
              <Text className="font-medium text-foreground">{userEmail || 'Not found'}</Text>
            </View>

            <View className="flex-row items-center justify-between py-2">
              <Text className="text-muted-foreground">Wallet:</Text>
              <View
                className={`rounded-full px-3 py-1 ${wallet ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                <Text
                  className={`text-sm font-medium ${wallet ? 'text-green-500' : 'text-red-500'}`}>
                  {wallet ? 'Connected' : 'Disconnected'}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center justify-between py-2">
              <Text className="text-muted-foreground">Account:</Text>
              <View
                className={`rounded-full px-3 py-1 ${account ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                <Text
                  className={`text-sm font-medium ${account ? 'text-green-500' : 'text-red-500'}`}>
                  {account ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Wallet Address */}
        {account && (
          <View className="mb-6 rounded-lg border border-border bg-card p-4">
            <Text className="mb-3 text-lg font-semibold text-foreground">Wallet Address</Text>
            <View className="rounded-md bg-muted p-3">
              <Text className="mb-1 text-xs text-muted-foreground">Full Address:</Text>
              <Text className="font-mono text-sm text-foreground" selectable>
                {account.address}
              </Text>
            </View>
            <View className="mt-3 rounded-md bg-muted p-3">
              <Text className="mb-1 text-xs text-muted-foreground">Short Address:</Text>
              <Text className="font-mono text-lg text-foreground">
                {formatAddress(account.address)}
              </Text>
            </View>
          </View>
        )}

        {/* Sign Message */}
        <View className="mb-6 rounded-lg border border-border bg-card p-4">
          <Text className="mb-3 text-lg font-semibold text-foreground">Sign Message Test</Text>

          <Pressable
            onPress={handleSignMessage}
            disabled={!account || isSigning}
            className={`rounded-lg py-4 ${!account || isSigning ? 'bg-muted' : 'bg-primary'}`}>
            <Text
              className={`text-center font-semibold ${
                !account || isSigning ? 'text-muted-foreground' : 'text-primary-foreground'
              }`}>
              {isSigning ? 'Signing...' : 'Sign Test Message'}
            </Text>
          </Pressable>

          {isSigning && (
            <View className="mt-4 items-center">
              <ActivityIndicator size="large" />
            </View>
          )}

          {error && (
            <View className="mt-4 rounded-md border border-red-500/20 bg-red-500/10 p-3">
              <Text className="text-sm text-red-500">{error}</Text>
            </View>
          )}
        </View>

        {/* Signed Message Display */}
        {message && (
          <View className="mb-6 rounded-lg border border-border bg-card p-4">
            <Text className="mb-3 text-lg font-semibold text-foreground">Message Signed</Text>
            <View className="rounded-md bg-muted p-3">
              <Text className="text-sm text-muted-foreground" selectable>
                {message}
              </Text>
            </View>
          </View>
        )}

        {/* Signature Display */}
        {signature && (
          <View className="mb-6 rounded-lg border border-border bg-card p-4">
            <Text className="mb-3 text-lg font-semibold text-foreground">Signature (Hex)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator>
              <View className="rounded-md bg-muted p-3">
                <Text className="font-mono text-xs text-foreground" selectable>
                  {signature}
                </Text>
              </View>
            </ScrollView>
            <View className="mt-3 rounded-md border border-green-500/20 bg-green-500/10 p-3">
              <Text className="text-sm text-green-500">
                ✅ Signature length: {signature.length} characters
              </Text>
            </View>
          </View>
        )}

        {/* Backend Verification Info */}
        {signature && message && account && (
          <View className="mb-6 rounded-lg border border-border bg-card p-4">
            <Text className="mb-3 text-lg font-semibold text-foreground">
              Backend Verification Data
            </Text>
            <View className="space-y-2 rounded-md bg-muted p-3">
              <Text className="text-xs text-muted-foreground">Send this to your backend:</Text>
              <Text className="font-mono text-xs text-foreground" selectable>
                {JSON.stringify(
                  {
                    signature,
                    message,
                    walletAddress: account.address,
                  },
                  null,
                  2
                )}
              </Text>
            </View>
          </View>
        )}

        {/* Instructions */}
        <View className="mb-6 rounded-lg border border-blue-500/20 bg-blue-500/10 p-4">
          <Text className="mb-2 font-semibold text-blue-500">📝 Debug Instructions</Text>
          <Text className="text-sm leading-6 text-blue-500">
            1. Check console logs for detailed output{'\n'}
            2. Compare wallet address with backend{'\n'}
            3. Sign a test message{'\n'}
            4. Copy signature data for backend verification
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
