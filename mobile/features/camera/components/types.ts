export interface CapturedImage {
  id: string;
  uri: string;
}

export interface CameraCaptureProps {
  /**
   * Function to be called when the user presses the close button or after a successful upload.
   */
  onClose: () => void;
  /**
   * Function to be called after the images have been successfully uploaded.
   */
  onUploadComplete: () => void;
}
