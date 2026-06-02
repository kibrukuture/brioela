import React from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleProp, ViewStyle } from 'react-native';
import Animated, { AnimatedStyle } from 'react-native-reanimated';

interface SendButtonProps {
  style: StyleProp<AnimatedStyle<StyleProp<ViewStyle>>>; // For the animated scale transform
  imageCount: number;
  isSending: boolean;
  onPress: () => void;
}

export default function SendButton({ style, imageCount, isSending, onPress }: SendButtonProps) {
  return (
    <Animated.View style={style}>
      {imageCount > 0 ? (
        <Pressable
          // 1. Disable the button while isSending is true to prevent multiple taps.
          disabled={isSending}
          onPress={onPress}
          // 2. Conditionally change the background color for a visual cue.
          className={`rounded-full px-4 py-2 shadow-sm ${
            isSending ? 'bg-blue-400' : 'bg-blue-500 active:bg-blue-600'
          }`}
          style={({ pressed }: { pressed: boolean }) => ({
            opacity: pressed ? 0.8 : 1,
          })}>
          {/* 3. Conditionally render the button's content based on isSending */}
          {isSending ? (
            // --- PENDING STATE ---
            <View className="flex-row items-center justify-center px-1">
              <ActivityIndicator size="small" color="white" className="mr-2" />
              <Text className="text-sm font-semibold text-white">Sending...</Text>
            </View>
          ) : (
            // --- DEFAULT STATE ---
            <View className="flex-row items-center">
              <Text className="mr-1 text-sm font-semibold text-white">Send</Text>
              <View className="rounded-full bg-white/20 px-2 py-0.5">
                <Text className="text-xs font-bold text-white">{imageCount}</Text>
              </View>
            </View>
          )}
        </Pressable>
      ) : (
        <View className="w-12" />
      )}
    </Animated.View>
  );
}
