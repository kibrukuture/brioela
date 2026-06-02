import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LOCAL_STORAGE_KEYS } from '@/constants';

interface PrivacyState {
  isDataVisible: boolean;
}

interface PrivacyActions {
  toggleDataVisibility: () => void;
  setDataVisible: (visible: boolean) => void;
}

type PrivacyStore = PrivacyState & PrivacyActions;

export const usePrivacyStore = create<PrivacyStore>()(
  persist(
    (set) => ({
      // Initial state
      isDataVisible: true,

      // Actions
      toggleDataVisibility: () => {
        set((state) => ({ isDataVisible: !state.isDataVisible }));
      },

      setDataVisible: (visible: boolean) => {
        set({ isDataVisible: visible });
      },
    }),
    {
      name: LOCAL_STORAGE_KEYS.PRIVACY_VISIBILITY,
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
