import React, { useRef, useState, JSX, useCallback } from 'react';
import { View, Dimensions, TouchableOpacity, StatusBar, Text } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  cancelAnimation,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import PagerView, { PagerViewOnPageSelectedEvent } from 'react-native-pager-view';

interface CapturedImage {
  id: string;
  uri: string;
}

interface ImageViewerProps {
  images: CapturedImage[];
  initialIndex: number;
  visible: boolean;
  onClose: () => void;
  onDelete?: (imageId: string) => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ZoomableImageProps {
  uri: string;
  isZoomed: boolean;
  onZoomChange: (isZoomed: boolean) => void;
}

const ZoomableImage: React.FC<ZoomableImageProps> = ({ uri, isZoomed, onZoomChange }) => {
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedScale = useSharedValue(1);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // CRITICAL FIX #1: Memory leak cleanup - Evidence from official Reanimated docs
  // https://github.com/software-mansion/react-native-reanimated/discussions/2415
  React.useEffect(() => {
    return () => {
      cancelAnimation(scale);
      cancelAnimation(translateX);
      cancelAnimation(translateY);
      cancelAnimation(savedScale);
      cancelAnimation(savedTranslateX);
      cancelAnimation(savedTranslateY);
    };
  }, [scale, translateX, translateY, savedScale, savedTranslateX, savedTranslateY]);

  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      savedScale.value = scale.value;
    })
    .onUpdate((event) => {
      const newScale = savedScale.value * event.scale;
      scale.value = Math.max(0.5, Math.min(newScale, 5));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      const isCurrentlyZoomed = scale.value > 1.1;
      runOnJS(onZoomChange)(isCurrentlyZoomed);
    });

  // CRITICAL FIX #2: Pan boundaries to prevent image going off-screen
  const panGesture = Gesture.Pan()
    .onStart(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .onUpdate((event) => {
      // Calculate maximum pan boundaries based on current scale
      const imageWidth = screenWidth * scale.value;
      const imageHeight = screenHeight * 0.8 * scale.value;
      const maxX = Math.max(0, (imageWidth - screenWidth) / 2);
      const maxY = Math.max(0, (imageHeight - screenHeight * 0.8) / 2);

      // Clamp translation within boundaries
      const newX = savedTranslateX.value + event.translationX;
      const newY = savedTranslateY.value + event.translationY;

      translateX.value = Math.max(-maxX, Math.min(maxX, newX));
      translateY.value = Math.max(-maxY, Math.min(maxY, newY));
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .enabled(isZoomed);

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > 1) {
        // Reset to normal
        scale.value = withSpring(1);
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedScale.value = 1;
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
        runOnJS(onZoomChange)(false);
      } else {
        // Zoom in
        scale.value = withSpring(2);
        savedScale.value = 2;
        runOnJS(onZoomChange)(true);
      }
    });

  // ORIGINAL GESTURE COMPOSITION - CORRECT AS-IS
  // Using Race allows double-tap to compete with pinch/pan simultaneous combo
  // Evidence: https://github.com/software-mansion/react-native-gesture-handler/discussions/2844
  const composedGesture = Gesture.Race(
    doubleTapGesture,
    Gesture.Simultaneous(pinchGesture, panGesture)
  );

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

  return (
    <View className="flex-1 items-center justify-center bg-black">
      <GestureDetector gesture={composedGesture}>
        <Animated.View className="flex-1 items-center justify-center">
          <Animated.Image
            source={{ uri }}
            style={[
              {
                width: screenWidth,
                height: screenHeight * 0.8,
              },
              animatedStyle,
            ]}
            resizeMode="contain"
          />
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

export default function ImageViewer({
  images,
  initialIndex,
  visible,
  onClose,
  onDelete,
}: ImageViewerProps): JSX.Element | null {
  const [currentIndex, setCurrentIndex] = useState<number>(initialIndex);
  const [isImageZoomed, setIsImageZoomed] = useState<boolean>(false);
  const pagerRef = useRef<PagerView>(null);

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(screenHeight);

  // CRITICAL FIX #3: Cleanup animations on unmount
  React.useEffect(() => {
    return () => {
      cancelAnimation(opacity);
      cancelAnimation(translateY);
    };
  }, [opacity, translateY]);

  // CRITICAL FIX #4: Better timing for setPage using requestAnimationFrame
  // More reliable than arbitrary setTimeout(100)
  React.useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 300 });
      translateY.value = withSpring(0, {
        damping: 15,
        stiffness: 100,
      });
      setCurrentIndex(initialIndex);

      // Use requestAnimationFrame instead of setTimeout for better reliability
      requestAnimationFrame(() => {
        pagerRef.current?.setPage(initialIndex);
      });
    } else {
      opacity.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(screenHeight, { duration: 300 });
    }
  }, [visible, initialIndex, opacity, translateY]);

  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    };
  });

  const handleDelete = useCallback((): void => {
    if (onDelete && images[currentIndex]) {
      onDelete(images[currentIndex].id);
      if (images.length === 1) {
        onClose();
      }
    }
  }, [onDelete, images, currentIndex, onClose]);

  const onPageSelected = useCallback((e: PagerViewOnPageSelectedEvent): void => {
    setCurrentIndex(e.nativeEvent.position);
    setIsImageZoomed(false); // Reset zoom state when changing pages
  }, []);

  const handleZoomChange = useCallback((isZoomed: boolean): void => {
    setIsImageZoomed(isZoomed);
  }, []);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'black',
          zIndex: 1000,
        },
        animatedContainerStyle,
      ]}>
      <StatusBar hidden />

      {/* Top Controls - Always Visible */}
      <View className="absolute left-0 right-0 top-0 z-10 bg-black/50 px-4 pb-4 pt-12">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={onClose} className="rounded-full bg-black/30 p-3">
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>

          <Text className="text-lg font-semibold text-white">
            {currentIndex + 1}/{images.length}
          </Text>

          {onDelete && (
            <TouchableOpacity onPress={handleDelete} className="rounded-full bg-red-500/80 p-3">
              <Ionicons name="trash" size={24} color="white" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Image Pager - Correctly disables when zoomed */}
      {/* Evidence: scrollEnabled prop works correctly per react-native-pager-view docs */}
      <PagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        initialPage={initialIndex}
        onPageSelected={onPageSelected}
        scrollEnabled={!isImageZoomed}>
        {images.map((image: CapturedImage) => (
          <View key={image.id} style={{ flex: 1 }}>
            <ZoomableImage
              uri={image.uri}
              isZoomed={isImageZoomed}
              onZoomChange={handleZoomChange}
            />
          </View>
        ))}
      </PagerView>

      {/* Bottom Controls - Always Visible */}
      <View className="absolute bottom-0 left-0 right-0 z-10 bg-black/50 px-4 pb-8 pt-4">
        <View className="flex-row items-center justify-center">
          <View className="flex-row gap-2">
            {images.map((_: CapturedImage, index: number) => (
              <View
                key={index}
                className={`h-2 w-2 rounded-full ${
                  index === currentIndex ? 'bg-white' : 'bg-white/40'
                }`}
              />
            ))}
          </View>
        </View>
      </View>
    </Animated.View>
  );
}
