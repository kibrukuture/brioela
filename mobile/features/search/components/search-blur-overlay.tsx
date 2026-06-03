import { BlurView } from 'expo-blur';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import { useSearchHeaderStore } from '@/stores/ui/use-search-header-store';

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

export const SearchBlurOverlay = () => {
  const { blurIntensity } = useSearchHeaderStore();

  const backdropAnimatedProps = useAnimatedProps(() => {
    if (!blurIntensity) return { intensity: 0 };
    return {
      intensity: blurIntensity.value,
    };
  }, [blurIntensity]);

  return (
    <AnimatedBlurView
      tint="light"
      style={[StyleSheet.absoluteFill, styles.container]}
      animatedProps={backdropAnimatedProps}
      experimentalBlurMethod="dimezisBlurView"
    />
  );
};

const styles = StyleSheet.create({
  container: {
    pointerEvents: 'none',
  },
});
