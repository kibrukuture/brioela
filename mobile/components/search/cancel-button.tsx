import React, { FC } from 'react';
import { Text, Pressable } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import {
  CANCEL_CONTAINER_WIDTH,
  SETTINGS_CONTAINER_WIDTH,
  useSearchHeaderStore,
} from '@/stores/ui/use-search-header-store';

// raycast-home-search-transition-animation 🔽

// Why: We animate Pressable container width/opacity directly; wrapping lets Reanimated
// update layout on the UI thread without React re-render cycles.
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const CancelButton: FC = () => {
  const { screenView, onGoToFavorites } = useSearchHeaderStore();

  // Why: Expand to CANCEL width and fade in only in commands view.
  // withTiming avoids spring bounce on text/button.
  const rContainerStyle = useAnimatedStyle(() => {
    if (!screenView) return { width: SETTINGS_CONTAINER_WIDTH, opacity: 0, pointerEvents: 'none' };
    return {
      width: withTiming(
        screenView.value === 'commands' ? CANCEL_CONTAINER_WIDTH : SETTINGS_CONTAINER_WIDTH
      ),
      opacity: screenView.value === 'commands' ? withTiming(1) : 0,
      pointerEvents: screenView.value === 'commands' ? 'auto' : 'none',
    };
  }, [screenView]);

  return (
    <AnimatedPressable
      onPress={onGoToFavorites}
      className="z-[999] items-center justify-center"
      style={rContainerStyle}>
      <Text className="font-medium text-neutral-400">Cancel</Text>
    </AnimatedPressable>
  );
};
