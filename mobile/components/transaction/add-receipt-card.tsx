import type React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { UploadIcon } from 'lucide-react-native';

interface AddReceiptCardProps {
  onPress?: () => void;
}

export const AddReceiptCard: React.FC<AddReceiptCardProps> = ({ onPress }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="mx-4 my-4 rounded-xl border border-dashed border-gray-300 p-4">
      <View className="flex-row items-center">
        <UploadIcon size={24} color="#1B4332" />
        <View className="ml-4">
          <Text className="text-base font-medium text-green-900 underline">Add receipt</Text>
          <Text className="mt-1 text-sm text-gray-500">PDF, JPEG or PNG less than 10MB</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};
