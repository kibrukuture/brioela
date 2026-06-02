import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LOCAL_STORAGE_KEYS } from '@/constants';

interface PushToggleStore {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

export const usePushToggleStore = create(
  persist<PushToggleStore>(
    (set) => ({
      enabled: false,
      setEnabled: (enabled) => set({ enabled }),
    }),
    {
      name: LOCAL_STORAGE_KEYS.PUSH_TOGGLE_ENABLED_KEY,
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
