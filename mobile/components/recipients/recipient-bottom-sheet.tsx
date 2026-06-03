import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Sheet, useSheetRef, BottomSheetView } from '@/components/ui/sheet';
import { ArrowUp, User } from 'lucide-react-native';
import type { BankingRecipientListItem } from '@brioela/shared/validators/banking-recipient.validator';
import { Avatar } from '@/components/recipients/avatar';

interface RecipientBottomSheetProps {
  recipient: BankingRecipientListItem | null;
  isVisible: boolean;
  onSend: (recipient: BankingRecipientListItem) => void;
  onView: (recipient: BankingRecipientListItem) => void;
  onClose: () => void;
}

export const RecipientBottomSheet: React.FC<RecipientBottomSheetProps> = ({
  recipient,
  isVisible,
  onSend,
  onView,
  onClose,
}) => {
  const sheetRef = useSheetRef();

  React.useEffect(() => {
    if (isVisible && recipient) {
      sheetRef.current?.present();
    } else {
      sheetRef.current?.dismiss();
    }
  }, [isVisible, recipient]);

  if (!recipient) return null;

  return (
    <Sheet ref={sheetRef} snapPoints={['50%']} onDismiss={onClose} enablePanDownToClose>
      <BottomSheetView className="flex-1 px-6 pt-2">
        <View className="mt-4 items-center">
          <Avatar name={recipient.accountHolderName} size="lg" />
          <Text className="mt-4 font-parafina text-xl font-bold text-gray-900">
            {recipient.accountHolderName}
          </Text>
          <Text className="mt-1 text-base text-gray-500">{recipient.currency}</Text>
        </View>

        <View className="mt-8 flex-row justify-center gap-8">
          <TouchableOpacity onPress={() => onSend(recipient)} className="items-center">
            <View className="h-14 w-14 items-center justify-center rounded-full bg-[#9FE870]">
              <ArrowUp size={28} color="#1A1A1A" />
            </View>
            <Text className="mt-2 text-sm font-medium text-gray-900">Send</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => onView(recipient)} className="items-center">
            <View className="h-14 w-14 items-center justify-center rounded-full bg-gray-100">
              <User size={28} color="#1A1A1A" />
            </View>
            <Text className="mt-2 text-sm font-medium text-gray-900">View</Text>
          </TouchableOpacity>
        </View>
      </BottomSheetView>
    </Sheet>
  );
};
