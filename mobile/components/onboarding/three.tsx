import React from 'react';
import { View, Text } from 'react-native';

export default function OnboardingThree() {
  return (
    <View className="flex-1 items-center justify-center px-6 py-10">
      <View className="mb-6 flex items-center px-6 py-8">
        <Text className="text-center font-parafina text-6xl  text-[#1E2A3B]">Ask. Get It.</Text>
        <Text className="mb-8 mt-3 text-center text-xl  text-[#1E2A3B]">
          Search like you speak.
        </Text>

        <View className="mt-2 w-full items-start space-y-2">
          <Text className="text-base text-[#1E2A3B]">→ Show my cholesterol from June</Text>
          <Text className="text-base text-[#1E2A3B]">→ Type how you think</Text>
          <Text className="text-base text-[#1E2A3B]">→ Get what you meant</Text>
        </View>
      </View>
    </View>
  );
}
