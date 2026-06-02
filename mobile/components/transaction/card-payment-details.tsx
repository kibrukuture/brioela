'use client';

import type React from 'react';
import { View, Text, TouchableOpacity, Switch } from 'react-native';
import type { AuthorisedVia, CardDetails } from './types';
import { ContactlessPayment } from 'phosphor-react-native';
import { CreditCard } from 'lucide-react-native';

interface CardPaymentDetailsProps {
  when: string;
  where: string;
  whichCard: CardDetails;
  authorisedVia: AuthorisedVia;
  note?: string;
  isRecurringPayment: boolean;
  onAddNote?: () => void;
  onToggleRecurring?: (value: boolean) => void;
}

export const CardPaymentDetails: React.FC<CardPaymentDetailsProps> = ({
  when,
  where,
  whichCard,
  authorisedVia,
  note,
  isRecurringPayment,
  onAddNote,
  onToggleRecurring,
}) => {
  const renderAuthorisedViaIcon = () => {
    switch (authorisedVia) {
      case 'Contactless':
        return <ContactlessPayment size={18} color="#000" />;
      case 'Saved details':
      case 'Manual entry':
      case 'Chip and PIN':
        return <CreditCard size={18} color="#000" />;
      default:
        return null;
    }
  };

  return (
    <View className="px-4 py-4">
      <Text className="mb-4 text-xl font-bold text-black">Transaction details</Text>

      {/* When */}
      <View className="mb-4 flex-row items-center justify-between">
        <Text className="text-base text-gray-600">When</Text>
        <Text className="text-base text-black">{when}</Text>
      </View>

      {/* Where */}
      <View className="mb-4 flex-row items-center justify-between">
        <Text className="text-base text-gray-600">Where</Text>
        <Text className="text-base text-black">{where}</Text>
      </View>

      {/* Which card */}
      <View className="mb-4 flex-row items-center justify-between">
        <Text className="text-base text-gray-600">Which card</Text>
        <View className="flex-row items-center">
          <Text className="mr-2 text-base text-black">{whichCard.lastFourDigits}</Text>
          <View
            className="h-4 w-6 rounded-sm"
            style={{ backgroundColor: whichCard.color || '#9FE870' }}
          />
        </View>
      </View>

      {/* Authorised via */}
      <View className="mb-4 flex-row items-center justify-between">
        <Text className="text-base text-gray-600">Authorised via</Text>
        <View className="flex-row items-center">
          <Text className="mr-2 text-base text-black">{authorisedVia}</Text>
          {renderAuthorisedViaIcon()}
        </View>
      </View>

      {/* Note */}
      <View className="mb-4 flex-row items-center justify-between">
        <Text className="text-base text-gray-600">Note</Text>
        <TouchableOpacity onPress={onAddNote}>
          <Text className="text-base text-black underline">{note || 'Add'}</Text>
        </TouchableOpacity>
      </View>

      {/* Recurring payment */}
      <View className="flex-row items-center justify-between">
        <Text className="text-base text-gray-600">Recurring payment</Text>
        <Switch
          value={isRecurringPayment}
          onValueChange={onToggleRecurring}
          trackColor={{ false: '#E5E5E5', true: '#1B4332' }}
          thumbColor="#fff"
        />
      </View>
    </View>
  );
};
