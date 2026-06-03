import { useCallback } from 'react';
import { Dimensions } from 'react-native';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  SharedValue,
  useAnimatedProps,
} from 'react-native-reanimated';
import { Gesture } from 'react-native-gesture-handler';

const { height: screenHeight } = Dimensions.get('window');

export default function useCameraAnimations() {
  // --- Animation & Gesture Values ---

  // For camera zoom
  const zoom = useSharedValue(0);
  const savedZoom = useSharedValue(0);

  // For bottom section reveal
  const bottomSectionHeight: SharedValue<number> = useSharedValue(120);
  const previewOpacity: SharedValue<number> = useSharedValue(0);
  const sendButtonScale: SharedValue<number> = useSharedValue(0);

  // --- Animated Props & Styles ---

  // Camera zoom on UI thread
  const animatedCameraProps = useAnimatedProps(() => ({
    zoom: zoom.value,
  }));

  const animatedBottomStyle = useAnimatedStyle(() => ({
    height: bottomSectionHeight.value,
  }));

  const animatedCameraStyle = useAnimatedStyle(() => ({
    height: screenHeight - bottomSectionHeight.value,
  }));

  const animatedPreviewStyle = useAnimatedStyle(() => ({
    opacity: previewOpacity.value,
    transform: [
      {
        translateY: interpolate(previewOpacity.value, [0, 1], [20, 0]),
      },
    ],
  }));

  const animatedSendButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sendButtonScale.value }],
  }));

  // --- Gestures ---

  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      'worklet';
      savedZoom.value = zoom.value;
    })
    .onUpdate((event) => {
      'worklet';
      const newZoom = savedZoom.value + (event.scale - 1) * 0.3;
      zoom.value = Math.max(0, Math.min(newZoom, 1));
    })
    .onEnd(() => {
      'worklet';
      savedZoom.value = zoom.value;
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      'worklet';
      zoom.value = withSpring(0);
      savedZoom.value = 0;
    });

  // --- Animation Trigger Function ---

  const animateBottomSection = useCallback(
    (hasImages: boolean): void => {
      if (hasImages) {
        bottomSectionHeight.value = withSpring(240, {
          damping: 15,
          stiffness: 100,
        });
        previewOpacity.value = withTiming(1, { duration: 300 });
        sendButtonScale.value = withSpring(1, {
          damping: 12,
          stiffness: 150,
        });
      } else {
        previewOpacity.value = withTiming(0, { duration: 200 });
        sendButtonScale.value = withSpring(0, {
          damping: 15,
          stiffness: 100,
        });
        setTimeout(() => {
          bottomSectionHeight.value = withSpring(120, {
            damping: 15,
            stiffness: 100,
          });
        }, 150);
      }
    },
    [bottomSectionHeight, previewOpacity, sendButtonScale]
  );

  return {
    // Styles and Props to apply to components
    animatedBottomStyle,
    animatedCameraStyle,
    animatedPreviewStyle,
    animatedSendButtonStyle,
    animatedCameraProps,
    // Gestures to apply to the GestureDetector
    pinchGesture,
    doubleTapGesture,
    // Function to trigger animations from the main component
    animateBottomSection,
  };
}
