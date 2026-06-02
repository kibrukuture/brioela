import { create } from 'zustand';

// Define your Zustand store
interface SheetState {
  isSheetVisible: boolean;
  setSheetVisible: (visible: boolean) => void;
}

const useSheetStore = create<SheetState>((set) => ({
  isSheetVisible: false,
  setSheetVisible: (visible) => set({ isSheetVisible: visible }),
}));

export default useSheetStore;
