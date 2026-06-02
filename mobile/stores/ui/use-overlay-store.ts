import { create } from 'zustand';
import type { ReactNode } from 'react';

type OverlayState = {
  visible: boolean;
  content: ReactNode | null;
  show: (content: ReactNode) => void;
  hide: () => void;
};

export const useOverlayStore = create<OverlayState>((set) => ({
  visible: false,
  content: null,
  show: (content) => set({ visible: true, content }),
  hide: () => set({ visible: false, content: null }),
}));
