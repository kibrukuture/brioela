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

export const RedCard: FC<SlideItemProps> = ({ index }) => {
  const { width: screenWidth } = useWindowDimensions();

  const { activeIndex } = use(AnimatedIndexContext);

  const rContainerStyle = useAnimatedStyle(() => {
    /**
     * translateX: Red card moves right across multiple slides for extended animation.
     * Interpolation: [index, index+1, index+2] → [0, screenWidth, screenWidth*2]
     * Travels 2x screen width to create dramatic exit effect.
     */
    const translateX = interpolate(
      activeIndex.get(),
      [index, index + 1, index + 2],
      [0, screenWidth, screenWidth * 2],
      Extrapolation.CLAMP
    );
    /**
     * rotate: Dynamic rotation that changes direction (-2° → -4° → 3°).
     * Interpolation: [index, index+1, index+2] → [-2deg, -4deg, 3deg]
     * Creates a "spinning" effect as card moves across slides.
     */
    const rotate = interpolate(
      activeIndex.get(),
      [index, index + 1, index + 2],
      [-2, -4, 3],
      Extrapolation.CLAMP
    );
    /**
     * scale: Dramatic size change (1 → 0.98 → 1.2) as card moves.
     * Interpolation: [index, index+1, index+2] → [1, 0.98, 1.2]
     * Shrinks slightly then expands to 120% for emphasis.
     */
    const scale = interpolate(
      activeIndex.get(),
      [index, index + 1, index + 2],
      [1, 0.98, 1.2],
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
      className="absolute left-[28%] top-0 aspect-[1/1.4] w-[45%] items-center justify-center gap-10 rounded-3xl bg-red-500">
      <View className="size-20 rounded-3xl bg-amber-500" />
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
