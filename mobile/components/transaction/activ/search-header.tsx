import { View, TextInput, TouchableOpacity } from 'react-native';
import { MagnifyingGlass, X } from 'phosphor-react-native';

interface SearchHeaderProps {
  value: string;
  onChangeText: (text: string) => void;
  onClose: () => void;
}

export function SearchHeader({ value, onChangeText, onClose }: SearchHeaderProps) {
  return (
    <View className="flex-row items-center gap-3 px-4 py-3">
      <View className="flex-1 flex-row items-center rounded-full bg-gray-100 px-4 py-3">
        <MagnifyingGlass size={20} color="#9CA3AF" weight="regular" />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder="Search"
          placeholderTextColor="#9CA3AF"
          className="ml-2 flex-1 text-base text-gray-900"
          autoFocus
        />
      </View>
      <TouchableOpacity onPress={onClose}>
        <X size={24} color="#111827" weight="regular" />
      </TouchableOpacity>
    </View>
  );
}
