import { create } from 'zustand';
import { CapturedImage } from '@/features/camera/components/types';

// 👇 1. State interface now includes all properties to manage the recorder's lifecycle.
export interface CapturedPhotosState {
  photos: CapturedImage[];
}

// 👇 2. Actions interface now includes setters for the new recorder state.
export interface CapturedPhotosActions {
  addPhotos: (photos: CapturedImage[]) => void;
  setPhotos: (photos: CapturedImage[]) => void;
  removePhoto: (photoId: string) => void;
}

const initialState: CapturedPhotosState = {
  photos: [],
};

export const useCapturedPhotosStore = create<CapturedPhotosState & CapturedPhotosActions>(
  (set) => ({
    ...initialState,

    setPhotos: (photos) => set({ photos }),
    removePhoto: (photoId) =>
      set((state) => ({
        photos: state.photos.filter((photo) => photo.id !== photoId),
      })),
    addPhotos: (newPhotos) =>
      set((state) => {
        const uniqueNewPhotos = newPhotos.filter(
          (p1) => !state.photos.some((p2) => p2.id === p1.id)
        );
        return { photos: [...state.photos, ...uniqueNewPhotos] };
      }),
  })
);
