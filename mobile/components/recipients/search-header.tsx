import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Search } from 'lucide-react-native';

interface SearchHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onCancel: () => void;
}

export const SearchHeader: React.FC<SearchHeaderProps> = ({
  searchQuery,
  onSearchChange,
  onCancel,
}) => {
  return (
    <View className="px-4 pb-4 pt-2">
      <Text className="mb-4 text-center text-base font-semibold text-gray-900">Recipients</Text>
      <View className="flex-row items-center gap-3">
        <View className="flex-1 flex-row items-center rounded-full border border-[#9FE870] bg-gray-100 px-4 py-3">
          <Search size={20} color="#666" />
          <TextInput
            value={searchQuery}
            onChangeText={onSearchChange}
            placeholder="Name, Wisetag, email, phone..."
            placeholderTextColor="#999"
            className="ml-2 flex-1 text-base text-gray-900"
            autoFocus
          />
        </View>
        <TouchableOpacity onPress={onCancel}>
          <Text className="text-base text-gray-600">Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
