import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import type { BankingRecipientListItem } from '@brioela/shared/validators/banking-recipient.validator';
import { Avatar } from './avatar';

interface RecipientListItemProps {
  recipient: BankingRecipientListItem;
  onPress: (recipient: BankingRecipientListItem) => void;
}

export const RecipientListItem: React.FC<RecipientListItemProps> = ({ recipient, onPress }) => {
  return (
    <TouchableOpacity
      onPress={() => onPress(recipient)}
      className="flex-row items-center px-4 py-4">
      <Avatar name={recipient.accountHolderName} size="sm" />
      <View className="ml-3 flex-1">
        <Text className="text-base font-semibold text-gray-900">{recipient.accountHolderName}</Text>
        {recipient.bankName ? (
          <Text className="text-sm text-gray-500">{recipient.bankName}</Text>
        ) : null}
      </View>
      <ChevronRight size={20} color="#ccc" />
    </TouchableOpacity>
  );
};
