import React from 'react';
import { View, ScrollView, TouchableOpacity, Image, StyleProp, ViewStyle } from 'react-native';
import Animated, { AnimatedStyle } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { CapturedImage } from './types';

interface ImagePreviewListProps {
  style: StyleProp<AnimatedStyle<StyleProp<ViewStyle>>>; // For the animated opacity and transform
  images: CapturedImage[];
  onImagePress: (index: number) => void;
  onRemoveImage: (id: string) => void;
}

export default function ImagePreviewList({
  style,
  images,
  onImagePress,
  onRemoveImage,
}: ImagePreviewListProps) {
  return (
    <Animated.View style={style} className="mt-2 flex-1 px-4 pt-4">
      {images.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="flex-1"
          contentContainerStyle={{
            paddingRight: 16,
            paddingTop: 8,
            paddingBottom: 8,
          }}>
          {images.map((image: CapturedImage, index: number) => (
            <View key={image.id} className="relative mr-3">
              <TouchableOpacity onPress={() => onImagePress(index)} className="relative">
                <Image
                  source={{ uri: image.uri }}
                  className="h-20 w-20 rounded-xl bg-gray-200"
                  resizeMode="cover"
                />
                <View className="absolute inset-0 rounded-xl bg-black/5" />
              </TouchableOpacity>

              {/* Remove Button */}
              <TouchableOpacity
                onPress={() => onRemoveImage(image.id)}
                className="absolute right-1 top-1 h-6 w-6 items-center justify-center rounded-full bg-red-500 shadow-sm"
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.2,
                  shadowRadius: 2,
                  elevation: 3,
                }}>
                <Ionicons name="close" size={14} color="white" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
    </Animated.View>
  );
}
