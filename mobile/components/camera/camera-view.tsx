import { CameraView } from 'expo-camera';
import Animated from 'react-native-reanimated';

/**
 * A wrapper around the Expo CameraView that can accept animated props.
 */
export const AnimatedCameraView = Animated.createAnimatedComponent(CameraView);
