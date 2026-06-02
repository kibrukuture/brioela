/**
 * @file fileUploader.ts
 * @description A utility for preparing files for upload in a React Native application.
 */

import { Alert } from 'react-native';

/**
 * @interface FileUpload
 * @description Defines the universal structure for a file intended for upload.
 * This ensures that any file, regardless of its source (e.g., ImagePicker, DocumentPicker),
 * can be handled by the utility function.
 *
 * @property {string} uri - The local URI of the file on the device. This is essential for React Native to locate the file.
 * @property {string} name - The name of the file, including its extension (e.g., 'document.pdf', 'photo.jpg').
 * @property {string} [mimeType] - The MIME type of the file (e.g., 'image/jpeg', 'application/pdf').
 * This is crucial for the server to correctly interpret the file content.
 */
export interface FileUpload {
  uri: string;
  name: string;
  mimeType?: string;
}

/**
 * @function prepareFilesForUpload
 * @description A robust, universal utility to prepare files for a multipart/form-data upload.
 * It takes an array of file objects, validates them, and converts them into
 * a FormData object suitable for an API request.
 *
 * @param {FileUpload[]} files - An array of files to be prepared. Each object in the array
 * must conform to the `FileUpload` interface.
 * @param {string} formDataKey - The key that the backend API expects for the files array (e.g., 'documents', 'files').
 *
 * @returns {FormData | null} - A FormData object ready to be sent to the server,
 * or null if the input array is empty or an error occurs during preparation.
 */
export const prepareFilesForUpload = (
  files: FileUpload[],
  formDataKey: string = 'documents'
): FormData | null => {
  // 1. --- Input Validation ---
  // Ensure there are files to process. This prevents sending empty requests.
  if (!files || files.length === 0) {
    Alert.alert('No Files Selected', 'Please select at least one file to upload.');
    return null;
  }

  try {
    // 2. --- FormData Creation ---
    // Initialize a new FormData object. This is the standard format for sending
    // files and data in a single HTTP request.
    const formData = new FormData();

    // 3. --- Iterate and Append Files ---
    // Loop through each file object provided.
    files.forEach((file) => {
      // Structure the file data in the exact format that React Native's networking layer expects.
      const fileData = {
        uri: file.uri,
        name: file.name,
        // Default to a generic 'binary stream' MIME type if not provided.
        // This is a safe fallback, but a specific MIME type is always preferred.
        type: file.mimeType || 'application/octet-stream',
      };

      // Append the file to the FormData object.
      // The `formDataKey` must match what your backend endpoint expects.
      // Handle React Native's FormData typing
      formData.append(formDataKey, fileData as any);
    });

    // 4. --- Return Prepared Data ---
    // The FormData object is now ready to be used as the body of your POST/PUT request.
    return formData;
  } catch (error) {
    // 5. --- Robust Error Handling ---
    // If any part of the process fails, log the error and inform the user.
    console.error('Error preparing files for upload:', error);
    Alert.alert('Upload Error', 'There was a problem preparing your files. Please try again.');
    return null;
  }
};
