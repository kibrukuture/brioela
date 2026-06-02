import { View, Text, TouchableOpacity } from 'react-native';

export const FilterTabs: React.FC = () => {
  return (
    <View className="flex-row items-center gap-2">
      <TouchableOpacity onPress={() => {}} className="rounded-full bg-[#1A1A1A] px-4 py-2">
        <Text className="text-sm font-medium text-white">All</Text>
      </TouchableOpacity>
    </View>
  );
};
