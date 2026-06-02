import { useState, useRef, useCallback } from 'react';
import { Alert } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import { CapturedImage } from '../../components/camera/types';
import { now } from '@/lib/date-time-utils';

interface UseCameraManagerProps {
  onImageCaptured: (image: CapturedImage) => void;
}

export default function useCameraManager({ onImageCaptured }: UseCameraManagerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const cameraRef = useRef<CameraView>(null);

  // --- Queue State Management ---
  const captureInProgress = useRef<boolean>(false);
  const captureQueue = useRef<(() => void)[]>([]);

  // --- Core Camera & Queue Logic ---

  const checkCameraReady = useCallback(async (): Promise<boolean> => {
    try {
      if (!cameraRef.current) return false;
      await cameraRef.current.getAvailablePictureSizesAsync?.();
      return true;
    } catch (error) {
      console.log('Camera not ready:', error);
      return false;
    }
  }, []);

  // THE ACTUAL CAPTURE FUNCTION - MODIFIED
  // This now lives inside the hook and uses the callback.
  const performCapture = useCallback(async (): Promise<void> => {
    if (!cameraRef.current) {
      throw new Error('Camera reference not available');
    }
    console.log('Starting actual capture...');

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        skipProcessing: false,
      });

      if (!photo || !photo.uri) {
        throw new Error('No photo returned from camera');
      }

      const fileInfo = await FileSystem.getInfoAsync(photo.uri);
      if (!fileInfo.exists) {
        throw new Error('Captured file does not exist');
      }

      const newImage: CapturedImage = {
        id: now().getTime().toString(),
        uri: photo.uri,
      };

      // CRITICAL CHANGE: Instead of setting state directly,
      // we call the callback provided to the hook.
      onImageCaptured(newImage);

      console.log('Image passed to callback successfully');
    } catch (error) {
      console.error('Capture failed:', error);
      throw error; // Re-throw to be handled by queue processor
    }
  }, [onImageCaptured]);

  const processCaptureQueue = useCallback(async (): Promise<void> => {
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

  // PUBLIC CAPTURE FUNCTION - QUEUES THE CAPTURE
  const captureImage = useCallback((): void => {
    console.log('Capture requested, adding to queue...');
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

  const toggleCameraFacing = useCallback((): void => {
    setFacing((current: CameraType) => (current === 'back' ? 'front' : 'back'));
  }, []);

  return {
    cameraRef,
    permission,
    requestPermission,
    facing,
    toggleCameraFacing,
    captureImage,
  };
}
