import type React from 'react';
import { View, Text } from 'react-native';

interface DetailRowProps {
  label: string;
  value: string;
  valueStyle?: 'normal' | 'bold' | 'large';
  showDashedBorder?: boolean;
}

const DetailRow: React.FC<DetailRowProps> = ({
  label,
  value,
  valueStyle = 'normal',
  showDashedBorder = false,
}) => {
  const getValueClassName = (): string => {
    switch (valueStyle) {
      case 'bold':
        return 'font-semibold text-base';
      case 'large':
        return 'font-parafina text-2xl font-bold';
      default:
        return 'text-base';
    }
  };

  return (
    <View
      className={showDashedBorder ? 'mb-4 border-b border-dashed border-gray-300 pb-4' : 'mb-3'}>
      <View className="flex-row items-center justify-between">
        <Text className="text-base text-gray-600">{label}</Text>
        <Text className={`text-black ${getValueClassName()}`}>{value}</Text>
      </View>
    </View>
  );
};

interface TransactionDetailsSectionProps {
  title: string;
  rows: {
    label: string;
    value: string;
    valueStyle?: 'normal' | 'bold' | 'large';
    showDashedBorder?: boolean;
  }[];
}

export const TransactionDetailsSection: React.FC<TransactionDetailsSectionProps> = ({
  title,
  rows,
}) => {
  return (
    <View className="px-4 py-4">
      <Text className="mb-4 text-xl font-bold text-black">{title}</Text>
      {rows.map((row, index) => (
        <DetailRow
          key={index}
          label={row.label}
          value={row.value}
          valueStyle={row.valueStyle}
          showDashedBorder={row.showDashedBorder}
        />
      ))}
    </View>
  );
};
