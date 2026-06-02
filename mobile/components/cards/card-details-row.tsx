import * as React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Copy, CheckCircle } from 'lucide-react-native';
import type { CardDetailsField } from './types';

interface CardDetailsRowProps {
  readonly field: CardDetailsField;
  readonly onCopy: () => void;
}

export const CardDetailsRow: React.FC<CardDetailsRowProps> = ({ field, onCopy }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = (): void => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View className="flex-row items-center justify-between py-3">
      <View className="flex-1">
        <Text className="text-sm text-[#6B7280]">{field.label}</Text>
        <Text className="mt-1 text-base font-medium text-[#1D1D1D]">{field.value}</Text>
      </View>
      {field.copyable && (
        <Pressable onPress={handleCopy} className="rounded-full bg-[#D1F4D9] px-4 py-2">
          {copied ? <CheckCircle size={18} color="#166534" /> : <Copy size={18} color="#166534" />}
        </Pressable>
      )}
    </View>
  );
};
