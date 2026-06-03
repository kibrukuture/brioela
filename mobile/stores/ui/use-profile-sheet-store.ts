import { create } from 'zustand';

interface ProfileSheetStore {
  isVisible: boolean;
  setVisible: (visible: boolean) => void;
  dismissSheet: () => void;
}

export const useProfileSheet = create<ProfileSheetStore>((set) => ({
  isVisible: false,
  setVisible: (visible) => set({ isVisible: visible }),
  dismissSheet: () => set({ isVisible: false }),
}));
