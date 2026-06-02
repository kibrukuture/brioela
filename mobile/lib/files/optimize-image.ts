/**
 * @file imageOptimizer.ts
 * @description A robust utility for optimizing images in a React Native application
 * using the expo-image-manipulator library. This is crucial for
 * reducing file sizes before upload, which saves bandwidth, storage,
 * and significantly speeds up backend processing like AI OCR.
 */

// import * as ImageManipulator from 'expo-image-manipulator';
// import { ImageManipulator } from 'expo-image-manipulator';
import * as ImageManipulator from 'expo-image-manipulator';
import { Alert } from 'react-native';

/**
 * @interface OptimizationOptions
 * @description Defines the configurable options for image optimization.
 * This allows for flexible adjustments based on specific use cases.
 *
 * @property {number} maxWidth - The maximum width the image should be resized to, in pixels.
 * @property {number} compression - The compression quality, from 0 (lowest) to 1 (highest).
 */
interface OptimizationOptions {
  maxWidth?: number;
  compression?: number;
}

/**
 * @interface OptimizationResult
 * @description Defines the structure of the successful optimization result.
 *
 * @property {string} uri - The URI of the new, optimized image file.
 * @property {number} [width] - The width of the new image.
 * @property {number} [height] - The height of the new image.
 * @property {number} [size] - The file size of the new image in bytes.
 */
export interface OptimizationResult {
  uri: string;
  width?: number;
  height?: number;
  size?: number;
}

/**
 * @function optimizeImage
 * @description Takes the URI of a local image and returns a new, optimized version.
 * It resizes the image to a reasonable maximum width and applies JPEG compression.
 * Includes robust error handling and falls back gracefully.
 *
 * @param {string} originalImageUri - The URI of the source image to be optimized.
 * @param {OptimizationOptions} options - Optional configuration for max width and compression.
 *
 * @returns {Promise<OptimizationResult>} A promise that resolves with an object containing the URI
 * and dimensions of the new, optimized image. If optimization fails,
 * it resolves with the original image's URI to prevent a crash.
 */
export const optimizeImage = async (
  originalImageUri: string,
  options: OptimizationOptions = {}
): Promise<OptimizationResult> => {
  try {
    // 1. --- Define Optimization Parameters ---
    // Use provided options or fall back to sensible defaults.
    // - A `maxWidth` of 1280px is ample for high-quality OCR without being excessively large.
    // - A `compression` level of 0.5 provides a great balance between file size and visual quality.
    const resizeOptions = { width: options.maxWidth ?? 1280 };
    const saveOptions = {
      compress: options.compression ?? 0.5,
      format: ImageManipulator.SaveFormat.JPEG,
    };

    // 2. --- Perform Image Manipulation ---
    // `manipulateAsync` creates a new, cached version of the image with the specified transformations.
    const manipulatedImage = await ImageManipulator.manipulateAsync(
      originalImageUri,
      [{ resize: resizeOptions }],
      saveOptions
    );

    // 3. --- Return the Result ---
    // Return the result conforming to the `OptimizationResult` interface.
    return {
      uri: manipulatedImage.uri,
      width: manipulatedImage.width,
      height: manipulatedImage.height,
      // Note: `expo-image-manipulator` doesn't directly return the new file size.
      // The file size would need to be fetched separately with FileSystem.getInfoAsync if required.
    };
  } catch (error) {
    // 4. --- Robust Error Handling ---
    // If any part of the optimization process fails, log the error and inform the user.
    console.error('[Optimizer] Failed to optimize image:', error);
    Alert.alert(
      'Image Processing Error',
      'There was a problem preparing your image. The original photo will be used instead.'
    );

    // CRITICAL FALLBACK: Return the original image URI.
    // This ensures that even if optimization fails, the user's upload process can still continue
    // without crashing the application.
    return { uri: originalImageUri };
  }
};
