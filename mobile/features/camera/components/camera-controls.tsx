import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CameraControlsProps {
  onClose: () => void;
  onToggleCamera: () => void;
  isClosing: boolean;
}

export default function CameraControls({
  onClose,
  onToggleCamera,
  isClosing,
}: CameraControlsProps) {
  return (
    <>
      {/* Camera Controls Overlay */}
      <View className="absolute right-4 top-12">
        <TouchableOpacity onPress={onToggleCamera} className="rounded-full bg-black/30 p-3">
          <Ionicons name="camera-reverse" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Close Button */}
      <View className="absolute left-4 top-12">
        <TouchableOpacity
          onPress={onClose}
          disabled={isClosing}
          className={`rounded-full bg-black/30 p-3 ${isClosing ? 'opacity-50' : ''}`}>
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </>
  );
}
