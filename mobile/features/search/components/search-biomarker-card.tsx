import React from 'react';
import { View, Text, Pressable } from 'react-native';
import type { UserSearchResult } from '@brioela/shared/validators/user-search.validator';

type SearchBiomarkerCardProps = {
  result: UserSearchResult;
  onPress?: () => void;
};

/**
 * Search result card for biomarkers
 * Displays reported name, value, unit, and date
 */
export function SearchBiomarkerCard({ result, onPress }: SearchBiomarkerCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between gap-3 rounded-lg p-4">
      <View className="flex-1">
        <Text className="text-base font-medium text-black">{result.name}</Text>
        <Text className="mt-1 text-sm text-gray-500">@{result.schnlTag}</Text>
      </View>
    </Pressable>
  );
}
