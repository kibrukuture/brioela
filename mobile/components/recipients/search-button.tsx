import { TouchableOpacity, Text } from 'react-native';
import { Search } from 'lucide-react-native';

interface SearchButtonProps {
  onPress: () => void;
}

export const SearchButton: React.FC<SearchButtonProps> = ({ onPress }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center gap-1.5 rounded-full bg-gray-100 px-4 py-2">
      <Search size={16} color="#666" />
      <Text className="text-sm text-gray-600">Search</Text>
    </TouchableOpacity>
  );
};
