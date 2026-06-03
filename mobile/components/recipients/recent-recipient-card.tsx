import { Text, TouchableOpacity } from 'react-native';
import type { BankingRecipientListItem } from '@brioela/shared/validators/banking-recipient.validator';
import { Avatar } from './avatar';

interface RecentRecipientCardProps {
  recipient: BankingRecipientListItem;
  onPress: (recipient: BankingRecipientListItem) => void;
}

export const RecentRecipientCard: React.FC<RecentRecipientCardProps> = ({ recipient, onPress }) => {
  const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <TouchableOpacity onPress={() => onPress(recipient)} className="w-28 items-center">
      <Avatar name={recipient.accountHolderName} size="md" />
      <Text className="mt-2 text-center text-sm font-semibold text-gray-900">
        {recipient.accountHolderName}
      </Text>
      {recipient.bankName ? (
        <Text className="text-center text-xs text-gray-500" numberOfLines={1}>
          {truncateText(recipient.bankName, 14)}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
};
