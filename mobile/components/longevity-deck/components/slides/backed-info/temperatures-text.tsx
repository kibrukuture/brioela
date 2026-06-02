import React, { FC, use } from 'react';
import { useWindowDimensions } from 'react-native';
import { SlideTextContainer } from '../../slide-text-container';
import { AnimatedIndexContext } from '../../../lib/animated-index-context';
import { Extrapolation, interpolate, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { BASE_SPRING_CONFIG } from '../../../lib/constants';
import { SlideItemProps } from '../../../lib/types';

// longevity-deck-onboarding-animation 🔽

export const TemperaturesText: FC<SlideItemProps> = ({ index }) => {
  const { width: screenWidth } = useWindowDimensions();

  const { activeIndex } = use(AnimatedIndexContext);

  const rContainerStyle = useAnimatedStyle(() => {
    /**
     * translateX: Text enters from right, centers, then exits left.
     * Interpolation: [index-1, index, index+1] → [screenWidth*0.5, 0, -screenWidth]
     * Starts 50% screen width to the right for smooth entry animation.
     */
    const translateX = interpolate(
      activeIndex.get(),
      [index - 1, index, index + 1],
      [screenWidth * 0.5, 0, -screenWidth],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ translateX: withSpring(translateX, BASE_SPRING_CONFIG) }],
    };
  });

  return (
    <SlideTextContainer
      style={rContainerStyle}
      className="absolute left-[42%] top-[25%] max-w-[200px] rounded-3xl"
      textClassName="text-lg text-center">
      Temperatures between 88°C and 98°C are most beneficial. 20+ minutes 5-6 x week
    </SlideTextContainer>
  );
};

// longevity-deck-onboarding-animation 🔼
