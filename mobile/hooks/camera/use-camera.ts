import { useState, useRef, useCallback, useEffect } from 'react';
import { Alert, Dimensions } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import * as Haptics from 'expo-haptics';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  SharedValue,
  useAnimatedProps,
} from 'react-native-reanimated';
import { Gesture } from 'react-native-gesture-handler';
import { CapturedImage } from '../../components/camera/types';
import { now } from '@/lib/date-time-utils';

const { height: screenHeight } = Dimensions.get('window');

export default function useCamera(options?: { initialImages?: CapturedImage[] }) {
  // --- STATE & REFS ---
  // From use-image-processor
  const [capturedImages, setCapturedImages] = useState<CapturedImage[]>(
    options?.initialImages || []
  );
  // From use-camera-manager
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const cameraRef = useRef<CameraView>(null);
  const captureInProgress = useRef<boolean>(false);
  const captureQueue = useRef<(() => void)[]>([]);
  // From use-camera-animations
  const zoom = useSharedValue(0);
  const savedZoom = useSharedValue(0);
  const bottomSectionHeight: SharedValue<number> = useSharedValue(120);
  const previewOpacity: SharedValue<number> = useSharedValue(0);
  const sendButtonScale: SharedValue<number> = useSharedValue(0);

  // --- ANIMATIONS & GESTURES (from use-camera-animations) ---
  const animatedCameraProps = useAnimatedProps(() => ({ zoom: zoom.value }));
  const animatedBottomStyle = useAnimatedStyle(() => ({ height: bottomSectionHeight.value }));
  const animatedCameraStyle = useAnimatedStyle(() => ({
    height: screenHeight - bottomSectionHeight.value,
  }));
  const animatedPreviewStyle = useAnimatedStyle(() => ({
    opacity: previewOpacity.value,
    transform: [{ translateY: interpolate(previewOpacity.value, [0, 1], [20, 0]) }],
  }));
  const animatedSendButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sendButtonScale.value }],
  }));

  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      'worklet';
      savedZoom.value = zoom.value;
    })
    .onUpdate((event) => {
      'worklet';
      const newZoom = savedZoom.value + (event.scale - 1) * 0.3;
      zoom.value = Math.max(0, Math.min(newZoom, 1));
    })
    .onEnd(() => {
      'worklet';
      savedZoom.value = zoom.value;
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      'worklet';
      zoom.value = withSpring(0);
      savedZoom.value = 0;
    });

  const animateBottomSection = useCallback(
    (hasImages: boolean): void => {
      if (hasImages) {
        bottomSectionHeight.value = withSpring(240, { damping: 15, stiffness: 100 });
        previewOpacity.value = withTiming(1, { duration: 300 });
        sendButtonScale.value = withSpring(1, { damping: 12, stiffness: 150 });
      } else {
        previewOpacity.value = withTiming(0, { duration: 200 });
        sendButtonScale.value = withSpring(0, { damping: 15, stiffness: 100 });
        setTimeout(() => {
          bottomSectionHeight.value = withSpring(120, { damping: 15, stiffness: 100 });
        }, 150);
      }
    },
    [bottomSectionHeight, previewOpacity, sendButtonScale]
  );

  // --- CORE LOGIC (merged from all hooks) ---
  const checkCameraReady = useCallback(async (): Promise<boolean> => {
    /* ... (same code as before) ... */
    try {
      if (!cameraRef.current) return false;
      await cameraRef.current.getAvailablePictureSizesAsync?.();
      return true;
    } catch (error) {
      console.log('Camera not ready:', error);
      return false;
    }
  }, []);

  const performCapture = useCallback(async (): Promise<void> => {
    if (!cameraRef.current) throw new Error('Camera reference not available');
    const photo = await cameraRef.current.takePictureAsync({
      quality: 0.8,
      base64: false,
      skipProcessing: false,
    });
    if (!photo || !photo.uri) throw new Error('No photo returned from camera');
    const fileInfo = await FileSystem.getInfoAsync(photo.uri);
    if (!fileInfo.exists) throw new Error('Captured file does not exist');

    const newImage: CapturedImage = { id: now().getTime().toString(), uri: photo.uri };

    // MERGED LOGIC: Now directly updates state and calls animations
    const wasEmpty = capturedImages.length === 0;
    setCapturedImages((prev) => [...prev, newImage]);
    if (wasEmpty) {
      setTimeout(() => animateBottomSection(true), 50);
    }
  }, [capturedImages.length, animateBottomSection]);

  const processCaptureQueue = useCallback(async (): Promise<void> => {
    /* ... (same code as before) ... */
    if (captureInProgress.current || captureQueue.current.length === 0) {
      return;
    }
    captureInProgress.current = true;
    try {
      let retries = 0;
      const maxRetries = 10;
      while (retries < maxRetries) {
        const isReady = await checkCameraReady();
        if (isReady) break;
        await new Promise((resolve) => setTimeout(resolve, 100));
        retries++;
      }
      if (retries >= maxRetries) {
        throw new Error('Camera not ready after retries');
      }
      const nextCapture = captureQueue.current.shift();
      if (nextCapture) {
        await nextCapture();
      }
    } catch (error) {
      console.error('Error processing capture queue:', error);
      Alert.alert('Camera Error', 'Camera is not responding. Please try again.');
    } finally {
      captureInProgress.current = false;
      if (captureQueue.current.length > 0) {
        setTimeout(() => processCaptureQueue(), 50);
      }
    }
  }, [checkCameraReady]);

  const captureImage = useCallback((): void => {
    captureQueue.current.push(async () => {
      try {
        await performCapture();
      } catch (error) {
        console.error('Queued capture failed:', error);
        Alert.alert('Capture Failed', 'Failed to capture image. Please try again.');
      }
    });
    processCaptureQueue();
  }, [performCapture, processCaptureQueue]);

  const removeImage = useCallback(
    async (imageId: string): Promise<void> => {
      /* ... (same code as before) ... */
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
      const imageToDelete = capturedImages.find((img) => img.id === imageId);
      if (imageToDelete) {
        try {
          const fileInfo = await FileSystem.getInfoAsync(imageToDelete.uri);
          if (fileInfo.exists) {
            await FileSystem.deleteAsync(imageToDelete.uri, { idempotent: true });
          }
        } catch (error) {
          console.warn(`Failed to delete image ${imageToDelete.uri}:`, error);
        }
      }
      setCapturedImages((prev) => {
        const newImages = prev.filter((img) => img.id !== imageId);
        if (newImages.length === 0) {
          animateBottomSection(false);
        }
        return newImages;
      });
    },
    [capturedImages, animateBottomSection]
  );

  const clearImages = useCallback(async (): Promise<void> => {
    // 👇 THE FIX: Immediately clear all pending capture requests.
    captureQueue.current = [];

    if (capturedImages.length === 0) return;
    try {
      const deletePromises = capturedImages.map(async (image) => {
        try {
          const fileInfo = await FileSystem.getInfoAsync(image.uri);
          if (fileInfo.exists) {
            await FileSystem.deleteAsync(image.uri, { idempotent: true });
          }
        } catch (error) {
          console.warn(`Failed to delete image ${image.uri}:`, error);
        }
      });
      await Promise.allSettled(deletePromises);
      setCapturedImages([]);
    } catch (error) {
      console.error('Error during cleanup:', error);
      setCapturedImages([]);
    }
  }, [capturedImages]);

  const toggleCameraFacing = useCallback((): void => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  }, []);

  // 👇 --- NEW, INTERNALIZED CLEANUP LOGIC ---
  // We use the robust "ref pattern" inside the hook, hiding the complexity.
  const clearImagesRef = useRef(clearImages);
  useEffect(() => {
    // On every render, we update the ref to point to the latest `clearImages` function.
    // This has no performance cost.
    clearImagesRef.current = clearImages;
  });

  useEffect(() => {
    // This effect runs only ONCE when the hook is first used.
    // Its cleanup will run only ONCE when the component using the hook unmounts.
    return () => {
      // When the component unmounts, we call the function from the ref.
      // This guarantees we are calling the LATEST version of the function,
      // avoiding any "stale state" bugs and ensuring files are deleted correctly.
      console.log('useCamera hook is cleaning up after itself automatically.');
      clearImagesRef.current();
    };
  }, []); // The empty array ensures this is a mount/unmount effect.

  // ADD THIS ENTIRE BLOCK
  useEffect(() => {
    // If the hook initializes with existing images,
    // make sure the bottom preview section animates into view.
    if (capturedImages.length > 0) {
      animateBottomSection(true);
    }
    // The empty array [] ensures this effect only runs once on mount.
  }, []);

  // The comprehensive return object - The user has all the tools
  return {
    permission,
    capturedImages,
    facing,
    cameraRef,
    animatedCameraProps,
    animatedBottomStyle,
    animatedCameraStyle,
    animatedPreviewStyle,
    animatedSendButtonStyle,
    pinchGesture,
    doubleTapGesture,
    requestPermission,
    captureImage,
    removeImage,
    clearImages,
    toggleCameraFacing,
    animateBottomSection,
  };
}
