import { Platform, View, TouchableOpacity } from 'react-native';
import { X } from 'lucide-react-native';
export default function ModalHandle({ onClose }: { onClose: () => void }) {
  return Platform.OS === 'ios' ? (
    <View className="mt-2 px-4">
      <View className="mx-auto mb-6 h-1 w-12 self-center rounded-full bg-gray-300" />
    </View>
  ) : (
    <TouchableOpacity
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      className="mt-2 items-end px-4 py-2"
      onPress={onClose}>
      <View className="h-8 w-8 items-center justify-center rounded-full bg-gray-100">
        <X size={20} color="#6B7280" strokeWidth={2.5} />
      </View>
    </TouchableOpacity>
  );
}
