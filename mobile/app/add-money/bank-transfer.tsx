import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Copy, CheckCircle } from 'phosphor-react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { BackButton } from '@/components/ui/back-button';
import { NativeSegmentedTabs } from '@/components/ui/native-segmented-tabs';
import { useVirtualAccounts } from '@/network/banking/use-virtual-accounts';
import { getTransferDetails } from '@/lib/banking/get-transfer-details';

function CopyableField(params: { label: string; value: string; subtext?: string }) {
  const { label, value, subtext } = params;
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    await Clipboard.setStringAsync(value);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View className="py-3">
      <Text className="text-sm text-neutral-500">{label}</Text>
      <View className="mt-1 flex-row items-start justify-between">
        <View className="mr-4 flex-1">
          <Text className="text-base font-semibold text-neutral-900">{value}</Text>
          {subtext && <Text className="mt-1 text-sm text-neutral-500">{subtext}</Text>}
        </View>
        <TouchableOpacity onPress={onCopy} className="p-2">
          {copied ? (
            <CheckCircle size={20} weight="fill" color="#166534" />
          ) : (
            <Copy size={20} weight="bold" color="#166534" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function BankTransferScreen() {
  const { data: accounts } = useVirtualAccounts();
  const [selectedCurrency, setSelectedCurrency] = useState<string>('EUR');

  const transferInfo = getTransferDetails(selectedCurrency, accounts);

  const details = transferInfo.details;

  const onShare = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    let message = `My ${details.code} account details:\n\nName: ${details.holderName}\n`;

    if (details.iban) {
      message += `IBAN: ${details.iban}\n`;
    }
    if (details.routingNumber) {
      message += `Routing Number: ${details.routingNumber}\n`;
    }
    if (details.accountNumber) {
      message += `Account Number: ${details.accountNumber}\n`;
    }
    message += `Swift/BIC: ${details.swiftBic}\nBank: ${details.bankName}, ${details.bankAddress}`;

    await Share.share({
      message,
      title: `${details.code} Account Details`,
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <BackButton />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-5">
          <Text className="font-parafina text-4xl font-semibold text-neutral-900">
            Bank transfer
          </Text>
          <Text className="mt-1 text-sm text-neutral-500">
            Share your account details to receive money.
          </Text>
        </View>

        {/* Currency Tabs */}
        <View className="mt-6 px-5">
          <Text className="mb-3 text-xs font-medium text-neutral-500">Currency</Text>
          <NativeSegmentedTabs
            options={transferInfo.currencyOptions}
            value={transferInfo.selectedCurrency}
            onChange={setSelectedCurrency}
          />
        </View>

        {/* Info Section */}
        <View className="mt-6 px-5">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-lg font-semibold text-neutral-900">Receive {details.code}</Text>
              <Text className="mt-0.5 text-sm text-neutral-500">
                Share these details with the sender
              </Text>
            </View>
            <TouchableOpacity
              className="rounded-full bg-lime-200 px-4 py-2"
              onPress={onShare}
              activeOpacity={0.8}>
              <Text className="text-sm font-semibold text-green-900">Share</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Account Details Card */}
        <View className="mx-5 mt-5 rounded-2xl border border-neutral-100 bg-white p-4">
          <CopyableField label="Account holder name" value={details.holderName} />

          {details.iban && (
            <CopyableField
              label="IBAN"
              value={details.iban}
              subtext={
                selectedCurrency === 'EUR'
                  ? 'Can receive EUR and other currencies via SEPA'
                  : undefined
              }
            />
          )}

          {details.routingNumber && (
            <CopyableField
              label="Routing number (ABA)"
              value={details.routingNumber}
              subtext="For domestic US transfers"
            />
          )}

          {details.accountNumber && (
            <CopyableField label="Account number" value={details.accountNumber} />
          )}

          <CopyableField
            label="Swift/BIC"
            value={details.swiftBic}
            subtext="For international transfers"
          />

          <CopyableField
            label="Bank name and address"
            value={`${details.bankName}, ${details.bankAddress}`}
            subtext="Some senders may need this"
          />
        </View>

        {/* Note */}
        <View className="mx-5 mt-5 rounded-xl bg-lime-50 p-4">
          <Text className="text-sm leading-5 text-neutral-700">
            {selectedCurrency === 'EUR' &&
              'SEPA transfers are usually instant. International Swift transfers can take 1-2 working days.'}
            {selectedCurrency === 'USD' &&
              'Domestic ACH transfers take 1-3 business days. Wire transfers are usually same-day.'}
            {selectedCurrency === 'AED' &&
              'Local UAE transfers are usually same-day. International transfers can take 2-3 working days.'}
          </Text>
        </View>

        <View className="h-10" />
      </ScrollView>
    </SafeAreaView>
  );
}
