import { View, Text, TouchableOpacity } from 'react-native';
import { Buildings, CaretRight, EnvelopeSimple, Smiley } from 'phosphor-react-native';
import { Image } from 'expo-image';

interface FindRecipientMethodsListProps {
  isMyself: boolean;
  onFindOnSchnl: () => void;
  onBankDetails: () => void;
  onEmail: () => void;
}

export function FindRecipientMethodsList({
  isMyself,
  onFindOnSchnl,
  onBankDetails,
  onEmail,
}: FindRecipientMethodsListProps) {
  return (
    <View className="mt-6 gap-3">
      {!isMyself && (
        <TouchableOpacity
          onPress={onFindOnSchnl}
          activeOpacity={0.8}
          className="flex-row items-center gap-4 rounded-2xl border border-neutral-100 bg-white p-5">
          <View className="h-12 w-12 items-center justify-center rounded-full bg-neutral-900">
            <Image
              className="invert"
              source={require('@/assets/media/slogo.png')}
              style={{ width: 24, height: 24 }}
              tintColor="white"
            />
          </View>
          <View className="flex-1">
            <Text className="text-base font-semibold text-neutral-900">Find on Schnl</Text>
            <Text className="mt-1 text-sm text-neutral-500">
              Search by SchnlTag, email, or phone.
            </Text>
            <View className="mt-3 flex-row items-center gap-1 self-start rounded-full bg-neutral-100 px-3 py-1">
              <Smiley size={14} weight="bold" color="#171717" />
              <Text className="text-xs font-medium text-neutral-700">Instant</Text>
            </View>
          </View>
          <CaretRight size={18} weight="bold" color="#A3A3A3" />
        </TouchableOpacity>
      )}

      <TouchableOpacity
        onPress={onBankDetails}
        activeOpacity={0.8}
        className="flex-row items-center gap-4 rounded-2xl border border-neutral-100 bg-white p-5">
        <View className="h-12 w-12 items-center justify-center rounded-full bg-neutral-50">
          <Buildings size={24} weight="bold" color="#171717" />
        </View>
        <View className="flex-1">
          <Text className="text-base font-semibold text-neutral-900">Bank details</Text>
          <Text className="mt-1 text-sm text-neutral-500">Enter name and IBAN</Text>
        </View>
        <CaretRight size={18} weight="bold" color="#A3A3A3" />
      </TouchableOpacity>

      {!isMyself && (
        <TouchableOpacity
          onPress={onEmail}
          activeOpacity={0.8}
          className="flex-row items-center gap-4 rounded-2xl border border-neutral-100 bg-white p-5">
          <View className="h-12 w-12 items-center justify-center rounded-full bg-neutral-50">
            <EnvelopeSimple size={24} weight="bold" color="#171717" />
          </View>
          <View className="flex-1">
            <Text className="text-base font-semibold text-neutral-900">Pay by email</Text>
            <Text className="mt-1 text-sm text-neutral-500">
              Email the recipient to request bank details.
            </Text>
          </View>
          <CaretRight size={18} weight="bold" color="#A3A3A3" />
        </TouchableOpacity>
      )}
    </View>
  );
}
