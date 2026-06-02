import { View, Text, TouchableOpacity } from 'react-native';

interface AccountDetailRowProps {
  label: string;
  value: string;
  action?: {
    label: string;
    onPress: () => void;
  };
}

export const AccountDetailRow: React.FC<AccountDetailRowProps> = ({ label, value, action }) => {
  return (
    <View className="py-4">
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="mb-1 text-sm text-gray-500">{label}</Text>
          <Text className="text-base font-medium text-gray-900">{value}</Text>
        </View>
        {action && (
          <TouchableOpacity
            onPress={action.onPress}
            className="rounded-full bg-[#E8F5E0] px-4 py-2">
            <Text className="text-sm font-medium text-gray-800">{action.label}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};
