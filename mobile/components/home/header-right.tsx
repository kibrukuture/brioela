import React from 'react';
import { View, Pressable } from 'react-native';
import { Eye, EyeSlash } from 'phosphor-react-native';
import { usePrivacyStore } from '@/stores/ui/use-privacy-store';

export default function HomeHeaderRight() {
  const { isDataVisible, toggleDataVisibility } = usePrivacyStore();

  return (
    <View className="flex-row items-center">
      <Pressable
        onPress={toggleDataVisibility}
        className="h-8 w-8 items-center justify-center rounded-full">
        {isDataVisible ? <EyeSlash size={20} color="#333" /> : <Eye size={20} color="#333" />}
      </Pressable>
    </View>
  );
}
