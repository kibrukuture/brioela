import React from 'react';
import { View, Text, Pressable } from 'react-native';
import type { UserSearchResult } from '@schnl/shared/validators/user-search.validator';

type SearchObservationCardProps = {
  result: UserSearchResult;
  onPress?: () => void;
};

/**
 * Search result card for observations
 * Displays observation type, value, unit, notes, and observed date
 * Only shows available fields (no N/A)
 */
export function SearchObservationCard({ result, onPress }: SearchObservationCardProps) {
  return (
    <Pressable onPress={onPress} className="rounded-lg p-4">
      <View className="flex-1">
        <Text className="text-base font-medium text-black">{result.name}</Text>
        <Text className="mt-1 text-sm text-gray-500">@{result.schnlTag}</Text>
      </View>
    </Pressable>
  );
}
