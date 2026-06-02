import React from 'react';
import { View, Text, Image } from 'react-native';
export default function Welcome() {
  return (
    <View className="flex-1 items-center justify-center px-6 py-10">
      <View className="mb-10 items-center justify-center">
        <Image
          source={require('@/assets/media/logo.png')}
          className=" h-20 w-20"
          resizeMode="contain"
        />
        <Text className="mb-4 text-4xl font-extralight text-[#1E2A3B]">Schnl</Text>
      </View>

      <Text className="text-center font-parafina text-6xl  text-[#1E2A3B]">One health record</Text>
      <Text className="mb-12 mt-4 text-center text-xl  text-[#1E2A3B]">
        Every test, every visit, right here. All your health records in one place.
      </Text>
    </View>
  );
}
