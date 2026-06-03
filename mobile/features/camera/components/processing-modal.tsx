import React from 'react';
import { useIsomorphicLayoutEffect } from 'usehooks-ts';
import { Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useCameraProcessingStore } from '@/stores/hardware/use-camera-processing';

interface ProcessingModalProps {
  visible: boolean;
  onCancel: () => void;
}

export default function ProcessingModal({ visible, onCancel }: ProcessingModalProps) {
  const { abortRequest } = useCameraProcessingStore();

  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);

  useIsomorphicLayoutEffect(() => {
    if (visible) {
      opacity.value = withSpring(1, { damping: 20, stiffness: 300 });
      scale.value = withSpring(1, { damping: 20, stiffness: 300 });
    } else {
      opacity.value = withSpring(0, { damping: 20, stiffness: 300 });
      scale.value = withSpring(0.8, { damping: 20, stiffness: 300 });
    }
  }, [visible, opacity, scale]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value }));

  const modalStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }] }));

  const handleCancel = () => {
    abortRequest();
    onCancel();
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        overlayStyle,
        {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          alignItems: 'center' },
      ]}>
      <Animated.View
        style={[
          modalStyle,
          {
            backgroundColor: 'white',
            borderRadius: 12,
            padding: 24,
            marginHorizontal: 32,
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 8 },
        ]}>
        <ActivityIndicator size="large" color="#3B82F6" />

        <Text className="mt-4 text-center font-parafina text-lg text-[#1E2A3B]">
          Extracting your class schedule
        </Text>

        <Text className="mt-2 px-4 text-center text-sm text-gray-600">
          Please don't cancel, wait here while we extract your class information
        </Text>

        <TouchableOpacity
          onPress={handleCancel}
          className="mt-6 rounded-lg border border-gray-300 px-6 py-2">
          <Text className="font-semibold text-blue-600">Cancel</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}
