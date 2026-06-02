import { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Camera } from 'lucide-react-native';
import { IbanScanModal } from '@/components/payments/iban-scan-modal';

type Props = {
  label?: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  errorMessage?: string;
};

export function IbanInput({ label = 'IBAN', placeholder, value, onChange, errorMessage }: Props) {
  const [showScanner, setShowScanner] = useState(false);

  return (
    <View>
      <Text className="text-xs font-medium text-neutral-500">{label}</Text>
      <View className="mt-3 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4">
        <View className="relative">
          <TextInput
            value={value}
            onChangeText={onChange}
            autoCapitalize="characters"
            placeholder={placeholder}
            placeholderTextColor="#A3A3A3"
            className="pr-10 text-base text-neutral-900"
          />
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setShowScanner(true)}
            className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full bg-neutral-200 p-2">
            <Camera size={18} color="#171717" />
          </TouchableOpacity>
        </View>
      </View>
      {!!errorMessage && <Text className="mt-2 text-xs text-red-500">{errorMessage}</Text>}

      <IbanScanModal
        visible={showScanner}
        onClose={() => setShowScanner(false)}
        onIbanDetected={(iban) => {
          onChange(iban);
        }}
      />
    </View>
  );
}
