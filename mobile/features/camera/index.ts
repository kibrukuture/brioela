// The main hook - the engine of the component
export { default as useCamera } from '@/features/camera/hooks/use-camera';

// Re-exporting the UI Primitives
export { AnimatedCameraView as CameraView } from '@/features/camera/components/camera-view';
export { default as CameraControls } from '@/features/camera/components/camera-controls';
export { default as CaptureButton } from '@/features/camera/components/capture-button';
export { default as ImagePreviewList } from '@/features/camera/components/image-preview-list';
export { default as SendButton } from '@/features/camera/components/send-button';

// Re-exporting the shared types
export * from '@/features/camera/components/types';
