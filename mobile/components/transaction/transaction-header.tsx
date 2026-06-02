import type React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';

import type { TransactionType } from './types';

import { MoreHorizontalIcon, ArrowUp, ArrowDown, HelpCircle } from 'lucide-react-native';
import { ArrowArcLeft, Plus } from 'phosphor-react-native';

interface TransactionHeaderProps {
  type: TransactionType;
  amount: string;
  currency: string;
  recipientOrSenderName?: string;
  merchantName?: string;
  merchantLogo?: string;
  statusLabel?: string;
  category?: string;
  categoryIcon?: React.ReactNode;
  onBack: () => void;
  onHelp?: () => void;
  onMore?: () => void;
}

export const TransactionHeader: React.FC<TransactionHeaderProps> = ({
  type,
  amount,
  currency,
  recipientOrSenderName,
  merchantName,
  merchantLogo,
  statusLabel,
  category,
  categoryIcon,
  onBack,
  onHelp,
  onMore,
}) => {
  const isPositiveAmount = type === 'money_added' || type === 'money_received';
  const isCardPayment = type === 'card_payment';
  const isCardChecked = type === 'card_checked';

  const getStatusLabel = (): string => {
    if (statusLabel) return statusLabel;
    switch (type) {
      case 'money_added':
        return 'Added';
      case 'money_sent':
        return 'Sent';
      case 'money_received':
        return 'Received';
      case 'card_checked':
        return 'Card checked';
      default:
        return '';
    }
  };

  const renderIcon = () => {
    if (merchantLogo) {
      return (
        <Image
          source={{ uri: merchantLogo }}
          className="h-16 w-16 rounded-full"
          resizeMode="contain"
        />
      );
    }

    if (isCardChecked) {
      return (
        <View className="h-20 w-20 items-center justify-center rounded-full border-2 border-gray-200">
          <View className="items-center">
            <View className="mb-1 h-5 w-8 rounded-sm border border-gray-400" />
            <View className="flex-row">
              <View className="mr-0.5 h-0.5 w-2 bg-gray-400" />
              <View className="h-0.5 w-4 bg-gray-400" />
            </View>
          </View>
        </View>
      );
    }

    const iconBgColor = 'bg-transparent';
    const iconBorderColor = 'border-gray-300';

    return (
      <View
        className={`h-20 w-20 rounded-full border-2 ${iconBorderColor} ${iconBgColor} items-center justify-center`}>
        {type === 'money_added' && <Plus size={32} color="#666" />}
        {type === 'money_sent' && <ArrowUp size={32} color="#000" />}
        {type === 'money_received' && <ArrowDown size={32} color="#000" />}
      </View>
    );
  };

  return (
    <View className="bg-[#f5f5f0]">
      {/* Navigation Bar */}
      <View className="flex-row items-center justify-between px-4 pb-4 pt-2">
        <TouchableOpacity
          onPress={onBack}
          className="h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-white">
          <ArrowArcLeft size={24} color="#000" />
        </TouchableOpacity>

        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            onPress={onHelp}
            className="h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-white">
            <HelpCircle size={24} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onMore}
            className="h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-white">
            <MoreHorizontalIcon size={24} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Icon and Amount */}
      <View className="items-center pb-6">
        {renderIcon()}

        {!isCardPayment && !isCardChecked && (
          <Text className="mt-4 text-base text-gray-500">{getStatusLabel()}</Text>
        )}

        {isCardChecked && <Text className="mt-4 text-base text-gray-500">{getStatusLabel()}</Text>}

        <Text
          className={`mt-1 font-parafina text-3xl font-bold ${isPositiveAmount ? 'text-green-600' : 'text-black'}`}>
          {isPositiveAmount ? `+ ${amount} ${currency}` : `${amount} ${currency}`}
        </Text>

        {(recipientOrSenderName || merchantName) && (
          <Text className="mt-1 text-base text-gray-500">
            {recipientOrSenderName || merchantName}
          </Text>
        )}

        {!isCardPayment && !isCardChecked && type === 'money_added' && (
          <Text className="mt-0.5 text-sm text-gray-500">To {currency}</Text>
        )}

        {/* Category Tag */}
        {category && (
          <View className="mt-4 flex-row items-center rounded-full bg-gray-200 px-4 py-2">
            {categoryIcon}
            <Text className="ml-2 text-sm text-gray-600">{category}</Text>
          </View>
        )}

        {/* Money added tag */}
        {type === 'money_added' && !category && (
          <View className="mt-4 flex-row items-center rounded-full bg-gray-200 px-4 py-2">
            <Plus size={16} color="#666" />
            <Text className="ml-2 text-sm text-gray-600">Money added</Text>
          </View>
        )}

        {/* Money received tag */}
        {type === 'money_received' && !category && (
          <View className="mt-4 flex-row items-center rounded-full bg-gray-200 px-4 py-2">
            <Plus size={16} color="#666" />
            <Text className="ml-2 text-sm text-gray-600">Money added</Text>
          </View>
        )}
      </View>
    </View>
  );
};
