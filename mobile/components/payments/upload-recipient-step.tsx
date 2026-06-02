'use client';

import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { UploadSimple, Info } from 'phosphor-react-native';
import * as DocumentPicker from 'expo-document-picker';
import type { PaymentFlow } from '@/components/payments/payment';
import { BackButton } from '@/components/ui/back-button';

interface UploadRecipientStepProps {
  paymentFlow: PaymentFlow;
  setPaymentFlow: (flow: PaymentFlow) => void;
}

export function UploadRecipientStep({ paymentFlow, setPaymentFlow }: UploadRecipientStepProps) {
  const [uploading, setUploading] = useState(false);

  const handleBack = () => {
    setPaymentFlow({ ...paymentFlow, step: 'find_recipient' });
  };

  const handleUpload = async () => {
    try {
      setUploading(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        // TODO: Backend - Upload file and extract recipient details using AI
        // POST /api/payments/upload-recipient
        // FormData: file
        // Response: { fullName, iban, swift, accountNumber, etc. }

        // For now, navigate to account details
        setPaymentFlow({ ...paymentFlow, step: 'account_details' });
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <View className="flex-1">
      <BackButton onPress={handleBack} />

      <ScrollView className="flex-1" contentContainerClassName="px-5 pb-10">
        <View className="mt-4">
          <Text className="mb-2 font-parafina text-4xl font-semibold text-neutral-900">
            Upload details
          </Text>
          <Text className="text-sm text-neutral-500">
            Upload a screenshot or PDF and we'll extract the recipient details.
          </Text>
        </View>

        <View className="mt-6 rounded-2xl border border-neutral-100 bg-white p-5">
          <TouchableOpacity
            onPress={handleUpload}
            activeOpacity={0.8}
            disabled={uploading}
            className={`min-h-[180px] items-center justify-center rounded-2xl border-2 border-dashed ${
              uploading ? 'border-neutral-200 bg-neutral-100' : 'border-neutral-200 bg-neutral-50'
            }`}>
            <UploadSimple size={44} weight="bold" color="#737373" />
            <Text className="mt-4 text-base font-semibold text-neutral-900">
              {uploading ? 'Uploading…' : 'Choose file'}
            </Text>
            <Text className="mt-2 text-sm text-neutral-500">Image or PDF</Text>
          </TouchableOpacity>

          <View className="mt-5 flex-row gap-3 rounded-2xl bg-neutral-50 p-4">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-neutral-900">
              <Info size={18} weight="bold" color="#fff" />
            </View>
            <Text className="flex-1 text-sm leading-relaxed text-neutral-700">
              Please review the extracted details before sending.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
