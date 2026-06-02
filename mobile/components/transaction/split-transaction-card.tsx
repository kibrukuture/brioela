import type React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import type { SplitTransactionUser } from './types';
import { Person } from 'phosphor-react-native';
import { ChevronRight } from 'lucide-react-native';

interface SplitTransactionCardProps {
  users?: SplitTransactionUser[];
  onPress?: () => void;
}

export const SplitTransactionCard: React.FC<SplitTransactionCardProps> = ({
  users = [],
  onPress,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="mx-4 my-4 rounded-xl border border-dashed border-gray-300 p-4">
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-base font-semibold text-black">Split this transaction</Text>
          <Text className="mt-1 text-sm text-gray-500">Request money from others</Text>
        </View>

        <View className="flex-row items-center">
          {/* User avatars */}
          {users.slice(0, 2).map((user, index) => (
            <View
              key={user.id}
              className="h-10 w-10 overflow-hidden rounded-full border-2 border-white bg-gray-200"
              style={{ marginLeft: index > 0 ? -12 : 0 }}>
              {user.avatarUrl ? (
                <Image source={{ uri: user.avatarUrl }} className="h-full w-full" />
              ) : (
                <View className="h-full w-full items-center justify-center bg-gray-300">
                  <Text className="text-sm text-gray-600">{user.name.charAt(0)}</Text>
                </View>
              )}
            </View>
          ))}

          {/* Add person button */}
          <View
            className="h-10 w-10 items-center justify-center rounded-full border border-gray-300 bg-white"
            style={{ marginLeft: users.length > 0 ? -12 : 0 }}>
            <Person size={20} color="#000" />
          </View>

          <ChevronRight size={20} color="#666" />
        </View>
      </View>
    </TouchableOpacity>
  );
};
