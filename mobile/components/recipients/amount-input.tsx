import { View, TextInput, TouchableOpacity } from 'react-native';
import { Delete } from 'lucide-react-native';

interface AmountInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const AmountInput: React.FC<AmountInputProps> = ({
  value,
  onChange,
  placeholder = '0,00',
}) => {
  return (
    <View className="flex-row items-center">
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#ccc"
        keyboardType="decimal-pad"
        className="flex-1 text-right font-parafina text-5xl font-light text-gray-400"
        style={{ fontSize: 48 }}
      />
      <TouchableOpacity className="ml-2">
        <Delete size={24} color="#ccc" />
      </TouchableOpacity>
    </View>
  );
};
