import React from 'react';
import { View, TouchableOpacity } from 'react-native';

interface CaptureButtonProps {
  onPress: () => void;
  disabled?: boolean;
}

export default function CaptureButton({ onPress, disabled }: CaptureButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      className="h-16 w-16 items-center justify-center rounded-full border-4 border-gray-300 bg-white shadow-lg"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
      }}>
      <View className="h-12 w-12 rounded-full border-2 border-gray-400 bg-white" />
    </TouchableOpacity>
  );
}
