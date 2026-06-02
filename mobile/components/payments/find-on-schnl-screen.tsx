import { View, Text, Pressable, TouchableOpacity } from 'react-native';
import { MagnifyingGlass } from 'phosphor-react-native';

interface FindOnSchnlScreenProps {
  onOpenSearchModal: () => void;
  onAddAnotherWay: () => void;
}

export function FindOnSchnlScreen({ onOpenSearchModal, onAddAnotherWay }: FindOnSchnlScreenProps) {
  return (
    <View>
      <View className="mt-4">
        <Text className="mb-2 font-parafina text-4xl font-semibold text-neutral-900">
          Find on Schnl
        </Text>
        <Text className="text-sm text-neutral-500">
          Search by SchnlTag, email, or phone number.
        </Text>
      </View>

      <Pressable
        onPress={onOpenSearchModal}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        className="mt-6 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4"
        style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
        <View className="flex-row items-center gap-3">
          <MagnifyingGlass size={18} weight="bold" color="#737373" />
          <Text className="flex-1 text-base text-neutral-400">SchnlTag, email, phone</Text>
        </View>
      </Pressable>

      <View className="mt-10 rounded-2xl border border-neutral-100 bg-white p-5">
        <Text className="text-base font-semibold text-neutral-900">Tips</Text>
        <Text className="mt-2 text-sm text-neutral-600">Tap the search bar to start.</Text>
        <Text className="mt-2 text-sm text-neutral-600">
          Use a full email or phone number with country code.
        </Text>
      </View>

      <TouchableOpacity
        onPress={onAddAnotherWay}
        activeOpacity={0.8}
        className="mt-6 items-center rounded-xl bg-neutral-900 px-5 py-4">
        <Text className="text-base font-semibold text-white">Add another way</Text>
      </TouchableOpacity>
    </View>
  );
}
