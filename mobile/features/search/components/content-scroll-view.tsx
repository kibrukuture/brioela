import React, { PropsWithChildren } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  FULL_DRAG_DISTANCE,
  TRIGGER_DRAG_DISTANCE,
  useSearchHeaderStore,
} from '@/stores/ui/use-search-header-store';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  runOnJS,
  useSharedValue,
} from 'react-native-reanimated';
import { useHeaderHeight } from '@/features/search/hooks/use-header-height';
import { useHapticOnScroll } from '@/features/search/hooks/use-haptic-on-scroll';
import { useScrollDirection } from '@/features/search/hooks/use-scroll-direction';

// raycast-home-search-transition-animation 🔽

export const ContentScrollView: React.FC<PropsWithChildren> = ({ children }) => {
  const insets = useSafeAreaInsets();
  const { grossHeight } = useHeaderHeight();

  const { screenView, offsetY, isListDragging, blurIntensity, onGoToCommands } =
    useSearchHeaderStore();

  // Fallback SharedValue for useHapticOnScroll when isListDragging is not yet initialized
  const fallbackIsListDragging = useSharedValue(false);

  // Why: Track scroll direction including negative pulls to coordinate haptics and thresholds.
  const {
    onScroll: scrollDirectionOnScroll,
    scrollDirection,
    offsetYAnchorOnChangeDirection,
  } = useScrollDirection('include-negative');

  // Why: Provide a single haptic feedback exactly when crossing trigger offset upward.
  const { singleHapticOnScroll } = useHapticOnScroll({
    isListDragging: isListDragging ?? fallbackIsListDragging,
    scrollDirection,
    offsetYAnchorOnChangeDirection,
    triggerOffset: TRIGGER_DRAG_DISTANCE,
  });

  // Why: Central scroll handler drives shared values used across components.
  // - offsetY: negative when pulling down
  // - blurIntensity: interpolates 0→100 up to FULL_DRAG_DISTANCE while in favorites
  // - onEndDrag: switches to commands when threshold exceeded
  const scrollHandler = useAnimatedScrollHandler({
    onBeginDrag: () => {
      if (isListDragging) isListDragging.value = true;
    },
    onScroll: (event) => {
      if (!offsetY || !screenView || !blurIntensity) return;
      const offsetYValue = event.contentOffset.y;

      offsetY.value = offsetYValue;

      if (screenView.value === 'favorites') {
        // Map pull distance to blur intensity; clamp to 0..100 to avoid spikes.
        blurIntensity.value = interpolate(
          offsetYValue,
          [0, FULL_DRAG_DISTANCE],
          [0, 100],
          Extrapolation.CLAMP
        );
      }

      scrollDirectionOnScroll(event);
      singleHapticOnScroll(event);
    },
    onEndDrag: (event) => {
      if (!isListDragging) return;
      isListDragging.value = false;
      const scrollY = event.contentOffset.y;
      // Switch to commands when pulled beyond trigger. Use runOnJS to keep UI thread responsive.
      if (scrollY < TRIGGER_DRAG_DISTANCE) {
        runOnJS(onGoToCommands)();
      }
    },
  });

  const rContainerStyle = useAnimatedStyle(() => {
    if (!screenView) return { pointerEvents: 'auto' };
    return {
      pointerEvents: screenView.value === 'commands' ? 'none' : 'auto',
    };
  }, [screenView]);

  return (
    <Animated.View className="flex-1" style={rContainerStyle}>
      <Animated.ScrollView
        className="px-5"
        style={{
          paddingBottom: insets.bottom + 8,
          paddingTop: grossHeight + 40,
        }}
        // Why: ~60fps scroll updates for smooth interpolation and haptic thresholding.
        scrollEventThrottle={16}
        onScroll={scrollHandler}>
        {children}
      </Animated.ScrollView>
    </Animated.View>
  );
};

// raycast-home-search-transition-animation 🔼
