import React from 'react';
import { View, Text } from 'react-native';

export default function OnboardingTwo() {
  return (
    <View className="flex-1 items-center justify-center px-6 py-10">
      <View className="mb-6 flex items-center px-6 py-8">
        <Text className="text-center font-parafina text-6xl text-[#1E2A3B]">Just Snap It!</Text>
        <Text className="mb-8 mt-3 text-center text-xl  text-[#1E2A3B]">
          Lab work, prescriptions, doctor notes—all saved.
        </Text>

        <View className="mt-2 w-full items-start space-y-2">
          <Text className="text-base text-[#1E2A3B]">→ Save medical docs in seconds</Text>
          <Text className="text-base text-[#1E2A3B]">→ Records auto-organized</Text>
          <Text className="text-base text-[#1E2A3B]">→ Health trends you can track</Text>
          <Text className="text-base text-[#1E2A3B]">→ Everything in one place</Text>
          <Text className="text-base text-[#1E2A3B]">→ Find records when you need them</Text>
        </View>
      </View>
    </View>
  );
}
