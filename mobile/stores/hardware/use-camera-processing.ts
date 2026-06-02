import { create } from 'zustand';

interface CameraProcessingState {
  isProcessing: boolean;
  abortController: AbortController | null;
  startProcessing: () => AbortController;
  stopProcessing: () => void;
  cancelProcessing: () => void;
  abortRequest: () => void;
}

export const useCameraProcessingStore = create<CameraProcessingState>((set, get) => ({
  isProcessing: false,
  abortController: null,
  startProcessing: () => {
    const controller = new AbortController();
    set({ isProcessing: true, abortController: controller });
    return controller;
  },
  stopProcessing: () => set({ isProcessing: false, abortController: null }),
  cancelProcessing: () => set({ isProcessing: false, abortController: null }),
  abortRequest: () => {
    const { abortController } = get();
    if (abortController) {
      abortController.abort();
    }
    set({ isProcessing: false, abortController: null });
  },
}));
