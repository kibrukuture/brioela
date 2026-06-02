import { create } from 'zustand';

interface FloatingActionStore {
  isVisible: boolean;
  show: () => void;
  hide: () => void;
}
export const useFloatingAction = create<FloatingActionStore>((set) => ({
  isVisible: false,
  show: () => set({ isVisible: true }),
  hide: () => set({ isVisible: false }),
}));
