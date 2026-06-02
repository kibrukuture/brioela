import { create } from 'zustand';
import type React from 'react';

type ProgressSheetStore = {
  visible: boolean;
  title: string;
  icon?: React.ReactNode;
  show: (title: string, icon?: React.ReactNode) => void;
  hide: () => void;
};

export const useProgressSheetStore = create<ProgressSheetStore>((set) => ({
  visible: false,
  title: '',
  icon: undefined,
  show: (title, icon) => set({ visible: true, title, icon }),
  hide: () => set({ visible: false, title: '', icon: undefined }),
}));
