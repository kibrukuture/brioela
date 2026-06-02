import type React from 'react';
import { View, Text } from 'react-native';
import type { TransactionCategory } from './types';
import { FilePdf, ForkKnife } from 'phosphor-react-native';
import { Grid } from 'lucide-react-native';

interface CategoryTagProps {
  category: TransactionCategory;
}

export const CategoryTag: React.FC<CategoryTagProps> = ({ category }) => {
  const getCategoryIcon = () => {
    switch (category) {
      case 'Eating out':
        return <ForkKnife size={16} color="#666" />;
      case 'Bills':
        return <FilePdf size={16} color="#666" />;
      case 'General':
      default:
        return <Grid size={16} color="#666" />;
    }
  };

  return (
    <View className="flex-row items-center rounded-full bg-gray-200 px-4 py-2">
      {getCategoryIcon()}
      <Text className="ml-2 text-sm text-gray-600">{category}</Text>
    </View>
  );
};
