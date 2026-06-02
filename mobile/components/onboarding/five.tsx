import React from 'react';
import { View, Text } from 'react-native';

export default function OnboardingFive() {
  return (
    <View className="flex-1 items-center justify-center px-6 py-10">
      <View className="mb-6 flex items-center px-6 py-8">
        <Text className="text-center font-parafina text-6xl  text-[#1E2A3B]">Watch Changes</Text>
        <Text className="mb-8 mt-3 text-center text-xl  text-[#1E2A3B]">
          Track how your numbers move over months and years.
        </Text>

        <View className="mt-2 w-full items-start space-y-2">
          <Text className="text-base text-[#1E2A3B]">→ Spot patterns in lab work</Text>
          <Text className="text-base text-[#1E2A3B]">→ See improvement or concerns</Text>
          <Text className="text-base text-[#1E2A3B]">→ Share trends with doctors</Text>
        </View>
      </View>
    </View>
  );
}
