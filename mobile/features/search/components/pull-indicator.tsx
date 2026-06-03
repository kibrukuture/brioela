import React from 'react';
import { useHeaderHeight } from '@/features/search/hooks/use-header-height';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { TRIGGER_DRAG_DISTANCE, useSearchHeaderStore } from '@/stores/ui/use-search-header-store';
import { View } from 'react-native';
import { ArrowDown } from 'phosphor-react-native';

export const PullIndicator = () => {
  const { grossHeight } = useHeaderHeight();

  const { offsetY } = useSearchHeaderStore();

  const rContainerStyle = useAnimatedStyle(() => {
    if (!offsetY) return {};
    return {
      height: interpolate(
        offsetY.value,
        [0, TRIGGER_DRAG_DISTANCE],
        [0, Math.abs(TRIGGER_DRAG_DISTANCE)]
      ),
      opacity: interpolate(offsetY.value, [0, TRIGGER_DRAG_DISTANCE], [0, 1], Extrapolation.CLAMP),
    };
  }, [offsetY]);

  return (
    <Animated.View
      className="pointer-events-none absolute left-0 right-0 items-center justify-center"
      style={[{ top: grossHeight }, rContainerStyle]}>
      <View>
        <ArrowDown size={16} weight="bold" color="#a3a3a3" />
      </View>
    </Animated.View>
  );
};
