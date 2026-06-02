import React, { FC, use } from 'react';
import { useWindowDimensions, View, StyleSheet } from 'react-native';
import { AnimatedIndexContext } from '../../../lib/animated-index-context';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  withSpring,
} from 'react-native-reanimated';
import { BASE_SPRING_CONFIG } from '../../../lib/constants';
import { SlideItemProps } from '../../../lib/types';

// longevity-deck-onboarding-animation 🔽

export const BlueCard: FC<SlideItemProps> = ({ index }) => {
  const { width: screenWidth } = useWindowDimensions();

  const { activeIndex } = use(AnimatedIndexContext);

  const rContainerStyle = useAnimatedStyle(() => {
    /**
     * translateX: Slides card left (off-screen) when scrolling to next slide.
     * Interpolation: [index, index+1] → [0, -screenWidth]
     */
    const translateX = interpolate(
      activeIndex.get(),
      [index, index + 1],
      [0, -screenWidth],
      Extrapolation.CLAMP
    );
    /**
     * rotate: Straightens card from -6° tilt to 0° as slide becomes active.
     * Interpolation: [index, index+0.5] → [-6deg, 0deg]
     * Negative rotation creates counter-clockwise tilt effect.
     */
    const rotate = interpolate(
      activeIndex.get(),
      [index, index + 0.5],
      [-6, 0],
      Extrapolation.CLAMP
    );
    /**
     * scale: Slightly shrinks card (1 → 0.98) as slide becomes active.
     * Interpolation: [index, index+0.5] → [1, 0.98]
     */
    const scale = interpolate(
      activeIndex.get(),
      [index, index + 0.5],
      [1, 0.98],
      Extrapolation.CLAMP
    );

    return {
      transform: [
        { translateX: withSpring(translateX, BASE_SPRING_CONFIG) },
        { rotate: withSpring(`${rotate}deg`, BASE_SPRING_CONFIG) },
        { scale: withSpring(scale, BASE_SPRING_CONFIG) },
      ],
    };
  });

  return (
    <Animated.View
      style={[rContainerStyle, styles.borderCurve]}
      className="absolute left-0 top-[25%] aspect-[1/1.2] w-[42%] items-center justify-center gap-10 rounded-3xl bg-blue-500">
      <View className="size-20 rounded-full bg-stone-200" />
      <View className="h-5 w-20 rounded-full bg-neutral-200/25" />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  borderCurve: {
    borderCurve: 'continuous',
  },
});

// longevity-deck-onboarding-animation 🔼
