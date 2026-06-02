import type React from 'react';
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinkSimple, Copy, ShareNetwork } from 'phosphor-react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { BackButton } from '@/components/ui/back-button';
import { SUPPORTED_CURRENCIES, type SupportedCurrency } from '@schnl/shared/constants';
import { NativeSegmentedTabs } from '@/components/ui/native-segmented-tabs';

export default function CreateRequestLinkScreen(): React.ReactElement {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [currency, setCurrency] = useState<SupportedCurrency>(SUPPORTED_CURRENCIES[1]); // EUR default
  const [linkGenerated, setLinkGenerated] = useState(false);
  const [copied, setCopied] = useState(false);

  // TODO: Replace with actual user handle from auth
  const userHandle = 'kibru';
  const requestLink = `schnl.com/pay/me/${userHandle}${amount ? `?amount=${amount}&currency=${currency.code}` : ''}`;

  const handleGenerateLink = (): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLinkGenerated(true);
  };

  const handleCopyLink = async (): Promise<void> => {
    await Clipboard.setStringAsync(requestLink);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareLink = async (): Promise<void> => {
    try {
      await Share.share({
        message: note ? `${note}\n\nPay me here: ${requestLink}` : `Pay me here: ${requestLink}`,
      });
    } catch {
      // User cancelled
    }
  };

  const isValidAmount = !amount || !isNaN(parseFloat(amount));

  return (
    <SafeAreaView className="flex-1 bg-white">
      <BackButton />

      <View className="flex-1 px-5">
        <Text className="font-parafina text-4xl font-semibold text-neutral-900">
          Create request link
        </Text>
        <Text className="mt-1 text-sm text-neutral-500">
          Generate a link to share and get paid instantly.
        </Text>

        {!linkGenerated ? (
          <>
            {/* Currency Selector */}
            <View className="mt-8">
              <Text className="mb-2 text-sm font-medium text-neutral-500">Currency</Text>
              <NativeSegmentedTabs
                options={SUPPORTED_CURRENCIES.map((c) => ({ label: c.code, value: c.code }))}
                value={currency.code}
                onChange={(nextCode) => {
                  const next = SUPPORTED_CURRENCIES.find((c) => c.code === nextCode);
                  if (next) setCurrency(next);
                }}
              />
            </View>

            {/* Amount Input */}
            <View className="mt-4">
              <Text className="mb-2 text-sm font-medium text-neutral-500">Amount (optional)</Text>
              <View className="flex-row items-center rounded-xl border border-neutral-200 px-4 py-3">
                <Text className="text-lg text-neutral-400">{currency.symbol}</Text>
                <TextInput
                  className="ml-2 flex-1 text-lg text-neutral-900"
                  placeholder="0.00"
                  placeholderTextColor="#a3a3a3"
                  keyboardType="decimal-pad"
                  value={amount}
                  onChangeText={setAmount}
                />
              </View>
              {!isValidAmount && (
                <Text className="mt-1 text-xs text-red-500">Enter a valid amount</Text>
              )}
            </View>

            {/* Note Input */}
            <View className="mt-4">
              <Text className="mb-2 text-sm font-medium text-neutral-500">Note (optional)</Text>
              <TextInput
                className="rounded-xl border border-neutral-200 px-4 py-3 text-base text-neutral-900"
                placeholder="What's this for?"
                placeholderTextColor="#a3a3a3"
                value={note}
                onChangeText={setNote}
                multiline
                numberOfLines={2}
              />
            </View>

            {/* Generate Button */}
            <TouchableOpacity
              onPress={handleGenerateLink}
              disabled={!isValidAmount}
              activeOpacity={0.8}
              className={`mt-8 flex-row items-center justify-center rounded-xl py-4 ${
                isValidAmount ? 'bg-neutral-900' : 'bg-neutral-200'
              }`}>
              <LinkSimple size={20} weight="bold" color={isValidAmount ? '#fff' : '#a3a3a3'} />
              <Text
                className={`ml-2 text-base font-semibold ${
                  isValidAmount ? 'text-white' : 'text-neutral-400'
                }`}>
                Generate link
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* Link Display */}
            <View className="mt-8 rounded-2xl bg-neutral-50 p-5">
              <Text className="mb-2 text-sm font-medium text-neutral-500">Your request link</Text>
              <Text className="font-mono text-base text-neutral-900" selectable>
                {requestLink}
              </Text>
              {amount && (
                <Text className="mt-2 text-sm text-neutral-500">
                  Amount: {currency.symbol}
                  {amount} {currency.code}
                </Text>
              )}
              {note && <Text className="mt-1 text-sm text-neutral-500">Note: {note}</Text>}
            </View>

            {/* Action Buttons */}
            <View className="mt-6 flex-row gap-3">
              <TouchableOpacity
                onPress={handleCopyLink}
                activeOpacity={0.8}
                className="flex-1 flex-row items-center justify-center rounded-xl bg-neutral-100 py-4">
                <Copy size={20} weight="bold" color="#171717" />
                <Text className="ml-2 text-base font-semibold text-neutral-900">
                  {copied ? 'Copied!' : 'Copy'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleShareLink}
                activeOpacity={0.8}
                className="flex-1 flex-row items-center justify-center rounded-xl bg-neutral-900 py-4">
                <ShareNetwork size={20} weight="bold" color="#fff" />
                <Text className="ml-2 text-base font-semibold text-white">Share</Text>
              </TouchableOpacity>
            </View>

            {/* Create Another */}
            <TouchableOpacity
              onPress={() => {
                setLinkGenerated(false);
                setAmount('');
                setNote('');
              }}
              activeOpacity={0.7}
              className="mt-4 items-center py-3">
              <Text className="text-sm font-medium text-neutral-500">Create another link</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}
