import React from 'react';
import { View, Text } from 'react-native';

export default function OnboardingSix() {
  return (
    <View className="flex-1 items-center justify-center px-6 py-10">
      <View className="mb-6 flex items-center px-6 py-8">
        <Text className="text-center font-parafina text-6xl  text-[#1E2A3B]">The Full Picture</Text>
        <Text className="mb-8 mt-3 text-center text-xl  text-[#1E2A3B]">
          Symptoms, meds, test results—how they all connect.
        </Text>

        <View className="mt-2 w-full items-start space-y-2">
          <Text className="text-base text-[#1E2A3B]">→ Understand your test numbers</Text>
          <Text className="text-base text-[#1E2A3B]">→ Link symptoms to your tests</Text>
          <Text className="text-base text-[#1E2A3B]">→ Whole picture, not just pieces</Text>
        </View>
      </View>
    </View>
  );
}
