// The main hook - the engine of the component
export { default as useCamera } from '@/hooks/camera/use-camera';

// Re-exporting the UI Primitives
export { AnimatedCameraView as CameraView } from '@/components/camera/camera-view';
export { default as CameraControls } from '@/components/camera/camera-controls';
export { default as CaptureButton } from '@/components/camera/capture-button';
export { default as ImagePreviewList } from '@/components/camera/image-preview-list';
export { default as SendButton } from '@/components/camera/send-button';

// Re-exporting the shared types
export * from '@/components/camera/types';
