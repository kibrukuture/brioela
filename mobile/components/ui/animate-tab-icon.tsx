import React, { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring, // Using spring for a slightly bouncier feel
} from 'react-native-reanimated';
import { LucideProps } from 'lucide-react-native';
interface AnimatedTabIconProps {
  isFocused: boolean;
  IconComponent: React.ComponentType<LucideProps>;
  color: string;
  size: number;
  tabName: string;
  style?: unknown;
}

const AnimatedTabIcon: React.FC<AnimatedTabIconProps> = ({
  isFocused,
  IconComponent,
  color,
  size,
  tabName,
  style,
}) => {
  // Use scale for the animation
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  useEffect(() => {
    if (isFocused) {
      // Scale up slightly when focused
      scale.value = withSpring(1.15, { damping: 15, stiffness: 400 }); // Bouncy pop
      // Or use timing for a simpler pop:
      // scale.value = withSequence(withTiming(1.1, { duration: 100 }), withTiming(1.0, { duration: 100 }));
    } else {
      // Return to normal scale when not focused
      scale.value = withSpring(1.0, { damping: 15, stiffness: 400 });
      // Or use timing:
      // scale.value = withTiming(1.0, { duration: 100 });
    }
  }, [isFocused, scale]);

  let fill: string = 'regular';
  if (tabName === 'add-health-document') fill = 'fill';

  return (
    <Animated.View style={animatedStyle}>
      <IconComponent
        // @ts-ignore
        weight={fill}
        color={color}
        size={size}
        style={{
          ...(tabName === 'add-health-document'
            ? {
                shadowColor: '#000',
                shadowOpacity: 0.1,
                shadowRadius: 6,
                justifyContent: 'center',
                alignItems: 'center',

                backgroundColor: '#E0F0FF', // light blue background to highlight
                borderRadius: 30,
                width: 64,
                height: 64,
                marginTop: -16, // to lift it above others
              }
            : {}),
        }}
      />
    </Animated.View>
  );
};

export default AnimatedTabIcon;
