import { create } from 'zustand';
import { CapturedImage } from '@/features/camera/components/types';

// 👇 1. State interface now includes all properties to manage the recorder's lifecycle.
export interface DraftMedicationLogState {
  photos: CapturedImage[];
}

// 👇 2. Actions interface now includes setters for the new recorder state.
export interface DraftMedicationLogActions {
  addPhotos: (photos: CapturedImage[]) => void;
  setPhotos: (photos: CapturedImage[]) => void;
  removePhoto: (photoId: string) => void;
}

const initialState: DraftMedicationLogState = {
  photos: [],
};

export const useDraftMedicationLogStore = create<
  DraftMedicationLogState & DraftMedicationLogActions
>((set, get) => ({
  ...initialState,

  setPhotos: (photos) => set({ photos }),
  removePhoto: (photoId) =>
    set((state) => ({
      photos: state.photos.filter((photo) => photo.id !== photoId),
    })),
  addPhotos: (newPhotos) =>
    set((state) => {
      const uniqueNewPhotos = newPhotos.filter((p1) => !state.photos.some((p2) => p2.id === p1.id));
      return { photos: [...state.photos, ...uniqueNewPhotos] };
    }),
}));
