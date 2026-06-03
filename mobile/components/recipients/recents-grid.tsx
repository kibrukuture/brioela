import { View, Text, ScrollView } from 'react-native';
import type { BankingRecipientListItem } from '@brioela/shared/validators/banking-recipient.validator';
import { RecentRecipientCard } from './recent-recipient-card';

interface RecentsGridProps {
  recipients: BankingRecipientListItem[];
  onRecipientPress: (recipient: BankingRecipientListItem) => void;
}

export const RecentsGrid: React.FC<RecentsGridProps> = ({ recipients, onRecipientPress }) => {
  const firstRow = recipients.slice(0, 3);
  const secondRow = recipients.slice(3, 6);

  return (
    <View className="mt-4">
      <Text className="mb-3 px-4 text-sm font-medium text-gray-700">Recents</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="px-4">
        <View>
          <View className="mb-4 flex-row gap-4">
            {firstRow.map((recipient) => (
              <RecentRecipientCard
                key={recipient.id}
                recipient={recipient}
                onPress={onRecipientPress}
              />
            ))}
          </View>
          {secondRow.length > 0 && (
            <View className="flex-row gap-4">
              {secondRow.map((recipient) => (
                <RecentRecipientCard
                  key={recipient.id}
                  recipient={recipient}
                  onPress={onRecipientPress}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};
