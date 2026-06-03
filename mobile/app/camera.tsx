import React, { useState, useCallback } from 'react';
import { useIsomorphicLayoutEffect } from 'usehooks-ts';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from 'expo-router';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import * as FileSystem from 'expo-file-system';
import useCameraManager from '@/features/camera/hooks/use-camera-manager';
import useCameraAnimations from '@/features/camera/hooks/use-camera-animations';
import {
  CameraView,
  CameraControls,
  CaptureButton,
  ImagePreviewList,
  CapturedImage } from '@/features/camera';
import { useCapturedPhotosStore } from '@/stores/hardware/use-captured-photos-store';
import ImageViewer from '@/features/camera/components/image-viewer';
import { usePostLabWork } from '@/network/lab-work/use-post-lab-work';
import { HealthRecordType } from '@brioela/shared/drizzle/schema/health-records.schema';
import * as Burnt from 'burnt';
import { optimizeImage } from '@/lib/files/optimize-image';

const PERMANENT_IMAGE_DIRECTORY = FileSystem.documentDirectory + 'lab-work-photos/';

export default function AddPhotosScreen() {
  const navigation = useNavigation();

  const { mutateAsync: postLabWork, isPending: isPosting } = usePostLabWork();

  const [sessionImages, setSessionImages] = useState<CapturedImage[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // --- HOOK COMPOSITION ---
  const animations = useCameraAnimations();
  const cameraManager = useCameraManager({
    onImageCaptured: (newImage) => {
      setSessionImages((current) => [...current, newImage]);
    } });

  // --- LIFECYCLE & INITIALIZATION ---
  useIsomorphicLayoutEffect(() => {
    // On mount, we initialize our session state from the global store.
    // We do not pass permanent URIs to any hook.
    const initializeSession = async () => {
      const dirInfo = await FileSystem.getInfoAsync(PERMANENT_IMAGE_DIRECTORY);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(PERMANENT_IMAGE_DIRECTORY, { intermediates: true });
      }
      const existingPhotos = useCapturedPhotosStore.getState().photos;
      setSessionImages(existingPhotos);
      setIsLoading(false);
    };
    initializeSession();
  }, []);

  // An effect to trigger animations based on our reliable session state.
  useIsomorphicLayoutEffect(() => {
    animations.animateBottomSection(sessionImages.length > 0);
  }, [sessionImages.length]);

  const onSend = useCallback(async () => {
    if (sessionImages.length === 0) {
      Alert.alert('No Images', 'Please capture at least one image before sending.');
      return;
    }

    try {
      // Optimize all images in parallel
      const optimizedImages = await Promise.all(sessionImages.map((img) => optimizeImage(img.uri)));

      const formData = new FormData();

      optimizedImages.forEach((img, idx) => {
        formData.append('files', {
          uri: img.uri,
          name: `image_${idx + 1}.jpg`,
          type: 'image/jpeg' } as unknown as Blob);
      });
      const recordType: (typeof HealthRecordType.enumValues)[number] = 'lab_work';
      formData.append('recordType', recordType);
      formData.append('sourceName', 'Camera');
      // formData.append('notes', 'Imported from device gallery');
      // formData.append('language', 'en')

      await postLabWork({ payload: formData });

      navigation.goBack();
      Burnt.toast({
        title: 'Sent',
        preset: 'done',
        haptic: 'success',
        duration: 3 });
    } catch (error) {
      Alert.alert(
        'Send Failed',
        error instanceof Error ? error.message : 'Failed to send images. Please try again.'
      );
    }
  }, [sessionImages]);

  const handleDeleteImage = useCallback(
    async (imageId: string) => {
      const imageToRemove = sessionImages.find((img) => img.id === imageId);
      if (!imageToRemove) return;

      try {
        const fileInfo = await FileSystem.getInfoAsync(imageToRemove.uri);
        if (fileInfo.exists) {
          await FileSystem.deleteAsync(imageToRemove.uri);
        }
      } catch (error) {
        console.error('Failed to delete file:', error);
      }
      setSessionImages((currentImages) => currentImages.filter((img) => img.id !== imageId));
    },
    [sessionImages]
  );

  const handleImagePress = useCallback((index: number) => {
    setSelectedImageIndex(index);
    setViewerVisible(true);
  }, []);

  const handleClose = () => navigation.goBack();

  // What is this for?
  // Disables gesture navigation while the viewer is visible.
  useIsomorphicLayoutEffect(() => {
    navigation.setOptions({ gestureEnabled: false });
  }, []);

  if (!cameraManager.permission?.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>
          Feymark needs access to your camera to capture syllabus documents.
        </Text>
        <Pressable onPress={cameraManager.requestPermission} style={styles.permissionButton}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </Pressable>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.flexBlack}>
        <ActivityIndicator color="white" />
      </View>
    );
  }

  return (
    <>
      <View style={styles.flexBlack}>
        <Animated.View style={animations.animatedCameraStyle}>
          <GestureDetector
            gesture={Gesture.Race(animations.pinchGesture, animations.doubleTapGesture)}>
            <View style={styles.cameraContainer}>
              <CameraView
                ref={cameraManager.cameraRef}
                style={StyleSheet.absoluteFill}
                animatedProps={animations.animatedCameraProps}
                facing={cameraManager.facing}
              />
              <CameraControls
                onClose={handleClose}
                onToggleCamera={cameraManager.toggleCameraFacing}
                isClosing={isPosting}
              />
            </View>
          </GestureDetector>
        </Animated.View>

        <Animated.View style={[animations.animatedBottomStyle, styles.bottomSheet]}>
          <ImagePreviewList
            style={animations.animatedPreviewStyle}
            images={sessionImages}
            onImagePress={handleImagePress}
            onRemoveImage={handleDeleteImage}
          />
          <View style={styles.controlsRow}>
            <View style={styles.placeholder} />
            <CaptureButton onPress={cameraManager.captureImage} />
            <View style={styles.doneButtonContainer}>
              <Pressable
                disabled={isPosting}
                onPress={onSend}
                style={({ pressed }) => [
                  styles.doneButtonBase,
                  isPosting && styles.doneButtonSaving,
                  pressed && !isPosting && styles.doneButtonPressed,
                ]}>
                {isPosting ? (
                  <ActivityIndicator />
                ) : (
                  <Text style={styles.doneButtonText}>Send</Text>
                )}
              </Pressable>
            </View>
          </View>
        </Animated.View>
      </View>

      <ImageViewer
        images={sessionImages}
        initialIndex={selectedImageIndex}
        visible={viewerVisible}
        onClose={() => setViewerVisible(false)}
        onDelete={handleDeleteImage}
      />
    </>
  );
}

const styles = StyleSheet.create({
  flexBlack: { flex: 1, backgroundColor: 'black', justifyContent: 'center' },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'black',
    paddingHorizontal: 24 },
  permissionText: { color: 'white', fontSize: 16, textAlign: 'center', marginVertical: 16 },
  permissionButton: {
    backgroundColor: '#3461FD',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30 },
  permissionButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  cameraContainer: { flex: 1, overflow: 'hidden' },
  bottomSheet: { backgroundColor: 'black', borderTopWidth: 1, borderColor: '#333' },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 16 },
  placeholder: { width: 60 },
  doneButtonContainer: { width: 60, alignItems: 'center' },
  doneButtonBase: {
    backgroundColor: '#3461FD',
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#254eda' },
  doneButtonSaving: { backgroundColor: '#5a7bfd' },
  doneButtonPressed: { backgroundColor: '#254eda' },
  doneButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' } });
